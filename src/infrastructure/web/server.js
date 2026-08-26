import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createRouter } from './routes.js';

// Resolve para a pasta /public na raiz do projeto a partir de src/infrastructure/web.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../../public');

/** Constrói a aplicação Express a partir dos casos de uso conectados. */
export function createServer(useCases) {
  const app = express();
  app.use(express.json());

  // Silencia a sonda automática de workspace do Chrome DevTools (evita um 404 ruidoso).
  app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) =>
    res.status(204).end(),
  );

  app.use('/api', createRouter(useCases));

  // Serve o frontend jogável (index.html em GET /).
  app.use(express.static(PUBLIC_DIR));

  return app;
}
