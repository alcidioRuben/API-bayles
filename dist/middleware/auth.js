"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimit = exports.responseMiddleware = exports.sessionMiddleware = exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const apiLogger_1 = require("../Utils/apiLogger");
const prisma = new client_1.PrismaClient();
const authMiddleware = async (req, res, next) => {
    var _a;
    try {
        const token = ((_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '')) ||
            req.header('X-API-Key') ||
            req.query.apiKey;
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.',
                timestamp: new Date().toISOString()
            });
        }
        // Check if it's a JWT token or API key
        if (token.startsWith('ey')) {
            // JWT token
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        apiKey: true,
                        isActive: true
                    }
                });
                if (!user || !user.isActive) {
                    return res.status(401).json({
                        success: false,
                        error: 'Invalid token or user not active.',
                        timestamp: new Date().toISOString()
                    });
                }
                req.user = user;
            }
            catch (jwtError) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid JWT token.',
                    timestamp: new Date().toISOString()
                });
            }
        }
        else {
            // API Key
            const user = await prisma.user.findUnique({
                where: { apiKey: token },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    apiKey: true,
                    isActive: true
                }
            });
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid API key or user not active.',
                    timestamp: new Date().toISOString()
                });
            }
            req.user = user;
        }
        // Log API usage
        await logApiUsage(req);
        next();
    }
    catch (error) {
        apiLogger_1.logger.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during authentication.',
            timestamp: new Date().toISOString()
        });
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            error: 'Access denied. Admin privileges required.',
            timestamp: new Date().toISOString()
        });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
const sessionMiddleware = async (req, res, next) => {
    try {
        const sessionId = req.params.sessionId || req.body.sessionId || req.query.sessionId;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required.',
                timestamp: new Date().toISOString()
            });
        }
        // Verify session belongs to user
        const session = await prisma.session.findFirst({
            where: {
                sessionId,
                userId: req.user.id
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found or access denied.',
                timestamp: new Date().toISOString()
            });
        }
        req.sessionId = sessionId;
        next();
    }
    catch (error) {
        apiLogger_1.logger.error('Session middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during session validation.',
            timestamp: new Date().toISOString()
        });
    }
};
exports.sessionMiddleware = sessionMiddleware;
const logApiUsage = async (req) => {
    try {
        const startTime = Date.now();
        // Store start time for duration calculation
        req.startTime = startTime;
        // Log the API call
        await prisma.apiUsage.create({
            data: {
                userId: req.user.id,
                endpoint: req.path,
                method: req.method,
                status: 0, // Will be updated in response middleware
                duration: 0, // Will be updated in response middleware
                timestamp: new Date()
            }
        });
    }
    catch (error) {
        apiLogger_1.logger.error('Error logging API usage:', error);
    }
};
// Middleware to update API usage with response data
const responseMiddleware = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        // Calculate duration
        const duration = req.startTime ? Date.now() - req.startTime : 0;
        // Update API usage record
        if (req.user) {
            updateApiUsage(req.user.id, req.path, req.method, res.statusCode, duration);
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.responseMiddleware = responseMiddleware;
const updateApiUsage = async (userId, endpoint, method, status, duration) => {
    try {
        // Find the most recent API usage record for this user and endpoint
        const usage = await prisma.apiUsage.findFirst({
            where: {
                userId,
                endpoint,
                method,
                status: 0 // Find the record that hasn't been updated yet
            },
            orderBy: {
                timestamp: 'desc'
            }
        });
        if (usage) {
            await prisma.apiUsage.update({
                where: { id: usage.id },
                data: {
                    status,
                    duration
                }
            });
        }
    }
    catch (error) {
        apiLogger_1.logger.error('Error updating API usage:', error);
    }
};
// Rate limiting middleware for specific endpoints
const createRateLimit = (windowMs, max) => {
    const requests = new Map();
    return (req, res, next) => {
        var _a;
        const key = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        // Clean old requests
        const userRequests = requests.get(key) || [];
        const validRequests = userRequests.filter((time) => time > windowStart);
        if (validRequests.length >= max) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests. Please try again later.',
                timestamp: new Date().toISOString()
            });
        }
        validRequests.push(now);
        requests.set(key, validRequests);
        next();
    };
};
exports.createRateLimit = createRateLimit;
