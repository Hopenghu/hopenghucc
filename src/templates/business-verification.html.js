export function businessVerificationPage(user, message = '', placesForDropdown = []) {
    const loggedIn = user && user.email;

    return `
        <style>
            body {
                font-family: sans-serif;
                margin: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                max-width: 700px;
                margin: auto;
            }
            h1, h2 {
                color: #333;
            }
            .form-section {
                margin-bottom: 30px;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            input[type="text"], input[type="email"], select {
                width: calc(100% - 22px);
                padding: 10px;
                margin-bottom: 10px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
            button {
                background-color: #007bff;
                color: white;
                padding: 10px 15px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            }
            button:hover {
                background-color: #0056b3;
            }
            .message {
                padding: 10px;
                margin-bottom: 15px;
                border-radius: 4px;
                color: #fff;
            }
            .message.success {
                background-color: #28a745;
            }
            .message.error {
                background-color: #dc3545;
            }
            .user-info {
                margin-bottom: 20px;
                padding: 10px;
                background-color: #e9ecef;
                border-radius: 4px;
            }
        </style>
        <div class="container">
            <h1>商家驗證測試頁面</h1>

            ${loggedIn ? `
                <div class="user-info">
                    已登入：${user.name} (${user.email})
                    <form action="/api/auth/logout" method="post" style="display: inline; margin-left: 10px;">
                        <button type="submit">登出</button>
                    </form>
                </div>
            ` : `
                <div class="user-info">
                    尚未登入。
                    <form action="/api/auth/google" method="post" style="display: inline; margin-left: 10px;">
                        <button type="submit">使用 Google 登入</button>
                    </form>
                </div>
            `}

            ${message ? `<div class="message ${message.type === 'success' ? 'success' : 'error'}">${message.text}</div>` : ''}

            <div class="form-section">
                <h2>網站管理者：發起驗證</h2>
                <form id="adminInitiateForm" method="POST" action="/test/business-verification/admin-initiate">
                    <label for="adminPlaceId">選擇 Google 地標:</label>
                    ${placesForDropdown && placesForDropdown.length > 0 ? `
                        <select id="adminPlaceId" name="placeId" required class="w-full p-2 mb-2 border border-gray-300 rounded-md">
                            <option value="" disabled selected>-- 請選擇一個地標 --</option>
                            ${placesForDropdown.map(place => `
                                <option value="${place.google_place_id}">${place.name} (ID: ${place.google_place_id ? place.google_place_id.substring(0, 10) : 'N/A'}...)</option>
                            `).join('')}
                        </select>
                    ` : `
                        <p class="text-gray-500 mb-2">目前沒有已同步的 Google 地標可供選擇。請先透過「新增地點」功能加入。</p>
                        <input type="text" id="adminPlaceId_fallback" name="placeId" placeholder="或手動輸入 Place ID (如果列表為空)" class="w-full p-2 mb-2 border border-gray-300 rounded-md">
                    `}
                    <button type="submit">管理者發起</button>
                </form>
            </div>

            <div class="form-section">
                <h2>Google 登入使用者：申請驗證</h2>
                ${loggedIn ? `
                    <form id="userRequestForm" method="POST" action="/test/business-verification/user-request">
                        <label for="userPlaceId">您的 Google 地標 Place ID:</label>
                        <input type="text" id="userPlaceId" name="placeId" required>
                        <button type="submit">我擁有此地標，申請驗證</button>
                    </form>
                ` : `
                    <p>請先登入以申請驗證您的商家地標。</p>
                `}
            </div>

            <div id="apiResponseArea" style="margin-top: 20px; padding:10px; border: 1px solid #eee; background: #f9f9f9; border-radius: 4px; white-space: pre-wrap;">
                API 回應將顯示於此...
            </div>
        </div>

        <script>
            async function handleFormSubmit(event) {
                event.preventDefault();
                const form = event.target;
                const formData = new FormData(form);
                const responseArea = document.getElementById('apiResponseArea');
                responseArea.textContent = '處理中...';

                try {
                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    responseArea.textContent = JSON.stringify(result, null, 2);
                    
                    if (result.flashMessage) {
                         const messageDiv = document.createElement('div');
                         messageDiv.className = 'message ' + (result.flashMessage.type || 'success');
                         messageDiv.textContent = result.flashMessage.text;
                         document.querySelector('.container').insertBefore(messageDiv, document.querySelector('.form-section'));
                    }

                } catch (error) {
                    console.error('Form submission error:', error);
                    responseArea.textContent = '發生錯誤：' + error.message;
                }
            }

            document.addEventListener('DOMContentLoaded', () => {
                const adminForm = document.getElementById('adminInitiateForm');
                if (adminForm) adminForm.addEventListener('submit', handleFormSubmit);

                const userForm = document.getElementById('userRequestForm');
                if (userForm) userForm.addEventListener('submit', handleFormSubmit);
            });
        </script>
    `;
}
