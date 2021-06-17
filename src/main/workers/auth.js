"use strict";
const { Logger } = require("../utils");
const workerPool = require("workerpool");
const { threadId } = require("worker_threads");
const { default: antiCaptcha } = require("../base/auth/anti-captcha");
const { authAccountsGenerator } = require("../base/auth/provider");
const WORKER_PREFIX = `[worker №${threadId}]:`;
async function execAuthorization(data) {
    const { accounts, proxies, antiCaptchaKey } = data;
    antiCaptcha.setKey(antiCaptchaKey);
    const iterator = authAccountsGenerator(accounts, {
        proxies,
        errorHandler(error, account) {
            workerPool.workerEmit({
                type: "invalid_account",
                data: account
            });
            Logger.error(error.message, account);
        },
        async captchaHandler(payload) {
            Logger.log(`${WORKER_PREFIX} Solving the captcha...`);
            let balance = await antiCaptcha.getBalance();
            Logger.log(`${WORKER_PREFIX} AntiCaptcha balance:`, balance);
            return antiCaptcha.solveCaptcha(payload);
        }
    });
    for await (let { account, cookies, proxy, userAgent } of iterator) {
        Logger.log(`${WORKER_PREFIX} Success authorization (${account.login}:${account.password})`);
        workerPool.workerEmit({
            type: "success",
            data: {
                account, cookies,
                lastUsageTime: Date.now(), lastUsedProxy: proxy,
                lastUsedUserAgent: userAgent
            }
        });
    }
    return true;
}
workerPool.worker({
    runAuthorization: execAuthorization
});
