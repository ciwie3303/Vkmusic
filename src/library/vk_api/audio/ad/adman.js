"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Adman = void 0;
const net_1 = require("../../../net");
const helpers_1 = require("../../../utils/helpers");
const querystring_1 = require("querystring");
class Adman {
    constructor(options = {}) {
        this.options = options;
        this.baseUrl = "https://mail.ru";
        this.baseAdUrl = "https://ad.mail.ru";
        this.jar = new net_1.CookieJarExtension();
        this.fetch = net_1.fetchDecorator({
            baseURL: this.baseAdUrl,
            cookieJar: this.jar,
            withCredentials: true,
            httpsAgent: options?.proxy?.getAgent(),
            headers: {
                "user-agent": options?.userAgent || helpers_1.randomUserAgent()
            }
        });
    }
    async init(options = {}) {
        this.options = options;
        await this.fetchCookie();
        return this;
    }
    async fetchCookie() {
        await this.fetch(this.baseUrl);
        return this.jar;
    }
    fetchAd(params) {
        params ?? (params = this.options.params);
        console.log(params);
        const queryParams = querystring_1.stringify(params);
        const url = new URL(`/vp/${this.options.slot}?${queryParams}`, this.baseAdUrl);
        return this.fetch.post(url.toString());
    }
    sendStats() {
        const queryParams = querystring_1.stringify({
            original: this.options.slot,
            version: Adman.VERSION
        });
        const url = `/vp/${Adman.VP_NUMBER}?${queryParams}`;
        return this.fetch.get(url);
    }
}
exports.Adman = Adman;
Adman.VP_NUMBER = 3107;
Adman.VERSION = "2.1.66";
