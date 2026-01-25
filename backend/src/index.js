import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { prisma } from './config/database.js';
import errorHandler from './middlewares/error.handler.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import ecosRoutes from './modules/ecos/ecos.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import bomsRoutes from './modules/boms/boms.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import stagesRoutes from './modules/stages/stages.routes.js';
import auditLogsRoutes from './modules/audit-logs/audit-logs.routes.js';
import approvalRulesRoutes from './modules/approval-rules/approval-rules.routes.js';
import delegationsRoutes from './modules/approval-rules/delegations.routes.js';

// Initialize Express app
const app = express();
const PORT = config.port;

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$connect();
    res.status(200).json({
      status: 'ok',
      message: 'Server is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ecos', ecosRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/boms', bomsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/stages', stagesRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/approval-rules', approvalRulesRoutes);
app.use('/api/delegations', delegationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Users endpoints: http://localhost:${PORT}/api/users`);
  console.log(`🧾 ECO endpoints: http://localhost:${PORT}/api/ecos`);
  console.log(`📦 Products endpoints: http://localhost:${PORT}/api/products`);
  console.log(`🧩 BoMs endpoints: http://localhost:${PORT}/api/boms`);
  console.log(`📈 Reports endpoints: http://localhost:${PORT}/api/reports`);
  console.log(`🧭 Stage endpoints: http://localhost:${PORT}/api/stages`);
  console.log(`🧾 Audit endpoints: http://localhost:${PORT}/api/audit-logs`);
  console.log(`📋 Approval Rules endpoints: http://localhost:${PORT}/api/approval-rules`);
  console.log(`👥 Delegations endpoints: http://localhost:${PORT}/api/delegations`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
