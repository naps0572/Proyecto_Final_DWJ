import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import router from './routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.disable('x-powered-by');

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

const allowedOrigins = new Set(
  env.isProduction
    ? env.corsOrigins
    : [...env.corsOrigins, 'http://localhost:5173', 'http://127.0.0.1:5173']
);

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(
  cors({
    credentials: false,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origen no permitido por CORS'));
    }
  })
);
app.use(express.json({ limit: env.jsonBodyLimit }));

app.use('/api', router);

app.use((_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use(errorHandler);

export default app;
