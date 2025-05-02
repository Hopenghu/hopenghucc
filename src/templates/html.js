// src/templates/html.js
// Module for generating basic HTML page strings

// --- Shared HTML Components --- 

const getHeaderHtml = (user) => `
<header class="bg-blue-600 text-white p-4 shadow-md w-full">
  <div class="container mx-auto flex justify-between items-center">
    <a href="/" class="text-xl font-bold">Hopenghu</a>
    <nav>
      ${user 
        ? `<a href="/profile" class="px-3 py-2 hover:bg-blue-700 rounded">Profile</a>
           <form action="/api/auth/logout" method="POST" class="inline-block">
             <button type="submit" class="px-3 py-2 hover:bg-blue-700 rounded bg-transparent border-none text-white cursor-pointer">Logout</button>
           </form>`
        : `<a href="/api/auth/google" class="px-3 py-2 hover:bg-blue-700 rounded bg-blue-500 hover:bg-blue-700">Login with Google</a>` // Added button style here too
      }
    </nav>
  </div>
</header>
`;

const getFooterHtml = () => `
<footer class="bg-gray-200 text-gray-600 p-4 mt-auto w-full text-center">
  <div class="container mx-auto">
    © ${new Date().getFullYear()} Hopenghu. All rights reserved.
  </div>
</footer>
`;

// Wrapper function - Takes title, main content HTML, user state, and bundled CSS
const wrapPageHtml = (title, mainContentHtml, user, bundledCss = '') => `
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Hopenghu</title>
    <!-- Remove Tailwind CDN Script -->
    <!-- <script src="https://cdn.tailwindcss.com"></script> --> 
    <style>
      /* Inject bundled Tailwind CSS */
      ${bundledCss}
      /* Base styles */
      body { display: flex; flex-direction: column; min-height: 100vh; }
      main { flex-grow: 1; }
      /* Add more global custom styles here if needed */ 
    </style>
</head>
<body class="bg-gray-100 text-gray-800">
    ${getHeaderHtml(user)} 
    <main class="container mx-auto p-4 md:p-8 flex-grow flex flex-col items-center justify-center"> 
      ${mainContentHtml} 
    </main>
    ${getFooterHtml()}
</body>
</html>
`;

// --- Page Specific Content Generators --- 

/**
 * Generates only the main content HTML for the homepage.
 * @param {object|null} user User object or null if not logged in.
 * @returns {string} HTML string for the main content.
 */
export function getHomePageContent(user) {
  const content = user ? `
    <h1 class="text-3xl font-bold mb-4">Welcome Back!</h1>
    <p class="mb-6 text-lg">Hello, ${user.name || user.email}!</p>
    <div class="flex space-x-4">
      <a href="/profile" class="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200">View Profile</a> 
    </div>
    ` : `
    <h1 class="text-3xl font-bold mb-4">Welcome to Hopenghu Dev</h1>
    <p class="mb-6 text-lg">Please log in to access features.</p>
    <a href="/api/auth/google" class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200">Login with Google</a>
  `;
  return `<div class="text-center">${content}</div>`;
}

/**
 * Generates only the main content HTML for the Google Info/Login Success page.
 * @param {object|null} user User object or null.
 * @returns {string} HTML string for the main content.
 */
export function getGoogleInfoContent(user) {
   const userName = user ? (user.name || user.email) : 'Guest';
   return `
    <div class="text-center bg-white p-8 rounded shadow-md">
        <h1 class="text-2xl font-semibold text-green-600 mb-4">Google Login Successful!</h1>
        <p class="mb-4">Welcome, ${userName}!</p>
        <p class="mb-6 text-gray-600">You have been successfully authenticated.</p>
        <a href="/" class="text-blue-500 hover:underline">Go back home</a>
    </div>
   `;
}

/**
 * Generates only the main content HTML for the User Profile page.
 * @param {object} user User object (assumed to be valid and passed).
 * @returns {string} HTML string for the main content.
 */
export function getProfilePageContent(user) {
  if (!user) return `<p>Error: User data is missing.</p>`; 

  const displayName = user.name ? String(user.name).replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/A';
  const displayEmail = user.email ? String(user.email).replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'N/A';
  const avatarUrl = user.avatar_url ? String(user.avatar_url) : ''; 
  const avatarDisplay = avatarUrl 
    ? `<img src="${avatarUrl}" alt="User Avatar" class="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-gray-300">` 
    : '<div class="w-20 h-20 rounded-full mx-auto mb-4 bg-gray-300 flex items-center justify-center text-gray-500">No Pic</div>';

  return `
    <h1 class="text-3xl font-bold text-gray-800 mb-4">使用者個人資料</h1>
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        ${avatarDisplay}
        <p class="text-lg mb-2"><strong>Name:</strong> ${displayName}</p>
        <p class="text-lg text-gray-600 mb-6"><strong>Email:</strong> ${displayEmail}</p>
        
        <!-- Removed GMB Link -->
        <!-- 
        <a 
            href="/api/auth/google/request-gmb-scope" 
            class="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mb-4 transition duration-200 ease-in-out no-underline"
        >
            連接我的 Google 商家
        </a>
        -->

        <!-- Added "My Businesses" Link (Placeholder) -->
        <a 
            href="/my-businesses" 
            class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4 transition duration-200 ease-in-out no-underline"
        >
            我的商家
        </a>
        <!-- End Added "My Businesses" Link -->
        
        <a href="/" class="text-blue-500 hover:underline">返回首頁</a>
    </div>
`;
}

/**
 * Generates only the main content HTML for the Add Place page.
 * Includes the search input and necessary JavaScript for Google Places Autocomplete.
 * @returns {string} HTML string for the main content.
 */
