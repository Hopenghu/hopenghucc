var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/auth/password.js
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
async function hashPassword(password) {
  try {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = await scryptAsync(
      password,
      salt,
      KEY_LENGTH,
      SCRYPT_PARAMS
    );
    const combined = Buffer.alloc(salt.length + derivedKey.length);
    salt.copy(combined, 0);
    derivedKey.copy(combined, salt.length);
    return combined.toString("hex");
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Password hashing failed");
  }
}
var scryptAsync, SALT_LENGTH, KEY_LENGTH, SCRYPT_PARAMS;
var init_password = __esm({
  "src/auth/password.js"() {
    scryptAsync = promisify(scrypt);
    SALT_LENGTH = 32;
    KEY_LENGTH = 64;
    SCRYPT_PARAMS = {
      N: 16384,
      // CPU/memory cost parameter
      r: 8,
      // Block size parameter
      p: 1
      // Parallelization parameter
    };
  }
});

// src/auth/session.js
import { randomBytes as randomBytes2 } from "node:crypto";
async function deleteSession(db, sessionId) {
  try {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
}
var init_session = __esm({
  "src/auth/session.js"() {
    init_user();
  }
});

// src/auth/user.js
async function createUser(db, email, password, name) {
  try {
    const existingUser = await db.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email).first();
    if (existingUser) {
      throw new Error("User already exists");
    }
    const hashedPassword = await hashPassword(password);
    const result = await db.prepare(
      'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, datetime("now")) RETURNING id, email, name'
    ).bind(email, hashedPassword, name).first();
    return result;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}
async function getUser(db, userId) {
  try {
    const user = await db.prepare(
      "SELECT id, email, name FROM users WHERE id = ?"
    ).bind(userId).first();
    return user || null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}
async function updateUser(db, userId, updates) {
  try {
    const sets = [];
    const values = [];
    if (updates.name) {
      sets.push("name = ?");
      values.push(updates.name);
    }
    if (updates.password) {
      sets.push("password_hash = ?");
      values.push(await hashPassword(updates.password));
    }
    if (sets.length === 0) {
      throw new Error("No updates provided");
    }
    values.push(userId);
    const query = `
      UPDATE users 
      SET ${sets.join(", ")}
      WHERE id = ?
      RETURNING id, email, name
    `;
    const result = await db.prepare(query).bind(...values).first();
    if (!result) {
      throw new Error("User not found");
    }
    return result;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}
async function deleteUser(db, userId) {
  try {
    const result = await db.prepare(
      "DELETE FROM users WHERE id = ?"
    ).bind(userId).run();
    return result.changes > 0;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}
var init_user = __esm({
  "src/auth/user.js"() {
    init_password();
    init_session();
  }
});

// src/api/users.js
var users_exports = {};
__export(users_exports, {
  handleUsersRequest: () => handleUsersRequest
});
async function handleUsersRequest(request, env) {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split("/").pop();
    switch (request.method) {
      case "GET":
        if (userId === "users") {
          const users = await env.DB.prepare(
            "SELECT id, email, name, created_at FROM users"
          ).all();
          return new Response(JSON.stringify(users), {
            headers: { "Content-Type": "application/json" }
          });
        } else {
          const user = await getUser(env.DB, userId);
          if (!user) {
            return new Response("User not found", { status: 404 });
          }
          return new Response(JSON.stringify(user), {
            headers: { "Content-Type": "application/json" }
          });
        }
      case "POST":
        const { email, password, name } = await request.json();
        const newUser = await createUser(env.DB, email, password, name);
        return new Response(JSON.stringify(newUser), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      case "PUT":
        const updates = await request.json();
        const updatedUser = await updateUser(env.DB, userId, updates);
        return new Response(JSON.stringify(updatedUser), {
          headers: { "Content-Type": "application/json" }
        });
      case "DELETE":
        const deleted = await deleteUser(env.DB, userId);
        if (!deleted) {
          return new Response("User not found", { status: 404 });
        }
        return new Response(null, { status: 204 });
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  } catch (error) {
    console.error("Error handling users request:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
var init_users = __esm({
  "src/api/users.js"() {
    init_user();
  }
});

// src/api/events.js
var events_exports = {};
__export(events_exports, {
  handleEventsRequest: () => handleEventsRequest
});
async function handleEventsRequest(request, env) {
  try {
    const url = new URL(request.url);
    const eventId = url.pathname.split("/").pop();
    switch (request.method) {
      case "GET":
        if (eventId === "events") {
          const events = await env.DB.prepare(
            "SELECT id, title, description, start_date, end_date, location, created_at FROM events"
          ).all();
          return new Response(JSON.stringify(events), {
            headers: { "Content-Type": "application/json" }
          });
        } else {
          const event = await env.DB.prepare(
            "SELECT id, title, description, start_date, end_date, location, created_at FROM events WHERE id = ?"
          ).bind(eventId).first();
          if (!event) {
            return new Response("Event not found", { status: 404 });
          }
          return new Response(JSON.stringify(event), {
            headers: { "Content-Type": "application/json" }
          });
        }
      case "POST":
        const { title, description, startDate, endDate, location } = await request.json();
        const result = await env.DB.prepare(
          'INSERT INTO events (title, description, start_date, end_date, location, created_at) VALUES (?, ?, ?, ?, ?, datetime("now")) RETURNING *'
        ).bind(title, description, startDate, endDate, location).first();
        return new Response(JSON.stringify(result), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      case "PUT":
        const updates = await request.json();
        const sets = [];
        const values = [];
        for (const [key, value] of Object.entries(updates)) {
          if (value !== void 0) {
            sets.push(`${key} = ?`);
            values.push(value);
          }
        }
        if (sets.length === 0) {
          return new Response("No updates provided", { status: 400 });
        }
        values.push(eventId);
        const query = `
          UPDATE events 
          SET ${sets.join(", ")}
          WHERE id = ?
          RETURNING *
        `;
        const updatedEvent = await env.DB.prepare(query).bind(...values).first();
        if (!updatedEvent) {
          return new Response("Event not found", { status: 404 });
        }
        return new Response(JSON.stringify(updatedEvent), {
          headers: { "Content-Type": "application/json" }
        });
      case "DELETE":
        const deleteResult = await env.DB.prepare(
          "DELETE FROM events WHERE id = ?"
        ).bind(eventId).run();
        if (deleteResult.changes === 0) {
          return new Response("Event not found", { status: 404 });
        }
        return new Response(null, { status: 204 });
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  } catch (error) {
    console.error("Error handling events request:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
var init_events = __esm({
  "src/api/events.js"() {
  }
});

// src/api/places.js
var places_exports = {};
__export(places_exports, {
  handlePlacesRequest: () => handlePlacesRequest
});
async function handlePlacesRequest(request, env) {
  var _a;
  try {
    const url = new URL(request.url);
    const placeId = url.pathname.split("/").pop();
    switch (request.method) {
      case "GET":
        if (placeId === "places") {
          const places = await env.DB.prepare(
            "SELECT id, name, description, address, latitude, longitude, category, rating, price_level, created_at FROM places"
          ).all();
          return new Response(JSON.stringify(places), {
            headers: { "Content-Type": "application/json" }
          });
        } else {
          const place = await env.DB.prepare(
            "SELECT id, name, description, address, latitude, longitude, category, rating, price_level, created_at FROM places WHERE id = ?"
          ).bind(placeId).first();
          if (!place) {
            return new Response("Place not found", { status: 404 });
          }
          const photos2 = await env.DB.prepare(
            "SELECT id, url, caption FROM place_photos WHERE place_id = ?"
          ).bind(placeId).all();
          place.photos = photos2;
          return new Response(JSON.stringify(place), {
            headers: { "Content-Type": "application/json" }
          });
        }
      case "POST":
        const { name, description, address, latitude, longitude, category, rating, priceLevel, photos } = await request.json();
        const tx = env.DB.batch([
          env.DB.prepare(
            'INSERT INTO places (name, description, address, latitude, longitude, category, rating, price_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now")) RETURNING *'
          ).bind(name, description, address, latitude, longitude, category, rating, priceLevel)
        ]);
        const [placeResult] = await tx.run();
        const newPlace = placeResult.results[0];
        if (photos && photos.length > 0) {
          const photoInserts = photos.map(
            (photo) => env.DB.prepare(
              "INSERT INTO place_photos (place_id, url, caption) VALUES (?, ?, ?)"
            ).bind(newPlace.id, photo.url, photo.caption)
          );
          await env.DB.batch(photoInserts).run();
        }
        return new Response(JSON.stringify(newPlace), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      case "PUT":
        const updates = await request.json();
        const sets = [];
        const values = [];
        for (const [key, value] of Object.entries(updates)) {
          if (value !== void 0 && key !== "photos") {
            sets.push(`${key} = ?`);
            values.push(value);
          }
        }
        if (sets.length === 0 && !updates.photos) {
          return new Response("No updates provided", { status: 400 });
        }
        values.push(placeId);
        const updateQueries = [];
        if (sets.length > 0) {
          updateQueries.push(
            env.DB.prepare(`
              UPDATE places 
              SET ${sets.join(", ")}
              WHERE id = ?
              RETURNING *
            `).bind(...values)
          );
        }
        if (updates.photos) {
          updateQueries.push(
            env.DB.prepare("DELETE FROM place_photos WHERE place_id = ?").bind(placeId)
          );
          updates.photos.forEach((photo) => {
            updateQueries.push(
              env.DB.prepare(
                "INSERT INTO place_photos (place_id, url, caption) VALUES (?, ?, ?)"
              ).bind(placeId, photo.url, photo.caption)
            );
          });
        }
        const updateResults = await env.DB.batch(updateQueries).run();
        const updatedPlace = (_a = updateResults[0]) == null ? void 0 : _a.results[0];
        if (!updatedPlace) {
          return new Response("Place not found", { status: 404 });
        }
        return new Response(JSON.stringify(updatedPlace), {
          headers: { "Content-Type": "application/json" }
        });
      case "DELETE":
        await env.DB.prepare(
          "DELETE FROM place_photos WHERE place_id = ?"
        ).bind(placeId).run();
        const deleteResult = await env.DB.prepare(
          "DELETE FROM places WHERE id = ?"
        ).bind(placeId).run();
        if (deleteResult.changes === 0) {
          return new Response("Place not found", { status: 404 });
        }
        return new Response(null, { status: 204 });
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  } catch (error) {
    console.error("Error handling places request:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
var init_places = __esm({
  "src/api/places.js"() {
  }
});

// src/api/auth.js
var auth_exports = {};
__export(auth_exports, {
  handleAuthRequest: () => handleAuthRequest
});
import { randomBytes as randomBytes3 } from "node:crypto";
function generateSessionId() {
  return randomBytes3(32).toString("hex");
}
async function handleAuthRequest(request, env) {
  var _a, _b;
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter((p) => p);
  const action = pathParts[2];
  try {
    switch (action) {
      case "google":
        if (pathParts[3] === "init") {
          if (request.method !== "GET") {
            return new Response("Method Not Allowed", { status: 405 });
          }
          const clientId = env.GOOGLE_CLIENT_ID;
          if (!clientId)
            return new Response("Google Client ID not configured", { status: 500 });
          const redirectUri = `${url.origin}/api/auth/google/callback`;
          const scope = "openid email profile";
          const state = crypto.randomUUID();
          const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
          authUrl.searchParams.append("client_id", clientId);
          authUrl.searchParams.append("redirect_uri", redirectUri);
          authUrl.searchParams.append("response_type", "code");
          authUrl.searchParams.append("scope", scope);
          authUrl.searchParams.append("state", state);
          return new Response(JSON.stringify({ url: authUrl.toString() }), {
            headers: { "Content-Type": "application/json" }
          });
        }
        if (pathParts[3] === "callback") {
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          if (!state) {
            console.error("Missing OAuth state parameter");
            return new Response("Invalid state parameter", { status: 400 });
          }
          if (!code) {
            return new Response("Invalid request: missing code", { status: 400 });
          }
          console.log("Handling Google OAuth callback...");
          try {
            console.log("Exchanging code for token...");
            const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                code,
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${url.origin}/api/auth/google/callback`,
                grant_type: "authorization_code"
              })
            });
            if (!tokenResponse.ok) {
              const errorBody = await tokenResponse.text();
              console.error("Failed to get access token:", tokenResponse.status, errorBody);
              throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
            }
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            console.log("Successfully exchanged code for token.");
            console.log("Fetching user info from Google...");
            const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!userInfoResponse.ok) {
              const errorBody = await userInfoResponse.text();
              console.error("Failed to get user info:", userInfoResponse.status, errorBody);
              throw new Error(`Failed to get user info: ${userInfoResponse.statusText}`);
            }
            const userInfo = await userInfoResponse.json();
            console.log("Fetched user info:", { email: userInfo.email, name: userInfo.name, id: userInfo.id });
            if (!userInfo.email) {
              throw new Error("Email not provided by Google OAuth.");
            }
            let userId;
            let userJustCreated = false;
            console.log(`Looking for user with email: ${userInfo.email}`);
            const existingUser = await env.DB.prepare(
              "SELECT id FROM users WHERE email = ?"
            ).bind(userInfo.email).first();
            const userAvatarUrl = userInfo.picture || null;
            if (existingUser) {
              userId = existingUser.id;
              console.log(`Found existing user: ${userId}. Updating...`);
              await env.DB.prepare(
                "UPDATE users SET google_id = ?, name = ?, avatar_url = ?, updated_at = unixepoch() WHERE id = ?"
                // Add avatar_url
              ).bind(userInfo.id, userInfo.name || "Google User", userAvatarUrl, userId).run();
              console.log(`Updated user: ${userId}`);
            } else {
              userId = crypto.randomUUID();
              userJustCreated = true;
              console.log(`User not found. Creating new user with id: ${userId}`);
              await env.DB.prepare(
                "INSERT INTO users (id, email, name, google_id, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch())"
                // Add avatar_url
              ).bind(userId, userInfo.email, userInfo.name || "Google User", userInfo.id, userAvatarUrl).run();
              console.log(`Created new user: ${userId}`);
            }
            console.log(`Creating session for user: ${userId}`);
            const sessionId = generateSessionId();
            const expiresAt = /* @__PURE__ */ new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            await env.DB.prepare(
              "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, unixepoch())"
              // Use unixepoch()
            ).bind(sessionId, userId, Math.floor(expiresAt.getTime() / 1e3)).run();
            console.log(`Created session: ${sessionId}`);
            const headers = new Headers();
            headers.append("Set-Cookie", `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
            headers.append("Location", "/");
            console.log("Redirecting user to / ...");
            return new Response(null, {
              status: 302,
              headers
            });
          } catch (error) {
            console.error("Google OAuth callback error:", error);
            return new Response("Google Authentication failed", { status: 500 });
          }
        }
        break;
      case "logout":
        if (request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }
        console.log("Handling logout...");
        const sessionCookie = (_b = (_a = request.headers.get("Cookie")) == null ? void 0 : _a.match(/session=([^;]+)/)) == null ? void 0 : _b[1];
        if (sessionCookie) {
          try {
            console.log(`Deleting session: ${sessionCookie}`);
            await deleteSession(env.DB, sessionCookie);
            console.log(`Session ${sessionCookie} deleted.`);
          } catch (e) {
            console.error("Error deleting session during logout:", e);
          }
        }
        const logoutHeaders = new Headers();
        logoutHeaders.append("Set-Cookie", "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax");
        logoutHeaders.append("Content-Type", "application/json");
        logoutHeaders.append("Location", "/");
        console.log("Logout successful, redirecting...");
        return new Response(null, {
          status: 302,
          headers: logoutHeaders
        });
      default:
        return new Response("Auth action not Found", { status: 404 });
    }
  } catch (error) {
    console.error("Auth API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
var init_auth = __esm({
  "src/api/auth.js"() {
    init_session();
  }
});

// src/api/csp.js
var csp_exports = {};
__export(csp_exports, {
  handleCspReport: () => handleCspReport
});
async function handleCspReport(request, env) {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    const report = await request.json();
    console.error("CSP Violation:", JSON.stringify(report, null, 2));
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error handling CSP report:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
var init_csp = __esm({
  "src/api/csp.js"() {
  }
});

// src/services/SessionService.js
var SessionService = class {
  constructor(env) {
    this.env = env;
  }
  async getSession(request) {
    const cookies = request.headers.get("cookie");
    console.log("SessionService - getSession - Cookies:", cookies);
    if (!cookies) {
      console.log("SessionService - getSession - No cookies found");
      return null;
    }
    const sessionMatch = cookies.match(/session=([^;]+)/);
    if (!sessionMatch) {
      console.log("SessionService - getSession - Session cookie not found in cookies");
      return null;
    }
    const sessionId = sessionMatch[1];
    console.log(`SessionService - getSession - Found session ID: ${sessionId}`);
    try {
      const sessionData = await this.env.DB.prepare(
        "SELECT id, user_id as userId, expires_at as expiresAt FROM sessions WHERE id = ? AND expires_at > unixepoch()"
        // Compare with current Unix time
      ).bind(sessionId).first();
      console.log("SessionService - getSession - DB Result:", sessionData);
      if (sessionData && sessionData.expiresAt * 1e3 < Date.now()) {
        console.log(`SessionService - getSession - Session ${sessionId} expired.`);
        return null;
      }
      return sessionData;
    } catch (error) {
      console.error("SessionService - getSession - DB Error:", error);
      return null;
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
  async createSession(userId) {
    try {
      const sessionId = crypto.randomUUID();
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const expiresAtTimestamp = Math.floor(expiresAt.getTime() / 1e3);
      console.log(`SessionService - createSession - Creating session ${sessionId} for user ${userId}, expires: ${expiresAt.toISOString()}`);
      await this.env.DB.prepare(
        "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, unixepoch())"
      ).bind(sessionId, userId, expiresAtTimestamp).run();
      console.log(`SessionService - createSession - Session ${sessionId} created.`);
      return { id: sessionId, userId, expiresAt };
    } catch (error) {
      console.error("SessionService - createSession - Error:", error);
      throw new Error("Failed to create session");
    }
  }
  async deleteSession(db, sessionId) {
    console.log(`SessionService - deleteSession - Deleting session ID: ${sessionId}`);
    if (!sessionId)
      return;
    try {
      const result = await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
      console.log("SessionService - deleteSession - Deletion result:", result);
    } catch (error) {
      console.error("SessionService - deleteSession - Error:", error);
    }
  }
};

// src/services/SecurityService.js
var SecurityService = class {
  constructor() {
    this.nonce = this.generateNonce();
  }
  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  getNonce() {
    return this.nonce;
  }
  getCSPHeaders() {
    const nonce = this.getNonce();
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://apis.google.com`,
      `style-src 'self' https://fonts.googleapis.com 'nonce-${nonce}'`,
      `style-src-attr 'self' 'nonce-${nonce}'`,
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: https: https://www.gstatic.com",
      "connect-src 'self' https://apis.google.com https://accounts.google.com",
      "frame-src 'self' https://accounts.google.com",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'"
    ].join("; ");
    return {
      "Content-Security-Policy": csp,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
    };
  }
};

// src/pages/Home.js
import React from "react";

// src/components/layout.js
function pageTemplate({ title, content, user, nonce }) {
  console.log("pageTemplate called with:", { title, user: !!user, nonce });
  try {
    const html = `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || "HOPE PENGHU"} - HOPE PENGHU</title> 
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
        <!-- Link to the generated CSS file -->
        <link rel="stylesheet" href="/build/worker.css">
        <!-- Removed inline <style> block. Styles are now in globals.css -->
        <!-- Note: globals.css needs to be imported in the JS entry point (e.g., worker.js) -->
      </head>
      <body>
        <header class="header">
          <nav class="nav container">
            <a href="/" class="nav-logo">HOPE PENGHU</a>
            <ul class="nav-menu">
              <li><a href="/explore" class="nav-link">\u63A2\u7D22</a></li>
              <li><a href="/events" class="nav-link">\u6D3B\u52D5</a></li>
              <li><a href="/offers" class="nav-link">\u512A\u60E0</a></li>
              ${user ? `
                <li class="nav-menu-item-avatar">
                  <div id="avatar-container" role="button" tabindex="0" aria-label="User menu" class="focus:outline-none avatar-container-div"> 
                     ${user.avatar_url ? `<img src="${user.avatar_url}" alt="User Avatar" class="user-avatar">` : `<span class="user-avatar avatar-fallback">${user.name ? user.name.charAt(0).toUpperCase() : "?"}</span>`}
                  </div>
                  
                  <div id="user-dropdown-menu" class="user-dropdown">
                    <div class="dropdown-header">
                       <p class="dropdown-header-name">${user.name || "User"}</p>
                       <p class="dropdown-header-email">${user.email || ""}</p>
                    </div>
                    <a href="/profile" class="dropdown-item">\u500B\u4EBA\u8CC7\u6599</a>
                    <div class="dropdown-divider"></div>
                    <button id="logout-button" class="dropdown-item">\u767B\u51FA</button>
                  </div>
                </li>
              ` : `
                <li><a href="/login" class="button button-primary">\u767B\u5165</a></li>
              `}
            </ul>
            <button id="mobile-menu-button" class="mobile-menu-toggle">\u2630</button> 
          </nav>
        </header>

        <main class="container">
          ${content || "<p>\u9801\u9762\u5167\u5BB9\u8F09\u5165\u4E2D...</p>"} 
        </main>

        <footer class="footer">
          <div class="container">
            <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} HOPE PENGHU. All rights reserved.</p>
          </div>
        </footer>

        <script nonce="${nonce}">
          // User Dropdown Menu Logic
          const avatarContainer = document.getElementById('avatar-container'); 
          const dropdownMenu = document.getElementById('user-dropdown-menu');

          if (avatarContainer && dropdownMenu) {
            avatarContainer.addEventListener('click', (event) => {
              event.stopPropagation(); 
              dropdownMenu.classList.toggle('dropdown-active');
            });
            avatarContainer.addEventListener('keydown', (event) => {
               if (event.key === 'Enter' || event.key === ' ') {
                 event.preventDefault();
                 dropdownMenu.classList.toggle('dropdown-active');
               }
            });
            document.addEventListener('click', (event) => {
              if (!dropdownMenu.contains(event.target) && !avatarContainer.contains(event.target)) {
                dropdownMenu.classList.remove('dropdown-active');
              }
            });
            document.addEventListener('keydown', (event) => {
               if (event.key === 'Escape' && dropdownMenu.classList.contains('dropdown-active')) {
                 dropdownMenu.classList.remove('dropdown-active');
                 avatarContainer.focus(); 
               }
            });
          }

          // Event listener for logout button 
          const logoutButton = document.getElementById('logout-button');
          if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
              if (dropdownMenu) dropdownMenu.classList.remove('dropdown-active'); 
              
              try {
                const response = await fetch('/api/auth/logout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                  window.location.href = '/';
                } else {
                  console.error('Logout failed:', await response.text());
                  alert('\u767B\u51FA\u5931\u6557\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66\u3002'); 
                }
              } catch (error) {
                console.error('Error logging out:', error);
                alert('\u767B\u51FA\u6642\u767C\u751F\u932F\u8AA4\u3002'); 
              }
            });
          }

          // Event listener for mobile menu 
          const mobileMenuButton = document.getElementById('mobile-menu-button');
          const navMenu = document.querySelector('.nav-menu');
          if (mobileMenuButton && navMenu) {
            mobileMenuButton.addEventListener('click', () => {
              navMenu.classList.toggle('active'); 
            });
          }
          
        <\/script>
      </body>
      </html>
    `;
    console.log("pageTemplate finished successfully for title:", title);
    return html;
  } catch (e) {
    console.error("Error during pageTemplate HTML generation:", e);
    return `<html><body>Template Error for ${title}: ${e.message}</body></html>`;
  }
}

// src/pages/Home.js
async function renderHomePage(request, env, session, user, nonce) {
  let featuredPlaces = [];
  try {
    const result = await env.DB.prepare(
      "SELECT id, name, description, address, category, rating, price_level, image_url FROM places WHERE rating >= 4.0 ORDER BY rating DESC LIMIT 6"
    ).all();
    featuredPlaces = (result == null ? void 0 : result.results) || [];
  } catch (error) {
    console.error("Error fetching featured places:", error);
  }
  let upcomingEvents = [];
  try {
    const result = await env.DB.prepare(
      "SELECT id, title, description, start_date, end_date, location, image_url FROM events WHERE start_date > ? ORDER BY start_date ASC LIMIT 3"
    ).bind(Math.floor(Date.now() / 1e3)).all();
    upcomingEvents = (result == null ? void 0 : result.results) || [];
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
  }
  const content = `
    <style nonce="${nonce}">
      :root { --hero-bg-image: url('/images/hero.jpg'); }
    </style>
    <div 
      class="hero home-hero" 
    >
      <div class="hero-content home-hero-content">
        <h1 class="home-hero-title">\u63A2\u7D22\u6F8E\u6E56\u7684\u7F8E\u597D</h1>
        <p class="home-hero-subtitle">\u767C\u73FE\u6700\u68D2\u7684\u666F\u9EDE\u3001\u7F8E\u98DF\u8207\u6D3B\u52D5</p>
        <div class="home-search-box">
          <input type="text" id="home-search" name="q" placeholder="\u641C\u5C0B\u5730\u9EDE\u3001\u6D3B\u52D5..." class="input">
          <button class="button btn-primary">\u641C\u5C0B</button>
        </div>
      </div>
    </div>

    <div class="featured-section section">
      <div class="section-header">
        <h2 class="section-title">\u7CBE\u9078\u666F\u9EDE</h2>
        <a href="/explore" class="button btn-outline">\u67E5\u770B\u66F4\u591A</a>
      </div>
      <div class="places-grid">
        ${featuredPlaces.length > 0 ? featuredPlaces.map((place) => `
          <div class="place-card card">
            <div class="place-image">
              <img src="${place.image_url || "/images/placeholder.jpg"}" alt="${place.name || "\u5730\u9EDE"}" class="place-image-img">
              <button class="favorite-button">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-accent">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>
            <div class="place-info">
              <span class="place-category inline-block px-2 py-1 bg-primary-sky text-primary-ocean rounded-full text-xs mb-2">${place.category || "\u985E\u5225"}</span>
              <h3 class="place-name feature-title">${place.name || "\u672A\u547D\u540D\u5730\u9EDE"}</h3>
              <p class="place-address text-sm text-text-secondary mb-2">${place.address || "\u5730\u5740\u672A\u63D0\u4F9B"}</p>
              <div class="place-meta flex justify-between items-center text-sm mt-auto pt-2 border-t border-border">
                <span class="place-rating text-yellow-500 font-medium">\u2B50 ${place.rating || "N/A"}</span>
                <span class="place-price text-green-600 font-medium">${"$".repeat(place.price_level || 0) || '<span class="text-gray-400">\u514D\u8CBB</span>'}</span>
              </div>
            </div>
          </div>
        `).join("") : '<p class="text-center text-text-secondary py-8">\u76EE\u524D\u6C92\u6709\u7CBE\u9078\u5730\u9EDE\u3002</p>'}
      </div>
    </div>

    <div class="events-section section bg-background-light">
      <div class="section-header">
        <h2 class="section-title">\u5373\u5C07\u8209\u884C\u7684\u6D3B\u52D5</h2>
        <a href="/events" class="button btn-outline">\u67E5\u770B\u66F4\u591A</a>
      </div>
      <div class="events-grid">
        ${upcomingEvents.length > 0 ? upcomingEvents.map((event) => `
          <div class="event-card card">
            <div class="event-image">
              <img src="${event.image_url || "/images/placeholder.jpg"}" alt="${event.title || "\u6D3B\u52D5"}" class="place-image-img">
            </div>
            <div class="event-info">
              <h3 class="event-title feature-title">${event.title || "\u672A\u547D\u540D\u6D3B\u52D5"}</h3>
              <p class="event-description text-sm text-text-secondary mb-auto pb-2">${event.description || "\u63CF\u8FF0\u672A\u63D0\u4F9B"}</p>
              <div class="event-meta flex justify-between items-center text-sm mt-auto pt-2 border-t border-border">
                <span class="event-date">
                  ${event.start_date ? new Date(event.start_date * 1e3).toLocaleDateString("zh-TW") : "\u65E5\u671F\u672A\u5B9A"}
                </span>
                <span class="event-location text-text-secondary">${event.location || "\u5730\u9EDE\u672A\u5B9A"}</span>
              </div>
            </div>
          </div>
        `).join("") : '<p class="text-center text-text-secondary py-8">\u76EE\u524D\u6C92\u6709\u5373\u5C07\u8209\u884C\u7684\u6D3B\u52D5\u3002</p>'}
      </div>
    </div>
  `;
  return new Response(
    pageTemplate({
      title: "HOPE PENGHU - \u9996\u9801",
      content,
      user,
      nonce
    }),
    {
      headers: {
        "Content-Type": "text/html;charset=utf-8"
      }
    }
  );
}

// src/pages/explore.js
async function renderExplorePage(request, env, session, user, nonce) {
  console.log("Rendering Explore Page...", { haveDB: !!env.DB });
  let places = [];
  let error = null;
  try {
    if (!env.DB) {
      throw new Error("Database binding not found.");
    }
    console.log("Querying places (including price_level)...");
    const result = await env.DB.prepare(
      "SELECT id, name, description, address, category, rating, price_level, image_url FROM places"
      // Ensure image_url is fetched if needed
    ).all();
    console.log("Places query result:", JSON.stringify(result));
    if (result && Array.isArray(result.results)) {
      places = result.results;
      console.log(`Found ${places.length} places.`);
    } else {
      console.warn("Places query returned no results or unexpected structure:", result);
      places = [];
    }
  } catch (e) {
    console.error("Error fetching places in renderExplorePage:", e);
    error = "\u7121\u6CD5\u52A0\u8F09\u5730\u9EDE\u8CC7\u8A0A\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66\u3002";
  }
  console.log("Generating content for Explore Page...");
  const content = `
    <div class="explore-container section">
      <div class="explore-header">
        <h1 class="section-title">\u63A2\u7D22\u6F8E\u6E56</h1>
        <div class="explore-filters">
          <div class="category-labels">
            <button class="category-label active">\u5168\u90E8</button>
            <button class="category-label">\u666F\u9EDE</button>
            <button class="category-label">\u7F8E\u98DF</button>
            <button class="category-label">\u4F4F\u5BBF</button>
            <button class="category-label">\u6D3B\u52D5</button>
          </div>
          <div class="explore-search-box">
            <input type="text" id="explore-search" name="q" placeholder="\u641C\u5C0B\u5730\u9EDE..." class="input">
          </div>
        </div>
      </div>
      
      ${error ? `<div class="error-message">${error}</div>` : ""}

      <div class="places-grid">
        ${places && places.length > 0 ? places.map((place) => {
    const placeName = (place == null ? void 0 : place.name) || "\u672A\u547D\u540D\u5730\u9EDE";
    const placeImage = (place == null ? void 0 : place.image_url) || "https://via.placeholder.com/300x200.png?text=Image+Not+Available";
    const placeCategory = (place == null ? void 0 : place.category) || "\u985E\u5225";
    const placeAddress = (place == null ? void 0 : place.address) || "\u5730\u5740\u672A\u63D0\u4F9B";
    const placeRating = (place == null ? void 0 : place.rating) || "N/A";
    const placePriceLevel = (place == null ? void 0 : place.price_level) || 0;
    return `
            <div class="place-card card">
              <div class="place-image">
                <img src="${placeImage}" alt="${placeName}" class="place-image-img">
                <button class="favorite-button" title="Add to favorites">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-accent">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
              </div>
              <div class="place-info">
                <span class="place-category inline-block px-2 py-1 bg-primary-sky text-primary-ocean rounded-full text-xs mb-2">${placeCategory}</span>
                <h3 class="place-name feature-title">${placeName}</h3>
                <p class="place-address text-sm text-text-secondary mb-2">${placeAddress}</p>
                <div class="place-meta flex justify-between items-center text-sm mt-auto pt-2 border-t border-border">
                  <span class="place-rating text-yellow-500 font-medium">\u2B50 ${placeRating}</span>
                  <span class="place-price text-green-600 font-medium">${"$".repeat(placePriceLevel) || '<span class="text-gray-400">\u514D\u8CBB</span>'}</span>
                </div>
              </div>
            </div>
          `;
  }).join("") : '<p class="text-center text-text-secondary py-8">\u76EE\u524D\u6C92\u6709\u5730\u9EDE\u53EF\u986F\u793A\u3002</p>'}
      </div>
    </div>
  `;
  const status = error ? 500 : 200;
  console.log(`Calling pageTemplate for Explore with status: ${status}`);
  try {
    const templateResult = pageTemplate({
      title: "\u63A2\u7D22\u6F8E\u6E56",
      content,
      user,
      nonce
    });
    console.log("pageTemplate finished successfully for Explore.");
    return new Response(templateResult, {
      status,
      headers: { "Content-Type": "text/html;charset=utf-8" }
    });
  } catch (e) {
    console.error("Error calling pageTemplate from renderExplorePage:", e);
    return new Response(`<html><body>Explore Page Template Error: ${e.message}</body></html>`, {
      status: 500,
      headers: { "Content-Type": "text/html;charset=utf-8" }
    });
  }
}

// src/pages/profile.js
async function renderProfilePage(request, env, session, user, nonce) {
  if (!user) {
    return Response.redirect("/login", 302);
  }
  const content = `
    <div class="profile-container">
      <div class="profile-box">
        <h1>\u500B\u4EBA\u8CC7\u6599</h1>
        <div class="profile-info">
          <p><strong>\u96FB\u5B50\u90F5\u4EF6\uFF1A</strong>${user.email}</p>
          <p><strong>\u540D\u7A31\uFF1A</strong>${user.name || "\u672A\u8A2D\u5B9A"}</p>
          <p><strong>\u8A3B\u518A\u6642\u9593\uFF1A</strong>${new Date(user.created_at).toLocaleDateString("zh-TW")}</p>
        </div>
      </div>
    </div>

    <style nonce="${nonce}">
      .profile-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 4rem);
        padding: 2rem;
      }

      .profile-box {
        background-color: var(--background-color);
        border-radius: 0.5rem;
        padding: 2rem;
        box-shadow: 0 2px 4px var(--shadow-color);
        width: 100%;
        max-width: 600px;
      }

      .profile-box h1 {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 2rem;
        text-align: center;
      }

      .profile-info {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .profile-info p {
        font-size: 1.1rem;
      }

      @media (max-width: 768px) {
        .profile-container {
          padding: 1rem;
        }

        .profile-box {
          padding: 1.5rem;
        }
      }
    </style>
  `;
  return new Response(
    pageTemplate({
      title: "\u500B\u4EBA\u8CC7\u6599",
      content,
      user,
      nonce
    }),
    {
      headers: {
        "Content-Type": "text/html;charset=utf-8"
      }
    }
  );
}

// src/pages/Login.js
function renderLoginPage(request, env, session, user, nonce) {
  const content = `
    <div class="container">
      <div class="login-container">
        <h1 class="login-title">\u767B\u5165</h1>
        <button id="google-login-button" class="google-login-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="google-icon">
          \u4F7F\u7528 Google \u5E33\u865F\u767B\u5165
        </button>
        <p class="register-text">\u9084\u6C92\u6709\u5E33\u865F\uFF1F<a href="/register" class="register-link">\u8A3B\u518A\u65B0\u5E33\u865F</a></p>
      </div>
    </div>

    <script nonce="${nonce}">
      async function handleGoogleLogin() {
        console.log('handleGoogleLogin called');
        try {
          const response = await fetch('/api/auth/google/init', { 
            method: 'GET' 
          });
          console.log('Google init response status:', response.status);
          
          if (!response.ok) {
             const errorText = await response.text();
            console.error('Google init failed:', errorText);
            throw new Error('Failed to initialize Google login: ' + response.statusText);
          }
          
          const { url } = await response.json();
          console.log('Redirecting to Google auth URL:', url);
          window.location.href = url;
        } catch (error) {
          console.error('Google login error:', error);
          alert('Google \u767B\u5165\u521D\u59CB\u5316\u5931\u6557\uFF0C\u8ACB\u7A0D\u5F8C\u518D\u8A66\u3002');
        }
      }

      document.addEventListener('DOMContentLoaded', () => {
        const googleButton = document.getElementById('google-login-button');
        if (googleButton) {
          console.log('Adding event listener to Google button');
          googleButton.addEventListener('click', handleGoogleLogin);
        } else {
          console.error('Google login button not found');
        }
      });
    <\/script>
  `;
  const html = pageTemplate({
    title: "\u767B\u5165",
    content,
    user,
    nonce
  });
  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8"
    }
  });
}

// src/styles/adminStyles.js
function getAdminStyles() {
  return `
    .admin-container {
      display: grid;
      grid-template-columns: 250px 1fr;
      min-height: 100vh;
    }

    .admin-sidebar {
      background-color: var(--background-color);
      border-right: 1px solid var(--border-color);
      padding: 1rem;
    }

    .admin-content {
      padding: 2rem;
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .admin-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--text-color);
    }

    .admin-menu {
      list-style: none;
      margin-top: 2rem;
    }

    .admin-menu-item {
      margin-bottom: 0.5rem;
    }

    .admin-menu-link {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      color: var(--text-color);
      text-decoration: none;
      border-radius: 0.25rem;
      transition: background-color 0.3s ease;
    }

    .admin-menu-link:hover {
      background-color: var(--primary-light);
      color: white;
    }

    .admin-menu-link.active {
      background-color: var(--primary-color);
      color: white;
    }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    .admin-table th,
    .admin-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .admin-table th {
      font-weight: 600;
      background-color: var(--background-color);
    }

    .admin-form {
      max-width: 600px;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 0.25rem;
      background-color: var(--background-color);
      color: var(--text-color);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .admin-actions {
      display: flex;
      gap: 0.5rem;
    }

    .admin-button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.25rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .admin-button-primary {
      background-color: var(--primary-color);
      color: white;
    }

    .admin-button-danger {
      background-color: var(--accent-color);
      color: white;
    }

    @media (max-width: 768px) {
      .admin-container {
        grid-template-columns: 1fr;
      }

      .admin-sidebar {
        display: none;
      }

      .admin-sidebar.active {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
      }
    }
  `;
}

// src/components/adminLayout.js
function adminPageTemplate({ title, content, user, nonce }) {
  const adminStyles = getAdminStyles();
  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - HOPE PENGHU Admin</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
      <style nonce="${nonce}">
        ${adminStyles}
      </style>
    </head>
    <body>
      <div class="admin-container">
        <aside class="admin-sidebar">
          <div class="admin-header">
            <h1 class="admin-title">\u7BA1\u7406\u5F8C\u53F0</h1>
          </div>
          <ul class="admin-menu">
            <li class="admin-menu-item">
              <a href="/admin/dashboard" class="admin-menu-link">\u5100\u8868\u677F</a>
            </li>
            <li class="admin-menu-item">
              <a href="/admin/users" class="admin-menu-link">\u7528\u6236\u7BA1\u7406</a>
            </li>
            <li class="admin-menu-item">
              <a href="/admin/places" class="admin-menu-link">\u666F\u9EDE\u7BA1\u7406</a>
            </li>
            <li class="admin-menu-item">
              <a href="/admin/events" class="admin-menu-link">\u6D3B\u52D5\u7BA1\u7406</a>
            </li>
            <li class="admin-menu-item">
              <a href="/admin/offers" class="admin-menu-link">\u512A\u60E0\u7BA1\u7406</a>
            </li>
            <li class="admin-menu-item">
              <button onclick="logout()" class="admin-button admin-button-danger">\u767B\u51FA</button>
            </li>
          </ul>
        </aside>

        <main class="admin-content">
          ${content}
        </main>
      </div>

      <script nonce="${nonce}">
        async function logout() {
          try {
            const response = await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              window.location.href = '/admin/login';
            }
          } catch (error) {
            console.error('Error logging out:', error);
          }
        }
      <\/script>
    </body>
    </html>
  `;
}

// src/utils/nonce.js
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// src/pages/admin.js
async function handleAdminRequest(request, env, session, user) {
  if (!user || !user.isAdmin) {
    return Response.redirect("/login", 302);
  }
  const nonce = generateNonce();
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter((p) => p);
  const page = pathParts[2] || "dashboard";
  let content = "";
  let title = "";
  switch (page) {
    case "dashboard":
      title = "\u5100\u8868\u677F";
      content = `
        <div class="admin-dashboard">
          <h1>\u7BA1\u7406\u5F8C\u53F0</h1>
          <div class="dashboard-stats">
            <div class="stat-card">
              <h3>\u7E3D\u7528\u6236\u6578</h3>
              <p>0</p>
            </div>
            <div class="stat-card">
              <h3>\u7E3D\u666F\u9EDE\u6578</h3>
              <p>0</p>
            </div>
            <div class="stat-card">
              <h3>\u7E3D\u6D3B\u52D5\u6578</h3>
              <p>0</p>
            </div>
          </div>
        </div>
      `;
      break;
    default:
      return renderNotFoundPage(request, env, session, user);
  }
  return new Response(
    adminPageTemplate({
      title,
      content,
      user,
      nonce
    }),
    {
      headers: {
        "Content-Type": "text/html;charset=utf-8"
      }
    }
  );
}

// src/pages/notFound.js
function renderNotFoundPage2(request) {
  const nonce = generateNonce();
  const content = `
    <div class="not-found-container">
      <div class="not-found-content">
        <h1>404</h1>
        <p>\u627E\u4E0D\u5230\u9801\u9762</p>
        <a href="/" class="button button-primary">\u56DE\u5230\u9996\u9801</a>
      </div>
    </div>

    <style nonce="${nonce}">
      .not-found-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 200px);
        text-align: center;
      }

      .not-found-content h1 {
        font-size: 6rem;
        font-weight: bold;
        color: var(--primary-color);
        margin-bottom: 1rem;
      }

      .not-found-content p {
        font-size: 1.5rem;
        margin-bottom: 2rem;
        color: var(--text-color);
      }
    </style>
  `;
  return new Response(
    pageTemplate({
      title: "\u627E\u4E0D\u5230\u9801\u9762",
      content,
      user: null,
      nonce
    }),
    {
      status: 404,
      headers: {
        "Content-Type": "text/html;charset=utf-8"
      }
    }
  );
}

// src/pages/events.js
async function renderEventsPage(request, env, session, user, nonce) {
  const content = `
    <div class="container">
      <h1>\u6D3B\u52D5\u9801\u9762</h1>
      <p>\u6B64\u9801\u9762\u6B63\u5728\u5EFA\u8A2D\u4E2D\u3002</p>
    </div>
  `;
  return new Response(
    pageTemplate({ title: "\u6D3B\u52D5", content, user, nonce }),
    {
      headers: { "Content-Type": "text/html;charset=utf-8" }
    }
  );
}

// src/pages/offers.js
async function renderOffersPage(request, env, session, user, nonce) {
  const content = `
    <div class="container">
      <h1>\u512A\u60E0\u9801\u9762</h1>
      <p>\u6B64\u9801\u9762\u6B63\u5728\u5EFA\u8A2D\u4E2D\u3002</p>
    </div>
  `;
  return new Response(
    pageTemplate({ title: "\u512A\u60E0", content, user, nonce }),
    {
      headers: { "Content-Type": "text/html;charset=utf-8" }
    }
  );
}

// src/routes/index.js
async function routePageRequest(request, env, session, user, nonce) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  try {
    if (pathname === "/" || pathname === "/index.html") {
      return await renderHomePage(request, env, session, user, nonce);
    }
    if (pathname === "/explore") {
      return await renderExplorePage(request, env, session, user, nonce);
    }
    if (pathname.startsWith("/profile")) {
      return await renderProfilePage(request, env, session, user, nonce);
    }
    if (pathname === "/login") {
      if (user) {
        return Response.redirect(url.origin, 302);
      }
      return await renderLoginPage(request, env, session, user, nonce);
    }
    if (pathname.startsWith("/admin")) {
      return await handleAdminRequest(request, env, session, user, nonce);
    }
    if (pathname === "/events") {
      return await renderEventsPage(request, env, session, user, nonce);
    }
    if (pathname === "/offers") {
      return await renderOffersPage(request, env, session, user, nonce);
    }
    return await renderNotFoundPage2(request, env, session, user, nonce);
  } catch (error) {
    console.error("Route Error:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      }
    });
  }
}
async function handleApiRequest(request, env, session, user) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path.startsWith("/api/")) {
    const resource = path.split("/")[2];
    try {
      const { handleUsersRequest: handleUsersRequest2 } = await Promise.resolve().then(() => (init_users(), users_exports));
      const { handleEventsRequest: handleEventsRequest2 } = await Promise.resolve().then(() => (init_events(), events_exports));
      const { handlePlacesRequest: handlePlacesRequest2 } = await Promise.resolve().then(() => (init_places(), places_exports));
      const { handleAuthRequest: handleAuthRequest2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
      const { handleCspReport: handleCspReport2 } = await Promise.resolve().then(() => (init_csp(), csp_exports));
      switch (resource) {
        case "users":
          return await handleUsersRequest2(request, env, session, user);
        case "events":
          if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
          return await handleEventsRequest2(request, env, session, user);
        case "places":
          return await handlePlacesRequest2(request, env, session, user);
        case "auth":
          return await handleAuthRequest2(request, env);
        case "csp-report":
          return await handleCspReport2(request, env);
        default:
          return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      console.error("API Error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  console.warn("Request reached end of handleApiRequest without matching API route:", path);
  return new Response("Not Found", { status: 404 });
}

// src/services/RouterService.js
var RouterService = class {
  constructor(env, securityService, sessionService) {
    this.env = env;
    this.securityService = securityService;
    this.sessionService = sessionService;
    if (!this.env.__STATIC_CONTENT) {
      console.error("ERROR: __STATIC_CONTENT binding not found in env. Ensure [site] is configured in wrangler.toml");
    }
  }
  async handleRequest(request) {
    var _a;
    if (this.env.__STATIC_CONTENT) {
      try {
        const assetResponse = await this.env.__STATIC_CONTENT.fetch(request.clone());
        if (assetResponse.status === 200 || assetResponse.status === 304) {
          console.log(`Serving static asset for: ${request.url}`);
          return assetResponse;
        }
        if (assetResponse.status === 404) {
          console.log(`Static asset not found by __STATIC_CONTENT.fetch: ${request.url}. Returning plain 404.`);
          return new Response("Static asset not found", { status: 404 });
        }
        if (assetResponse.status !== 404) {
          console.warn(`Static asset fetch for ${request.url} returned status ${assetResponse.status}`);
        }
      } catch (error) {
        console.error(`Error during __STATIC_CONTENT.fetch for ${request.url}:`, error);
      }
    } else {
      console.log("Skipping static asset check: __STATIC_CONTENT binding missing.");
    }
    console.log(`Proceeding to dynamic route handling for: ${request.url}`);
    const url = new URL(request.url);
    const pathname = url.pathname;
    const nonce = this.securityService.getNonce();
    const session = await this.sessionService.getSession(request);
    const user = session ? await this.sessionService.getUserFromSession(request) : null;
    console.log("RouterService - Session:", session ? `ID: ${session.id}, UserID: ${session.userId}` : "null");
    console.log("RouterService - User:", user ? `ID: ${user.id}, Email: ${user.email}` : "null");
    if (pathname.startsWith("/api/")) {
      return await handleApiRequest(request, this.env, session, user);
    }
    console.log(`Routing page request for: ${pathname}`);
    const pageResponse = await routePageRequest(request, this.env, session, user, nonce);
    const headers = new Headers(pageResponse.headers);
    if (((_a = pageResponse.headers.get("Content-Type")) == null ? void 0 : _a.includes("html")) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "text/html;charset=utf-8");
    }
    return new Response(pageResponse.body, {
      status: pageResponse.status,
      statusText: pageResponse.statusText,
      headers
    });
  }
};

// src/worker.js
var worker_default = {
  async fetch(request, env, ctx) {
    console.log(`Worker received request: ${request.method} ${request.url}`);
    const securityService = new SecurityService();
    const sessionService = new SessionService(env);
    const routerService = new RouterService(env, securityService, sessionService);
    const url = new URL(request.url);
    const pathname = url.pathname;
    try {
      const response = await routerService.handleRequest(request);
      const isStaticAssetRequest = /\.(css|js|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|svg|json|html?)$/i.test(pathname);
      const headers = new Headers(response.headers);
      const nonce = securityService.getNonce();
      const securityHeaders = securityService.getCSPHeaders(nonce);
      for (const [key, value] of Object.entries(securityHeaders)) {
        headers.set(key, value);
      }
      if (!isStaticAssetRequest && !headers.has("Content-Type")) {
        console.warn(`src/worker.js: Applying fallback Content-Type 'text/html' for potential dynamic page: ${pathname}`);
        headers.set("Content-Type", "text/html;charset=utf-8");
      } else if (headers.has("Content-Type")) {
        console.log(`src/worker.js: Content-Type already set by handler: ${headers.get("Content-Type")} for ${pathname}`);
      } else {
        console.log(`src/worker.js: No Content-Type set and it's likely a static asset, trusting original (missing?) header for ${pathname}`);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
        // Use the modified headers object
      });
    } catch (error) {
      console.error("Fetch Error in Worker:", error);
      return new Response(JSON.stringify({
        error: "Internal Server Error",
        message: error.message
        // Be cautious about exposing error details
        // stack: error.stack // Avoid sending stack trace in production
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json;charset=UTF-8"
        }
      });
    }
  }
};
export {
  worker_default as default
};
