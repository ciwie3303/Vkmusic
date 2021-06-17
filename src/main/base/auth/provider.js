"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authAccountsGenerator = void 0;
const exceptions_1 = require("../../../library/exceptions");
const authorization_exception_1 = require("../../../library/exceptions/authorization_exception");
const proxy_1 = __importDefault(require("../../../library/net/proxy"));
const proxy_2 = require("../../providers/proxy");
const constants_1 = require("../../../library/utils/constants");
const utils_1 = require("../../utils");
const worker_threads_1 = require("worker_threads");
const vk_api_1 = require("../../../library/vk_api");
const helpers_1 = require("../../../library/utils/helpers");
async function* authAccountsGenerator(accounts, { proxies, proxyStartOffset, captchaHandler, errorHandler }) {
    if (proxies?.length == 0)
        throw new Error("Can't start without proxy!");
    let getValidProxy = proxy_2.proxyValidatorDecorator(proxies, {
        startOffset: proxyStartOffset || 0,
        testUrl: constants_1.VK_BASE_URL
    });
    let proxy;
    for (let account of accounts) {
        utils_1.Logger.debug(`Worker#${worker_threads_1.threadId} Auth account: (${account.login}:${account.password})`);
        proxy = proxy_1.default.from(await getValidProxy());
        utils_1.Logger.debug(`Worker#${worker_threads_1.threadId} Using proxy: ${proxy.toString()}`);
        const userAgent = helpers_1.randomUserAgent();
        const vk = new vk_api_1.VK({ proxy, userAgent });
        try {
            vk.auth.setOptions({
                login: account.login,
                password: account.password,
                captchaHandler
            });
            const cookies = await vk.auth.run();
            yield {
                proxy,
                account,
                cookies,
                userAgent
            };
        }
        catch (error) {
            if (error instanceof exceptions_1.AuthorizationException) {
                if (error.code != authorization_exception_1.ErrorCode.CaptchaRequired) {
                    account.valid = false;
                }
            }
            errorHandler(error, account);
        }
    }
}
exports.authAccountsGenerator = authAccountsGenerator;
