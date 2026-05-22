import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(env.port, () => {
  console.log(`Backend listo en el puerto ${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal: string) {
  console.log(`${signal} recibido. Cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
