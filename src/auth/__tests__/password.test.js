import { expect, test, describe } from 'vitest';
import { hashPassword, verifyPassword } from '../password.js';

describe('Password Functions', () => {
  test('hashPassword should create a valid hash', async () => {
    const password = 'testPassword123!';
    const hash = await hashPassword(password);
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  test('verifyPassword should verify correct password', async () => {
    const password = 'testPassword123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  test('verifyPassword should reject incorrect password', async () => {
    const password = 'testPassword123!';
    const wrongPassword = 'wrongPassword123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  test('hashPassword should create different hashes for same password', async () => {
    const password = 'testPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });

  test('verifyPassword should handle invalid hash format', async () => {
    const password = 'testPassword123!';
    const invalidHash = 'invalidhashformat';
    await expect(verifyPassword(password, invalidHash))
      .rejects
      .toThrow();
  });
}); 