"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterSessions = void 0;
const proxy_1 = __importDefault(require("../../library/net/proxy"));
const vk_api_1 = require("../../library/vk_api");
const constants_1 = require("../../library/utils/constants");
const logger_1 = require("../utils/logger");
const filterSessions = async (sessions) => {
    let filterCount = 0;
    let cookieUpdatedCount = 0;
    return (await Promise.all(sessions.map(async (session) => {
        const vk = new vk_api_1.VK({
            session: session.cookies,
            proxy: session.lastUsedProxy && new proxy_1.default(session.lastUsedProxy),
            userAgent: session.lastUsedUserAgent || constants_1.DESKTOP_USER_AGENT
        });
        const valid = await vk.isValidSession();
        filterCount++;
        logger_1.Logger.log(`Session filtering progress: (${filterCount}/${sessions.length}). Current session is valid:`, valid);
        if (!valid)
            return undefined;
        await vk.fetch.get("/feed");
        session.cookies = await vk.getSessionCookie();
        cookieUpdatedCount++;
        logger_1.Logger.log(`Cookie updating progress: (${cookieUpdatedCount}/${sessions.length})`);
        return session;
    }))).filter(session => session);
};
exports.filterSessions = filterSessions;
