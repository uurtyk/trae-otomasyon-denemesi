/**
 * Production server entry file for Render deployment
 */

import app from '../dist/api/app.js';
import connectDB from '../dist/api/config/database.js';
import dotenv from 'dotenv';

// Load production environment variables
dotenv.config({ path: '.env.production' });

/**
 * Connect to MongoDB and start server for production
 */
const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
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

/**
 * Graceful shutdown handling
 */
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
