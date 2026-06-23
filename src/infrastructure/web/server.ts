import path from 'path';
import express, { Application, Request, Response } from 'express';
import { createRouter, UseCases } from './routes';

// Resolves to the project-root /public folder both under ts-node
// (src/infrastructure/web) and after compiling (dist/infrastructure/web).
const PUBLIC_DIR = path.resolve(__dirname, '../../../public');

/** Builds the Express application from the wired use cases. */
export function createServer(useCases: UseCases): Application {
  const app = express();
  app.use(express.json());

  // Quiet Chrome DevTools' automatic workspace probe (avoids a noisy 404).
  app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req: Request, res: Response) =>
    res.status(204).end(),
  );

  app.use('/api', createRouter(useCases));

  // Serve the playable front end (index.html at GET /).
  app.use(express.static(PUBLIC_DIR));

  return app;
}
