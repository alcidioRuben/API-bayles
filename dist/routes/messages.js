"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const app_1 = require("../app");
const DatabaseService_1 = require("../services/DatabaseService");
const router = (0, express_1.Router)();
const dbService = new DatabaseService_1.DatabaseService();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '50') * 1024 * 1024, // 50MB default
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Allow common media types
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/mpeg', 'video/quicktime',
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('File type not supported'));
        }
    }
});
/**
 * @swagger
 * /api/messages/{sessionId}:
 *   get:
 *     summary: Get messages for a session
 *     tags: [Messages]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: chatId
 *         schema:
 *           type: string
 *         description: Filter by specific chat
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get('/:sessionId', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 })
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { chatId, limit = 50, offset = 0 } = req.query;
    const messages = await dbService.getMessages(sessionId, chatId, parseInt(limit), parseInt(offset));
    res.json({
        success: true,
        data: messages,
        timestamp: new Date().toISOString()
    });
}));
/**
 * @swagger
 * /api/messages/{sessionId}/send:
 *   post:
 *     summary: Send a text message
 *     tags: [Messages]
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
 *               - to
 *               - content
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient JID
 *               content:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *               options:
 *                 type: object
 *                 properties:
 *                   quoted:
 *                     type: string
 *                   mentions:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 */
router.post('/:sessionId/send', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty().trim(),
    (0, express_validator_1.body)('content.text').notEmpty().trim(),
    (0, express_validator_1.body)('options.quoted').optional().isString(),
    (0, express_validator_1.body)('options.mentions').optional().isArray()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { to, content, options = {} } = req.body;
    try {
        const messageContent = { text: content.text };
        if (options.quoted) {
            messageContent.quoted = options.quoted;
        }
        if (options.mentions && options.mentions.length > 0) {
            messageContent.mentions = options.mentions;
        }
        const result = await app_1.whatsAppService.sendMessage(sessionId, to, messageContent);
        res.json({
            success: true,
            data: result,
            message: 'Message sent successfully',
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
 * /api/messages/{sessionId}/send-media:
 *   post:
 *     summary: Send a media message
 *     tags: [Messages]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - file
 *             properties:
 *               to:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *               caption:
 *                 type: string
 *               fileName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Media message sent successfully
 */
router.post('/:sessionId/send-media', upload.single('file'), [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty().trim(),
    (0, express_validator_1.body)('caption').optional().trim(),
    (0, express_validator_1.body)('fileName').optional().trim()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { to, caption, fileName } = req.body;
    const file = req.file;
    if (!file) {
        return res.status(400).json({
            success: false,
            error: 'No file uploaded',
            timestamp: new Date().toISOString()
        });
    }
    try {
        let messageContent;
        const mediaBuffer = file.buffer;
        const mimetype = file.mimetype;
        if (mimetype.startsWith('image/')) {
            messageContent = {
                image: mediaBuffer,
                caption,
                fileName: fileName || file.originalname
            };
        }
        else if (mimetype.startsWith('video/')) {
            messageContent = {
                video: mediaBuffer,
                caption,
                fileName: fileName || file.originalname
            };
        }
        else if (mimetype.startsWith('audio/')) {
            messageContent = {
                audio: mediaBuffer,
                fileName: fileName || file.originalname,
                mimetype
            };
        }
        else {
            messageContent = {
                document: mediaBuffer,
                fileName: fileName || file.originalname,
                mimetype
            };
        }
        const result = await app_1.whatsAppService.sendMessage(sessionId, to, messageContent);
        res.json({
            success: true,
            data: result,
            message: 'Media message sent successfully',
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
 * /api/messages/{sessionId}/send-location:
 *   post:
 *     summary: Send a location message
 *     tags: [Messages]
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
 *               - to
 *               - latitude
 *               - longitude
 *             properties:
 *               to:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location message sent successfully
 */
router.post('/:sessionId/send-location', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty().trim(),
    (0, express_validator_1.body)('latitude').isFloat({ min: -90, max: 90 }),
    (0, express_validator_1.body)('longitude').isFloat({ min: -180, max: 180 }),
    (0, express_validator_1.body)('name').optional().trim(),
    (0, express_validator_1.body)('address').optional().trim()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { to, latitude, longitude, name, address } = req.body;
    try {
        const messageContent = {
            location: {
                degreesLatitude: latitude,
                degreesLongitude: longitude,
                name,
                address
            }
        };
        const result = await app_1.whatsAppService.sendMessage(sessionId, to, messageContent);
        res.json({
            success: true,
            data: result,
            message: 'Location message sent successfully',
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
 * /api/messages/{sessionId}/send-reaction:
 *   post:
 *     summary: Send a reaction to a message
 *     tags: [Messages]
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
 *               - to
 *               - messageId
 *               - emoji
 *             properties:
 *               to:
 *                 type: string
 *               messageId:
 *                 type: string
 *               emoji:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reaction sent successfully
 */
router.post('/:sessionId/send-reaction', [
    (0, express_validator_1.param)('sessionId').notEmpty(),
    (0, express_validator_1.body)('to').notEmpty().trim(),
    (0, express_validator_1.body)('messageId').notEmpty().trim(),
    (0, express_validator_1.body)('emoji').notEmpty().trim()
], auth_1.sessionMiddleware, errorHandler_1.handleValidationErrors, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { sessionId } = req.params;
    const { to, messageId, emoji } = req.body;
    try {
        const messageContent = {
            react: {
                text: emoji,
                key: {
                    remoteJid: to,
                    id: messageId
                }
            }
        };
        const result = await app_1.whatsAppService.sendMessage(sessionId, to, messageContent);
        res.json({
            success: true,
            data: result,
            message: 'Reaction sent successfully',
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
