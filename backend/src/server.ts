import { env } from './config/env'; // must be first — loads dotenv and validates env vars
import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';

// ─── Graceful shutdown ────────────────────────────────────────────────────────

let server: Server | undefined;
let isShuttingDown = false;

function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received — shutting down gracefully`);

  const fallback = setTimeout(() => {
    console.error('Shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
  fallback.unref();

  const closeServer = server
    ? new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) return reject(err);
          console.log('HTTP server closed');
          resolve();
        });
      })
    : Promise.resolve();

  closeServer
    .then(() => mongoose.connection.close())
    .then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error during shutdown:', err);
      process.exit(1);
    });
}

// ─── Process-level safety nets ────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ─── Bootstrap ────────────────────────────────────────────────────────────────

mongoose.connect(env.MONGO_URI)
  .then(() => {
    server = app.listen(env.PORT, () => {
      console.log(`Backend server running on http://localhost:${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
