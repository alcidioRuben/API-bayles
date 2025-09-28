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
 * /api/business/{sessionId}/profile:
 *   get:
 *     summary: Get business profile
 *     tags: [Business]
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
 *         description: Business profile retrieved successfully
 */
router.get('/:sessionId/profile', [
    (0, express_validator_1.param)('sessionId').notEmpty()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const session = await app_1.whatsAppService.getSession(sessionId);
    if (!(session === null || session === void 0 ? void 0 : session.socket)) {
        return res.status(400).json({
            success: false,
            error: 'Session not connected',
            timestamp: new Date().toISOString()
        });
    }
    try {
        // This would need to be implemented with proper business profile retrieval
        res.status(501).json({
            success: false,
            error: 'Business profile not yet implemented',
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
