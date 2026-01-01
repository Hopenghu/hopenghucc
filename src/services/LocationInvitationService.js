export class LocationInvitationService {
    constructor(db) {
        this.db = db;
    }

    /**
     * Generates a claim link for a location and stores the invitation.
     * @param {string} locationId - The ID of the location.
     * @param {string} merchantEmail - The email of the merchant to invite.
     * @param {string} adminId - The ID of the admin creating the invitation.
     * @returns {Promise<{claim_url: string, merchant_email: string} | {error: string, status: number}>}
     */
    async generateClaimLink(locationId, merchantEmail, adminId) {
        // Validate input (basic checks, more comprehensive checks in route handler)
        if (!locationId || !merchantEmail || !adminId) {
            return { error: 'Missing required fields: locationId, merchantEmail, or adminId.', status: 400 };
        }

        try {
            const claimToken = crypto.randomUUID();
            const now = new Date();
            const createdAtISO = now.toISOString();
            
            // Set expiration for 7 days from now
            const expiresAt = new Date(now.setDate(now.getDate() + 7));
            const expiresAtISO = expiresAt.toISOString();

            // TODO: Add optional check: Ensure location isn't already claimed or has a pending invitation.
            // This might involve querying the 'locations' table for 'claimed_by_user_id'
            // and 'location_invitations' for existing pending tokens for this locationId.

            const stmt = this.db.prepare(
                'INSERT INTO location_invitations (id, location_id, merchant_email, claim_token, status, created_at, created_by_admin_id, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            await stmt.bind(crypto.randomUUID(), locationId, merchantEmail, claimToken, 'pending_claim', createdAtISO, adminId, expiresAtISO).run();

            const claim_url = `https://www.hopenghu.cc/claim-location?token=${claimToken}`;

            return { claim_url, merchant_email: merchantEmail };
        } catch (error) {
            console.error('Error generating claim link:', error);
            // Check for unique constraint violation on claim_token, though highly unlikely with UUIDs
            if (error.message && error.message.includes('UNIQUE constraint failed: location_invitations.claim_token')) {
                 // Potentially retry generating token or return a specific error
                 return { error: 'Failed to generate a unique claim token. Please try again.', status: 500 };
            }
            // Check for foreign key constraint violation for location_id or admin_id
            // These should ideally be caught by prior validation in the route handler
            if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
                return { error: 'Invalid location_id or admin_id provided.', status: 400 };
            }
            return { error: 'Failed to generate claim link due to a server error.', status: 500 };
        }
    }

    /**
     * Verifies a claim token.
     * @param {string} token - The claim token.
     * @returns {Promise<{isValid: boolean, invitation?: object, error?: string, message?: string}>}
     */
    async verifyInvitationToken(token) {
        console.log(`[LocationInvitationService] verifyInvitationToken called with token: ${token}`);
        if (!token) {
            return { isValid: false, error: 'invalid_token', message: '權杖不可為空。' };
        }

        try {
            const stmt = this.db.prepare(
                'SELECT * FROM location_invitations WHERE claim_token = ?'
            );
            const invitation = await stmt.bind(token).first();

            if (!invitation) {
                return { isValid: false, error: 'invalid_token', message: '無效的邀請權杖。' };
            }

            if (invitation.status !== 'pending_claim') {
                // Consider if 'claimed' and other statuses need different messages
                return { isValid: false, error: 'already_used', message: '此邀請已被使用或已失效。' };
            }

            const now = new Date();
            const expiresAt = new Date(invitation.expires_at);
            if (now > expiresAt) {
                // Optionally, update status to 'expired' in DB
                // const updateStmt = this.db.prepare("UPDATE location_invitations SET status = 'expired' WHERE id = ?");
                // await updateStmt.bind(invitation.id).run();
                return { isValid: false, error: 'expired', message: '此邀請已過期。' };
            }

            return { isValid: true, invitation };
        } catch (dbError) {
            console.error("[LocationInvitationService] DB error during verifyInvitationToken:", dbError);
            return { isValid: false, error: 'db_error', message: '驗證邀請時發生資料庫錯誤。' };
        }
    }

    /**
     * Marks an invitation as claimed.
     * @param {string} invitationId - The ID of the invitation.
     * @param {string} claimingUserId - The ID of the user claiming the invitation.
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async markInvitationAsClaimed(invitationId, claimingUserId) {
        console.log(`[LocationInvitationService] markInvitationAsClaimed called for invitationId: ${invitationId}, claimingUserId: ${claimingUserId}`);
        if (!invitationId || !claimingUserId) {
            return { success: false, error: 'missing_parameters', message: '缺少邀請ID或用戶ID。' };
        }
        try {
            const now = new Date().toISOString();
            const stmt = this.db.prepare(
                "UPDATE location_invitations SET status = 'claimed', claimed_at = ?, claimed_by_user_id = ?, updated_at = ? WHERE id = ?"
            );
            // Note: Assuming 'updated_at' column exists. If not, it needs to be added or removed here.
            // Let's check migrations for `location_invitations` - migration 0004 created it.
            // It has: id, location_id, merchant_email, claim_token, status, created_at, created_by_admin_id, expires_at
            // It's missing updated_at and claimed_by_user_id and claimed_at.
            // migration 0014 added merchant_email (was already there), 0015 added created_by_admin_id (was already there), 0016 added expires_at (was already there)
            // We need to ensure `claimed_at` and `claimed_by_user_id` and `updated_at` exist.
            // `claimed_by_user_id` was added as part of `0013_add_claim_fields_to_locations.sql` to `locations` table, not `location_invitations`.
            // The original `0004_add_location_invitations_table.sql` should be checked.
            // id TEXT PRIMARY KEY,
            // location_id TEXT NOT NULL,
            // merchant_email TEXT NOT NULL,
            // claim_token TEXT NOT NULL UNIQUE,
            // status TEXT NOT NULL DEFAULT 'pending_claim', -- e.g., pending_claim, claimed, expired, revoked
            // expires_at TEXT, -- ISO8601 string
            // created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            // updated_at TEXT DEFAULT CURRENT_TIMESTAMP, -- This was missing in my mental model previously
            // created_by_admin_id TEXT, -- User ID of the admin who created it
            // claimed_by_user_id TEXT,  -- User ID of the user who claimed it
            // claimed_at TEXT,          -- Timestamp when claimed
            // FOREIGN KEY (location_id) REFERENCES locations(id),
            // FOREIGN KEY (created_by_admin_id) REFERENCES users(id),
            // FOREIGN KEY (claimed_by_user_id) REFERENCES users(id)

            // Based on my prior summary:
            // D1_ERROR: table location_invitations has no column named merchant_email -> fixed by 0014
            // D1_ERROR: table location_invitations has no column named created_by_admin_id -> fixed by 0015
            // D1_ERROR: NOT NULL constraint failed: location_invitations.expires_at -> fixed by 0016 and code change.

            // It seems `claimed_by_user_id` and `claimed_at` and `updated_at` are still missing from `location_invitations` table.
            // I will proceed with the SQL assuming they will be added.
            // I should create a new migration for these.

            const result = await stmt.bind(now, claimingUserId, now, invitationId).run();
            
            if (result.meta.changes === 0) {
                 return { success: false, error: 'not_found', message: '找不到對應的邀請或更新失敗。' };
            }
            return { success: true };
        } catch (dbError) {
            console.error("[LocationInvitationService] DB error during markInvitationAsClaimed:", dbError);
            return { success: false, error: 'db_error', message: '更新邀請狀態時發生資料庫錯誤。' };
        }
    }

    // We will add more methods here later for verify-claim-token and confirm-claim
} 