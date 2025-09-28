"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const app_1 = require("../app");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/groups/{sessionId}/create:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
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
 *               - subject
 *               - participants
 *             properties:
 *               subject:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group created successfully
 */
router.post('/:sessionId/create', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.body)('subject').notEmpty().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.body)('participants').isArray({ min: 1 }),
    (0, express_validator_1.body)('participants.*').isString().notEmpty(),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 500 })
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { subject, participants, description } = req.body;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        const group = await session.socket.groupCreate(subject, participants);
        // Set description if provided
        if (description) {
            await session.socket.groupUpdateDescription(group.id, description);
        }
        res.json({
            success: true,
            data: group,
            message: 'Group created successfully',
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
 * /api/groups/{sessionId}/{groupId}/metadata:
 *   get:
 *     summary: Get group metadata
 *     tags: [Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group metadata retrieved successfully
 */
router.get('/:sessionId/:groupId/metadata', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('groupId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, groupId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        const metadata = await session.socket.groupMetadata(groupId);
        res.json({
            success: true,
            data: metadata,
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
 * /api/groups/{sessionId}/{groupId}/participants/add:
 *   post:
 *     summary: Add participants to group
 *     tags: [Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: groupId
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
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Participants added successfully
 */
router.post('/:sessionId/:groupId/participants/add', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('groupId').notEmpty(),
    (0, express_validator_1.body)('participants').isArray({ min: 1 }),
    (0, express_validator_1.body)('participants.*').isString().notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, groupId } = req.params;
    const { participants } = req.body;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        const result = await session.socket.groupParticipantsUpdate(groupId, participants, 'add');
        res.json({
            success: true,
            data: result,
            message: 'Participants added successfully',
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
 * /api/groups/{sessionId}/{groupId}/participants/remove:
 *   post:
 *     summary: Remove participants from group
 *     tags: [Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: groupId
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
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Participants removed successfully
 */
router.post('/:sessionId/:groupId/participants/remove', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('groupId').notEmpty(),
    (0, express_validator_1.body)('participants').isArray({ min: 1 }),
    (0, express_validator_1.body)('participants.*').isString().notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, groupId } = req.params;
    const { participants } = req.body;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        const result = await session.socket.groupParticipantsUpdate(groupId, participants, 'remove');
        res.json({
            success: true,
            data: result,
            message: 'Participants removed successfully',
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
 * /api/groups/{sessionId}/{groupId}/participants/promote:
 *   post:
 *     summary: Promote participants to admin
 *     tags: [Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: groupId
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
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Participants promoted successfully
 */
router.post('/:sessionId/:groupId/participants/promote', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('groupId').notEmpty(),
    (0, express_validator_1.body)('participants').isArray({ min: 1 }),
    (0, express_validator_1.body)('participants.*').isString().notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, groupId } = req.params;
    const { participants } = req.body;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        const result = await session.socket.groupParticipantsUpdate(groupId, participants, 'promote');
        res.json({
            success: true,
            data: result,
            message: 'Participants promoted successfully',
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
 * /api/groups/{sessionId}/{groupId}/participants/demote:
 *   post:
 *     summary: Demote participants from admin
 *     tags: [Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: groupId
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
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Participants demoted successfully
 */
router.post('/:sessionId/:groupId/participants/demote', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('groupId').notEmpty(),
    (0, express_validator_1.body)('participants').isArray({ min: 1 }),
    (0, express_validator_1.body)('participants.*').isString().notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, groupId } = req.params;
    const { participants } = req.body;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        const result = await session.socket.groupParticipantsUpdate(groupId, participants, 'demote');
        res.json({
            success: true,
            data: result,
            message: 'Participants demoted successfully',
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
 * /api/groups/{sessionId}/{groupId}/subject:
 *   put:
 *     summary: Update group subject
 *     tags: [Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: groupId
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
 *               - subject
 *             properties:
 *               subject:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group subject updated successfully
 */
router.put('/:sessionId/:groupId/subject', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('groupId').notEmpty(),
    (0, express_validator_1.body)('subject').notEmpty().trim().isLength({ min: 1, max: 100 })
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, groupId } = req.params;
    const { subject } = req.body;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.groupUpdateSubject(groupId, subject);
        res.json({
            success: true,
            message: 'Group subject updated successfully',
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
 * /api/groups/{sessionId}/{groupId}/description:
 *   put:
 *     summary: Update group description
 *     tags: [Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group description updated successfully
 */
router.put('/:sessionId/:groupId/description', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('groupId').notEmpty(),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 500 })
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, groupId } = req.params;
    const { description } = req.body;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.groupUpdateDescription(groupId, description);
        res.json({
            success: true,
            message: 'Group description updated successfully',
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
 * /api/groups/{sessionId}/{groupId}/leave:
 *   post:
 *     summary: Leave a group
 *     tags: [Groups]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Left group successfully
 */
router.post('/:sessionId/:groupId/leave', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('groupId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, groupId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        await session.socket.groupLeave(groupId);
        res.json({
            success: true,
            message: 'Left group successfully',
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
