import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { logger } from './Utils/apiLogger';
import { DatabaseService } from './services/DatabaseService';
import { WhatsAppService } from './services/WhatsAppService';

// Routes
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import messageRoutes from './routes/messages';
import chatRoutes from './routes/chats';
import groupRoutes from './routes/groups';
import contactRoutes from './routes/contacts';
import mediaRoutes from './routes/media';
import businessRoutes from './routes/business';
import webhookRoutes from './routes/webhooks';
import dashboardRoutes from './routes/dashboard';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Baileys WhatsApp API',
      version: '1.0.0',
      description: 'REST API wrapper for Baileys WhatsApp Web library',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(limiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', async (req, res) => {
  try {
    // Basic health check
    const healthStatus: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      port: process.env.PORT || 3001
    };

    // Try to check database connection if available
    try {
      if (databaseService) {
        await databaseService.healthCheck();
        healthStatus.database = 'connected';
      }
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      healthStatus.database = 'disconnected';
      healthStatus.status = 'degraded';
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', authMiddleware, sessionRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/chats', authMiddleware, chatRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/contacts', authMiddleware, contactRoutes);
app.use('/api/media', authMiddleware, mediaRoutes);
app.use('/api/business', authMiddleware, businessRoutes);
app.use('/api/webhooks', authMiddleware, webhookRoutes);
app.use('/dashboard', dashboardRoutes);

// Serve static files for dashboard
app.use('/static', express.static('frontend/dist'));

// Default route for dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Error handling
app.use(errorHandler);

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Initialize services
const databaseService = new DatabaseService();
const whatsAppService = new WhatsAppService(io);

// Initialize database connection
async function initializeServices() {
  try {
    console.log('Initializing database connection...');
    await databaseService.connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    // Don't exit the process, let the health check handle it
  }
}

// Export for use in routes

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await whatsAppService.shutdown();
  await databaseService.disconnect();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await whatsAppService.shutdown();
  await databaseService.disconnect();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;

// Start the server
async function startServer() {
  try {
    // Initialize services first
    await initializeServices();
    
    // Start the HTTP server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
      logger.info(`Dashboard available at http://localhost:${PORT}/dashboard`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

export { app, io, whatsAppService };
