"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const proxy_1 = __importStar(require("../../../library/net/proxy"));
const file_assistant_1 = require("../../../library/file_assistant");
const entity_1 = require("../../entity");
const utils_1 = require("../../utils");
class DataStorage {
    constructor(options) {
        this.dataFolderPath = path_1.join(options.rootPath, utils_1.DATA_FOLDER_FILENAME);
        this.accounts = new file_assistant_1.FileStorage({
            path: path_1.join(this.dataFolderPath, options.accountsFilename),
            validateInput(data) {
                return utils_1.ACCOUNTS_TEXT_PATTERN.test(data);
            },
            transformInput(content) {
                const lines = content.split(/\r\n|\n/);
                const accounts = [];
                for (let line of lines) {
                    line = line.trim();
                    if (!line)
                        continue;
                    let [login, password] = line.split(":");
                    login = login.trim();
                    password = password.trim();
                    const account = {
                        valid: true,
                        login, password
                    };
                    account.hash = entity_1.getAccountHash(account);
                    accounts.push(account);
                }
                return accounts;
            },
            transformOutput(accounts) {
                return accounts
                    .map(({ login, password }) => {
                    if (!login || !password)
                        return;
                    return `${login}:${password}`;
                })
                    .filter(account => account)
                    .join("\n");
            }
        });
        this.cache = new file_assistant_1.FileStorage({
            path: path_1.join(this.dataFolderPath, options.cacheFilename),
            transformInput: (raw) => JSON.parse(raw),
            transformOutput: (object) => JSON.stringify(object, null, "\t"),
        });
        this.httpProxy = new file_assistant_1.FileStorage({
            path: path_1.join(this.dataFolderPath, options.httpProxyFilename),
            validateInput: proxyValidate,
            transformInput: (data) => transformProxyOnRead("http", data),
            transformOutput: (array) => transformProxyOnSave(array),
        });
        this.socksProxy = new file_assistant_1.FileStorage({
            path: path_1.join(this.dataFolderPath, options.socksProxyFilename),
            validateInput: proxyValidate,
            transformInput: (data) => transformProxyOnRead("socks5", data),
            transformOutput: (array) => transformProxyOnSave(array),
        });
        this.settings = new file_assistant_1.FileStorage({
            path: path_1.join(this.dataFolderPath, options.settingsFilename),
            transformInput: (raw) => JSON.parse(raw),
            transformOutput: (object) => JSON.stringify(object, null, "\t")
        });
    }
    init() {
        this.existenceCheck();
        this.cache.read();
        this.settings.read();
        this.accounts.read();
        this.httpProxy.read();
        this.socksProxy.read();
    }
    existenceCheck() {
        let { existsSync, writeFileSync, mkdirSync } = fs_1.default;
        if (!existsSync(this.dataFolderPath)) {
            mkdirSync(this.dataFolderPath);
        }
        if (!existsSync(this.cache.path)) {
            writeFileSync(this.cache.path, JSON.stringify(entity_1.createEmptyCache(), null, "\t"));
        }
        if (!existsSync(this.settings.path)) {
            writeFileSync(this.settings.path, JSON.stringify(entity_1.createDefaultSettings(), null, "\t"));
        }
        if (!existsSync(this.accounts.path))
            writeFileSync(this.accounts.path, "");
        if (!existsSync(this.httpProxy.path))
            writeFileSync(this.httpProxy.path, "");
        if (!existsSync(this.socksProxy.path))
            writeFileSync(this.socksProxy.path, "");
    }
    saveAll() {
        this.cache.save();
        this.settings.save();
        this.accounts.save();
        this.httpProxy.save();
        this.socksProxy.save();
    }
}
exports.DataStorage = DataStorage;
function proxyValidate(data) {
    return proxy_1.PATTERN_MATCH_PROXY.test(data);
}
function transformProxyOnRead(type, data) {
    let lines = data.split(/\r\n|\n/);
    return lines.map(line => {
        if (!line.trim())
            return null;
        let proxy;
        try {
            proxy = proxy_1.default.fromString(type, line);
        }
        catch (exception) {
            proxy = null;
        }
        return proxy;
    }).filter(line => line);
}
function transformProxyOnSave(array) {
    return array.map(proxy => proxy.toString()).join("\n");
}
