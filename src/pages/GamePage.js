/**
 * 澎湖時光島主遊戲頁面
 * 完整的遊戲界面和功能
 */

import { pageTemplate } from '../components/layout.js';
import { PenghuGameService } from '../services/PenghuGameService.js';

export async function renderPenghuGamePage(request, env, session, user, nonce, cssContent) {
    if (!user) {
        return Response.redirect(new URL(request.url).origin + '/login', 302);
    }

    const gameService = new PenghuGameService(env.DB);
    let userStats = null;
    let userCapsules = [];
    let allCapsules = [];
    let locations = [];
    let tasks = [];
    let badges = [];
    let leaderboard = [];

    try {
        // 獲取用戶遊戲統計
        userStats = await gameService.getUserGameStats(user.id);
    } catch (error) {
        console.error('[PenghuGamePage.js] Error getting user game stats:', error);
    }

    try {
        // 獲取用戶記憶膠囊
        userCapsules = await gameService.getUserMemoryCapsules(user.id, 10);
    } catch (error) {
        console.error('[PenghuGamePage.js] Error getting user capsules:', error);
    }

    try {
        // 獲取所有記憶膠囊（探索功能）
        allCapsules = await gameService.getAllMemoryCapsules(20);
    } catch (error) {
        console.error('[PenghuGamePage.js] Error getting all capsules:', error);
    }

    try {
        // 獲取澎湖地點
        locations = await gameService.getPenghuLocations();
    } catch (error) {
        console.error('[PenghuGamePage.js] Error getting locations:', error);
    }

    try {
        // 獲取用戶任務
        tasks = await gameService.getUserTasks(user.id);
    } catch (error) {
        console.error('[PenghuGamePage.js] Error getting tasks:', error);
    }

    try {
        // 獲取用戶勳章
        badges = await gameService.getUserBadges(user.id);
    } catch (error) {
        console.error('[PenghuGamePage.js] Error getting badges:', error);
    }

    try {
        // 獲取排行榜
        leaderboard = await gameService.getLeaderboard(10);
    } catch (error) {
        console.error('[PenghuGamePage.js] Error getting leaderboard:', error);
    }

    const content = `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            <!-- 頁面標題 -->
            <div class="bg-white shadow-sm border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-900">🏝️ 澎湖時光島主</h1>
                            <p class="mt-2 text-gray-600">收集記憶，分享故事，成為澎湖的時光島主</p>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="text-right">
                                <div class="text-sm text-gray-500">歡迎回來</div>
                                <div class="font-semibold text-gray-900">${user.name || '玩家'}</div>
                            </div>
                            <button onclick="showCreateCapsuleForm()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                                📦 創建記憶膠囊
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 遊戲統計面板 -->
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <div class="text-3xl font-bold text-blue-600">${userStats?.game_level || 1}</div>
                        <div class="text-sm text-gray-500">等級</div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <div class="text-3xl font-bold text-green-600">${userStats?.game_points || 0}</div>
                        <div class="text-sm text-gray-500">點數</div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <div class="text-3xl font-bold text-purple-600">${userStats?.memory_count || 0}</div>
                        <div class="text-sm text-gray-500">記憶膠囊</div>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6 text-center">
                        <div class="text-3xl font-bold text-orange-600">${userStats?.visit_count || 0}</div>
                        <div class="text-sm text-gray-500">訪問次數</div>
                    </div>
                </div>

                <!-- 標籤頁導航 -->
                <div class="bg-white rounded-lg shadow-md mb-6">
                    <div class="border-b border-gray-200">
                        <nav class="-mb-px flex space-x-8 px-6">
                            <button id="tab-capsules" onclick="switchTab('capsules')" class="border-b-2 border-blue-500 text-blue-600 py-4 px-1 text-sm font-medium">
                                📦 我的記憶膠囊
                            </button>
                            <button id="tab-explore" onclick="switchTab('explore')" class="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
                                🔍 探索記憶
                            </button>
                            <button id="tab-tasks" onclick="switchTab('tasks')" class="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
                                🎯 任務列表
                            </button>
                            <button id="tab-badges" onclick="switchTab('badges')" class="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
                                🏆 勳章收藏
                            </button>
                            <button id="tab-leaderboard" onclick="switchTab('leaderboard')" class="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
                                🏅 排行榜
                            </button>
                        </nav>
                    </div>
                </div>

                <!-- 內容區域 -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2">
                        <!-- 我的記憶膠囊 -->
                        <div id="content-capsules">
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-2xl font-bold text-gray-900">我的記憶膠囊</h2>
                                <span class="text-gray-500">${userCapsules.length} 個膠囊</span>
                            </div>
                            <div id="capsules-list" class="space-y-4">
                                ${userCapsules.length > 0 ?
            userCapsules.map(capsule => `
                                        <div class="bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 border-blue-500">
                                            <div class="flex items-start justify-between mb-4">
                                                <div class="flex items-center space-x-3">
                                                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span class="text-blue-600 font-bold text-sm">${user.name?.charAt(0) || 'U'}</span>
                                                    </div>
                                                    <div>
                                                        <h3 class="font-semibold text-gray-900">${capsule.title}</h3>
                                                        <p class="text-sm text-gray-500">
                                                            ${user.name} • ${new Date(capsule.created_at).toLocaleDateString()}
                                                        </p>
                                                        <p class="text-sm text-blue-600">📍 ${capsule.location_name || '未知地點'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mb-4">
                                                <p class="text-gray-700 mb-3">${capsule.content || ''}</p>
                                                ${capsule.photo_url ? `<img src="${capsule.photo_url}" alt="${capsule.title}" class="w-full h-48 object-cover rounded-lg">` : ''}
                                            </div>
                                        </div>
                                    `).join('') :
            `<div class="bg-white rounded-lg shadow-md p-12 text-center">
                                        <div class="text-6xl mb-4">📦</div>
                                        <h3 class="text-lg font-medium text-gray-900 mb-2">還沒有記憶膠囊</h3>
                                        <p class="text-gray-500 mb-6">開始收集你在澎湖的美好回憶吧！</p>
                                        <button onclick="showCreateCapsuleForm()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                                            創建第一個記憶膠囊
                                        </button>
                                    </div>`
        }
                            </div>
                        </div>

                        <!-- 探索記憶 -->
                        <div id="content-explore" class="hidden">
                            <h2 class="text-2xl font-bold text-gray-900 mb-6">探索記憶</h2>
                            <div class="space-y-4">
                                ${allCapsules.length > 0 ?
            allCapsules.map(capsule => `
                                        <div class="bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 border-green-500">
                                            <div class="flex items-start justify-between mb-4">
                                                <div class="flex items-center space-x-3">
                                                    <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                        <span class="text-green-600 font-bold text-sm">${capsule.user_name?.charAt(0) || 'U'}</span>
                                                    </div>
                                                    <div>
                                                        <h3 class="font-semibold text-gray-900">${capsule.title}</h3>
                                                        <p class="text-sm text-gray-500">
                                                            ${capsule.user_name || '匿名'} • ${new Date(capsule.created_at).toLocaleDateString()}
                                                        </p>
                                                        <p class="text-sm text-green-600">📍 ${capsule.location_name || '未知地點'}</p>
                                                        <span class="inline-block px-2 py-1 text-xs rounded-full ${capsule.game_role === 'visitor' ? 'bg-blue-100 text-blue-800' :
                    capsule.game_role === 'merchant' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                }">
                                                            ${capsule.game_role === 'visitor' ? '游客' :
                    capsule.game_role === 'merchant' ? '店家' : '在地人'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mb-4">
                                                <p class="text-gray-700 mb-3">${capsule.content || ''}</p>
                                                ${capsule.photo_url ? `<img src="${capsule.photo_url}" alt="${capsule.title}" class="w-full h-48 object-cover rounded-lg">` : ''}
                                            </div>
                                            <div class="flex justify-end">
                                                <button onclick="showReplyForm(${capsule.id})" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                                                    💬 回覆
                                                </button>
                                            </div>
                                        </div>
                                    `).join('') :
            `<div class="bg-white rounded-lg shadow-md p-12 text-center">
                                        <div class="text-6xl mb-4">🔍</div>
                                        <h3 class="text-lg font-medium text-gray-900 mb-2">還沒有記憶膠囊</h3>
                                        <p class="text-gray-500">等待其他玩家分享他們的澎湖記憶...</p>
                                    </div>`
        }
                            </div>
                        </div>

                        <!-- 任務列表 -->
                        <div id="content-tasks" class="hidden">
                            <h2 class="text-2xl font-bold text-gray-900 mb-6">任務列表</h2>
                            <div class="space-y-4">
                                ${tasks.length > 0 ?
            tasks.map(task => `
                                        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 ${task.completed ? 'border-green-500' : 'border-yellow-500'}">
                                            <div class="flex items-center justify-between">
                                                <div class="flex-1">
                                                    <h3 class="font-semibold text-gray-900">${task.title}</h3>
                                                    <p class="text-gray-600 text-sm mt-1">${task.description}</p>
                                                    <div class="flex items-center mt-2">
                                                        <span class="text-sm text-gray-500">獎勵: ${task.points_reward} 點數</span>
                                                        ${task.completed ?
                    '<span class="ml-4 text-sm text-green-600">✅ 已完成</span>' :
                    '<span class="ml-4 text-sm text-yellow-600">⏳ 進行中</span>'
                }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') :
            `<div class="bg-white rounded-lg shadow-md p-12 text-center">
                                        <div class="text-6xl mb-4">🎯</div>
                                        <h3 class="text-lg font-medium text-gray-900 mb-2">沒有任務</h3>
                                        <p class="text-gray-500">任務功能開發中...</p>
                                    </div>`
        }
                            </div>
                        </div>

                        <!-- 勳章收藏 -->
                        <div id="content-badges" class="hidden">
                            <h2 class="text-2xl font-bold text-gray-900 mb-6">勳章收藏</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                ${badges.length > 0 ?
            badges.map(badge => `
                                        <div class="bg-white rounded-lg shadow-md p-6 text-center ${badge.earned_at ? 'border-2 border-yellow-400' : 'opacity-50'}">
                                            <div class="text-4xl mb-2">${badge.icon}</div>
                                            <h3 class="font-semibold text-gray-900">${badge.name}</h3>
                                            <p class="text-gray-600 text-sm mt-1">${badge.description}</p>
                                            ${badge.earned_at ?
                    `<p class="text-green-600 text-xs mt-2">✅ 已獲得</p>` :
                    `<p class="text-gray-500 text-xs mt-2">⏳ 未獲得</p>`
                }
                                        </div>
                                    `).join('') :
            `<div class="bg-white rounded-lg shadow-md p-12 text-center col-span-full">
                                        <div class="text-6xl mb-4">🏆</div>
                                        <h3 class="text-lg font-medium text-gray-900 mb-2">沒有勳章</h3>
                                        <p class="text-gray-500">勳章功能開發中...</p>
                                    </div>`
        }
                            </div>
                        </div>

                        <!-- 排行榜 -->
                        <div id="content-leaderboard" class="hidden">
                            <h2 class="text-2xl font-bold text-gray-900 mb-6">排行榜</h2>
                            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                                <div class="px-6 py-4 bg-gray-50 border-b">
                                    <h3 class="text-lg font-semibold text-gray-900">時光島主排行榜</h3>
                                </div>
                                <div class="divide-y divide-gray-200">
                                    ${leaderboard.length > 0 ?
            leaderboard.map((player, index) => `
                                            <div class="px-6 py-4 flex items-center justify-between">
                                                <div class="flex items-center space-x-4">
                                                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span class="text-blue-600 font-bold text-sm">${index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <h4 class="font-semibold text-gray-900">${player.user_name || '匿名玩家'}</h4>
                                                        <p class="text-sm text-gray-500">等級 ${player.game_level} • ${player.game_points} 點數</p>
                                                    </div>
                                                </div>
                                                <div class="text-right">
                                                    <span class="px-3 py-1 text-sm rounded-full ${player.game_role === 'visitor' ? 'bg-blue-100 text-blue-800' :
                    player.game_role === 'merchant' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                }">
                                                        ${player.game_role === 'visitor' ? '游客' :
                    player.game_role === 'merchant' ? '店家' : '在地人'}
                                                    </span>
                                                </div>
                                            </div>
                                        `).join('') :
            `<div class="px-6 py-12 text-center">
                                            <div class="text-6xl mb-4">🏅</div>
                                            <h3 class="text-lg font-medium text-gray-900 mb-2">排行榜空</h3>
                                            <p class="text-gray-500">等待玩家加入遊戲...</p>
                                        </div>`
        }
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 側邊欄 -->
                    <div class="space-y-6">
                        <!-- 快速統計 -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">快速統計</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">記憶膠囊</span>
                                    <span class="font-medium">${userStats?.memory_count || 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">等級</span>
                                    <span class="font-medium">${userStats?.game_level || 1}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">點數</span>
                                    <span class="font-medium">${userStats?.game_points || 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600">回覆數</span>
                                    <span class="font-medium">${userStats?.reply_count || 0}</span>
                                </div>
                            </div>
                        </div>

                        <!-- 角色選擇 -->
                        <div class="bg-white rounded-lg shadow-md p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">選擇角色</h3>
                            <div class="space-y-2">
                                <button onclick="updateRole('visitor')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 ${userStats?.game_role === 'visitor' ? 'bg-blue-100 text-blue-800' : 'text-gray-700'}">
                                    🧳 游客
                                </button>
                                <button onclick="updateRole('merchant')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-green-50 ${userStats?.game_role === 'merchant' ? 'bg-green-100 text-green-800' : 'text-gray-700'}">
                                    🏪 店家
                                </button>
                                <button onclick="updateRole('local')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 ${userStats?.game_role === 'local' ? 'bg-purple-100 text-purple-800' : 'text-gray-700'}">
                                    👨‍🌾 在地人
                                </button>
                            </div>
                        </div>

                        <!-- 遊戲提示 -->
                        <div class="bg-blue-50 rounded-lg p-6">
                            <h3 class="text-lg font-semibold text-blue-900 mb-3">🎮 遊戲提示</h3>
                            <div class="space-y-2 text-sm text-blue-800">
                                <p>• 上傳記憶膠囊獲得點數</p>
                                <p>• 店家回覆遊客記憶獲得額外獎勵</p>
                                <p>• 完成任務解鎖勳章</p>
                                <p>• 達到10級成為時光島主</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 創建記憶膠囊模態框 -->
            <div id="create-capsule-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center p-4 z-50">
                <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-semibold text-gray-900">創建記憶膠囊</h3>
                            <button onclick="hideCreateCapsuleForm()" class="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form id="create-capsule-form" onsubmit="handleCreateCapsule(event)" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">地點 *</label>
                                <select name="location_id" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">選擇地點</option>
                                    ${locations.map(location => `
                                        <option value="${location.id}">${location.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">標題 *</label>
                                <input type="text" name="title" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="為你的記憶起個標題">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">內容</label>
                                <textarea name="content" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" rows="4" placeholder="分享你在這個地點的故事..."></textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">照片URL</label>
                                <input type="url" name="photo_url" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://example.com/photo.jpg">
                            </div>
                            <div class="flex justify-end space-x-3 pt-4">
                                <button type="button" onclick="hideCreateCapsuleForm()" class="px-6 py-3 text-gray-600 hover:text-gray-800">取消</button>
                                <button type="submit" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">創建膠囊</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- 回覆模態框 -->
            <div id="reply-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center p-4 z-50">
                <div class="bg-white rounded-lg max-w-lg w-full">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-semibold text-gray-900">回覆記憶膠囊</h3>
                            <button onclick="hideReplyForm()" class="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form id="reply-form" onsubmit="handleReply(event)" class="space-y-4">
                            <input type="hidden" id="reply-capsule-id" name="capsule_id">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">回覆內容 *</label>
                                <textarea name="reply_content" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none" rows="4" placeholder="分享你的想法或建議..."></textarea>
                            </div>
                            <div class="flex justify-end space-x-3 pt-4">
                                <button type="button" onclick="hideReplyForm()" class="px-6 py-3 text-gray-600 hover:text-gray-800">取消</button>
                                <button type="submit" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">發送回覆</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <script nonce="${nonce}">
            let currentTab = 'capsules';
            
            function switchTab(tabName) {
                document.querySelectorAll('[id^="content-"]').forEach(el => el.classList.add('hidden'));
                document.querySelectorAll('[id^="tab-"]').forEach(el => {
                    el.classList.remove('border-blue-500', 'text-blue-600');
                    el.classList.add('border-transparent', 'text-gray-500');
                });
                
                document.getElementById('content-' + tabName).classList.remove('hidden');
                const tabButton = document.getElementById('tab-' + tabName);
                tabButton.classList.remove('border-transparent', 'text-gray-500');
                tabButton.classList.add('border-blue-500', 'text-blue-600');
                
                currentTab = tabName;
            }
            
            function showCreateCapsuleForm() {
                document.getElementById('create-capsule-modal').classList.remove('hidden');
                document.getElementById('create-capsule-modal').classList.add('flex');
            }
            
            function hideCreateCapsuleForm() {
                document.getElementById('create-capsule-modal').classList.add('hidden');
                document.getElementById('create-capsule-modal').classList.remove('flex');
                document.getElementById('create-capsule-form').reset();
            }
            
            function showReplyForm(capsuleId) {
                document.getElementById('reply-capsule-id').value = capsuleId;
                document.getElementById('reply-modal').classList.remove('hidden');
                document.getElementById('reply-modal').classList.add('flex');
            }
            
            function hideReplyForm() {
                document.getElementById('reply-modal').classList.add('hidden');
                document.getElementById('reply-modal').classList.remove('flex');
                document.getElementById('reply-form').reset();
            }
            
            async function handleCreateCapsule(event) {
                event.preventDefault();
                
                const formData = new FormData(event.target);
                const data = {
                    location_id: formData.get('location_id'),
                    title: formData.get('title'),
                    content: formData.get('content'),
                    photo_url: formData.get('photo_url'),
                    capsule_type: 'memory'
                };
                
                try {
                    const response = await fetch('/api/penghu-game/memory-capsules', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (window.showToast) window.showToast(result.message || '記憶膠囊創建成功！', 'success');
                        else alert(result.message || '記憶膠囊創建成功！');
                        hideCreateCapsuleForm();
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        const error = await response.json();
                        if (window.showToast) window.showToast('創建失敗: ' + (error.error || '未知錯誤'), 'error');
                        else alert('創建失敗: ' + (error.error || '未知錯誤'));
                    }
                } catch (error) {
                    console.error('創建記憶膠囊失敗:', error);
                    if (window.showToast) window.showToast('創建失敗: ' + error.message, 'error');
                    else alert('創建失敗: ' + error.message);
                }
            }
            
            async function handleReply(event) {
                event.preventDefault();
                
                const formData = new FormData(event.target);
                const capsuleId = formData.get('capsule_id');
                const data = {
                    reply_content: formData.get('reply_content')
                };
                
                try {
                    const response = await fetch(\`/api/penghu-game/memory-capsules/\${capsuleId}/reply\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (window.showToast) window.showToast(result.message || '回覆成功！', 'success');
                        else alert(result.message || '回覆成功！');
                        hideReplyForm();
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        const error = await response.json();
                        if (window.showToast) window.showToast('回覆失敗: ' + (error.error || '未知錯誤'), 'error');
                        else alert('回覆失敗: ' + (error.error || '未知錯誤'));
                    }
                } catch (error) {
                    console.error('回覆失敗:', error);
                    if (window.showToast) window.showToast('回覆失敗: ' + error.message, 'error');
                    else alert('回覆失敗: ' + error.message);
                }
            }
            
            async function updateRole(role) {
                try {
                    const response = await fetch('/api/penghu-game/role', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ role })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (window.showToast) window.showToast(result.message || '角色更新成功！', 'success');
                        else alert(result.message || '角色更新成功！');
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        const error = await response.json();
                        if (window.showToast) window.showToast('角色更新失敗: ' + (error.error || '未知錯誤'), 'error');
                        else alert('角色更新失敗: ' + (error.error || '未知錯誤'));
                    }
                } catch (error) {
                    console.error('角色更新失敗:', error);
                    if (window.showToast) window.showToast('角色更新失敗: ' + error.message, 'error');
                    else alert('角色更新失敗: ' + error.message);
                }
            }
        </script>
    `;

    return new Response(pageTemplate({
        title: '澎湖時光島主 - 遊戲',
        content,
        user,
        nonce,
        cssContent
    }), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
}
