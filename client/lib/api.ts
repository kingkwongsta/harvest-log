// API configuration and helper functions

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Enhanced HTTPS enforcement in production
if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV) {
  if (API_BASE_URL.startsWith('http://')) {
    console.warn('⚠️ Initial HTTPS Enforcement: Converting HTTP to HTTPS for production')
    API_BASE_URL = API_BASE_URL.replace('http://', 'https://')
    console.log('✅ API_BASE_URL updated to HTTPS:', API_BASE_URL)
  }
  
  // Validate that we have a secure URL in production
  if (!API_BASE_URL.startsWith('https://')) {
    console.error('❌ CRITICAL: Production requires HTTPS API_BASE_URL')
    console.error('❌ Current API_BASE_URL:', API_BASE_URL)
    console.error('❌ Please ensure NEXT_PUBLIC_API_URL uses HTTPS protocol')
  }
}

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

// Additional production validation
if (process.env.NODE_ENV === 'production' && !API_BASE_URL.startsWith('https://')) {
  console.error('❌ Production builds must use HTTPS URLs');
  console.error('❌ Current API_BASE_URL:', API_BASE_URL);
  console.error('❌ Please set NEXT_PUBLIC_API_URL environment variable to use HTTPS');
}

export interface HarvestLogData {
  crop_name: string;
  quantity: number;
  unit: string;
  harvest_date: string;
  notes?: string;
  coordinates?: Coordinates;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temperature_min: number; // Temperature in Fahrenheit
  temperature_max: number; // Temperature in Fahrenheit  
  humidity: number;
  weather_code: number;
  wind_speed: number;
  precipitation: number;
}

export interface GeocodingResult {
  city: string;
  state?: string;
  country: string;
  coordinates: Coordinates;
  display_name: string;
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

export interface EventStats {
  total_events: number;
  this_month: number;
  this_week: number;
  harvest_events: number;
  bloom_events: number;
  snapshot_events: number;
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
  coordinates?: Coordinates;
  weather?: WeatherData;
  
  // Harvest-specific fields
  produce?: string;
  quantity?: number;
  
  // Bloom-specific fields
  plant_variety?: string;
  
  // Flexible metrics (primarily for snapshot events)
  metrics?: Record<string, unknown>;
  
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
  coordinates?: Coordinates;
  
  // Harvest-specific fields
  produce?: string;
  quantity?: number;
  
  // Bloom-specific fields
  plant_variety_id?: string;
  
  // Snapshot-specific fields (flexible metrics)
  metrics?: Record<string, unknown>;
}

export interface PlantCreateData {
  name: string;
  variety_id?: string;
  planted_date?: string;
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

export interface PlantVarietyUpdateData {
  name?: string;
  category?: PlantCategory;
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
  let url = `${API_BASE_URL}${endpoint}`;
  
  // Runtime HTTPS enforcement - force HTTPS in production
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV) {
    if (url.startsWith('http://')) {
      console.warn('⚠️ Runtime HTTPS Enforcement: Converting HTTP to HTTPS for production');
      url = url.replace('http://', 'https://');
      console.log('✅ URL converted to HTTPS:', url);
    }
    
    // Additional validation - ensure URL is HTTPS in production
    if (!url.startsWith('https://')) {
      console.error('❌ CRITICAL: Non-HTTPS URL detected in production:', url);
      throw new ApiError(0, 'Production environment requires HTTPS URLs');
    }
  }
  
