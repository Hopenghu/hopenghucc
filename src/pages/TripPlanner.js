/**
 * Trip Planner Page - 行程規劃頁面
 * 基於 add-place 頁面，支援多選地標和拖拽排序
 */

import { pageTemplate } from '../components/layout.js';
import { SecurityService } from '../services/SecurityService.js';

export async function renderTripPlannerPage(request, env, session, user, nonce, cssContent) {
  // 需要登入才能使用行程規劃功能
  if (!user) {
    return Response.redirect(new URL(request.url).origin + '/login', 302);
  }

  const url = new URL(request.url);
  
  const content = `
    <div class="bg-white w-full h-full flex flex-col overflow-hidden">
        <h1 class="text-2xl font-bold mb-4 text-gray-800 flex-shrink-0 hidden">行程規劃</h1>

        <!-- Header Controls -->
        <div class="p-4 flex-shrink-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between">
            <div class="flex items-center gap-4">
                <button id="add-day-btn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    + 新增一天
                </button>
                <div class="flex gap-2" id="day-tabs">
                    <!-- 天數標籤會動態生成 -->
                </div>
            </div>
            <div class="text-sm text-gray-600">
                已選 <span id="selected-count">0</span> 個地點
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex flex-col md:flex-row flex-grow min-h-0 relative overflow-hidden trip-planner-main-area">
            <!-- Map Container -->
            <div id="map-container" class="w-full md:w-3/4 relative trip-planner-map-container">
                <div id="map" class="trip-planner-map"></div>
                <div id="map-message-area" class="absolute bottom-4 left-4 text-sm text-gray-500 bg-white bg-opacity-90 px-2 py-1 rounded shadow-sm z-20">
                    點擊地圖上的圖示以選擇地標加入行程
                </div>
            </div>

            <!-- Trip Panel (右側/下方) -->
            <div id="trip-panel" class="w-full md:w-1/4 h-full bg-white border-l border-gray-200 flex flex-col transform transition-all duration-300 ease-in-out">
                <div class="p-4 border-b border-gray-100 flex-shrink-0">
                    <h2 class="text-lg font-semibold text-gray-800">行程規劃</h2>
                    <p class="text-sm text-gray-500 mt-1">拖拽調整順序和時間</p>
                </div>

                    <!-- Current Day Selector -->
                    <div class="px-4 py-2 border-b border-gray-100 flex-shrink-0">
                        <label for="current-day-date" class="text-sm font-medium text-gray-700">選擇日期：</label>
                        <input type="date" id="current-day-date" name="current-day-date" class="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm">
                    </div>

                <!-- Trip Items List (可拖拽) -->
                <div id="trip-items-list" class="flex-grow overflow-y-auto p-4 space-y-3">
                    <div id="empty-state" class="text-center text-gray-400 py-8">
                        <p>尚未選擇任何地點</p>
                        <p class="text-sm mt-2">點擊地圖上的圖示開始規劃</p>
                    </div>
                    <!-- 行程項目會動態插入這裡 -->
                </div>

                    <!-- Action Buttons -->
                    <div class="flex-shrink-0 border-t border-gray-100 bg-white p-4 space-y-2">
                        <button id="save-trip-btn" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors" disabled>
                            儲存行程
                        </button>
                        <button id="share-trip-btn" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors" disabled>
                            分享行程
                        </button>
                    </div>
            </div>
        </div>
    </div>

    <style nonce="${nonce}">
        /* Map Container Styles */
        .trip-planner-main-area {
            height: calc(100vh - 128px - 60px);
        }
        
        #map-container {
            height: 100%;
            min-height: 400px;
        }
        
        .trip-planner-map {
            width: 100%;
            height: 100%;
            min-height: 400px;
            background-color: #e5e7eb;
            position: relative;
        }
        
        /* Loading indicator for map */
        .trip-planner-map::before {
            content: '載入地圖中...';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #6b7280;
            font-size: 14px;
            z-index: 1;
        }

        /* Trip Item Styles */
        .trip-item {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            cursor: move;
            transition: all 0.2s;
            position: relative;
        }

        .trip-item:hover {
            border-color: #3b82f6;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }

        .trip-item.dragging {
            opacity: 0.5;
            border-color: #3b82f6;
        }

        .trip-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .trip-item-name {
            font-weight: 600;
            color: #1f2937;
            flex: 1;
        }

        .trip-item-time {
            font-size: 0.875rem;
            color: #6b7280;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .trip-item-actions {
            display: flex;
            gap: 4px;
        }

        .trip-item-btn {
            padding: 4px 8px;
            border: none;
            background: #f3f4f6;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.75rem;
        }

        .trip-item-btn:hover {
            background: #e5e7eb;
        }

        .trip-item-btn.delete {
            color: #ef4444;
        }

        .time-input {
            width: 80px;
            padding: 4px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 0.875rem;
        }

        /* Day Tab Styles */
        .day-tab {
            padding: 6px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s;
        }

        .day-tab:hover {
            background: #f3f4f6;
        }

        .day-tab.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }

        /* Drag and Drop Indicators */
        .drag-over {
            border-top: 3px solid #3b82f6;
        }

        /* Location Detail Panel */
        .location-detail-panel {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            display: none;
            pointer-events: none;
        }

        .location-detail-panel.visible {
            display: block;
            pointer-events: all;
        }

        .detail-panel-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
        }

        .detail-panel-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .detail-panel-close {
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 10;
            background: white;
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s;
        }

        .detail-panel-close:hover {
            background: #f3f4f6;
            transform: scale(1.1);
        }

        .detail-panel-image {
            width: 100%;
            height: 200px;
            overflow: hidden;
            position: relative;
        }

        .detail-panel-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .detail-panel-info {
            padding: 20px;
        }

        .detail-panel-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 12px;
        }

        .detail-panel-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #6b7280;
            font-size: 14px;
        }

        .meta-item svg {
            flex-shrink: 0;
        }

        .meta-item a {
            color: #3b82f6;
            text-decoration: none;
        }

        .meta-item a:hover {
            text-decoration: underline;
        }

        .detail-panel-description,
        .detail-panel-booking {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
        }

        .detail-panel-description h3,
        .detail-panel-booking h3 {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }

        .detail-panel-description p {
            color: #4b5563;
            line-height: 1.6;
        }

        /* Clickable location name */
        .clickable-location-name {
            cursor: pointer;
        }

        /* Clipboard fallback textarea */
        .clipboard-fallback-textarea {
            position: fixed;
            left: -9999px;
            top: 0;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
            #trip-panel {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 50vh;
                transform: translateY(100%);
                z-index: 50;
                border-left: none;
                border-top: 2px solid #e5e7eb;
            }

            #trip-panel.show {
                transform: translateY(0);
            }

            #map-container {
                width: 100% !important;
            }

            .detail-panel-content {
                width: 95%;
                max-height: 90vh;
            }
        }
    </style>

    <script nonce="${nonce}">
        // 全局錯誤處理：靜默處理 Google Maps Directions API 錯誤
        (function() {
            // 處理未捕獲的 Promise 錯誤（包括 Directions API 錯誤）
            window.addEventListener('unhandledrejection', (event) => {
                const errorSource = event.reason?.stack || event.reason?.message || String(event.reason || '');
                const errorString = errorSource.toLowerCase();
                
                // 檢查是否是 Directions API 相關錯誤
                if (errorString.includes('directions') || 
                    errorString.includes('request_denied') ||
                    errorString.includes('mapsrequesterror') ||
                    (errorString.includes('route') && errorString.includes('denied'))) {
                    event.preventDefault(); // 阻止錯誤顯示在控制台
                    return; // 靜默忽略
                }
            });
            
            // 處理未捕獲的同步錯誤
            window.addEventListener('error', (event) => {
                const errorSource = (event.filename || event.message || '').toLowerCase();
                const errorMessage = (event.message || '').toLowerCase();
                
                // 檢查是否是 Directions API 相關錯誤
                if (errorSource.includes('directions') || 
                    errorMessage.includes('directions') ||
                    errorSource.includes('request_denied') ||
                    errorMessage.includes('request_denied') ||
                    errorSource.includes('mapsrequesterror') ||
                    errorMessage.includes('mapsrequesterror')) {
                    event.preventDefault(); // 阻止錯誤顯示在控制台
                    return; // 靜默忽略
                }
            });
        })();
        
        // TripPlanner 類別 - 物件導向架構
        class TripPlanner {
            constructor() {
                this.mapsApiKey = null;
                this.map = null;
                this.selectedPlaces = []; // Array of { placeId, placeData, dayIndex, time, order, bookingStatus, bookingUrl, bookingPhone, bookingNotes, itemId }
                this.currentDayIndex = 0;
                this.days = [new Date()]; // Array of Date objects
                this.markers = []; // Map markers
                this.draggedElement = null;
                this.dragOverElement = null;
                this.currentTripId = null; // 當前行程 ID（用於更新）
                this.shareToken = null; // 分享令牌
                this.directionsService = null; // 路線服務
                this.directionsRenderer = null; // 路線渲染器
                this.routePolylines = []; // 路線多邊形
                this.directionsApiDenied = false; // Directions API 是否被拒絕
            }

            // 初始化地圖
            async initMap() {
                try {
                    const configResponse = await fetch('/api/maps/config');
                    if (!configResponse.ok) {
                        throw new Error('Failed to fetch Maps config');
                    }
                    const config = await configResponse.json();
                    this.mapsApiKey = config.apiKey;
                    if (!this.mapsApiKey) {
                        throw new Error('Maps API Key not provided');
                    }

                    // 檢查是否已經載入
                    if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
                        console.log('Google Maps API already loaded');
                        this.initializeMap();
                        return;
                    }

                    const script = document.createElement('script');
                    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.mapsApiKey + '&libraries=places&loading=async';
                    script.async = true;
                    script.defer = true;

                    // 使用輪詢檢查 API 是否已載入
                    script.onload = () => {
                        console.log('Google Maps API script loaded');
                        // 輪詢檢查直到 API 完全載入
                        const checkApiReady = () => {
                            if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
                                console.log('Google Maps API is ready');
                                this.initializeMap();
                            } else {
                                // 如果 5 秒後還沒載入，顯示錯誤
                                setTimeout(() => {
                                    if (typeof google === 'undefined' || !google.maps || !google.maps.Map) {
                                        console.error('Google Maps API failed to initialize');
                                        this.showMessage('錯誤：Google Maps API 載入超時', 'error');
                                    }
                                }, 5000);
                                // 繼續檢查
                                setTimeout(checkApiReady, 100);
                            }
                        };
                        // 開始檢查（給一點時間讓 API 初始化）
                        setTimeout(checkApiReady, 200);
                    };

                    script.onerror = () => {
                        console.error('Failed to load Google Maps API');
                        this.showMessage('錯誤：無法載入 Google Maps API', 'error');
                    };

                    document.head.appendChild(script);
                } catch (error) {
                    console.error('Error initializing map:', error);
                    this.showMessage('錯誤：無法開始載入地圖', 'error');
                }
            }

            // 初始化地圖實例
            initializeMap() {
                // 確保 Google Maps API 已完全載入
                if (typeof google === 'undefined' || !google.maps || !google.maps.Map) {
                    console.error('Google Maps API not ready');
                    this.showMessage('錯誤：Google Maps API 尚未載入完成', 'error');
                    // 重試
                    setTimeout(() => {
                        if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
                            this.initializeMap();
                        }
                    }, 500);
                    return;
                }

                const initialCenter = { lat: 23.5687, lng: 119.5775 }; // 澎湖中心
                const mapDiv = document.getElementById('map');
                
                if (!mapDiv) {
                    console.error('Map container not found');
                    return;
                }

                try {
                    // 地圖元素已經通過 CSS 類設置了樣式，不需要 inline style
                    this.map = new google.maps.Map(mapDiv, {
                        center: initialCenter,
                        zoom: 12,
                        mapTypeControl: false,
                        clickableIcons: true
                    });

                    // 觸發 resize 事件確保地圖正確渲染
                    setTimeout(() => {
                        if (this.map && google && google.maps) {
                            google.maps.event.trigger(this.map, 'resize');
                            // 重新設置中心點確保地圖正確顯示
                            this.map.setCenter(initialCenter);
                            console.log('Map initialized and resized');
                        }
                    }, 200);

                    // 監聽地圖上的 POI 點擊
                    this.map.addListener('click', (event) => {
                        if (event.placeId) {
                            event.stop();
                            this.handlePoiClick(event.placeId);
                        }
                    });

                    console.log('Map initialized successfully');
                } catch (error) {
                    console.error('Error creating map:', error);
                    this.showMessage('錯誤：無法建立地圖 - ' + error.message, 'error');
                    return;
                }

                    // 路線服務將在首次使用時初始化（延遲初始化以避免 API 權限問題）

                    // 初始化 UI
                    this.initializeDays();
                    this.updateDayTabs();
                    this.updateTripPanel();
            }

            // 處理 POI 點擊
            async handlePoiClick(placeId) {
                try {
                    const response = await fetch('/api/locations/details-by-placeid/' + placeId);
                    if (!response.ok) {
                        throw new Error('Failed to fetch place details');
                    }

                    const placeData = await response.json();
                    
                    // 檢查是否已經選過
                    const existingIndex = this.selectedPlaces.findIndex(p => p.placeId === placeId);
                    if (existingIndex >= 0) {
                        this.showMessage('此地點已在行程中', 'warning');
                        return;
                    }

                    // 添加到當前日期
                    const newPlace = {
                        placeId: placeId,
                        placeData: placeData,
                        dayIndex: this.currentDayIndex,
                        time: this.getDefaultTime(),
                        order: this.selectedPlaces.filter(p => p.dayIndex === this.currentDayIndex).length,
                        bookingStatus: 'planned',
                        bookingUrl: placeData.website || null,
                        bookingPhone: placeData.phone_number || placeData.formatted_phone_number || null,
                        bookingNotes: null,
                        itemId: null
                    };

                    this.selectedPlaces.push(newPlace);
                    
                    // 在地圖上添加標記
                    this.addMarker(placeData, newPlace);
                    
                    // 更新 UI
                    this.updateTripPanel();
                    this.updateSelectedCount();
                    this.updateSaveButton();
                    this.showMessage('已加入行程', 'success');
                } catch (error) {
                    console.error('Error handling POI click:', error);
                    this.showMessage('無法載入地點資訊', 'error');
                }
            }

            // 添加地圖標記
            addMarker(placeData, place) {
                if (!placeData.latitude || !placeData.longitude) return;

                const position = { lat: placeData.latitude, lng: placeData.longitude };
                const markerNumber = this.getMarkerNumber(place);
                
                // 注意：google.maps.Marker 已棄用，建議使用 AdvancedMarkerElement
                // 但為了兼容性，暫時繼續使用 Marker
                // TODO: 遷移到 google.maps.marker.AdvancedMarkerElement
                const marker = new google.maps.Marker({
                    position: position,
                    map: this.map,
                    title: placeData.name,
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                            '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
                            '<circle cx="16" cy="16" r="12" fill="#3b82f6" stroke="white" stroke-width="2"/>' +
                            '<text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">' +
                            markerNumber + '</text></svg>'
                        ),
                        scaledSize: new google.maps.Size(32, 32),
                        anchor: new google.maps.Point(16, 16)
                    }
                });

                // 添加點擊事件顯示詳情
                marker.addListener('click', () => {
                    this.showLocationDetail(placeData, place);
                });

                this.markers.push({ marker, place });
                this.updateMarkerNumbers();
            }

            // 獲取標記編號（根據當前天數的順序）
            getMarkerNumber(place) {
                const currentDayPlaces = this.selectedPlaces
                    .filter(p => p.dayIndex === place.dayIndex)
                    .sort((a, b) => {
                        if (a.time !== b.time) {
                            return a.time.localeCompare(b.time);
                        }
                        return a.order - b.order;
                    });
                const index = currentDayPlaces.findIndex(p => p.placeId === place.placeId);
                return index >= 0 ? index + 1 : this.selectedPlaces.length;
            }

            // 更新所有標記的編號
            updateMarkerNumbers() {
                this.markers.forEach(({ marker, place }) => {
                    const markerNumber = this.getMarkerNumber(place);
                    marker.setIcon({
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                            '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
                            '<circle cx="16" cy="16" r="12" fill="#3b82f6" stroke="white" stroke-width="2"/>' +
                            '<text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">' +
                            markerNumber + '</text></svg>'
                        ),
                        scaledSize: new google.maps.Size(32, 32),
                        anchor: new google.maps.Point(16, 16)
                    });
                });
            }

            // 初始化天數
            initializeDays() {
                const today = new Date();
                this.days = [today];
                this.currentDayIndex = 0;
            }

            // 更新天數標籤
            updateDayTabs() {
                const tabsContainer = document.getElementById('day-tabs');
                if (!tabsContainer) return;

                tabsContainer.innerHTML = this.days.map((day, index) => {
                    const dateStr = this.formatDate(day);
                    const isActive = index === this.currentDayIndex;
                    return \`
                        <button class="day-tab \${isActive ? 'active' : ''}" 
                                data-day-index="\${index}"
                                data-action="switch-day">
                            第 \${index + 1} 天<br>
                            <span class="text-xs">\${dateStr}</span>
                        </button>
                    \`;
                }).join('');
                
                // 綁定天數切換事件
                tabsContainer.querySelectorAll('[data-action="switch-day"]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const dayIndex = parseInt(e.target.closest('[data-day-index]').dataset.dayIndex);
                        this.switchDay(dayIndex);
                    });
                });
            }

            // 切換天數
            switchDay(dayIndex) {
                this.currentDayIndex = dayIndex;
                this.updateDayTabs();
                this.updateTripPanel();
                this.updateRoute(); // 更新路線
                
                // 更新日期選擇器
                const dateInput = document.getElementById('current-day-date');
                if (dateInput) {
                    dateInput.value = this.formatDateInput(this.days[dayIndex]);
                }
            }

            // 新增一天
            addDay() {
                const lastDay = this.days[this.days.length - 1];
                const newDay = new Date(lastDay);
                newDay.setDate(newDay.getDate() + 1);
                this.days.push(newDay);
                this.updateDayTabs();
            }

            // 更新行程面板
            updateTripPanel() {
                const listContainer = document.getElementById('trip-items-list');
                if (!listContainer) return;

                const currentDayPlaces = this.selectedPlaces
                    .filter(p => p.dayIndex === this.currentDayIndex)
                    .sort((a, b) => {
                        // 先按時間排序，再按順序排序
                        if (a.time !== b.time) {
                            return a.time.localeCompare(b.time);
                        }
                        return a.order - b.order;
                    });

                if (currentDayPlaces.length === 0) {
                    listContainer.innerHTML = \`
                        <div id="empty-state" class="text-center text-gray-400 py-8">
                            <p>尚未選擇任何地點</p>
                            <p class="text-sm mt-2">點擊地圖上的圖示開始規劃</p>
                        </div>
                    \`;
                    return;
                }

                listContainer.innerHTML = currentDayPlaces.map((place, index) => {
                    const placeData = place.placeData;
                    const bookingStatus = place.bookingStatus || 'planned';
                    const statusLabels = {
                        'planned': { text: '已規劃', class: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
                        'booked': { text: '已預訂', class: 'bg-green-100 text-green-800', icon: '🟢' },
                        'completed': { text: '已完成', class: 'bg-blue-100 text-blue-800', icon: '✅' },
                        'cancelled': { text: '已取消', class: 'bg-red-100 text-red-800', icon: '🔴' }
                    };
                    const statusInfo = statusLabels[bookingStatus] || statusLabels['planned'];
                    
                    return \`
                        <div class="trip-item" 
                             draggable="true"
                             data-place-id="\${place.placeId}"
                             data-day-index="\${place.dayIndex}"
                             data-order="\${place.order}">
                            <div class="trip-item-header">
                                <div class="trip-item-name clickable-location-name" 
                                     data-place-id="\${place.placeId}"
                                     data-action="show-location-detail">
                                    \${placeData.name || '未知地點'}
                                </div>
                                <div class="trip-item-actions">
                                    <input type="time" 
                                           id="time-input-\${place.placeId}"
                                           name="time-input-\${place.placeId}"
                                           class="time-input" 
                                           value="\${place.time}"
                                           data-place-id="\${place.placeId}"
                                           data-action="update-time">
                                    <button type="button" 
                                            class="trip-item-btn delete" 
                                            data-place-id="\${place.placeId}"
                                            data-action="remove-place">
                                        刪除
                                    </button>
                                </div>
                            </div>
                            <div class="trip-item-time">
                                <span>\${placeData.address || '無地址'}</span>
                            </div>
                            <div class="trip-item-booking mt-2 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="booking-status-badge \${statusInfo.class} px-2 py-1 rounded text-xs">
                                        \${statusInfo.icon} \${statusInfo.text}
                                    </span>
                                    <select id="booking-status-\${place.placeId}"
                                            name="booking-status-\${place.placeId}"
                                            class="booking-status-select text-xs border rounded px-2 py-1"
                                            data-place-id="\${place.placeId}"
                                            data-action="update-booking-status">
                                        <option value="planned" \${bookingStatus === 'planned' ? 'selected' : ''}>已規劃</option>
                                        <option value="booked" \${bookingStatus === 'booked' ? 'selected' : ''}>已預訂</option>
                                        <option value="completed" \${bookingStatus === 'completed' ? 'selected' : ''}>已完成</option>
                                        <option value="cancelled" \${bookingStatus === 'cancelled' ? 'selected' : ''}>已取消</option>
                                    </select>
                                </div>
                                <div class="flex items-center gap-2">
                                    \${place.bookingPhone ? \`
                                        <a href="tel:\${place.bookingPhone}" 
                                           class="trip-item-btn text-xs bg-blue-500 text-white hover:bg-blue-600">
                                            電話
                                        </a>
                                    \` : ''}
                                    \${place.bookingUrl ? \`
                                        <a href="\${place.bookingUrl}" 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           class="trip-item-btn text-xs bg-green-500 text-white hover:bg-green-600">
                                            網站
                                        </a>
                                    \` : ''}
                                </div>
                            </div>
                        </div>
                    \`;
                }).join('');
                
                // 綁定所有事件監聽器
                this.attachTripItemEventListeners(listContainer);
                
                // 更新路線
                this.updateRoute();
            }

            // 綁定行程項目的事件監聽器
            attachTripItemEventListeners(container) {
                // 綁定拖拽事件
                container.querySelectorAll('.trip-item').forEach(item => {
                    item.addEventListener('dragstart', (e) => this.handleDragStart(e));
                    item.addEventListener('dragend', (e) => this.handleDragEnd(e));
                    item.addEventListener('dragover', (e) => this.handleDragOver(e));
                    item.addEventListener('drop', (e) => this.handleDrop(e));
                    item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                });

                // 綁定時間輸入事件
                container.querySelectorAll('[data-action="update-time"]').forEach(input => {
                    input.addEventListener('change', (e) => {
                        const placeId = e.target.dataset.placeId;
                        const newTime = e.target.value;
                        this.updateTime(placeId, newTime);
                    });
                });

                // 綁定刪除按鈕事件
                container.querySelectorAll('[data-action="remove-place"]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const placeId = e.target.closest('[data-place-id]').dataset.placeId;
                        this.removePlace(placeId);
                    });
                });

                // 綁定預訂狀態選擇事件
                container.querySelectorAll('[data-action="update-booking-status"]').forEach(select => {
                    select.addEventListener('change', (e) => {
                        const placeId = e.target.dataset.placeId;
                        const newStatus = e.target.value;
                        this.updateBookingStatus(placeId, newStatus);
                    });
                });

                // 綁定地點詳情點擊事件
                container.querySelectorAll('[data-action="show-location-detail"]').forEach(element => {
                    element.addEventListener('click', (e) => {
                        const placeId = e.target.closest('[data-place-id]').dataset.placeId;
                        const place = this.selectedPlaces.find(p => p.placeId === placeId);
                        if (place) {
                            this.showLocationDetail(place.placeData, place);
                        }
                    });
                });
            }

            // 顯示地點詳情
            showLocationDetail(placeData, place) {
                // 創建或更新詳情面板
                let panel = document.getElementById('location-detail-panel');
                if (!panel) {
                    panel = document.createElement('div');
                    panel.id = 'location-detail-panel';
                    panel.className = 'location-detail-panel';
                    document.body.appendChild(panel);
                }

                panel.innerHTML = \`
                    <div class="detail-panel-overlay" data-action="close-detail"></div>
                    <div class="detail-panel-content">
                        <button class="detail-panel-close" data-action="close-detail">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                        <div class="detail-panel-image">
                            <img src="\${placeData.thumbnail_url || 'https://placehold.co/600x400/6B7280/FFFFFF?text=Location+Image'}" 
                                 alt="\${placeData.name || '地點照片'}" 
                                 class="detail-panel-img"
                                 data-fallback-src="https://placehold.co/600x400/6B7280/FFFFFF?text=Location+Image">
                        </div>
                        <div class="detail-panel-info">
                            <h2 class="detail-panel-title">\${placeData.name || '未命名地點'}</h2>
                            <div class="detail-panel-meta">
                                <div class="meta-item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    <span>\${placeData.address || '無地址資訊'}</span>
                                </div>
                                \${placeData.phone_number || placeData.formatted_phone_number ? \`
                                    <div class="meta-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                        </svg>
                                        <span>\${placeData.formatted_phone_number || placeData.phone_number}</span>
                                    </div>
                                \` : ''}
                                \${placeData.website ? \`
                                    <div class="meta-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                                        </svg>
                                        <a href="\${placeData.website}" target="_blank" rel="noopener noreferrer">網站</a>
                                    </div>
                                \` : ''}
                            </div>
                            \${placeData.editorial_summary ? \`
                                <div class="detail-panel-description">
                                    <h3>簡介</h3>
                                    <p>\${placeData.editorial_summary}</p>
                                </div>
                            \` : ''}
                            \${place && place.bookingStatus ? \`
                                <div class="detail-panel-booking">
                                    <h3>預訂狀態</h3>
                                    <p>狀態: <span class="booking-status-\${place.bookingStatus}">\${this.getBookingStatusText(place.bookingStatus)}</span></p>
                                </div>
                            \` : ''}
                        </div>
                    </div>
                \`;

                // 顯示面板
                panel.classList.add('visible');

                // 綁定關閉事件
                panel.querySelectorAll('[data-action="close-detail"]').forEach(btn => {
                    btn.addEventListener('click', () => this.hideLocationDetail());
                });

                // 處理圖片載入錯誤（CSP 兼容）
                const img = panel.querySelector('.detail-panel-img');
                if (img) {
                    img.addEventListener('error', function() {
                        const fallbackSrc = this.dataset.fallbackSrc;
                        if (fallbackSrc && this.src !== fallbackSrc) {
                            this.src = fallbackSrc;
                        }
                    });
                }

                // ESC 鍵關閉
                const escHandler = (e) => {
                    if (e.key === 'Escape') {
                        this.hideLocationDetail();
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);
            }

            // 隱藏地點詳情
            hideLocationDetail() {
                const panel = document.getElementById('location-detail-panel');
                if (panel) {
                    panel.classList.remove('visible');
                }
            }

            // 獲取預訂狀態文字
            getBookingStatusText(status) {
                const statusMap = {
                    'planned': '已規劃',
                    'booked': '已預訂',
                    'completed': '已完成',
                    'cancelled': '已取消'
                };
                return statusMap[status] || '未知';
            }

            // 更新路線
            updateRoute() {
                // 如果 Directions API 已被拒絕，直接使用降級方案
                if (this.directionsApiDenied) {
                    const currentDayPlaces = this.selectedPlaces
                        .filter(p => p.dayIndex === this.currentDayIndex)
                        .sort((a, b) => {
                            if (a.time !== b.time) {
                                return a.time.localeCompare(b.time);
                            }
                            return a.order - b.order;
                        })
                        .filter(p => p.placeData && p.placeData.latitude && p.placeData.longitude);
                    if (currentDayPlaces.length >= 2) {
                        this.drawSimpleRoute(currentDayPlaces);
                    }
                    return;
                }

                // 檢查 Directions Service 是否可用
                if (!google.maps.DirectionsService || !google.maps.DirectionsRenderer) {
                    // 靜默處理，直接使用降級方案
                    const currentDayPlaces = this.selectedPlaces
                        .filter(p => p.dayIndex === this.currentDayIndex)
                        .sort((a, b) => {
                            if (a.time !== b.time) {
                                return a.time.localeCompare(b.time);
                            }
                            return a.order - b.order;
                        })
                        .filter(p => p.placeData && p.placeData.latitude && p.placeData.longitude);
                    if (currentDayPlaces.length >= 2) {
                        this.drawSimpleRoute(currentDayPlaces);
                    }
                    return;
                }

                // 初始化服務（如果尚未初始化）
                if (!this.directionsService) {
                    try {
                        this.directionsService = new google.maps.DirectionsService();
                        this.directionsRenderer = new google.maps.DirectionsRenderer({
                            map: this.map,
                            suppressMarkers: true // 不顯示默認標記，使用我們自定義的
                        });
                    } catch (error) {
                        // 靜默處理錯誤（已由全局錯誤處理器處理）
                        this.directionsApiDenied = true;
                        return;
                    }
                }

                // 清除現有路線
                try {
                    this.directionsRenderer.setDirections({ routes: [] });
                } catch (error) {
                    // 忽略清除錯誤
                }
                this.routePolylines.forEach(polyline => {
                    try {
                        polyline.setMap(null);
                    } catch (error) {
                        // 忽略清除錯誤
                    }
                });
                this.routePolylines = [];

                // 獲取當前天數的地點，按時間和順序排序
                const currentDayPlaces = this.selectedPlaces
                    .filter(p => p.dayIndex === this.currentDayIndex)
                    .sort((a, b) => {
                        if (a.time !== b.time) {
                            return a.time.localeCompare(b.time);
                        }
                        return a.order - b.order;
                    })
                    .filter(p => p.placeData && p.placeData.latitude && p.placeData.longitude);

                if (currentDayPlaces.length < 2) return;

                // 構建路線點
                const waypoints = currentDayPlaces.slice(1, -1).map(place => ({
                    location: { lat: place.placeData.latitude, lng: place.placeData.longitude },
                    stopover: true
                }));

                const origin = { 
                    lat: currentDayPlaces[0].placeData.latitude, 
                    lng: currentDayPlaces[0].placeData.longitude 
                };
                const destination = { 
                    lat: currentDayPlaces[currentDayPlaces.length - 1].placeData.latitude, 
                    lng: currentDayPlaces[currentDayPlaces.length - 1].placeData.longitude 
                };

                // 請求路線
                try {
                    this.directionsService.route({
                        origin: origin,
                        destination: destination,
                        waypoints: waypoints.length > 0 ? waypoints : undefined,
                        travelMode: google.maps.TravelMode.DRIVING,
                        optimizeWaypoints: false // 保持用戶設定的順序
                    }, (result, status) => {
                        if (status === 'OK' && result) {
                            try {
                                this.directionsRenderer.setDirections(result);
                            } catch (error) {
                                console.warn('設置路線失敗:', error);
                            }
                        } else if (status === 'REQUEST_DENIED') {
                            // 標記 API 已被拒絕，避免重複嘗試
                            if (!this.directionsApiDenied) {
                                // 靜默處理，不顯示警告（已由全局錯誤處理器處理）
                                this.directionsApiDenied = true;
                            }
                            // 使用簡單的折線連接地點作為降級方案
                            this.drawSimpleRoute(currentDayPlaces);
                        } else {
                            // 其他錯誤也使用降級方案（靜默處理）
                            this.drawSimpleRoute(currentDayPlaces);
                        }
                    });
                } catch (error) {
                    // 靜默處理錯誤（已由全局錯誤處理器處理）
                    // 使用簡單的折線連接地點作為降級方案
                    this.drawSimpleRoute(currentDayPlaces);
                }
            }

            // 簡單路線繪製（降級方案）
            drawSimpleRoute(places) {
                if (places.length < 2) return;

                const path = places.map(place => ({
                    lat: place.placeData.latitude,
                    lng: place.placeData.longitude
                }));

                const polyline = new google.maps.Polyline({
                    path: path,
                    geodesic: true,
                    strokeColor: '#3b82f6',
                    strokeOpacity: 0.6,
                    strokeWeight: 3
                });

                polyline.setMap(this.map);
                this.routePolylines.push(polyline);
            }

            // 拖拽處理
            handleDragStart(event) {
                this.draggedElement = event.target.closest('.trip-item');
                if (this.draggedElement) {
                    this.draggedElement.classList.add('dragging');
                    event.dataTransfer.effectAllowed = 'move';
                }
            }

            handleDragEnd(event) {
                if (this.draggedElement) {
                    this.draggedElement.classList.remove('dragging');
                }
                if (this.dragOverElement) {
                    this.dragOverElement.classList.remove('drag-over');
                }
                this.draggedElement = null;
                this.dragOverElement = null;
            }

            handleDragOver(event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                
                const tripItem = event.target.closest('.trip-item');
                if (tripItem && tripItem !== this.draggedElement) {
                    if (this.dragOverElement && this.dragOverElement !== tripItem) {
                        this.dragOverElement.classList.remove('drag-over');
                    }
                    tripItem.classList.add('drag-over');
                    this.dragOverElement = tripItem;
                }
            }

            handleDragLeave(event) {
                const tripItem = event.target.closest('.trip-item');
                if (tripItem) {
                    tripItem.classList.remove('drag-over');
                }
            }

            handleDrop(event) {
                event.preventDefault();
                
                const tripItem = event.target.closest('.trip-item');
                if (tripItem) {
                    tripItem.classList.remove('drag-over');
                }

                if (!this.draggedElement) return;

                const draggedPlaceId = this.draggedElement.dataset.placeId;
                const targetPlaceId = tripItem ? tripItem.dataset.placeId : null;

                if (!targetPlaceId || draggedPlaceId === targetPlaceId) return;

                // 重新排序
                const draggedPlace = this.selectedPlaces.find(p => p.placeId === draggedPlaceId);
                const targetPlace = this.selectedPlaces.find(p => p.placeId === targetPlaceId);

                if (draggedPlace && targetPlace && draggedPlace.dayIndex === targetPlace.dayIndex) {
                    // 獲取當前天數的所有地點，按時間和順序排序
                    const currentDayPlaces = this.selectedPlaces
                        .filter(p => p.dayIndex === draggedPlace.dayIndex)
                        .sort((a, b) => {
                            if (a.time !== b.time) {
                                return a.time.localeCompare(b.time);
                            }
                            return a.order - b.order;
                        });

                    // 找到拖拽和目標地點在排序列表中的位置
                    const draggedIndex = currentDayPlaces.findIndex(p => p.placeId === draggedPlaceId);
                    const targetIndex = currentDayPlaces.findIndex(p => p.placeId === targetPlaceId);

                    if (draggedIndex >= 0 && targetIndex >= 0) {
                        // 重新計算所有項目的順序
                        const newPlaces = [...currentDayPlaces];
                        const [removed] = newPlaces.splice(draggedIndex, 1);
                        newPlaces.splice(targetIndex, 0, removed);

                        // 更新順序
                        newPlaces.forEach((place, index) => {
                            place.order = index;
                        });

                        // 更新 UI 和地圖標記
                        this.updateTripPanel();
                        this.updateMarkerNumbers();
                        this.updateRoute(); // 更新路線
                        this.updateSaveButton();
                    }
                }
            }

            // 更新時間
            updateTime(placeId, newTime) {
                const place = this.selectedPlaces.find(p => p.placeId === placeId);
                if (place) {
                    place.time = newTime;
                    this.updateTripPanel();
                    this.updateRoute(); // 更新路線
                    this.updateSaveButton();
                }
            }

            // 更新預訂狀態
            async updateBookingStatus(placeId, newStatus) {
                const place = this.selectedPlaces.find(p => p.placeId === placeId);
                if (!place) return;

                place.bookingStatus = newStatus;
                this.updateTripPanel();

                // 如果有 itemId，更新資料庫
                if (place.itemId) {
                    try {
                        const response = await fetch(\`/api/trip-planner/item/\${place.itemId}/booking-status\`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ bookingStatus: newStatus }),
                            credentials: 'include'
                        });

                        if (!response.ok) {
                            throw new Error('Failed to update booking status');
                        }
                    } catch (error) {
                        console.error('Error updating booking status:', error);
                        this.showMessage('更新預訂狀態失敗', 'error');
                    }
                }
            }

            // 移除地點
            removePlace(placeId) {
                if (confirm('確定要移除這個地點嗎？')) {
                    this.selectedPlaces = this.selectedPlaces.filter(p => p.placeId !== placeId);
                    
                    // 移除地圖標記
                    const markerIndex = this.markers.findIndex(m => m.place.placeId === placeId);
                    if (markerIndex >= 0) {
                        this.markers[markerIndex].marker.setMap(null);
                        this.markers.splice(markerIndex, 1);
                    }
                    
                    this.updateTripPanel();
                    this.updateSelectedCount();
                    this.updateSaveButton();
                }
            }

            // 獲取預設時間
            getDefaultTime() {
                const currentPlaces = this.selectedPlaces.filter(p => p.dayIndex === this.currentDayIndex);
                if (currentPlaces.length === 0) {
                    return '09:00';
                }
                
                // 最後一個地點的時間 + 2小時
                const lastTime = currentPlaces[currentPlaces.length - 1].time;
                const [hours, minutes] = lastTime.split(':').map(Number);
                const nextHours = (hours + 2) % 24;
                return \`\${String(nextHours).padStart(2, '0')}:\${String(minutes).padStart(2, '0')}\`;
            }

            // 更新已選數量
            updateSelectedCount() {
                const countEl = document.getElementById('selected-count');
                if (countEl) {
                    countEl.textContent = this.selectedPlaces.length;
                }
            }

            // 更新儲存按鈕狀態
            updateSaveButton() {
                const saveBtn = document.getElementById('save-trip-btn');
                const shareBtn = document.getElementById('share-trip-btn');
                if (saveBtn) {
                    saveBtn.disabled = this.selectedPlaces.length === 0;
                }
                if (shareBtn) {
                    shareBtn.disabled = !this.currentTripId || this.selectedPlaces.length === 0;
                }
            }

            // 分享行程
            async shareTrip() {
                if (!this.currentTripId) {
                    this.showMessage('請先儲存行程', 'warning');
                    return;
                }

                const shareBtn = document.getElementById('share-trip-btn');
                if (!shareBtn) return;

                shareBtn.disabled = true;
                shareBtn.textContent = '生成中...';

                try {
                    const response = await fetch(\`/api/trip-planner/\${this.currentTripId}/share\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isPublic: true }),
                        credentials: 'include'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        this.shareToken = result.shareToken;
                        
                        // 顯示分享連結
                        const shareUrl = result.shareUrl;
                        const copySuccess = await this.copyToClipboard(shareUrl);
                        
                        if (copySuccess) {
                            this.showMessage('分享連結已複製到剪貼簿！', 'success');
                        } else {
                            // 如果複製失敗，顯示連結讓用戶手動複製
                            const linkDisplay = document.createElement('div');
                            linkDisplay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
                            linkDisplay.innerHTML = \`
                                <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                    <h3 class="text-lg font-bold mb-4">分享連結</h3>
                                    <p class="text-sm text-gray-600 mb-2">請手動複製以下連結：</p>
                                    <div class="flex items-center gap-2 mb-4">
                                        <input type="text" 
                                               value="\${shareUrl}" 
                                               readonly 
                                               class="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                                               id="share-url-input">
                                        <button type="button" 
                                                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                                data-action="copy-share-url">
                                            複製
                                        </button>
                                    </div>
                                    <button type="button" 
                                            class="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                            data-action="close-share-dialog">
                                        關閉
                                    </button>
                                </div>
                            \`;
                            document.body.appendChild(linkDisplay);
                            
                            // 綁定事件
                            linkDisplay.querySelector('[data-action="copy-share-url"]').addEventListener('click', () => {
                                const input = linkDisplay.querySelector('#share-url-input');
                                input.select();
                                input.setSelectionRange(0, 99999);
                                try {
                                    document.execCommand('copy');
                                    this.showMessage('連結已複製！', 'success');
                                    linkDisplay.remove();
                                } catch (err) {
                                    this.showMessage('複製失敗，請手動選擇並複製', 'warning');
                                }
                            });
                            
                            linkDisplay.querySelector('[data-action="close-share-dialog"]').addEventListener('click', () => {
                                linkDisplay.remove();
                            });
                            
                            linkDisplay.addEventListener('click', (e) => {
                                if (e.target === linkDisplay) {
                                    linkDisplay.remove();
                                }
                            });
                        }
                    } else {
                        throw new Error('分享失敗');
                    }
                } catch (error) {
                    console.error('Error sharing trip:', error);
                    this.showMessage('分享失敗', 'error');
                } finally {
                    shareBtn.disabled = false;
                    shareBtn.textContent = '分享行程';
                }
            }

            // 複製到剪貼簿
            async copyToClipboard(text) {
                try {
                    // 檢查是否在安全上下文中（HTTPS 或 localhost）
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        // 檢查權限
                        const permissionStatus = await navigator.permissions.query({ name: 'clipboard-write' }).catch(() => null);
                        if (permissionStatus && permissionStatus.state === 'denied') {
                            throw new Error('剪貼簿權限被拒絕');
                        }
                        
                        await navigator.clipboard.writeText(text);
                        return true;
                    } else {
                        // 降級方案：使用傳統方法
                        const textArea = document.createElement('textarea');
                        textArea.value = text;
                        // 使用 CSS 類代替 inline style
                        textArea.className = 'clipboard-fallback-textarea';
                        textArea.setAttribute('readonly', '');
                        textArea.setAttribute('aria-hidden', 'true');
                        document.body.appendChild(textArea);
                        
                        // 選擇文本
                        textArea.select();
                        textArea.setSelectionRange(0, text.length);
                        
                        try {
                            const successful = document.execCommand('copy');
                            document.body.removeChild(textArea);
                            return successful;
                        } catch (err) {
                            document.body.removeChild(textArea);
                            throw err;
                        }
                    }
                } catch (error) {
                    console.error('複製到剪貼簿失敗:', error);
                    // 如果複製失敗，顯示連結讓用戶手動複製
                    return false;
                }
            }

            // 格式化日期
            formatDate(date) {
                return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
            }

            formatDateInput(date) {
                return date.toISOString().split('T')[0];
            }

            // 顯示訊息
            showMessage(text, type = 'info') {
                // 簡單的訊息顯示，可以改進
                console.log(\`[\${type}] \${text}\`);
                const messageArea = document.getElementById('map-message-area');
                if (messageArea) {
                    messageArea.textContent = text;
                    messageArea.className = 'absolute bottom-4 left-4 text-sm px-2 py-1 rounded shadow-sm z-20 ' + 
                        (type === 'error' ? 'bg-red-100 text-red-700' : 
                         type === 'success' ? 'bg-green-100 text-green-700' : 
                         type === 'warning' ? 'bg-yellow-100 text-yellow-700' : 
                         'bg-white text-gray-500');
                    setTimeout(() => {
                        messageArea.textContent = '點擊地圖上的圖示以選擇地標加入行程';
                        messageArea.className = 'absolute bottom-4 left-4 text-sm text-gray-500 bg-white bg-opacity-90 px-2 py-1 rounded shadow-sm z-20';
                    }, 3000);
                }
            }

            // 儲存行程
            async saveTrip() {
                const saveBtn = document.getElementById('save-trip-btn');
                if (!saveBtn) return;

                saveBtn.disabled = true;
                saveBtn.textContent = '儲存中...';

                try {
                    const tripData = {
                        tripId: this.currentTripId, // 如果有，則更新；否則創建新行程
                        title: \`澎湖行程 - \${this.formatDate(this.days[0])}\`,
                        shareToken: this.shareToken,
                        isPublic: false,
                        days: this.days.map((day, dayIndex) => ({
                            date: this.formatDateInput(day),
                            places: this.selectedPlaces
                                .filter(p => p.dayIndex === dayIndex)
                                .sort((a, b) => {
                                    if (a.time !== b.time) {
                                        return a.time.localeCompare(b.time);
                                    }
                                    return a.order - b.order;
                                })
                                .map(p => ({
                                    placeId: p.placeId,
                                    time: p.time,
                                    order: p.order,
                                    bookingStatus: p.bookingStatus || 'planned',
                                    bookingUrl: p.bookingUrl || null,
                                    bookingPhone: p.bookingPhone || null,
                                    bookingNotes: p.bookingNotes || null
                                }))
                        }))
                    };

                    const response = await fetch('/api/trip-planner/save', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(tripData),
                        credentials: 'include'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        this.showMessage('行程已儲存', 'success');
                        if (result.tripId) {
                            this.currentTripId = result.tripId;
                            // 更新保存按鈕狀態
                            this.updateSaveButton();
                            console.log('Trip saved with ID:', result.tripId);
                        }
                    } else {
                        const error = await response.json().catch(() => ({ error: '儲存失敗' }));
                        throw new Error(error.error || '儲存失敗');
                    }
                } catch (error) {
                    console.error('Error saving trip:', error);
                    this.showMessage('儲存失敗: ' + error.message, 'error');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = '儲存行程';
                }
            }

            // 初始化事件監聽器
            initEventListeners() {
                const addDayBtn = document.getElementById('add-day-btn');
                if (addDayBtn) {
                    addDayBtn.addEventListener('click', () => this.addDay());
                }

                const saveBtn = document.getElementById('save-trip-btn');
                if (saveBtn) {
                    saveBtn.addEventListener('click', () => this.saveTrip());
                }

                const shareBtn = document.getElementById('share-trip-btn');
                if (shareBtn) {
                    shareBtn.addEventListener('click', () => this.shareTrip());
                }

                const dateInput = document.getElementById('current-day-date');
                if (dateInput) {
                    dateInput.value = this.formatDateInput(this.days[0]);
                    dateInput.addEventListener('change', (e) => {
                        const newDate = new Date(e.target.value);
                        this.days[this.currentDayIndex] = newDate;
                        this.updateDayTabs();
                    });
                }
            }
        }

        // 創建全局實例
        let tripPlanner = null;

        // 初始化
        document.addEventListener('DOMContentLoaded', () => {
            tripPlanner = new TripPlanner();
            tripPlanner.initMap();
            tripPlanner.initEventListeners();
        });
    </script>
  `;

  // 設置 CSP headers（包含 unsafe-eval 以支援 Google Maps API）
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://maps.googleapis.com https://accounts.google.com https://ajax.googleapis.com`,
    `style-src 'self' https://fonts.googleapis.com https://maps.googleapis.com https://maps.gstatic.com 'nonce-${nonce}' 'unsafe-inline'`,
    `style-src-attr 'unsafe-inline'`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https: https://www.gstatic.com https://maps.googleapis.com https://maps.gstatic.com",
    "connect-src 'self' https://apis.google.com https://accounts.google.com https://maps.googleapis.com https://www.googleapis.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com https://api.openai.com https://*.googleapis.com https://*.gstatic.com",
    "frame-src 'self' https://accounts.google.com",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'"
  ].join('; ');

  const securityHeaders = {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };

  return new Response(pageTemplate({
    title: '行程規劃 - 好澎湖',
    content,
    user,
    nonce,
    cssContent: cssContent + `
      body { overflow-x: hidden; }
    `,
    currentPath: url.pathname
  }), {
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...securityHeaders
    }
  });
}

