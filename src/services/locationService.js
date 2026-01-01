import { ImageCacheService } from './ImageCacheService.js';

export class LocationService {
    constructor(db, mapsApiKey = null) {
        console.log("[LocationService CONSTRUCTOR V20240726_0900_FIX] Initializing with DB:", !!db, "and API Key:", !!mapsApiKey);
        if (!db) {
            throw new Error("Database connection (db) is required for LocationService.");
        }
        this.db = db;
        this.apiKey = mapsApiKey;
        this.googleApiBaseUrl = "https://maps.googleapis.com/maps/api";
        this.imageCacheService = new ImageCacheService(db);
        console.log("[LocationService CONSTRUCTOR] Initialized successfully with ImageCacheService.");
    }

    /**
     * Fetches place details from Google Places API.
     * @param {string} googlePlaceId - The Google Place ID.
     * @returns {Promise<object|null>} Standardized location object or null if not found/error.
     */
    async fetchPlaceDetails(googlePlaceId) {
        console.log("[LocationService fetchPlaceDetails] Method called with googlePlaceId:", googlePlaceId);
        if (!googlePlaceId) {
            console.error('[LocationService] fetchPlaceDetails called without googlePlaceId.');
            return null;
        }
        if (!this.apiKey) {
            console.error('[LocationService] fetchPlaceDetails called without API key.');
            return null;
        }
        console.log(`[LocationService] Fetching Google Place details for placeId: ${googlePlaceId}`);
        
        const fields = 'place_id,name,formatted_address,geometry/location,types,website,international_phone_number,business_status,rating,user_ratings_total,photos,editorial_summary';
        const url = `${this.googleApiBaseUrl}/place/details/json?place_id=${encodeURIComponent(googlePlaceId)}&fields=${encodeURIComponent(fields)}&language=zh-TW&key=${this.apiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || data.status !== 'OK') {
                console.error(`[LocationService] Google Places API error for placeId ${googlePlaceId}. Status: ${data.status}, Error: ${data.error_message || 'Unknown error'}`);
                return null; 
            }

            const result = data.result;
            if (!result || !result.geometry || !result.geometry.location) {
                 console.error(`[LocationService] Google Places API response missing essential data for placeId ${googlePlaceId}.`);
                 return null;
            }

            let photoUrls = [];
            if (result.photos && result.photos.length > 0) {
                // 處理圖片URL並嘗試緩存
                for (const photo of result.photos.slice(0, 3)) {
                    const originalUrl = `${this.googleApiBaseUrl}/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`;
                    
                    // 檢查是否有緩存的URL
                    const cachedUrl = await this.imageCacheService.getCachedImageUrl(originalUrl);
                    if (cachedUrl) {
                        photoUrls.push(cachedUrl);
                    } else {
                        // 如果沒有緩存，使用原始URL並嘗試緩存
                        photoUrls.push(originalUrl);
                        // 異步緩存URL（不等待完成）
                        this.imageCacheService.cacheImageUrl(originalUrl, originalUrl).catch(err => 
                            console.warn('[LocationService] Failed to cache image URL:', err)
                        );
                    }
                }
            }

            const locationDetails = {
                googlePlaceId: result.place_id,
                name: result.name,
                address: result.formatted_address || null, 
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                googleTypes: result.types || [], 
                website: result.website || null,
                phone_number: result.international_phone_number || null,
                business_status: result.business_status || null,
                google_rating: result.rating != null ? result.rating : null,
                google_user_ratings_total: result.user_ratings_total != null ? result.user_ratings_total : null,
                photoUrls: photoUrls,
                editorialSummary: result.editorial_summary ? result.editorial_summary.overview : null,
                sourceType: 'google_place' 
            };
            
            // 檢查地點是否已存在於資料庫中
            const existingLocation = await this.findLocationByPlaceId(result.place_id);
            if (existingLocation) {
                locationDetails.existingLocation = existingLocation;
                console.log(`[LocationService] Location ${locationDetails.name} already exists in database (ID: ${existingLocation.id})`);
            }
            
            console.log(`[LocationService] Successfully fetched details for ${locationDetails.name}`);
            return locationDetails;

        } catch (error) {
            console.error(`[LocationService] Network or fetch error calling Google Places API for placeId ${googlePlaceId}:`, error);
            return null;
        }
    }

    /**
     * Finds a location in the local DB by Google Place ID.
     * @param {string} googlePlaceId 
     * @returns {Promise<object|null>} Location object from DB or null.
     */
    async findLocationByPlaceId(googlePlaceId) {
        console.log("[LocationService findLocationByPlaceId] Method called with googlePlaceId:", googlePlaceId);
        if (!googlePlaceId) return null;
        try {
            const stmt = this.db.prepare("SELECT * FROM locations WHERE google_place_id = ?");
            const result = await stmt.bind(googlePlaceId).first();
            return result || null;
        } catch (error) {
            console.error(`[LocationService] Error finding location by placeId ${googlePlaceId}:`, error);
            throw new Error('Database query failed finding location by Place ID.'); 
        }
    }

    /**
     * Searches for a place by name using Google Places API (Text Search).
     * @param {string} query - The search query (place name).
     * @param {string} region - Optional region bias (e.g., 'tw' for Taiwan, 'penghu').
     * @returns {Promise<Array<object>>} Array of location objects or empty array.
     */
    async searchPlaceByName(query, region = 'tw') {
        console.log("[LocationService searchPlaceByName] Searching for:", query);
        if (!query || !query.trim()) {
            return [];
        }
        if (!this.apiKey) {
            console.error('[LocationService] searchPlaceByName called without API key.');
            return [];
        }

        try {
            // 使用 Text Search API
            // 限制在澎湖地區：加入 locationbias 參數（澎湖大致座標：23.5, 119.5）
            const locationbias = `circle:50000@23.5,119.5`; // 50km 半徑，澎湖中心
            const url = `${this.googleApiBaseUrl}/place/textsearch/json?query=${encodeURIComponent(query)}&language=zh-TW&region=${region}&locationbias=${locationbias}&key=${this.apiKey}`;

            console.log(`[LocationService] Calling Google Places Text Search API for: ${query}`);
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || data.status !== 'OK') {
                console.error(`[LocationService] Google Places Text Search API error. Status: ${data.status}, Error: ${data.error_message || 'Unknown error'}`);
                
                // 如果是 REQUEST_DENIED，可能是因為需要新版 API
                if (data.status === 'REQUEST_DENIED') {
                    console.error(`[LocationService] REQUEST_DENIED - This endpoint may require Places API (Legacy) or need to migrate to new Places API`);
                    console.error(`[LocationService] Please check if Places API (New) supports this endpoint, or consider migrating to new API`);
                }
                
                return [];
            }

            if (!data.results || data.results.length === 0) {
                console.log(`[LocationService] No results found for query: ${query}`);
                return [];
            }

            // 轉換結果為標準格式
            const locations = [];
            for (const result of data.results.slice(0, 5)) { // 最多返回 5 個結果
                if (!result.place_id) continue;

                // 檢查是否已在資料庫中
                const existing = await this.findLocationByPlaceId(result.place_id);
                
                const location = {
                    googlePlaceId: result.place_id,
                    name: result.name,
                    address: result.formatted_address || null,
                    latitude: result.geometry?.location?.lat || null,
                    longitude: result.geometry?.location?.lng || null,
                    googleTypes: result.types || [],
                    google_rating: result.rating != null ? result.rating : null,
                    google_user_ratings_total: result.user_ratings_total != null ? result.user_ratings_total : null,
                    business_status: result.business_status || null,
                    sourceType: 'google_place_search',
                    alreadyInDatabase: !!existing,
                    existingLocationId: existing?.id || null
                };

                locations.push(location);
            }

            console.log(`[LocationService] Found ${locations.length} locations for query: ${query}`);
            return locations;

        } catch (error) {
            console.error(`[LocationService] Network or fetch error calling Google Places Text Search API for query ${query}:`, error);
            return [];
        }
    }

    /**
     * Searches for a place using Google Places API Find Place (more precise).
     * @param {string} input - The search input (name, address, or phone number).
     * @param {string} inputType - 'textquery' or 'phonenumber'.
     * @returns {Promise<Array<object>>} Array of location objects or empty array.
     */
    async findPlace(input, inputType = 'textquery') {
        console.log("[LocationService findPlace] Searching for:", input, "type:", inputType);
        if (!input || !input.trim()) {
            console.log("[LocationService findPlace] Input is empty");
            return [];
        }
        if (!this.apiKey) {
            console.error('[LocationService] findPlace called without API key.');
            return [];
        }

        try {
            const fields = 'place_id,name,formatted_address,geometry/location,types,website,international_phone_number,business_status,rating,user_ratings_total,editorial_summary';
            const locationbias = `circle:50000@23.5,119.5`; // 澎湖地區偏好
            const url = `${this.googleApiBaseUrl}/place/findplacefromtext/json?input=${encodeURIComponent(input)}&inputtype=${inputType}&fields=${encodeURIComponent(fields)}&locationbias=${locationbias}&language=zh-TW&key=${this.apiKey}`;

            console.log(`[LocationService] Calling Google Places Find Place API`);
            console.log(`[LocationService] URL: ${url.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
            console.log(`[LocationService] Input: ${input}`);
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log(`[LocationService] Google Places API response status: ${data.status}`);
            if (data.error_message) {
                console.error(`[LocationService] Google Places API error: ${data.error_message}`);
            }

            if (!response.ok || data.status !== 'OK') {
                console.error(`[LocationService] Google Places Find Place API error. Status: ${data.status}, Error: ${data.error_message || 'Unknown error'}`);
                
                // 如果是 REQUEST_DENIED，可能是因為需要新版 API
                if (data.status === 'REQUEST_DENIED') {
                    console.error(`[LocationService] REQUEST_DENIED - This endpoint may require Places API (Legacy) or need to migrate to new Places API`);
                    console.error(`[LocationService] Please check if Places API (New) supports this endpoint, or consider migrating to new API`);
                }
                
                return [];
            }

            if (!data.candidates || data.candidates.length === 0) {
                console.log(`[LocationService] No candidates found for query: ${input}`);
                return [];
            }

            // 轉換結果為標準格式
            const locations = [];
            for (const candidate of data.candidates.slice(0, 5)) {
                if (!candidate.place_id) continue;

                // 檢查是否已在資料庫中
                const existing = await this.findLocationByPlaceId(candidate.place_id);
                
                const location = {
                    googlePlaceId: candidate.place_id,
                    name: candidate.name,
                    address: candidate.formatted_address || null,
                    latitude: candidate.geometry?.location?.lat || null,
                    longitude: candidate.geometry?.location?.lng || null,
                    googleTypes: candidate.types || [],
                    website: candidate.website || null,
                    phone_number: candidate.international_phone_number || null,
                    google_rating: candidate.rating != null ? candidate.rating : null,
                    google_user_ratings_total: candidate.user_ratings_total != null ? candidate.user_ratings_total : null,
                    business_status: candidate.business_status || null,
                    editorialSummary: candidate.editorial_summary?.overview || null,
                    sourceType: 'google_place_find',
                    alreadyInDatabase: !!existing,
                    existingLocationId: existing?.id || null
                };

                locations.push(location);
            }

            console.log(`[LocationService] Found ${locations.length} locations for query: ${input}`);
            return locations;

        } catch (error) {
            console.error(`[LocationService] Network or fetch error calling Google Places Find Place API for input ${input}:`, error);
            return [];
        }
    }

