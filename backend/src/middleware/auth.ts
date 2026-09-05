import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthError } from '../lib/errors';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * JWT authentication middleware.
 * Extracts token from Authorization header or cookies.
 * Attaches decoded user to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AuthError('No authentication token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      next(error);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthError('Invalid or expired token'));
      return;
    }
    next(error);
  }
}

/**
 * Extracts JWT from Authorization header (Bearer) or httpOnly cookie.
 */
function extractToken(req: Request): string | null {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fall back to cookie
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
}
