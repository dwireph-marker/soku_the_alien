import express from 'express';
import path from 'path';
import { handleAdminLogin, authenticateAdmin } from './auth';
import { handleImageKitAuth } from './imagekit';
import {
  uploadAudioMiddleware,
  handleAudioUpload,
  handleGetAudioTracks,
  handleDeleteAudioTrack,
  uploadMediaMiddleware,
  handleMediaUpload,
} from './upload';
import { handleGetBirthdaySettings, handleUpdateBirthdaySettings } from './birthday';
import {
  securityHeadersMiddleware,
  corsMiddleware,
  loginRateLimiter,
  uploadRateLimiter,
  apiRateLimiter,
} from './middleware/security';

export function createExpressApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);

  // Global Security Headers & CORS
  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);

  // JSON & URL-Encoded body parsers with bounded limit
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  // Static file serving for uploads directory with hardened headers
  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'data', 'uploads'), {
      dotfiles: 'ignore',
      index: false,
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=86400');
      },
    })
  );

  const apiRouter = express.Router();

  // Health check
  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Global API Rate Limiter
  apiRouter.use(apiRateLimiter);

  // Admin Auth Route (Protected with login rate limiter)
  apiRouter.post('/admin/login', loginRateLimiter, handleAdminLogin);

  // ImageKit Upload Auth Endpoint (Protected: Admin authentication required)
  apiRouter.get('/upload/imagekit-auth', authenticateAdmin, handleImageKitAuth);

  // Audio Upload & Management Endpoints
  apiRouter.post(
    '/upload/audio',
    authenticateAdmin,
    uploadRateLimiter,
    uploadAudioMiddleware.single('audio'),
    handleAudioUpload
  );
  apiRouter.get('/audio/tracks', handleGetAudioTracks);
  apiRouter.delete('/audio/tracks/:id', authenticateAdmin, handleDeleteAudioTrack);

  // Media (Photos and Videos) Upload Endpoints (Protected: Admin authentication required)
  apiRouter.post(
    '/upload/media',
    authenticateAdmin,
    uploadRateLimiter,
    uploadMediaMiddleware.array('files', 20),
    handleMediaUpload
  );
  apiRouter.post(
    '/upload/video',
    authenticateAdmin,
    uploadRateLimiter,
    uploadMediaMiddleware.single('video'),
    handleMediaUpload
  );
  apiRouter.post(
    '/upload/image',
    authenticateAdmin,
    uploadRateLimiter,
    uploadMediaMiddleware.single('image'),
    handleMediaUpload
  );

  // Birthday Date, Time & Recurring Annual Countdown Settings
  apiRouter.get('/birthday/settings', handleGetBirthdaySettings);
  apiRouter.put('/birthday/settings', authenticateAdmin, handleUpdateBirthdaySettings);

  // Mount API router at /api
  app.use('/api', apiRouter);

  // Mount API router at root / (for environments or serverless gateways that forward path without /api prefix)
  app.use(apiRouter);

  // Catch-all handler for unhandled /api requests to return JSON instead of HTML
  app.use('/api/*', (req: express.Request, res: express.Response) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}` });
  });

  // Global API Error Handler (ensures JSON responses for /api routes)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error handler:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}
