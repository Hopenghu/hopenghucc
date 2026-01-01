import { pageTemplate } from '../components/layout.js';

export async function renderAIChatPage(request, env, session, user, nonce, cssContent) {
  // 根據時間獲取問候語（服務器端計算）
  function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '早安！美好的一天開始了！☀️';
    if (hour >= 12 && hour < 18) return '午安！今天過得好嗎？☕';
    if (hour >= 18 && hour < 22) return '晚上好！吃過晚餐了嗎？🌙';
    return '這麼晚還在？要注意休息喔！✨';
  }
  
  const greeting = getTimeBasedGreeting();
  
  // 將中文字符串提取為數據，避免在模板字符串中直接使用
  const messages = {
    confirmReset: '確定要清除所有對話紀錄嗎？這將無法復原。',
    linkCopied: '連結已複製！',
    copiedToClipboard: '已複製到剪貼板！',
    copyFailed: '複製失敗，請手動複製'
  };
  
  const content = `
    <div class="ai-chat-container">
      <!-- 頂部導航列 -->
      <header class="ai-chat-header">
        <div class="ai-chat-header-left">
          <a href="/" class="ai-chat-logo">HOPE PENGHU</a>
          <span class="ai-chat-separator">|</span>
          <h1 class="ai-chat-title">澎湖好朋友 AI</h1>
        </div>
        <div class="ai-chat-header-right">
          <button id="ai-chat-stats-button" class="ai-chat-header-button" title="對話統計">
            <svg class="ai-chat-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </button>
          <button id="ai-chat-share-button" class="ai-chat-header-button" title="分享對話">
            <svg class="ai-chat-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
            </svg>
          </button>
          ${user ? `
            <span class="ai-chat-user-name">${user.name || user.email}</span>
            <a href="/profile" class="ai-chat-link">我的地點</a>
          ` : `
            <a href="/login" class="ai-chat-link">登入</a>
          `}
        </div>
      </header>

      <!-- 對話區域 -->
      <div id="ai-chat-messages" class="ai-chat-messages">
        <!-- 歡迎訊息 -->
        <div class="ai-chat-welcome-message">
          <div class="ai-chat-avatar">
            <div class="ai-chat-avatar-text">🌵</div>
          </div>
          <div class="ai-chat-message-content">
            <div class="ai-chat-message-bubble">
              <p class="ai-chat-message-text" id="welcome-greeting">${greeting}</p>
              <p class="ai-chat-message-text">不論你是剛要來玩、已經在澎湖，還是就在這裡生活，我都想認識你，跟你聊聊這座島嶼的故事。</p>
              <p class="ai-chat-message-text">我們可以：</p>
              <ul class="ai-chat-message-list">
                <li>🌊 聊聊在地私房景點</li>
                <li>🗺️ 規劃最道地的行程</li>
                <li>📖 交換彼此的澎湖故事</li>
                <li>💬 像朋友一樣輕鬆聊天</li>
              </ul>
              <p class="ai-chat-message-subtext">先偷偷告訴我，你是...</p>
              <div class="ai-chat-options-container" id="welcome-options">
                <button class="ai-chat-option-button" data-option="我是澎湖生活居民">
                  🏠 我是澎湖生活居民
                </button>
                <button class="ai-chat-option-button" data-option="我來過澎湖">
                  ✈️ 我來過澎湖
                </button>
                <button class="ai-chat-option-button" data-option="我想來澎湖">
                  🎒 我想來澎湖玩
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速回覆建議 -->
      <div id="ai-quick-replies" class="ai-chat-quick-replies hidden">
        <div class="ai-chat-quick-replies-container">
          <p class="ai-chat-quick-replies-label">快速回覆：</p>
          <div class="ai-chat-quick-replies-buttons" id="quick-replies-buttons">
            <!-- 動態生成快速回覆按鈕 -->
          </div>
        </div>
      </div>

      <!-- 輸入區域 -->
      <div class="ai-chat-input-container">
        <div class="ai-chat-input-wrapper">
          <div class="ai-chat-input-box">
            <button 
              id="ai-emoji-button"
              class="ai-chat-emoji-button"
              title="添加表情"
            >
              <svg class="ai-chat-emoji-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
            <textarea 
              id="ai-chat-input" 
              placeholder="跟我聊聊澎湖..."
              rows="1"
              class="ai-chat-textarea"
            ></textarea>
            <button 
              id="ai-send-button"
              disabled
              class="ai-chat-send-button"
            >
              <svg class="ai-chat-send-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
          <p class="ai-chat-status-text">
            ${user ? '已登入' : '未登入'} - 您可以查詢資訊，${user ? '也可以提供新資訊' : '登入後可提供新資訊'}
          </p>
        </div>
      </div>

      <!-- 表情選擇器 -->
      <div id="ai-emoji-picker" class="ai-chat-emoji-picker hidden">
        <div class="ai-chat-emoji-grid">
          <button class="ai-chat-emoji-item" data-emoji="😊">😊</button>
          <button class="ai-chat-emoji-item" data-emoji="😄">😄</button>
          <button class="ai-chat-emoji-item" data-emoji="😁">😁</button>
          <button class="ai-chat-emoji-item" data-emoji="🤗">🤗</button>
          <button class="ai-chat-emoji-item" data-emoji="👍">👍</button>
          <button class="ai-chat-emoji-item" data-emoji="❤️">❤️</button>
          <button class="ai-chat-emoji-item" data-emoji="🎉">🎉</button>
          <button class="ai-chat-emoji-item" data-emoji="🌊">🌊</button>
          <button class="ai-chat-emoji-item" data-emoji="🌵">🌵</button>
          <button class="ai-chat-emoji-item" data-emoji="🏖️">🏖️</button>
          <button class="ai-chat-emoji-item" data-emoji="🍜">🍜</button>
          <button class="ai-chat-emoji-item" data-emoji="🦞">🦞</button>
        </div>
      </div>
      <!-- 統計 Modal -->
      <div id="ai-chat-stats-modal" class="ai-chat-modal hidden">
        <div class="ai-chat-modal-content">
          <div class="ai-chat-modal-header">
            <h3 class="ai-chat-modal-title">對話統計</h3>
            <button class="ai-chat-modal-close" id="ai-chat-stats-modal-close">×</button>
          </div>
          <div class="ai-chat-modal-body">
            <div class="ai-chat-stats-grid">
              <div class="ai-chat-stat-card">
                <div class="ai-chat-stat-value" id="stats-total-messages">0</div>
                <div class="ai-chat-stat-label">總訊息數</div>
              </div>
              <div class="ai-chat-stat-card">
                <div class="ai-chat-stat-value" id="stats-user-messages">0</div>
                <div class="ai-chat-stat-label">你的發言</div>
              </div>
            </div>
            <div class="ai-chat-stats-actions">
              <button class="ai-chat-stats-button" id="ai-chat-reset-conversation-button">
                <svg class="ai-chat-stats-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                清除對話紀錄
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分享 Modal -->
      <div id="ai-chat-share-modal" class="ai-chat-modal hidden">
        <div class="ai-chat-modal-content">
          <div class="ai-chat-modal-header">
            <h3 class="ai-chat-modal-title">分享對話</h3>
            <button class="ai-chat-modal-close" id="ai-chat-share-modal-close">×</button>
          </div>
          <div class="ai-chat-modal-body">
            <div class="ai-chat-share-options">
              <button class="ai-chat-share-option" id="ai-chat-share-clipboard-button">
                <svg class="ai-chat-share-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                </svg>
                複製連結
              </button>
              <button class="ai-chat-share-option" id="ai-chat-share-export-button">
                <svg class="ai-chat-share-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                下載文字檔
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style nonce="${nonce}">
      /* 主容器 */
      .ai-chat-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        height: 100vh;
        background-color: #f9fafb;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
      }

      /* 頂部導航列 */
      .ai-chat-header {
        background-color: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }

      .ai-chat-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ai-chat-logo {
        color: #2563eb;
        font-weight: 600;
        text-decoration: none;
      }

      .ai-chat-logo:hover {
        color: #1d4ed8;
      }

      .ai-chat-separator {
        color: #9ca3af;
      }

      .ai-chat-title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .ai-chat-header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .ai-chat-user-name {
        font-size: 14px;
        color: #4b5563;
      }

      .ai-chat-link {
        font-size: 14px;
        color: #2563eb;
        text-decoration: none;
      }

      .ai-chat-link:hover {
        color: #1d4ed8;
      }

      /* 頭部按鈕 */
      .ai-chat-header-button {
        background-color: transparent;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 6px 10px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
      }

      .ai-chat-header-button:hover {
        background-color: #f3f4f6;
        border-color: #3b82f6;
        color: #2563eb;
      }

      .ai-chat-header-icon {
        width: 18px;
        height: 18px;
      }

      /* Modal 樣式 */
      .ai-chat-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease-out;
      }

      .ai-chat-modal.hidden {
        display: none;
      }

      .ai-chat-modal-content {
        background-color: white;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .ai-chat-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
      }

      .ai-chat-modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .ai-chat-modal-close {
        background-color: transparent;
        border: none;
        font-size: 24px;
        color: #6b7280;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
      }

      .ai-chat-modal-close:hover {
        background-color: #f3f4f6;
        color: #1f2937;
      }

      .ai-chat-modal-body {
        padding: 20px;
      }

      /* 統計卡片 */
      .ai-chat-stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .ai-chat-stat-card {
        background-color: #f9fafb;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
      }

      .ai-chat-stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #2563eb;
        margin-bottom: 4px;
      }

      .ai-chat-stat-label {
        font-size: 13px;
        color: #6b7280;
      }

      .ai-chat-stats-actions {
        display: flex;
        gap: 12px;
      }

      .ai-chat-stats-button {
        flex: 1;
        background-color: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .ai-chat-stats-button:hover {
        background-color: #1d4ed8;
      }

      .ai-chat-stats-icon {
        width: 18px;
        height: 18px;
      }

      /* 分享選項 */
      .ai-chat-share-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .ai-chat-share-option {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #4b5563;
      }

      .ai-chat-share-option:hover {
        background-color: #eff6ff;
        border-color: #3b82f6;
        color: #2563eb;
      }

      .ai-chat-share-icon {
        width: 24px;
        height: 24px;
      }

      /* 對話區域 */
      .ai-chat-messages {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 24px 16px;
        max-height: calc(100vh - 180px);
      }

      .ai-chat-welcome-message {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        max-width: 896px;
        margin: 0 auto;
      }

      .ai-chat-avatar {
        background-color: #dbeafe;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .ai-chat-avatar-text {
        font-size: 24px;
        line-height: 1;
      }

      .ai-chat-avatar-icon {
        width: 20px;
        height: 20px;
        color: #2563eb;
        display: none; /* Hide SVG if using text */
      }

      .ai-chat-message-content {
        flex: 1;
      }

      .ai-chat-message-bubble {
        background-color: white;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      }

      .ai-chat-message-text {
        color: #374151;
        margin-bottom: 8px;
      }

      .ai-chat-message-list {
        color: #4b5563;
        font-size: 14px;
        list-style-type: disc;
        list-style-position: inside;
        margin-bottom: 8px;
      }

      .ai-chat-message-subtext {
        color: #4b5563;
        font-size: 14px;
      }

      /* 輸入區域 */
      .ai-chat-input-container {
        background-color: white;
        border-top: 1px solid #e5e7eb;
        padding: 16px;
        flex-shrink: 0;
      }

      .ai-chat-input-wrapper {
        max-width: 896px;
        margin: 0 auto;
      }

      .ai-chat-input-box {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        position: relative;
      }

      .ai-chat-textarea {
        flex: 1;
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 12px 48px 12px 48px;
        min-height: 48px;
        max-height: 200px;
        resize: none;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.5;
      }

      .ai-chat-textarea:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .ai-chat-send-button {
        position: absolute;
        right: 8px;
        bottom: 8px;
        background-color: #2563eb;
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        opacity: 0.5;
        pointer-events: none;
        transition: background-color 0.2s, opacity 0.2s;
      }

      .ai-chat-send-button:not(:disabled) {
        opacity: 1;
        pointer-events: auto;
        cursor: pointer;
      }

      .ai-chat-send-button:not(:disabled):hover {
        background-color: #1d4ed8;
      }

      .ai-chat-send-icon {
        width: 20px;
        height: 20px;
      }

      .ai-chat-status-text {
        font-size: 12px;
        color: #6b7280;
        margin-top: 8px;
        text-align: center;
      }

      /* 用戶訊息樣式 */
      .ai-chat-user-message {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        max-width: 896px;
        margin: 0 auto 24px;
        justify-content: flex-end;
      }

      /* User Bubble - Friendlier Style moved to main block */

      .ai-chat-user-text {
        font-size: 14px;
        white-space: pre-wrap;
      }

      /* AI 訊息樣式 */
      .ai-chat-ai-message {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        max-width: 896px;
        margin: 0 auto 24px;
      }

      /* Typing Indicator Animation */
      .typing-indicator span {
        animation: blink 1.4s infinite both;
        font-size: 24px;
        line-height: 10px;
        margin: 0 1px;
        display: inline-block;
      }

      .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes blink {
        0% { opacity: 0.2; }
        20% { opacity: 1; }
        100% { opacity: 0.2; }
      }

      /* AI Bubble - Friendlier Style */
      .ai-chat-ai-bubble {
        background-color: #ffffff;
        border-radius: 12px 12px 12px 2px; /* Bottom-left corner sharp */
        padding: 16px;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        border: 1px solid #f3f4f6;
        animation: messageSlideIn 0.3s ease-out;
      }

      @keyframes messageSlideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* User Bubble - Friendlier Style */
      .ai-chat-user-bubble {
        background-color: #3b82f6; /* A slightly lighter, friendlier blue */
        color: white;
        border-radius: 12px 12px 2px 12px; /* Bottom-right corner sharp */
        padding: 16px;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        max-width: 80%;
        animation: messageSlideIn 0.3s ease-out;
      }
      
      .ai-chat-option-button {
        background-color: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 20px; /* Pill shape */
        padding: 8px 16px;
        font-size: 14px;
        color: #4b5563;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center; /* Center text */
        display: inline-block; /* Allow wrapping */
        margin-right: 8px;
        margin-bottom: 8px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
      
      .ai-chat-option-button:hover {
        background-color: #eff6ff;
        border-color: #3b82f6;
        color: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .ai-chat-options-container {
        margin-top: 12px;
        display: flex;
        flex-wrap: wrap; /* Allow buttons to wrap */
        gap: 0; /* Handled by margin on buttons */
        flex-direction: row; /* Horizontal layout */
      }

      /* 快速回覆建議 */
      .ai-chat-quick-replies {
        background-color: white;
        border-top: 1px solid #e5e7eb;
        padding: 12px 16px;
        flex-shrink: 0;
      }

      .ai-chat-quick-replies-container {
        max-width: 896px;
        margin: 0 auto;
      }

      .ai-chat-quick-replies-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 8px;
      }

      .ai-chat-quick-replies-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .ai-chat-quick-reply-button {
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 6px 12px;
        font-size: 13px;
        color: #4b5563;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .ai-chat-quick-reply-button:hover {
        background-color: #eff6ff;
        border-color: #3b82f6;
        color: #2563eb;
        transform: translateY(-1px);
      }

      /* 表情按鈕 */
      .ai-chat-emoji-button {
        position: absolute;
        left: 8px;
        bottom: 8px;
        background-color: transparent;
        color: #6b7280;
        padding: 8px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        z-index: 10;
      }

      .ai-chat-emoji-button:hover {
        background-color: #f3f4f6;
        color: #2563eb;
      }

      .ai-chat-emoji-icon {
        width: 20px;
        height: 20px;
      }

      /* 表情選擇器 */
      .ai-chat-emoji-picker {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        max-width: 896px;
        width: calc(100% - 32px);
        background-color: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        z-index: 1000;
        animation: emojiPickerSlideUp 0.2s ease-out;
      }

      @keyframes emojiPickerSlideUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .ai-chat-emoji-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }

      .ai-chat-emoji-item {
        background-color: transparent;
        border: none;
        padding: 8px;
        font-size: 24px;
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s;
      }

      .ai-chat-emoji-item:hover {
        background-color: #f3f4f6;
        transform: scale(1.2);
      }

      /* Hidden utility class */
      .hidden {
        display: none !important;
      }

      /* 訊息操作按鈕 */
      .ai-chat-message-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .ai-chat-ai-message:hover .ai-chat-message-actions {
        opacity: 1;
      }

      .ai-chat-action-button {
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 4px 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ai-chat-action-button:hover {
        background-color: #eff6ff;
        border-color: #3b82f6;
        color: #2563eb;
      }

      .ai-chat-action-icon {
        width: 16px;
        height: 16px;
      }

      /* 反應按鈕 */
      .ai-chat-reaction-button {
        font-size: 16px;
        padding: 4px 8px;
        min-width: 32px;
      }

      .ai-chat-reaction-button:hover {
        transform: scale(1.2);
      }

      .ai-chat-reaction-button.active {
        background-color: #dbeafe;
        border-color: #3b82f6;
      }

      /* 反應顯示 */
      .ai-chat-reactions {
        display: flex;
        gap: 4px;
        margin-top: 8px;
        flex-wrap: wrap;
      }

      .ai-chat-reaction-badge {
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 2px 8px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .ai-chat-reaction-badge.active {
        background-color: #dbeafe;
        border-color: #3b82f6;
      }

      /* 對話記憶提示 */
      .ai-chat-context-hint {
        background-color: #eff6ff;
        border-left: 3px solid #3b82f6;
        padding: 8px 12px;
        margin-bottom: 12px;
        border-radius: 4px;
        font-size: 13px;
        color: #1e40af;
      }

      .ai-chat-context-hint strong {
        font-weight: 600;
      }

      /* 訊息淡入動畫 */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .ai-chat-message-fade-in {
        animation: fadeIn 0.3s ease-out;
      }

      /* 改進的打字指示器 */
      .typing-indicator-enhanced {
        display: inline-flex;
        gap: 4px;
        margin-right: 8px;
      }

      .typing-indicator-enhanced span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #9ca3af;
        animation: typingDot 1.4s infinite ease-in-out;
      }

      .typing-indicator-enhanced span:nth-child(1) {
        animation-delay: 0s;
      }

      .typing-indicator-enhanced span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .typing-indicator-enhanced span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typingDot {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.7;
        }
        30% {
          transform: translateY(-10px);
          opacity: 1;
        }
      }

      .typing-text {
        color: #6b7280;
        font-size: 13px;
        font-style: italic;
      }

      /* 時間戳記和已讀狀態 */
      .ai-chat-message-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        font-size: 11px;
        color: #9ca3af;
      }

      .ai-chat-timestamp {
        font-size: 11px;
        color: #9ca3af;
      }

      .ai-chat-read-status {
        font-size: 12px;
        color: #9ca3af;
        transition: color 0.2s;
      }

      .ai-chat-read-status.read {
        color: #3b82f6;
      }

      .ai-chat-user-bubble .ai-chat-timestamp {
        text-align: right;
        margin-top: 4px;
        font-size: 11px;
        color: #9ca3af;
      }

      /* 打字指示器容器 */
      .ai-chat-typing-indicator {
        opacity: 0.8;
      }

      /* 移動端響應式設計 */
      @media (max-width: 768px) {
        .ai-chat-header {
          padding: 8px 12px;
        }

        .ai-chat-header-left {
          gap: 8px;
        }

        .ai-chat-title {
          font-size: 16px;
        }

        .ai-chat-separator {
          display: none;
        }

        .ai-chat-messages {
          padding: 16px 12px;
          max-height: calc(100vh - 160px);
        }

        .ai-chat-avatar {
          width: 32px;
          height: 32px;
        }

        .ai-chat-avatar-text {
          font-size: 20px;
        }

        .ai-chat-message-bubble,
        .ai-chat-ai-bubble,
        .ai-chat-user-bubble {
          padding: 12px;
          font-size: 14px;
        }

        .ai-chat-user-bubble {
          max-width: 85%;
        }

        .ai-chat-input-container {
          padding: 12px;
        }

        .ai-chat-textarea {
          padding: 10px 40px 10px 12px;
          font-size: 16px; /* 防止 iOS 自動縮放 */
          min-height: 44px;
        }

        .ai-chat-send-button {
          padding: 6px 12px;
          right: 6px;
          bottom: 6px;
        }

        .ai-chat-emoji-button {
          left: 6px;
          bottom: 6px;
          padding: 6px;
        }

        .ai-chat-message-actions {
          gap: 4px;
        }

        .ai-chat-action-button {
          padding: 6px;
          min-width: 36px;
          min-height: 36px;
        }

        .ai-chat-reaction-button {
          font-size: 18px;
          min-width: 36px;
          min-height: 36px;
        }

        .ai-chat-option-button {
          padding: 10px 14px;
          font-size: 13px;
          margin-right: 6px;
          margin-bottom: 6px;
        }

        .ai-chat-quick-reply-button {
          padding: 8px 12px;
          font-size: 12px;
        }

        .ai-chat-emoji-picker {
          left: 16px;
          right: 16px;
          bottom: 100px;
          width: calc(100% - 32px);
          max-width: none;
          transform: none;
        }

        .ai-chat-emoji-grid {
          grid-template-columns: repeat(6, 1fr);
        }

        .ai-chat-timestamp {
          font-size: 10px;
        }

        .ai-chat-read-status {
          font-size: 11px;
        }

        /* 移動端優化：防止文字選擇 */
        .ai-chat-user-message,
        .ai-chat-ai-message {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        .ai-chat-user-text,
        .ai-chat-ai-text {
          user-select: text;
        }
      }

      /* 超小屏幕優化 */
      @media (max-width: 480px) {
        .ai-chat-header {
          padding: 6px 8px;
        }

        .ai-chat-title {
          font-size: 14px;
        }

        .ai-chat-messages {
          padding: 12px 8px;
        }

        .ai-chat-avatar {
          width: 28px;
          height: 28px;
        }

        .ai-chat-avatar-text {
          font-size: 18px;
        }

        .ai-chat-message-bubble,
        .ai-chat-ai-bubble,
        .ai-chat-user-bubble {
          padding: 10px;
          font-size: 13px;
        }

        .ai-chat-user-bubble {
          max-width: 90%;
        }

        .ai-chat-input-container {
          padding: 8px;
        }

        .ai-chat-textarea {
          padding: 8px 36px 8px 10px;
          font-size: 16px;
        }
      }

      /* 觸摸設備優化 */
      @media (hover: none) and (pointer: coarse) {
        .ai-chat-action-button,
        .ai-chat-option-button,
        .ai-chat-quick-reply-button,
        .ai-chat-emoji-item {
          min-height: 44px; /* iOS 推薦的最小觸摸目標 */
          min-width: 44px;
        }

        .ai-chat-ai-message:hover .ai-chat-message-actions {
          opacity: 1; /* 移動端始終顯示操作按鈕 */
        }

        .ai-chat-message-actions {
          opacity: 1;
        }
      }

      /* 性能優化：減少動畫在低性能設備上 */
      @media (prefers-reduced-motion: reduce) {
        .ai-chat-message-fade-in,
        .ai-chat-ai-bubble,
        .ai-chat-user-bubble,
        .typing-indicator-enhanced span {
          animation: none;
        }
      }

      /* 深色模式支持（可選） */
      @media (prefers-color-scheme: dark) {
        /* 可以在此添加深色模式樣式 */
      }

      /* 地圖容器樣式 */
      .ai-chat-map-container {
        max-width: 896px;
        margin: 24px auto;
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: messageSlideIn 0.3s ease-out;
      }

      .ai-chat-map-header {
        margin-bottom: 16px;
      }

      .ai-chat-map-header h3 {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
      }

      .ai-chat-map-header p {
        font-size: 14px;
        color: #6b7280;
      }

      .ai-chat-map-search {
        margin-bottom: 16px;
      }

      .ai-chat-map-search-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
      }

      .ai-chat-map-search-input:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      .ai-chat-map {
        width: 100%;
        height: 400px;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 16px;
      }

      .ai-chat-map-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .ai-chat-map-button {
        padding: 10px 20px;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        background: white;
        color: #4b5563;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ai-chat-map-button:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #9ca3af;
      }

      .ai-chat-map-button-primary {
        background: #2563eb;
        color: white;
        border-color: #2563eb;
      }

      .ai-chat-map-button-primary:hover:not(:disabled) {
        background: #1d4ed8;
        border-color: #1d4ed8;
      }

      .ai-chat-map-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .ai-chat-map-selected-info {
        margin-top: 12px;
        padding: 12px;
        background: #eff6ff;
        border-radius: 8px;
        border-left: 3px solid #2563eb;
        font-size: 14px;
        color: #1e40af;
      }

      .ai-chat-map-error {
        padding: 16px;
        background: #fef2f2;
        border-radius: 8px;
        color: #dc2626;
        text-align: center;
      }

      @media (max-width: 768px) {
        .ai-chat-map-container {
          margin: 16px 12px;
          padding: 12px;
        }

        .ai-chat-map {
          height: 300px;
        }

        .ai-chat-map-actions {
          flex-direction: column;
        }

        .ai-chat-map-button {
          width: 100%;
        }
      }
    </style>

    <script nonce="${nonce}">
      // 立即設置全局錯誤處理，避免第三方腳本錯誤影響應用
      (function() {
        // 處理未捕獲的 Promise 錯誤
        window.addEventListener('unhandledrejection', (event) => {
          const errorSource = event.reason?.stack || event.reason?.message || String(event.reason || '');
          const fileName = event.reason?.fileName || '';
          // 檢查是否是第三方腳本的錯誤
          if (errorSource.includes('giveFreely') || 
              errorSource.includes('givefreely') ||
              fileName.includes('giveFreely') ||
              fileName.includes('givefreely') ||
              errorSource.includes('cloudflareinsights') ||
              errorSource.includes('beacon') ||
              errorSource.includes('payload') && (errorSource.includes('giveFreely') || fileName.includes('giveFreely'))) {
            event.preventDefault(); // 阻止錯誤顯示在控制台
            return; // 靜默忽略
          }
        });
        
        // 處理未捕獲的同步錯誤
        window.addEventListener('error', (event) => {
          const errorSource = event.filename || event.message || '';
          // 檢查是否是第三方腳本的錯誤
          if (errorSource.includes('giveFreely') || 
              errorSource.includes('givefreely') ||
              errorSource.includes('cloudflareinsights') ||
              errorSource.includes('beacon')) {
            event.preventDefault(); // 阻止錯誤顯示在控制台
            return; // 靜默忽略
          }
        });
      })();
      
      // 從服務器端傳遞的中文字符串數據
      const MESSAGES = ${JSON.stringify(messages)};
      
      let aiSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      let isLoading = false;
      let retryCount = 0;
      const MAX_RETRIES = 3;

      // 更新發送按鈕狀態的統一函數
      function updateSendButtonState() {
        const input = document.getElementById('ai-chat-input');
        const sendButton = document.getElementById('ai-send-button');
        if (input && sendButton) {
          const hasText = input.value.trim().length > 0;
          sendButton.disabled = !hasText || isLoading;
        }
      }

      // 自動調整 textarea 高度
      function autoResizeTextarea(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        // 更新按鈕狀態
        updateSendButtonState();
      }

      // 發送訊息
      async function sendAIMessage() {
        console.log('[AIChat] sendAIMessage called');
        const input = document.getElementById('ai-chat-input');
        if (!input) {
          console.error('[AIChat] Input element not found in sendAIMessage!');
          return;
        }
        
        const message = input.value.trim();
        const sendButton = document.getElementById('ai-send-button');
        
        console.log('[AIChat] Message:', message, 'isLoading:', isLoading);
        
        if (!message || isLoading) {
          console.log('[AIChat] Message empty or already loading, returning');
          return;
        }

        // 清空輸入框並禁用按鈕
        input.value = '';
        input.style.height = 'auto';
        isLoading = true;
        updateSendButtonState();
        
        // 顯示使用者訊息
        addMessage('user', message);
        
        // 更新統計
        conversationStats.messageCount++;
        conversationStats.userMessages++;
        updateStats();
        
        // 顯示載入中（改進的打字指示器）
        const loadingId = addTypingIndicator();
        scrollToBottom();

        try {
          console.log('[AIChat] Sending request to /api/ai/query with:', {
            message: message.substring(0, 50) + '...',
            sessionId: aiSessionId
          });
          
          const response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: message,
              sessionId: aiSessionId
            })
          });

          console.log('[AIChat] Response status:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[AIChat] API response not OK:', errorText);
            removeMessage(loadingId);
            addMessage('assistant', '抱歉，伺服器發生錯誤（狀態碼：' + response.status + '），請稍後再試。');
            isLoading = false;
            updateSendButtonState();
            input.focus();
            return;
          }

          const data = await response.json();
          console.log('[AIChat] Response data:', {
            success: data.success,
            hasMessage: !!data.message,
            messageLength: data.message?.length || 0,
            hasError: !!data.error
          });

          // 移除載入中訊息
          removeMessage(loadingId);

          if (data.success) {
            // 使用打字動畫效果顯示 AI 回覆
            addMessageWithTyping('assistant', data.message);
            // 更新 sessionId（如果 API 返回新的）
            if (data.sessionId) {
              aiSessionId = data.sessionId;
            }
            
            // 檢測是否需要顯示地圖（商家相關問題）
            const shouldShowMap = detectMerchantQuery(message) || detectMerchantQuery(data.message);
            if (shouldShowMap) {
              setTimeout(() => {
                showMapInChat();
              }, 1000);
            }
            
            // AI 回覆後顯示快速回覆建議
            setTimeout(() => {
              const input = document.getElementById('ai-chat-input');
              if (input && input.value.trim().length === 0) {
                showQuickReplies();
              }
            }, 500);
          } else {
            console.error('[AIChat] AI API Error:', data);
            const errorMessage = data.message || data.error || '抱歉，發生錯誤，請稍後再試。';
            addMessage('assistant', errorMessage);
            if (data.error) {
              console.error('[AIChat] Error details:', data.error);
            }
          }
        } catch (error) {
          console.error('[AIChat] AI Chat Error:', error);
          console.error('[AIChat] Error stack:', error.stack);
          removeMessage(loadingId);
          
          // 智能錯誤處理和重試
          if (retryCount < MAX_RETRIES && (error.message.includes('fetch') || error.message.includes('network'))) {
            retryCount++;
            addMessage('assistant', '哎呀，網路連線有點問題。讓我再試一次...（第 ' + retryCount + ' 次重試）');
            setTimeout(() => {
              sendAIMessage();
            }, 2000);
            return;
          } else {
            retryCount = 0;
            addMessage('assistant', '抱歉，連線發生問題：' + (error.message || '未知錯誤') + '，請稍後再試。如果問題持續，可以重新整理頁面。');
          }
        } finally {
          if (retryCount === 0) {
            isLoading = false;
            updateSendButtonState();
            input.focus();
          }
        }
      }

      // 解析 AI 訊息，提取可點擊的選項
      function parseAIMessageOptions(content) {
        const options = [];
        
        // 檢測身份選擇問題
        if (content.includes('澎湖生活居民') && (content.includes('來過澎湖的旅客') || content.includes('來過澎湖')) && (content.includes('想來澎湖的旅客') || content.includes('想來澎湖'))) {
          options.push(
            { text: '我是澎湖生活居民', value: '我是澎湖生活居民' },
            { text: '我來過澎湖', value: '我來過澎湖' },
            { text: '我想來澎湖', value: '我想來澎湖' }
          );
        }
        // 檢測簡化版本的身份問題
        else if (content.includes('居民') && content.includes('旅客') && (content.includes('來過') || content.includes('想來'))) {
          if (content.includes('來過') && content.includes('想來')) {
            options.push(
              { text: '我是居民', value: '我是澎湖生活居民' },
              { text: '我來過', value: '我來過澎湖' },
              { text: '我想來', value: '我想來澎湖' }
            );
          }
        }
        // 檢測是/否問題（使用字符串方法，避免正則表達式）
        else if (content.includes('嗎？') || content.includes('嗎?') || content.includes('？') || content.includes('?')) {
          // 檢查是否為是/否問題（使用字符串方法）
          const yesNoKeywords = ['是否', '會不會', '有沒有', '能不能', '可不可以', '要不要', '想不想', '還想不想'];
          const hasYesNoKeyword = yesNoKeywords.some(keyword => content.includes(keyword));
          
          if (hasYesNoKeyword) {
            // 提取問題的核心部分（使用字符串方法）
            const questionEndIndex = Math.min(
              content.indexOf('嗎？') !== -1 ? content.indexOf('嗎？') : Infinity,
              content.indexOf('嗎?') !== -1 ? content.indexOf('嗎?') : Infinity,
              content.indexOf('？') !== -1 ? content.indexOf('？') : Infinity,
              content.indexOf('?') !== -1 ? content.indexOf('?') : Infinity
            );
            if (questionEndIndex !== Infinity && questionEndIndex > 0) {
              const questionText = content.substring(0, questionEndIndex).trim();
              if (questionText.length > 0) {
              options.push(
                { text: '是', value: '是' },
                { text: '不是', value: '不是' }
              );
            }
          }
        }
        }
        // 檢測數字選項（例如：1. 2. 3.）（使用字符串方法）
        else {
          // 使用字符串方法查找數字開頭的選項
          const lines = content.split('\n');
          const numberedOptions = [];
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.length === 0) continue;
            
            // 檢查是否以數字開頭，後跟 . 或 、
            let numStart = -1;
            let numEnd = -1;
            for (let j = 0; j < line.length; j++) {
              const char = line.charAt(j);
              if (char >= '0' && char <= '9') {
                if (numStart === -1) numStart = j;
                numEnd = j + 1;
              } else if ((char === '.' || char === '、') && numStart !== -1 && j === numEnd) {
                // 找到數字後跟 . 或 、
                if (j + 1 < line.length && line.charAt(j + 1) === ' ') {
                  const optionText = line.substring(j + 2).trim();
                  if (optionText.length > 0) {
                    numberedOptions.push(optionText);
                  }
                }
                break;
              } else if (numStart !== -1) {
                break;
              }
            }
          }
          
          if (numberedOptions.length >= 2) {
            numberedOptions.forEach(optionText => {
                options.push({
                text: optionText,
                value: optionText
                });
            });
          }
        }
        
        return options;
      }

      // 處理按鈕點擊
      function handleOptionClick(optionValue) {
        console.log('[AIChat] handleOptionClick called with:', optionValue);
        const input = document.getElementById('ai-chat-input');
        if (!input) {
          console.error('[AIChat] Input element not found in handleOptionClick!');
          return;
        }
        
        // 如果正在載入，不處理新的點擊
        if (isLoading) {
          console.log('[AIChat] Already loading, ignoring click');
          return;
        }
        
        // 直接發送選項作為訊息
        console.log('[AIChat] Setting input value to:', optionValue);
        input.value = optionValue;
        // 觸發 input 事件以更新按鈕狀態
        input.dispatchEvent(new Event('input', { bubbles: true }));
        // 稍微延遲以確保狀態更新
        setTimeout(() => {
          console.log('[AIChat] Calling sendAIMessage');
          sendAIMessage();
        }, 10);
      }

      // 添加訊息（帶打字動畫效果）
      function addMessageWithTyping(type, content, speed = 30) {
        if (type !== 'assistant') {
          // 用戶訊息直接顯示，不需要打字效果
          return addMessage(type, content);
        }

        const messagesContainer = document.getElementById('ai-chat-messages');
        const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // 先創建一個空的訊息框
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = 'ai-chat-ai-message';
        messageDiv.setAttribute('data-message-id', messageId);
        messageDiv.innerHTML = 
          '<div class="ai-chat-avatar">' +
            '<div class="ai-chat-avatar-text">🌵</div>' +
          '</div>' +
          '<div class="ai-chat-message-content">' +
            '<div class="ai-chat-ai-bubble">' +
              '<div class="ai-chat-ai-text markdown-body" id="typing-content-' + messageId + '"></div>' +
              '<div class="ai-chat-message-actions" data-message-id="' + messageId + '">' +
                '<button class="ai-chat-action-button" title="重新生成" data-action="regenerate" data-message-id="' + messageId + '">' +
                  '<svg class="ai-chat-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>' +
                  '</svg>' +
                '</button>' +
                '<button class="ai-chat-action-button" title="複製" data-action="copy" data-message-id="' + messageId + '">' +
                  '<svg class="ai-chat-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>' +
                  '</svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
        
        // 為所有按鈕添加事件監聽器（避免 onclick 中的語法錯誤）
        setTimeout(() => {
          const actionsDiv = messageDiv.querySelector('.ai-chat-message-actions');
          if (actionsDiv) {
            // 反應按鈕
            const reactionButtons = actionsDiv.querySelectorAll('.ai-chat-reaction-button');
            reactionButtons.forEach(button => {
              button.addEventListener('click', function() {
                const msgId = this.getAttribute('data-message-id');
                const reaction = this.getAttribute('data-reaction');
                if (msgId && reaction) {
                  addReaction(msgId, reaction);
                }
              });
            });
            
            // 重新生成按鈕
            const regenerateButton = actionsDiv.querySelector('[data-action="regenerate"]');
            if (regenerateButton) {
              regenerateButton.addEventListener('click', function() {
                const msgId = this.getAttribute('data-message-id');
                if (msgId) {
                  regenerateMessage(msgId);
                }
              });
            }
            
            // 複製按鈕
            const copyButton = actionsDiv.querySelector('[data-action="copy"]');
            if (copyButton) {
              copyButton.addEventListener('click', function() {
                const msgId = this.getAttribute('data-message-id');
                if (msgId) {
                  copyMessage(msgId);
                }
              });
            }
          }
        }, 0);
        
        // 解析選項（在打字前先解析）
        const options = parseAIMessageOptions(content);
        let processedContent = content;
        
        // 處理內容，移除選項文字（使用字符串方法，避免正則表達式）
        if (options.length > 0) {
          if (content.includes('澎湖生活居民') && (content.includes('來過澎湖的旅客') || content.includes('來過澎湖')) && (content.includes('想來澎湖的旅客') || content.includes('想來澎湖'))) {
            // 使用字符串方法移除選項文字
            processedContent = content;
            const keywords = ['澎湖生活居民', '來過澎湖的旅客', '來過澎湖', '想來澎湖的旅客', '想來澎湖'];
            keywords.forEach(keyword => {
              const colonIndex = processedContent.indexOf('：');
              const colonIndex2 = processedContent.indexOf(':');
              const startIndex = Math.min(
                colonIndex !== -1 ? colonIndex : Infinity,
                colonIndex2 !== -1 ? colonIndex2 : Infinity
              );
              if (startIndex !== Infinity) {
                const keywordIndex = processedContent.indexOf(keyword, startIndex);
                if (keywordIndex !== -1) {
                  // 移除從冒號到關鍵字後的逗號或頓號
                  let endIndex = keywordIndex + keyword.length;
                  if (endIndex < processedContent.length) {
                    const nextChar = processedContent.charAt(endIndex);
                    if (nextChar === '、' || nextChar === '，' || nextChar === ',') {
                      endIndex++;
                    }
                  }
                  processedContent = processedContent.substring(0, startIndex) + processedContent.substring(endIndex);
                }
              }
            });
            // 移除 "還是" 開頭的問題
            processedContent = processedContent.replace('還是想來澎湖的旅客', '？');
            processedContent = processedContent.replace('還是想來澎湖', '？');
            processedContent = processedContent.replace('還是來過澎湖的旅客', '？');
            processedContent = processedContent.replace('還是來過澎湖', '？');
          } else {
            // 移除數字開頭的選項（使用字符串方法）
            const lines = processedContent.split('\n');
            const cleanedLines = [];
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line.length === 0) {
                cleanedLines.push(lines[i]);
                continue;
              }
              
              // 檢查是否以數字開頭，後跟 . 或 、
              let isNumberedOption = false;
              for (let j = 0; j < line.length; j++) {
                const char = line.charAt(j);
                if (char >= '0' && char <= '9') {
                  continue;
                } else if ((char === '.' || char === '、') && j > 0) {
                  if (j + 1 < line.length && line.charAt(j + 1) === ' ') {
                    isNumberedOption = true;
                  }
                  break;
                } else {
                  break;
                }
              }
              
              if (!isNumberedOption) {
                cleanedLines.push(lines[i]);
              }
            }
            processedContent = cleanedLines.join('\n');
          }
        }
        
        // 打字動畫
        const typingElement = document.getElementById('typing-content-' + messageId);
        if (!typingElement) {
          console.error('[AIChat] Typing element not found:', messageId);
          return messageId;
        }
        let currentIndex = 0;
        // 確保 processedContent 是字符串，並清理可能導致語法錯誤的字符
        let safeContent = String(processedContent || '');
        // 移除可能導致語法錯誤的控制字符（保留換行符和回車符）
        // 使用字符代碼檢查，避免正則表達式字符類範圍問題
        let cleanedContent = '';
        for (let i = 0; i < safeContent.length; i++) {
          const charCode = safeContent.charCodeAt(i);
          // 保留換行符(10)、回車符(13)、水平製表符(9)
          // 移除其他控制字符(0-8, 11-12, 14-31, 127)
          if (charCode === 9 || charCode === 10 || charCode === 13 || (charCode >= 32 && charCode !== 127)) {
            cleanedContent += safeContent.charAt(i);
          }
        }
        const fullText = cleanedContent;
        
        // 確保 fullText.length 是有效的數字
        const fullTextLength = typeof fullText.length === 'number' ? fullText.length : 0;
        
        function typeNextChar() {
          if (currentIndex < fullTextLength) {
            const char = fullText.charAt(currentIndex);
            const nextChar = currentIndex + 1 < fullTextLength ? fullText.charAt(currentIndex + 1) : '';
            
            // 如果是換行或標點符號，稍微延遲
            let delay = speed;
            const charCode = char.charCodeAt ? char.charCodeAt(0) : 0;
            // 使用字符代碼比較，避免模板字符串中的Unicode轉義問題
            // 換行符(10)、句號(12290)、驚嘆號(65281)、問號(65311)、逗號(65292)
            if (charCode === 10 || charCode === 12290 || charCode === 65281 || charCode === 65311 || charCode === 65292) {
              delay = speed * 2;
            } else if (char === ' ' && nextChar === ' ') {
              delay = speed * 1.5;
            }
            
            // 安全地設置 textContent
            try {
              const startPos = 0;
              const endPos = currentIndex + 1;
              const displayText = fullText.substring(startPos, endPos);
              if (typingElement) {
                typingElement.textContent = displayText;
              }
            } catch (e) {
              console.error('[AIChat] Error setting textContent:', e);
              if (typingElement) {
                typingElement.textContent = '';
              }
            }
            
            // 使用簡易 Markdown 渲染（在打字完成後）
            if (currentIndex >= fullTextLength - 1) {
              try {
                const content = typingElement.textContent || '';
                if (content) {
                  typingElement.innerHTML = parseMarkdown(content);
                }
              } catch (error) {
                console.error('[AIChat] parseMarkdown error:', error);
                // 如果解析失敗，直接使用原始文本並轉換換行（使用字符串方法）
                const originalText = typingElement.textContent || '';
                let safeHtml = '';
                for (let k = 0; k < originalText.length; k++) {
                  const ch = originalText.charAt(k);
                  if (ch === '\n') {
                    safeHtml += '<br>';
                  } else {
                    safeHtml += ch;
                  }
                }
                typingElement.innerHTML = safeHtml;
              }
              // 如果有選項，在打字完成後添加
              if (options.length > 0) {
                addOptionsToMessage(messageId, options);
              }
              
              // 更新已讀狀態
              const readStatus = document.getElementById('read-status-' + messageId);
              if (readStatus) {
                readStatus.textContent = '✓';
                readStatus.setAttribute('title', '已讀');
                readStatus.classList.add('read');
              }
              
              // 顯示操作按鈕（打字完成後）
              setTimeout(() => {
                const messageDiv = document.getElementById(messageId);
                if (messageDiv) {
                  const actionsDiv = messageDiv.querySelector('.ai-chat-message-actions');
                  if (actionsDiv) {
                    actionsDiv.style.opacity = '1';
                  }
                }
              }, 100);
            }
            
            currentIndex++;
            if (currentIndex < fullTextLength) {
              setTimeout(typeNextChar, delay);
            }
            scrollToBottom();
          }
        }
        
        // 開始打字
        if (fullTextLength > 0) {
          typeNextChar();
        } else {
          // 如果內容為空，直接顯示
          typingElement.textContent = '';
        }
        
        return messageId;
      }

      // 添加選項到訊息
      function addOptionsToMessage(messageId, options) {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const bubble = messageDiv.querySelector('.ai-chat-ai-bubble');
        if (!bubble) return;
        
        const containerId = 'options-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        let optionsHtml = '<div class="ai-chat-options-container" id="' + containerId + '">';
        options.forEach(option => {
          optionsHtml += '<button class="ai-chat-option-button" data-option="' + escapeHtml(option.value) + '">' + escapeHtml(option.text) + '</button>';
        });
        optionsHtml += '</div>';
        
        bubble.insertAdjacentHTML('beforeend', optionsHtml);
        
        // 為按鈕添加事件監聽器
        setTimeout(() => {
          const container = document.getElementById(containerId);
          if (container) {
            const buttons = container.querySelectorAll('.ai-chat-option-button');
            buttons.forEach(button => {
              button.addEventListener('click', function() {
                const optionValue = this.getAttribute('data-option');
                if (optionValue) {
                  handleOptionClick(optionValue);
                }
              });
            });
          }
        }, 0);
      }

      // 添加打字指示器（改進版）
      function addTypingIndicator() {
        const messagesContainer = document.getElementById('ai-chat-messages');
        const messageId = 'typing-' + Date.now();
        
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = 'ai-chat-ai-message ai-chat-typing-indicator';
        messageDiv.innerHTML = 
          '<div class="ai-chat-avatar">' +
            '<div class="ai-chat-avatar-text">🌵</div>' +
          '</div>' +
          '<div class="ai-chat-message-content">' +
            '<div class="ai-chat-ai-bubble">' +
              '<div class="typing-indicator-enhanced">' +
                '<span></span><span></span><span></span>' +
              '</div>' +
              '<span class="typing-text">正在輸入...</span>' +
            '</div>' +
          '</div>';
        
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
        return messageId;
      }

      // 添加訊息
      function addMessage(type, content, isTemporary = false) {
        const messagesContainer = document.getElementById('ai-chat-messages');
        const messageId = isTemporary ? 'temp-' + Date.now() : null;
        
        const messageDiv = document.createElement('div');
        if (messageId) messageDiv.id = messageId;
        messageDiv.classList.add('ai-chat-message-fade-in');
        
        // 添加時間戳記
        const timestamp = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        
        if (type === 'user') {
          messageDiv.className = 'ai-chat-user-message ai-chat-message-fade-in';
          messageDiv.innerHTML = 
            '<div class="ai-chat-user-bubble">' +
              '<p class="ai-chat-user-text">' + escapeHtml(content) + '</p>' +
              '<span class="ai-chat-timestamp">' + timestamp + '</span>' +
            '</div>';
        } else {
          // 解析 AI 訊息，提取可點擊的選項
          const options = parseAIMessageOptions(content);
          
          // 處理內容，將選項部分標記出來
          let processedContent = content;
          let optionsHtml = '';
          
          if (options.length > 0) {
            // ... (options logic unchanged) ...
            // 如果有選項，生成按鈕 HTML（使用 data-option 屬性而不是 onclick）
            const containerId = 'options-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            optionsHtml = '<div class="ai-chat-options-container" id="' + containerId + '">';
            options.forEach(option => {
              optionsHtml += '<button class="ai-chat-option-button" data-option="' + escapeHtml(option.value) + '">' + escapeHtml(option.text) + '</button>';
            });
            optionsHtml += '</div>';
            
            // 在訊息添加後，為按鈕添加事件監聽器
            setTimeout(() => {
              const container = document.getElementById(containerId);
              if (container) {
                const buttons = container.querySelectorAll('.ai-chat-option-button');
                buttons.forEach(button => {
                  button.addEventListener('click', function() {
                    const optionValue = this.getAttribute('data-option');
                    if (optionValue) {
                      handleOptionClick(optionValue);
                    }
                  });
                });
              }
            }, 0);
            
            // 從內容中移除選項文字（避免重複顯示，使用字符串方法）
            if (content.includes('澎湖生活居民') && (content.includes('來過澎湖的旅客') || content.includes('來過澎湖')) && (content.includes('想來澎湖的旅客') || content.includes('想來澎湖'))) {
              // 使用字符串方法移除選項文字
              processedContent = content;
              const keywords = ['澎湖生活居民', '來過澎湖的旅客', '來過澎湖', '想來澎湖的旅客', '想來澎湖'];
              keywords.forEach(keyword => {
                const colonIndex = processedContent.indexOf('：');
                const colonIndex2 = processedContent.indexOf(':');
                const startIndex = Math.min(
                  colonIndex !== -1 ? colonIndex : Infinity,
                  colonIndex2 !== -1 ? colonIndex2 : Infinity
                );
                if (startIndex !== Infinity) {
                  const keywordIndex = processedContent.indexOf(keyword, startIndex);
                  if (keywordIndex !== -1) {
                    // 移除從冒號到關鍵字後的逗號或頓號
                    let endIndex = keywordIndex + keyword.length;
                    if (endIndex < processedContent.length) {
                      const nextChar = processedContent.charAt(endIndex);
                      if (nextChar === '、' || nextChar === '，' || nextChar === ',') {
                        endIndex++;
                      }
                    }
                    processedContent = processedContent.substring(0, startIndex) + processedContent.substring(endIndex);
                  }
                }
              });
              // 移除 "還是" 開頭的問題
              processedContent = processedContent.replace('還是想來澎湖的旅客', '？');
              processedContent = processedContent.replace('還是想來澎湖', '？');
              processedContent = processedContent.replace('還是來過澎湖的旅客', '？');
              processedContent = processedContent.replace('還是來過澎湖', '？');
            } else {
              // 移除數字開頭的選項（使用字符串方法）
              const lines = processedContent.split('\n');
              const cleanedLines = [];
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.length === 0) {
                  cleanedLines.push(lines[i]);
                  continue;
                }
                
                // 檢查是否以數字開頭，後跟 . 或 、
                let isNumberedOption = false;
                for (let j = 0; j < line.length; j++) {
                  const char = line.charAt(j);
                  if (char >= '0' && char <= '9') {
                    continue;
                  } else if ((char === '.' || char === '、') && j > 0) {
                    if (j + 1 < line.length && line.charAt(j + 1) === ' ') {
                      isNumberedOption = true;
                    }
                    break;
                  } else {
                    break;
                  }
                }
                
                if (!isNumberedOption) {
                  cleanedLines.push(lines[i]);
                }
              }
              processedContent = cleanedLines.join('\n');
            }
          }
          
          // 使用簡易 Markdown 渲染器
          const renderedContent = parseMarkdown(processedContent);
          
          messageDiv.className = 'ai-chat-ai-message';
          const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
          messageDiv.setAttribute('data-message-id', messageId);
          messageDiv.innerHTML = 
            '<div class="ai-chat-avatar">' +
              '<div class="ai-chat-avatar-text">🌵</div>' +
            '</div>' +
            '<div class="ai-chat-message-content">' +
              '<div class="ai-chat-ai-bubble">' +
                '<div class="ai-chat-ai-text markdown-body">' + renderedContent + '</div>' +
                optionsHtml +
                '<div class="ai-chat-message-actions" data-message-id="' + messageId + '">' +
                  '<button class="ai-chat-action-button ai-chat-reaction-button" title="👍" data-reaction="👍" data-message-id="' + messageId + '">👍</button>' +
                  '<button class="ai-chat-action-button ai-chat-reaction-button" title="❤️" data-reaction="❤️" data-message-id="' + messageId + '">❤️</button>' +
                  '<button class="ai-chat-action-button ai-chat-reaction-button" title="😄" data-reaction="😄" data-message-id="' + messageId + '">😄</button>' +
                  '<button class="ai-chat-action-button" title="重新生成" data-action="regenerate" data-message-id="' + messageId + '">' +
                    '<svg class="ai-chat-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>' +
                    '</svg>' +
                  '</button>' +
                  '<button class="ai-chat-action-button" title="複製" data-action="copy" data-message-id="' + messageId + '">' +
                    '<svg class="ai-chat-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>' +
                    '</svg>' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>';
        }
        
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
        
        // 為所有按鈕添加事件監聽器（避免 onclick 中的語法錯誤）
        setTimeout(() => {
          const actionsDiv = messageDiv.querySelector('.ai-chat-message-actions');
          if (actionsDiv) {
            // 反應按鈕
            const reactionButtons = actionsDiv.querySelectorAll('.ai-chat-reaction-button');
            reactionButtons.forEach(button => {
              button.addEventListener('click', function() {
                const msgId = this.getAttribute('data-message-id');
                const reaction = this.getAttribute('data-reaction');
                if (msgId && reaction) {
                  addReaction(msgId, reaction);
                }
              });
            });
            
            // 重新生成按鈕
            const regenerateButton = actionsDiv.querySelector('[data-action="regenerate"]');
            if (regenerateButton) {
              regenerateButton.addEventListener('click', function() {
                const msgId = this.getAttribute('data-message-id');
                if (msgId) {
                  regenerateMessage(msgId);
                }
              });
            }
            
            // 複製按鈕
            const copyButton = actionsDiv.querySelector('[data-action="copy"]');
            if (copyButton) {
              copyButton.addEventListener('click', function() {
                const msgId = this.getAttribute('data-message-id');
                if (msgId) {
                  copyMessage(msgId);
                }
              });
            }
          }
        }, 0);
        
        return messageId;
      }

      // 移除訊息
      function removeMessage(messageId) {
        if (messageId) {
          const message = document.getElementById(messageId);
          if (message) {
            message.remove();
          }
        }
      }

      // 滾動到底部（優化移動端）
      function scrollToBottom() {
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (!messagesContainer) return;
        
        // 使用 requestAnimationFrame 優化性能
        requestAnimationFrame(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          
          // 移動端額外優化：平滑滾動
          if (window.innerWidth <= 768) {
            messagesContainer.scrollTo({
              top: messagesContainer.scrollHeight,
              behavior: 'smooth'
            });
          }
        });
      }

      // 檢測移動端（使用字符串方法，避免正則表達式）
      function isMobile() {
        if (window.innerWidth <= 768) return true;
        const ua = navigator.userAgent || '';
        const uaLower = ua.toLowerCase();
        const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini'];
        return mobileKeywords.some(keyword => uaLower.indexOf(keyword) !== -1);
      }

      // 移動端鍵盤適配
      function handleMobileKeyboard() {
        if (!isMobile()) return;
        
        const input = document.getElementById('ai-chat-input');
        const messagesContainer = document.getElementById('ai-chat-messages');
        
        if (!input || !messagesContainer) return;
        
        // 當輸入框獲得焦點時，滾動到底部
        input.addEventListener('focus', () => {
          setTimeout(() => {
            scrollToBottom();
          }, 300); // 等待鍵盤彈出
        });
        
        // 監聽視窗大小變化（鍵盤彈出/收起）
        let lastHeight = window.innerHeight;
        window.addEventListener('resize', () => {
          const currentHeight = window.innerHeight;
          if (Math.abs(currentHeight - lastHeight) > 150) {
            // 鍵盤彈出或收起
            setTimeout(() => {
              scrollToBottom();
            }, 100);
            lastHeight = currentHeight;
          }
        });
      }

      // 統計數據
      const conversationStats = {
        messageCount: 0,
        userMessages: 0
      };

      // 根據時間獲取問候語
      function getTimeBasedGreeting() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return '早安！美好的一天開始了！☀️';
        if (hour >= 12 && hour < 18) return '午安！今天過得好嗎？☕';
        if (hour >= 18 && hour < 22) return '晚上好！吃過晚餐了嗎？🌙';
        return '這麼晚還在？要注意休息喔！✨';
      }

      // 更新統計顯示
      function updateStats() {
        const totalEl = document.getElementById('stats-total-messages');
        const userEl = document.getElementById('stats-user-messages');
        if (totalEl) totalEl.textContent = conversationStats.messageCount;
        if (userEl) userEl.textContent = conversationStats.userMessages;
      }

      // Modal 控制函數
      function showStatsModal() {
        const modal = document.getElementById('ai-chat-stats-modal');
        if (modal) {
          updateStats(); // 打開時更新數據
          modal.classList.remove('hidden');
        }
      }

      function closeStatsModal() {
        const modal = document.getElementById('ai-chat-stats-modal');
        if (modal) modal.classList.add('hidden');
      }

      function showShareModal() {
        const modal = document.getElementById('ai-chat-share-modal');
        if (modal) modal.classList.remove('hidden');
      }

      function closeShareModal() {
        const modal = document.getElementById('ai-chat-share-modal');
        if (modal) modal.classList.add('hidden');
      }

      // 分享功能實作
      function shareToClipboard() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
          if (window.showToast) window.showToast(MESSAGES.linkCopied, 'success');
          else alert(MESSAGES.linkCopied);
          closeShareModal();
        });
      }

       function exportToText() {
         const messages = [];
         document.querySelectorAll('.ai-chat-user-text, .ai-chat-ai-text').forEach(el => {
           const isUser = el.classList.contains('ai-chat-user-text');
           const text = el.textContent.trim();
           messages.push((isUser ? '我' : 'AI') + ': ' + text);
         });
         
         const newline = String.fromCharCode(10);
         const text = messages.join(newline + newline);
         const blob = new Blob([text], { type: 'text/plain' });
         const a = document.createElement('a');
         a.href = URL.createObjectURL(blob);
         a.download = 'penghu-chat-' + new Date().toISOString().slice(0, 10) + '.txt';
         a.click();
         closeShareModal();
       }

      function resetConversation() {
        if (!confirm(MESSAGES.confirmReset)) return;
        window.location.reload();
      }

      // 將函數暴露給全域以便 HTML onclick 調用
      window.closeStatsModal = closeStatsModal;
      window.closeShareModal = closeShareModal;
      window.shareToClipboard = shareToClipboard;
      window.exportToText = exportToText;
      window.resetConversation = resetConversation;
      window.regenerateMessage = regenerateMessage;
      window.copyMessage = copyMessage;
      window.addReaction = addReaction;
      window.showStatsModal = showStatsModal;
      window.showShareModal = showShareModal;

      // 簡易 Markdown 解析器（完全使用字符串方法，避免正則表達式）
      function parseMarkdown(text) {
        // 防禦性檢查
        if (!text) return '';
        if (text === null || text === undefined) return '';
        
        // 確保輸入是字符串
        if (typeof text !== 'string') {
          try {
            text = String(text);
          } catch (e) {
            console.error('[AIChat] parseMarkdown: Failed to convert to string:', e);
            return '';
          }
        }
        
        // 額外的安全檢查：確保 text 是有效的字符串
        if (typeof text !== 'string' || text.length === undefined) {
          console.error('[AIChat] parseMarkdown: Invalid text type:', typeof text);
          return '';
        }
        
        try {
          // 使用安全的字符串方法處理，完全避免正則表達式解析問題
          let html = '';
          
          // 手動轉義 HTML 特殊字符（避免正則表達式）
          // 使用顯式的字符代碼檢查，避免任何可能的解析問題
          for (let i = 0; i < text.length; i++) {
            const char = text.charAt(i);
            const charCode = text.charCodeAt(i);
            
            // 使用字符代碼進行精確匹配，避免字符比較問題
            if (charCode === 38) { // &
              html += '&amp;';
            } else if (charCode === 60) { // <
              html += '&lt;';
            } else if (charCode === 62) { // >
              html += '&gt;';
            } else if (charCode === 34) { // "
              html += '&quot;';
            } else if (charCode === 39) { // '
              html += '&#39;';
            } else {
              html += char;
            }
          }
          
          // 按行處理
          const lines = html.split('\n');
          const processedLines = [];
          
          for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const trimmed = line.trim();
            
            // 處理標題（使用字符串方法）
            if (trimmed.indexOf('### ') === 0) {
              const title = trimmed.substring(4);
              line = '<h3 class="font-bold text-lg my-2">' + title + '</h3>';
            } else if (trimmed.indexOf('## ') === 0) {
              const title = trimmed.substring(3);
              line = '<h2 class="font-bold text-xl my-2">' + title + '</h2>';
            } else if (trimmed.indexOf('# ') === 0) {
              const title = trimmed.substring(2);
              line = '<h1 class="font-bold text-2xl my-2">' + title + '</h1>';
            }
            // 處理無序列表
            else if (trimmed.indexOf('- ') === 0) {
              const content = trimmed.substring(2);
              line = '<li class="ml-4 list-disc">' + content + '</li>';
            }
            // 處理有序列表（使用簡單的字符串檢查）
            else {
              let numMatch = false;
              let numEnd = -1;
              for (let j = 0; j < trimmed.length; j++) {
                const c = trimmed.charAt(j);
                if (c >= '0' && c <= '9') {
                  continue;
                } else if (c === '.' && j > 0) {
                  numEnd = j;
                  if (j + 1 < trimmed.length && trimmed.charAt(j + 1) === ' ') {
                    const content = trimmed.substring(j + 2);
                    line = '<li class="ml-4 list-decimal">' + content + '</li>';
                    numMatch = true;
                    break;
                  }
                } else {
                  break;
                }
              }
            }
            
            processedLines.push(line);
          }
          
          html = processedLines.join('<br>');
          
          // 處理粗體（使用字符串方法，避免正則表達式）
          let result = '';
          let inBold = false;
          let boldStart = -1;
          
          for (let i = 0; i < html.length; i++) {
            if (html.charAt(i) === '*' && i + 1 < html.length && html.charAt(i + 1) === '*') {
              if (!inBold) {
                inBold = true;
                boldStart = i + 2;
                i++; // 跳過第二個 *
              } else {
                inBold = false;
                const boldText = html.substring(boldStart, i);
                result += '<strong>' + boldText + '</strong>';
                i++; // 跳過第二個 *
              }
            } else if (!inBold) {
              result += html.charAt(i);
            }
          }
          
          // 如果還有未關閉的粗體標籤
          if (inBold) {
            result += html.substring(boldStart);
          }
          
          return result || html;
        } catch (error) {
          console.error('[AIChat] parseMarkdown error:', error);
          console.error('[AIChat] parseMarkdown error text:', typeof text, text ? text.substring(0, 100) : 'null');
          // 如果解析失敗，返回轉義後的純文本（使用字符串方法）
          let safe = '';
          try {
            const safeText = String(text || '');
            for (let i = 0; i < safeText.length; i++) {
              const charCode = safeText.charCodeAt(i);
              // 使用字符代碼進行精確匹配
              if (charCode === 38) { // &
                safe += '&amp;';
              } else if (charCode === 60) { // <
                safe += '&lt;';
              } else if (charCode === 62) { // >
                safe += '&gt;';
              } else if (charCode === 34) { // "
                safe += '&quot;';
              } else if (charCode === 39) { // '
                safe += '&#39;';
              } else if (charCode === 10) { // \n
                safe += '<br>';
              } else {
                safe += safeText.charAt(i);
              }
            }
          } catch (e) {
            console.error('[AIChat] parseMarkdown: Error in fallback:', e);
            return '';
          }
          return safe;
        }
      }

      // HTML 轉義
      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      // 為歡迎訊息的按鈕添加事件監聽器（在 DOM 載入後）
      function setupWelcomeButtons() {
        console.log('[AIChat] setupWelcomeButtons called');
        const welcomeOptions = document.getElementById('welcome-options');
        if (welcomeOptions) {
          console.log('[AIChat] Found welcome-options container');
          const buttons = welcomeOptions.querySelectorAll('.ai-chat-option-button');
          console.log('[AIChat] Found', buttons.length, 'buttons');
          buttons.forEach((button, index) => {
            // 移除舊的事件監聽器（如果有的話）
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              console.log('[AIChat] Button clicked, index:', index);
              const optionValue = this.getAttribute('data-option');
              console.log('[AIChat] Button data-option:', optionValue);
              if (optionValue) {
                handleOptionClick(optionValue);
              } else {
                console.error('[AIChat] No data-option attribute found on button');
              }
            });
            console.log('[AIChat] Event listener added to button', index);
          });
        } else {
          console.warn('[AIChat] welcome-options container not found');
        }
      }

      // 檢測商家相關查詢
      function detectMerchantQuery(text) {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        const merchantKeywords = ['商家', '店家', '登入', '新增地點', 'google maps', 'google map', '地圖', '點選地點', '選擇地點'];
        return merchantKeywords.some(keyword => lowerText.includes(keyword));
      }

      // 在聊天中顯示地圖
      function showMapInChat() {
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (!messagesContainer) return;

        // 檢查是否已經有地圖
        if (document.getElementById('ai-chat-map-container')) {
          return;
        }

        // 創建地圖容器
        const mapContainer = document.createElement('div');
        mapContainer.id = 'ai-chat-map-container';
        mapContainer.className = 'ai-chat-map-container';
        mapContainer.innerHTML = 
          '<div class="ai-chat-map-header">' +
            '<h3>🗺️ 選擇您的地點位置</h3>' +
            '<p>請在地圖上點擊選擇您的地點，或使用搜尋框搜尋地點</p>' +
          '</div>' +
          '<div class="ai-chat-map-search">' +
            '<input type="text" id="ai-chat-map-search" placeholder="搜尋地點..." class="ai-chat-map-search-input">' +
          '</div>' +
          '<div id="ai-chat-map" class="ai-chat-map"></div>' +
          '<div class="ai-chat-map-actions">' +
            '<button id="ai-chat-map-confirm" class="ai-chat-map-button ai-chat-map-button-primary" disabled>確認選擇</button>' +
            '<button id="ai-chat-map-cancel" class="ai-chat-map-button">取消</button>' +
          '</div>' +
          '<div id="ai-chat-map-selected-info" class="ai-chat-map-selected-info hidden"></div>';

        messagesContainer.appendChild(mapContainer);
        scrollToBottom();

        // 初始化地圖
        initChatMap();

        // 取消按鈕
        document.getElementById('ai-chat-map-cancel').addEventListener('click', () => {
          mapContainer.remove();
        });
      }

      // 初始化聊天中的地圖
      let chatMap = null;
      let chatMarker = null;
      let chatAutocomplete = null;
      let selectedPlace = null;

      async function initChatMap() {
        try {
          // 載入 Google Maps API
          if (typeof google === 'undefined' || !google.maps) {
            await loadGoogleMapsAPI();
          }

          const mapElement = document.getElementById('ai-chat-map');
          if (!mapElement) return;

          // 初始化地圖
          chatMap = new google.maps.Map(mapElement, {
            center: { lat: 23.5711, lng: 119.5794 }, // 澎湖中心
            zoom: 13,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
          });

          // 初始化標記
          chatMarker = new google.maps.Marker({
            map: chatMap,
            draggable: true
          });

          // 地圖點擊事件
          chatMap.addListener('click', (event) => {
            const location = event.latLng;
            chatMarker.setPosition(location);
            updateSelectedLocation(location);
          });

          // 標記拖拽事件
          chatMarker.addListener('dragend', (event) => {
            updateSelectedLocation(event.latLng);
          });

          // 初始化自動完成
          const searchInput = document.getElementById('ai-chat-map-search');
          if (searchInput) {
            chatAutocomplete = new google.maps.places.Autocomplete(searchInput, {
              fields: ['name', 'formatted_address', 'geometry', 'place_id'],
              types: ['establishment']
            });

            chatAutocomplete.addListener('place_changed', () => {
              const place = chatAutocomplete.getPlace();
              if (place.geometry) {
                chatMap.setCenter(place.geometry.location);
                chatMap.setZoom(16);
                chatMarker.setPosition(place.geometry.location);
                updateSelectedPlace(place);
              }
            });
          }

          // 確認按鈕
          document.getElementById('ai-chat-map-confirm').addEventListener('click', () => {
            if (selectedPlace) {
              confirmLocationSelection(selectedPlace);
            }
          });

        } catch (error) {
          console.error('[AIChat] Map initialization error:', error);
          const mapContainer = document.getElementById('ai-chat-map-container');
          if (mapContainer) {
            mapContainer.innerHTML = '<div class="ai-chat-map-error">地圖載入失敗，請重新整理頁面或稍後再試。</div>';
          }
        }
      }

      // 載入 Google Maps API
      function loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
          if (typeof google !== 'undefined' && google.maps) {
            resolve();
            return;
          }

          const script = document.createElement('script');
          script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY_HERE&libraries=places&callback=initChatMapCallback';
          script.async = true;
          script.defer = true;

          window.initChatMapCallback = () => {
            resolve();
            delete window.initChatMapCallback;
          };

          script.onerror = () => {
            reject(new Error('Failed to load Google Maps API'));
          };

          document.head.appendChild(script);
        });
      }

      // 更新選擇的位置
      function updateSelectedLocation(location) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: location }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const place = {
              name: results[0].formatted_address,
              address: results[0].formatted_address,
              location: {
                lat: location.lat(),
                lng: location.lng()
              },
              place_id: results[0].place_id
            };
            updateSelectedPlace(place);
          } else {
            const lat = location.lat().toFixed(6);
            const lng = location.lng().toFixed(6);
            const place = {
              name: '選擇的位置',
              address: lat + ', ' + lng,
              location: {
                lat: location.lat(),
                lng: location.lng()
              }
            };
            updateSelectedPlace(place);
          }
        });
      }

      // 更新選擇的地點
      function updateSelectedPlace(place) {
        selectedPlace = place;
        const infoDiv = document.getElementById('ai-chat-map-selected-info');
        const confirmButton = document.getElementById('ai-chat-map-confirm');

        if (infoDiv && confirmButton) {
          const placeName = place.name || place.address || '';
          const placeAddress = place.address || '';
          infoDiv.innerHTML = 
            '<strong>已選擇：</strong>' + escapeHtml(placeName) + '<br>' +
            '<small>' + escapeHtml(placeAddress) + '</small>';
          infoDiv.classList.remove('hidden');
          confirmButton.disabled = false;
        }
      }

      // 確認地點選擇
      async function confirmLocationSelection(place) {
        try {
          // 發送地點資訊到後端
          const response = await fetch('/api/ai/location-selected', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              place: place,
              sessionId: aiSessionId
            })
          });

          if (response.ok) {
            const data = await response.json();
            // 移除地圖
            const mapContainer = document.getElementById('ai-chat-map-container');
            if (mapContainer) {
              mapContainer.remove();
            }
            // 顯示確認訊息
            const placeName = place.name || place.address || '選擇的地點';
            addMessage('assistant', '太好了！我已經記錄了您選擇的地點：' + escapeHtml(placeName) + '。接下來我可以幫您做什麼嗎？');
          } else {
            throw new Error('Failed to save location');
          }
        } catch (error) {
          console.error('[AIChat] Error confirming location:', error);
          addMessage('assistant', '抱歉，儲存地點時發生錯誤，請稍後再試。');
        }
      }

      // 初始化：設置事件監聽器
      function initializeAIChat() {
        console.log('[AIChat] Initializing...');
        const input = document.getElementById('ai-chat-input');
        const sendButton = document.getElementById('ai-send-button');
        
        console.log('[AIChat] Input element:', input);
        console.log('[AIChat] Send button:', sendButton);
        
        if (input) {
          // 處理輸入事件
          input.addEventListener('input', function() {
            autoResizeTextarea(this);
          });
          
          // 處理鍵盤事件 - Enter 發送，Shift+Enter 換行
          input.addEventListener('keydown', function(event) {
            console.log('[AIChat] Keydown event:', event.key, 'Shift:', event.shiftKey);
            // Enter 鍵發送，Shift+Enter 換行
            if (event.key === 'Enter' && !event.shiftKey) {
              console.log('[AIChat] Enter pressed, sending message...');
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
              sendAIMessage();
              return false;
            }
          });
          
          input.focus();
          console.log('[AIChat] Event listeners attached to input');
        } else {
          console.error('[AIChat] Input element not found!');
        }
        
        if (sendButton) {
          // 處理發送按鈕點擊
          sendButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            console.log('[AIChat] Send button clicked');
            sendAIMessage();
          });
          // 初始更新按鈕狀態
          updateSendButtonState();
          console.log('[AIChat] Event listener attached to send button');
        } else {
          console.error('[AIChat] Send button not found!');
        }
      }

      // 快速回覆建議
      const quickReplies = [
        '澎湖有什麼好吃的？',
        '推薦幾個必去景點',
        '天氣怎麼樣？',
        '交通怎麼安排？',
        '有什麼私房景點？',
        '離島怎麼去？'
      ];

      // 顯示快速回覆建議
      function showQuickReplies() {
        const quickRepliesContainer = document.getElementById('ai-quick-replies');
        const buttonsContainer = document.getElementById('quick-replies-buttons');
        
        if (!quickRepliesContainer || !buttonsContainer) return;
        
        // 只在輸入框為空時顯示
        const input = document.getElementById('ai-chat-input');
        if (input && input.value.trim().length > 0) {
          quickRepliesContainer.classList.add('hidden');
          return;
        }
        
        // 清空現有按鈕
        buttonsContainer.innerHTML = '';
        
        // 生成快速回覆按鈕
        quickReplies.forEach(reply => {
          const button = document.createElement('button');
          button.className = 'ai-chat-quick-reply-button';
          button.textContent = reply;
          button.addEventListener('click', () => {
            if (input) {
              input.value = reply;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              quickRepliesContainer.classList.add('hidden');
              input.focus();
            }
          });
          buttonsContainer.appendChild(button);
        });
        
        quickRepliesContainer.classList.remove('hidden');
      }

      // 隱藏快速回覆建議
      function hideQuickReplies() {
        const quickRepliesContainer = document.getElementById('ai-quick-replies');
        if (quickRepliesContainer) {
          quickRepliesContainer.classList.add('hidden');
        }
      }

      // 表情選擇器
      function setupEmojiPicker() {
        const emojiButton = document.getElementById('ai-emoji-button');
        const emojiPicker = document.getElementById('ai-emoji-picker');
        const input = document.getElementById('ai-chat-input');
        
        if (!emojiButton || !emojiPicker || !input) {
          console.warn('[AIChat] Emoji picker elements not found');
          return;
        }
        
        console.log('[AIChat] Setting up emoji picker');
        
        // 切換表情選擇器顯示
        emojiButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('[AIChat] Emoji button clicked');
          const isHidden = emojiPicker.classList.contains('hidden');
          if (isHidden) {
            emojiPicker.classList.remove('hidden');
            // 重置定位样式，使用 CSS 中定义的固定定位
            emojiPicker.style.bottom = '';
            emojiPicker.style.left = '';
            emojiPicker.style.transform = '';
          } else {
            emojiPicker.classList.add('hidden');
          }
        });
        
        // 點擊表情插入到輸入框
        const emojiItems = emojiPicker.querySelectorAll('.ai-chat-emoji-item');
        console.log('[AIChat] Found', emojiItems.length, 'emoji items');
        emojiItems.forEach((item, index) => {
          item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const emoji = item.getAttribute('data-emoji');
            console.log('[AIChat] Emoji clicked:', emoji);
            if (emoji && input) {
              const cursorPos = input.selectionStart || input.value.length;
              const textBefore = input.value.substring(0, cursorPos);
              const textAfter = input.value.substring(cursorPos);
              input.value = textBefore + emoji + textAfter;
              input.selectionStart = input.selectionEnd = cursorPos + emoji.length;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              emojiPicker.classList.add('hidden');
              input.focus();
              // 觸發按鈕狀態更新
              updateSendButtonState();
            }
          });
        });
        
        // 點擊外部關閉表情選擇器
        document.addEventListener('click', (e) => {
          if (emojiPicker && emojiButton) {
            if (!emojiPicker.contains(e.target) && !emojiButton.contains(e.target)) {
              emojiPicker.classList.add('hidden');
            }
          }
        });
        
        console.log('[AIChat] Emoji picker setup complete');
      }

      // 重新生成訊息
      async function regenerateMessage(messageId) {
        const messageDiv = document.querySelector('[data-message-id="' + messageId + '"]');
        if (!messageDiv) return;
        
        const messageText = messageDiv.querySelector('.ai-chat-ai-text')?.textContent || '';
        if (!messageText) return;
        
        // 找到這條訊息之前的用戶訊息
        const allMessages = Array.from(document.querySelectorAll('.ai-chat-user-message, .ai-chat-ai-message'));
        const currentIndex = allMessages.findIndex(msg => msg === messageDiv);
        if (currentIndex <= 0) return;
        
        // 找到對應的用戶訊息
        let userMessage = null;
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (allMessages[i].classList.contains('ai-chat-user-message')) {
            userMessage = allMessages[i].querySelector('.ai-chat-user-text')?.textContent || '';
            break;
          }
        }
        
        if (!userMessage) return;
        
        // 移除舊的 AI 訊息
        messageDiv.remove();
        
        // 重新發送請求
        const input = document.getElementById('ai-chat-input');
        if (input) {
          input.value = userMessage;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          setTimeout(() => {
            sendAIMessage();
          }, 100);
        }
      }

      // 複製訊息
      function copyMessage(messageId) {
        const messageDiv = document.querySelector('[data-message-id="' + messageId + '"]');
        if (!messageDiv) return;
        
        const messageText = messageDiv.querySelector('.ai-chat-ai-text')?.textContent || '';
        if (!messageText) return;
        
        navigator.clipboard.writeText(messageText).then(() => {
          // 顯示複製成功提示
          const button = messageDiv.querySelector('[onclick*="copyMessage"]');
          if (button) {
            const originalTitle = button.getAttribute('title');
            button.setAttribute('title', '已複製！');
            setTimeout(() => {
              button.setAttribute('title', originalTitle);
            }, 2000);
          }
          
          // 顯示 Toast 提示（如果可用）
          if (window.showToast) {
            window.showToast(MESSAGES.copiedToClipboard, 'success');
          }
        }).catch(err => {
          console.error('[AIChat] Failed to copy message:', err);
          if (window.showToast) {
            window.showToast(MESSAGES.copyFailed, 'error');
          }
        });
      }

      // 添加反應
      function addReaction(messageId, reaction) {
        const messageDiv = document.querySelector('[data-message-id="' + messageId + '"]');
        if (!messageDiv) return;
        
        // 檢查是否已經有反應區域
        let reactionsDiv = messageDiv.querySelector('.ai-chat-reactions');
        if (!reactionsDiv) {
          reactionsDiv = document.createElement('div');
          reactionsDiv.className = 'ai-chat-reactions';
          const bubble = messageDiv.querySelector('.ai-chat-ai-bubble');
          if (bubble) {
            bubble.appendChild(reactionsDiv);
          }
        }
        
        // 檢查是否已經有這個反應
        const existingReaction = reactionsDiv.querySelector('[data-reaction="' + reaction + '"]');
        if (existingReaction) {
          // 移除反應
          existingReaction.remove();
        } else {
          // 添加反應
          const reactionBadge = document.createElement('div');
          reactionBadge.className = 'ai-chat-reaction-badge active';
          reactionBadge.setAttribute('data-reaction', reaction);
          reactionBadge.textContent = reaction;
          reactionsDiv.appendChild(reactionBadge);
        }
        
        // 切換按鈕狀態
        const button = messageDiv.querySelector('[data-reaction="' + reaction + '"]');
        if (button) {
          button.classList.toggle('active');
        }
      }

      // 加載對話歷史
      async function loadConversationHistory() {
        try {
          // 檢查是否在線（避免離線時顯示錯誤）
          if (!navigator.onLine) {
            console.log('[AIChat] Offline mode: skipping conversation history load');
            return;
          }
          
          const response = await fetch('/api/ai/history?sessionId=' + encodeURIComponent(aiSessionId) + '&limit=50');
          if (!response.ok) return;
          
          const data = await response.json();
          if (!data.success || !data.history || data.history.length === 0) return;
          
          // 清空歡迎訊息
          const messagesContainer = document.getElementById('ai-chat-messages');
          const welcomeMessage = messagesContainer.querySelector('.ai-chat-welcome-message');
          if (welcomeMessage) {
            welcomeMessage.remove();
          }
          
          // 顯示歷史對話
          data.history.forEach(msg => {
            if (msg.message_type === 'user') {
              addMessage('user', msg.message_content);
            } else if (msg.message_type === 'assistant') {
              addMessage('assistant', msg.message_content);
            }
          });
          
          scrollToBottom();
        } catch (error) {
          // 靜默處理網絡錯誤（離線時正常）
          if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            console.log('[AIChat] Network error (likely offline):', error.message);
          } else {
            console.error('[AIChat] Error loading conversation history:', error);
          }
        }
      }

      // 確保在 DOM 完全載入後初始化
      function tryInitialize() {
        const input = document.getElementById('ai-chat-input');
        if (input) {
          console.log('[AIChat] DOM ready, initializing...');
          initializeAIChat();
          // 設置歡迎訊息的按鈕
          setupWelcomeButtons();
          // 設置表情選擇器
          setupEmojiPicker();
          // 初始顯示快速回覆
          showQuickReplies();
          // 加載對話歷史（如果有）
          loadConversationHistory();
          // 移動端優化
          handleMobileKeyboard();
          
          // 設置統計和分享按鈕
          const statsButton = document.getElementById('ai-chat-stats-button');
          const shareButton = document.getElementById('ai-chat-share-button');
          if (statsButton) {
            statsButton.addEventListener('click', showStatsModal);
          }
          if (shareButton) {
            shareButton.addEventListener('click', showShareModal);
          }
          
          // 設置 Modal 關閉按鈕
          const statsModalClose = document.getElementById('ai-chat-stats-modal-close');
          const shareModalClose = document.getElementById('ai-chat-share-modal-close');
          if (statsModalClose) {
            statsModalClose.addEventListener('click', closeStatsModal);
          }
          if (shareModalClose) {
            shareModalClose.addEventListener('click', closeShareModal);
          }
          
          // 設置重置對話按鈕
          const resetButton = document.getElementById('ai-chat-reset-conversation-button');
          if (resetButton) {
            resetButton.addEventListener('click', resetConversation);
          }
          
          // 設置分享功能按鈕
          const shareClipboardButton = document.getElementById('ai-chat-share-clipboard-button');
          const shareExportButton = document.getElementById('ai-chat-share-export-button');
          if (shareClipboardButton) {
            shareClipboardButton.addEventListener('click', shareToClipboard);
          }
          if (shareExportButton) {
            shareExportButton.addEventListener('click', exportToText);
          }
          
          // 點擊 Modal 外部關閉
          const statsModal = document.getElementById('ai-chat-stats-modal');
          const shareModal = document.getElementById('ai-chat-share-modal');
          if (statsModal) {
            statsModal.addEventListener('click', (e) => {
              if (e.target === statsModal) {
                closeStatsModal();
              }
            });
          }
          if (shareModal) {
            shareModal.addEventListener('click', (e) => {
              if (e.target === shareModal) {
                closeShareModal();
              }
            });
          }
          
          // 移動端：防止雙擊縮放
          if (isMobile()) {
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (event) => {
              const now = Date.now();
              if (now - lastTouchEnd <= 300) {
                event.preventDefault();
              }
              lastTouchEnd = now;
            }, false);
          }
        } else {
          console.log('[AIChat] DOM not ready yet, retrying...');
          setTimeout(tryInitialize, 100);
        }
      }

      // 立即嘗試初始化
      tryInitialize();
      
      // 也監聽 DOMContentLoaded（備用）
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          console.log('[AIChat] DOMContentLoaded fired');
          tryInitialize();
        });
      } else {
        // DOM 已經載入完成
        console.log('[AIChat] DOM already loaded');
        tryInitialize();
      }

      // Register Service Worker for offline support
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('[Service Worker] Registration successful:', registration.scope);
            })
            .catch((error) => {
              // 靜默處理 Service Worker 註冊失敗（某些環境可能不支持）
              console.log('[Service Worker] Registration failed (non-critical):', error.message);
            });
        });
      }

      // 處理字體載入失敗（使用 JavaScript 而非 inline event handler，避免 CSP 違規）
      window.addEventListener('load', () => {
        const fontLink = document.querySelector('link[href*="fonts.googleapis.com"]');
        if (fontLink) {
          fontLink.addEventListener('error', () => {
            // 字體載入失敗時，CSS 回退字體會自動生效
            console.log('[AIChat] Google Fonts failed to load, using fallback fonts');
          });
        }
      });

      // 額外的錯誤處理（作為備份，主要處理在腳本開頭）
      window.addEventListener('unhandledrejection', (event) => {
        const errorSource = event.reason?.stack || event.reason?.message || String(event.reason || '');
        const fileName = event.reason?.fileName || '';
        // 檢查是否是第三方腳本的錯誤
        if (errorSource.includes('giveFreely') || 
            errorSource.includes('givefreely') ||
            fileName.includes('giveFreely') ||
            fileName.includes('givefreely') ||
            errorSource.includes('cloudflareinsights') ||
            errorSource.includes('beacon') ||
            (errorSource.includes('payload') && (errorSource.includes('giveFreely') || fileName.includes('giveFreely')))) {
          event.preventDefault(); // 阻止錯誤顯示在控制台
          return; // 靜默忽略
        }
        // 其他錯誤正常處理
        console.error('[AIChat] Unhandled promise rejection:', event.reason);
      });
      
      // 處理同步錯誤
      window.addEventListener('error', (event) => {
        const errorSource = event.filename || event.message || '';
        if (errorSource.includes('giveFreely') || 
            errorSource.includes('givefreely') ||
            errorSource.includes('cloudflareinsights') ||
            errorSource.includes('beacon')) {
          event.preventDefault(); // 阻止錯誤顯示在控制台
          return; // 靜默忽略
        }
      });
    </script>
  `;

