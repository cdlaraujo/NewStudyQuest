import path from 'path';
import express, { Application, Request, Response } from 'express';
import { createRouter, UseCases } from './routes';

// Resolve para a pasta /public na raiz do projeto tanto sob ts-node
// (src/infrastructure/web) quanto após compilar (dist/infrastructure/web).
const PUBLIC_DIR = path.resolve(__dirname, '../../../public');

/** Constrói a aplicação Express a partir dos casos de uso conectados. */
export function createServer(useCases: UseCases): Application {
  const app = express();
  app.use(express.json());

  // Silencia a sonda automática de workspace do Chrome DevTools (evita um 404 ruidoso).
  app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req: Request, res: Response) =>
    res.status(204).end(),
  );

  app.use('/api', createRouter(useCases));

  // Serve o frontend jogável (index.html em GET /).
  app.use(express.static(PUBLIC_DIR));

  return app;
}
