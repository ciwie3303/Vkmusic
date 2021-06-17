"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VKException = exports.RequestException = exports.ProxyException = exports.FileException = exports.AuthorizationException = exports.AudioException = void 0;
var audio_exception_1 = require("./audio_exception");
Object.defineProperty(exports, "AudioException", { enumerable: true, get: function () { return __importDefault(audio_exception_1).default; } });
var authorization_exception_1 = require("./authorization_exception");
Object.defineProperty(exports, "AuthorizationException", { enumerable: true, get: function () { return __importDefault(authorization_exception_1).default; } });
var file_exception_1 = require("./file_exception");
Object.defineProperty(exports, "FileException", { enumerable: true, get: function () { return __importDefault(file_exception_1).default; } });
var proxy_exception_1 = require("./proxy_exception");
Object.defineProperty(exports, "ProxyException", { enumerable: true, get: function () { return __importDefault(proxy_exception_1).default; } });
var request_exception_1 = require("./request_exception");
Object.defineProperty(exports, "RequestException", { enumerable: true, get: function () { return __importDefault(request_exception_1).default; } });
var vk_exception_1 = require("./vk_exception");
Object.defineProperty(exports, "VKException", { enumerable: true, get: function () { return __importDefault(vk_exception_1).default; } });
