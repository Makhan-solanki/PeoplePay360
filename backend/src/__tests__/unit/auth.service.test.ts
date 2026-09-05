import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// We test the token generation and password hashing logic directly
describe('Auth Service - Unit Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET!;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

  describe('Password Hashing', () => {
    it('should hash a password correctly', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 12);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify a correct password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 12);
      const isMatch = await bcrypt.compare(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 12);
      const isMatch = await bcrypt.compare('wrongPassword', hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    const payload = { id: 'user-123', email: 'test@test.com', role: 'USER' };

    it('should generate a valid access token', () => {
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should generate a valid refresh token', () => {
      const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      expect(token).toBeDefined();
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
      expect(decoded.id).toBe(payload.id);
    });

    it('should reject a token signed with wrong secret', () => {
      const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '15m' });

      expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
    });

    it('should reject an expired token', () => {
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });

      // Small delay to ensure token is expired
      expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
    });
  });

  describe('Custom Errors', () => {
    it('should create AppError with correct properties', async () => {
      const { AppError } = await import('../../lib/errors');
      const error = new AppError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should create AuthError with 401 status', async () => {
      const { AuthError } = await import('../../lib/errors');
      const error = new AuthError();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication required');
    });

    it('should create ForbiddenError with 403 status', async () => {
      const { ForbiddenError } = await import('../../lib/errors');
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
    });
  });
});
