"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationServiceError = void 0;
const entity_1 = require("../../entity");
const utils_1 = require("../../utils");
const anti_captcha_1 = __importDefault(require("./anti-captcha"));
const workerpool_1 = __importDefault(require("workerpool"));
const path_1 = require("path");
class SessionResult {
    constructor(valid = true, account, cookies, usageTime, usedProxy, usedUserAgent) {
        this.valid = valid;
        this.account = account;
        this.cookies = cookies;
        this.usageTime = usageTime;
        this.usedProxy = usedProxy;
        this.usedUserAgent = usedUserAgent;
    }
}
class AuthorizationService {
    constructor({ type, antiCaptchaKey, maxWorkers }) {
        this.antiCaptcha = anti_captcha_1.default;
        this.sessionsResults = [];
        this.antiCaptcha.setKey(antiCaptchaKey);
        this.type = type;
        this.threads = maxWorkers;
        this.running = false;
    }
    getAntiCaptcha() {
        return this.antiCaptcha;
    }
    getSessionsResults() {
        return this.sessionsResults;
    }
    start() {
        const workerPath = path_1.join(__dirname, AuthorizationService.WORKER_FILENAME);
        this.workerPool = workerpool_1.default.pool(workerPath, { maxWorkers: this.threads });
        this.running = true;
        return this;
    }
    async stop() {
        if (!this.running)
            return false;
        try {
            await this.workerPool?.terminate(true);
            this.sessionsResults = [];
            this.running = false;
        }
        catch (error) {
            utils_1.Logger.error("Terminating workers error:", error);
            throw error;
        }
        return true;
    }
    async authorize({ accounts, excludeSessions, proxies }) {
        if (!this.running)
            throw new AuthorizationServiceError("The worker pool is disabled");
        const { threads } = this;
        const excludeHashes = this.getHashFromSessions(excludeSessions);
        const unauthAccounts = this.getUnauthorizedAccounts(accounts, excludeHashes);
        const unauthAccountsChunks = utils_1.splitIntoChunks(unauthAccounts, threads);
        const proxyChunks = utils_1.splitIntoChunks(proxies, threads);
        let proxyChunkIndex = 0;
        const antiCaptchaKey = this.antiCaptcha.getKey();
        const pendingPromises = unauthAccountsChunks.map((unauthAccounts, accountIndex) => {
            const params = {
                antiCaptchaKey,
                accounts: unauthAccounts,
                proxies: proxyChunks[proxyChunkIndex++ % proxyChunks.length],
            };
            const options = { on: this.onAuthProgress.bind(this) };
            return this.workerPool.exec(AuthorizationService.WORKER_EXECUTE_METHOD, [params], options)
                .catch(error => utils_1.Logger.warn("Worker:", error.message));
        });
        const resolvedPromises = await Promise.allSettled(pendingPromises);
        resolvedPromises.forEach(result => {
            if (result.status == "rejected") {
                utils_1.Logger.error("Authorization error:", result.reason);
                return undefined;
            }
        });
        return this.sessionsResults;
    }
    onAuthProgress(payload) {
        switch (payload.type) {
            case "success": {
                const session = payload.data;
                this.sessionsResults.push(new SessionResult(true, session.account, session.cookies, session.lastUsageTime, session.lastUsedProxy, session.lastUsedUserAgent));
                break;
            }
            case "invalid_account": {
                const account = payload.data;
                this.sessionsResults.push(new SessionResult(false, account));
                break;
            }
        }
    }
    getHashFromSessions(sessions) {
        return sessions.map(session => session.accountHash).filter(hash => hash.length > 0);
    }
    getUnauthorizedAccounts(accounts, excludeHashes) {
        return accounts.filter(account => !excludeHashes.includes(entity_1.getAccountHash(account)));
    }
}
exports.default = AuthorizationService;
AuthorizationService.WORKER_FILENAME = "../../workers/auth.js";
AuthorizationService.WORKER_EXECUTE_METHOD = "runAuthorization";
class AuthorizationServiceError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AuthorizationServiceError = AuthorizationServiceError;
