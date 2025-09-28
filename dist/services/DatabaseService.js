"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const client_1 = require("@prisma/client");
const apiLogger_1 = require("../Utils/apiLogger");
class DatabaseService {
    constructor() {
        this.prisma = new client_1.PrismaClient({
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'event',
                    level: 'error',
                },
                {
                    emit: 'event',
                    level: 'info',
                },
                {
                    emit: 'event',
                    level: 'warn',
                },
            ],
        });
        // Log database queries in development
        // Note: Prisma $on events are deprecated in newer versions
        /*
        if (process.env.NODE_ENV === 'development') {
          this.prisma.$on('query', (e: any) => {
            logger.debug({
              query: e.query,
              params: e.params,
              duration: e.duration
            }, 'Database Query');
          });
        }
    
        this.prisma.$on('error', (e: any) => {
          logger.error({
            target: e.target,
            message: e.message
          }, 'Database Error');
        });
    
        this.prisma.$on('info', (e: any) => {
          logger.info({
            target: e.target,
            message: e.message
          }, 'Database Info');
        });
    
        this.prisma.$on('warn', (e: any) => {
          logger.warn({
            target: e.target,
            message: e.message
          }, 'Database Warning');
        });
        */
    }
    async connect() {
        try {
            await this.prisma.$connect();
            apiLogger_1.logger.info('Database connected successfully');
        }
        catch (error) {
            apiLogger_1.logger.error('Failed to connect to database:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            apiLogger_1.logger.info('Database disconnected successfully');
        }
        catch (error) {
            apiLogger_1.logger.error('Failed to disconnect from database:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            // Simple query to check database connectivity
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            apiLogger_1.logger.error('Database health check failed:', error);
            throw error;
        }
    }
    // User operations
    async createUser(data) {
        return this.prisma.user.create({
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                apiKey: true,
                isActive: true,
                createdAt: true
            }
        });
    }
    async getUserByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
            include: {
                sessions: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        sessionId: true,
                        status: true,
                        phoneNumber: true,
                        name: true,
                        lastSeen: true
                    }
                }
            }
        });
    }
    async getUserByApiKey(apiKey) {
        return this.prisma.user.findUnique({
            where: { apiKey },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                apiKey: true,
                isActive: true
            }
        });
    }
    // Session operations
    async createSession(data) {
        return this.prisma.session.create({
            data
        });
    }
    async updateSession(sessionId, data) {
        return this.prisma.session.update({
            where: { sessionId },
            data
        });
    }
    async getSession(sessionId) {
        return this.prisma.session.findUnique({
            where: { sessionId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                }
            }
        });
    }
    async getUserSessions(userId) {
        return this.prisma.session.findMany({
            where: { userId, isActive: true },
            orderBy: { lastSeen: 'desc' }
        });
    }
    async deleteSession(sessionId) {
        return this.prisma.session.update({
            where: { sessionId },
            data: { isActive: false }
        });
    }
    // Message operations
    async saveMessage(data) {
        return this.prisma.message.create({
            data: {
                ...data,
                messageType: data.messageType
            }
        });
    }
    async updateMessageStatus(messageId, sessionId, status) {
        return this.prisma.message.updateMany({
            where: { messageId, sessionId },
            data: { status: status }
        });
    }
    async getMessages(sessionId, chatId, limit = 50, offset = 0) {
        return this.prisma.message.findMany({
            where: {
                sessionId,
                ...(chatId && { chatId })
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
            skip: offset
        });
    }
    // Chat operations
    async upsertChat(data) {
        return this.prisma.chat.upsert({
            where: {
                sessionId_jid: {
                    sessionId: data.sessionId,
                    jid: data.jid
                }
            },
            update: {
                name: data.name,
                isArchived: data.isArchived,
                isPinned: data.isPinned,
                isMuted: data.isMuted,
                unreadCount: data.unreadCount,
                lastMessage: data.lastMessage,
                metadata: data.metadata,
                updatedAt: new Date()
            },
            create: data
        });
    }
    async getChats(sessionId) {
        return this.prisma.chat.findMany({
            where: { sessionId },
            orderBy: { updatedAt: 'desc' }
        });
    }
    // Contact operations
    async upsertContact(data) {
        return this.prisma.contact.upsert({
            where: {
                sessionId_jid: {
                    sessionId: data.sessionId,
                    jid: data.jid
                }
            },
            update: {
                name: data.name,
                pushName: data.pushName,
                profilePicUrl: data.profilePicUrl,
                isBlocked: data.isBlocked,
                metadata: data.metadata,
                updatedAt: new Date()
            },
            create: data
        });
    }
    async getContacts(sessionId) {
        return this.prisma.contact.findMany({
            where: { sessionId },
            orderBy: { name: 'asc' }
        });
    }
    // Webhook operations
    async createWebhook(data) {
        return this.prisma.webhook.create({
            data
        });
    }
    async getUserWebhooks(userId) {
        return this.prisma.webhook.findMany({
            where: { userId, isActive: true }
        });
    }
    async updateWebhook(id, data) {
        return this.prisma.webhook.update({
            where: { id },
            data
        });
    }
    async deleteWebhook(id) {
        return this.prisma.webhook.update({
            where: { id },
            data: { isActive: false }
        });
    }
    // API Usage operations
    async getApiUsageStats(userId, startDate, endDate) {
        return this.prisma.apiUsage.groupBy({
            by: ['endpoint', 'method'],
            where: {
                userId,
                timestamp: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _count: {
                id: true
            },
            _avg: {
                duration: true
            }
        });
    }
    async getDashboardStats(userId) {
        const where = userId ? { userId } : {};
        const [totalSessions, activeSessions, totalMessages, messagesLast24h, totalUsers, apiCallsLast24h] = await Promise.all([
            this.prisma.session.count({ where: { ...where, isActive: true } }),
            this.prisma.session.count({
                where: {
                    ...where,
                    isActive: true,
                    status: 'CONNECTED'
                }
            }),
            this.prisma.message.count({ where: userId ? { session: { userId } } : {} }),
            this.prisma.message.count({
                where: {
                    ...(userId ? { session: { userId } } : {}),
                    timestamp: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            }),
            userId ? 1 : this.prisma.user.count({ where: { isActive: true } }),
            this.prisma.apiUsage.count({
                where: {
                    ...where,
                    timestamp: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);
        return {
            totalSessions,
            activeSessions,
            totalMessages,
            messagesLast24h,
            totalUsers,
            apiCallsLast24h
        };
    }
    get client() {
        return this.prisma;
    }
}
exports.DatabaseService = DatabaseService;
