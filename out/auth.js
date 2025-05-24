"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
const uuid_1 = require("uuid");
class AuthManager {
    constructor() {
        this.sessionTokens = new Set();
        this.accessKey = this.generateAccessKey();
    }
    generateAccessKey() {
        return (0, uuid_1.v4)().replace(/-/g, '').substring(0, 16);
    }
    generateSessionToken() {
        const token = (0, uuid_1.v4)();
        this.sessionTokens.add(token);
        return token;
    }
    validateSessionToken(token) {
        return this.sessionTokens.has(token);
    }
    revokeSessionToken(token) {
        this.sessionTokens.delete(token);
    }
    getAccessKey() {
        return this.accessKey;
    }
    regenerateAccessKey() {
        this.accessKey = this.generateAccessKey();
        // Clear all existing session tokens when access key changes
        this.sessionTokens.clear();
        return this.accessKey;
    }
    clearAllSessions() {
        this.sessionTokens.clear();
    }
}
exports.AuthManager = AuthManager;
//# sourceMappingURL=auth.js.map