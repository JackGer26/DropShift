import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import routes from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

declare module 'express-serve-static-core' {
  interface Request {
    // Add custom properties here if needed
  }
}

const app = express();

// Trust one proxy hop — required for express-rate-limit to read the real client
// IP from X-Forwarded-For when running behind nginx, a load balancer, etc.
// Safe to set in all environments: has no effect when there is no proxy.
app.set('trust proxy', 1);

// ─── Security ─────────────────────────────────────────────────────────────────

app.use(helmet());

app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? env.FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: false,
}));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.NODE_ENV === 'production' ? 100 : 500,
    standardHeaders: true,  // send RateLimit-* response headers
    legacyHeaders: false,   // omit deprecated X-RateLimit-* headers
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
      });
    },
  })
);

// ─── General middleware ───────────────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api', routes);

// Must be registered after all routes — Express identifies error middleware by its 4-parameter signature
app.use(errorHandler);

export default app;
