"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const app_1 = require("../app");
const DatabaseService_1 = require("../services/DatabaseService");
const api_1 = require("../Types/api");
const router = (0, express_1.Router)();
const dbService = new DatabaseService_1.DatabaseService();
/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get all user sessions
 *     tags: [Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 */
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const sessions = await dbService.getUserSessions(req.user.id);
    // Enhance with real-time status from WhatsApp service
    const enhancedSessions = await Promise.all(sessions.map(async (session) => {
        const liveSession = await app_1.whatsAppService.getSession(session.sessionId);
        return {
            ...session,
            liveStatus: (liveSession === null || liveSession === void 0 ? void 0 : liveSession.status) || api_1.SessionStatus.DISCONNECTED,
            qrCode: liveSession === null || liveSession === void 0 ? void 0 : liveSession.qrCode,
            pairingCode: liveSession === null || liveSession === void 0 ? void 0 : liveSession.pairingCode
        };
    }));
    res.json({
        success: true,
        data: enhancedSessions,
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create a new WhatsApp session
 *     tags: [Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Unique session identifier
 *               usePairingCode:
 *                 type: boolean
 *                 default: false
 *                 description: Use pairing code instead of QR code
 *     responses:
 *       201:
 *         description: Session created successfully
 *       400:
 *         description: Session already exists
 */
router.post('/', [
    (0, express_validator_1.body)('sessionId').notEmpty().trim().isLength({ min: 1, max: 50 }),
    (0, express_validator_1.body)('usePairingCode').optional().isBoolean()
], errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, usePairingCode = false } = req.body;
    // Check if session already exists
    const existingSession = await dbService.getSession(sessionId);
    if (existingSession) {
        return res.status(400).json({
            success: false,
            error: 'Session already exists',
            timestamp: new Date().toISOString()
        });
    }
    // Create session
    const session = await app_1.whatsAppService.createSession(sessionId, req.user.id, usePairingCode);
    res.status(201).json({
        success: true,
        data: session,
        message: 'Session created successfully',
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/sessions/{sessionId}:
 *   get:
 *     summary: Get session details
 *     tags: [Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details retrieved successfully
 *       404:
 *         description: Session not found
 */
router.get('/:sessionId', [
    (0, express_validator_1.param)('sessionId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const dbSession = await dbService.getSession(sessionId);
    const liveSession = await app_1.whatsAppService.getSession(sessionId);
    if (!dbSession) {
        return res.status(404).json({
            success: false,
            error: 'Session not found',
            timestamp: new Date().toISOString()
        });
    }
    const sessionData = {
        ...dbSession,
        liveStatus: (liveSession === null || liveSession === void 0 ? void 0 : liveSession.status) || api_1.SessionStatus.DISCONNECTED,
        qrCode: liveSession === null || liveSession === void 0 ? void 0 : liveSession.qrCode,
        pairingCode: liveSession === null || liveSession === void 0 ? void 0 : liveSession.pairingCode
    };
    res.json({
        success: true,
        data: sessionData,
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/sessions/{sessionId}:
 *   delete:
 *     summary: Delete a session
 *     tags: [Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 */
router.delete('/:sessionId', [
    (0, express_validator_1.param)('sessionId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    await app_1.whatsAppService.deleteSession(sessionId);
    res.json({
        success: true,
        message: 'Session deleted successfully',
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/sessions/{sessionId}/qr:
 *   get:
 *     summary: Get QR code for session
 *     tags: [Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code retrieved successfully
 *       404:
 *         description: Session not found or QR code not available
 */
router.get('/:sessionId/qr', [
    (0, express_validator_1.param)('sessionId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!session || !session.qrCode) {
        return res.status(404).json({
            success: false,
            error: 'QR code not available',
            timestamp: new Date().toISOString()
        });
    }
    res.json({
        success: true,
        data: {
            qrCode: session.qrCode,
            status: session.status
        },
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/sessions/{sessionId}/pairing-code:
 *   post:
 *     summary: Request pairing code for session
 *     tags: [Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number in international format
 *     responses:
 *       200:
 *         description: Pairing code generated successfully
 *       400:
 *         description: Invalid phone number or session not ready
 */
router.post('/:sessionId/pairing-code', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.body)('phoneNumber').isMobilePhone('any').withMessage('Invalid phone number')
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { phoneNumber } = req.body;
    try {
        const pairingCode = await app_1.whatsAppService.requestPairingCode(sessionId, phoneNumber);
        res.json({
            success: true,
            data: {
                pairingCode,
                phoneNumber,
                sessionId
            },
            message: 'Pairing code generated successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}));
/**
 * @swagger
 * /api/sessions/{sessionId}/status:
 *   get:
 *     summary: Get session connection status
 *     tags: [Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session status retrieved successfully
 */
router.get('/:sessionId/status', [
    (0, express_validator_1.param)('sessionId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    const dbSession = await dbService.getSession(sessionId);
    res.json({
        success: true,
        data: {
            sessionId,
            status: (session === null || session === void 0 ? void 0 : session.status) || api_1.SessionStatus.DISCONNECTED,
            phoneNumber: (session === null || session === void 0 ? void 0 : session.phoneNumber) || (dbSession === null || dbSession === void 0 ? void 0 : dbSession.phoneNumber),
            name: (session === null || session === void 0 ? void 0 : session.name) || (dbSession === null || dbSession === void 0 ? void 0 : dbSession.name),
            lastSeen: (session === null || session === void 0 ? void 0 : session.lastSeen) || (dbSession === null || dbSession === void 0 ? void 0 : dbSession.lastSeen),
            isConnected: (session === null || session === void 0 ? void 0 : session.status) === api_1.SessionStatus.CONNECTED
        },
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/sessions/{sessionId}/restart:
 *   post:
 *     summary: Restart a session
 *     tags: [Sessions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session restart initiated
 */
router.post('/:sessionId/restart', [
    (0, express_validator_1.param)('sessionId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    // Delete and recreate session
    await app_1.whatsAppService.deleteSession(sessionId);
    const newSession = await app_1.whatsAppService.createSession(sessionId, req.user.id);
    res.json({
        success: true,
        data: newSession,
        message: 'Session restart initiated',
        timestamp: new Date().toISOString()
    });
}));
exports.default = router;
