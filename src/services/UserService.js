import { hashPassword } from '../utils/password.js'; // Updated path

export class UserService {
  constructor(db) {
    if (!db) {
      throw new Error("Database connection is required for UserService.");
    }
    this.db = db;
  }

  async findUserById(userId) {
    try {
      // Select common user fields, adjust as needed
      const user = await this.db.prepare(
        'SELECT id, email, name, avatar_url, google_id, created_at FROM users WHERE id = ?'
      ).bind(userId).first();
      return user || null;
    } catch (error) {
      console.error(`Error finding user by ID ${userId}:`, error);
      throw new Error('Could not retrieve user data.');
    }
  }

  async findUserByEmail(email) {
    try {
       // Select fields needed for login verification and general use
      const user = await this.db.prepare(
        'SELECT id, email, name, password_hash, avatar_url, google_id FROM users WHERE email = ?'
      ).bind(email).first();
      return user || null;
    } catch (error) {
      console.error(`Error finding user by email ${email}:`, error);
      throw new Error('Could not retrieve user data by email.');
    }
  }
  
  async findUserByGoogleId(googleId) {
    try {
      const user = await this.db.prepare(
          'SELECT id, email, name, avatar_url, google_id FROM users WHERE google_id = ?'
      ).bind(googleId).first();
      return user || null;
    } catch (error) {
        console.error(`Error finding user by Google ID ${googleId}:`, error);
        throw new Error('Could not retrieve user data by Google ID.');
    }
  }

  async createUserWithPassword(email, password, name) {
    try {
      // Check if user already exists (optional, could be done before calling)
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      const hashedPassword = await hashPassword(password);

      const result = await this.db.prepare(
        'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, datetime("now"))'
      ).bind(email, hashedPassword, name).run();

      if (!result.meta.last_row_id) {
          throw new Error('Failed to insert user into database');
      }
      
      // Return the newly created user's essential info
      return {
        id: result.meta.last_row_id,
        email,
        name
      };
    } catch (error) {
      console.error('Error creating user with password:', error);
      // Re-throw specific errors or a generic one
      throw error instanceof Error ? error : new Error('Could not create user.');
    }
  }

  async findOrCreateUserByGoogleId(googleId, email, name, avatarUrl = null) {
    try {
      let user = await this.findUserByGoogleId(googleId);

      if (!user) {
        // User doesn't exist with this Google ID.
        // Check if a user exists with this email (maybe they registered normally first?)
        const existingEmailUser = await this.findUserByEmail(email);
        if (existingEmailUser) {
            // User exists with this email, but not linked to Google. Link them.
            await this.linkGoogleIdToUser(existingEmailUser.id, googleId);
            user = await this.findUserById(existingEmailUser.id); // Re-fetch updated user data
            if (!user) throw new Error('Failed to fetch user after linking Google ID.'); // Sanity check
        } else {
            // No user with this Google ID or email, create a new one.
            const insertResult = await this.db.prepare(
                'INSERT INTO users (email, name, google_id, avatar_url, created_at) VALUES (?, ?, ?, ?, datetime("now"))'
            ).bind(email, name, googleId, avatarUrl).run();
            
            if (!insertResult.meta.last_row_id) {
                throw new Error('Failed to create new user via Google Sign-In.');
            }
            // Fetch the newly created user
            user = await this.findUserById(insertResult.meta.last_row_id);
             if (!user) throw new Error('Failed to fetch newly created Google user.'); // Sanity check
        }
      }
      
      // Potentially update name/avatar if changed in Google profile (optional)
      // if (user && (user.name !== name || user.avatar_url !== avatarUrl)) {
      //   await this.updateUserProfile(user.id, { name, avatarUrl });
      //   user.name = name; // Update local object too
      //   user.avatar_url = avatarUrl;
      // }

      return user; // Return the found or newly created/linked user
    } catch (error) {
      console.error('Error in findOrCreateUserByGoogleId:', error);
      throw new Error('Could not find or create user via Google Sign-In.');
    }
  }
  
   async linkGoogleIdToUser(userId, googleId) {
      try {
          await this.db.prepare(
              'UPDATE users SET google_id = ? WHERE id = ?'
          ).bind(googleId, userId).run();
      } catch (error) {
          console.error(`Error linking Google ID ${googleId} to user ${userId}:`, error);
          throw new Error('Could not link Google account.');
      }
   }
   
   // Example for profile updates if needed later
   async updateUserProfile(userId, { name, avatarUrl }) {
       // Add logic to update user profile fields
   }

} 