    /**
     * Finds a location in the local DB by its internal ID (UUID).
     * @param {string} internalId
     * @returns {Promise<object|null>} Location object from DB or null if not found.
     */
    async findLocationByInternalId(internalId) {
        if (!internalId) return null;
        try {
            const stmt = this.db.prepare("SELECT * FROM locations WHERE id = ?");
            const result = await stmt.bind(internalId).first();
            return result || null;
        } catch (error) {
            console.error(`[LocationService] Error finding location by internal ID ${internalId}:`, error);
            throw new Error('Database query failed finding location by internal ID.');
        }
    }

    /**
     * Creates a new location record in the local DB.
     * @param {object} locationData - Data for the new location.
     * @returns {Promise<object>} The newly created location object from DB (including generated ID).
     */
    async createLocation(locationData) {
        console.log("[LocationService createLocation V20240726_0900_FIX] ENTERING. locationData received:", !!locationData);

        try {
            console.log("[LocationService createLocation] Querying PRAGMA table_info(locations) before insert...");
            const tableInfo = await this.db.prepare("PRAGMA table_info(locations);").all();
            console.log("[LocationService createLocation] PRAGMA table_info(locations) result:", JSON.stringify(tableInfo.results));
        } catch (pragmaError) {
            console.error("[LocationService createLocation] Error querying PRAGMA table_info(locations):", pragmaError);
        }

        const newId = crypto.randomUUID();
        const now = new Date().toISOString(); 

        if (!locationData.name || locationData.latitude == null || locationData.longitude == null || !locationData.sourceType || !locationData.createdByUser) {
            console.error("[LocationService createLocation] Missing required fields:", locationData);
             throw new Error("Missing required fields to create location.");
        }
        
        const columnNames = [
            'id', 'google_place_id', 'name', 'address', 'latitude', 'longitude', 'source_type',
            'google_types', 'website', 'phone_number', 'business_status', 'google_rating',
            'google_user_ratings_total', 'created_by_user_id', 'created_at', 'updated_at',
            'thumbnail_url', 'editorial_summary', 'category', 'total_visits', 'total_itinerary_uses'
        ].join(', ');

        const thumbnailUrl = (locationData.photoUrls && locationData.photoUrls.length > 0) ? locationData.photoUrls[0] : null;
        const valuesWithCorrectedUserField = [
            newId,
            locationData.googlePlaceId || null,
            locationData.name,
            locationData.address || null,
            locationData.latitude,
            locationData.longitude,
            locationData.sourceType,
            locationData.googleTypes ? JSON.stringify(locationData.googleTypes) : null,
            locationData.website || null,
            locationData.phone_number || null,
            locationData.business_status || null,
            locationData.google_rating != null ? locationData.google_rating : null,
            locationData.google_user_ratings_total != null ? locationData.google_user_ratings_total : null,
            locationData.createdByUser, // for created_by_user_id
            now, // created_at
            now,  // updated_at
            thumbnailUrl,
            locationData.editorialSummary || null,
            locationData.category || null,  // category
            0,  // total_visits (default)
            0   // total_itinerary_uses (default)
        ];
        const placeholdersWithSummary = valuesWithCorrectedUserField.map(() => '?').join(',');

        console.log('[LocationService createLocation] SQL Columns:', columnNames);
        console.log('[LocationService createLocation] SQL Values (first few for brevity):', JSON.stringify(valuesWithCorrectedUserField.slice(0, 5)));
        console.log('[LocationService createLocation] Number of columns:', columnNames.split(',').length);
        console.log('[LocationService createLocation] Number of values:', valuesWithCorrectedUserField.length);

        const uniqueComment = `-- ${Date.now()}`;

        try {
            const stmt = this.db.prepare(
                `INSERT INTO locations (${columnNames}) VALUES (${placeholdersWithSummary}) ${uniqueComment}`
            );
            await stmt.bind(...valuesWithCorrectedUserField).run();

            const createdLocation = await this.db.prepare("SELECT * FROM locations WHERE id = ?").bind(newId).first();
            if (!createdLocation) { throw new Error('Failed to fetch created location from DB.') }
            console.log(`[LocationService createLocation] Successfully created location ${createdLocation.name} (ID: ${newId})`);
            return createdLocation;

        } catch (error) {
            console.error('[LocationService createLocation] Error during DB operation:', error);
            if (error.message && error.message.includes('UNIQUE constraint failed: locations.google_place_id')) {
                console.warn(`[LocationService createLocation] Attempted to create location with duplicate google_place_id: ${locationData.googlePlaceId}`);
                 throw new Error('Location with this Google Place ID already exists.');
            } else {
                // Make sure this specific error is re-thrown if it's the user_id one
                if (error.message && error.message.includes('no column named user_id')) {
                    console.error('[LocationService createLocation] Re-throwing D1_ERROR for user_id column issue.');
                    throw error; // Re-throw the original D1 error
                }
                 throw new Error('Database insert failed creating location.');
            }
        }
    }

