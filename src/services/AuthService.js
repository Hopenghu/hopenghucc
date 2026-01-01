import { hashPassword, verifyPassword } from '../utils/password.js'; // Updated path

export class AuthService {
  constructor(userService, sessionService, googleAuthService) {
    if (!userService || !sessionService || !googleAuthService) {
      // Note: businessService is optional for initial login, but required for GMB flow
      throw new Error('UserService, SessionService, and GoogleAuthService are required.');
    }
    this.userService = userService;
    this.sessionService = sessionService;
    this.googleAuthService = googleAuthService;
  }

  /**
   * Registers a new user with email and password.
   * @param {object} credentials - { email, password, name }
   * @returns {Promise<object>} Newly created user object (essential info).
   */
  async registerWithPassword({ email, password, name }) {
    try {
      // Consider adding password strength validation here or in the route handler
      if (!email || !password || !name) {
          throw new Error('Email, password, and name are required for registration.');
      }
      // Hashing is now done within UserService's createUserWithPassword
      const user = await this.userService.createUserWithPassword(email, password, name);
      // Decide if login automatically after registration
      // const session = await this.sessionService.createSession(user.id);
      // return { user, session };
      return user; // Returning just the user for now
    } catch (error) {
      console.error('AuthService - registerWithPassword error:', error);
      // Handle specific errors like 'User already exists'
      throw error; // Re-throw for handling in the route
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
          throw new Error('Email and password are required for login.');
      }
      const user = await this.userService.findUserByEmail(email);

      if (!user || !user.password_hash) {
        throw new Error('Invalid email or password.'); // Keep error generic
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        throw new Error('Invalid email or password.'); // Keep error generic
      }

      const session = await this.sessionService.createSession(user.id);

      // Return only necessary, non-sensitive user data
      return {
        session,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        },
      };
    } catch (error) {
      console.error('AuthService - loginWithPassword error:', error);
      throw error; // Re-throw for handling in the route
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
          throw new Error('Google authorization code is required.');
      }
      // Authenticate returns { userData, accessToken }
      const { userData: googleUserData, accessToken } = await this.googleAuthService.authenticate(code);
      
      // --- Temporary Log for Access Token (REMOVE in production) ---
      // Avoid logging the full token in real scenarios
      if (accessToken) {
           console.log('[AuthService] Received Access Token (Log first 10 chars): ', accessToken.substring(0, 10)); 
      } else {
           console.warn('[AuthService] Access Token not received after authentication.');
      }
      // --- End Temporary Log ---
      
      if (!googleUserData || !googleUserData.sub || !googleUserData.email) {
        throw new Error('Failed to retrieve valid user data from Google.');
      }

      const user = await this.userService.findOrCreateUserByGoogleId(
        googleUserData.sub,
        googleUserData.email,
        googleUserData.name,
        googleUserData.picture
      );
      
      // --- REMOVE GMB Check --- 
      // The entire block related to hasBusinessAccess and this.businessService has been removed.
      // --- End REMOVE GMB Check --- 

      console.log(`[AuthService.handleGoogleLogin] Attempting to create session for user ID: ${user.id}, email: ${user.email}`);
      const session = await this.sessionService.createSession(user.id);
      console.log(`[AuthService.handleGoogleLogin] Session creation result:`, session); // Log the whole session object
      
      if (!session || !session.id) {
          console.error(`[AuthService.handleGoogleLogin] CRITICAL: Session creation failed or returned invalid session object for user ID: ${user.id}`);
          throw new Error('Session creation failed internally.'); // This will be caught by the outer try-catch
      }

      // Return user data - potentially add hasBusinessAccess flag if needed by frontend immediately
      return {
        session,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          // hasGoogleBusiness: hasBusinessAccess // Example: Add flag if needed
        },
      };
    } catch (error) {
      console.error('AuthService - handleGoogleLogin error:', error);
      // Consider logging specific internal errors but throwing a generic one
      throw new Error('Google Sign-In failed. Please try again.'); 
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
            console.warn('Logout called without session ID.');
            return; // Or throw error if session ID is expected
        }
      await this.sessionService.deleteSession(sessionId);
    } catch (error) {
      console.error('AuthService - logout error:', error);
      throw new Error('Logout failed.');
    }
  }

  /**
   * Retrieves the authenticated user based on a session ID.
   * @param {string} sessionId - The session ID from the client (e.g., cookie).
   * @returns {Promise<object | null>} The user object (non-sensitive data) or null.
   */
  async getUserFromSession(sessionId) {
    console.log('[AuthService.getUserFromSession] Received sessionId:', sessionId); // Log sessionId
    try {
      if (!sessionId) {
          console.log('[AuthService.getUserFromSession] No sessionId provided, returning null.');
          return null; // No session ID provided
      }
      const session = await this.sessionService.getSession(sessionId);
      console.log('[AuthService.getUserFromSession] Session from sessionService:', session); // Log session object

      if (!session) {
        console.log('[AuthService.getUserFromSession] Session not found or expired, returning null.');
        return null; // Session not found or expired
      }

      const userFromDb = await this.userService.findUserById(session.userId);
      console.log('[AuthService.getUserFromSession] User from userService.findUserById:', userFromDb); // Log user from DB

      if (!userFromDb) {
          console.log('[AuthService.getUserFromSession] User not found by ID from session, returning null.');
          return null;
      }
      
      const userToReturn = { 
          id: userFromDb.id, 
          email: userFromDb.email, 
          name: userFromDb.name, 
          avatar_url: userFromDb.avatar_url, 
          role: userFromDb.role 
      };
      console.log('[AuthService.getUserFromSession] Returning user object:', userToReturn);
      return userToReturn;

    } catch (error) {
      console.error('[AuthService.getUserFromSession] Error:', error);
      // Decide whether to throw or return null on internal errors
      // Returning null might be safer for middleware checks
      return null; 
    }
  }
  
   // Potentially add methods like requestPasswordReset, verifyResetToken, etc. here
} 