// HOPENGHU好澎湖 v2.0 JavaScript

class HopenghuApp {
    constructor() {
        this.currentUser = null;
        this.friends = [];
        this.content = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.loadFriendsData();
        this.loadContentData();
    }

    setupEventListeners() {
        // 導航功能
        this.setupNavigation();
        
        // 登入功能
        this.setupLogin();
        
        // 上傳功能
        this.setupUpload();
        
        // 社交互動
        this.setupSocialInteractions();
        
        // 篩選和搜索
        this.setupFilters();
        
        // 通知系統
        this.setupNotifications();
    }

    setupNavigation() {
        // 移動端導航切換
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // 平滑滾動
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupLogin() {
        const loginBtn = document.getElementById('loginBtn');
        const loginModal = document.getElementById('loginModal');
        const closeLoginModal = document.getElementById('closeLoginModal');
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        const facebookLoginBtn = document.getElementById('facebookLoginBtn');

        if (loginBtn && loginModal) {
            loginBtn.addEventListener('click', () => {
                this.showModal(loginModal);
            });
        }

        if (closeLoginModal && loginModal) {
            closeLoginModal.addEventListener('click', () => {
                this.hideModal(loginModal);
            });
        }

        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                this.loginWithProvider('Google');
            });
        }

        if (facebookLoginBtn) {
            facebookLoginBtn.addEventListener('click', () => {
                this.loginWithProvider('Facebook');
            });
        }
    }

    setupUpload() {
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadModal = document.getElementById('uploadModal');
        const closeUploadModal = document.getElementById('closeUploadModal');
        const selectPhotosBtn = document.getElementById('selectPhotosBtn');
        const photoUpload = document.getElementById('photoUpload');
        const shareBtn = document.getElementById('shareBtn');

        if (uploadBtn && uploadModal) {
            uploadBtn.addEventListener('click', () => {
                this.showModal(uploadModal);
            });
        }

        if (closeUploadModal && uploadModal) {
            closeUploadModal.addEventListener('click', () => {
                this.hideModal(uploadModal);
            });
        }

        if (selectPhotosBtn && photoUpload) {
            selectPhotosBtn.addEventListener('click', () => {
                photoUpload.click();
            });
        }

        if (photoUpload) {
            photoUpload.addEventListener('change', (e) => {
                this.handlePhotoSelection(e);
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareContent();
            });
        }
    }

    setupSocialInteractions() {
        // 點讚功能
        document.addEventListener('click', (e) => {
            if (e.target.closest('.like-btn')) {
                this.handleLike(e.target.closest('.like-btn'));
            }
        });

        // 評論功能
        document.addEventListener('click', (e) => {
            if (e.target.closest('.comment-btn')) {
                this.handleComment(e.target.closest('.comment-btn'));
            }
        });

        // 分享功能
        document.addEventListener('click', (e) => {
            if (e.target.closest('.share-btn')) {
                this.handleShare(e.target.closest('.share-btn'));
            }
        });

        // 關注功能
        document.addEventListener('click', (e) => {
            if (e.target.closest('.follow-btn')) {
                this.handleFollow(e.target.closest('.follow-btn'));
            }
        });
    }

    setupFilters() {
        const relevanceFilter = document.getElementById('relevanceFilter');
        const memoryFilter = document.getElementById('memoryFilter');
        const sortFilter = document.getElementById('sortFilter');

        [relevanceFilter, memoryFilter, sortFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });
    }

    setupNotifications() {
        // 創建通知容器
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }
    }

    // 用戶數據管理
    loadUserData() {
        const savedUser = localStorage.getItem('hopenghu_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUserInterface();
        }
    }

    saveUserData() {
        if (this.currentUser) {
            localStorage.setItem('hopenghu_user', JSON.stringify(this.currentUser));
        }
    }

    // 朋友數據管理
    loadFriendsData() {
        const savedFriends = localStorage.getItem('hopenghu_friends');
        if (savedFriends) {
            this.friends = JSON.parse(savedFriends);
        } else {
            // 默認朋友數據
            this.friends = [
                {
                    id: 1,
                    name: '小美',
                    relevance: 95,
                    memories: 5,
                    avatar: '小美',
                    description: '在七美雙心石滬看夕陽，是我最美好的回憶！',
                    tags: ['七美', '夕陽', '攝影'],
                    followed: false
                },
                {
                    id: 2,
                    name: '阿明',
                    relevance: 87,
                    memories: 3,
                    avatar: '阿明',
                    description: '澎湖的海鮮真的超新鮮！',
                    tags: ['海鮮', '美食', '餐廳'],
                    followed: false
                },
                {
                    id: 3,
                    name: '小華',
                    relevance: 92,
                    memories: 4,
                    avatar: '小華',
                    description: '澎湖的風景太美了，每一張照片都是藝術品！',
                    tags: ['攝影', '風景', '藝術'],
                    followed: false
                }
            ];
            this.saveFriendsData();
        }
    }

    saveFriendsData() {
        localStorage.setItem('hopenghu_friends', JSON.stringify(this.friends));
    }

    // 內容數據管理
    loadContentData() {
        const savedContent = localStorage.getItem('hopenghu_content');
        if (savedContent) {
            this.content = JSON.parse(savedContent);
        } else {
            // 默認內容數據
            this.content = [
                {
                    id: 1,
                    author: '小美',
                    authorId: 1,
                    relevance: 95,
                    description: '在七美雙心石滬看夕陽，是我最美好的回憶！我們都在這裡看過夕陽呢！',
                    tags: ['七美', '夕陽'],
                    likes: 12,
                    comments: 3,
                    shares: 0,
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小時前
                    liked: false
                },
                {
                    id: 2,
                    author: '阿明',
                    authorId: 2,
                    relevance: 87,
                    description: '澎湖的海鮮真的超新鮮！推薦大家一定要試試這家餐廳！',
                    tags: ['海鮮', '美食'],
                    likes: 8,
                    comments: 5,
                    shares: 0,
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小時前
                    liked: false
                }
            ];
            this.saveContentData();
        }
    }

    saveContentData() {
        localStorage.setItem('hopenghu_content', JSON.stringify(this.content));
    }

    // 登入功能
    loginWithProvider(provider) {
        // 模擬登入
        this.currentUser = {
            id: Date.now(),
            name: '澎湖愛好者',
            email: `user@${provider.toLowerCase()}.com`,
            provider: provider,
            avatar: '我',
            joinDate: new Date()
        };

        this.saveUserData();
        this.updateUserInterface();
        this.hideModal(document.getElementById('loginModal'));
        this.showNotification(`${provider} 登入成功！`, 'success');
    }

    updateUserInterface() {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn && this.currentUser) {
            loginBtn.innerHTML = '<i class="fas fa-user mr-2"></i>已登入';
            loginBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            loginBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }
    }

    // 上傳功能
    handlePhotoSelection(e) {
        const files = e.target.files;
        const selectPhotosBtn = document.getElementById('selectPhotosBtn');
        
        if (files.length > 0) {
            selectPhotosBtn.textContent = `已選擇 ${files.length} 張照片`;
            selectPhotosBtn.classList.add('bg-green-600', 'hover:bg-green-700');
            selectPhotosBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        }
    }

    shareContent() {
        const description = document.getElementById('photoDescription')?.value || '';
        const location = document.getElementById('locationInput')?.value || '';
        const photoUpload = document.getElementById('photoUpload');
        
        if (description || (photoUpload && photoUpload.files.length > 0)) {
            // 創建新內容
            const newContent = {
                id: Date.now(),
                author: this.currentUser?.name || '匿名用戶',
                authorId: this.currentUser?.id || 0,
                relevance: Math.floor(Math.random() * 30) + 70, // 70-100%
                description: description,
                tags: this.extractTags(description + ' ' + location),
                likes: 0,
                comments: 0,
                shares: 0,
                timestamp: new Date(),
                liked: false
            };

            this.content.unshift(newContent);
            this.saveContentData();
            
            this.showNotification('回憶分享成功！', 'success');
            this.hideModal(document.getElementById('uploadModal'));
            this.resetUploadForm();
            
            // 刷新內容流
            this.refreshContentFeed();
        } else {
            this.showNotification('請至少上傳照片或添加描述', 'error');
        }
    }

    extractTags(text) {
        const commonTags = ['七美', '夕陽', '攝影', '海鮮', '美食', '風景', '澎湖', '跨海大橋', '雙心石滬'];
        const foundTags = commonTags.filter(tag => text.includes(tag));
        return foundTags.slice(0, 3); // 最多3個標籤
    }

    resetUploadForm() {
        const photoDescription = document.getElementById('photoDescription');
        const locationInput = document.getElementById('locationInput');
        const photoUpload = document.getElementById('photoUpload');
        const selectPhotosBtn = document.getElementById('selectPhotosBtn');

        if (photoDescription) photoDescription.value = '';
        if (locationInput) locationInput.value = '';
        if (photoUpload) photoUpload.value = '';
        if (selectPhotosBtn) {
            selectPhotosBtn.textContent = '選擇照片';
            selectPhotosBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            selectPhotosBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }
    }

    // 社交互動
    handleLike(button) {
        const isLiked = button.getAttribute('data-liked') === 'true';
        const likeCount = button.querySelector('.like-count');
        
        if (isLiked) {
            button.setAttribute('data-liked', 'false');
            button.classList.remove('text-red-500');
            button.classList.add('text-gray-500');
            if (likeCount) {
                likeCount.textContent = parseInt(likeCount.textContent) - 1;
            }
        } else {
            button.setAttribute('data-liked', 'true');
            button.classList.add('text-red-500');
            button.classList.remove('text-gray-500');
            if (likeCount) {
                likeCount.textContent = parseInt(likeCount.textContent) + 1;
            }
        }
    }

    handleComment(button) {
        this.showNotification('評論功能開發中...', 'info');
    }

    handleShare(button) {
        this.showNotification('內容已分享！', 'success');
    }

    handleFollow(button) {
        const isFollowed = button.getAttribute('data-followed') === 'true';
        
        if (isFollowed) {
            button.setAttribute('data-followed', 'false');
            button.innerHTML = '<i class="fas fa-user-plus mr-1"></i>關注';
            button.classList.remove('bg-gray-600', 'hover:bg-gray-700');
            button.classList.add('bg-blue-600', 'hover:bg-blue-700');
            this.showNotification('已取消關注', 'info');
        } else {
            button.setAttribute('data-followed', 'true');
            button.innerHTML = '<i class="fas fa-check mr-1"></i>已關注';
            button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            button.classList.add('bg-gray-600', 'hover:bg-gray-700');
            this.showNotification('關注成功！', 'success');
        }
    }

    // 篩選功能
    applyFilters() {
        const relevanceFilter = document.getElementById('relevanceFilter')?.value || 'all';
        const memoryFilter = document.getElementById('memoryFilter')?.value || 'all';
        const sortFilter = document.getElementById('sortFilter')?.value || 'relevance';
        
        const friendsList = document.getElementById('friendsList');
        if (!friendsList) return;
        
        const friendCards = Array.from(friendsList.querySelectorAll('.friend-card'));
        
        // 篩選
        let filteredCards = friendCards.filter(card => {
            const relevance = parseInt(card.getAttribute('data-relevance'));
            const memories = parseInt(card.getAttribute('data-memories'));
            
            let relevanceMatch = true;
            if (relevanceFilter === 'high') relevanceMatch = relevance >= 90;
            else if (relevanceFilter === 'medium') relevanceMatch = relevance >= 70 && relevance < 90;
            else if (relevanceFilter === 'low') relevanceMatch = relevance >= 50 && relevance < 70;
            
            let memoryMatch = true;
            if (memoryFilter === 'location') memoryMatch = memories >= 3;
            else if (memoryFilter === 'time') memoryMatch = memories >= 2;
            else if (memoryFilter === 'interest') memoryMatch = memories >= 1;
            
            return relevanceMatch && memoryMatch;
        });
        
        // 排序
        if (sortFilter === 'relevance') {
            filteredCards.sort((a, b) => parseInt(b.getAttribute('data-relevance')) - parseInt(a.getAttribute('data-relevance')));
        } else if (sortFilter === 'memories') {
            filteredCards.sort((a, b) => parseInt(b.getAttribute('data-memories')) - parseInt(a.getAttribute('data-memories')));
        }
        
        // 重新排列
        friendsList.innerHTML = '';
        filteredCards.forEach(card => {
            friendsList.appendChild(card);
        });
        
        this.showNotification('篩選完成！', 'success');
    }

    // 內容流刷新
    refreshContentFeed() {
        // 這裡可以重新載入內容流
        this.showNotification('內容已更新！', 'success');
    }

    // 模態框管理
    showModal(modal) {
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    // 通知系統
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`;
        notification.textContent = message;

        container.appendChild(notification);

        // 自動移除
        setTimeout(() => {
            notification.remove();
        }, 3000);

        // 點擊移除
        notification.addEventListener('click', () => {
            notification.remove();
        });
    }

    // 工具函數
    formatTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}分鐘前`;
        if (hours < 24) return `${hours}小時前`;
        return `${days}天前`;
    }

    generateRelevanceScore() {
        return Math.floor(Math.random() * 30) + 70; // 70-100%
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    window.hopenghuApp = new HopenghuApp();
});

// 導出供其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HopenghuApp;
}
