import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

/**
 * Prisma Client Singleton
 * Ensures only one instance of PrismaClient exists throughout the application
 * Optimized for serverless environments
 */

// Global variable to prevent multiple instances in serverless environments
let prisma;

// Initialize Prisma Client
const initializePrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: config.nodeEnv === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error']
    });

    // Connection event handlers - only for development
    if (config.nodeEnv === 'development') {
      prisma.$connect()
        .then(() => {
          console.log('✅ Database connected successfully');
        })
        .catch((error) => {
          console.error('❌ Database connection failed:', error.message);
          process.exit(1);
        });
    }
  }
  return prisma;
};

// Get or create the Prisma instance
prisma = initializePrisma();

// Graceful shutdown handlers - only for non-serverless environments
if (config.nodeEnv !== 'production') {
  const disconnect = async () => {
    if (prisma) {
      await prisma.$disconnect();
      console.log('🔌 Database disconnected');
    }
  };

  process.on('SIGINT', disconnect);
  process.on('SIGTERM', disconnect);
  process.on('beforeExit', disconnect);
}

export { prisma };
export default prisma;
