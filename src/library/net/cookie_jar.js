"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../utils/constants");
const tough_cookie_1 = require("tough-cookie");
class CookieJarExtension extends tough_cookie_1.CookieJar {
    setCookieString(raw, url, options = {}) {
        let splitted = raw.split(";")
            .filter(data => data.length > 0);
        if (splitted.length == 0)
            return;
        return Promise.all(splitted.map(chunk => this.setCookie(chunk, url.toString(), options)));
    }
    setSessionCookie(value) {
        return Promise.all([
            this.setCookieString(value.base, constants_1.VK_BASE_URL),
            this.setCookieString(value.login, constants_1.VK_LOGIN_URL)
        ]);
    }
    async getSessionCookie() {
        const [base, login] = await Promise.all([
            this.getCookieString(constants_1.VK_BASE_URL, { http: true, secure: true }),
            this.getCookieString(constants_1.VK_LOGIN_URL, { http: true, secure: true })
        ]);
        return { base, login };
    }
}
exports.default = CookieJarExtension;
