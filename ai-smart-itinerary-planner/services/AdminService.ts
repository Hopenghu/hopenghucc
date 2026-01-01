/**
 * AdminService - 管理功能服務（前端）
 * 整合 AI 管理後台、系統管理後台、商家驗證等功能
 */

import { getAPIClient, APIResponse, APIClient } from './APIClient';

// AI 管理相關類型
export interface AIConversation {
  id: string;
  userId?: string;
  sessionId?: string;
  messageType: 'user' | 'assistant';
  messageContent: string;
  contextData?: any;
  createdAt: number;
}

export interface AIKnowledge {
  id: string;
  question: string;
  answer: string;
  usageCount: number;
  helpfulCount: number;
  locationId?: string;
  createdAt: number;
}

export interface AIStats {
  totalConversations: number;
  totalUsers: number;
  averageResponseTime: number;
  knowledgeBaseSize: number;
}

// 系統管理相關類型
export interface SystemStatus {
  database: 'healthy' | 'degraded' | 'down';
  apiStatus: 'operational' | 'degraded' | 'down';
  imageErrors: number;
  lastBackup?: number;
  backupStatus: 'success' | 'failed' | 'pending';
}

export interface RateLimitStats {
  googlePlacesApi: {
    requests24h: number;
    limit: number;
    remaining: number;
  };
  totalRequests24h: number;
}

export interface SecurityAudit {
  score: number;
  criticalIssues: number;
  warnings: number;
  lastAudit: number;
  issues: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }>;
}

// 商家驗證相關類型
export interface BusinessVerification {
  id: string;
  userId: string;
  locationId: string;
  businessName: string;
  merchantEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface BusinessVerificationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export class AdminService {
  private apiClient: APIClient;
  constructor(apiClientInstance?: APIClient) {
    this.apiClient = apiClientInstance || getAPIClient();
  }

  // ========== AI 管理功能 ==========

  /**
   * 獲取 AI 統計資料
   */
  async getAIStats(): Promise<APIResponse<AIStats>> {
    return this.apiClient.get<AIStats>('/ai/admin/stats');
  }

  /**
   * 獲取 AI 對話記錄
   */
  async getAIConversations(params?: {
    userId?: string;
    sessionId?: string;
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<AIConversation[]>> {
    const query = new URLSearchParams();
    if (params?.userId) query.append('userId', params.userId);
    if (params?.sessionId) query.append('sessionId', params.sessionId);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    return this.apiClient.get<AIConversation[]>(`/ai/admin/conversations?${query.toString()}`);
  }

  /**
   * 獲取知識庫列表
   */
  async getKnowledgeBase(params?: {
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<AIKnowledge[]>> {
    const query = new URLSearchParams();
    if (params?.query) query.append('query', params.query);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    return this.apiClient.get<AIKnowledge[]>(`/ai/admin/knowledge?${query.toString()}`);
  }

  /**
   * 新增知識庫項目
   */
  async addKnowledge(data: {
    question: string;
    answer: string;
    locationId?: string;
  }): Promise<APIResponse<AIKnowledge>> {
    return this.apiClient.post<AIKnowledge>('/ai/admin/knowledge', data);
  }

  /**
   * 更新知識庫項目
   */
  async updateKnowledge(
    knowledgeId: string,
    updates: Partial<Pick<AIKnowledge, 'question' | 'answer'>>
  ): Promise<APIResponse<AIKnowledge>> {
    return this.apiClient.put<AIKnowledge>(`/ai/admin/knowledge/${knowledgeId}`, updates);
  }

  /**
   * 刪除知識庫項目
   */
  async deleteKnowledge(knowledgeId: string): Promise<APIResponse<void>> {
    return this.apiClient.delete<void>(`/ai/admin/knowledge/${knowledgeId}`);
  }

  // ========== 系統管理功能 ==========

  /**
   * 獲取系統狀態
   */
  async getSystemStatus(): Promise<APIResponse<SystemStatus>> {
    return this.apiClient.get<SystemStatus>('/admin/status');
  }

  /**
   * 獲取速率限制統計
   */
  async getRateLimitStats(): Promise<APIResponse<RateLimitStats>> {
    return this.apiClient.get<RateLimitStats>('/admin/rate-limit-stats');
  }

  /**
   * 執行安全審計
   */
  async runSecurityAudit(): Promise<APIResponse<SecurityAudit>> {
    return this.apiClient.post<SecurityAudit>('/admin/security-audit');
  }

  /**
   * 獲取安全狀態
   */
  async getSecurityStatus(): Promise<APIResponse<SecurityAudit>> {
    return this.apiClient.get<SecurityAudit>('/admin/security-status');
  }

  /**
   * 創建資料庫備份
   */
  async createBackup(): Promise<APIResponse<{ backupId: string; createdAt: number }>> {
    return this.apiClient.post<{ backupId: string; createdAt: number }>('/admin/backup');
  }

  /**
   * 檢查備份健康狀態
   */
  async checkBackupHealth(): Promise<APIResponse<{ status: string; lastBackup?: number }>> {
    return this.apiClient.get<{ status: string; lastBackup?: number }>('/admin/backup/health');
  }

  /**
   * 清理速率限制日誌
   */
  async cleanupRateLimitLogs(): Promise<APIResponse<{ deleted: number }>> {
    return this.apiClient.post<{ deleted: number }>('/admin/rate-limit/cleanup');
  }

  /**
   * 刷新系統狀態
   */
  async refreshSystemStatus(): Promise<APIResponse<SystemStatus>> {
    return this.apiClient.post<SystemStatus>('/admin/status/refresh');
  }

  // ========== 商家驗證功能 ==========

  /**
   * 獲取商家驗證統計
   */
  async getBusinessVerificationStats(): Promise<APIResponse<BusinessVerificationStats>> {
    return this.apiClient.get<BusinessVerificationStats>('/admin/business-verification/stats');
  }

  /**
   * 獲取商家驗證列表
   */
  async getBusinessVerifications(params?: {
    status?: 'pending' | 'approved' | 'rejected';
    limit?: number;
    offset?: number;
  }): Promise<APIResponse<BusinessVerification[]>> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    return this.apiClient.get<BusinessVerification[]>(
      `/admin/business-verification?${query.toString()}`
    );
  }

  /**
   * 批准商家驗證
   */
  async approveBusinessVerification(verificationId: string): Promise<APIResponse<BusinessVerification>> {
    return this.apiClient.post<BusinessVerification>(
      `/admin/business-verification/${verificationId}/approve`
    );
  }

  /**
   * 拒絕商家驗證
   */
  async rejectBusinessVerification(
    verificationId: string,
    reason: string
  ): Promise<APIResponse<BusinessVerification>> {
    return this.apiClient.post<BusinessVerification>(
      `/admin/business-verification/${verificationId}/reject`,
      { reason }
    );
  }

  /**
   * 批量批准商家驗證
   */
  async batchApproveBusinessVerifications(
    verificationIds: string[]
  ): Promise<APIResponse<{ approved: number; failed: number }>> {
    return this.apiClient.post<{ approved: number; failed: number }>(
      '/admin/business-verification/batch-approve',
      { verificationIds }
    );
  }
}

// 匯出單例實例（延遲初始化以避免循環依賴）
let _adminService: AdminService | null = null;
export const getAdminService = (): AdminService => {
  if (!_adminService) {
    _adminService = new AdminService();
  }
  return _adminService;
};
// 使用 getter 屬性以延遲初始化
export const adminService = new Proxy({} as AdminService, {
  get(target, prop) {
    return getAdminService()[prop as keyof AdminService];
  }
});

