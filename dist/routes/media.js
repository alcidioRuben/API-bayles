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
 * /api/media/{sessionId}/download/{messageId}:
 *   get:
 *     summary: Download media from a message
 *     tags: [Media]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:sessionId/download/:messageId', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.param)('messageId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId, messageId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        // This would need to be implemented with proper message retrieval
        // For now, return a placeholder response
        res.status(501).json({
            success: false,
            error: 'Media download not yet implemented',
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