export function getAddPlacePageContent() {
    // Note: We are migrating from the deprecated Autocomplete class to PlaceAutocompleteElement
    return `
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-xl">
        <h1 class="text-2xl font-bold mb-6 text-gray-800">新增地點 (透過 Google 地標搜尋)</h1>
        
        <div class="mb-4">
            <label for="place-autocomplete-element" class="block text-sm font-medium text-gray-700 mb-1">搜尋地點名稱或地址:</label>
            <!-- Use the new PlaceAutocompleteElement Web Component -->
            <gmp-place-autocomplete \
                id="place-autocomplete-element" \
                placeholder="例如：澎湖跨海大橋 或 台北101" \
                class="w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-ocean focus:border-primary-ocean sm:text-sm p-2" \
                request-language="zh-TW" \
                request-region="tw"> \
                <!-- The input field is now part of the component --> \
            </gmp-place-autocomplete> \
        </div> \

        <div id="message-area" class="mt-4 text-sm"></div> \

    </div> \

    <script>\n      let mapsApiKey = null;\n      let autocompleteElement; // Reference to the web component\n\n      // Function to initialize Google Maps script and Autocomplete\n      async function initMap() {\n        try {\n            // 1. Fetch API Key from our backend\n            const configResponse = await fetch('/api/maps/config');\n            if (!configResponse.ok) {\n                throw new Error('Failed to fetch Maps config');\n            }\n            const config = await configResponse.json();\n            mapsApiKey = config.apiKey;\n            if (!mapsApiKey) {\n                 throw new Error('Maps API Key not provided by backend.');\n            }\n\n            // 2. Load Google Maps JS API script dynamically\n            const script = document.createElement('script');\n            // Request specific libraries: places and the NEW places.element\n            // Added loading=async based on warning\n            script.src = 'https://maps.googleapis.com/maps/api/js?key=' + mapsApiKey + '&libraries=places,places.element&callback=initAutocomplete&loading=async';\n            window.initAutocomplete = initAutocomplete; // Make initAutocomplete globally accessible for the callback\n            document.head.appendChild(script);\n\n        } catch (error) {\n            console.error('Error initializing map script:', error);\n            setMessage('錯誤：無法載入地圖搜尋功能。請稍後再試。 (' + error.message + ')', 'error');\n        }\n      }\n\n      // 3. Callback function to initialize Autocomplete once the script is loaded\n      function initAutocomplete() {\n         console.log('Google Maps API loaded. Initializing PlaceAutocompleteElement...');\n         autocompleteElement = document.getElementById('place-autocomplete-element');\n         \n         if (!autocompleteElement) {\n              console.error('Place Autocomplete Element not found!');\n              setMessage('錯誤：無法初始化搜尋元件。', 'error');\n              return;\n         }\n         \n         // Ensure the component library is loaded before adding listener\n         if (google && google.maps && google.maps.places && google.maps.places.PlaceAutocompleteElement) {\n              // 4. Add listener for the new 'gmp-placechange' event\n              autocompleteElement.addEventListener('gmp-placechange', handlePlaceSelect);\n              console.log('PlaceAutocompleteElement initialized and listener added.');\n         } else {\n              console.error('PlaceAutocompleteElement library not ready.');\n              setMessage('錯誤：地圖元件尚未準備就緒。', 'error');\n         }\n      }\n      \n      // Helper function to set messages\n      function setMessage(text, type = 'info') {\n          const messageArea = document.getElementById('message-area');\n          if (!messageArea) return;\n          messageArea.textContent = text;\n          if (type === 'error') {\n              messageArea.className = 'mt-4 text-sm text-red-600';\n          } else if (type === 'success') {\n              messageArea.className = 'mt-4 text-sm text-green-600';\n          } else if (type === 'warning') {\n              messageArea.className = 'mt-4 text-sm text-orange-600';\n          } else { \n              messageArea.className = 'mt-4 text-sm text-blue-600'; // Default/Info\n          }\n      }\n\n      // 5. Handle place selection using the new event\n      async function handlePlaceSelect(event) {\n        setMessage(''); // Clear previous messages\n        \n        const place = event.detail.place; \n        \n        if (!place || !place.id) {\n          console.warn('Autocomplete event fired without place ID:', place);\n          setMessage('請從建議列表中選擇一個有效的地點。', 'warning');\n          return;\n        }\n\n        const googlePlaceId = place.id;\n        const placeName = place.displayName || place.formattedAddress || googlePlaceId; // Use best available name\n\n        // --- SIMPLIFIED LOGIC: Only log to console --- \n        console.log('--- Place Selected (Debug) ---');\n        console.log('Name:', placeName);\n        console.log('ID (Place ID):', googlePlaceId);\n        console.log('Full Place Object:', place); // Log the whole object for inspection
        setMessage('地點已在控制台記錄 (開發測試)。 Name: ' + placeName + ', ID: ' + googlePlaceId, 'info');
        // --- End Simplified Logic ---
      }\n\n      // Start the process when the script runs\n      initMap();\n\n    </script>\n    `;
}

// --- Full Page Generators (using wrapPageHtml) --- 

export function getHomePageHtml(user, bundledCss) {
  return wrapPageHtml("Home", getHomePageContent(user), user, bundledCss);
}

export function getGoogleInfoPageHtml(user, bundledCss) {
  return wrapPageHtml("Login Status", getGoogleInfoContent(user), user, bundledCss);
}

export function getProfilePageHtml(user, bundledCss) {
  return wrapPageHtml("Profile", getProfilePageContent(user), user, bundledCss);
}

export function getAddPlacePageHtml(user, bundledCss) {
    return wrapPageHtml("Add New Place", getAddPlacePageContent(), user, bundledCss);
} 