/**
 * AuthService - 認證服務（前端）
 * 處理用戶登入、登出、註冊、會話管理等操作
 */

import { getAPIClient, APIResponse, APIClient } from './APIClient';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: 'user' | 'admin';
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export class AuthService {
  private apiClient: APIClient;
  constructor(apiClientInstance?: APIClient) {
    this.apiClient = apiClientInstance || getAPIClient();
  }

  /**
   * 使用 Google OAuth 登入
   */
  async loginWithGoogle(): Promise<void> {
    // 重定向到 Google OAuth 端點
    window.location.href = '/api/auth/google';
  }

  /**
   * 處理 Google OAuth 回調
   */
  async handleGoogleCallback(code: string): Promise<APIResponse<AuthResponse>> {
    return this.apiClient.post<AuthResponse>('/auth/google/callback', { code });
  }

  /**
   * 使用電子郵件和密碼登入
   */
  async loginWithPassword(credentials: LoginCredentials): Promise<APIResponse<AuthResponse>> {
    const response = await this.apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // 儲存會話資訊到 localStorage
      this.saveSession(response.data.session);
      this.saveUser(response.data.user);
    }
    
    return response;
  }

  /**
   * 註冊新用戶
   */
  async register(credentials: RegisterCredentials): Promise<APIResponse<User>> {
    return this.apiClient.post<User>('/auth/register', credentials);
  }

  /**
   * 登出
   */
  async logout(): Promise<APIResponse<void>> {
    const response = await this.apiClient.post<void>('/auth/logout');
    
    // 清除本地儲存的會話和用戶資訊
    this.clearSession();
    this.clearUser();
    
    return response;
  }

  /**
   * 獲取當前用戶
   */
  async getCurrentUser(): Promise<APIResponse<User>> {
    return this.apiClient.get<User>('/auth/me');
  }

  /**
   * 檢查是否已登入
   */
  isAuthenticated(): boolean {
    const session = this.getSession();
    if (!session) return false;
    
    // 檢查會話是否過期
    if (session.expiresAt && session.expiresAt < Date.now()) {
      this.clearSession();
      return false;
    }
    
    return true;
  }

  /**
   * 獲取當前用戶（從本地儲存）
   */
  getCurrentUserLocal(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('[AuthService] Failed to get user from local storage:', error);
      return null;
    }
  }

  /**
   * 儲存會話到 localStorage
   */
  private saveSession(session: Session): void {
    try {
      localStorage.setItem('session', JSON.stringify(session));
      localStorage.setItem('session_id', session.id);
    } catch (error) {
      console.error('[AuthService] Failed to save session:', error);
    }
  }

  /**
   * 從 localStorage 獲取會話
   */
  private getSession(): Session | null {
    try {
      const sessionStr = localStorage.getItem('session');
      return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (error) {
      console.error('[AuthService] Failed to get session from local storage:', error);
      return null;
    }
  }

  /**
   * 儲存用戶資訊到 localStorage
   */
  private saveUser(user: User): void {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('[AuthService] Failed to save user:', error);
    }
  }

  /**
   * 清除會話
   */
  private clearSession(): void {
    localStorage.removeItem('session');
    localStorage.removeItem('session_id');
  }

  /**
   * 清除用戶資訊
   */
  private clearUser(): void {
    localStorage.removeItem('user');
  }
}

// 匯出單例實例（延遲初始化以避免循環依賴）
let _authService: AuthService | null = null;
export const getAuthService = (): AuthService => {
  if (!_authService) {
    _authService = new AuthService();
  }
  return _authService;
};
// 使用 getter 屬性以延遲初始化
export const authService = new Proxy({} as AuthService, {
  get(target, prop) {
    return getAuthService()[prop as keyof AuthService];
  }
});