    /**
     * Creates a new location record in the local DB from coordinates.
     * Minimal data is stored initially.
     * @param {object} coordinateData - Object containing { latitude, longitude, createdByUser }
     * @returns {Promise<object>} The newly created location object.
     */
    async createCoordinateLocation(coordinateData) {
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();

        if (coordinateData.latitude == null || coordinateData.longitude == null || !coordinateData.createdByUser) {
            console.error("[LocationService] Missing required fields for createCoordinateLocation:", coordinateData);
            throw new Error("Missing required fields (latitude, longitude, createdByUser) to create coordinate location.");
        }

        const valuesToInsert = [
            newId,
            null, 
            `Location @ ${coordinateData.latitude.toFixed(4)}, ${coordinateData.longitude.toFixed(4)}`,
            null, 
            coordinateData.latitude,
            coordinateData.longitude,
            'user_coordinate', 
            null, 
            null, 
            null, 
            null, 
            null, 
            null, 
            coordinateData.createdByUser, 
            now, 
            now  
        ];

        const placeholders = valuesToInsert.map(() => '?').join(',');
        const columnNames = [
            'id', 'google_place_id', 'name', 'address', 'latitude', 'longitude', 'source_type',
            'google_types', 'website', 'phone_number', 'business_status', 'google_rating',
            'google_user_ratings_total', 'created_by_user_id', 'created_at', 'updated_at'
        ].join(', ');

        try {
            const stmt = this.db.prepare(
               `INSERT INTO locations (${columnNames}) VALUES (${placeholders}) -- coord insert ${Date.now()}`
            );
            await stmt.bind(...valuesToInsert).run();

            const createdLocation = await this.db.prepare("SELECT * FROM locations WHERE id = ?").bind(newId).first();
            if (!createdLocation) { throw new Error('Failed to fetch created coordinate location from DB.') }
            console.log(`[LocationService] Successfully created coordinate location (ID: ${newId})`);
            return createdLocation;

        } catch (error) {
            console.error('[LocationService] Error creating coordinate location. DB Error:', error.message || error);
            throw new Error('Database insert failed creating coordinate location.');
        }
    }

     /**
     * Creates a user-location association.
     * @param {string} userId 
     * @param {string} locationId 
     * @param {object} options - Optional { user_description, status }
     * @returns {Promise<object>} The newly created user_location object.
     */
    async linkUserToLocation(userId, locationId, options = {}) {
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        const { user_description = null, status = null } = options;

        if (!userId || !locationId) {
            throw new Error("User ID and Location ID are required to link user to location.");
        }

        try {
            const stmt = this.db.prepare(
                `INSERT INTO user_locations (id, user_id, location_id, user_description, status, added_at)
                 VALUES (?, ?, ?, ?, ?, ?)`
            );
            await stmt.bind(
                newId,
                userId,
                locationId,
                user_description,
                status,
                now
            ).run();
            
            const createdLink = await this.db.prepare("SELECT * FROM user_locations WHERE id = ?").bind(newId).first();
             if (!createdLink) { throw new Error('Failed to fetch created user-location link from DB.') }
            console.log(`[LocationService] Successfully linked user ${userId} to location ${locationId} (Link ID: ${newId})`);
            return createdLink;

        } catch (error) {
            console.error(`[LocationService] Error linking user ${userId} to location ${locationId}:`, error);
            if (error.message && error.message.includes('UNIQUE constraint failed: user_locations.user_id, user_locations.location_id')) {
                console.warn(`[LocationService] User ${userId} is already linked to location ${locationId}.`);
                throw new Error('User is already associated with this location.');
            } else {
                 throw new Error('Database insert failed linking user to location.');
            }
        }
    }

    /**
     * Checks if a user is already linked to a specific location.
     * @param {string} userId 
     * @param {string} locationId 
     * @returns {Promise<boolean>}
     */
    async checkUserLocationLink(userId, locationId) {
       if (!userId || !locationId) return false;
       try {
           const stmt = this.db.prepare("SELECT 1 FROM user_locations WHERE user_id = ? AND location_id = ? LIMIT 1");
           const result = await stmt.bind(userId, locationId).first();
           return !!result;
       } catch (error) {
            console.error(`[LocationService] Error checking link between user ${userId} and location ${locationId}:`, error);
            throw new Error('Database query failed checking user-location link.');
       }
    }

