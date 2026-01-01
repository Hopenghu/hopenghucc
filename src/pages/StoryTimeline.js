// Story Timeline Page - 故事時間線頁面
// 基於「人、事、時、地、物」哲學架構

import { pageTemplate } from '../components/layout.js';
import { StoryModule } from '../services/StoryModule.js';
import { PersonModule } from '../services/PersonModule.js';

export async function renderStoryTimelinePage(request, env, session, user, nonce, cssContent) {
  if (!user || !user.id) {
    // 未登入，重定向到首頁
    return Response.redirect(new URL(request.url).origin + '/', 302);
  }

  try {
    const storyModule = new StoryModule(env.DB);
    const personModule = new PersonModule(env.DB);

    // 獲取使用者時間線
    const timeline = await storyModule.getPersonTimeline(user.id);

    // 獲取使用者統計
    const stats = await storyModule.getStoryStatistics(user.id, null);

    // 獲取使用者完整資訊
    const personProfile = await personModule.getPersonProfile(user.id);

    const content = `
      <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
          <div class="max-w-4xl mx-auto px-4 py-6">
            <h1 class="text-3xl font-bold text-gray-900">我的故事時間線</h1>
            <p class="text-gray-600 mt-2">記錄您在澎湖的每一個足跡與回憶</p>
          </div>
        </div>

        <!-- Statistics -->
        <div class="max-w-4xl mx-auto px-4 py-6">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-2xl font-bold text-blue-600">${stats?.actionStats?.total || 0}</div>
              <div class="text-sm text-gray-600">總故事數</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-2xl font-bold text-green-600">${stats?.actionStats?.visited || 0}</div>
              <div class="text-sm text-gray-600">來過</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-2xl font-bold text-purple-600">${stats?.actionStats?.want_to_visit || 0}</div>
              <div class="text-sm text-gray-600">想來</div>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <div class="text-2xl font-bold text-orange-600">${stats?.actionStats?.want_to_revisit || 0}</div>
              <div class="text-sm text-gray-600">想再來</div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="bg-white rounded-lg shadow">
            <div class="p-6">
              <h2 class="text-xl font-semibold mb-4">時間線</h2>
              <div id="timeline-container" class="space-y-4">
                ${timeline.length === 0 ? `
                  <div class="text-center py-12 text-gray-500">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="mt-4">還沒有任何故事記錄</p>
                    <p class="text-sm mt-2">開始探索澎湖，記錄您的足跡吧！</p>
                  </div>
                ` : timeline.map(story => `
                  <div class="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="text-lg">${story.actionIcon || '•'}</span>
                          <span class="font-semibold text-gray-900">${story.actionName || story.action_type}</span>
                          <span class="text-sm text-gray-500">${story.timeDescription || ''}</span>
                        </div>
                        ${story.actionDescription ? `
                          <p class="text-gray-700 mb-2">${story.actionDescription}</p>
                        ` : ''}
                        ${story.user_description ? `
                          <p class="text-gray-600 text-sm italic">"${story.user_description}"</p>
                        ` : ''}
                        ${story._location ? `
                          <div class="mt-2">
                            <a href="/location/${story.location_id}" class="text-blue-600 hover:underline text-sm">
                              📍 ${story._location.name || '未知地點'}
                            </a>
                          </div>
                        ` : ''}
                        <div class="mt-2 flex gap-2">
                          <button 
                            onclick="shareStory('${story.id}', '${story.actionDescription || story.actionName}')" 
                            class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            data-story-id="${story.id}"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            分享
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <script nonce="${nonce}">
        // 分享故事功能
        async function shareStory(storyId, storyTitle) {
          try {
            // 嘗試使用 Web Share API
            if (navigator.share) {
              const shareUrl = window.location.origin + '/story/' + storyId;
              await navigator.share({
                title: '我的澎湖故事',
                text: storyTitle,
                url: shareUrl
              });
              
              // 同時記錄分享到後端
              await fetch('/api/story/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ story_id: storyId, share_type: 'public' })
              });
            } else {
              // 降級方案：複製連結到剪貼板
              const shareUrl = window.location.origin + '/story/' + storyId;
              await navigator.clipboard.writeText(shareUrl);
              
              // 顯示提示
              if (window.showToast) {
                window.showToast('連結已複製到剪貼板！', 'success');
              } else {
                alert('連結已複製到剪貼板！');
              }
              
              // 記錄分享到後端
              await fetch('/api/story/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ story_id: storyId, share_type: 'link' })
              });
            }
          } catch (error) {
            console.error('分享失敗:', error);
            // 降級方案：複製連結
            const shareUrl = window.location.origin + '/story/' + storyId;
            try {
              await navigator.clipboard.writeText(shareUrl);
              if (window.showToast) {
                window.showToast('連結已複製到剪貼板！', 'success');
              } else {
                alert('連結已複製到剪貼板！');
              }
            } catch (clipboardError) {
              if (window.showToast) {
                window.showToast('分享功能暫時無法使用，請手動複製連結', 'warning');
              } else {
                alert('分享功能暫時無法使用，請手動複製連結：' + shareUrl);
              }
            }
          }
        }
        
        // 為所有分享按鈕添加事件監聽器（CSP 兼容）
        document.addEventListener('DOMContentLoaded', function() {
          const shareButtons = document.querySelectorAll('[data-story-id]');
          shareButtons.forEach(button => {
            button.addEventListener('click', function() {
              const storyId = this.getAttribute('data-story-id');
              const storyTitle = this.closest('.border-l-4').querySelector('.font-semibold')?.textContent || '我的澎湖故事';
              shareStory(storyId, storyTitle);
            });
          });
        });
      </script>
    `;

    return pageTemplate({
      title: '我的故事時間線 - 澎湖時光機',
      content,
      user,
      nonce,
      cssContent
    });
  } catch (error) {
    console.error('[StoryTimeline] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

