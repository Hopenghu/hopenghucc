export class LocationService {
    constructor(db, mapsApiKey) {
        if (!db) {
            throw new Error("Database connection (db) is required for LocationService.");
        }
        if (!mapsApiKey) {
            throw new Error("Google Maps API Key (mapsApiKey) is required for LocationService.");
        }
        this.db = db;
        this.apiKey = mapsApiKey;
        this.googleApiBaseUrl = "https://maps.googleapis.com/maps/api";
    }

    /**
     * Fetches place details from Google Places API.
     * @param {string} googlePlaceId - The Google Place ID.
     * @returns {Promise<object|null>} Standardized location object or null if not found/error.
     */
    async fetchPlaceDetails(googlePlaceId) {
        if (!googlePlaceId) {
            console.error('[LocationService] fetchPlaceDetails called without googlePlaceId.');
            return null;
        }
        console.log(`[LocationService] Fetching Google Place details for placeId: ${googlePlaceId}`);
        
        // Specify required fields to minimize costs
        // See: https://developers.google.com/maps/documentation/places/web-service/details#fields
        const fields = 'place_id,name,formatted_address,geometry/location,types';
        const url = `${this.googleApiBaseUrl}/place/details/json?place_id=${encodeURIComponent(googlePlaceId)}&fields=${encodeURIComponent(fields)}&key=${this.apiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || data.status !== 'OK') {
                console.error(`[LocationService] Google Places API error for placeId ${googlePlaceId}. Status: ${data.status}, Error: ${data.error_message || 'Unknown error'}`);
                // Handle specific statuses like ZERO_RESULTS, NOT_FOUND etc. if needed
                return null; 
            }

            const result = data.result;
            if (!result || !result.geometry || !result.geometry.location) {
                 console.error(`[LocationService] Google Places API response missing essential data for placeId ${googlePlaceId}.`);
                 return null;
            }

            // Standardize the output object
            const locationDetails = {
                googlePlaceId: result.place_id,
                name: result.name,
                address: result.formatted_address || null, // Address might not always be present
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                googleTypes: result.types || [], // Array of types
                sourceType: 'google_place' // Mark the source
            };
            
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
        if (!googlePlaceId) return null;
        try {
            const stmt = this.db.prepare("SELECT * FROM locations WHERE google_place_id = ?");
            const result = await stmt.bind(googlePlaceId).first();
            return result || null;
        } catch (error) {
            console.error(`[LocationService] Error finding location by placeId ${googlePlaceId}:`, error);
            // Re-throw or return null depending on desired error handling
            throw new Error('Database query failed finding location by Place ID.'); 
        }
    }

    /**
     * Creates a new location record in the local DB.
     * @param {object} locationData - Data for the new location.
     * @returns {Promise<object>} The newly created location object from DB (including generated ID).
     */
    async createLocation(locationData) {
        const newId = crypto.randomUUID(); // Generate ID in code
        const now = new Date().toISOString();

        // Ensure required fields are present
        if (!locationData.name || locationData.latitude == null || locationData.longitude == null || !locationData.sourceType || !locationData.createdByUser) {
             console.error("[LocationService] Missing required fields for createLocation:", locationData);
             throw new Error("Missing required fields to create location.");
        }

        try {
            const stmt = this.db.prepare(
               `INSERT INTO locations (id, google_place_id, name, address, latitude, longitude, source_type, google_types, created_by_user_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            );
            await stmt.bind(
                newId,
                locationData.googlePlaceId || null,
                locationData.name,
                locationData.address || null,
                locationData.latitude,
                locationData.longitude,
                locationData.sourceType,
                locationData.googleTypes ? JSON.stringify(locationData.googleTypes) : null, // Store array as JSON string
                locationData.createdByUser, // Renamed from created_by_user_id for consistency
                now
            ).run();

            // Fetch and return the newly created record
            const createdLocation = await this.db.prepare("SELECT * FROM locations WHERE id = ?").bind(newId).first();
            if (!createdLocation) { throw new Error('Failed to fetch created location from DB.') }
            console.log(`[LocationService] Successfully created location ${createdLocation.name} (ID: ${newId})`);
            return createdLocation;

        } catch (error) {
            console.error('[LocationService] Error creating location:', error);
            // Check for UNIQUE constraint errors (e.g., duplicate google_place_id)
            if (error.message && error.message.includes('UNIQUE constraint failed: locations.google_place_id')) {
                console.warn(`[LocationService] Attempted to create location with duplicate google_place_id: ${locationData.googlePlaceId}`);
                // Potentially find the existing one and return it, or throw specific error
                 throw new Error('Location with this Google Place ID already exists.');
            } else {
                 throw new Error('Database insert failed creating location.');
            }
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
            
             // Fetch and return the newly created record
            const createdLink = await this.db.prepare("SELECT * FROM user_locations WHERE id = ?").bind(newId).first();
             if (!createdLink) { throw new Error('Failed to fetch created user-location link from DB.') }
            console.log(`[LocationService] Successfully linked user ${userId} to location ${locationId} (Link ID: ${newId})`);
            return createdLink;

        } catch (error) {
            console.error(`[LocationService] Error linking user ${userId} to location ${locationId}:`, error);
            // Check for UNIQUE constraint error (user_id, location_id)
            if (error.message && error.message.includes('UNIQUE constraint failed: user_locations.user_id, user_locations.location_id')) {
                console.warn(`[LocationService] User ${userId} is already linked to location ${locationId}.`);
                // Decide how to handle: throw specific error, return existing link, or return null/false?
                // For now, throw a specific error.
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
           return !!result; // Return true if a record exists, false otherwise
       } catch (error) {
            console.error(`[LocationService] Error checking link between user ${userId} and location ${locationId}:`, error);
            throw new Error('Database query failed checking user-location link.');
       }
    }

    // TODO: Add methods for reverseGeocode, adding links, updating status etc.
} 