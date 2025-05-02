// src/utils/password.js
var HASH_ALGORITHM = "PBKDF2";
var HASH_FUNCTION = "SHA-256";
var ITERATIONS = 1e5;
var SALT_LENGTH_BYTES = 16;
var KEY_LENGTH_BITS = 256;
var STORED_HASH_FORMAT = `pbkdf2-${HASH_FUNCTION.toLowerCase()}`;
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBuffer(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes.buffer;
}
async function hashPassword(password) {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      // Convert password string to ArrayBuffer
      { name: HASH_ALGORITHM },
      false,
      // not extractable
      ["deriveBits"]
      // usage
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: HASH_ALGORITHM,
        salt,
        iterations: ITERATIONS,
        hash: HASH_FUNCTION
      },
      passwordKey,
      KEY_LENGTH_BITS
      // Key length in bits
    );
    const saltHex = bufferToHex(salt);
    const hashHex = bufferToHex(derivedBits);
    return `${STORED_HASH_FORMAT}$${ITERATIONS}$${saltHex}$${hashHex}`;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Could not hash password.");
  }
}
async function verifyPassword(password, storedHashString) {
  try {
    const parts = storedHashString.split("$");
    if (parts.length !== 4) {
      console.error("Invalid stored hash format.");
      return false;
    }
    const [format, iterationsStr, saltHex, storedHashHex] = parts;
    if (!format.startsWith("pbkdf2-")) {
      console.error("Unsupported hash format.");
      return false;
    }
    const iterations = parseInt(iterationsStr, 10);
    const salt = hexToBuffer(saltHex);
    const storedHashBuffer = hexToBuffer(storedHashHex);
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: HASH_ALGORITHM },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: HASH_ALGORITHM,
        salt,
        iterations,
        // Ensure HASH_FUNCTION matches the one indicated by the format string if needed
        hash: HASH_FUNCTION
      },
      passwordKey,
      KEY_LENGTH_BITS
    );
    if (derivedBits.byteLength !== storedHashBuffer.byteLength) {
      return false;
    }
    const derivedArray = new Uint8Array(derivedBits);
    const storedArray = new Uint8Array(storedHashBuffer);
    let diff = 0;
    for (let i = 0; i < derivedArray.length; i++) {
      diff |= derivedArray[i] ^ storedArray[i];
    }
    return diff === 0;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

// src/services/AuthService.js
var AuthService = class {
  constructor(userService, sessionService, googleAuthService, businessService) {
    if (!userService || !sessionService || !googleAuthService) {
      throw new Error("UserService, SessionService, and GoogleAuthService are required.");
    }
    this.userService = userService;
    this.sessionService = sessionService;
    this.googleAuthService = googleAuthService;
    this.businessService = businessService;
  }
  /**
   * Registers a new user with email and password.
   * @param {object} credentials - { email, password, name }
   * @returns {Promise<object>} Newly created user object (essential info).
   */
  async registerWithPassword({ email, password, name }) {
    try {
      if (!email || !password || !name) {
        throw new Error("Email, password, and name are required for registration.");
      }
      const user = await this.userService.createUserWithPassword(email, password, name);
      return user;
    } catch (error) {
      console.error("AuthService - registerWithPassword error:", error);
      throw error;
    }
  }
  /**
   * Logs in a user with email and password.
   * @param {object} credentials - { email, password }
   * @returns {Promise<{user: object, session: object}>} User and session objects.
   */
  async loginWithPassword({ email, password }) {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required for login.");
      }
      const user = await this.userService.findUserByEmail(email);
      if (!user || !user.password_hash) {
        throw new Error("Invalid email or password.");
      }
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        throw new Error("Invalid email or password.");
      }
      const session = await this.sessionService.createSession(user.id);
      return {
        session,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url
        }
      };
    } catch (error) {
      console.error("AuthService - loginWithPassword error:", error);
      throw error;
    }
  }
  /**
   * Handles the Google Sign-In callback.
   * @param {string} code - The authorization code from Google.
   * @returns {Promise<{user: object, session: object}>} User and session objects.
   */
  async handleGoogleLogin(code) {
    try {
      if (!code) {
        throw new Error("Google authorization code is required.");
      }
      const { userData: googleUserData, accessToken } = await this.googleAuthService.authenticate(code);
      if (accessToken) {
        console.log("[AuthService] Received Access Token (Log first 10 chars): ", accessToken.substring(0, 10));
      } else {
        console.warn("[AuthService] Access Token not received after authentication.");
      }
      if (!googleUserData || !googleUserData.sub || !googleUserData.email) {
        throw new Error("Failed to retrieve valid user data from Google.");
      }
      const user = await this.userService.findOrCreateUserByGoogleId(
        googleUserData.sub,
        googleUserData.email,
        googleUserData.name,
        googleUserData.picture
      );
      let hasBusinessAccess = false;
      if (this.businessService && accessToken) {
        try {
          console.log(`[AuthService] Checking GMB access for user ${user.email}...`);
          hasBusinessAccess = await this.businessService.checkHasBusinessAccess(accessToken);
          console.log(`[AuthService] GMB access check result for ${user.email}: ${hasBusinessAccess}`);
        } catch (gmbError) {
          console.error("[AuthService] Error during GMB access check:", gmbError);
          hasBusinessAccess = false;
        }
      } else {
        console.warn("[AuthService] BusinessService not available or no access token, skipping GMB check.");
      }
      const session = await this.sessionService.createSession(user.id);
      return {
        session,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url
          // hasGoogleBusiness: hasBusinessAccess // Example: Add flag if needed
        }
      };
    } catch (error) {
      console.error("AuthService - handleGoogleLogin error:", error);
      throw new Error("Google Sign-In failed. Please try again.");
    }
  }
  /**
   * Logs out a user by deleting their session.
   * @param {string} sessionId - The ID of the session to delete.
   * @returns {Promise<void>}
   */
  async logout(sessionId) {
    try {
      if (!sessionId) {
        console.warn("Logout called without session ID.");
        return;
      }
      await this.sessionService.deleteSession(sessionId);
    } catch (error) {
      console.error("AuthService - logout error:", error);
      throw new Error("Logout failed.");
    }
  }
  /**
   * Retrieves the authenticated user based on a session ID.
   * @param {string} sessionId - The session ID from the client (e.g., cookie).
   * @returns {Promise<object | null>} The user object (non-sensitive data) or null.
   */
  async getUserFromSession(sessionId) {
    try {
      if (!sessionId) {
        return null;
      }
      const session = await this.sessionService.getSession(sessionId);
      if (!session) {
        return null;
      }
      const user = await this.userService.findUserById(session.userId);
      return user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      } : null;
    } catch (error) {
      console.error("AuthService - getUserFromSession error:", error);
      return null;
    }
  }
  // Potentially add methods like requestPasswordReset, verifyResetToken, etc. here
};

