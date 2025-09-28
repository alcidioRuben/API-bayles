"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('name').optional().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, name, password } = req.body;
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            error: 'User already exists with this email',
            timestamp: new Date().toISOString()
        });
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            apiKey: true,
            createdAt: true
        }
    });
    // Generate JWT token
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.status(201).json({
        success: true,
        data: {
            user,
            token
        },
        message: 'User registered successfully',
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty()
], errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user || !user.isActive) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials',
            timestamp: new Date().toISOString()
        });
    }
    // Check password
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials',
            timestamp: new Date().toISOString()
        });
    }
    // Generate JWT token
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                apiKey: user.apiKey
            },
            token
        },
        message: 'Login successful',
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            apiKey: true,
            createdAt: true,
            _count: {
                select: {
                    sessions: {
                        where: { isActive: true }
                    },
                    webhooks: {
                        where: { isActive: true }
                    }
                }
            }
        }
    });
    res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/auth/refresh-api-key:
 *   post:
 *     summary: Refresh API key
 *     tags: [Authentication]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: API key refreshed successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/refresh-api-key', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const crypto = require('crypto');
    const newApiKey = crypto.randomUUID();
    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { apiKey: newApiKey },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            apiKey: true
        }
    });
    res.json({
        success: true,
        data: user,
        message: 'API key refreshed successfully',
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 */
router.post('/change-password', [
    (0, express_validator_1.body)('currentPassword').notEmpty(),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], auth_1.authMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    // Get user with password
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found',
            timestamp: new Date().toISOString()
        });
    }
    // Verify current password
    const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        return res.status(400).json({
            success: false,
            error: 'Current password is incorrect',
            timestamp: new Date().toISOString()
        });
    }
    // Hash new password
    const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
    // Update password
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword }
    });
    res.json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
    });
}));
exports.default = router;
