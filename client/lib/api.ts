// API configuration and helper functions

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Log API configuration on module load
console.log('🔧 API Configuration:', {
  API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  isProduction: process.env.NODE_ENV === 'production',
  isClient: typeof window !== 'undefined'
});

// Validate API URL format
if (API_BASE_URL && !API_BASE_URL.match(/^https?:\/\//)) {
  console.error('❌ Invalid API_BASE_URL format:', API_BASE_URL);
  console.log('✅ Expected format: http://localhost:8000 or https://your-api.com');
}

export interface HarvestLogData {
  crop_name: string;
  quantity: number;
  unit: string;
  harvest_date: string;
  location?: string;
  notes?: string;
}

export interface HarvestImage {
  id: string;
  harvest_log_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  upload_order: number;
  created_at: string;
  updated_at: string;
  public_url?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface HarvestLogResponse {
  id: string;
  crop_name: string;
  quantity: number;
  unit: string;
  harvest_date: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  images?: HarvestImage[];
}

export interface HarvestStats {
  total_harvests: number;
  this_month: number;
  this_week: number;
}

// Plant Journey Types
export type EventType = 'harvest' | 'bloom' | 'snapshot';
export type PlantStatus = 'active' | 'harvested' | 'deceased' | 'dormant';
export type PlantCategory = 'vegetable' | 'fruit' | 'flower' | 'herb' | 'tree' | 'shrub' | 'other';
export type BloomStage = 'bud' | 'opening' | 'full_bloom' | 'fading' | 'seed_set';

export interface PlantVariety {
  id: string;
  name: string;
  category: PlantCategory;
  description?: string;
  growing_season?: string;
  harvest_time_days?: number;
  typical_yield?: string;
  care_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface Plant {
  id: string;
  name: string;
  variety_id?: string;
  planted_date?: string;
  location?: string;
  status: PlantStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  variety?: PlantVariety;
  events?: PlantEvent[];
}

export interface PlantEvent {
  id: string;
  user_id?: string;
  plant_id?: string;
  event_type: EventType;
  event_date: string;
  description?: string;
  notes?: string;
  location?: string;
  
  // Harvest-specific fields
  produce?: string;
  quantity?: number;
  unit?: string;
  
  // Bloom-specific fields
  flower_type?: string;
  bloom_stage?: BloomStage;
  
  // Flexible metrics (primarily for snapshot events)
  metrics?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
  images?: EventImage[];
  plant?: Plant;
}

export interface EventImage {
  id: string;
  event_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  upload_order: number;
  public_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PlantEventCreateData {
  plant_id?: string;
  event_type: EventType;
  event_date: string;
  description?: string;
  notes?: string;
  location?: string;
  
  // Event-specific fields
  produce?: string;
  quantity?: number;
  unit?: string;
  flower_type?: string;
  bloom_stage?: BloomStage;
  metrics?: Record<string, any>;
}

export interface PlantCreateData {
  name: string;
  variety_id?: string;
  planted_date?: string;
  location?: string;
  status?: PlantStatus;
  notes?: string;
}

export interface PlantVarietyCreateData {
  name: string;
  category: PlantCategory;
  description?: string;
  growing_season?: string;
  harvest_time_days?: number;
  typical_yield?: string;
  care_instructions?: string;
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data?: HarvestImage;
}

export interface MultipleImageUploadResponse {
  success: boolean;
  message: string;
  data?: {
    uploaded_images: HarvestImage[];
    failed_uploads: Array<{filename: string; error: string}>;
    total_uploaded: number;
    total_failed: number;
  };
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new ApiError(response.status, errorData.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
  }
}

// Specialized function for file uploads
async function uploadRequest<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('🔄 Upload Request:', {
    endpoint,
    url,
    formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
      key,
      value: value instanceof File ? `File: ${value.name} (${value.size} bytes, ${value.type})` : value
    }))
  });

  const config: RequestInit = {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - let the browser set it with boundary for multipart/form-data
  };

  try {
    const response = await fetch(url, config);
    
    console.log('📡 Upload Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || 'Unknown error' };
      }
      
      throw new ApiError(response.status, errorData.detail || errorData.message || `HTTP ${response.status}`);
    }

    const responseData = await response.json();
    console.log('✅ Upload Success:', responseData);
    return responseData;
  } catch (error) {
    console.error('💥 Upload Exception:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
  }
}

