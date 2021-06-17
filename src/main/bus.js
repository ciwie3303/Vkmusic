"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getILABus = exports.setIlaInstance = exports.ILABus = void 0;
const fs_1 = require("fs");
const util_1 = require("util");
const utils_1 = require("./utils");
const listener_1 = require("./base/listener");
const vk_api_1 = require("../library/vk_api");
const readFileAsync = util_1.promisify(fs_1.readFile);
class ILAController {
    constructor(parent, context) {
        this.parent = parent;
        this.context = context;
    }
}
class ProxyController extends ILAController {
    async addProxy(type, data) {
        const raw = data.toString("utf-8");
        const proxy = this.getProxyStorage(type);
        if (!proxy.validateInput(raw))
            throw new Error("Входные данные не содержат прокси-адресов");
        let result = proxy.transform(raw);
        proxy.data = proxy.data.concat(result);
        await proxy.saveAsync();
    }
    async getProxyFile(type) {
        const proxy = this.getProxyStorage(type);
        const buffer = await readFileAsync(proxy.path);
        return {
            type,
            data: proxy.data,
            file: {
                size: buffer.byteLength,
                buffer
            }
        };
    }
    getProxy() {
        const { storage } = this.context;
        return {
            socks: storage.socksProxy.data,
            http: storage.httpProxy.data
        };
    }
    getProxyStorage(type) {
        const { storage } = this.context;
        let proxy;
        switch (type) {
            case "http":
            case "https":
                proxy = storage.httpProxy;
                break;
            case "socks":
            case "socks4":
            case "socks5":
                proxy = storage.socksProxy;
                break;
        }
        return proxy;
    }
}
class AccountsController extends ILAController {
    async addAccounts(data) {
        const raw = data.toString("utf-8");
        this.context.addAccounts(raw);
        this.context.stateManager.changeState(1);
    }
    clearAccounts() {
        this.context.clearAccounts();
    }
    getAcccountsFile() {
        const { storage } = this.context;
        return readFileAsync(storage.accounts.path);
    }
    getAccounts() {
        const { storage } = this.context;
        return storage.accounts.data;
    }
}
class ListensController extends ILAController {
    constructor(parent, context) {
        super(parent, context);
    }
    getHistory() {
        const { cache } = this.context.storage;
        return cache.data.tasksHistory;
    }
    getMetrics() {
        return this.context.listener.getMetrics();
    }
    isRunning() {
        return this.context.listener.isRunning();
    }
    run() {
        return this.context.listener.start();
    }
    stop() {
        return this.context.listener.stop();
    }
    getTasks() {
        const { listener } = this.context;
        return listener.getTasks();
    }
    async addTask(options) {
        const playlistInfo = utils_1.parsePlaylistUrl(options.playlistUrl);
        if (!playlistInfo)
            throw new Error("Некорректная ссылка на плейлист");
        const { vk } = this.parent;
        const playlistContent = await vk.audio.fetchPlaylist(playlistInfo);
        const actualListens = Number(playlistContent.listens);
        const totalCount = Number(options.totalCount);
        const task = listener_1.Task.create({
            speed: 0,
            enabled: true,
            playlistMeta: playlistInfo,
            actualCount: actualListens,
            initialCount: actualListens,
            priority: options.priority,
            requiredCount: totalCount
        });
        await this.context.listener.registerTask(task);
        await this.context.saveTemporaryData();
        return task;
    }
    editTask(id, task) {
        return this.context.listener.editTask(id, task);
    }
    deleteTask(id) {
        console.log(`deleteTask(${id}): executing...`);
        return this.context.listener.releaseTask(id);
    }
}
class SettingsController extends ILAController {
    getSettings() {
        const { settings } = this.context.storage;
        return settings.data;
    }
    async setPasswordChangeState(value) {
        const { settings } = this.context.storage;
        settings.data.skipPasswordChanging = !value;
        await settings.saveAsync();
    }
    async setAuthorizationState(value) {
        const { settings } = this.context.storage;
        settings.data.skipAuthorization = !value;
        await settings.saveAsync();
    }
    async getAntiCaptchaBalance(key) {
        try {
            const antiCaptcha = this.context.authorization.getAntiCaptcha();
            let valid = await antiCaptcha.isValidKey(key);
            if (!valid)
                throw new Error();
            return antiCaptcha.getBalance();
        }
        catch (error) {
            throw new Error("Неправильный ключ от анти-капчи");
        }
    }
    async setAntiCaptchaKey(key) {
        const { authorization, storage } = this.context;
        const settings = storage.settings;
        const antiCaptcha = authorization.getAntiCaptcha();
        try {
            let valid = await antiCaptcha.isValidKey(key);
            if (!valid)
                throw new Error();
            await antiCaptcha.setKey(key);
            settings.data.antiCaptchaKey = key;
            await settings.saveAsync();
        }
        catch (error) {
            throw new Error("Неправильный ключ от анти-капчи");
        }
    }
}
class ILABus {
    constructor(context, options) {
        this.context = context;
        this.vk = new vk_api_1.VK();
        this.proxy = new ProxyController(this, context);
        this.listens = new ListensController(this, context);
        this.accounts = new AccountsController(this, context);
        this.settings = new SettingsController(this, context);
    }
    getCache() {
        return this.context.storage.cache.data;
    }
    getEvents() {
        return this.context.getEvents();
    }
    saveState() {
        return this.context.saveTemporaryData();
    }
    stop() {
        return this.context.stop();
    }
    async restart() {
        return this.context.restart();
    }
}
exports.ILABus = ILABus;
let ilaBusInstance;
const setIlaInstance = (ila, busOptions = {}) => {
    const bus = new ILABus(ila, busOptions);
    ilaBusInstance = bus;
    return bus;
};
exports.setIlaInstance = setIlaInstance;
const getILABus = () => {
    if (!ilaBusInstance)
        throw new Error("ILA bus is not inited");
    return ilaBusInstance;
};
exports.getILABus = getILABus;
