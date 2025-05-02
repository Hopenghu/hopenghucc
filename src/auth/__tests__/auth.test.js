import { expect, test, describe } from 'vitest';
import { createUser, getUser, updateUser, authenticateUser, deleteUser } from '../user.js';
import { createSession, getSession, deleteSession } from '../session.js';

describe('User Management', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'testPassword123!',
    name: 'Test User'
  };

  test('createUser should create a new user', async () => {
    const user = await createUser(env.DB, testUser.email, testUser.password, testUser.name);
    expect(user).toBeDefined();
    expect(user.email).toBe(testUser.email);
    expect(user.name).toBe(testUser.name);
    expect(user.id).toBeDefined();
  });

  test('createUser should not allow duplicate emails', async () => {
    await expect(createUser(env.DB, testUser.email, testUser.password, testUser.name))
      .rejects
      .toThrow('User already exists');
  });

  test('getUser should retrieve user by ID', async () => {
    const user = await createUser(env.DB, 'get@example.com', 'password123', 'Get User');
    const retrievedUser = await getUser(env.DB, user.id);
    expect(retrievedUser).toBeDefined();
    expect(retrievedUser.id).toBe(user.id);
    expect(retrievedUser.email).toBe('get@example.com');
  });

  test('updateUser should update user information', async () => {
    const user = await createUser(env.DB, 'update@example.com', 'password123', 'Update User');
    const updatedUser = await updateUser(env.DB, user.id, { name: 'Updated Name' });
    expect(updatedUser.name).toBe('Updated Name');
  });

  test('authenticateUser should verify correct credentials', async () => {
    const user = await createUser(env.DB, 'auth@example.com', 'password123', 'Auth User');
    const authenticatedUser = await authenticateUser(env.DB, 'auth@example.com', 'password123');
    expect(authenticatedUser).toBeDefined();
    expect(authenticatedUser.id).toBe(user.id);
  });

  test('authenticateUser should reject incorrect credentials', async () => {
    await createUser(env.DB, 'wrong@example.com', 'password123', 'Wrong User');
    const authenticatedUser = await authenticateUser(env.DB, 'wrong@example.com', 'wrongpassword');
    expect(authenticatedUser).toBeNull();
  });

  test('deleteUser should remove user from database', async () => {
    const user = await createUser(env.DB, 'delete@example.com', 'password123', 'Delete User');
    const deleted = await deleteUser(env.DB, user.id);
    expect(deleted).toBe(true);
    
    const retrievedUser = await getUser(env.DB, user.id);
    expect(retrievedUser).toBeNull();
  });
});

describe('Session Management', () => {
  test('createSession should create a new session', async () => {
    const user = await createUser(env.DB, 'session@example.com', 'password123', 'Session User');
    const session = await createSession(env.DB, user.id);
    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(session.userId).toBe(user.id);
  });

  test('getSession should retrieve valid session', async () => {
    const user = await createUser(env.DB, 'getsession@example.com', 'password123', 'Get Session User');
    const session = await createSession(env.DB, user.id);
    const retrievedSession = await getSession(env.DB, session.id);
    expect(retrievedSession).toBeDefined();
    expect(retrievedSession.id).toBe(session.id);
  });

  test('deleteSession should remove session', async () => {
    const user = await createUser(env.DB, 'deletesession@example.com', 'password123', 'Delete Session User');
    const session = await createSession(env.DB, user.id);
    await deleteSession(env.DB, session.id);
    const retrievedSession = await getSession(env.DB, session.id);
    expect(retrievedSession).toBeNull();
  });
}); 