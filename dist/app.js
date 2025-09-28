"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsAppService = exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const apiLogger_1 = require("./Utils/apiLogger");
const DatabaseService_1 = require("./services/DatabaseService");
const WhatsAppService_1 = require("./services/WhatsAppService");
// Routes
const auth_2 = __importDefault(require("./routes/auth"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const messages_1 = __importDefault(require("./routes/messages"));
const chats_1 = __importDefault(require("./routes/chats"));
const groups_1 = __importDefault(require("./routes/groups"));
const contacts_1 = __importDefault(require("./routes/contacts"));
const media_1 = __importDefault(require("./routes/media"));
const business_1 = __importDefault(require("./routes/business"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
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
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
// Middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => apiLogger_1.logger.info(message.trim()) } }));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use(limiter);
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// Health check
app.get('/health', async (req, res) => {
    try {
        // Basic health check
        const healthStatus = {
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
        }
        catch (dbError) {
            console.error('Database health check failed:', dbError);
            healthStatus.database = 'disconnected';
            healthStatus.status = 'degraded';
        }
        res.status(200).json(healthStatus);
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Service unavailable'
        });
    }
});
// Routes
app.use('/api/auth', auth_2.default);
app.use('/api/sessions', auth_1.authMiddleware, sessions_1.default);
app.use('/api/messages', auth_1.authMiddleware, messages_1.default);
app.use('/api/chats', auth_1.authMiddleware, chats_1.default);
app.use('/api/groups', auth_1.authMiddleware, groups_1.default);
app.use('/api/contacts', auth_1.authMiddleware, contacts_1.default);
app.use('/api/media', auth_1.authMiddleware, media_1.default);
app.use('/api/business', auth_1.authMiddleware, business_1.default);
app.use('/api/webhooks', auth_1.authMiddleware, webhooks_1.default);
app.use('/dashboard', dashboard_1.default);
// Serve static files for dashboard
app.use('/static', express_1.default.static('frontend/dist'));
// Default route for dashboard
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});
// Error handling
app.use(errorHandler_1.errorHandler);
// Socket.IO for real-time updates
io.on('connection', (socket) => {
    apiLogger_1.logger.info(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        apiLogger_1.logger.info(`Client disconnected: ${socket.id}`);
    });
});
// Initialize services
const databaseService = new DatabaseService_1.DatabaseService();
const whatsAppService = new WhatsAppService_1.WhatsAppService(io);
exports.whatsAppService = whatsAppService;
// Initialize database connection
async function initializeServices() {
    try {
        console.log('Initializing database connection...');
        await databaseService.connect();
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Failed to connect to database:', error);
        // Don't exit the process, let the health check handle it
    }
}
// Export for use in routes
// Graceful shutdown
process.on('SIGTERM', async () => {
    apiLogger_1.logger.info('SIGTERM received, shutting down gracefully');
    await whatsAppService.shutdown();
    await databaseService.disconnect();
    server.close(() => {
        apiLogger_1.logger.info('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    apiLogger_1.logger.info('SIGINT received, shutting down gracefully');
    await whatsAppService.shutdown();
    await databaseService.disconnect();
    server.close(() => {
        apiLogger_1.logger.info('Process terminated');
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
            apiLogger_1.logger.info(`Server running on port ${PORT}`);
            apiLogger_1.logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
            apiLogger_1.logger.info(`Dashboard available at http://localhost:${PORT}/dashboard`);
            apiLogger_1.logger.info(`Health check available at http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        apiLogger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start the application
startServer();
