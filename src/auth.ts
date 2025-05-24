import { v4 as uuidv4 } from 'uuid';

export class AuthManager {
    private sessionTokens: Set<string> = new Set();
    private accessKey: string;

    constructor() {
        this.accessKey = this.generateAccessKey();
    }

    private generateAccessKey(): string {
        return uuidv4().replace(/-/g, '').substring(0, 16);
    }

    generateSessionToken(): string {
        const token = uuidv4();
        this.sessionTokens.add(token);
        return token;
    }

    validateSessionToken(token: string): boolean {
        return this.sessionTokens.has(token);
    }

    revokeSessionToken(token: string): void {
        this.sessionTokens.delete(token);
    }

    getAccessKey(): string {
        return this.accessKey;
    }

    regenerateAccessKey(): string {
        this.accessKey = this.generateAccessKey();
        // Clear all existing session tokens when access key changes
        this.sessionTokens.clear();
        return this.accessKey;
    }

    clearAllSessions(): void {
        this.sessionTokens.clear();
    }
} 