// src/services/UserService.js
var UserService = class {
  constructor(db) {
    if (!db) {
      throw new Error("Database connection is required for UserService.");
    }
    this.db = db;
  }
  async findUserById(userId) {
    try {
      const user = await this.db.prepare(
        "SELECT id, email, name, avatar_url, google_id, created_at FROM users WHERE id = ?"
      ).bind(userId).first();
      return user || null;
    } catch (error) {
      console.error(`Error finding user by ID ${userId}:`, error);
      throw new Error("Could not retrieve user data.");
    }
  }
  async findUserByEmail(email) {
    try {
      const user = await this.db.prepare(
        "SELECT id, email, name, password_hash, avatar_url, google_id FROM users WHERE email = ?"
      ).bind(email).first();
      return user || null;
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error);
      throw new Error("Could not retrieve user data by email.");
    }
  }
  async findUserByGoogleId(googleId) {
    try {
      const user = await this.db.prepare(
        "SELECT id, email, name, avatar_url, google_id FROM users WHERE google_id = ?"
      ).bind(googleId).first();
      return user || null;
    } catch (error) {
      console.error(`Error finding user by Google ID ${googleId}:`, error);
      throw new Error("Could not retrieve user data by Google ID.");
    }
  }
  async createUserWithPassword(email, password, name) {
    try {
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error("User already exists with this email");
      }
      const hashedPassword = await hashPassword(password);
      const result = await this.db.prepare(
        'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, datetime("now"))'
      ).bind(email, hashedPassword, name).run();
      if (!result.meta.last_row_id) {
        throw new Error("Failed to insert user into database");
      }
      return {
        id: result.meta.last_row_id,
        email,
        name
      };
    } catch (error) {
      console.error("Error creating user with password:", error);
      throw error instanceof Error ? error : new Error("Could not create user.");
    }
  }
  async findOrCreateUserByGoogleId(googleId, email, name, avatarUrl = null) {
    try {
      let user = await this.findUserByGoogleId(googleId);
      if (!user) {
        const existingEmailUser = await this.findUserByEmail(email);
        if (existingEmailUser) {
          await this.linkGoogleIdToUser(existingEmailUser.id, googleId);
          user = await this.findUserById(existingEmailUser.id);
          if (!user)
            throw new Error("Failed to fetch user after linking Google ID.");
        } else {
          const insertResult = await this.db.prepare(
            'INSERT INTO users (email, name, google_id, avatar_url, created_at) VALUES (?, ?, ?, ?, datetime("now"))'
          ).bind(email, name, googleId, avatarUrl).run();
          if (!insertResult.meta.last_row_id) {
            throw new Error("Failed to create new user via Google Sign-In.");
          }
          user = await this.findUserById(insertResult.meta.last_row_id);
          if (!user)
            throw new Error("Failed to fetch newly created Google user.");
        }
      }
      return user;
    } catch (error) {
      console.error("Error in findOrCreateUserByGoogleId:", error);
      throw new Error("Could not find or create user via Google Sign-In.");
    }
  }
  async linkGoogleIdToUser(userId, googleId) {
    try {
      await this.db.prepare(
        "UPDATE users SET google_id = ? WHERE id = ?"
      ).bind(googleId, userId).run();
    } catch (error) {
      console.error(`Error linking Google ID ${googleId} to user ${userId}:`, error);
      throw new Error("Could not link Google account.");
    }
  }
  // Example for profile updates if needed later
  async updateUserProfile(userId, { name, avatarUrl }) {
  }
};

// src/services/SessionService.js
var SessionService = class {
  constructor(db) {
    if (!db) {
      throw new Error("Database connection is required for SessionService.");
    }
    this.db = db;
  }
  /**
   * Creates a new session for a user.
   * @param {number} userId - The ID of the user.
   * @param {number} durationSeconds - Session duration in seconds (default: 7 days).
   * @returns {Promise<{id: string, userId: number, expiresAt: string}>} The created session object.
   */
  async createSession(userId, durationSeconds = 60 * 60 * 24 * 7) {
    try {
      const randomBytes2 = new Uint8Array(32);
      crypto.getRandomValues(randomBytes2);
      const sessionId = Array.from(randomBytes2).map((b) => b.toString(16).padStart(2, "0")).join("");
      const expiresAt = new Date(Date.now() + durationSeconds * 1e3);
      const result = await this.db.prepare(
        'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, datetime("now"))'
      ).bind(sessionId, userId, expiresAt.toISOString()).run();
      if (result.meta.changes !== 1) {
        throw new Error("Failed to create session in database");
      }
      return {
        id: sessionId,
        userId,
        expiresAt: expiresAt.toISOString()
      };
    } catch (error) {
      console.error("Error creating session:", error);
      throw new Error("Could not create session");
    }
  }
  /**
   * Deletes a session by its ID.
   * @param {string} sessionId - The ID of the session to delete.
   * @returns {Promise<void>}
   */
  async deleteSession(sessionId) {
    try {
      await this.db.prepare(
        "DELETE FROM sessions WHERE id = ?"
      ).bind(sessionId).run();
    } catch (error) {
      console.error("Error deleting session:", error);
      throw new Error("Could not delete session");
    }
  }
  /**
   * Retrieves a session by its ID, ensuring it hasn't expired.
   * @param {string} sessionId - The ID of the session to retrieve.
   * @returns {Promise<{id: string, userId: number, expiresAt: string} | null>} The session object or null if not found or expired.
   */
  async getSession(sessionId) {
    try {
      const session = await this.db.prepare(
        'SELECT id, user_id, expires_at FROM sessions WHERE id = ? AND expires_at > datetime("now")'
      ).bind(sessionId).first();
      if (!session) {
        return null;
      }
      return {
        id: session.id,
        userId: session.user_id,
        expiresAt: session.expires_at
      };
    } catch (error) {
      console.error("Error getting session:", error);
      throw new Error("Could not retrieve session");
    }
  }
  async getUserFromSession(request) {
    console.log("SessionService - getUserFromSession - Attempting...");
    const session = await this.getSession(request);
    if (!session || !session.userId) {
      console.log("SessionService - getUserFromSession - No valid session or userId found");
      return null;
    }
    console.log(`SessionService - getUserFromSession - Found session for user ID: ${session.userId}`);
    try {
      const userData = await this.env.DB.prepare(
        "SELECT id, email, name, avatar_url FROM users WHERE id = ?"
      ).bind(session.userId).first();
      console.log("SessionService - getUserFromSession - User DB Result:", userData);
      return userData;
    } catch (error) {
      console.error("SessionService - getUserFromSession - User DB Error:", error);
      return null;
    }
  }
};

