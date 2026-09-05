import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../../lib/prisma';
import { env } from '../../config/env';
import { AuthError, ConflictError } from '../../lib/errors';
import type { RegisterInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 12;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export class AuthService {
  /**
   * Register a new user with hashed password.
   */
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        role: Role.EMPLOYEE,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  /**
   * Authenticate a user with email/password.
   */
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new AuthError('Invalid email or password');
    }

    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        employee: user.employee,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as UserPayload;

      // Verify refresh token matches what's stored
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new AuthError('Invalid refresh token');
      }

      const tokens = this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('Invalid or expired refresh token');
    }
  }

  /**
   * Logout — invalidate refresh token.
   */
  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  /**
   * Get current user profile.
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    if (!user) {
      throw new AuthError('User not found');
    }

    return user;
  }

  /**
   * Generate access + refresh token pair.
   */
  generateTokens(payload: UserPayload): TokenPair {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Persist refresh token to database for rotation.
   */
  private async saveRefreshToken(userId: string, token: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: token },
    });
  }
}

export const authService = new AuthService();
