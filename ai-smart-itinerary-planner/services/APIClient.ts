/**
 * APIClient - 統一的 API 客戶端類別
 * 處理所有與後端的 HTTP 請求，包括認證、錯誤處理、請求攔截等
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class APIClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * 設定認證 token
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders = {
        ...this.defaultHeaders,
        'Authorization': `Bearer ${token}`,
      };
    } else {
      const { Authorization, ...headers } = this.defaultHeaders as any;
      this.defaultHeaders = headers;
    }
  }

  /**
   * 從 cookie 或 localStorage 獲取 session
   */
  private getSessionToken(): string | null {
    // 嘗試從 cookie 獲取
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'session_id' || name === 'session') {
        return value;
      }
    }
    // 嘗試從 localStorage 獲取
    return localStorage.getItem('session_token');
  }

  /**
   * 建立完整的請求 URL
   */
  private buildURL(endpoint: string): string {
    // 如果 endpoint 已經是完整 URL，直接返回
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    // 移除開頭的斜線，避免雙斜線
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseURL}/${cleanEndpoint}`;
  }

  /**
   * 處理 API 回應
   */
  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let data: any;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
        message: data.message,
      };
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
      message: data.message,
    };
  }

  /**
   * 通用請求方法
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = this.buildURL(endpoint);
    const token = this.getSessionToken();
    
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    // 如果有 token，加入 Authorization header
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // 包含 cookies
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error('[APIClient] Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * GET 請求
   */
  async get<T = any>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST 請求
   */
  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT 請求
   */
  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH 請求
   */
  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE 請求
   */
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// 匯出單例實例（延遲初始化以避免循環依賴）
let _apiClient: APIClient | null = null;
export const getAPIClient = (): APIClient => {
  if (!_apiClient) {
    _apiClient = new APIClient();
  }
  return _apiClient;
};
// 使用 getter 屬性以延遲初始化
export const apiClient = new Proxy({} as APIClient, {
  get(target, prop) {
    return getAPIClient()[prop as keyof APIClient];
  }
});