// 使用傳入的 nonce 來建立 CSP headers（不使用 SecurityService，因為它會生成新的 nonce）
const csp = [
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://maps.googleapis.com https://accounts.google.com https://ajax.googleapis.com`,
  `style-src 'self' https://fonts.googleapis.com 'nonce-${nonce}' 'unsafe-inline'`,
  `style-src-attr 'self' 'nonce-${nonce}' 'unsafe-inline'`,
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https: https://www.gstatic.com https://maps.googleapis.com https://maps.gstatic.com",
  "connect-src 'self' https://apis.google.com https://accounts.google.com https://maps.googleapis.com https://www.googleapis.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com https://api.openai.com https://fonts.googleapis.com",
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

// 建立完整的 HTML，不使用 pageTemplate（因為它會加入 header/footer）
const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>澎湖 AI 助手 - HOPENGHU</title>
      <link rel="icon" type="image/x-icon" href="/favicon.ico">
      <!-- 立即設置全局錯誤處理，在第三方腳本加載前 -->
      <script nonce="${nonce}">
        (function() {
          'use strict';
          // 處理未捕獲的 Promise 錯誤
          if (typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', function(event) {
              try {
                var errorSource = '';
                var fileName = '';
                var errorString = '';
                var errorMessage = '';
                
                if (event.reason) {
                  errorSource = (event.reason.stack || event.reason.message || String(event.reason) || '').toLowerCase();
                  fileName = (event.reason.fileName || event.reason.source || '').toLowerCase();
                  errorString = String(event.reason).toLowerCase();
                  errorMessage = (event.reason.message || String(event.reason) || '').toLowerCase();
                }
                
                // 檢查錯誤來源（包括文件名、堆棧、消息、payload 錯誤）
                var isThirdPartyError = 
                  errorSource.indexOf('givefreely') !== -1 ||
                  fileName.indexOf('givefreely') !== -1 ||
                  errorString.indexOf('givefreely') !== -1 ||
                  errorMessage.indexOf('givefreely') !== -1 ||
                  errorSource.indexOf('cloudflareinsights') !== -1 ||
                  errorSource.indexOf('beacon') !== -1 ||
                  // 檢查 payload 相關錯誤（giveFreely 常見錯誤）
                  (errorMessage.indexOf('payload') !== -1 && errorMessage.indexOf('undefined') !== -1) ||
                  (errorSource.indexOf('payload') !== -1 && errorSource.indexOf('undefined') !== -1);
                
                // 檢查錯誤堆棧中的文件名（giveFreely.tsx-4704fb7d.js）
                if (!isThirdPartyError && errorSource) {
                  isThirdPartyError = errorSource.indexOf('givefreely.tsx') !== -1 || 
                                     errorSource.indexOf('givefreely.js') !== -1 ||
                                     errorSource.indexOf('4704fb7d') !== -1; // 檢查特定的文件名哈希
                }
                
                // 檢查文件名中的 givefreely
                if (!isThirdPartyError && event.target && event.target.location) {
                  var url = String(event.target.location.href || '').toLowerCase();
                  isThirdPartyError = url.indexOf('givefreely') !== -1;
                }
                
                if (isThirdPartyError) {
                  event.preventDefault();
                  event.stopPropagation();
                  event.stopImmediatePropagation();
                  return false;
                }
              } catch (e) {
                // 忽略錯誤處理本身的錯誤
              }
            }, true);
            
            // 處理未捕獲的同步錯誤
            window.addEventListener('error', function(event) {
              try {
                var errorSource = ((event.filename || event.message || event.error?.stack || '') + '').toLowerCase();
                var errorMessage = (event.message || '').toLowerCase();
                
                // 檢查錯誤來源（包括文件名、消息、payload 錯誤）
                var isThirdPartyError = 
                  errorSource.indexOf('givefreely') !== -1 ||
                  errorMessage.indexOf('givefreely') !== -1 ||
                  errorSource.indexOf('cloudflareinsights') !== -1 ||
                  errorSource.indexOf('beacon') !== -1 ||
                  // 檢查 payload 相關錯誤
                  (errorMessage.indexOf('payload') !== -1 && errorMessage.indexOf('undefined') !== -1) ||
                  (errorSource.indexOf('payload') !== -1 && errorSource.indexOf('undefined') !== -1);
                
                // 檢查錯誤堆棧中的文件名
                if (!isThirdPartyError && event.error && event.error.stack) {
                  var stack = event.error.stack.toLowerCase();
                  isThirdPartyError = stack.indexOf('givefreely') !== -1 ||
                                     stack.indexOf('4704fb7d') !== -1;
                }
                
                // 檢查文件名中的 givefreely
                if (!isThirdPartyError && event.filename) {
                  isThirdPartyError = event.filename.toLowerCase().indexOf('givefreely') !== -1 ||
                                     event.filename.toLowerCase().indexOf('4704fb7d') !== -1;
                }
                
                if (isThirdPartyError) {
                  event.preventDefault();
                  event.stopPropagation();
                  event.stopImmediatePropagation();
                  return false;
                }
              } catch (e) {
                // 忽略錯誤處理本身的錯誤
              }
            }, true);
          }
        })();
      </script>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet" crossorigin="anonymous">
      <style nonce="${nonce}">
        ${cssContent || '/* CSS content not provided */'}
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          /* 字體回退：如果 Google Fonts 無法載入，使用系統字體 */
          font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft JhengHei', 'PingFang TC', 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;

return new Response(html, {
  headers: {
    'Content-Type': 'text/html;charset=utf-8',
    ...securityHeaders
  }
});
}
