import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

async function startServer() {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`[PeoplePay360] Server running on ${config.appUrl} (Port ${config.port})`);
    });
  } catch (error) {
    console.error('[PeoplePay360] Server failed to start:', error);
    process.exit(1);
  }
}

startServer();
