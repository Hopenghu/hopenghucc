// 澎湖時光機 - 互動功能

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有功能
    initNavigation();
    initSmoothScrolling();
    initCardAnimations();
    initFormValidation();
    initTooltips();
});

// 導航功能
function initNavigation() {
    // 移動端選單切換
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // 導航連結高亮
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a[href]');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('bg-blue-600', 'text-white');
            link.classList.remove('text-gray-700', 'hover:text-blue-600');
        }
    });
}

// 平滑滾動
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 卡片動畫
function initCardAnimations() {
    const cards = document.querySelectorAll('.card-hover');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// 表單驗證
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    showError(input, '此欄位為必填');
                    isValid = false;
                } else {
                    clearError(input);
                }
            });
            
            if (isValid) {
                showSuccess('表單提交成功！');
                form.reset();
            }
        });
    });
}

// 顯示錯誤訊息
function showError(input, message) {
    clearError(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message text-red-500 text-sm mt-1';
    errorDiv.textContent = message;
    
    input.parentNode.appendChild(errorDiv);
    input.classList.add('border-red-500');
}

// 清除錯誤訊息
function clearError(input) {
    const errorMessage = input.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
    input.classList.remove('border-red-500');
}

// 顯示成功訊息
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// 工具提示
function initTooltips() {
    const tooltips = document.querySelectorAll('.tooltip');
    
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function() {
            const tooltipText = this.querySelector('.tooltiptext');
            if (tooltipText) {
                tooltipText.style.visibility = 'visible';
                tooltipText.style.opacity = '1';
            }
        });
        
        tooltip.addEventListener('mouseleave', function() {
            const tooltipText = this.querySelector('.tooltiptext');
            if (tooltipText) {
                tooltipText.style.visibility = 'hidden';
                tooltipText.style.opacity = '0';
            }
        });
    });
}

// 收藏功能
function toggleFavorite(element, locationId) {
    const isFavorited = element.classList.contains('favorited');
    
    if (isFavorited) {
        element.classList.remove('favorited', 'text-red-500');
        element.classList.add('text-gray-400');
        element.title = '加入收藏';
        showSuccess('已從收藏中移除');
    } else {
        element.classList.add('favorited', 'text-red-500');
        element.classList.remove('text-gray-400');
        element.title = '已收藏';
        showSuccess('已加入收藏');
    }
    
    // 這裡可以添加 AJAX 請求來更新後端數據
    // updateFavoriteStatus(locationId, !isFavorited);
}

// 評分功能
function rateLocation(locationId, rating) {
    const stars = document.querySelectorAll(`[data-location="${locationId}"] .star`);
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('text-yellow-400');
            star.classList.remove('text-gray-300');
        } else {
            star.classList.add('text-gray-300');
            star.classList.remove('text-yellow-400');
        }
    });
    
    showSuccess(`已評分 ${rating} 星`);
    
    // 這裡可以添加 AJAX 請求來更新後端數據
    // updateRating(locationId, rating);
}

// 分享功能
function shareLocation(locationId, title) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: `來看看這個澎湖的景點：${title}`,
            url: window.location.href
        });
    } else {
        // 複製連結到剪貼板
        navigator.clipboard.writeText(window.location.href).then(() => {
            showSuccess('連結已複製到剪貼板');
        });
    }
}

// 載入更多內容
function loadMoreContent(containerId, page = 1) {
    const container = document.getElementById(containerId);
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-spinner mx-auto my-4';
    container.appendChild(loadingDiv);
    
    // 模擬載入延遲
    setTimeout(() => {
        loadingDiv.remove();
        // 這裡可以添加載入更多內容的邏輯
        showSuccess('已載入更多內容');
    }, 1000);
}

// 搜尋功能
function searchLocations(query) {
    if (!query.trim()) return;
    
    const locations = document.querySelectorAll('.location-card');
    const results = [];
    
    locations.forEach(location => {
        const title = location.querySelector('.location-title')?.textContent.toLowerCase();
        const description = location.querySelector('.location-description')?.textContent.toLowerCase();
        const tags = location.querySelectorAll('.tag');
        
        let matches = false;
        if (title && title.includes(query.toLowerCase())) matches = true;
        if (description && description.includes(query.toLowerCase())) matches = true;
        
        tags.forEach(tag => {
            if (tag.textContent.toLowerCase().includes(query.toLowerCase())) {
                matches = true;
            }
        });
        
        if (matches) {
            results.push(location);
            location.style.display = 'block';
        } else {
            location.style.display = 'none';
        }
    });
    
    if (results.length === 0) {
        showSuccess('沒有找到相關結果');
    }
}

// 圖片預覽
function previewImage(imageUrl, title) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="max-w-4xl max-h-full p-4">
            <img src="${imageUrl}" alt="${title}" class="max-w-full max-h-full object-contain rounded-lg">
            <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300">×</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 地圖功能（需要 Google Maps API）
function initMap() {
    if (typeof google === 'undefined') {
        console.warn('Google Maps API 未載入');
        return;
    }
    
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    const map = new google.maps.Map(mapElement, {
        zoom: 10,
        center: { lat: 23.5, lng: 119.5 }, // 澎湖座標
        mapTypeId: 'terrain'
    });
    
    // 添加標記點
    const locations = [
        { lat: 23.5, lng: 119.5, title: '七美雙心石滬' },
        { lat: 23.6, lng: 119.4, title: '澎湖跨海大橋' },
        { lat: 23.4, lng: 119.6, title: '吉貝沙尾' }
    ];
    
    locations.forEach(location => {
        new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: location.title
        });
    });
}

// 工具函數
const utils = {
    // 格式化日期
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // 格式化時間
    formatTime: (date) => {
        return new Date(date).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // 截斷文字
    truncateText: (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    // 生成隨機ID
    generateId: () => {
        return Math.random().toString(36).substr(2, 9);
    }
};
