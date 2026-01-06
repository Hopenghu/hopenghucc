import { pageTemplate } from '../components/layout.js';
import { requireAdmin } from '../middleware/auth.js';
import { ErrorResponseBuilder, ServiceHealthChecker } from '../utils/errorHandler.js';
import {
  renderPageHeader,
  renderSystemStatusCards,
  renderFeatureCards,
  renderSystemLogSection
} from '../templates/adminDashboard.js';

export async function renderAdminDashboardPage(request, env, session, user, nonce, cssContent) {
  // 使用權限檢查中間件
  const authCheck = requireAdmin(user, request);
  if (authCheck) return authCheck;

  // 檢查數據庫連接
  const dbHealth = await ServiceHealthChecker.checkDatabase(env.DB);
  if (!dbHealth.healthy) {
    console.error('[AdminDashboard] Database not available:', dbHealth.error);
    return ErrorResponseBuilder.buildDatabaseErrorPage({
      user: user,
      nonce: nonce,
      cssContent: cssContent
    });
  }

  const content = `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        ${renderPageHeader()}
        ${renderSystemStatusCards()}
        ${renderFeatureCards()}
        ${renderSystemLogSection()}
      </div>
    </div>

    <script nonce="${nonce}">
      // 系統狀態管理
      let systemStatus = {};
      let logMessages = [];

      // 添加日誌消息
      function addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleString();
        const logEntry = \`[\${timestamp}] \${type.toUpperCase()}: \${message}\`;
        logMessages.unshift(logEntry);
        if (logMessages.length > 50) logMessages.pop();
        
        const logElement = document.getElementById('system-log');
        logElement.textContent = logMessages.join('\\n');
      }

      // 更新系統狀態顯示
      function updateSystemStatus(data) {
        systemStatus = data;
        
        // 更新概覽卡片
        document.getElementById('system-health-score').textContent = data.overallHealth?.score || '--';
        document.getElementById('system-health-status').textContent = data.overallHealth?.status || '--';
        
        document.getElementById('image-cache-count').textContent = data.imageCache?.total || '--';
        document.getElementById('api-usage').textContent = data.apiUsage?.daily || '--';
        document.getElementById('security-score').textContent = data.security?.score || '--';
        
        // 更新詳細狀態
        document.getElementById('backup-status').textContent = data.backup?.healthy ? '正常' : '異常';
        document.getElementById('last-backup').textContent = data.backup?.lastBackup || '--';
        document.getElementById('google-api-usage').textContent = data.googleApi?.usage || '--';
        document.getElementById('total-requests').textContent = data.rateLimit?.total || '--';
        document.getElementById('audit-score').textContent = data.security?.score || '--';
        document.getElementById('critical-issues').textContent = data.security?.criticalIssues || '--';
        document.getElementById('db-status').textContent = data.database?.status || '--';
        document.getElementById('image-errors').textContent = data.imageErrors?.count || '--';
        
        addLog('系統狀態已更新', 'info');
      }

      // API 調用函數
      async function apiCall(endpoint, method = 'GET', body = null) {
        try {
          const options = {
            method,
            headers: {
              'Content-Type': 'application/json'
            }
          };
          
          if (body) {
            options.body = JSON.stringify(body);
          }
          
          const response = await fetch(endpoint, options);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'API 調用失敗');
          }
          
          return data;
        } catch (error) {
          addLog(\`API 錯誤: \${error.message}\`, 'error');
          throw error;
        }
      }

      // 創建備份
      async function createBackup() {
        try {
          addLog('開始創建備份...', 'info');
          const result = await apiCall('/api/admin/backup/create', 'POST');
          addLog(\`備份創建成功: \${result.backupKey}\`, 'success');
          await refreshSystemStatus();
        } catch (error) {
          addLog(\`備份創建失敗: \${error.message}\`, 'error');
        }
      }

      // 檢查備份健康狀態
      async function checkBackupHealth() {
        try {
          addLog('檢查備份健康狀態...', 'info');
          const result = await apiCall('/api/admin/backup/health');
          addLog(\`備份健康狀態: \${result.healthy ? '正常' : '異常'}\`, result.healthy ? 'success' : 'warning');
          updateSystemStatus({...systemStatus, backup: result});
        } catch (error) {
          addLog(\`備份健康檢查失敗: \${error.message}\`, 'error');
        }
      }

      // 檢查速率限制統計
      async function checkRateLimitStats() {
        try {
          addLog('檢查速率限制統計...', 'info');
          const result = await apiCall('/api/admin/rate-limit/stats');
          addLog(\`速率限制統計: \${result.totalRequests} 個請求\`, 'info');
          updateSystemStatus({...systemStatus, rateLimit: result});
        } catch (error) {
          addLog(\`速率限制統計檢查失敗: \${error.message}\`, 'error');
        }
      }

      // 清理速率限制日誌
      async function cleanupRateLimitLogs() {
        try {
          addLog('清理速率限制日誌...', 'info');
          const result = await apiCall('/api/admin/rate-limit/cleanup', 'POST');
          addLog(\`清理完成: 刪除 \${result.deletedCount} 條記錄\`, 'success');
        } catch (error) {
          addLog(\`清理失敗: \${error.message}\`, 'error');
        }
      }

      // 執行安全審計
      async function runSecurityAudit() {
        try {
          addLog('執行安全審計...', 'info');
          const result = await apiCall('/api/admin/security/audit', 'POST');
          addLog(\`安全審計完成: 分數 \${result.overallScore}/100\`, 'info');
          updateSystemStatus({...systemStatus, security: result});
        } catch (error) {
          addLog(\`安全審計失敗: \${error.message}\`, 'error');
        }
      }

      // 獲取安全狀態
      async function getSecurityStatus() {
        try {
          addLog('獲取安全狀態...', 'info');
          const result = await apiCall('/api/admin/security/status');
          addLog(\`安全狀態: \${result.status}\`, 'info');
          updateSystemStatus({...systemStatus, security: result});
        } catch (error) {
          addLog(\`安全狀態檢查失敗: \${error.message}\`, 'error');
        }
      }

      // 刷新系統狀態
      async function refreshSystemStatus() {
        try {
          addLog('刷新系統狀態...', 'info');
          const result = await apiCall('/api/admin/system/status');
          updateSystemStatus(result);
          addLog('系統狀態已刷新', 'success');
        } catch (error) {
          addLog(\`系統狀態刷新失敗: \${error.message}\`, 'error');
        }
      }

      // 刷新圖片統計
      async function refreshImageStats() {
        try {
          addLog('刷新圖片統計...', 'info');
          const result = await apiCall('/api/image/stats');
          updateSystemStatus({...systemStatus, imageCache: result});
          addLog(\`圖片統計: \${result.total} 張圖片\`, 'info');
        } catch (error) {
          addLog(\`圖片統計刷新失敗: \${error.message}\`, 'error');
        }
      }

      // 頁面載入時初始化
      // 載入待審核驗證申請數量
      async function loadPendingVerificationsCount() {
        try {
          const response = await fetch('/api/business/verify/pending?limit=1&offset=0', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              document.getElementById('pending-verifications-count').textContent = data.total || 0;
              document.getElementById('verification-status').textContent = data.total > 0 ? '有待審核' : '無待審核';
            }
          }
        } catch (error) {
          console.error('載入驗證申請數量失敗:', error);
          document.getElementById('pending-verifications-count').textContent = '--';
        }
      }

      // 載入生態系統總體分數
      async function loadEcosystemScore() {
        try {
          const response = await fetch('/api/admin/ecosystem/report?days=7', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            if (data.overallScore !== undefined) {
              document.getElementById('ecosystem-overall-score').textContent = data.overallScore;
              const statusElement = document.getElementById('ecosystem-status');
              if (data.overallScore >= 80) {
                statusElement.textContent = '健康';
                statusElement.className = 'text-sm font-medium text-green-600';
              } else if (data.overallScore >= 60) {
                statusElement.textContent = '良好';
                statusElement.className = 'text-sm font-medium text-yellow-600';
              } else {
                statusElement.textContent = '需關注';
                statusElement.className = 'text-sm font-medium text-red-600';
              }
            }
          }
        } catch (error) {
          console.error('載入生態系統分數失敗:', error);
          document.getElementById('ecosystem-overall-score').textContent = '--';
          document.getElementById('ecosystem-status').textContent = '載入失敗';
        }
      }

      document.addEventListener('DOMContentLoaded', function() {
        addLog('管理員儀表板已載入', 'info');
        refreshSystemStatus();
        refreshImageStats();
        loadPendingVerificationsCount();
        loadEcosystemScore();
      });

      // 定期刷新狀態
      setInterval(() => {
        refreshSystemStatus();
      }, 30000); // 每30秒刷新一次
    </script>
  `;

  return new Response(pageTemplate({ 
    title: '管理員儀表板', 
    content, 
    user, 
    nonce,
    cssContent 
  }), {
    headers: { 'Content-Type': 'text/html;charset=utf-8' }
  });
} 