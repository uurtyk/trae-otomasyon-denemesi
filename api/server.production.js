import app from '../dist/api/app.js';
import connectDB from '../dist/api/config/database.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Production server ready on port ${PORT}`);
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start production server:', error);
    process.exit(1);
  }
};

const server = await startServer();

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM signal received - shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal received - shutting down gracefully');
  server.close(() => process.exit(0));
});

export default app;
