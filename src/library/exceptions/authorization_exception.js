"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = void 0;
const library_exception_1 = __importDefault(require("./library_exception"));
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["PageBlocked"] = 0] = "PageBlocked";
    ErrorCode[ErrorCode["CaptchaRequired"] = 1] = "CaptchaRequired";
    ErrorCode[ErrorCode["TwoFactorRequired"] = 2] = "TwoFactorRequired";
    ErrorCode[ErrorCode["SecurityCheckRequired"] = 3] = "SecurityCheckRequired";
    ErrorCode[ErrorCode["Failed"] = 4] = "Failed";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class AuthorizationException extends library_exception_1.default {
    constructor(options) {
        super(options.message);
        this.code = options.code;
        this.pageHtml = options.pageHtml;
    }
}
exports.default = AuthorizationException;
