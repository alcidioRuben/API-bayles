import { Server as SocketIOServer } from 'socket.io';
import { AnyMessageContent } from '../index';
import { WhatsAppSession } from '../Types/api';
export declare class WhatsAppService {
    private sessions;
    private io;
    private dbService;
    private webhookService;
    constructor(io: SocketIOServer);
    createSession(sessionId: string, userId: string, usePairingCode?: boolean): Promise<WhatsAppSession>;
    private initializeWhatsAppConnection;
    private handleConnectionUpdate;
    private handleMessagesUpsert;
    private handleMessagesUpdate;
    private handleChatsUpsert;
    private handleContactsUpsert;
    private handleGroupsUpsert;
    private getMessageType;
    private updateSessionInDatabase;
    private emitSessionUpdate;
    getSession(sessionId: string): Promise<WhatsAppSession | undefined>;
    getAllSessions(): Promise<WhatsAppSession[]>;
    deleteSession(sessionId: string): Promise<void>;
    requestPairingCode(sessionId: string, phoneNumber: string): Promise<string>;
    sendMessage(sessionId: string, to: string, content: AnyMessageContent): Promise<any>;
    shutdown(): Promise<void>;
}
