"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookEvent = exports.MessageType = exports.SessionStatus = void 0;
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["CONNECTING"] = "CONNECTING";
    SessionStatus["CONNECTED"] = "CONNECTED";
    SessionStatus["DISCONNECTED"] = "DISCONNECTED";
    SessionStatus["QR_REQUIRED"] = "QR_REQUIRED";
    SessionStatus["PAIRING_REQUIRED"] = "PAIRING_REQUIRED";
    SessionStatus["ERROR"] = "ERROR";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["VIDEO"] = "video";
    MessageType["AUDIO"] = "audio";
    MessageType["DOCUMENT"] = "document";
    MessageType["STICKER"] = "sticker";
    MessageType["LOCATION"] = "location";
    MessageType["CONTACT"] = "contact";
    MessageType["POLL"] = "poll";
    MessageType["REACTION"] = "reaction";
})(MessageType || (exports.MessageType = MessageType = {}));
var WebhookEvent;
(function (WebhookEvent) {
    WebhookEvent["MESSAGE_RECEIVED"] = "message.received";
    WebhookEvent["MESSAGE_SENT"] = "message.sent";
    WebhookEvent["MESSAGE_UPDATED"] = "message.updated";
    WebhookEvent["CHAT_UPDATED"] = "chat.updated";
    WebhookEvent["GROUP_UPDATED"] = "group.updated";
    WebhookEvent["CONTACT_UPDATED"] = "contact.updated";
    WebhookEvent["CONNECTION_UPDATED"] = "connection.updated";
    WebhookEvent["PRESENCE_UPDATED"] = "presence.updated";
})(WebhookEvent || (exports.WebhookEvent = WebhookEvent = {}));
