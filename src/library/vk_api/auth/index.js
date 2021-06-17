"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VKAuthorization = exports.Captcha = exports.CaptchaTypes = void 0;
__exportStar(require("./captcha"), exports);
__exportStar(require("./types"), exports);
var captcha_1 = require("./captcha");
Object.defineProperty(exports, "CaptchaTypes", { enumerable: true, get: function () { return captcha_1.CaptchaTypes; } });
Object.defineProperty(exports, "Captcha", { enumerable: true, get: function () { return captcha_1.Captcha; } });
const url_1 = require("url");
const cheerio_1 = require("cheerio");
const captcha_2 = require("./captcha");
const querystring_1 = require("querystring");
const exceptions_1 = require("../../exceptions");
const authorization_exception_1 = require("../../exceptions/authorization_exception");
const constants_1 = require("../../utils/constants");
const LOGIN_URI_PATTERN = /<form method="POST".+"(https:\/\/login\.vk\.com\/.+)"/;
const LOGIN_CAPTCHA_SID_PATTERN = /captcha_sid.+"(\d+)"/;
const LOGIN_2FA_PATTERN = /<form.+action="(\/login\?act=authcheck_code[^"]+)/i;
const LOGIN_CAPTCHA_PATTERN = /id="captcha".+"(\/captcha\.php\?s=\d+&sid=(\d+))"/;
const ACTION_BLOCKED = "act=blocked";
const ACTION_SECURITY = "act=security";
const ACTION_AUTH_CHECK = "act=authcheck";
const CAPTCHA_IMAGE_SELECTOR = "#captcha";
const ERROR_MESSAGE_SELECTOR = ".service_msg";
const CAPTCHA_SID_SELECTOR = "input[name=\"captcha_sid\"]";
class VKAuthorization {
    constructor(context) {
        this.context = context;
        this.maxCaptchaAttempts = 3;
        this.captchaAttempts = 0;
        this.options = {};
    }
    setMaxCaptchaAttempts(value) {
        this.maxCaptchaAttempts = value;
        return this;
    }
    setCaptchaHandler(value) {
        this.options.captchaHandler = value;
        return this;
    }
    setLogin(value) {
        this.options.login = value;
        return this;
    }
    setPassword(value) {
        this.options.password = value;
        return this;
    }
    setOptions(value) {
        this.options = {
            ...this.options,
            ...value
        };
        return this;
    }
    async run() {
        const { login, password } = this.options;
        if (!login || !password)
            throw new exceptions_1.AuthorizationException({
                message: "The login or password isn't specified!",
                code: authorization_exception_1.ErrorCode.Failed
            });
        let loginData = await this.fetchLoginData();
        let loginResponse = await this.tryToLogin(loginData);
        return loginResponse;
    }
    async tryToLogin(loginData) {
        let { login, password, captchaHandler } = this.options;
        if (this.captchaAttempts >= this.maxCaptchaAttempts) {
            this.captchaAttempts = 0;
            throw new exceptions_1.AuthorizationException({
                message: "Exceeded the maximum number of attempts to solve the captcha",
                code: authorization_exception_1.ErrorCode.CaptchaRequired
            });
        }
        let captchaData = loginData.captcha?.getImageCaptchaData();
        if (captchaData && !captchaData.captchaKey) {
            if (!captchaHandler) {
                throw new exceptions_1.AuthorizationException({
                    message: `Captcha required (${captchaData.imageSource})`,
                    code: authorization_exception_1.ErrorCode.CaptchaRequired
                });
            }
            let captchaSolveResult;
            try {
                captchaSolveResult = await captchaHandler(loginData.captcha);
            }
            catch { }
            finally {
                if (!captchaSolveResult) {
                    this.captchaAttempts++;
                }
            }
            return this.tryToLogin({
                ...loginData,
                captcha: captchaSolveResult
            });
        }
        let formData = {
            email: login,
            pass: password,
            captcha_sid: captchaData?.captchaSid,
            captcha_key: captchaData?.captchaKey
        };
        const { fetch } = this.context;
        const { data: loginPageHtml, config } = await fetch.post(loginData.loginURI, querystring_1.stringify(formData), {
            withCredentials: true,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
        let successAuth = await this.context.isValidSession();
        if (!successAuth) {
            const url = config.url || "";
            if (url.includes(ACTION_AUTH_CHECK)) {
                throw new exceptions_1.AuthorizationException({
                    message: "Need 2fa",
                    code: authorization_exception_1.ErrorCode.TwoFactorRequired
                });
            }
            if (url.includes(ACTION_BLOCKED)) {
                throw new exceptions_1.AuthorizationException({
                    message: "Page is blocked",
                    code: authorization_exception_1.ErrorCode.PageBlocked
                });
            }
            if (url.includes(ACTION_SECURITY)) {
                throw new exceptions_1.AuthorizationException({
                    message: "We need to confirm your phone number",
                    code: authorization_exception_1.ErrorCode.SecurityCheckRequired
                });
            }
            if (url.includes('act=')) {
                throw new exceptions_1.AuthorizationException({
                    message: "Unsupported authorization event",
                    code: authorization_exception_1.ErrorCode.Failed,
                    pageHtml: loginPageHtml
                });
            }
            let $ = cheerio_1.load(loginPageHtml);
            let $errorMessage = $(ERROR_MESSAGE_SELECTOR);
            if ($errorMessage.length != 0) {
                throw new exceptions_1.AuthorizationException({
                    message: `Authorization form error: "${$errorMessage.text()}"`,
                    code: authorization_exception_1.ErrorCode.Failed
                });
            }
            let $captchaSidElement = $(CAPTCHA_SID_SELECTOR);
            let $captchaImageElement = $(CAPTCHA_IMAGE_SELECTOR);
            if ($captchaImageElement.length != 0) {
                let captchaSid = $captchaSidElement.attr("value");
                let imageSource = $captchaImageElement.attr("src");
                if (!imageSource || !captchaSid)
                    throw new exceptions_1.AuthorizationException({
                        message: "Cannot to get a captcha data",
                        code: authorization_exception_1.ErrorCode.CaptchaRequired,
                        pageHtml: loginPageHtml
                    });
                imageSource = getVKUrl(imageSource);
                loginData.captcha = new captcha_2.Captcha(0, { imageSource, captchaSid });
                return this.tryToLogin(loginData);
            }
            throw new exceptions_1.AuthorizationException({
                message: "Unsupported authorization event",
                code: authorization_exception_1.ErrorCode.Failed,
                pageHtml: loginPageHtml
            });
        }
        return this.context.getSessionCookie();
    }
    async fetchLoginData() {
        let response = await this.context.fetch.get(constants_1.VK_MOBILE_BASE_URL);
        let parsedContent = this.parseLoginData(response.data);
        return parsedContent;
    }
    parseLoginData(htmlContent) {
        if (!LOGIN_URI_PATTERN.test(htmlContent))
            throw new exceptions_1.AuthorizationException({
                message: "The login uri is't found!",
                code: authorization_exception_1.ErrorCode.Failed,
                pageHtml: htmlContent
            });
        let [, loginURI] = htmlContent.match(LOGIN_URI_PATTERN);
        let loginData = { loginURI };
        if (LOGIN_CAPTCHA_PATTERN.test(htmlContent)) {
            let [, imagePath, captchaSid] = htmlContent.match(LOGIN_CAPTCHA_PATTERN);
            let imageSource = getVKUrl(imagePath);
            let captcha = new captcha_2.Captcha(0, {
                imageSource, captchaSid
            });
            loginData.captcha = captcha;
        }
        return loginData;
    }
}
exports.VKAuthorization = VKAuthorization;
function getVKUrl(path) {
    return new url_1.URL(path, "httpa://m.vk.com/").toString();
}
