"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editTask = exports.editAntiCaptchaKey = exports.accountsAdd = exports.proxyLoad = exports.addTask = void 0;
var add_new_task_1 = require("./add-new-task");
Object.defineProperty(exports, "addTask", { enumerable: true, get: function () { return __importDefault(add_new_task_1).default; } });
var proxy_load_1 = require("./proxy-load");
Object.defineProperty(exports, "proxyLoad", { enumerable: true, get: function () { return __importDefault(proxy_load_1).default; } });
var accounts_add_1 = require("./accounts-add");
Object.defineProperty(exports, "accountsAdd", { enumerable: true, get: function () { return __importDefault(accounts_add_1).default; } });
var edit_anticaptcha_1 = require("./edit-anticaptcha");
Object.defineProperty(exports, "editAntiCaptchaKey", { enumerable: true, get: function () { return __importDefault(edit_anticaptcha_1).default; } });
var edit_task_1 = require("./edit-task");
Object.defineProperty(exports, "editTask", { enumerable: true, get: function () { return __importDefault(edit_task_1).default; } });
