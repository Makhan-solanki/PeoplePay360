import { Router } from 'express';
import { register, login, refresh, logout, me } from './auth.controller';
import { validate, authenticate, authRateLimiter } from '../../middleware';
import { registerSchema, loginSchema } from './auth.schema';

const router = Router();

// Public routes (rate limited)
router.post('/register', authRateLimiter, validate({ body: registerSchema }), register);
router.post('/login', authRateLimiter, validate({ body: loginSchema }), login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
