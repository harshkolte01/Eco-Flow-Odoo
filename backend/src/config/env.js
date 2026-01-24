import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Validate and export environment configuration
 * Throws error if critical environment variables are missing
 */

// Validate critical environment variables
const validateEnv = () => {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file.'
    );
  }
};

// Run validation
validateEnv();

// Export configuration object
export const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
};

// Log configuration in development (without sensitive data)
if (config.nodeEnv === 'development') {
  console.log('📋 Environment Configuration:');
  console.log(`   - Node Environment: ${config.nodeEnv}`);
  console.log(`   - Port: ${config.port}`);
  console.log(`   - Database: ${config.databaseUrl ? 'Configured ✓' : 'Missing ✗'}`);
  console.log(`   - JWT Secret: ${config.jwt.secret ? 'Configured ✓' : 'Missing ✗'}`);
  console.log(`   - JWT Expiry: ${config.jwt.expiresIn}`);
}

export default config;
