import { requireAdmin } from '../middleware/auth.js';
import { ErrorResponseBuilder, ServiceHealthChecker } from '../utils/errorHandler.js';
import {
  renderPageHeader,
  renderErrorAlert,
  renderStatisticsCards,
  renderActionButtons,
  renderInfoSection
} from '../templates/imageManagement.js';

export async function renderImageManagementPage(request, env, session, user, nonce, cssContent) {
    // 使用權限檢查中間件
    const authCheck = requireAdmin(user, request);
    if (authCheck) return authCheck;

    // 檢查數據庫連接
    const dbHealth = await ServiceHealthChecker.checkDatabase(env.DB);
    if (!dbHealth.healthy) {
        console.error('[ImageManagement] Database not available:', dbHealth.error);
        return ErrorResponseBuilder.buildDatabaseErrorPage({
            user: user,
            nonce: nonce,
            cssContent: cssContent
        });
    }

    let stats = { total: 0, expired: 0, valid: 0 };
    let error = null;

    try {
        // 獲取圖片緩存統計
        const response = await fetch(`${new URL(request.url).origin}/api/image/stats`);
        if (response.ok) {
            stats = await response.json();
        }
    } catch (e) {
        console.error('Error fetching image stats:', e);
        error = '無法獲取圖片統計信息';
    }

    const content = `
        <div class="max-w-6xl mx-auto p-6">
            ${renderPageHeader()}
            ${renderErrorAlert(error)}
            ${renderStatisticsCards(stats)}
            ${renderActionButtons()}
            ${renderInfoSection()}
        </div>

        <script nonce="${nonce}">
            async function cleanupExpiredCache() {
                if (!confirm('確定要清理過期的圖片緩存嗎？')) {
                    return;
                }
                
                try {
                    const response = await fetch('/api/image/cleanup', {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (window.showToast) {
                          window.showToast('清理完成！共清理了 ' + (result.cleanedCount || 0) + ' 個過期緩存。', 'success');
                        } else {
                        alert(\`清理完成！共清理了 \${result.cleanedCount} 個過期緩存。\`);
                        }
                        location.reload();
                    } else {
                        if (window.showToast) {
                          window.showToast('清理失敗，請稍後再試。', 'error');
                    } else {
                        alert('清理失敗，請稍後再試。');
                        }
                    }
                } catch (error) {
                    console.error('Error cleaning up cache:', error);
                    if (window.showToast) {
                      window.showToast('清理失敗，請稍後再試。', 'error');
                    } else {
                    alert('清理失敗，請稍後再試。');
                    }
                }
            }

            async function refreshStats() {
                location.reload();
            }

            async function refreshAllImages() {
                if (!confirm('確定要刷新所有地點的圖片嗎？這可能需要一些時間。')) {
                    return;
                }
                
                try {
                    const response = await fetch('/api/image/refresh-all', {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (window.showToast) {
                          window.showToast('刷新完成！' + (result.message || ''), 'success');
                        } else {
                        alert(\`刷新完成！\${result.message}\`);
                        }
                        location.reload();
                    } else {
                        if (window.showToast) {
                          window.showToast('刷新失敗，請稍後再試。', 'error');
                    } else {
                        alert('刷新失敗，請稍後再試。');
                        }
                    }
                } catch (error) {
                    console.error('Error refreshing images:', error);
                    if (window.showToast) {
                      window.showToast('刷新失敗，請稍後再試。', 'error');
                    } else {
                    alert('刷新失敗，請稍後再試。');
                    }
                }
            }
        </script>
    `;

    return new Response(
        pageTemplate({
            title: '圖片管理 - HOPE PENGHU',
            content,
            user,
            nonce,
            cssContent
        }),
        {
            headers: {
                'Content-Type': 'text/html;charset=utf-8'
            }
        }
    );
} 