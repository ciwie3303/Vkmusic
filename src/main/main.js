"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ILA = void 0;
const os_1 = __importDefault(require("os"));
const proxy_1 = __importDefault(require("../library/net/proxy"));
const data_storage_1 = require("./base/storage/data-storage");
const entity_1 = require("./entity");
const logger_1 = require("./utils/logger");
const session_1 = require("./providers/session");
const listener_1 = require("./base/listener");
const audio_1 = require("../library/vk_api/audio");
const auth_1 = __importDefault(require("./base/auth"));
const general_1 = require("../library/vk_api/general");
const utils_1 = require("./utils");
const state_1 = require("./state");
const helpers_1 = require("../library/utils/helpers");
const events_1 = require("./events");
class ILATimers {
    constructor() {
        this.timers = new Map();
    }
    register(name, timerId) {
        this.timers.set(name, timerId);
        return this;
    }
    unregister(name) {
        let timerId = this.timers.get(name);
        if (!timerId)
            return this;
        clearTimeout(timerId);
        this.timers.delete(name);
        return this;
    }
    clear() {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        return this;
    }
}
class ILA {
    constructor(options) {
        this.options = options;
        this.initialization = false;
        this.events = [];
        this.timers = new ILATimers();
        this.stateManager = new state_1.ILAStateManager(this);
        this.stateManager.setStateHandler(3, {
            async enter(context) {
                const { sessions } = context.storage.cache.data;
                if (sessions.length < 1) {
                    logger_1.Logger.log("Sessions are empty for start the audio listener!");
                    return;
                }
                logger_1.Logger.log("Listener starting...");
                context.pushEvent("listening", { sessions });
                context.listener.setSessions(sessions);
                context.listener.start();
            },
            async leave(context) {
                logger_1.Logger.log("Listener stoping....");
                await context.listener.stop();
            }
        });
        this.stateManager.setStateHandler(1, {
            async enter(context) {
                const cacheReference = context.storage.cache.data;
                const accounts = context.storage.accounts.data;
                const { sessions } = cacheReference;
                const { skipAuthorization, threads } = context.storage.settings.data;
                if (skipAuthorization) {
                    context.changeState(3);
                    return this;
                }
                context.pushEvent("authorization", { accounts });
                try {
                    const cpusNumber = os_1.default.cpus().length;
                    logger_1.Logger.log("Number of threads of your computer:", cpusNumber);
                    if (threads > cpusNumber) {
                        logger_1.Logger.warn("Recommended number of threads:", cpusNumber);
                        logger_1.Logger.warn("You specified the", threads);
                    }
                    const proxies = context.fetchMergedProxies();
                    await context.authorization.start();
                    logger_1.Logger.log("Authorization the accounts...");
                    const result = await context.authorization.authorize({
                        excludeSessions: sessions,
                        accounts, proxies
                    });
                    await context.processAuthorizationResult(result);
                }
                catch (error) {
                    logger_1.Logger.error(error);
                }
                finally {
                    await context.authorization.stop();
                    await context.changeAccountsPassword();
                    await context.storage.cache.saveAsync();
                    context.changeState(3);
                }
                return this;
            },
            async leave() { }
        });
        this.stateManager.setStateHandler(2, {
            async enter(context) {
                await context.updateSessions();
                await context.stateManager.restoreState();
            },
            async leave() {
                logger_1.Logger.log("Session updating is ended");
            }
        });
        this.initMainServices();
    }
    async start() {
        if (!this.initialization) {
            await this.init();
        }
        await this.changeState(2);
        await this.changeState(1);
    }
    async restart() {
        logger_1.Logger.log("Restarting...");
        try {
            this.timers.clear();
            this.listener.clear();
            this.authorization.stop();
            this.initialization = false;
        }
        catch (error) {
            logger_1.Logger.error("Restart error:", error);
        }
    }
    async stop() {
        await this.saveTemporaryData();
        await this.listener.stop();
        await this.authorization.stop();
        return this.storage.cache.saveAsync();
    }
    clearAccounts() {
        const { accounts } = this.storage;
        accounts.data = [];
        accounts.save();
        return this;
    }
    getEvents() {
        return this.events;
    }
    pushEvent(type, data) {
        if (this.events.length >= events_1.MAX_EVENTS_TO_SHOW) {
            this.events.shift();
        }
        this.events.push({
            type,
            payload: {
                date: Date.now(),
                data
            }
        });
    }
    changeState(state) {
        return this.stateManager.changeState(state);
    }
    addAccounts(raw) {
        const { accounts } = this.storage;
        if (!accounts.validateInput(raw))
            throw new Error("Входные данные имеют некорректный для аккаунтов формат");
        raw = accounts.transform(raw);
        const uniqueAccounts = getUniqueAccounts(accounts.data.concat(raw));
        logger_1.Logger.log(`Adding the ${raw.length} account(-s), unique accounts: ${uniqueAccounts.length}`);
        accounts.data = uniqueAccounts;
        accounts.save();
        return this;
    }
    setSettings(params) {
        const { settings } = this.storage;
        settings.data = {
            ...settings.data,
            ...params
        };
        settings.save();
        return this;
    }
    async init() {
        if (this.initialization)
            return this;
        logger_1.Logger.log("Initialization...");
        this.pushEvent("initializing");
        utils_1.initLogger();
        await audio_1.VKAudio.loadAudioEnum();
        await this.initCache();
        await this.initAntiCaptcha();
        await this.initAccounts();
        this.storage.saveAll();
        this.initialization = true;
        printDataStorageAmount(this.storage);
        return this;
    }
    initMainServices() {
        this.initStorage();
        const { cache, settings } = this.storage;
        const { sessions } = cache.data;
        const { antiCaptchaKey, listeningMode, threads } = settings.data;
        this.listener = new listener_1.AudioListener({
            method: listeningMode,
            workerThreads: threads,
            sessions
        });
        this.authorization = new auth_1.default({
            antiCaptchaKey: antiCaptchaKey,
            maxWorkers: threads,
            type: "mobile"
        });
        return this;
    }
    initStorage() {
        this.storage = new data_storage_1.DataStorage({
            rootPath: this.options.rootPath,
            ...utils_1.DATA_STORAGE_DEFAULTS
        });
        this.storage.init();
    }
    initCache() {
        const { cache } = this.storage;
        const { sessions, tasks } = cache.data;
        logger_1.Logger.log("Initializing cache...");
        logger_1.Logger.log("Initializing sessions...");
        sessions.forEach(session => {
            if (!session.lastUsedUserAgent) {
                session.lastUsedUserAgent = helpers_1.randomUserAgent();
            }
        });
        logger_1.Logger.log("Initializing listener tasks...");
        this.listener.clear();
        this.listener.registerTask(...tasks.map(listener_1.Task.create));
    }
    async initAntiCaptcha() {
        try {
            let balance = await this.authorization.getAntiCaptcha().checkAndGetBalance();
            logger_1.Logger.log(`Current anti-captcha balance: ${balance.toFixed(2)}$`);
        }
        catch (error) {
            logger_1.Logger.warn(error.message);
        }
    }
    initAccounts() {
        let accounts = this.storage.accounts;
        accounts.data = getUniqueAccounts(accounts.data);
        return this;
    }
    async updateSessions() {
        const { cache } = this.storage;
        const { data } = cache;
        try {
            logger_1.Logger.log("Updating sessions...");
            this.pushEvent("sessions_updating", { sessions: data.sessions });
            const initCount = data.sessions.length;
            data.sessions = await session_1.filterSessions(data.sessions);
            logger_1.Logger.log(`Updated sessions: ${data.sessions.length} of ${initCount}`);
        }
        catch (error) { }
    }
    async saveTemporaryData() {
        const { cache, settings } = this.storage;
        const sessionResults = this.authorization.getSessionsResults();
        if (sessionResults.length > 0)
            await this.processAuthorizationResult(sessionResults);
        if (!cache.data.tasksHistory) {
            cache.data.tasksHistory = [];
        }
        cache.data.tasks = this.listener.getTasks();
        cache.data.tasksHistory = [
            ...this.listener.getHistory().reverse(),
            ...cache.data.tasksHistory,
        ].splice(0, settings.data.maxTasksHistoryCapacity || 20);
        this.storage.saveAll();
        return this;
    }
    async processAuthorizationResult(results) {
        const { cache, accounts } = this.storage;
        const { sessions } = cache.data;
        let authAccountsCount = 0;
        for (const sessionResult of results) {
            const accountHash = entity_1.getAccountHash(sessionResult.account);
            if (!sessionResult.valid) {
                const index = accounts.data.findIndex(account => entity_1.getAccountHash(account) == accountHash);
                if (index == -1)
                    continue;
                accounts.data[index].valid = false;
                logger_1.Logger.log(`Marked account ${accounts.data[index].hash} as invalid`);
                continue;
            }
            authAccountsCount++;
            const sessionData = {
                accountHash,
                cookies: sessionResult.cookies,
                lastUsageTime: sessionResult.usageTime,
                lastUsedProxy: sessionResult.usedProxy,
                lastUsedUserAgent: sessionResult.usedUserAgent
            };
            const existsIndex = sessions.findIndex(session => session.accountHash == accountHash);
            if (existsIndex != -1) {
                sessions[existsIndex] = sessionData;
                continue;
            }
            sessions.push(sessionData);
        }
        logger_1.Logger.log(`Success authorized ${authAccountsCount} of ${results.length} account(-s)`);
        await this.removeInvalidAccounts();
        return this;
    }
    removeInvalidAccounts() {
        logger_1.Logger.log("Removing the invalid accounts...");
        const accounts = this.storage.accounts;
        const validAccounts = accounts.data.filter(account => account.valid);
        const deletedSize = accounts.data.length - validAccounts.length;
        accounts.data = validAccounts;
        accounts.save();
        logger_1.Logger.log(`Invalid accounts (${deletedSize}) are deleted!`);
    }
    async changeAccountsPassword() {
        const { cache, settings } = this.storage;
        const { sessions } = cache.data;
        const { data: accounts } = this.storage.accounts;
        if (settings.data.skipPasswordChanging)
            return;
        logger_1.Logger.log("Start changing the password of accounts...");
        for (let session of sessions) {
            try {
                const general = new general_1.VKGeneral({
                    session: session.cookies,
                    proxy: session.lastUsedProxy && proxy_1.default.from(session.lastUsedProxy),
                    userAgent: session.lastUsedUserAgent
                });
                const accountIndex = accounts.findIndex(account => entity_1.getAccountHash(account) == session.accountHash);
                if (accountIndex == -1)
                    continue;
                const account = accounts[accountIndex];
                if (account.password == utils_1.ACCOUNT_DEFAULT_PASSWORD)
                    continue;
                const result = await general.changePassword(account.password, utils_1.ACCOUNT_DEFAULT_PASSWORD);
                if (result) {
                    logger_1.Logger.log(`The password of account (${account.login}:${account.password}) is changed to "${utils_1.ACCOUNT_DEFAULT_PASSWORD}"`);
                    account.password = utils_1.ACCOUNT_DEFAULT_PASSWORD;
                    session.accountHash = entity_1.getAccountHash(account);
                    session.cookies = await general.getCookies();
                }
            }
            catch (error) {
                logger_1.Logger.error("Error when we changing the password", error);
            }
        }
        settings.data.skipPasswordChanging = true;
        settings.save();
        cache.save();
    }
    fetchMergedProxies() {
        let httpProxy = this.storage.httpProxy.data;
        let socksProxy = this.storage.socksProxy.data;
        return httpProxy.concat(socksProxy);
    }
}
exports.ILA = ILA;
function printDataStorageAmount(storage) {
    const { httpProxy, socksProxy, accounts, cache, settings } = storage;
    const settingsData = settings.data;
    logger_1.Logger.log("Settings:\n" +
        `\t- bot token: ${settingsData.botToken}\n` +
        `\t- bot password: ${settingsData.botPassword}\n` +
        `\t- threads number: ${settingsData.threads}\n` +
        `\t- listening mode: ${settingsData.listeningMode}\n` +
        `\t- max tasks history size: ${settingsData.maxTasksHistoryCapacity}\n` +
        `\t- anticaptcha key: ${settingsData.antiCaptchaKey || "absent"}\n` +
        `\t- enable authorization: ${!settingsData.skipAuthorization}\n` +
        `\t- enable session checking: ${!settingsData.skipSessionChecking}\n` +
        `\t- enable password changing: ${!settingsData.skipPasswordChanging}\n`);
    logger_1.Logger.log("HTTP proxy count:", httpProxy.data.length);
    logger_1.Logger.log("SOCKS proxy count:", socksProxy.data.length);
    logger_1.Logger.log("Accounts count:", accounts.data.length);
    logger_1.Logger.log("Sessions count:", cache.data.sessions.length);
    logger_1.Logger.log("Tasks count:", cache.data.tasks.length);
    logger_1.Logger.log("Tasks history count:", cache.data.tasksHistory.length);
}
function getUniqueAccounts(accounts) {
    let uniqueAccounts = [];
    accounts.forEach(account => {
        let has = uniqueAccounts.find(uniqueAccount => (uniqueAccount.login == account.login) && (uniqueAccount.password == account.password));
        if (!has)
            uniqueAccounts.push(account);
    });
    return uniqueAccounts;
}
