import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

/**
 * Prisma Client Singleton
 * Ensures only one instance of PrismaClient exists throughout the application
 */

// Create singleton instance
const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error']
});

// Connection event handlers
prisma.$connect()
  .then(() => {
    if (config.nodeEnv === 'development') {
      console.log('✅ Database connected successfully');
    }
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });

// Graceful shutdown handlers
const disconnect = async () => {
  await prisma.$disconnect();
  if (config.nodeEnv === 'development') {
    console.log('🔌 Database disconnected');
  }
};

process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);
process.on('beforeExit', disconnect);

export { prisma };
export default prisma;
