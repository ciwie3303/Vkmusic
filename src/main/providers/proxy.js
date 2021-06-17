"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProxy = exports.proxyValidatorDecorator = void 0;
const axios_1 = __importDefault(require("axios"));
const proxy_1 = __importDefault(require("../../library/net/proxy"));
function proxyValidatorDecorator(proxies, options = {
    startOffset: 0,
    testUrl: "https://m.vk.com"
}) {
    let url = options.testUrl.toString();
    let index = options.startOffset;
    return async function getValidProxy() {
        let valid = await checkProxy(proxies[index], url);
        let validProxy = proxies[index];
        index = (index + 1) % proxies.length;
        return !valid ? getValidProxy() : validProxy;
    };
}
exports.proxyValidatorDecorator = proxyValidatorDecorator;
async function checkProxy(proxy, testUrl) {
    try {
        let url = testUrl;
        await axios_1.default.get(url, {
            timeout: 5000,
            httpsAgent: proxy_1.default.getAgentFrom(proxy)
        });
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.checkProxy = checkProxy;