    /**
     * Finds the nearest place using Nearby Search and fetches its full details.
     * @param {number} lat Latitude.
     * @param {number} lng Longitude.
     * @returns {Promise<object|null>} Standardized location object for the nearest place, or null if not found/error.
     */
    async findNearbyPlace(lat, lng) {
        if (lat == null || lng == null) {
            console.error('[LocationService] findNearbyPlace called without lat/lng.');
            return null;
        }
        console.log(`[LocationService] Performing Nearby Search around coords: ${lat}, ${lng}`);
        const nearbyUrl = `${this.googleApiBaseUrl}/place/nearbysearch/json?location=${lat}%2C${lng}&rankby=distance&key=${this.apiKey}&language=zh-TW`;
        let nearestPlaceId = null;
        try {
            const nearbyResponse = await fetch(nearbyUrl);
            const nearbyData = await nearbyResponse.json();
            if (!nearbyResponse.ok || nearbyData.status !== 'OK') {
                if (nearbyData.status === 'ZERO_RESULTS') {
                    console.log(`[LocationService] Nearby Search returned ZERO_RESULTS for ${lat}, ${lng}.`);
                    return null; 
                }
                console.error(`[LocationService] Google Nearby Search API error for coords ${lat},${lng}. Status: ${nearbyData.status}, Error: ${nearbyData.error_message || 'Unknown error'}`);
                return null; 
            }
            if (nearbyData.results && nearbyData.results.length > 0 && nearbyData.results[0].place_id) {
                nearestPlaceId = nearbyData.results[0].place_id;
                console.log(`[LocationService] Nearby Search found closest place ID: ${nearestPlaceId} (Name: ${nearbyData.results[0].name})`);
            } else {
                console.log(`[LocationService] Nearby Search returned OK but no results with place_id for ${lat}, ${lng}.`);
                return null; 
            }
        } catch (error) {
            console.error(`[LocationService] Network or fetch error calling Google Nearby Search API for coords ${lat},${lng}:`, error);
            return null; 
        }
        if (nearestPlaceId) {
            console.log(`[LocationService] Fetching full details for nearest place ID: ${nearestPlaceId}`);
            const fullDetails = await this.fetchPlaceDetails(nearestPlaceId);
            return fullDetails; 
        }
        return null;
    }