// API functions
export const harvestLogsApi = {
  create: async (data: HarvestLogData): Promise<ApiResponse<HarvestLogResponse>> => {
    return apiRequest('/api/harvest-logs/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async (): Promise<ApiResponse<HarvestLogResponse[]>> => {
    return apiRequest('/api/harvest-logs/');
  },

  getById: async (id: string): Promise<ApiResponse<HarvestLogResponse>> => {
    return apiRequest(`/api/harvest-logs/${id}`);
  },

  update: async (id: string, data: Partial<HarvestLogData>): Promise<ApiResponse<HarvestLogResponse>> => {
    return apiRequest(`/api/harvest-logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<HarvestLogResponse>> => {
    return apiRequest(`/api/harvest-logs/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async (): Promise<ApiResponse<HarvestStats>> => {
    return apiRequest('/api/harvest-stats');
  },
};

// Image API functions
export const imagesApi = {
  upload: async (harvestLogId: string, file: File, uploadOrder: number = 0): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_order', uploadOrder.toString());
    
    return uploadRequest(`/api/images/upload/${harvestLogId}`, formData);
  },

  uploadMultiple: async (harvestLogId: string, files: File[]): Promise<MultipleImageUploadResponse> => {
    console.log('📤 Starting multiple image upload:', {
      harvestLogId,
      fileCount: files.length,
      files: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        lastModified: f.lastModified
      }))
    });

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
      console.log(`📎 Added file ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
    });
    
    return uploadRequest(`/api/images/upload-multiple/${harvestLogId}`, formData);
  },

  getHarvestImages: async (harvestLogId: string): Promise<ApiResponse<HarvestImage[]>> => {
    return apiRequest(`/api/images/harvest/${harvestLogId}`);
  },

  delete: async (imageId: string): Promise<ApiResponse<unknown>> => {
    return apiRequest(`/api/images/${imageId}`, {
      method: 'DELETE',
    });
  },
};

// Plant Journey API functions
export const plantsApi = {
  // Plant Varieties
  createVariety: async (data: PlantVarietyCreateData): Promise<ApiResponse<PlantVariety>> => {
    return apiRequest('/api/plants/varieties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getVarieties: async (category?: PlantCategory, search?: string): Promise<ApiResponse<PlantVariety[]>> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    
    const query = params.toString();
    return apiRequest(`/api/plants/varieties${query ? `?${query}` : ''}`);
  },

  getVariety: async (id: string): Promise<ApiResponse<PlantVariety>> => {
    return apiRequest(`/api/plants/varieties/${id}`);
  },

  // Plants
  createPlant: async (data: PlantCreateData): Promise<ApiResponse<Plant>> => {
    return apiRequest('/api/plants/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPlants: async (status?: PlantStatus, varietyId?: string, location?: string): Promise<ApiResponse<Plant[]>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (varietyId) params.append('variety_id', varietyId);
    if (location) params.append('location', location);
    
    const query = params.toString();
    return apiRequest(`/api/plants/${query ? `?${query}` : ''}`);
  },

  getPlant: async (id: string): Promise<ApiResponse<Plant>> => {
    return apiRequest(`/api/plants/${id}`);
  },

  updatePlant: async (id: string, data: Partial<PlantCreateData>): Promise<ApiResponse<Plant>> => {
    return apiRequest(`/api/plants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePlant: async (id: string): Promise<ApiResponse<Plant>> => {
    return apiRequest(`/api/plants/${id}`, {
      method: 'DELETE',
    });
  },

  getPlantEvents: async (
    plantId: string,
    eventType?: EventType,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<PlantEvent[]>> => {
    const params = new URLSearchParams();
    if (eventType) params.append('event_type', eventType);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    
    const query = params.toString();
    return apiRequest(`/api/plants/${plantId}/events${query ? `?${query}` : ''}`);
  },
};

// Plant Events API functions
export const eventsApi = {
  create: async (data: PlantEventCreateData): Promise<ApiResponse<PlantEvent>> => {
    return apiRequest('/api/events/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async (
    plantId?: string,
    eventType?: EventType,
    dateFrom?: string,
    dateTo?: string,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<PlantEvent[]>> => {
    const params = new URLSearchParams();
    if (plantId) params.append('plant_id', plantId);
    if (eventType) params.append('event_type', eventType);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const query = params.toString();
    return apiRequest(`/api/events/${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<ApiResponse<PlantEvent>> => {
    return apiRequest(`/api/events/${id}`);
  },

  update: async (id: string, data: Partial<PlantEventCreateData>): Promise<ApiResponse<PlantEvent>> => {
    return apiRequest(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<ApiResponse<PlantEvent>> => {
    return apiRequest(`/api/events/${id}`, {
      method: 'DELETE',
    });
  },

  // Upload images for events
  uploadImages: async (eventId: string, files: File[]): Promise<MultipleImageUploadResponse> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    
    return uploadRequest(`/api/images/upload-multiple/${eventId}`, formData);
  },
};

export { ApiError }; 