/**
 * 公開分享的行程頁面（無需登入）
 */
export async function renderSharedTripPage(request, env, session, user, nonce, cssContent, shareToken) {
  const url = new URL(request.url);

  try {
    // 從 API 獲取分享的行程
    const response = await fetch(`${url.origin}/api/trip-planner/shared/${shareToken}`);
    if (!response.ok) {
      return new Response(pageTemplate({
        title: '行程不存在 - 好澎湖',
        content: '<div class="p-8 text-center"><h1 class="text-2xl font-bold mb-4">行程不存在或已取消分享</h1><p class="text-gray-600">此行程連結可能已失效。</p></div>',
        user: null,
        nonce,
        cssContent,
        currentPath: url.pathname
      }), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
      });
    }

    const result = await response.json();
    const trip = result.trip;

    // 獲取地點詳情
    const locationService = new (await import('../services/locationService.js')).LocationService(
      env.DB,
      env.GOOGLE_MAPS_API_KEY
    );

    const daysWithPlaces = await Promise.all(
      trip.days.map(async (day) => {
        const places = await Promise.all(
          day.places.map(async (place) => {
            try {
              const placeDetails = await locationService.getLocationByGooglePlaceId(place.placeId);
              return {
                ...place,
                placeData: placeDetails || { name: '未知地點', address: '' }
              };
            } catch (error) {
              console.error('Error fetching place details:', error);
              return {
                ...place,
                placeData: { name: '未知地點', address: '' }
              };
            }
          })
        );
        return { ...day, places };
      })
    );

    const content = `
      <div class="max-w-4xl mx-auto p-6">
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">${trip.title || '澎湖行程'}</h1>
          <p class="text-gray-600 text-sm">分享的行程</p>
        </div>

        ${daysWithPlaces.map((day, dayIndex) => `
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">第 ${dayIndex + 1} 天</h2>
            <div class="space-y-4">
              ${day.places.map((place, placeIndex) => {
                const placeData = place.placeData || {};
                const statusLabels = {
                  'planned': { text: '已規劃', class: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
                  'booked': { text: '已預訂', class: 'bg-green-100 text-green-800', icon: '🟢' },
                  'completed': { text: '已完成', class: 'bg-blue-100 text-blue-800', icon: '✅' },
                  'cancelled': { text: '已取消', class: 'bg-red-100 text-red-800', icon: '🔴' }
                };
                const statusInfo = statusLabels[place.bookingStatus] || statusLabels['planned'];
                
                return `
                  <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-800">${placeData.name || '未知地點'}</h3>
                        <p class="text-sm text-gray-600 mt-1">${placeData.address || '無地址'}</p>
                      </div>
                      <div class="ml-4">
                        <span class="booking-status-badge ${statusInfo.class} px-2 py-1 rounded text-xs">
                          ${statusInfo.icon} ${statusInfo.text}
                        </span>
                      </div>
                    </div>
                    <div class="mt-2 text-sm text-gray-500">
                      <span class="font-medium">時間：</span>${place.time || '未設定'}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p class="text-blue-800">想要規劃自己的行程嗎？</p>
          <a href="/trip-planner" class="inline-block mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded">
            開始規劃行程
          </a>
        </div>
      </div>
    `;

    const securityService = new SecurityService();
    const securityHeaders = securityService.getCSPHeaders();

    return new Response(pageTemplate({
      title: `${trip.title || '行程'} - 好澎湖`,
      content,
      user: null,
      nonce,
      cssContent: cssContent + `
        .booking-status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `,
      currentPath: url.pathname
    }), {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ...securityHeaders
      }
    });
  } catch (error) {
    console.error('[SharedTripPage] Error:', error);
    return new Response(pageTemplate({
      title: '錯誤 - 好澎湖',
      content: '<div class="p-8 text-center"><h1 class="text-2xl font-bold mb-4">載入行程時發生錯誤</h1><p class="text-gray-600">請稍後再試。</p></div>',
      user: null,
      nonce,
      cssContent,
      currentPath: url.pathname
    }), {
      headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
  }
}

