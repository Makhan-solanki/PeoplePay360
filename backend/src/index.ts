import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import logger from './lib/logger';
import { requestIdMiddleware, errorHandler } from './middleware';

// Route imports
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import uploadRoutes from './modules/upload/upload.routes';
import employeeRoutes from './modules/employee/employee.routes';
import contractRoutes from './modules/contract/contract.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import timeOffRoutes from './modules/timeoff/timeoff.routes';
import payrollRoutes from './modules/payroll/payroll.routes';

const app = express();

// ---- Core Middleware ----
app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({
      requestId: (req as express.Request).requestId,
    }),
    autoLogging: {
      ignore: (req) => req.url === '/api/health' || req.url === '/api/ready',
    },
  })
);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---- Routes ----
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/time-off', timeOffRoutes);
app.use('/api/payroll', payrollRoutes);

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: 'Route not found',
  });
});

// ---- Centralized Error Handler ----
app.use(errorHandler);

// ---- Server Startup ----
let server: any;
if (env.NODE_ENV !== 'test') {
  server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

// ---- Graceful Shutdown ----
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    const { default: prisma } = await import('./lib/prisma');
    await prisma.$disconnect();
    logger.info('Database connection closed');

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception — shutting down');
  process.exit(1);
});

export default app;
