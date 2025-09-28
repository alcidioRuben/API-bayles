import { Server as SocketIOServer } from 'socket.io';
import { WhatsAppService } from './services/WhatsAppService';
declare const app: import("express-serve-static-core").Express;
declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
declare const whatsAppService: WhatsAppService;
export { app, io, whatsAppService };
