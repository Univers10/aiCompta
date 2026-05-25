import 'express-async-errors';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/env';
import routes from './routes';
import { generalLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/error';
import { logger } from './lib/logger';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  // CORS: allow dev origins including browser preview proxies
  const allowedOrigins = [
    env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    /http:\/\/127\.0\.0\.1:\d+/, // Allow any 127.0.0.1 port (browser preview)
  ].filter(Boolean);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }),
  );
  // SSE / streaming : on désactive la compression pour /api/v1/chat
  app.use(
    compression({
      filter: (req, res) => {
        if (req.path.startsWith('/api/v1/chat')) return false;
        return compression.filter(req, res);
      },
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const id = (req.headers['x-request-id'] as string) || uuidv4();
    res.setHeader('x-request-id', id);
    (req as Request & { id: string }).id = id;
    next();
  });

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'aicompta-api', uptime: process.uptime() });
  });

  app.use('/api/v1', generalLimiter, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info({ env: env.NODE_ENV }, 'App Express initialisée');
  return app;
}
