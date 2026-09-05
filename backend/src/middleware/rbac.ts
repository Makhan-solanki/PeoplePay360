import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, AuthError } from '../lib/errors';

/**
 * RBAC middleware — restricts access based on user role.
 * Must be used after authenticate middleware.
 *
 * @param allowedRoles - Array of roles permitted to access the route
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize(['ADMIN']), controller);
 *   router.get('/shared', authenticate, authorize(['ADMIN', 'USER']), controller);
 */
export function authorize(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError(`Role '${req.user.role}' is not authorized for this resource`));
      return;
    }

    next();
  };
}
