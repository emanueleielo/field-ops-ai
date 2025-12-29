/**
 * Admin API Client
 * Handles all admin-specific API calls with JWT authentication stored in localStorage
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY = "admin_user";

interface AdminApiError {
  detail: string;
  status: number;
}

export interface AdminUser {
  id: string;
  email: string;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
  admin: AdminUser;
}

export interface BusinessKPIs {
  mrr: number;
  arr: number;
  active_users: number;
  churn_rate: number;
  arpu: number;
  new_users_this_month: number;
  total_organizations: number;
}

export interface TechnicalKPIs {
  queries_today: number;
  sms_sent_today: number;
  llm_cost_today: number;
  error_rate: number;
  avg_response_time_ms: number;
  documents_indexed: number;
  active_phone_numbers: number;
}

export interface AdminNotification {
  id: string;
  type: "info" | "warning" | "critical";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// Config types
export interface TierConfig {
  tier: TierType;
  name: string;
  monthly_price: number;
  yearly_price: number;
  quota_limit_euro: number;
  storage_limit_mb: number | null;
  max_phone_numbers: number;
  max_file_size_mb: number;
  max_pdf_pages: number;
  is_active: boolean;
}

export interface TierConfigListResponse {
  tiers: TierConfig[];
}

export interface TierConfigUpdate {
  name?: string;
  monthly_price?: number;
  yearly_price?: number;
  quota_limit_euro?: number;
  storage_limit_mb?: number | null;
  max_phone_numbers?: number;
  max_file_size_mb?: number;
  max_pdf_pages?: number;
  is_active?: boolean;
}

export interface SystemSettings {
  burst_limit: number;
  sms_templates: Record<string, string>;
  welcome_sms_enabled: boolean;
  default_language: string;
  max_conversation_history: number;
  llm_timeout_seconds: number;
  rate_limit_enabled: boolean;
}

export interface SystemSettingsUpdate {
  burst_limit?: number;
  sms_templates?: Record<string, string>;
  welcome_sms_enabled?: boolean;
  default_language?: string;
  max_conversation_history?: number;
  llm_timeout_seconds?: number;
  rate_limit_enabled?: boolean;
}

// Health types
export type ServiceStatusType = "healthy" | "degraded" | "down" | "unknown";

export interface ServiceStatus {
  name: string;
  status: ServiceStatusType;
  latency_ms: number | null;
  message: string | null;
  last_checked: string;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  overall_status: ServiceStatusType;
  services: Record<string, ServiceStatus>;
  generated_at: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  logger: string;
  message: string;
  extra?: Record<string, unknown>;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
}

// Notifications types
export interface NotificationsList {
  notifications: AdminNotification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface DashboardResponse {
  business: BusinessKPIs;
  technical: TechnicalKPIs;
  notifications_count: number;
}

// User Management Types
export type TierType = "basic" | "professional" | "enterprise";

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  tier: TierType;
  is_active: boolean;
  quota_percentage: number;
  documents_count: number;
  created_at: string;
  last_activity: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface UserListResponse {
  users: UserListItem[];
  meta: PaginationMeta;
}

export interface QuotaInfo {
  limit_euro: number;
  used_euro: number;
  percentage: number;
}

export interface PhoneNumberInfo {
  id: string;
  number: string;
  is_primary: boolean;
  created_at: string;
}

export interface DocumentSummary {
  id: string;
  filename: string;
  status: string;
  file_size_bytes: number;
  created_at: string;
}

export interface UserDetailResponse {
  id: string;
  email: string;
  name: string;
  tier: TierType;
  is_active: boolean;
  quota: QuotaInfo;
  billing_day: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  phone_numbers: PhoneNumberInfo[];
  documents: DocumentSummary[];
  documents_count: number;
  messages_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserUpdateRequest {
  tier?: TierType;
  quota_limit_euro?: number;
  is_active?: boolean;
  name?: string;
}

export interface UserUpdateResponse {
  id: string;
  tier: TierType;
  quota_limit_euro: number;
  is_active: boolean;
  name: string;
  updated_at: string;
}

export interface UserDeleteResponse {
  id: string;
  email: string;
  message: string;
  deleted_documents: number;
  deleted_messages: number;
}

export interface ImpersonateResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  user_email: string;
  admin_token: string;
  session_id: string;
  expires_at: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  tier?: TierType;
}

class AdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get stored admin token from localStorage
   */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }

  /**
   * Get stored admin user from localStorage
   */
  getStoredAdmin(): AdminUser | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(ADMIN_USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AdminUser;
    } catch {
      return null;
    }
  }

  /**
   * Check if admin is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Store admin credentials in localStorage
   */
  private storeCredentials(token: string, admin: AdminUser): void {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
  }

  /**
   * Clear admin credentials from localStorage
   */
  private clearCredentials(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  }

  /**
   * Get authorization headers for authenticated requests
   */
  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // If unauthorized, clear credentials
      if (response.status === 401) {
        this.clearCredentials();
      }

      let error: AdminApiError;
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

  /**
   * Admin login - authenticates and stores JWT
   */
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse<AdminLoginResponse>(response);
    this.storeCredentials(data.access_token, data.admin);
    return data;
  }

  /**
   * Admin logout - clears stored credentials
   */
  async logout(): Promise<void> {
    const token = this.getToken();

    // Call backend logout endpoint if we have a token
    if (token) {
      try {
        await fetch(`${this.baseUrl}/api/v1/admin/logout`, {
          method: "POST",
          headers: this.getAuthHeaders(),
        });
      } catch {
        // Ignore errors during logout
      }
    }

    this.clearCredentials();
  }

  /**
   * Get admin dashboard data
   */
  async getDashboard(): Promise<DashboardResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/dashboard`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<DashboardResponse>(response);
  }

  /**
   * Get admin notifications (paginated)
   */
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<NotificationsList> {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };
    if (unreadOnly) params.unread_only = "true";
    return this.get<NotificationsList>("/api/v1/admin/notifications", params);
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return this.get<UnreadCountResponse>("/api/v1/admin/notifications/unread-count");
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<AdminNotification> {
    return this.patch<AdminNotification>(
      `/api/v1/admin/notifications/${notificationId}`,
      { is_read: true }
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<UnreadCountResponse> {
    return this.post<UnreadCountResponse>("/api/v1/admin/notifications/mark-all-read");
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.delete<void>(`/api/v1/admin/notifications/${notificationId}`);
  }

  // ========== Config Methods ==========

  /**
   * Get all tier configurations
   */
  async getTierConfigs(): Promise<TierConfigListResponse> {
    return this.get<TierConfigListResponse>("/api/v1/admin/config/tiers");
  }

  /**
   * Update a tier configuration
   */
  async updateTierConfig(
    tier: TierType,
    data: TierConfigUpdate
  ): Promise<TierConfig> {
    return this.put<TierConfig>(`/api/v1/admin/config/tiers/${tier}`, data);
  }

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<SystemSettings> {
    return this.get<SystemSettings>("/api/v1/admin/config/settings");
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(data: SystemSettingsUpdate): Promise<SystemSettings> {
    return this.put<SystemSettings>("/api/v1/admin/config/settings", data);
  }

  // ========== Health Methods ==========

  /**
   * Get health status of all services
   */
  async getHealth(): Promise<HealthResponse> {
    return this.get<HealthResponse>("/api/v1/admin/health");
  }

  /**
   * Get application logs
   */
  async getLogs(
    page: number = 1,
    limit: number = 50,
    level?: string
  ): Promise<LogsResponse> {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };
    if (level) params.level = level;
    return this.get<LogsResponse>("/api/v1/admin/logs", params);
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // ========== User Management Methods ==========

  /**
   * Get list of users with pagination and filtering
   */
  async getUsers(params?: UserListParams): Promise<UserListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.search) queryParams.search = params.search;
    if (params?.tier) queryParams.tier = params.tier;

    return this.get<UserListResponse>("/api/v1/admin/users", queryParams);
  }

  /**
   * Get detailed information about a specific user
   */
  async getUser(userId: string): Promise<UserDetailResponse> {
    return this.get<UserDetailResponse>(`/api/v1/admin/users/${userId}`);
  }

  /**
   * Update user information
   */
  async updateUser(
    userId: string,
    data: UserUpdateRequest
  ): Promise<UserUpdateResponse> {
    return this.patch<UserUpdateResponse>(`/api/v1/admin/users/${userId}`, data);
  }

  /**
   * Delete a user and all associated data
   */
  async deleteUser(userId: string): Promise<UserDeleteResponse> {
    return this.delete<UserDeleteResponse>(`/api/v1/admin/users/${userId}`);
  }

  /**
   * Start an impersonation session for a user
   */
  async impersonateUser(userId: string): Promise<ImpersonateResponse> {
    return this.post<ImpersonateResponse>(
      `/api/v1/admin/users/${userId}/impersonate`
    );
  }
}

// Impersonation storage keys
const IMPERSONATION_KEY = "impersonation_session";
const ORIGINAL_ADMIN_TOKEN_KEY = "original_admin_token";

export interface ImpersonationSession {
  userId: string;
  userEmail: string;
  sessionId: string;
  expiresAt: string;
}

/**
 * Store impersonation session data
 */
export function storeImpersonationSession(
  session: ImpersonationSession,
  adminToken: string
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(session));
  localStorage.setItem(ORIGINAL_ADMIN_TOKEN_KEY, adminToken);
}

/**
 * Get stored impersonation session
 */
export function getImpersonationSession(): ImpersonationSession | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(IMPERSONATION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ImpersonationSession;
  } catch {
    return null;
  }
}

/**
 * Get the original admin token
 */
export function getOriginalAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORIGINAL_ADMIN_TOKEN_KEY);
}

/**
 * Clear impersonation session data
 */
export function clearImpersonationSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(IMPERSONATION_KEY);
  localStorage.removeItem(ORIGINAL_ADMIN_TOKEN_KEY);
}

/**
 * Check if currently in impersonation mode
 */
export function isImpersonating(): boolean {
  return getImpersonationSession() !== null;
}

export const adminApi = new AdminApiClient();
