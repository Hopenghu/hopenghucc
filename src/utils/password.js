// Removed Node.js crypto and util imports

// --- Configuration --- 
const HASH_ALGORITHM = 'PBKDF2';
const HASH_FUNCTION = 'SHA-256'; // Can be SHA-1, SHA-256, SHA-384, SHA-512
const ITERATIONS = 100000; // Adjust as needed, higher is more secure but slower
const SALT_LENGTH_BYTES = 16;
const KEY_LENGTH_BITS = 256; // Should match the output size of HASH_FUNCTION (SHA-256 -> 256 bits)
const STORED_HASH_FORMAT = `pbkdf2-${HASH_FUNCTION.toLowerCase()}`;

// Helper function to convert ArrayBuffer to hex string
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper function to convert hex string to ArrayBuffer
function hexToBuffer(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes.buffer;
}

/**
 * Securely hashes a password using PBKDF2 with Web Crypto API.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} A string containing algorithm, iterations, salt, and hash, suitable for storage.
 */
export async function hashPassword(password) {
  try {
    // 1. Generate Salt
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));

    // 2. Import password as a base key for PBKDF2
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password), // Convert password string to ArrayBuffer
      { name: HASH_ALGORITHM }, 
      false, // not extractable
      ['deriveBits'] // usage
    );

    // 3. Derive the hash using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: HASH_ALGORITHM,
        salt: salt,
        iterations: ITERATIONS,
        hash: HASH_FUNCTION, 
      },
      passwordKey,
      KEY_LENGTH_BITS // Key length in bits
    );

    // 4. Format for storage: algo$iterations$salt$hash
    const saltHex = bufferToHex(salt);
    const hashHex = bufferToHex(derivedBits);
    
    return `${STORED_HASH_FORMAT}$${ITERATIONS}$${saltHex}$${hashHex}`;

  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Could not hash password.');
  }
}

/**
 * Verifies a password against a stored hash string using PBKDF2.
 * Uses a constant-time comparison to prevent timing attacks.
 * @param {string} password - The password attempt.
 * @param {string} storedHashString - The hash string from the database (e.g., "pbkdf2-sha256$100000$salt$hash").
 * @returns {Promise<boolean>} True if the password matches the hash, false otherwise.
 */
export async function verifyPassword(password, storedHashString) {
  try {
    // 1. Parse the stored hash string
    const parts = storedHashString.split('$');
    if (parts.length !== 4) {
      console.error('Invalid stored hash format.');
      return false; // Invalid format
    }
    const [format, iterationsStr, saltHex, storedHashHex] = parts;
    
    // Basic format check (can be more specific)
    if (!format.startsWith('pbkdf2-')) { 
        console.error('Unsupported hash format.');
        return false;
    }

    const iterations = parseInt(iterationsStr, 10);
    const salt = hexToBuffer(saltHex);
    const storedHashBuffer = hexToBuffer(storedHashHex);

    // TODO: Add more robust validation for iterations, salt length, hash length based on format

    // 2. Re-derive the hash using the same parameters
     const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: HASH_ALGORITHM }, 
      false, 
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: HASH_ALGORITHM,
        salt: salt,
        iterations: iterations, 
        // Ensure HASH_FUNCTION matches the one indicated by the format string if needed
        hash: HASH_FUNCTION, 
      },
      passwordKey,
      KEY_LENGTH_BITS
    );

    // 3. Constant-time comparison
    // subtle.timingSafeEqual is not available in Workers. Implement manually.
    // Note: This basic implementation might be vulnerable if compiler optimizes heavily.
    // A more robust library function would be preferable if available for Workers.
    if (derivedBits.byteLength !== storedHashBuffer.byteLength) {
      return false; // Hashes of different lengths cannot match
    }
    
    const derivedArray = new Uint8Array(derivedBits);
    const storedArray = new Uint8Array(storedHashBuffer);
    let diff = 0;
    for (let i = 0; i < derivedArray.length; i++) {
      diff |= derivedArray[i] ^ storedArray[i]; // XOR bytes, accumulate differences
    }

    return diff === 0;

  } catch (error) {
    console.error('Error verifying password:', error);
    // In case of error (e.g., invalid format), treat as non-match for security
    return false;
  }
} 