import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { sendSuccess, sendError } from '../../lib/apiResponse';

/**
 * GET /api/health — Liveness check
 * Returns 200 if the server is running.
 */
export async function health(_req: Request, res: Response) {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

/**
 * GET /api/ready — Readiness check
 * Returns 200 only if all dependencies (DB) are connected.
 */
export async function ready(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    sendError(res, 'Database connection failed', 503);
  }
}
