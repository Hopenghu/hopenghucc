export class GoogleAuthService {
  constructor(env) {
    // Check for required environment variables
    if (!env || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
      console.warn("Google OAuth environment variables not fully configured. Google authentication will be disabled.");
      this.enabled = false;
      return;
    }
    this.clientId = env.GOOGLE_CLIENT_ID;
    this.clientSecret = env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = env.GOOGLE_REDIRECT_URI;
    this.enabled = true;
  }

  async exchangeCodeForToken(code) {
    if (!this.enabled) {
      throw new Error("Google authentication is disabled due to missing environment variables.");
    }
    
    try {
        const requestBody = new URLSearchParams({
            code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code',
        });
        
        console.log(`[GoogleAuthService] Exchanging code. Sending params (excluding secret): code=${code}, client_id=${this.clientId}, redirect_uri=${this.redirectUri}, grant_type=authorization_code`);

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestBody,
        });

        if (!tokenResponse.ok) {
            // Attempt to get more detailed error from Google response body
            let errorBodyText = '[Could not read error body]';
            try {
                errorBodyText = await tokenResponse.text();
            } catch (readError) {
                console.error('[GoogleAuthService] Failed to read error response body:', readError);
            }
            console.error(`[GoogleAuthService] Token exchange failed! Status: ${tokenResponse.status}, Response Body: ${errorBodyText}`);
            throw new Error(`Failed to exchange code for token. Status: ${tokenResponse.status}`);
        }

        return await tokenResponse.json();
    } catch (error) {
        console.error('Error exchanging Google code for token:', error);
        throw new Error('Could not exchange authorization code for token.');
    }
  }

  async verifyGoogleToken(idToken) {
    if (!this.enabled) {
      throw new Error("Google authentication is disabled due to missing environment variables.");
    }
    
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Failed to verify Google ID token:', response.status, errorBody);
        throw new Error(`Failed to verify Google ID token. Status: ${response.status}`);
      }

      const tokenInfo = await response.json();
      
      // Additional verification: Check audience (aud) matches your client ID
      if (tokenInfo.aud !== this.clientId) {
          console.error('Token audience mismatch:', tokenInfo.aud, 'expected:', this.clientId);
          throw new Error('Invalid token: Audience mismatch.');
      }
      
      // Add more checks if necessary (e.g., issuer)

      return tokenInfo; // Contains sub, email, name, picture etc.
    } catch (error) {
      console.error('Error verifying Google ID token:', error);
       throw new Error('Could not verify Google ID token.');
    }
  }

  /**
   * Authenticates a user using the Google authorization code.
   * Exchanges the code for tokens and verifies the ID token.
   * @param {string} code - The authorization code from Google callback.
   * @returns {Promise<{userData: object, accessToken: string}>} Object containing verified Google user data and the access token.
   */
  async authenticate(code) {
    if (!this.enabled) {
      throw new Error("Google authentication is disabled due to missing environment variables.");
    }
    
    try {
        const tokens = await this.exchangeCodeForToken(code);
        if (!tokens.id_token) {
            throw new Error('ID token not found in Google response.');
        }
        if (!tokens.access_token) {
             throw new Error('Access token not found in Google response.');
        }
        const verifiedUserData = await this.verifyGoogleToken(tokens.id_token);
        
        // Return both user data and access token
        return {
            userData: verifiedUserData,
            accessToken: tokens.access_token
        };
    } catch (error) {
        console.error('Google authentication failed:', error);
        // Ensure we throw a generic error or the specific error as needed
        throw error instanceof Error ? error : new Error('Google authentication process failed.');
    }
  }
} 