  // Debug logging for weather API calls
  if (endpoint.includes('/weather')) {
    console.log('🌤️ Weather API Request Debug:', {
      endpoint,
      API_BASE_URL,
      constructedURL: url,
      originalProtocol: API_BASE_URL.split('://')[0],
      finalProtocol: url.split('://')[0],
      isHTTPS: url.startsWith('https://'),
      isProduction: process.env.NODE_ENV === 'production',
      timestamp: new Date().toISOString()
    });
  }
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`🔄 Making request to: ${url}`);
    const response = await fetch(url, config);
  
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      // Extract validation error details for 422 responses
      let errorMessage = errorData.detail || `HTTP ${response.status}`;
      if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((err: any) => err.msg || err.message || String(err)).join(', ');
      }
      throw new ApiError(response.status, errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Special handling for Mixed Content Policy errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Mixed Content') || errorMessage.includes('blocked:mixed-content')) {
      console.error('🚫 Mixed Content Policy Violation:', {
        url,
        endpoint,
        error: errorMessage,
        solution: 'Ensure all API URLs use HTTPS in production',
        timestamp: new Date().toISOString()
      });
      throw new ApiError(0, 'Mixed Content Policy: API must use HTTPS in production');
    }
    
    // Network or other errors
    console.error('💥 API Request Error:', {
      url,
      endpoint,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
    throw new ApiError(0, errorMessage);
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
    files.forEach((file) => {
      formData.append('files', file);
      console.log(`📎 Added file ${file.name}:`, {
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

  // Plants
  createPlant: async (data: PlantCreateData): Promise<ApiResponse<Plant>> => {
    // Clean the data - remove undefined values and convert empty strings to undefined
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => {
        return value !== undefined && value !== null && value !== '';
      })
    );
    
    return apiRequest('/api/plants/', {
      method: 'POST',
      body: JSON.stringify(cleanData),
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
    // Clean the data - remove undefined values and convert empty strings to undefined
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => {
        return value !== undefined && value !== null && value !== '';
      })
    );
    
    return apiRequest(`/api/plants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanData),
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

  // Plant Varieties
  createVariety: async (data: PlantVarietyCreateData): Promise<ApiResponse<PlantVariety>> => {
    return apiRequest('/api/plants/varieties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getVarieties: async (category?: PlantCategory): Promise<ApiResponse<PlantVariety[]>> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    
    const query = params.toString();
    return apiRequest(`/api/plants/varieties${query ? `?${query}` : ''}`);
  },

  getVariety: async (id: string): Promise<ApiResponse<PlantVariety>> => {
    return apiRequest(`/api/plants/varieties/${id}`);
  },

  updateVariety: async (id: string, data: PlantVarietyUpdateData): Promise<ApiResponse<PlantVariety>> => {
    return apiRequest(`/api/plants/varieties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteVariety: async (id: string): Promise<ApiResponse<PlantVariety>> => {
    return apiRequest(`/api/plants/varieties/${id}`, {
      method: 'DELETE',
    });
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
    console.log('🔍 Debug: uploadImages called with:', {
      eventId,
      fileCount: files.length,
      files: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        lastModified: f.lastModified,
        constructor: f.constructor.name
      }))
    });
    
    const formData = new FormData();
    files.forEach((file, index) => {
      console.log(`🔍 Debug: Adding file ${index}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        isInstanceOfFile: file instanceof File,
        isInstanceOfBlob: file instanceof Blob
      });
      formData.append('files', file);
    });
    
    return uploadRequest(`/api/images/upload-multiple/${eventId}`, formData);
  },

  // Get event statistics
  getStats: async (): Promise<ApiResponse<EventStats>> => {
    return apiRequest('/api/events/stats');
  },
};

// Weather API functions
export const weatherApi = {
  getCurrentWeather: async (coordinates: Coordinates, eventDate?: string): Promise<ApiResponse<WeatherData>> => {
    const params = new URLSearchParams({
      latitude: coordinates.latitude.toString(),
      longitude: coordinates.longitude.toString(),
    });
    
    if (eventDate) {
      params.append('event_date', eventDate);
    }
    
    // Add cache-busting parameter to force fresh requests
    params.append('_t', Date.now().toString());
    
    return apiRequest(`/api/v1/weather?${params.toString()}`, {
      // Add cache-busting headers
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
  
  geocodeLocation: async (location: string): Promise<ApiResponse<GeocodingResult>> => {
    const params = new URLSearchParams({
      location: location,
    });
    
    // Add cache-busting parameter
    params.append('_t', Date.now().toString());
    
    return apiRequest(`/api/v1/weather/geocode?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
  
  getDefaultLocation: async (): Promise<ApiResponse<GeocodingResult>> => {
    const params = new URLSearchParams({
      _t: Date.now().toString()
    });
    
    return apiRequest(`/api/v1/weather/default-location?${params.toString()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
};

export { ApiError }; 