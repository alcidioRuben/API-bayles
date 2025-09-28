export declare class WebhookService {
    private dbService;
    private retryQueue;
    constructor();
    sendWebhook(sessionId: string, event: string, payload: any): Promise<void>;
    private deliverWebhook;
    private updateDeliveryStatus;
    private handleWebhookError;
    private calculateRetryDelay;
    private createSignature;
    verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean>;
    testWebhook(webhookId: string): Promise<boolean>;
    getWebhookDeliveries(webhookId: string, limit?: number, offset?: number): Promise<{
        event: string;
        webhookId: string;
        status: import(".prisma/client").$Enums.WebhookStatus;
        response: string | null;
        id: string;
        createdAt: Date;
        payload: import("@prisma/client/runtime/library").JsonValue;
        updatedAt: Date;
        attempts: number;
        nextRetry: Date | null;
    }[]>;
    retryFailedDeliveries(webhookId: string): Promise<number>;
    cleanup(): Promise<void>;
}