    /**
     * Performs reverse geocoding using Google Geocoding API.
     * @param {number} lat Latitude.
     * @param {number} lng Longitude.
     * @returns {Promise<{address: string|null, placeId: string|null, error?: string}>} 
     */
    reverseGeocodeCoordinates = async (lat, lng) => {
        if (lat == null || lng == null) {
            console.error('[LocationService] reverseGeocodeCoordinates called without lat/lng.');
            return { address: null, placeId: null, error: 'Latitude and Longitude are required.' };
        }
        console.log(`[LocationService] Performing reverse geocode for coords: ${lat}, ${lng}`);
        const url = `${this.googleApiBaseUrl}/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}&language=zh-TW`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (!response.ok || data.status !== 'OK') {
                console.error(`[LocationService] Google Geocoding API error for coords ${lat},${lng}. Status: ${data.status}, Error: ${data.error_message || 'Unknown error'}`);
                return { address: null, placeId: null, error: data.status || 'Geocoding API request failed' };
            }
            if (data.results && data.results.length > 0) {
                const firstResult = data.results[0];
                const formattedAddress = firstResult.formatted_address || null;
                const placeId = firstResult.place_id || null; 
                console.log(`[LocationService] Reverse geocode success for ${lat},${lng}. Address: ${formattedAddress}, PlaceID: ${placeId}`);
                return { address: formattedAddress, placeId: placeId };
            } else {
                console.warn(`[LocationService] Reverse geocode returned OK status but no results for ${lat},${lng}.`);
                return { address: null, placeId: null, error: 'ZERO_RESULTS' };
            }
        } catch (error) {
            console.error(`[LocationService] Network or fetch error calling Google Geocoding API for coords ${lat},${lng}:`, error);
            return { address: null, placeId: null, error: 'Network error during geocoding request.' };
        }
    }

    /**
     * Fetches all locations linked to a specific user.
     * @param {string} userId The ID of the user.
     * @returns {Promise<Array<object>>} An array of location objects linked to the user.
     */
    async getUserLocations(userId) {
        if (!userId) {
            console.warn('[LocationService] getUserLocations called without userId.');
            return [];
        }
        console.log(`[LocationService] Fetching locations for user: ${userId}`);
        try {
            const stmt = this.db.prepare(
                `SELECT
                    l.id, l.google_place_id, l.name, l.address, l.latitude, l.longitude, l.source_type, 
                    l.google_types, l.website, l.phone_number, l.business_status, l.google_rating, 
                    l.google_user_ratings_total, l.thumbnail_url, l.editorial_summary, l.created_at,
                    l.category, l.total_visits, l.total_itinerary_uses,
                    ul.added_at as user_added_at, ul.user_description, ul.status as user_location_status
                FROM user_locations ul
                JOIN locations l ON ul.location_id = l.id
                WHERE ul.user_id = ?
                ORDER BY ul.added_at DESC`
            );
            const { results } = await stmt.bind(userId).all();
            console.log(`[LocationService] Found ${results ? results.length : 0} locations for user ${userId}.`);
            
            // 使用ImageCacheService處理圖片URL
            const processedResults = await this.imageCacheService.processLocationsImages(results || []);
            console.log(`[LocationService] Processed ${processedResults.length} user locations with image cache service.`);
            
            return processedResults;
        } catch (error) {
            console.error(`[LocationService] Error fetching locations for user ${userId}:`, error);
            throw new Error('Database query failed fetching user locations.');
        }
    }

    /**
     * Fetches the most recent locations that have a thumbnail URL.
     * @param {number} limit Maximum number of locations to fetch.
     * @returns {Promise<Array<object>>} An array of location objects.
     */
    async getRecentLocationsWithThumbnails(limit = 12, userId = null) {
        console.log(`[LocationService] Fetching up to ${limit} recent locations with thumbnails for userId: ${userId}.`);
        try {
            let stmt;
            let results;
            
            if (userId) {
                // 包含用戶狀態的查詢
                stmt = this.db.prepare(
                    `SELECT 
                        l.id, l.google_place_id, l.name, l.address, l.latitude, l.longitude, 
                        l.source_type, l.google_types, l.website, l.phone_number, 
                        l.business_status, l.google_rating, l.google_user_ratings_total, 
                        l.thumbnail_url, l.editorial_summary, l.created_at,
                        ul.status as user_location_status
                    FROM locations l
                    LEFT JOIN user_locations ul ON l.id = ul.location_id AND ul.user_id = ?
                    ORDER BY l.created_at DESC
                    LIMIT ?`
                );
                const { results: queryResults } = await stmt.bind(userId, limit).all();
                results = queryResults;
            } else {
                // 不包含用戶狀態的查詢（向後兼容）
                stmt = this.db.prepare(
                    `SELECT 
                        id, google_place_id, name, address, latitude, longitude, source_type, google_types, 
                        website, phone_number, business_status, google_rating, google_user_ratings_total, 
                        thumbnail_url, editorial_summary, created_at
                    FROM locations
                    ORDER BY created_at DESC
                    LIMIT ?`
                );
                const { results: queryResults } = await stmt.bind(limit).all();
                results = queryResults;
            }
            
            console.log(`[LocationService] Found ${results ? results.length : 0} recent locations with thumbnails.`);
            
            // 使用ImageCacheService處理圖片URL
            const processedResults = await this.imageCacheService.processLocationsImages(results || []);
            console.log(`[LocationService] Processed ${processedResults.length} locations with image cache service.`);
            
            return processedResults;
        } catch (error) {
            console.error(`[LocationService] Error fetching recent locations:`, error);
            throw new Error('Database query failed fetching recent locations.');
        }
    }

    /**
     * Fetches locations with pagination support for lazy loading.
     * @param {number} limit - Maximum number of locations to fetch.
     * @param {number} offset - Number of locations to skip.
     * @param {string|null} userId - Optional user ID to include user location status.
     * @returns {Promise<Array<object>>} An array of location objects.
     */
    async getLocationsPaginated(limit = 20, offset = 0, userId = null) {
        console.log(`[LocationService] Fetching locations with pagination: limit=${limit}, offset=${offset}, userId=${userId}.`);
        try {
            let stmt;
            let results;
            
            if (userId) {
                // 包含用戶狀態的查詢
                stmt = this.db.prepare(
                    `SELECT 
                        l.id, l.google_place_id, l.name, l.address, l.latitude, l.longitude, 
                        l.source_type, l.google_types, l.website, l.phone_number, 
                        l.business_status, l.google_rating, l.google_user_ratings_total, 
                        l.thumbnail_url, l.editorial_summary, l.created_at,
                        ul.status as user_location_status
                    FROM locations l
                    LEFT JOIN user_locations ul ON l.id = ul.location_id AND ul.user_id = ?
                    ORDER BY l.created_at DESC
                    LIMIT ? OFFSET ?`
                );
                const { results: queryResults } = await stmt.bind(userId, limit, offset).all();
                results = queryResults;
            } else {
                // 不包含用戶狀態的查詢
                stmt = this.db.prepare(
                    `SELECT 
                        id, google_place_id, name, address, latitude, longitude, source_type, google_types, 
                        website, phone_number, business_status, google_rating, google_user_ratings_total, 
                        thumbnail_url, editorial_summary, created_at
                    FROM locations
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?`
                );
                const { results: queryResults } = await stmt.bind(limit, offset).all();
                results = queryResults;
            }
            
            console.log(`[LocationService] Found ${results ? results.length : 0} locations with pagination.`);
            
            // 使用ImageCacheService處理圖片URL
            const processedResults = await this.imageCacheService.processLocationsImages(results || []);
            console.log(`[LocationService] Processed ${processedResults.length} locations with image cache service.`);
            
            return processedResults;
        } catch (error) {
            console.error(`[LocationService] Error fetching locations with pagination:`, error);
            throw new Error('Database query failed fetching locations with pagination.');
        }
    }

    /**
     * Fetches locations for the admin invitation management interface.
     * Returns a list of locations linked to the admin, with their ID, name, address, and claimed status.
     * @param {string} adminUserId The ID of the admin user.
     * @returns {Promise<Array<object>>}
     */
    async getLocationsForAdminInvitation(adminUserId) {
        console.log(`[LocationService] Fetching locations for admin invitation management for admin: ${adminUserId}`);
        if (!adminUserId) {
            console.warn('[LocationService] getLocationsForAdminInvitation called without adminUserId.');
            return [];
        }
        try {
            const stmt = this.db.prepare(
                `SELECT l.id, l.name, l.address, l.claimed_by_user_id, l.owner_email 
                 FROM locations l
                 JOIN user_locations ul ON l.id = ul.location_id
                 WHERE ul.user_id = ?
                 ORDER BY l.created_at DESC`
            );
            const { results } = await stmt.bind(adminUserId).all();
            console.log(`[LocationService] Found ${results ? results.length : 0} locations for admin ${adminUserId} for invitation.`);
            return results || [];
        } catch (error) {
            console.error(`[LocationService] Error fetching locations for admin ${adminUserId} invitation:`, error);
            throw new Error('Database query failed fetching locations for admin.');
        }
    }

    /**
     * Marks a location as claimed by a user and updates the owner email.
     * Also ensures the user is linked in user_locations with an 'owner' status.
     * @param {string} locationId - The ID of the location to claim.
     * @param {string} userId - The ID of the user claiming the location.
     * @param {string} userEmail - The email of the user claiming the location (to be stored as owner_email).
     * @returns {Promise<{success: boolean, error?: string, message?: string}>}
     */
    async claimLocation(locationId, userId, userEmail) {
        console.log(`[LocationService] claimLocation called for locationId: ${locationId}, userId: ${userId}, userEmail: ${userEmail}`);
        if (!locationId || !userId || !userEmail) {
            return { success: false, error: 'missing_parameters', message: '缺少地點ID、用戶ID或用戶電子郵件。' };
        }

        const now = new Date().toISOString();

        try {
            // Update the locations table
            const stmtUpdateLocation = this.db.prepare(
                "UPDATE locations SET claimed_by_user_id = ?, owner_email = ?, updated_at = ? WHERE id = ?"
            );
            const updateResult = await stmtUpdateLocation.bind(userId, userEmail, now, locationId).run();

            if (updateResult.meta.changes === 0) {
                return { success: false, error: 'location_not_found_or_not_updated', message: '找不到地點或更新失敗。' };
            }

            // Ensure user is linked in user_locations, or update their status to 'owner'
            const existingLink = await this.checkUserLocationLink(userId, locationId);
            
            if (existingLink) {
                // If link exists, update status to owner and touch updated_at
                const stmtUpdateLink = this.db.prepare(
                    "UPDATE user_locations SET status = 'owner', updated_at = ? WHERE user_id = ? AND location_id = ?"
                );
                await stmtUpdateLink.bind(now, userId, locationId).run();
                console.log(`[LocationService] Updated existing user_locations link for userId ${userId} and locationId ${locationId} to status 'owner'.`);
            } else {
                // If link doesn't exist, create it with status 'owner'
                // Reusing linkUserToLocation or parts of its logic
                const linkOptions = {
                    status: 'owner', 
                    user_description: 'Claimed location ownership'
                };
                const linkSuccess = await this.linkUserToLocation(userId, locationId, linkOptions);
                if (!linkSuccess || (linkSuccess && linkSuccess.error)) { // Check if linkUserToLocation returns an error object
                    console.error(`[LocationService] Failed to link user ${userId} to location ${locationId} after claiming.`);
                    // Decide if this is a critical failure. For now, let's assume primary claim on 'locations' is most important.
                    // But we should log it as a potential inconsistency.
                    return { 
                        success: true, // Location itself was claimed
                        warning: 'location_claimed_but_link_failed', 
                        message: '地點已成功認領，但在建立用戶地點關聯時發生問題。請聯繫管理員。' 
                    };
                }
                 console.log(`[LocationService] Created new user_locations link for userId ${userId} and locationId ${locationId} with status 'owner'.`);
            }

            return { success: true, message: '地點已成功認領。' };

        } catch (dbError) {
            console.error("[LocationService] DB error during claimLocation:", dbError);
            // Check for specific foreign key constraint errors if needed
            return { success: false, error: 'db_error', message: '認領地點時發生資料庫錯誤。' };
        }
    }

    /**
     * Retrieves a list of locations that have a Google Place ID.
     * Used to populate dropdowns for admin tasks, for example.
     * @returns {Promise<Array<{id: string, name: string, google_place_id: string}>>}
     */
    async getActiveGooglePlaceIds() {
        console.log("[LocationService getActiveGooglePlaceIds] Fetching locations with Google Place IDs.");
        try {
            const stmt = this.db.prepare(
                "SELECT id, name, google_place_id FROM locations WHERE google_place_id IS NOT NULL ORDER BY name ASC"
            );
            const results = await stmt.all();
            return results.results || []; // .all() returns { results: [...] }
        } catch (error) {
            console.error("[LocationService] Error fetching active Google Place IDs:", error);
            throw new Error('Database query failed while fetching active Google Place IDs.');
        }
    }

    /**
     * Gets a location by its internal ID.
     * @param {string} locationId The internal location ID.
     * @returns {Promise<object|null>} The location object or null if not found.
     */
    async getLocationById(locationId) {
        if (!locationId) {
            console.warn('[LocationService] getLocationById called without locationId.');
            return null;
        }
        
        console.log(`[LocationService] Fetching location by ID: ${locationId}`);
        try {
            const stmt = this.db.prepare(
                `SELECT 
                    id, google_place_id, name, address, latitude, longitude, source_type, 
                    google_types, website, phone_number, business_status, google_rating, 
                    google_user_ratings_total, thumbnail_url, editorial_summary, created_at
                FROM locations
                WHERE id = ?`
            );
            const result = await stmt.bind(locationId).first();
            console.log(`[LocationService] Location found: ${result ? 'yes' : 'no'}`);
            return result;
        } catch (error) {
            console.error(`[LocationService] Error fetching location by ID ${locationId}:`, error);
            throw new Error('Database query failed fetching location by ID.');
        }
    }

    /**
     * Updates or creates a user location status.
     * @param {string} userId The user ID.
     * @param {string} locationId The location ID.
     * @param {string} status The status to set ('visited', 'want_to_visit', 'want_to_revisit', 'created').
     * @returns {Promise<boolean>} Success status.
     */
    async updateUserLocationStatus(userId, locationId, status) {
        if (!userId || !locationId || !status) {
            console.warn('[LocationService] updateUserLocationStatus called with missing parameters.');
            return false;
        }

        console.log(`[LocationService] Updating user location status: userId=${userId}, locationId=${locationId}, status=${status}`);
        
        const now = new Date().toISOString();
        
        try {
            // Check if the user-location link already exists
            const existingLink = await this.checkUserLocationLink(userId, locationId);
            
            if (existingLink) {
                // Update existing link
                const stmt = this.db.prepare(
                    `UPDATE user_locations 
                     SET status = ?, updated_at = ?
                     WHERE user_id = ? AND location_id = ?`
                );
                const result = await stmt.bind(status, now, userId, locationId).run();
                console.log(`[LocationService] Updated existing user location status. Changes: ${result.meta.changes}`);
            } else {
                // Create new link
                const stmt = this.db.prepare(
                    `INSERT INTO user_locations (user_id, location_id, status, added_at, updated_at)
                     VALUES (?, ?, ?, ?, ?)`
                );
                const result = await stmt.bind(userId, locationId, status, now, now).run();
                console.log(`[LocationService] Created new user location link. Changes: ${result.meta.changes}`);
            }
            
            return true;
        } catch (error) {
            console.error(`[LocationService] Error updating user location status:`, error);
            throw new Error('Database query failed updating user location status.');
        }
    }

    /**
     * Gets the count of user locations by status.
     * @param {string} userId The user ID.
     * @returns {Promise<object>} Object with counts for each status.
     */
    async getUserLocationCounts(userId) {
        if (!userId) {
            console.warn('[LocationService] getUserLocationCounts called without userId.');
            return { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 0, owner: 0 };
        }

        console.log(`[LocationService] Getting location counts for userId: ${userId}`);
        
        try {
            // 獲取 user_locations 表中的狀態統計
            const userLocationsStmt = this.db.prepare(
                `SELECT status, COUNT(*) as count
                 FROM user_locations
                 WHERE user_id = ?
                 GROUP BY status`
            );
            const { results: userLocationResults } = await userLocationsStmt.bind(userId).all();
            
            // 獲取用戶在 locations 表中創建的地點數量
            const createdLocationsStmt = this.db.prepare(
                `SELECT COUNT(*) as count
                 FROM locations
                 WHERE created_by_user_id = ?`
            );
            const { results: createdLocationResults } = await createdLocationsStmt.bind(userId).all();
            
            // Initialize counts
            const counts = { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 0, owner: 0 };
            
            // Update counts from user_locations results
            if (userLocationResults) {
                userLocationResults.forEach(row => {
                    if (row.status && counts.hasOwnProperty(row.status)) {
                        counts[row.status] = row.count;
                    }
                });
            }
            
            // Update created count from locations table
            if (createdLocationResults && createdLocationResults.length > 0) {
                counts.created = createdLocationResults[0].count;
            }
            
            console.log(`[LocationService] Location counts for userId ${userId}:`, counts);
            return counts;
        } catch (error) {
            console.error(`[LocationService] Error getting user location counts:`, error);
            throw new Error('Database query failed getting user location counts.');
        }
    }

    /**
     * Gets the global count of locations by status across all users.
     * @returns {Promise<object>} Object with global counts for each status.
     */
    async getGlobalLocationCounts() {
        console.log('[LocationService] Getting global location counts');
        
        try {
            const stmt = this.db.prepare(
                `SELECT status, COUNT(*) as count
                 FROM user_locations
                 GROUP BY status`
            );
            const { results } = await stmt.all();
            
            // Initialize counts
            const counts = { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 0, owner: 0 };
            
            // Update counts from database results
            if (results) {
                results.forEach(row => {
                    if (row.status && counts.hasOwnProperty(row.status)) {
                        counts[row.status] = row.count;
                    }
                });
            }
            
            console.log(`[LocationService] Global location counts:`, counts);
            return counts;
        } catch (error) {
            console.error(`[LocationService] Error getting global location counts:`, error);
            throw new Error('Database query failed getting global location counts.');
        }
    }

    /**
     * Gets the user's status for a specific location.
     * @param {string} userId The user ID.
     * @param {string} locationId The location ID.
     * @returns {Promise<string|null>} The user's status for the location, or null if not found.
     */
    async getUserLocationStatus(userId, locationId) {
        if (!userId || !locationId) {
            console.warn('[LocationService] getUserLocationStatus called with missing parameters.');
            return null;
        }

        console.log(`[LocationService] Getting user location status: userId=${userId}, locationId=${locationId}`);
        
        try {
            const stmt = this.db.prepare(
                `SELECT status
                 FROM user_locations
                 WHERE user_id = ? AND location_id = ?`
            );
            const result = await stmt.bind(userId, locationId).first();
            
            const status = result ? result.status : null;
            console.log(`[LocationService] User location status: ${status}`);
            return status;
        } catch (error) {
            console.error(`[LocationService] Error getting user location status:`, error);
            throw new Error('Database query failed getting user location status.');
        }
    }

    /**
     * Gets locations created by a specific user.
     * @param {string} userId The user ID.
     * @returns {Promise<Array<object>>} Array of locations created by the user.
     */
    async getUserCreatedLocations(userId) {
        if (!userId) {
            console.warn('[LocationService] getUserCreatedLocations called without userId.');
            return [];
        }

        console.log(`[LocationService] Getting locations created by user: ${userId}`);
        
        try {
            const stmt = this.db.prepare(
                `SELECT 
                    id, google_place_id, name, address, latitude, longitude, source_type, 
                    google_types, website, phone_number, business_status, google_rating, 
                    google_user_ratings_total, thumbnail_url, editorial_summary, created_at,
                    created_by_user_id,
                    'created' as user_location_status
                FROM locations
                WHERE created_by_user_id = ?
                ORDER BY created_at DESC`
            );
            const { results } = await stmt.bind(userId).all();
            
            console.log(`[LocationService] Found ${results ? results.length : 0} locations created by user ${userId}`);
            
            // 使用ImageCacheService處理圖片URL
            const processedResults = await this.imageCacheService.processLocationsImages(results || []);
            console.log(`[LocationService] Processed ${processedResults.length} user created locations with image cache service.`);
            
            return processedResults;
        } catch (error) {
            console.error(`[LocationService] Error getting user created locations:`, error);
            throw new Error('Database query failed getting user created locations.');
        }
    }

    /**
     * Gets the count of user interactions for a specific location by status.
     * @param {string} locationId The location ID.
     * @returns {Promise<object>} Object with counts for each status for this location.
     */
    async getLocationInteractionCounts(locationId) {
        if (!locationId) {
            console.warn('[LocationService] getLocationInteractionCounts called without locationId.');
            return { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 0, owner: 0 };
        }

        console.log(`[LocationService] Getting interaction counts for location: ${locationId}`);
        
        try {
            const stmt = this.db.prepare(
                `SELECT status, COUNT(*) as count
                 FROM user_locations
                 WHERE location_id = ?
                 GROUP BY status`
            );
            const { results } = await stmt.bind(locationId).all();
            
            // Initialize counts
            const counts = { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 0, owner: 0 };
            
            // Update counts from database results
            if (results) {
                results.forEach(row => {
                    if (row.status && counts.hasOwnProperty(row.status)) {
                        counts[row.status] = row.count;
                    }
                });
            }
            
            console.log(`[LocationService] Interaction counts for location ${locationId}:`, counts);
            return counts;
        } catch (error) {
            console.error(`[LocationService] Error getting location interaction counts:`, error);
            throw new Error('Database query failed getting location interaction counts.');
        }
    }

    /**
     * 批量獲取多個地點的互動統計
     * 優化 N+1 查詢問題
     * @param {Array<string>} locationIds - 地點 ID 陣列
     * @returns {Promise<object>} 以 locationId 為 key 的統計對象
     */
    async getBatchLocationInteractionCounts(locationIds) {
        if (!locationIds || locationIds.length === 0) {
            return {};
        }

        console.log(`[LocationService] Getting batch interaction counts for ${locationIds.length} locations`);
        
        try {
            // 使用 IN 子句批量查詢
            const placeholders = locationIds.map(() => '?').join(',');
            const stmt = this.db.prepare(
                `SELECT 
                    location_id,
                    status,
                    COUNT(*) as count
                 FROM user_locations
                 WHERE location_id IN (${placeholders})
                 GROUP BY location_id, status`
            );
            const { results } = await stmt.bind(...locationIds).all();
            
            // 初始化所有地點的計數
            const countsMap = {};
            locationIds.forEach(id => {
                countsMap[id] = { visited: 0, want_to_visit: 0, want_to_revisit: 0, created: 0, owner: 0 };
            });
            
            // 更新計數
            if (results) {
                results.forEach(row => {
                    const locationId = row.location_id;
                    const status = row.status;
                    const count = row.count || 0;
                    if (countsMap[locationId] && countsMap[locationId].hasOwnProperty(status)) {
                        countsMap[locationId][status] = count;
                    }
                });
            }
            
            console.log(`[LocationService] Batch interaction counts retrieved for ${Object.keys(countsMap).length} locations`);
            return countsMap;
        } catch (error) {
            console.error(`[LocationService] Error getting batch location interaction counts:`, error);
            throw new Error('Database query failed getting batch location interaction counts.');
        }
    }

    /**
     * 批量獲取用戶對多個地點的狀態
     * 優化 N+1 查詢問題
     * @param {string} userId - 用戶 ID
     * @param {Array<string>} locationIds - 地點 ID 陣列
     * @returns {Promise<object>} 以 locationId 為 key 的狀態對象
     */
    async getBatchUserLocationStatuses(userId, locationIds) {
        if (!userId || !locationIds || locationIds.length === 0) {
            return {};
        }

        console.log(`[LocationService] Getting batch user location statuses for user ${userId} and ${locationIds.length} locations`);
        
        try {
            // 使用 IN 子句批量查詢
            const placeholders = locationIds.map(() => '?').join(',');
            const stmt = this.db.prepare(
                `SELECT 
                    location_id,
                    status
                 FROM user_locations
                 WHERE user_id = ? AND location_id IN (${placeholders})`
            );
            const { results } = await stmt.bind(userId, ...locationIds).all();
            
            // 構建狀態映射
            const statusMap = {};
            if (results) {
                results.forEach(row => {
                    statusMap[row.location_id] = row.status;
                });
            }
            
            console.log(`[LocationService] Batch user location statuses retrieved for ${Object.keys(statusMap).length} locations`);
            return statusMap;
        } catch (error) {
            console.error(`[LocationService] Error getting batch user location statuses:`, error);
            throw new Error('Database query failed getting batch user location statuses.');
        }
    }

    /**
     * 優化版本：一次性獲取用戶的所有地點數據（包括用戶建立的地點）
     * 合併 getUserLocations 和 getUserCreatedLocations 為單一查詢
     * @param {string} userId - 用戶 ID
     * @returns {Promise<object>} 包含 userLocations 和 userCreatedLocations 的對象
     */
    async getUserAllLocationsOptimized(userId) {
        if (!userId) {
            console.warn('[LocationService] getUserAllLocationsOptimized called without userId.');
            return { userLocations: [], userCreatedLocations: [] };
        }

        console.log(`[LocationService] Getting all locations for user: ${userId} (optimized)`);
        
        try {
            // 使用 UNION 合併兩個查詢
            const stmt = this.db.prepare(
                `SELECT
                    l.id, l.google_place_id, l.name, l.address, l.latitude, l.longitude, l.source_type, 
                    l.google_types, l.website, l.phone_number, l.business_status, l.google_rating, 
                    l.google_user_ratings_total, l.thumbnail_url, l.editorial_summary, l.created_at,
                    ul.added_at as user_added_at, ul.user_description, ul.status as user_location_status,
                    'user_location' as source
                FROM user_locations ul
                JOIN locations l ON ul.location_id = l.id
                WHERE ul.user_id = ?
                
                UNION ALL
                
                SELECT
                    id, google_place_id, name, address, latitude, longitude, source_type, 
                    google_types, website, phone_number, business_status, google_rating, 
                    google_user_ratings_total, thumbnail_url, editorial_summary, created_at,
                    created_at as user_added_at, NULL as user_description,
                    'created' as user_location_status,
                    'user_created' as source
                FROM locations
                WHERE created_by_user_id = ?
                
                ORDER BY user_added_at DESC`
            );
            const { results } = await stmt.bind(userId, userId).all();
            
            // 分類結果
            const userLocations = [];
            const userCreatedLocations = [];
            
            if (results) {
                results.forEach(row => {
                    const processedRow = { ...row };
                    // 使用ImageCacheService處理圖片URL（稍後處理）
                    if (row.source === 'user_location') {
                        userLocations.push(processedRow);
                    } else if (row.source === 'user_created') {
                        userCreatedLocations.push(processedRow);
                    }
                });
            }
            
            // 處理圖片緩存
            const processedUserLocations = await this.imageCacheService.processLocationsImages(userLocations);
            const processedUserCreatedLocations = await this.imageCacheService.processLocationsImages(userCreatedLocations);
            
            console.log(`[LocationService] Found ${processedUserLocations.length} user locations and ${processedUserCreatedLocations.length} user created locations (optimized)`);
            
            return {
                userLocations: processedUserLocations,
                userCreatedLocations: processedUserCreatedLocations
            };
        } catch (error) {
            console.error(`[LocationService] Error getting user all locations (optimized):`, error);
            throw new Error('Database query failed getting user all locations (optimized).');
        }
    }

    /**
     * 根據 Google Place ID 查找地點
     * @param {string} googlePlaceId - Google Place ID
     * @returns {Promise<object|null>} 地點物件或 null
     */
    async getLocationByGooglePlaceId(googlePlaceId) {
        if (!googlePlaceId) {
            return null;
        }
        try {
            const stmt = this.db.prepare("SELECT * FROM locations WHERE google_place_id = ?");
            const location = await stmt.bind(googlePlaceId).first();
            return location || null;
        } catch (error) {
            console.error('[LocationService] Error getting location by google_place_id:', error);
            return null;
        }
    }

    /**
     * 從 Google Maps 地點資料自動創建或獲取地點
     * 如果地點已存在（透過 google_place_id），則返回現有地點
     * 如果不存在，則創建新地點並自動建立用戶關聯
     * @param {object} googlePlaceData - Google Places API 返回的地點資料
     * @param {number} userId - 用戶 ID
     * @param {object} options - 選項 { autoLink: true, initialStatus: 'want_to_visit', sourceType: 'itinerary_added' }
     * @returns {Promise<object>} 地點物件
     */
    async createOrGetLocationFromGoogleMaps(googlePlaceData, userId, options = {}) {
        const {
            autoLink = true,
            initialStatus = 'want_to_visit',
            sourceType = 'itinerary_added'
        } = options;

        try {
            // 1. 檢查地點是否已存在
            let location = null;
            if (googlePlaceData.place_id) {
                location = await this.getLocationByGooglePlaceId(googlePlaceData.place_id);
            }

            // 2. 如果不存在，創建新地點
            if (!location) {
                // 從 Google Places 資料提取資訊
                const locationData = {
                    googlePlaceId: googlePlaceData.place_id,
                    name: googlePlaceData.name || googlePlaceData.formatted_address,
                    address: googlePlaceData.formatted_address,
                    latitude: googlePlaceData.geometry?.location?.lat || googlePlaceData.lat,
                    longitude: googlePlaceData.geometry?.location?.lng || googlePlaceData.lng,
                    sourceType: sourceType,
                    createdByUser: userId,
                    googleTypes: googlePlaceData.types || [],
                    website: googlePlaceData.website,
                    phone_number: googlePlaceData.international_phone_number || googlePlaceData.phone_number,
                    business_status: googlePlaceData.business_status,
                    google_rating: googlePlaceData.rating,
                    google_user_ratings_total: googlePlaceData.user_ratings_total,
                    photoUrls: googlePlaceData.photos?.map(p => p.getUrl?.() || p.photo_reference) || [],
                    editorialSummary: googlePlaceData.editorial_summary?.overview,
                    category: this.extractCategoryFromTypes(googlePlaceData.types)
                };

                location = await this.createLocation(locationData);
                console.log(`[LocationService] Created new location from Google Maps: ${location.id}`);
            } else {
                console.log(`[LocationService] Location already exists: ${location.id}`);
            }

            // 3. 自動建立用戶關聯（如果需要）
            if (autoLink && userId) {
                await this.linkLocationToUserIfNotExists(userId, location.id, {
                    status: initialStatus,
                    source: 'itinerary'
                });
            }

            return location;
        } catch (error) {
            console.error('[LocationService] Error creating/getting location from Google Maps:', error);
            throw error;
        }
    }

    /**
     * 從 Google Types 陣列提取主要分類
     * @param {Array<string>} types - Google Places types 陣列
     * @returns {string|null} 主要分類
     */
    extractCategoryFromTypes(types) {
        if (!types || !Array.isArray(types)) {
            return null;
        }

        // 分類優先順序
        const categoryMap = {
            'restaurant': ['restaurant', 'food', 'cafe', 'meal_takeaway'],
            'attraction': ['tourist_attraction', 'point_of_interest', 'establishment'],
            'hotel': ['lodging', 'hotel'],
            'shopping': ['store', 'shopping_mall'],
            'entertainment': ['amusement_park', 'movie_theater', 'night_club'],
            'transport': ['airport', 'train_station', 'bus_station', 'subway_station']
        };

        for (const [category, keywords] of Object.entries(categoryMap)) {
            if (types.some(type => keywords.some(keyword => type.includes(keyword)))) {
                return category;
            }
        }

        return 'other';
    }

    /**
     * 如果用戶地點關聯不存在，則創建它
     * @param {number} userId - 用戶 ID
     * @param {string} locationId - 地點 ID
     * @param {object} options - { status, source, user_description }
     * @returns {Promise<object>} 用戶地點關聯物件
     */
    async linkLocationToUserIfNotExists(userId, locationId, options = {}) {
        const { status = 'want_to_visit', source = null, user_description = null } = options;

        try {
            // 檢查是否已存在關聯
            const existing = await this.db.prepare(
                `SELECT * FROM user_locations WHERE user_id = ? AND location_id = ?`
            ).bind(userId, locationId).first();

            if (existing) {
                console.log(`[LocationService] User location link already exists: ${userId} -> ${locationId}`);
                return existing;
            }

            // 創建新關聯
            const linkId = crypto.randomUUID();
            const now = new Date().toISOString();

            await this.db.prepare(
                `INSERT INTO user_locations (id, user_id, location_id, status, user_description, added_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                linkId,
                userId,
                locationId,
                status,
                user_description,
                now,
                now
            ).run();

            console.log(`[LocationService] Created user location link: ${userId} -> ${locationId} (${status})`);
            return await this.db.prepare(
                `SELECT * FROM user_locations WHERE id = ?`
            ).bind(linkId).first();
        } catch (error) {
            console.error('[LocationService] Error linking location to user:', error);
            throw error;
        }
    }

    /**
     * 增加地點的行程使用次數
     * @param {string} locationId - 地點 ID
     * @returns {Promise<void>}
     */
    async incrementItineraryUseCount(locationId) {
        try {
            await this.db.prepare(
                `UPDATE locations SET total_itinerary_uses = COALESCE(total_itinerary_uses, 0) + 1 WHERE id = ?`
            ).bind(locationId).run();
        } catch (error) {
            console.error('[LocationService] Error incrementing itinerary use count:', error);
            // 不拋出錯誤，因為這不是關鍵操作
        }
    }

    /**
     * 增加地點的訪問次數
     * @param {string} locationId - 地點 ID
     * @returns {Promise<void>}
     */
    async incrementVisitCount(locationId) {
        try {
            await this.db.prepare(
                `UPDATE locations SET total_visits = COALESCE(total_visits, 0) + 1 WHERE id = ?`
            ).bind(locationId).run();
        } catch (error) {
            console.error('[LocationService] Error incrementing visit count:', error);
            // 不拋出錯誤，因為這不是關鍵操作
        }
    }

    /**
     * 更新地點分類
     * @param {string} locationId - 地點 ID
     * @param {string} category - 分類
     * @returns {Promise<void>}
     */
    async updateLocationCategory(locationId, category) {
        try {
            await this.db.prepare(
                `UPDATE locations SET category = ? WHERE id = ?`
            ).bind(category, locationId).run();
        } catch (error) {
            console.error('[LocationService] Error updating location category:', error);
            throw error;
        }
    }

    // Potentially add other helper methods like updateLocation, deleteLocation etc.
} 