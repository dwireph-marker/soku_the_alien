import 'dotenv/config';
import type { Request, Response } from 'express';
import { createExpressApp } from './appFactory';

const app = createExpressApp();

export { app };

export default function handler(req: Request, res: Response) {
  return app(req, res);
}
