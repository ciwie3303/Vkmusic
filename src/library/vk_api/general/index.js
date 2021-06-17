"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VKGeneral = void 0;
const exceptions_1 = require("../../exceptions");
const cookie_jar_1 = __importDefault(require("../../net/cookie_jar"));
const fetch_1 = require("../../net/fetch");
const constants_1 = require("../../utils/constants");
const helpers_1 = require("../../utils/helpers");
const querystring_1 = require("querystring");
const SETTINGS_OPTIONS_PATTERN = /cur\.options.+({[^}]+})/;
class VKGeneral {
    constructor(options) {
        this.options = options;
        this.init(options);
    }
    async init(options) {
        this.jar = new cookie_jar_1.default();
        this.jar.setSessionCookie(options.session);
        this.fetch = fetch_1.fetchDecorator({
            baseURL: constants_1.VK_BASE_URL,
            cookieJar: this.jar,
            withCredentials: true,
            httpsAgent: options.proxy?.getAgent(),
            headers: { "user-agent": options.userAgent || helpers_1.randomUserAgent() }
        });
    }
    async getProfileInfo() {
        const { data: user } = await this.fetch.get("/feed2.php");
        return user;
    }
    async changePassword(oldPassword, newPassword) {
        const settingOptions = await this.parseSettingOptions();
        const { phash } = settingOptions;
        if (!phash)
            throw new exceptions_1.VKException("Unable to get phash for changing password");
        const options = {
            act: "changepass",
            pass: oldPassword,
            new_pass: newPassword,
            _origin: constants_1.VK_BASE_URL,
            phash
        };
        const { config } = await this.fetch.post(constants_1.VK_LOGIN_URL, querystring_1.stringify(options));
        if (!config.url)
            throw new exceptions_1.VKException("Unable to get url!");
        const responseUrl = config.url;
        const matchSuccessCode = responseUrl.match("s=1");
        const matchErrorCode = responseUrl.match("r=(.+)");
        if (!matchErrorCode && !matchSuccessCode)
            throw new exceptions_1.VKException("Authorization error.");
        if (!matchErrorCode && matchSuccessCode) {
            return true;
        }
        let [, code] = matchErrorCode;
        code = Number(code);
        switch (code) {
            case 2: {
                return true;
            }
            case -1: {
                throw new exceptions_1.VKException("Captcha error");
            }
            case -2: {
                throw new exceptions_1.VKException("Incorrect password");
            }
            default: {
                throw new exceptions_1.VKException("Impossible to change password");
            }
        }
    }
    async parseSettingOptions() {
        const settingsContent = await this.fetch.get("/settings");
        const html = settingsContent.data;
        const result = html.match(SETTINGS_OPTIONS_PATTERN);
        if (!result)
            throw new exceptions_1.VKException("[[parse_options_error]: The settings options isn't finded");
        const [, stringObject] = result;
        const object = helpers_1.jsonTryToParse(stringObject);
        if (!object)
            throw new exceptions_1.VKException(`[parse_options_error]: Cann't to parse the object.`);
        return object;
    }
    getCookies() {
        return this.jar.getSessionCookie();
    }
    set session(value) {
        this.options.session = value;
        this.jar.setSessionCookie(value);
    }
    set proxy(value) {
        this.options.proxy = value;
    }
    set userAgent(value) {
        this.options.userAgent = value;
    }
}
exports.VKGeneral = VKGeneral;
