"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const index_1 = __importStar(require("../index"));
const qrcode_1 = __importDefault(require("qrcode"));
const path_1 = require("path");
const fs_1 = require("fs");
const apiLogger_1 = require("../Utils/apiLogger");
const DatabaseService_1 = require("./DatabaseService");
const WebhookService_1 = require("./WebhookService");
const api_1 = require("../Types/api");
class WhatsAppService {
    constructor(io) {
        this.sessions = new Map();
        this.io = io;
        this.dbService = new DatabaseService_1.DatabaseService();
        this.webhookService = new WebhookService_1.WebhookService();
        // Ensure auth directory exists
        const authDir = (0, path_1.join)(process.cwd(), 'auth_sessions');
        if (!(0, fs_1.existsSync)(authDir)) {
            (0, fs_1.mkdirSync)(authDir, { recursive: true });
        }
    }
    async createSession(sessionId, userId, usePairingCode = false) {
        try {
            if (this.sessions.has(sessionId)) {
                throw new Error('Session already exists');
            }
            // Create session record in database
            await this.dbService.createSession({
                sessionId,
                userId
            });
            const session = {
                id: sessionId,
                socket: null,
                status: api_1.SessionStatus.CONNECTING,
                lastSeen: new Date()
            };
            this.sessions.set(sessionId, session);
            // Initialize WhatsApp connection
            await this.initializeWhatsAppConnection(sessionId, usePairingCode);
            return session;
        }
        catch (error) {
            apiLogger_1.whatsappLogger.error(`Failed to create session ${sessionId}:`, error);
            throw error;
        }
    }
    async initializeWhatsAppConnection(sessionId, usePairingCode = false) {
        try {
            const authDir = (0, path_1.join)(process.cwd(), 'auth_sessions', sessionId);
            const { state, saveCreds } = await (0, index_1.useMultiFileAuthState)(authDir);
            const { version } = await (0, index_1.fetchLatestBaileysVersion)();
            const socket = (0, index_1.default)({
                version,
                logger: apiLogger_1.whatsappLogger,
                printQRInTerminal: false,
                auth: {
                    creds: state.creds,
                    keys: (0, index_1.makeCacheableSignalKeyStore)(state.keys, apiLogger_1.whatsappLogger)
                },
                generateHighQualityLinkPreview: true,
                getMessage: async (key) => {
                    // Implement message retrieval from database
                    return undefined;
                }
            });
            const session = this.sessions.get(sessionId);
            session.socket = socket;
            // Handle connection events
            socket.ev.on('connection.update', async (update) => {
                await this.handleConnectionUpdate(sessionId, update);
            });
            // Handle credentials update
            socket.ev.on('creds.update', saveCreds);
            // Handle messages
            socket.ev.on('messages.upsert', async (messageUpdate) => {
                await this.handleMessagesUpsert(sessionId, messageUpdate);
            });
            // Handle message updates (read receipts, etc.)
            socket.ev.on('messages.update', async (messageUpdates) => {
                await this.handleMessagesUpdate(sessionId, messageUpdates);
            });
            // Handle chats
            socket.ev.on('chats.upsert', async (chats) => {
                await this.handleChatsUpsert(sessionId, chats);
            });
            // Handle contacts
            socket.ev.on('contacts.upsert', async (contacts) => {
                await this.handleContactsUpsert(sessionId, contacts);
            });
            // Handle groups
            socket.ev.on('groups.upsert', async (groups) => {
                await this.handleGroupsUpsert(sessionId, groups);
            });
            // Handle pairing code if requested
            if (usePairingCode && !socket.authState.creds.registered) {
                session.status = api_1.SessionStatus.PAIRING_REQUIRED;
                await this.updateSessionInDatabase(sessionId, { status: 'PAIRING_REQUIRED' });
                this.emitSessionUpdate(sessionId);
            }
        }
        catch (error) {
            apiLogger_1.whatsappLogger.error(`Failed to initialize WhatsApp connection for ${sessionId}:`, error);
            const session = this.sessions.get(sessionId);
            if (session) {
                session.status = api_1.SessionStatus.ERROR;
                await this.updateSessionInDatabase(sessionId, { status: 'ERROR' });
                this.emitSessionUpdate(sessionId);
            }
            throw error;
        }
    }
    async handleConnectionUpdate(sessionId, update) {
        var _a, _b, _c, _d;
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        const { connection, lastDisconnect, qr } = update;
        apiLogger_1.whatsappLogger.info(`Connection update for ${sessionId}:`, { connection, lastDisconnect: (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.message });
        if (qr) {
            // Generate QR code
            try {
                const qrCodeDataURL = await qrcode_1.default.toDataURL(qr);
                session.qrCode = qrCodeDataURL;
                session.status = api_1.SessionStatus.QR_REQUIRED;
                await this.updateSessionInDatabase(sessionId, {
                    status: 'QR_REQUIRED',
                    qrCode: qrCodeDataURL
                });
                this.emitSessionUpdate(sessionId);
            }
            catch (error) {
                apiLogger_1.whatsappLogger.error(`Failed to generate QR code for ${sessionId}:`, error);
            }
        }
        if (connection === 'close') {
            const shouldReconnect = ((_c = (_b = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _b === void 0 ? void 0 : _b.output) === null || _c === void 0 ? void 0 : _c.statusCode) !== index_1.DisconnectReason.loggedOut;
            if (shouldReconnect) {
                apiLogger_1.whatsappLogger.info(`Reconnecting session ${sessionId}`);
                session.status = api_1.SessionStatus.CONNECTING;
                await this.updateSessionInDatabase(sessionId, { status: 'CONNECTING' });
                this.emitSessionUpdate(sessionId);
                // Reconnect after a delay
                setTimeout(() => {
                    this.initializeWhatsAppConnection(sessionId);
                }, 5000);
            }
            else {
                apiLogger_1.whatsappLogger.info(`Session ${sessionId} logged out`);
                session.status = api_1.SessionStatus.DISCONNECTED;
                await this.updateSessionInDatabase(sessionId, { status: 'DISCONNECTED' });
                this.emitSessionUpdate(sessionId);
            }
        }
        else if (connection === 'open') {
            apiLogger_1.whatsappLogger.info(`Session ${sessionId} connected`);
            session.status = api_1.SessionStatus.CONNECTED;
            session.lastSeen = new Date();
            session.qrCode = undefined;
            session.pairingCode = undefined;
            // Get user info
            const user = (_d = session.socket) === null || _d === void 0 ? void 0 : _d.user;
            if (user) {
                session.phoneNumber = user.id.split(':')[0];
                session.name = user.name;
            }
            await this.updateSessionInDatabase(sessionId, {
                status: 'CONNECTED',
                phoneNumber: session.phoneNumber,
                name: session.name,
                lastSeen: session.lastSeen,
                qrCode: null
            });
            this.emitSessionUpdate(sessionId);
        }
    }
    async handleMessagesUpsert(sessionId, messageUpdate) {
        var _a, _b, _c;
        const { messages, type } = messageUpdate;
        for (const message of messages) {
            try {
                // Save message to database
                await this.dbService.saveMessage({
                    messageId: message.key.id,
                    sessionId,
                    chatId: message.key.remoteJid,
                    fromMe: message.key.fromMe || false,
                    fromJid: message.key.participant || message.key.remoteJid,
                    toJid: message.key.remoteJid,
                    messageType: this.getMessageType(message.message),
                    content: message.message,
                    timestamp: new Date(message.messageTimestamp * 1000),
                    quotedMessage: ((_c = (_b = (_a = message.message) === null || _a === void 0 ? void 0 : _a.extendedTextMessage) === null || _b === void 0 ? void 0 : _b.contextInfo) === null || _c === void 0 ? void 0 : _c.quotedMessage) ?
                        message.message.extendedTextMessage.contextInfo.stanzaId : undefined,
                    metadata: { type, pushName: message.pushName }
                });
                // Emit to websocket clients
                this.io.emit('message', {
                    sessionId,
                    message,
                    type
                });
                // Send webhook
                await this.webhookService.sendWebhook(sessionId, 'message.received', {
                    sessionId,
                    message,
                    type
                });
            }
            catch (error) {
                apiLogger_1.whatsappLogger.error(`Failed to handle message for ${sessionId}:`, error);
            }
        }
    }
    async handleMessagesUpdate(sessionId, messageUpdates) {
        for (const update of messageUpdates) {
            try {
                const { key, update: messageUpdate } = update;
                if (messageUpdate.status) {
                    await this.dbService.updateMessageStatus(key.id, sessionId, messageUpdate.status);
                }
                // Emit to websocket clients
                this.io.emit('messageUpdate', {
                    sessionId,
                    key,
                    update: messageUpdate
                });
                // Send webhook
                await this.webhookService.sendWebhook(sessionId, 'message.updated', {
                    sessionId,
                    key,
                    update: messageUpdate
                });
            }
            catch (error) {
                apiLogger_1.whatsappLogger.error(`Failed to handle message update for ${sessionId}:`, error);
            }
        }
    }
    async handleChatsUpsert(sessionId, chats) {
        for (const chat of chats) {
            try {
                await this.dbService.upsertChat({
                    sessionId,
                    jid: chat.id,
                    name: chat.name,
                    isGroup: chat.id.endsWith('@g.us'),
                    isArchived: chat.archived || false,
                    isPinned: chat.pinned || false,
                    isMuted: chat.mute || false,
                    unreadCount: chat.unreadCount || 0,
                    lastMessage: chat.lastMessage,
                    metadata: chat
                });
                // Emit to websocket clients
                this.io.emit('chatUpdate', {
                    sessionId,
                    chat
                });
            }
            catch (error) {
                apiLogger_1.whatsappLogger.error(`Failed to handle chat upsert for ${sessionId}:`, error);
            }
        }
    }
    async handleContactsUpsert(sessionId, contacts) {
        for (const contact of contacts) {
            try {
                await this.dbService.upsertContact({
                    sessionId,
                    jid: contact.id,
                    name: contact.name,
                    pushName: contact.notify,
                    profilePicUrl: contact.imgUrl,
                    isBlocked: contact.blocked || false,
                    metadata: contact
                });
                // Emit to websocket clients
                this.io.emit('contactUpdate', {
                    sessionId,
                    contact
                });
            }
            catch (error) {
                apiLogger_1.whatsappLogger.error(`Failed to handle contact upsert for ${sessionId}:`, error);
            }
        }
    }
    async handleGroupsUpsert(sessionId, groups) {
        for (const group of groups) {
            try {
                await this.dbService.client.group.upsert({
                    where: {
                        sessionId_jid: {
                            sessionId,
                            jid: group.id
                        }
                    },
                    update: {
                        subject: group.subject,
                        description: group.desc,
                        owner: group.owner,
                        participants: group.participants,
                        settings: group,
                        metadata: group,
                        updatedAt: new Date()
                    },
                    create: {
                        sessionId,
                        jid: group.id,
                        subject: group.subject,
                        description: group.desc,
                        owner: group.owner,
                        participants: group.participants,
                        settings: group,
                        metadata: group
                    }
                });
                // Emit to websocket clients
                this.io.emit('groupUpdate', {
                    sessionId,
                    group
                });
            }
            catch (error) {
                apiLogger_1.whatsappLogger.error(`Failed to handle group upsert for ${sessionId}:`, error);
            }
        }
    }
    getMessageType(message) {
        if (message === null || message === void 0 ? void 0 : message.conversation)
            return 'TEXT';
        if (message === null || message === void 0 ? void 0 : message.extendedTextMessage)
            return 'TEXT';
        if (message === null || message === void 0 ? void 0 : message.imageMessage)
            return 'IMAGE';
        if (message === null || message === void 0 ? void 0 : message.videoMessage)
            return 'VIDEO';
        if (message === null || message === void 0 ? void 0 : message.audioMessage)
            return 'AUDIO';
        if (message === null || message === void 0 ? void 0 : message.documentMessage)
            return 'DOCUMENT';
        if (message === null || message === void 0 ? void 0 : message.stickerMessage)
            return 'STICKER';
        if (message === null || message === void 0 ? void 0 : message.locationMessage)
            return 'LOCATION';
        if (message === null || message === void 0 ? void 0 : message.contactMessage)
            return 'CONTACT';
        if (message === null || message === void 0 ? void 0 : message.pollCreationMessage)
            return 'POLL';
        if (message === null || message === void 0 ? void 0 : message.reactionMessage)
            return 'REACTION';
        return 'TEXT';
    }
    async updateSessionInDatabase(sessionId, data) {
        try {
            await this.dbService.updateSession(sessionId, data);
        }
        catch (error) {
            apiLogger_1.whatsappLogger.error(`Failed to update session ${sessionId} in database:`, error);
        }
    }
    emitSessionUpdate(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.io.emit('sessionUpdate', {
                sessionId,
                status: session.status,
                qrCode: session.qrCode,
                pairingCode: session.pairingCode,
                phoneNumber: session.phoneNumber,
                name: session.name,
                lastSeen: session.lastSeen
            });
        }
    }
    // Public methods for API endpoints
    async getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    async getAllSessions() {
        return Array.from(this.sessions.values());
    }
    async deleteSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session === null || session === void 0 ? void 0 : session.socket) {
            session.socket.end(undefined);
        }
        this.sessions.delete(sessionId);
        await this.dbService.deleteSession(sessionId);
    }
    async requestPairingCode(sessionId, phoneNumber) {
        const session = this.sessions.get(sessionId);
        if (!(session === null || session === void 0 ? void 0 : session.socket)) {
            throw new Error('Session not found or not initialized');
        }
        const code = await session.socket.requestPairingCode(phoneNumber);
        session.pairingCode = code;
        session.phoneNumber = phoneNumber;
        await this.updateSessionInDatabase(sessionId, {
            pairingCode: code,
            phoneNumber
        });
        this.emitSessionUpdate(sessionId);
        return code;
    }
    async sendMessage(sessionId, to, content) {
        const session = this.sessions.get(sessionId);
        if (!(session === null || session === void 0 ? void 0 : session.socket)) {
            throw new Error('Session not found or not connected');
        }
        if (session.status !== api_1.SessionStatus.CONNECTED) {
            throw new Error('Session not connected');
        }
        return await session.socket.sendMessage(to, content);
    }
    async shutdown() {
        apiLogger_1.logger.info('Shutting down WhatsApp service...');
        for (const [sessionId, session] of this.sessions) {
            if (session.socket) {
                try {
                    session.socket.end(undefined);
                }
                catch (error) {
                    apiLogger_1.whatsappLogger.error(`Error closing session ${sessionId}:`, error);
                }
            }
        }
        this.sessions.clear();
        await this.dbService.disconnect();
        apiLogger_1.logger.info('WhatsApp service shutdown complete');
    }
}
exports.WhatsAppService = WhatsAppService;
