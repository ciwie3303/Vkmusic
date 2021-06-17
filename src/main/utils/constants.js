"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_STORAGE_DEFAULTS = exports.DEBUG_FILENAME = exports.DATA_FOLDER_FILENAME = exports.VERSION = exports.ACCOUNT_DEFAULT_PASSWORD = exports.ACCOUNTS_TEXT_PATTERN = void 0;
exports.ACCOUNTS_TEXT_PATTERN = /\S+:\S+/g;
exports.ACCOUNT_DEFAULT_PASSWORD = "ILASoftware@2021";
exports.VERSION = "1.7.0";
exports.DATA_FOLDER_FILENAME = "data";
exports.DEBUG_FILENAME = "ila-debug.log";
exports.DATA_STORAGE_DEFAULTS = {
    accountsFilename: "accounts.txt",
    cacheFilename: "cache.json",
    settingsFilename: "settings.json",
    httpProxyFilename: "http-proxy.txt",
    socksProxyFilename: "socks-proxy.txt"
};
