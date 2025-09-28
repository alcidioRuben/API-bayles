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
 * /api/chats/{sessionId}:
 *   get:
 *     summary: Get all chats for a session
 *     tags: [Chats]
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
 *         description: Chats retrieved successfully
 */
router.get('/:sessionId', [
    (0, express_validator_1.param)('sessionId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const chats = await dbService.getChats(sessionId);
    res.json({
        success: true,
        data: chats,
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/chats/{sessionId}/{chatId}/archive:
 *   post:
 *     summary: Archive a chat
 *     tags: [Chats]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat archived successfully
 */
router.post('/:sessionId/:chatId/archive', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('chatId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, chatId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.chatModify({ archive: true, lastMessages: [] }, chatId);
        // Update in database
        await dbService.upsertChat({
            sessionId,
            jid: chatId,
            isGroup: chatId.endsWith('@g.us'),
            isArchived: true
        });
        res.json({
            success: true,
            message: 'Chat archived successfully',
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
 * /api/chats/{sessionId}/{chatId}/unarchive:
 *   post:
 *     summary: Unarchive a chat
 *     tags: [Chats]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat unarchived successfully
 */
router.post('/:sessionId/:chatId/unarchive', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('chatId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, chatId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.chatModify({ archive: false, lastMessages: [] }, chatId);
        // Update in database
        await dbService.upsertChat({
            sessionId,
            jid: chatId,
            isGroup: chatId.endsWith('@g.us'),
            isArchived: false
        });
        res.json({
            success: true,
            message: 'Chat unarchived successfully',
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
 * /api/chats/{sessionId}/{chatId}/pin:
 *   post:
 *     summary: Pin a chat
 *     tags: [Chats]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat pinned successfully
 */
router.post('/:sessionId/:chatId/pin', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('chatId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, chatId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.chatModify({ pin: true }, chatId);
        // Update in database
        await dbService.upsertChat({
            sessionId,
            jid: chatId,
            isGroup: chatId.endsWith('@g.us'),
            isPinned: true
        });
        res.json({
            success: true,
            message: 'Chat pinned successfully',
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
 * /api/chats/{sessionId}/{chatId}/unpin:
 *   post:
 *     summary: Unpin a chat
 *     tags: [Chats]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat unpinned successfully
 */
router.post('/:sessionId/:chatId/unpin', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('chatId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, chatId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.chatModify({ pin: false }, chatId);
        // Update in database
        await dbService.upsertChat({
            sessionId,
            jid: chatId,
            isGroup: chatId.endsWith('@g.us'),
            isPinned: false
        });
        res.json({
            success: true,
            message: 'Chat unpinned successfully',
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
 * /api/chats/{sessionId}/{chatId}/delete:
 *   delete:
 *     summary: Delete a chat
 *     tags: [Chats]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 */
router.delete('/:sessionId/:chatId/delete', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('chatId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, chatId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.chatModify({ delete: true, lastMessages: [] }, chatId);
        res.json({
            success: true,
            message: 'Chat deleted successfully',
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
 * /api/chats/{sessionId}/{chatId}/mark-read:
 *   post:
 *     summary: Mark chat as read
 *     tags: [Chats]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat marked as read successfully
 */
router.post('/:sessionId/:chatId/mark-read', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('chatId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, chatId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.chatModify({ markRead: true, lastMessages: [] }, chatId);
        // Update in database
        await dbService.upsertChat({
            sessionId,
            jid: chatId,
            isGroup: chatId.endsWith('@g.us'),
            unreadCount: 0
        });
        res.json({
            success: true,
            message: 'Chat marked as read successfully',
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
