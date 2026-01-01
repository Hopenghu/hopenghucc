// Removed: import crypto from 'crypto'; - No longer needed for this part

export class SessionService {
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
    console.log(`[SessionService.createSession] Attempting to create session for userId: ${userId}`);
    try {
      // Use Web Crypto API for random bytes
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      // Convert bytes to hex string
      const sessionId = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const expiresAt = new Date(Date.now() + durationSeconds * 1000);

      const result = await this.db.prepare(
        'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, datetime("now"))'
      ).bind(sessionId, userId, expiresAt.toISOString()).run();

      // Check if insert was successful
      if (result.meta.changes !== 1) {
          console.error(`[SessionService.createSession] Failed to insert session for userId: ${userId}. DB meta:`, result.meta);
          throw new Error('Failed to create session in database');
    }
    
      const createdSession = {
        id: sessionId,
        userId: userId,
        expiresAt: expiresAt.toISOString()
      };
      console.log(`[SessionService.createSession] Successfully created session for userId ${userId}:`, createdSession);
      return createdSession;
    } catch (error) {
      console.error(`[SessionService.createSession] Error creating session for userId ${userId}:`, error);
      throw new Error('Could not create session'); // Rethrow a generic error
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
        'DELETE FROM sessions WHERE id = ?'
      ).bind(sessionId).run();
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error('Could not delete session');
    }
  }

  /**
   * Retrieves a session by its ID, ensuring it hasn't expired.
   * @param {string} sessionId - The ID of the session to retrieve.
   * @returns {Promise<{id: string, userId: number, expiresAt: string} | null>} The session object or null if not found or expired.
   */
  async getSession(sessionId) {
    console.log(`[SessionService.getSession] Attempting to get session for sessionId: ${sessionId}`);
    try {
      const session = await this.db.prepare(
        'SELECT id, user_id, expires_at FROM sessions WHERE id = ? AND expires_at > datetime("now")'
      ).bind(sessionId).first();

      if (!session) {
        console.log(`[SessionService.getSession] Session not found or expired for sessionId: ${sessionId}`);
        return null; // Not found or expired
      }

      // Map column names if needed (e.g., user_id to userId)
      const sessionToReturn = {
        id: session.id,
        userId: session.user_id,
        expiresAt: session.expires_at
      };
      console.log(`[SessionService.getSession] Found session for sessionId ${sessionId}:`, sessionToReturn);
      return sessionToReturn;
    } catch (error) {
      console.error(`[SessionService.getSession] Error getting session for sessionId ${sessionId}:`, error);
      throw new Error('Could not retrieve session');
    }
  }

  async getUserFromSession(request) {
    console.log('SessionService - getUserFromSession - Attempting...');
    const session = await this.getSession(request);
    if (!session || !session.userId) {
      console.log('SessionService - getUserFromSession - No valid session or userId found');
      return null;
    }
    
    console.log(`SessionService - getUserFromSession - Found session for user ID: ${session.userId}`);
    try {
      const userData = await this.env.DB.prepare(
        'SELECT id, email, name, avatar_url FROM users WHERE id = ?'
      ).bind(session.userId).first();
      console.log('SessionService - getUserFromSession - User DB Result:', userData);
      return userData;
    } catch (error) {
      console.error('SessionService - getUserFromSession - User DB Error:', error);
      return null;
    }
  }
}

// Default export for convenience if needed, but named export is generally preferred
// export default SessionService; 