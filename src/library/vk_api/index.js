"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VK = void 0;
const cookie_jar_1 = __importDefault(require("../net/cookie_jar"));
const fetch_1 = require("../net/fetch");
const constants_1 = require("../utils/constants");
const helpers_1 = require("../utils/helpers");
const audio_1 = require("./audio");
const auth_1 = require("./auth");
class VK {
    constructor(options = {}) {
        this.options = options;
        this.jar = new cookie_jar_1.default();
        if (options.session)
            this.jar.setSessionCookie(options.session);
        this.fetch = fetch_1.fetchDecorator({
            baseURL: constants_1.VK_BASE_URL,
            cookieJar: this.jar,
            withCredentials: true,
            httpsAgent: options.proxy?.getAgent(),
            headers: {
                "user-agent": options?.userAgent || helpers_1.randomUserAgent(),
                "content-type": "application/x-www-form-urlencoded"
            }
        });
        this.audio = new audio_1.VKAudio(this);
        this.auth = new auth_1.VKAuthorization(this);
    }
    getSessionCookie() {
        return this.jar.getSessionCookie();
    }
    clearCookies() {
        return this.jar.removeAllCookies();
    }
    async isValidSession() {
        try {
            const response = await this.fetch.get(constants_1.VK_USER_INFO_URL);
            const data = response.data;
            if (!data)
                throw new Error();
            return data.user?.id > -1;
        }
        catch (exception) {
            return false;
        }
    }
}
exports.VK = VK;
