import { getAccessToken, refreshToken, clearAuthData } from "@/lib/auth/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiError {
  detail: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle 401 by trying to refresh token
      if (response.status === 401) {
        try {
          await refreshToken();
          // Caller should retry the request
        } catch {
          clearAuthData();
        }
      }

      let error: ApiError;
      try {
        const data = await response.json();
        error = {
          detail: data.detail || data.message || "An error occurred",
          status: response.status,
        };
      } catch {
        error = {
          detail: response.statusText || "An error occurred",
          status: response.status,
        };
      }
      throw error;
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers = await this.getAuthHeaders();
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    return this.handleResponse<T>(response);
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const token = getAccessToken();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as T);
          } catch {
            resolve({} as T);
          }
        } else {
          reject({
            detail: xhr.statusText || "Upload failed",
            status: xhr.status,
          });
        }
      });

      xhr.addEventListener("error", () => {
        reject({
          detail: "Network error",
          status: 0,
        });
      });

      xhr.open("POST", `${this.baseUrl}${endpoint}`);

      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }
}

export const api = new ApiClient();

// Type definitions for API responses
export interface QuotaResponse {
  used_euro: number;
  limit_euro: number;
  percentage: number;
  tier: "basic" | "professional" | "enterprise";
}

export interface DocumentResponse {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: "uploading" | "processing" | "indexed" | "failed";
  page_count: number | null;
  chunk_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface MessageResponse {
  id: string;
  phone_number: string;
  direction: "inbound" | "outbound";
  content: string;
  created_at: string;
}

export interface AnalyticsResponse {
  query_count: number;
  quota_percentage: number;
  success_rate: number;
  top_documents: Array<{ id: string; filename: string; query_count: number }>;
  frequent_queries: Array<{ query: string; count: number }>;
  daily_trend: Array<{ date: string; count: number }>;
}

export interface ActivityResponse {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
