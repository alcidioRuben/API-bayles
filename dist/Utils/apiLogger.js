"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWebhookDelivery = exports.logError = exports.logWhatsAppEvent = exports.logApiRequest = exports.webhookLogger = exports.dbLogger = exports.whatsappLogger = exports.apiLogger = exports.createLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const fs_1 = require("fs");
const path_1 = require("path");
const fs_2 = require("fs");
// Ensure logs directory exists
const logsDir = (0, path_1.join)(process.cwd(), 'logs');
if (!(0, fs_2.existsSync)(logsDir)) {
    (0, fs_2.mkdirSync)(logsDir, { recursive: true });
}
// Create log streams
const logFile = (0, path_1.join)(logsDir, 'app.log');
const errorFile = (0, path_1.join)(logsDir, 'error.log');
const streams = [
    // Console output for development
    {
        level: process.env.LOG_LEVEL || 'info',
        stream: process.stdout
    },
    // File output for all logs
    {
        level: 'info',
        stream: (0, fs_1.createWriteStream)(logFile, { flags: 'a' })
    },
    // Separate file for errors
    {
        level: 'error',
        stream: (0, fs_1.createWriteStream)(errorFile, { flags: 'a' })
    }
];
// Create logger with multiple streams
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => {
            return { level: label };
        }
    },
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            headers: {
                'user-agent': req.headers['user-agent'],
                'content-type': req.headers['content-type'],
                'x-forwarded-for': req.headers['x-forwarded-for']
            },
            remoteAddress: req.remoteAddress,
            remotePort: req.remotePort
        }),
        res: (res) => ({
            statusCode: res.statusCode,
            headers: {
                'content-type': res.getHeader('content-type'),
                'content-length': res.getHeader('content-length')
            }
        }),
        err: pino_1.default.stdSerializers.err
    }
}, pino_1.default.multistream(streams));
// Create child loggers for different components
const createLogger = (component) => {
    return exports.logger.child({ component });
};
exports.createLogger = createLogger;
// Specific loggers for different parts of the application
exports.apiLogger = (0, exports.createLogger)('api');
exports.whatsappLogger = (0, exports.createLogger)('whatsapp');
exports.dbLogger = (0, exports.createLogger)('database');
exports.webhookLogger = (0, exports.createLogger)('webhook');
// Helper function to log API requests
const logApiRequest = (req, res, duration) => {
    var _a;
    exports.apiLogger.info({
        req,
        res,
        duration,
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        sessionId: req.sessionId
    }, 'API Request');
};
exports.logApiRequest = logApiRequest;
// Helper function to log WhatsApp events
const logWhatsAppEvent = (sessionId, event, data) => {
    exports.whatsappLogger.info({
        sessionId,
        event,
        data
    }, 'WhatsApp Event');
};
exports.logWhatsAppEvent = logWhatsAppEvent;
// Helper function to log errors with context
const logError = (error, context) => {
    exports.logger.error({
        err: error,
        context
    }, 'Application Error');
};
exports.logError = logError;
// Helper function to log webhook deliveries
const logWebhookDelivery = (webhookId, url, event, status, response) => {
    exports.webhookLogger.info({
        webhookId,
        url,
        event,
        status,
        response
    }, 'Webhook Delivery');
};
exports.logWebhookDelivery = logWebhookDelivery;
exports.default = exports.logger;
