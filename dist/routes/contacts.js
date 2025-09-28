"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const app_1 = require("../app");
const DatabaseService_1 = require("../services/DatabaseService");
const router = (0, express_1.Router)();
const dbService = new DatabaseService_1.DatabaseService();
/**
 * @swagger
 * /api/contacts/{sessionId}:
 *   get:
 *     summary: Get all contacts for a session
 *     tags: [Contacts]
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
 *         description: Contacts retrieved successfully
 */
router.get('/:sessionId', [
    (0, express_validator_1.param)('sessionId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const contacts = await dbService.getContacts(sessionId);
    res.json({
        success: true,
        data: contacts,
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/contacts/{sessionId}/{contactId}/profile-picture:
 *   get:
 *     summary: Get contact profile picture
 *     tags: [Contacts]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile picture URL retrieved successfully
 */
router.get('/:sessionId/:contactId/profile-picture', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('contactId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, contactId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        const profilePicUrl = await session.socket.profilePictureUrl(contactId, 'image');
        res.json({
            success: true,
            data: { profilePicUrl },
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
 * /api/contacts/{sessionId}/{contactId}/presence:
 *   get:
 *     summary: Get contact presence status
 *     tags: [Contacts]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Presence status retrieved successfully
 */
router.get('/:sessionId/:contactId/presence', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('contactId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, contactId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.presenceSubscribe(contactId);
        res.json({
            success: true,
            message: 'Presence subscription initiated',
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
 * /api/contacts/{sessionId}/{contactId}/block:
 *   post:
 *     summary: Block a contact
 *     tags: [Contacts]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact blocked successfully
 */
router.post('/:sessionId/:contactId/block', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('contactId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, contactId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.updateBlockStatus(contactId, 'block');
        res.json({
            success: true,
            message: 'Contact blocked successfully',
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
 * /api/contacts/{sessionId}/{contactId}/unblock:
 *   post:
 *     summary: Unblock a contact
 *     tags: [Contacts]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact unblocked successfully
 */
router.post('/:sessionId/:contactId/unblock', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('contactId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, contactId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.updateBlockStatus(contactId, 'unblock');
        res.json({
            success: true,
            message: 'Contact unblocked successfully',
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
exports.default = router;
