import { PrismaClient } from '@prisma/client';
export declare class DatabaseService {
    private prisma;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
    createUser(data: {
        email: string;
        name?: string;
        password: string;
        role?: 'USER' | 'ADMIN';
    }): Promise<{
        email: string;
        id: string;
        name: string | null;
        createdAt: Date;
        apiKey: string;
        isActive: boolean;
        role: import(".prisma/client").$Enums.Role;
    }>;
    getUserByEmail(email: string): Promise<({
        sessions: {
            sessionId: string;
            status: import(".prisma/client").$Enums.SessionStatus;
            id: string;
            name: string | null;
            phoneNumber: string | null;
            lastSeen: Date | null;
        }[];
    } & {
        email: string;
        id: string;
        name: string | null;
        createdAt: Date;
        apiKey: string;
        password: string;
        isActive: boolean;
        role: import(".prisma/client").$Enums.Role;
        updatedAt: Date;
    }) | null>;
    getUserByApiKey(apiKey: string): Promise<{
        email: string;
        id: string;
        name: string | null;
        apiKey: string;
        isActive: boolean;
        role: import(".prisma/client").$Enums.Role;
    } | null>;
    createSession(data: {
        sessionId: string;
        userId: string;
        phoneNumber?: string;
        name?: string;
    }): Promise<{
        userId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        id: string;
        name: string | null;
        createdAt: Date;
        pairingCode: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        updatedAt: Date;
        phoneNumber: string | null;
        qrCode: string | null;
        lastSeen: Date | null;
        authData: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateSession(sessionId: string, data: any): Promise<{
        userId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        id: string;
        name: string | null;
        createdAt: Date;
        pairingCode: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        updatedAt: Date;
        phoneNumber: string | null;
        qrCode: string | null;
        lastSeen: Date | null;
        authData: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getSession(sessionId: string): Promise<({
        user: {
            email: string;
            id: string;
            name: string | null;
        };
    } & {
        userId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        id: string;
        name: string | null;
        createdAt: Date;
        pairingCode: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        updatedAt: Date;
        phoneNumber: string | null;
        qrCode: string | null;
        lastSeen: Date | null;
        authData: import("@prisma/client/runtime/library").JsonValue | null;
    }) | null>;
    getUserSessions(userId: string): Promise<{
        userId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        id: string;
        name: string | null;
        createdAt: Date;
        pairingCode: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        updatedAt: Date;
        phoneNumber: string | null;
        qrCode: string | null;
        lastSeen: Date | null;
        authData: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    deleteSession(sessionId: string): Promise<{
        userId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        id: string;
        name: string | null;
        createdAt: Date;
        pairingCode: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        isActive: boolean;
        updatedAt: Date;
        phoneNumber: string | null;
        qrCode: string | null;
        lastSeen: Date | null;
        authData: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    saveMessage(data: {
        messageId: string;
        sessionId: string;
        chatId: string;
        fromMe: boolean;
        fromJid?: string;
        toJid: string;
        messageType: string;
        content: any;
        timestamp: Date;
        quotedMessage?: string;
        metadata?: any;
    }): Promise<{
        sessionId: string;
        status: import(".prisma/client").$Enums.MessageStatus;
        timestamp: Date;
        id: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        fromMe: boolean;
        messageType: import(".prisma/client").$Enums.MessageType;
        messageId: string;
        chatId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        fromJid: string | null;
        toJid: string;
        quotedMessage: string | null;
    }>;
    updateMessageStatus(messageId: string, sessionId: string, status: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getMessages(sessionId: string, chatId?: string, limit?: number, offset?: number): Promise<{
        sessionId: string;
        status: import(".prisma/client").$Enums.MessageStatus;
        timestamp: Date;
        id: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        fromMe: boolean;
        messageType: import(".prisma/client").$Enums.MessageType;
        messageId: string;
        chatId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        fromJid: string | null;
        toJid: string;
        quotedMessage: string | null;
    }[]>;
    upsertChat(data: {
        sessionId: string;
        jid: string;
        name?: string;
        isGroup: boolean;
        isArchived?: boolean;
        isPinned?: boolean;
        isMuted?: boolean;
        unreadCount?: number;
        lastMessage?: any;
        metadata?: any;
    }): Promise<{
        sessionId: string;
        id: string;
        jid: string;
        name: string | null;
        unreadCount: number;
        createdAt: Date;
        isArchived: boolean;
        isPinned: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        isGroup: boolean;
        isMuted: boolean;
        lastMessage: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getChats(sessionId: string): Promise<{
        sessionId: string;
        id: string;
        jid: string;
        name: string | null;
        unreadCount: number;
        createdAt: Date;
        isArchived: boolean;
        isPinned: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        isGroup: boolean;
        isMuted: boolean;
        lastMessage: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    upsertContact(data: {
        sessionId: string;
        jid: string;
        name?: string;
        pushName?: string;
        profilePicUrl?: string;
        isBlocked?: boolean;
        metadata?: any;
    }): Promise<{
        sessionId: string;
        id: string;
        jid: string;
        name: string | null;
        pushName: string | null;
        createdAt: Date;
        isBlocked: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        profilePicUrl: string | null;
    }>;
    getContacts(sessionId: string): Promise<{
        sessionId: string;
        id: string;
        jid: string;
        name: string | null;
        pushName: string | null;
        createdAt: Date;
        isBlocked: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        updatedAt: Date;
        profilePicUrl: string | null;
    }[]>;
    createWebhook(data: {
        userId: string;
        url: string;
        events: string[];
        secret?: string;
        maxRetries?: number;
    }): Promise<{
        userId: string;
        url: string;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        events: string[];
        isActive: boolean;
        updatedAt: Date;
        secret: string | null;
        retries: number;
        maxRetries: number;
        lastError: string | null;
    }>;
    getUserWebhooks(userId: string): Promise<{
        userId: string;
        url: string;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        events: string[];
        isActive: boolean;
        updatedAt: Date;
        secret: string | null;
        retries: number;
        maxRetries: number;
        lastError: string | null;
    }[]>;
    updateWebhook(id: string, data: any): Promise<{
        userId: string;
        url: string;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        events: string[];
        isActive: boolean;
        updatedAt: Date;
        secret: string | null;
        retries: number;
        maxRetries: number;
        lastError: string | null;
    }>;
    deleteWebhook(id: string): Promise<{
        userId: string;
        url: string;
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        events: string[];
        isActive: boolean;
        updatedAt: Date;
        secret: string | null;
        retries: number;
        maxRetries: number;
        lastError: string | null;
    }>;
    getApiUsageStats(userId: string, startDate: Date, endDate: Date): Promise<(import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.ApiUsageGroupByOutputType, ("endpoint" | "method")[]> & {
        _count: {
            id: number;
        };
        _avg: {
            duration: number | null;
        };
    })[]>;
    getDashboardStats(userId?: string): Promise<{
        totalSessions: number;
        activeSessions: number;
        totalMessages: number;
        messagesLast24h: number;
        totalUsers: number;
        apiCallsLast24h: number;
    }>;
    get client(): PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