// src/services/GoogleAuthService.js
var GoogleAuthService = class {
  constructor(env) {
    if (!env || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
      throw new Error("Google OAuth environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI) are required for GoogleAuthService.");
    }
    this.clientId = env.GOOGLE_CLIENT_ID;
    this.clientSecret = env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = env.GOOGLE_REDIRECT_URI;
  }
  async exchangeCodeForToken(code) {
    try {
      const requestBody = new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code"
      });
      console.log(`[GoogleAuthService] Exchanging code. Sending params (excluding secret): code=${code}, client_id=${this.clientId}, redirect_uri=${this.redirectUri}, grant_type=authorization_code`);
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: requestBody
      });
      if (!tokenResponse.ok) {
        let errorBodyText = "[Could not read error body]";
        try {
          errorBodyText = await tokenResponse.text();
        } catch (readError) {
          console.error("[GoogleAuthService] Failed to read error response body:", readError);
        }
        console.error(`[GoogleAuthService] Token exchange failed! Status: ${tokenResponse.status}, Response Body: ${errorBodyText}`);
        throw new Error(`Failed to exchange code for token. Status: ${tokenResponse.status}`);
      }
      return await tokenResponse.json();
    } catch (error) {
      console.error("Error exchanging Google code for token:", error);
      throw new Error("Could not exchange authorization code for token.");
    }
  }
  async verifyGoogleToken(idToken) {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
      );
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to verify Google ID token:", response.status, errorBody);
        throw new Error(`Failed to verify Google ID token. Status: ${response.status}`);
      }
      const tokenInfo = await response.json();
      if (tokenInfo.aud !== this.clientId) {
        console.error("Token audience mismatch:", tokenInfo.aud, "expected:", this.clientId);
        throw new Error("Invalid token: Audience mismatch.");
      }
      return tokenInfo;
    } catch (error) {
      console.error("Error verifying Google ID token:", error);
      throw new Error("Could not verify Google ID token.");
    }
  }
  /**
   * Authenticates a user using the Google authorization code.
   * Exchanges the code for tokens and verifies the ID token.
   * @param {string} code - The authorization code from Google callback.
   * @returns {Promise<{userData: object, accessToken: string}>} Object containing verified Google user data and the access token.
   */
  async authenticate(code) {
    try {
      const tokens = await this.exchangeCodeForToken(code);
      if (!tokens.id_token) {
        throw new Error("ID token not found in Google response.");
      }
      if (!tokens.access_token) {
        throw new Error("Access token not found in Google response.");
      }
      const verifiedUserData = await this.verifyGoogleToken(tokens.id_token);
      return {
        userData: verifiedUserData,
        accessToken: tokens.access_token
      };
    } catch (error) {
      console.error("Google authentication failed:", error);
      throw error instanceof Error ? error : new Error("Google authentication process failed.");
    }
  }
};

// src/services/locationService.js
var LocationService = class {
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
      console.error("[LocationService] fetchPlaceDetails called without googlePlaceId.");
      return null;
    }
    console.log(`[LocationService] Fetching Google Place details for placeId: ${googlePlaceId}`);
    const fields = "place_id,name,formatted_address,geometry/location,types";
    const url = `${this.googleApiBaseUrl}/place/details/json?place_id=${encodeURIComponent(googlePlaceId)}&fields=${encodeURIComponent(fields)}&key=${this.apiKey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || data.status !== "OK") {
        console.error(`[LocationService] Google Places API error for placeId ${googlePlaceId}. Status: ${data.status}, Error: ${data.error_message || "Unknown error"}`);
        return null;
      }
      const result = data.result;
      if (!result || !result.geometry || !result.geometry.location) {
        console.error(`[LocationService] Google Places API response missing essential data for placeId ${googlePlaceId}.`);
        return null;
      }
      const locationDetails = {
        googlePlaceId: result.place_id,
        name: result.name,
        address: result.formatted_address || null,
        // Address might not always be present
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        googleTypes: result.types || [],
        // Array of types
        sourceType: "google_place"
        // Mark the source
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
    if (!googlePlaceId)
      return null;
    try {
      const stmt = this.db.prepare("SELECT * FROM locations WHERE google_place_id = ?");
      const result = await stmt.bind(googlePlaceId).first();
      return result || null;
    } catch (error) {
      console.error(`[LocationService] Error finding location by placeId ${googlePlaceId}:`, error);
      throw new Error("Database query failed finding location by Place ID.");
    }
  }
  /**
   * Creates a new location record in the local DB.
   * @param {object} locationData - Data for the new location.
   * @returns {Promise<object>} The newly created location object from DB (including generated ID).
   */
  async createLocation(locationData) {
    const newId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
        locationData.googleTypes ? JSON.stringify(locationData.googleTypes) : null,
        // Store array as JSON string
        locationData.createdByUser,
        // Renamed from created_by_user_id for consistency
        now
      ).run();
      const createdLocation = await this.db.prepare("SELECT * FROM locations WHERE id = ?").bind(newId).first();
      if (!createdLocation) {
        throw new Error("Failed to fetch created location from DB.");
      }
      console.log(`[LocationService] Successfully created location ${createdLocation.name} (ID: ${newId})`);
      return createdLocation;
    } catch (error) {
      console.error("[LocationService] Error creating location:", error);
      if (error.message && error.message.includes("UNIQUE constraint failed: locations.google_place_id")) {
        console.warn(`[LocationService] Attempted to create location with duplicate google_place_id: ${locationData.googlePlaceId}`);
        throw new Error("Location with this Google Place ID already exists.");
      } else {
        throw new Error("Database insert failed creating location.");
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
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
      if (!createdLink) {
        throw new Error("Failed to fetch created user-location link from DB.");
      }
      console.log(`[LocationService] Successfully linked user ${userId} to location ${locationId} (Link ID: ${newId})`);
      return createdLink;
    } catch (error) {
      console.error(`[LocationService] Error linking user ${userId} to location ${locationId}:`, error);
      if (error.message && error.message.includes("UNIQUE constraint failed: user_locations.user_id, user_locations.location_id")) {
        console.warn(`[LocationService] User ${userId} is already linked to location ${locationId}.`);
        throw new Error("User is already associated with this location.");
      } else {
        throw new Error("Database insert failed linking user to location.");
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
    if (!userId || !locationId)
      return false;
    try {
      const stmt = this.db.prepare("SELECT 1 FROM user_locations WHERE user_id = ? AND location_id = ? LIMIT 1");
      const result = await stmt.bind(userId, locationId).first();
      return !!result;
    } catch (error) {
      console.error(`[LocationService] Error checking link between user ${userId} and location ${locationId}:`, error);
      throw new Error("Database query failed checking user-location link.");
    }
  }
  // TODO: Add methods for reverseGeocode, adding links, updating status etc.
};

// src/modules/auth/google.js
import { randomBytes } from "node:crypto";
function initiateGoogleAuth(requestUrl, env) {
  console.log("[Auth Google Module] Initiating flow...");
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId)
    throw new Error("[Auth Google Module] GOOGLE_CLIENT_ID missing in environment.");
  const redirectUri = "https://www.hopenghu.cc/api/auth/google/callback";
  const scope = "openid email profile";
  const state = crypto.randomUUID();
  const stateCookie = `google_oauth_state=${state}; Path=/; HttpOnly; Secure; Max-Age=300`;
  console.log("[Auth Google Module] Setting state cookie header (No SameSite):", stateCookie);
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);
  console.log(`[Auth Google Module] Redirecting user to: ${authUrl.toString()}`);
  const headers = new Headers({
    "Location": authUrl.toString(),
    "Content-Type": "text/plain",
    // 302 responses don't strictly need a content-type, but good practice
    "Set-Cookie": stateCookie
  });
  return new Response(null, { status: 302, headers });
}
function initiateGmbAuth(requestUrl, env, existingUserId = null) {
  console.log("[Auth Google Module] Initiating GMB scope request flow...");
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId)
    throw new Error("[Auth Google Module] GOOGLE_CLIENT_ID missing in environment.");
  const redirectUri = "https://www.hopenghu.cc/api/auth/google/callback";
  const scope = "openid email profile https://www.googleapis.com/auth/business.manage";
  const state = crypto.randomUUID();
  const stateCookie = `google_gmb_state=${state}; Path=/; HttpOnly; Secure; Max-Age=300`;
  console.log("[Auth Google Module] Setting GMB state cookie header:", stateCookie);
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);
  console.log(`[Auth Google Module] Redirecting user for GMB scope to: ${authUrl.toString()}`);
  const headers = new Headers({
    "Location": authUrl.toString(),
    "Set-Cookie": stateCookie
  });
  return new Response(null, { status: 302, headers });
}

// src/templates/html.js
var getHeaderHtml = (user) => `
<header class="bg-blue-600 text-white p-4 shadow-md w-full">
  <div class="container mx-auto flex justify-between items-center">
    <a href="/" class="text-xl font-bold">Hopenghu</a>
    <nav>
      ${user ? `<a href="/profile" class="px-3 py-2 hover:bg-blue-700 rounded">Profile</a>
           <form action="/api/auth/logout" method="POST" class="inline-block">
             <button type="submit" class="px-3 py-2 hover:bg-blue-700 rounded bg-transparent border-none text-white cursor-pointer">Logout</button>
           </form>` : `<a href="/api/auth/google" class="px-3 py-2 hover:bg-blue-700 rounded bg-blue-500 hover:bg-blue-700">Login with Google</a>`}
    </nav>
  </div>
