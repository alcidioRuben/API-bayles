"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const DatabaseService_1 = require("../services/DatabaseService");
const WebhookService_1 = require("../services/WebhookService");
const router = (0, express_1.Router)();
const dbService = new DatabaseService_1.DatabaseService();
const webhookService = new WebhookService_1.WebhookService();
/**
 * @swagger
 * /api/webhooks:
 *   get:
 *     summary: Get user webhooks
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Webhooks retrieved successfully
 */
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const webhooks = await dbService.getUserWebhooks(req.user.id);
    res.json({
        success: true,
        data: webhooks,
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/webhooks:
 *   post:
 *     summary: Create a new webhook
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - events
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               secret:
 *                 type: string
 *     responses:
 *       201:
 *         description: Webhook created successfully
 */
router.post('/', [
    (0, express_validator_1.body)('url').isURL(),
    (0, express_validator_1.body)('events').isArray({ min: 1 }),
    (0, express_validator_1.body)('events.*').isString().notEmpty(),
    (0, express_validator_1.body)('secret').optional().isString()
], errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { url, events, secret } = req.body;
    const webhook = await dbService.createWebhook({
        userId: req.user.id,
        url,
        events,
        secret
    });
    res.status(201).json({
        success: true,
        data: webhook,
        message: 'Webhook created successfully',
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/webhooks/{webhookId}:
 *   delete:
 *     summary: Delete a webhook
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook deleted successfully
 */
router.delete('/:webhookId', [
    (0, express_validator_1.param)('webhookId').notEmpty()
], errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { webhookId } = req.params;
    await dbService.deleteWebhook(webhookId);
    res.json({
        success: true,
        message: 'Webhook deleted successfully',
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/webhooks/{webhookId}/test:
 *   post:
 *     summary: Test a webhook
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: webhookId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook test completed
 */
router.post('/:webhookId/test', [
    (0, express_validator_1.param)('webhookId').notEmpty()
], errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { webhookId } = req.params;
    const success = await webhookService.testWebhook(webhookId);
    res.json({
        success: true,
        data: { testSuccess: success },
        message: success ? 'Webhook test successful' : 'Webhook test failed',
        timestamp: new Date().toISOString()
    });
}));
exports.default = router;
