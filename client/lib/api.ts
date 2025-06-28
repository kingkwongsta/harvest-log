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

export { ApiError }; 