/**
 * Production server entry file for Render deployment
 */
import app from './app';
import connectDB from './config/database';
import dotenv from 'dotenv';

// Load production environment variables
dotenv.config({ path: '.env.production' });

const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Production server ready on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL}`);
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
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT signal received - shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