</header>
`;
var getFooterHtml = () => `
<footer class="bg-gray-200 text-gray-600 p-4 mt-auto w-full text-center">
  <div class="container mx-auto">
    \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Hopenghu. All rights reserved.
  </div>
</footer>
`;
var wrapPageHtml = (title, mainContentHtml, user, bundledCss = "") => `
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Hopenghu</title>
    <!-- Remove Tailwind CDN Script -->
    <!-- <script src="https://cdn.tailwindcss.com"><\/script> --> 
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
function getHomePageContent(user) {
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
function getGoogleInfoContent(user) {
  const userName = user ? user.name || user.email : "Guest";
  return `
    <div class="text-center bg-white p-8 rounded shadow-md">
        <h1 class="text-2xl font-semibold text-green-600 mb-4">Google Login Successful!</h1>
        <p class="mb-4">Welcome, ${userName}!</p>
        <p class="mb-6 text-gray-600">You have been successfully authenticated.</p>
        <a href="/" class="text-blue-500 hover:underline">Go back home</a>
    </div>
   `;
}
function getProfilePageContent(user) {
  if (!user)
    return `<p>Error: User data is missing.</p>`;
  const displayName = user.name ? String(user.name).replace(/</g, "&lt;").replace(/>/g, "&gt;") : "N/A";
  const displayEmail = user.email ? String(user.email).replace(/</g, "&lt;").replace(/>/g, "&gt;") : "N/A";
  const avatarUrl = user.avatar_url ? String(user.avatar_url) : "";
  const avatarDisplay = avatarUrl ? `<img src="${avatarUrl}" alt="User Avatar" class="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-gray-300">` : '<div class="w-20 h-20 rounded-full mx-auto mb-4 bg-gray-300 flex items-center justify-center text-gray-500">No Pic</div>';
  return `
    <h1 class="text-3xl font-bold text-gray-800 mb-4">\u4F7F\u7528\u8005\u500B\u4EBA\u8CC7\u6599</h1>
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
            \u9023\u63A5\u6211\u7684 Google \u5546\u5BB6
        </a>
        -->

        <!-- Added "My Businesses" Link (Placeholder) -->
        <a 
            href="/my-businesses" 
            class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4 transition duration-200 ease-in-out no-underline"
        >
            \u6211\u7684\u5546\u5BB6
        </a>
        <!-- End Added "My Businesses" Link -->
        
        <a href="/" class="text-blue-500 hover:underline">\u8FD4\u56DE\u9996\u9801</a>
    </div>
`;
}
function getAddPlacePageContent() {
  return `
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-xl">
        <h1 class="text-2xl font-bold mb-6 text-gray-800">\u65B0\u589E\u5730\u9EDE (\u900F\u904E Google \u5730\u6A19\u641C\u5C0B)</h1>
        
        <div class="mb-4">
            <label for="place-autocomplete-element" class="block text-sm font-medium text-gray-700 mb-1">\u641C\u5C0B\u5730\u9EDE\u540D\u7A31\u6216\u5730\u5740:</label>
            <!-- Use the new PlaceAutocompleteElement Web Component -->
            <gmp-place-autocomplete                 id="place-autocomplete-element"                 placeholder="\u4F8B\u5982\uFF1A\u6F8E\u6E56\u8DE8\u6D77\u5927\u6A4B \u6216 \u53F0\u5317101"                 class="w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-ocean focus:border-primary-ocean sm:text-sm p-2"                 request-language="zh-TW"                 request-region="tw">                 <!-- The input field is now part of the component -->             </gmp-place-autocomplete>         </div> 
        <div id="message-area" class="mt-4 text-sm"></div> 
    </div> 
    <script>
      let mapsApiKey = null;
      let autocompleteElement; // Reference to the web component

      // Function to initialize Google Maps script and Autocomplete
      async function initMap() {
        try {
            // 1. Fetch API Key from our backend
            const configResponse = await fetch('/api/maps/config');
            if (!configResponse.ok) {
                throw new Error('Failed to fetch Maps config');
            }
            const config = await configResponse.json();
            mapsApiKey = config.apiKey;
            if (!mapsApiKey) {
                 throw new Error('Maps API Key not provided by backend.');
            }

            // 2. Load Google Maps JS API script dynamically
            const script = document.createElement('script');
            // Request specific libraries: places and the NEW places.element
            // Added loading=async based on warning
            script.src = 'https://maps.googleapis.com/maps/api/js?key=' + mapsApiKey + '&libraries=places,places.element&callback=initAutocomplete&loading=async';
            window.initAutocomplete = initAutocomplete; // Make initAutocomplete globally accessible for the callback
            document.head.appendChild(script);

        } catch (error) {
            console.error('Error initializing map script:', error);
            setMessage('\u932F\u8AA4\uFF1A\u7121\u6CD5\u8F09\u5165\u5730\u5716\u641C\u5C0B\u529F\u80FD\u3002\u8ACB\u7A0D\u5F8C\u518D\u8A66\u3002 (' + error.message + ')', 'error');
        }
      }

      // 3. Callback function to initialize Autocomplete once the script is loaded
      function initAutocomplete() {
         console.log('Google Maps API loaded. Initializing PlaceAutocompleteElement...');
         autocompleteElement = document.getElementById('place-autocomplete-element');
         
         if (!autocompleteElement) {
              console.error('Place Autocomplete Element not found!');
              setMessage('\u932F\u8AA4\uFF1A\u7121\u6CD5\u521D\u59CB\u5316\u641C\u5C0B\u5143\u4EF6\u3002', 'error');
              return;
         }
         
         // Ensure the component library is loaded before adding listener
         if (google && google.maps && google.maps.places && google.maps.places.PlaceAutocompleteElement) {
              // 4. Add listener for the new 'gmp-placechange' event
              autocompleteElement.addEventListener('gmp-placechange', handlePlaceSelect);
              console.log('PlaceAutocompleteElement initialized and listener added.');
         } else {
              console.error('PlaceAutocompleteElement library not ready.');
              setMessage('\u932F\u8AA4\uFF1A\u5730\u5716\u5143\u4EF6\u5C1A\u672A\u6E96\u5099\u5C31\u7DD2\u3002', 'error');
         }
      }
      
      // Helper function to set messages
      function setMessage(text, type = 'info') {
          const messageArea = document.getElementById('message-area');
          if (!messageArea) return;
          messageArea.textContent = text;
          if (type === 'error') {
              messageArea.className = 'mt-4 text-sm text-red-600';
          } else if (type === 'success') {
              messageArea.className = 'mt-4 text-sm text-green-600';
          } else if (type === 'warning') {
              messageArea.className = 'mt-4 text-sm text-orange-600';
          } else { 
              messageArea.className = 'mt-4 text-sm text-blue-600'; // Default/Info
          }
      }

      // 5. Handle place selection using the new event
      async function handlePlaceSelect(event) {
        setMessage(''); // Clear previous messages
        
        const place = event.detail.place; 
        
        if (!place || !place.id) {
          console.warn('Autocomplete event fired without place ID:', place);
          setMessage('\u8ACB\u5F9E\u5EFA\u8B70\u5217\u8868\u4E2D\u9078\u64C7\u4E00\u500B\u6709\u6548\u7684\u5730\u9EDE\u3002', 'warning');
          return;
        }

        const googlePlaceId = place.id;
        const placeName = place.displayName || place.formattedAddress || googlePlaceId; // Use best available name

        // --- SIMPLIFIED LOGIC: Only log to console --- 
        console.log('--- Place Selected (Debug) ---');
        console.log('Name:', placeName);
        console.log('ID (Place ID):', googlePlaceId);
        console.log('Full Place Object:', place); // Log the whole object for inspection
        setMessage('\u5730\u9EDE\u5DF2\u5728\u63A7\u5236\u53F0\u8A18\u9304 (\u958B\u767C\u6E2C\u8A66)\u3002 Name: ' + placeName + ', ID: ' + googlePlaceId, 'info');
        // --- End Simplified Logic ---
      }

      // Start the process when the script runs
      initMap();

    <\/script>
    `;
}
function getHomePageHtml(user, bundledCss) {
  return wrapPageHtml("Home", getHomePageContent(user), user, bundledCss);
}
function getGoogleInfoPageHtml(user, bundledCss) {
  return wrapPageHtml("Login Status", getGoogleInfoContent(user), user, bundledCss);
}
function getProfilePageHtml(user, bundledCss) {
  return wrapPageHtml("Profile", getProfilePageContent(user), user, bundledCss);
}
function getAddPlacePageHtml(user, bundledCss) {
  return wrapPageHtml("Add New Place", getAddPlacePageContent(), user, bundledCss);
}

// src/styles/tailwind.output.css
var tailwind_output_default = '*,::backdrop,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:#3b82f680;--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }/*! tailwindcss v3.4.17 | MIT License | https://tailwindcss.com*/*,:after,:before{border:0 solid #e5e7eb;box-sizing:border-box}:after,:before{--tw-content:""}:host,html{-webkit-text-size-adjust:100%;font-feature-settings:normal;-webkit-tap-highlight-color:transparent;font-family:Noto Sans TC,sans-serif;font-variation-settings:normal;line-height:1.5;tab-size:4}body{line-height:inherit;margin:0}hr{border-top-width:1px;color:inherit;height:0}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-feature-settings:normal;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em;font-variation-settings:normal}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:initial}sub{bottom:-.25em}sup{top:-.5em}table{border-collapse:collapse;border-color:inherit;text-indent:0}button,input,optgroup,select,textarea{font-feature-settings:inherit;color:inherit;font-family:inherit;font-size:100%;font-variation-settings:inherit;font-weight:inherit;letter-spacing:inherit;line-height:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:initial;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:initial}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{color:#9ca3af;opacity:1}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{height:auto;max-width:100%}[hidden]:where(:not([hidden=until-found])){display:none}:root{--primary-color:#1a73e8;--primary-light:#4ecdc4;--accent-color:#ff6b6b;--background-color:#fff;--text-color:#333;--border-color:#e0e0e0;--shadow-color:#0000001a;--font-family:"Noto Sans TC",sans-serif}*{box-sizing:border-box;margin:0;padding:0}html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}body{font-family:var(--font-family);line-height:1.6}h1,h2,h3,h4,h5,h6{font-family:Noto Serif TC,serif}.container{width:100%}@media (min-width:640px){.container{max-width:640px}}@media (min-width:768px){.container{max-width:768px}}@media (min-width:1024px){.container{max-width:1024px}}@media (min-width:1280px){.container{max-width:1280px}}@media (min-width:1536px){.container{max-width:1536px}}.container{margin-left:auto;margin-right:auto;max-width:80rem;padding-left:1rem;padding-right:1rem}@media (min-width:640px){.container{padding-left:1.5rem;padding-right:1.5rem}}@media (min-width:1024px){.container{padding-left:2rem;padding-right:2rem}}.header{--tw-border-opacity:1;--tw-backdrop-blur:blur(12px);-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);background-color:#fffc;border-bottom-width:1px;border-color:rgb(224 224 224/var(--tw-border-opacity,1));padding-bottom:1rem;padding-top:1rem;position:sticky;top:0;z-index:100}.nav{align-items:center;display:flex;justify-content:space-between}.nav-logo{--tw-text-opacity:1;color:rgb(26 115 232/var(--tw-text-opacity,1));color:var(--primary-color);font-size:1.5rem;font-weight:700;line-height:2rem;text-decoration-line:none}.nav-menu{align-items:center;display:none;gap:1.5rem;list-style-type:none}@media (min-width:768px){.nav-menu{display:flex}}.nav-link-active{--tw-text-opacity:1;color:rgb(0 102 204/var(--tw-text-opacity,1));font-weight:500}.mobile-menu-toggle{--tw-text-opacity:1;background-image:none;border-style:none;color:rgb(51 51 51/var(--tw-text-opacity,1));cursor:pointer;font-size:1.5rem;line-height:2rem}@media (min-width:768px){.mobile-menu-toggle{display:none}}.footer{--tw-border-opacity:1;--tw-bg-opacity:1;background-color:rgb(243 244 246/var(--tw-bg-opacity,1));border-color:rgb(224 224 224/var(--tw-border-opacity,1));border-top-width:1px;margin-top:4rem;padding-bottom:1rem;padding-top:1rem;text-align:center}@media (max-width:768px){.nav-menu{--tw-border-opacity:1;--tw-bg-opacity:1;--tw-shadow:0 4px 6px -1px #0000001a,0 2px 4px -1px #0000000f;--tw-shadow-colored:0 4px 6px -1px var(--tw-shadow-color),0 2px 4px -1px var(--tw-shadow-color);align-items:stretch;background-color:rgb(255 255 255/var(--tw-bg-opacity,1));border-bottom-width:1px;border-color:rgb(224 224 224/var(--tw-border-opacity,1));box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow);display:none;flex-direction:column;gap:1rem;left:0;padding:1rem;position:absolute;right:0;top:100%}.nav-menu.active{display:flex}.nav-menu .button{text-align:center;width:100%}}.nav-menu-item-avatar{align-items:center;display:flex;position:relative}.avatar-container-div{background-color:initial;border-style:none;cursor:pointer;padding:0}.user-avatar{border-color:#0000;border-radius:9999px;border-width:2px;cursor:pointer;display:inline-block;height:2rem;object-fit:cover;transition-duration:.2s;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);vertical-align:middle;width:2rem}.avatar-container-div:focus .user-avatar,.user-avatar:hover{border-color:var(--primary-color)}.avatar-fallback{--tw-text-opacity:1;background-color:#4ecdc4;border-radius:9999px;color:rgb(255 255 255/var(--tw-text-opacity,1));font-size:1rem;font-weight:700;height:2rem;line-height:2rem;text-align:center;width:2rem}.user-dropdown{--tw-border-opacity:1;--tw-bg-opacity:1;--tw-shadow:0 4px 6px -1px #0000001a,0 2px 4px -1px #0000000f;--tw-shadow-colored:0 4px 6px -1px var(--tw-shadow-color),0 2px 4px -1px var(--tw-shadow-color);background-color:rgb(255 255 255/var(--tw-bg-opacity,1));border-color:rgb(224 224 224/var(--tw-border-opacity,1));border-radius:.375rem;border-width:1px;box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow);display:none;margin-top:.5rem;min-width:160px;padding-bottom:.25rem;padding-top:.25rem;position:absolute;right:0;top:100%;z-index:50}.user-dropdown.dropdown-active{display:block}.dropdown-header{--tw-border-opacity:1;border-bottom-width:1px;border-color:rgb(224 224 224/var(--tw-border-opacity,1));padding:.5rem 1rem}.dropdown-header-name{color:rgb(17 24 39/var(--tw-text-opacity,1));font-size:.875rem;font-weight:500;line-height:1.25rem}.dropdown-header-email,.dropdown-header-name{--tw-text-opacity:1;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dropdown-header-email{color:rgb(107 114 128/var(--tw-text-opacity,1));font-size:.75rem;line-height:1rem}.dropdown-item{--tw-text-opacity:1;color:rgb(51 51 51/var(--tw-text-opacity,1));display:block;font-size:.875rem;line-height:1.25rem;padding:.5rem 1rem;text-decoration-line:none;white-space:nowrap}.dropdown-item:hover{--tw-bg-opacity:1;--tw-text-opacity:1;background-color:rgb(243 244 246/var(--tw-bg-opacity,1));color:rgb(26 115 232/var(--tw-text-opacity,1))}.dropdown-item{color:var(--text-color)}.dropdown-divider{--tw-bg-opacity:1;background-color:rgb(224 224 224/var(--tw-bg-opacity,1));height:1px;margin-bottom:.25rem;margin-top:.25rem}#logout-button{--tw-text-opacity:1;background-color:initial;border-style:none;color:rgb(220 38 38/var(--tw-text-opacity,1));cursor:pointer;text-align:left;width:100%}#logout-button:hover{--tw-bg-opacity:1;background-color:rgb(254 242 242/var(--tw-bg-opacity,1))}.category-label.active{--tw-border-opacity:1;--tw-bg-opacity:1;--tw-text-opacity:1;background-color:rgb(0 102 204/var(--tw-bg-opacity,1));border-color:rgb(0 102 204/var(--tw-border-opacity,1));color:rgb(255 255 255/var(--tw-text-opacity,1))}.collapse{visibility:collapse}.static{position:static}.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.sticky{position:sticky}.right-0{right:0}.top-0{top:0}.z-50{z-index:50}.mx-auto{margin-left:auto;margin-right:auto}.mb-1{margin-bottom:.25rem}.mb-2{margin-bottom:.5rem}.mb-4{margin-bottom:1rem}.mb-6{margin-bottom:1.5rem}.mr-2{margin-right:.5rem}.mt-2{margin-top:.5rem}.mt-4{margin-top:1rem}.mt-6{margin-top:1.5rem}.mt-auto{margin-top:auto}.block{display:block}.inline-block{display:inline-block}.flex{display:flex}.grid{display:grid}.hidden{display:none}.h-16{height:4rem}.h-20{height:5rem}.h-5{height:1.25rem}.h-6{height:1.5rem}.h-8{height:2rem}.h-full{height:100%}.min-h-\\[70vh\\]{min-height:70vh}.min-h-screen{min-height:100vh}.w-16{width:4rem}.w-20{width:5rem}.w-48{width:12rem}.w-5{width:1.25rem}.w-6{width:1.5rem}.w-8{width:2rem}.w-full{width:100%}.max-w-md{max-width:28rem}.max-w-sm{max-width:24rem}.max-w-xl{max-width:36rem}.flex-grow{flex-grow:1}.border-collapse{border-collapse:collapse}.cursor-pointer{cursor:pointer}.flex-col{flex-direction:column}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.space-x-4>:not([hidden])~:not([hidden]){--tw-space-x-reverse:0;margin-left:calc(1rem*(1 - var(--tw-space-x-reverse)));margin-right:calc(1rem*var(--tw-space-x-reverse))}.space-x-8>:not([hidden])~:not([hidden]){--tw-space-x-reverse:0;margin-left:calc(2rem*(1 - var(--tw-space-x-reverse)));margin-right:calc(2rem*var(--tw-space-x-reverse))}.space-y-1>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(.25rem*var(--tw-space-y-reverse));margin-top:calc(.25rem*(1 - var(--tw-space-y-reverse)))}.overflow-x-auto{overflow-x:auto}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rounded{border-radius:.25rem}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:.5rem}.rounded-md{border-radius:.375rem}.border{border-width:1px}.border-2{border-width:2px}.border-b{border-bottom-width:1px}.border-t{border-top-width:1px}.border-none{border-style:none}.border-gray-200{--tw-border-opacity:1;border-color:rgb(229 231 235/var(--tw-border-opacity,1))}.border-gray-300{--tw-border-opacity:1;border-color:rgb(209 213 219/var(--tw-border-opacity,1))}.border-primary-sky{--tw-border-opacity:1;border-color:rgb(232 240 254/var(--tw-border-opacity,1))}.bg-blue-500{--tw-bg-opacity:1;background-color:rgb(59 130 246/var(--tw-bg-opacity,1))}.bg-blue-600{--tw-bg-opacity:1;background-color:rgb(37 99 235/var(--tw-bg-opacity,1))}.bg-gray-100{--tw-bg-opacity:1;background-color:rgb(243 244 246/var(--tw-bg-opacity,1))}.bg-gray-200{--tw-bg-opacity:1;background-color:rgb(229 231 235/var(--tw-bg-opacity,1))}.bg-gray-300{--tw-bg-opacity:1;background-color:rgb(209 213 219/var(--tw-bg-opacity,1))}.bg-green-500{--tw-bg-opacity:1;background-color:rgb(34 197 94/var(--tw-bg-opacity,1))}.bg-primary-sky{--tw-bg-opacity:1;background-color:rgb(232 240 254/var(--tw-bg-opacity,1))}.bg-transparent{background-color:initial}.bg-white{--tw-bg-opacity:1;background-color:rgb(255 255 255/var(--tw-bg-opacity,1))}.object-cover{object-fit:cover}.p-2{padding:.5rem}.p-4{padding:1rem}.p-6{padding:1.5rem}.p-8{padding:2rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.py-1{padding-bottom:.25rem;padding-top:.25rem}.py-2{padding-bottom:.5rem;padding-top:.5rem}.pb-3{padding-bottom:.75rem}.pt-2{padding-top:.5rem}.pt-4{padding-top:1rem}.text-left{text-align:left}.text-center{text-align:center}.text-2xl{font-size:1.5rem;line-height:2rem}.text-3xl{font-size:1.875rem;line-height:2.25rem}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-xs{font-size:.75rem;line-height:1rem}.font-bold{font-weight:700}.font-medium{font-weight:500}.font-semibold{font-weight:600}.text-blue-500{--tw-text-opacity:1;color:rgb(59 130 246/var(--tw-text-opacity,1))}.text-blue-600{--tw-text-opacity:1;color:rgb(37 99 235/var(--tw-text-opacity,1))}.text-gray-500{--tw-text-opacity:1;color:rgb(107 114 128/var(--tw-text-opacity,1))}.text-gray-600{--tw-text-opacity:1;color:rgb(75 85 99/var(--tw-text-opacity,1))}.text-gray-700{--tw-text-opacity:1;color:rgb(55 65 81/var(--tw-text-opacity,1))}.text-gray-800{--tw-text-opacity:1;color:rgb(31 41 55/var(--tw-text-opacity,1))}.text-gray-900{--tw-text-opacity:1;color:rgb(17 24 39/var(--tw-text-opacity,1))}.text-green-600{--tw-text-opacity:1;color:rgb(22 163 74/var(--tw-text-opacity,1))}.text-orange-600{--tw-text-opacity:1;color:rgb(234 88 12/var(--tw-text-opacity,1))}.text-primary-ocean{--tw-text-opacity:1;color:rgb(0 102 204/var(--tw-text-opacity,1))}.text-red-600{--tw-text-opacity:1;color:rgb(220 38 38/var(--tw-text-opacity,1))}.text-text{--tw-text-opacity:1;color:rgb(51 51 51/var(--tw-text-opacity,1))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}.no-underline{text-decoration-line:none}.shadow-lg{--tw-shadow:0 10px 15px -3px #0000001a,0 4px 6px -2px #0000000d;--tw-shadow-colored:0 10px 15px -3px var(--tw-shadow-color),0 4px 6px -2px var(--tw-shadow-color)}.shadow-lg,.shadow-md{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.shadow-md{--tw-shadow:0 4px 6px -1px #0000001a,0 2px 4px -1px #0000000f;--tw-shadow-colored:0 4px 6px -1px var(--tw-shadow-color),0 2px 4px -1px var(--tw-shadow-color)}.shadow-sm{--tw-shadow:0 1px 2px 0 #0000000d;--tw-shadow-colored:0 1px 2px 0 var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.outline{outline-style:solid}.ring-1{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.ring-black{--tw-ring-opacity:1;--tw-ring-color:rgb(0 0 0/var(--tw-ring-opacity,1))}.ring-opacity-5{--tw-ring-opacity:0.05}.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition{transition-duration:.15s;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1)}.transition-colors{transition-duration:.15s;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1)}.duration-200{transition-duration:.2s}.ease-in-out{transition-timing-function:cubic-bezier(.4,0,.2,1)}.hover\\:border-primary-ocean:hover{--tw-border-opacity:1;border-color:rgb(0 102 204/var(--tw-border-opacity,1))}.hover\\:bg-blue-600:hover{--tw-bg-opacity:1;background-color:rgb(37 99 235/var(--tw-bg-opacity,1))}.hover\\:bg-blue-700:hover{--tw-bg-opacity:1;background-color:rgb(29 78 216/var(--tw-bg-opacity,1))}.hover\\:bg-gray-100:hover{--tw-bg-opacity:1;background-color:rgb(243 244 246/var(--tw-bg-opacity,1))}.hover\\:bg-gray-50:hover{--tw-bg-opacity:1;background-color:rgb(249 250 251/var(--tw-bg-opacity,1))}.hover\\:bg-green-600:hover{--tw-bg-opacity:1;background-color:rgb(22 163 74/var(--tw-bg-opacity,1))}.hover\\:bg-primary-sky:hover{--tw-bg-opacity:1;background-color:rgb(232 240 254/var(--tw-bg-opacity,1))}.hover\\:bg-red-50:hover{--tw-bg-opacity:1;background-color:rgb(254 242 242/var(--tw-bg-opacity,1))}.hover\\:text-primary-dark:hover{--tw-text-opacity:1;color:rgb(23 78 166/var(--tw-text-opacity,1))}.hover\\:text-primary-ocean:hover{--tw-text-opacity:1;color:rgb(0 102 204/var(--tw-text-opacity,1))}.hover\\:underline:hover{text-decoration-line:underline}.focus\\:border-primary-ocean:focus{--tw-border-opacity:1;border-color:rgb(0 102 204/var(--tw-border-opacity,1))}.focus\\:outline-none:focus{outline:2px solid #0000;outline-offset:2px}.focus\\:ring-primary-ocean:focus{--tw-ring-opacity:1;--tw-ring-color:rgb(0 102 204/var(--tw-ring-opacity,1))}@media (min-width:640px){.sm\\:text-sm{font-size:.875rem;line-height:1.25rem}}@media (min-width:768px){.md\\:flex{display:flex}.md\\:hidden{display:none}.md\\:p-8{padding:2rem}}';

// src/worker.js
function getCookie(request, name) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader)
    return null;
  const cookies = cookieHeader.split(";");
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    console.log(`[Worker] Received request: ${request.method} ${pathname}`);
    let authService, userService, sessionService, googleAuthService, locationService;
    try {
      userService = new UserService(env.DB);
      sessionService = new SessionService(env.DB);
      googleAuthService = new GoogleAuthService(env);
      locationService = new LocationService(env.DB, env.GOOGLE_MAPS_API_KEY);
      authService = new AuthService(userService, sessionService, googleAuthService);
    } catch (err) {
      console.error("[Worker] Failed to instantiate services:", err);
      if (err.message.includes("mapsApiKey")) {
        console.error("[Worker] GOOGLE_MAPS_API_KEY secret might be missing in Cloudflare environment.");
        return new Response("Internal Server Error - API Key Configuration Missing", { status: 500 });
      }
      return new Response("Internal Server Error - Service Configuration Failed", { status: 500 });
    }
    const sessionId = getCookie(request, "session");
    const user = await authService.getUserFromSession(sessionId);
    console.log("[Worker] User from session:", user ? user.email : "null");
    try {
      if (request.method === "GET" && pathname === "/") {
        console.log("[Worker] Serving homepage.");
        const html = getHomePageHtml(user, tailwind_output_default);
        return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
      if (request.method === "GET" && pathname === "/api/auth/google") {
        return initiateGoogleAuth(url, env);
      }
      if (request.method === "GET" && pathname === "/api/auth/google/request-gmb-scope") {
        console.log("[Worker] Handling request for GMB scope...");
        if (!user) {
          console.log("[Worker] User not logged in. Redirecting to login for GMB scope request.");
          return Response.redirect(url.origin + "/api/auth/google", 302);
        }
        return initiateGmbAuth(url, env, user.id);
      }
      if (request.method === "GET" && pathname === "/api/auth/google/callback") {
        console.log("[Worker] Handling Google callback...");
        console.log(`[Worker] Callback URL: ${url.toString()}`);
        const code = url.searchParams.get("code");
        console.log(`[Worker] Extracted code: ${code}`);
        if (!code) {
          console.error("[Worker] Missing authorization code in callback URL.");
          return new Response("Missing authorization code from Google", { status: 400 });
        }
        try {
          const { session, user: loggedInUser } = await authService.handleGoogleLogin(code);
          console.log("[Worker] Google login successful for:", loggedInUser.email);
          const cookieValue = `session=${session.id}; HttpOnly; Path=/; SameSite=Lax; Expires=${new Date(session.expiresAt).toUTCString()}`;
          const headers = new Headers();
          headers.append("Set-Cookie", cookieValue);
          headers.append("Location", "/profile");
          return new Response(null, { status: 302, headers });
        } catch (error) {
          console.error("[Worker] Google callback error:", error);
          const headers = new Headers();
          headers.append("Location", "/?error=google_auth_failed");
          return new Response(null, { status: 302, headers });
        }
      }
      if (request.method === "POST" && pathname === "/api/auth/logout") {
        console.log("[Worker] Handling logout...");
        const currentSessionId = getCookie(request, "session");
        if (currentSessionId) {
          try {
            await authService.logout(currentSessionId);
            console.log("[Worker] Logout successful for session:", currentSessionId);
          } catch (error) {
            console.error("[Worker] Logout error:", error);
          }
        }
        const cookieValue = `session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
        const headers = new Headers();
        headers.append("Set-Cookie", cookieValue);
        headers.append("Location", "/");
        return new Response(null, { status: 302, headers });
      }
      if (request.method === "GET" && pathname === "/google-info") {
        console.log("[Worker] Serving Google Info page.");
        const html = getGoogleInfoPageHtml(user, tailwind_output_default);
        return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
      if (request.method === "GET" && pathname === "/profile") {
        if (!user) {
          console.log("[Worker] User not logged in, redirecting from /profile to /");
          return Response.redirect(url.origin + "/", 302);
        }
        console.log("[Worker] Serving profile page for:", user.email);
        const html = getProfilePageHtml(user, tailwind_output_default);
        return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
      if (request.method === "GET" && pathname === "/api/maps/config") {
        console.log("[Worker] Providing Maps API config");
        const apiKey = env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.error("[Worker] GOOGLE_MAPS_API_KEY is not configured in environment secrets.");
          return new Response(JSON.stringify({ error: "Maps configuration unavailable." }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ apiKey }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (request.method === "POST" && pathname === "/api/locations/import/google-place") {
        console.log("[Worker] Handling POST /api/locations/import/google-place");
        if (!user || !user.id) {
          console.log("[Worker] Unauthorized attempt to import location.");
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        let requestBody;
        try {
          requestBody = await request.json();
        } catch (e) {
          console.error("[Worker] Invalid JSON in request body:", e);
          return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        const { googlePlaceId } = requestBody;
        if (!googlePlaceId || typeof googlePlaceId !== "string") {
          console.log("[Worker] Missing or invalid googlePlaceId in request body.");
          return new Response(JSON.stringify({ error: "Missing or invalid googlePlaceId" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        const userId = user.id;
        console.log(`[Worker] User ${userId} attempting to import place ${googlePlaceId}`);
        try {
          let location = await locationService.findLocationByPlaceId(googlePlaceId);
          if (!location) {
            console.log(`[Worker] Location ${googlePlaceId} not found locally. Fetching from Google...`);
            const locationDetails = await locationService.fetchPlaceDetails(googlePlaceId);
            if (!locationDetails) {
              console.error(`[Worker] Failed to fetch details for ${googlePlaceId} from Google.`);
              return new Response(JSON.stringify({ error: "Failed to fetch location details from Google." }), { status: 502, headers: { "Content-Type": "application/json" } });
            }
            locationDetails.createdByUser = userId;
            console.log(`[Worker] Creating new local location record for ${googlePlaceId}`);
            try {
              location = await locationService.createLocation(locationDetails);
            } catch (createError) {
              if (createError.message.includes("already exists")) {
                console.warn(`[Worker] Race condition? Location ${googlePlaceId} was created between check and insert. Fetching existing.`);
                location = await locationService.findLocationByPlaceId(googlePlaceId);
                if (!location) {
                  console.error(`[Worker] CRITICAL: Failed to find location ${googlePlaceId} after creation race condition.`);
                  throw new Error("Failed to resolve location after creation conflict.");
                }
              } else {
                throw createError;
              }
            }
          } else {
            console.log(`[Worker] Location ${googlePlaceId} found locally (ID: ${location.id}).`);
          }
          const isLinked = await locationService.checkUserLocationLink(userId, location.id);
          let userLocationLink = null;
          if (!isLinked) {
            console.log(`[Worker] Linking user ${userId} to location ${location.id}`);
            try {
              userLocationLink = await locationService.linkUserToLocation(userId, location.id);
            } catch (linkError) {
              if (linkError.message.includes("already associated")) {
                console.warn(`[Worker] User ${userId} already linked to location ${location.id} (detected during link attempt).`);
              } else {
                throw linkError;
              }
            }
          } else {
            console.log(`[Worker] User ${userId} is already linked to location ${location.id}.`);
          }
          console.log(`[Worker] Successfully processed import for place ${googlePlaceId} by user ${userId}.`);
          return new Response(JSON.stringify({
            message: "Location added to your list successfully.",
            locationId: location.id,
            userLocationLinkId: userLocationLink ? userLocationLink.id : null
            // Return link ID if newly created
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (error) {
          console.error(`[Worker] Error processing location import for place ${googlePlaceId}:`, error);
          return new Response(JSON.stringify({ error: "Failed to process location import." }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }
      if (request.method === "GET" && pathname === "/add-place") {
        if (!user) {
          console.log("[Worker] User not logged in, redirecting from /add-place to /");
          return Response.redirect(url.origin + "/", 302);
        }
        console.log("[Worker] Serving Add Place page for:", user.email);
        const html = getAddPlacePageHtml(user, tailwind_output_default);
        return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      }
      console.log(`[Worker] No specific route match for ${pathname}. Returning 404.`);
      return new Response("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" }
      });
    } catch (error) {
      console.error("[Worker] Unhandled Error in routing:", error);
      return new Response("Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
};
export {
  worker_default as default
};
