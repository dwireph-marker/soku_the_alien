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

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Global API Rate Limiter
  app.use('/api', apiRateLimiter);

  // Admin Auth Route (Protected with login rate limiter)
  app.post('/api/admin/login', loginRateLimiter, handleAdminLogin);

  // ImageKit Upload Auth Endpoint (Protected: Admin authentication required)
  app.get('/api/upload/imagekit-auth', authenticateAdmin, handleImageKitAuth);

  // Audio Upload & Management Endpoints
  app.post(
    '/api/upload/audio',
    authenticateAdmin,
    uploadRateLimiter,
    uploadAudioMiddleware.single('audio'),
    handleAudioUpload
  );
  app.get('/api/audio/tracks', handleGetAudioTracks);
  app.delete('/api/audio/tracks/:id', authenticateAdmin, handleDeleteAudioTrack);

  // Media (Photos and Videos) Upload Endpoints (Protected: Admin authentication required)
  app.post(
    '/api/upload/media',
    authenticateAdmin,
    uploadRateLimiter,
    uploadMediaMiddleware.array('files', 20),
    handleMediaUpload
  );
  app.post(
    '/api/upload/video',
    authenticateAdmin,
    uploadRateLimiter,
    uploadMediaMiddleware.single('video'),
    handleMediaUpload
  );
  app.post(
    '/api/upload/image',
    authenticateAdmin,
    uploadRateLimiter,
    uploadMediaMiddleware.single('image'),
    handleMediaUpload
  );

  // Birthday Date, Time & Recurring Annual Countdown Settings
  app.get('/api/birthday/settings', handleGetBirthdaySettings);
  app.put('/api/birthday/settings', authenticateAdmin, handleUpdateBirthdaySettings);

  // Catch-all handler for unhandled /api requests to return JSON instead of HTML
  app.use('/api/*', (req: express.Request, res: express.Response) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  // Global API Error Handler (ensures JSON responses for /api routes)
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error handler:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}
