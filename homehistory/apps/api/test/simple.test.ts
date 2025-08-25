/**
 * Simple test to verify the testing infrastructure is working
 */

import { prisma, createTestUser, createTestProperty, generateTestToken } from './setup';

describe('Testing Infrastructure', () => {
  it('should connect to test database', async () => {
    expect(prisma).toBeDefined();
    expect(prisma.$connect).toBeDefined();
  });

  it('should create test user', async () => {
    const user = await createTestUser();
    
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.email).toContain('test-');
    expect(user.name).toBe('Test User');
    expect(user.role).toBe('USER');
  });

  it('should generate JWT token', () => {
    const token = generateTestToken('test-user-123');
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('should create multiple users without conflicts', async () => {
    // Create first user
    const user1 = await createTestUser();
    expect(user1).toBeDefined();
    
    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Create second user
    const user2 = await createTestUser();
    expect(user2).toBeDefined();
    
    // They should have different IDs and emails
    expect(user1.id).not.toBe(user2.id);
    expect(user1.email).not.toBe(user2.email);
  });

  it('should create property with user relationship', async () => {
    const user = await createTestUser();
    const property = await createTestProperty(user.id);
    
    expect(property).toBeDefined();
    expect(property.userId).toBe(user.id);
    expect(property.address).toBe('123 Test St');
    expect(property.propertyType).toBe('SINGLE_FAMILY');
  });
});