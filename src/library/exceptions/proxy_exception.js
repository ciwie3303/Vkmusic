"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const library_exception_1 = __importDefault(require("./library_exception"));
class ProxyException extends library_exception_1.default {
    constructor(message, proxy) {
        super(message);
        this.proxy = proxy;
    }
}
exports.default = ProxyException;
