"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDecorator = void 0;
const url_1 = require("url");
const exceptions_1 = require("../exceptions");
const axios_1 = __importDefault(require("axios"));
const isAbsoluteURL_1 = __importDefault(require("axios/lib/helpers/isAbsoluteURL"));
const combineURLs_1 = __importDefault(require("axios/lib/helpers/combineURLs"));
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const helpers_1 = require("../utils/helpers");
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);
const fetchDecorator = (options = {}, debug) => {
    let axiosOptions = options;
    let { headers } = axiosOptions;
    if (!headers)
        headers = {};
    let instance = axios_1.default.create({
        ...options,
        headers,
        responseType: "arraybuffer",
        transformResponse(data, headers) {
            const contentType = headers["content-type"];
            if (contentType.includes("charset=windows-1251")) {
                data = iconv_lite_1.default.decode(data, "win1251");
                data = iconv_lite_1.default.encode(data, "utf-8");
            }
            if (contentType.includes("application/json") || contentType.includes("text/plain")) {
                let json = helpers_1.jsonTryToParse(data);
                if (json) {
                    return json;
                }
            }
            return data.toString();
        }
    });
    if (debug) {
        instance.interceptors.request.use((config) => {
            console.log("Request to the:", config.url, config);
            return config;
        });
        instance.interceptors.response.use((response) => {
            console.log("Response from the:", response.config.url, response);
            return response;
        });
    }
    if (options.cookieJar && options.withCredentials) {
        let axiosRedirectHelper = {
            instance,
            running: false,
            totalRedirects: options.maxRedirects || axios_1.default.defaults.maxRedirects || 5,
            backupConfig: {}
        };
        instance.interceptors.request.use(requestCookieInspectorDecorator(options.cookieJar, axiosRedirectHelper));
        instance.interceptors.response.use(responseCookieInspectorDecorator(options.cookieJar, axiosRedirectHelper));
    }
    return instance;
};
exports.fetchDecorator = fetchDecorator;
function requestCookieInspectorDecorator(jar, redirectHelper) {
    return async (config) => {
        if (!redirectHelper.running) {
            Object.assign(redirectHelper.backupConfig, config);
            config.validateStatus = validateStatus;
            config.maxRedirects = 0;
        }
        let requestUrl = getAbsoluteUrlFromConfig(config);
        let cookieString = await jar.getCookieString(requestUrl);
        if (cookieString) {
            if (config.headers && typeof config.headers == "object") {
                config.headers["Cookie"] = combineCookieStrings((config.headers["Cookie"] || ""), cookieString);
            }
            else {
                config.headers = {
                    Cookie: cookieString
                };
            }
        }
        return config;
    };
}
function validateStatus(statusCode) {
    return (statusCode >= 200 && statusCode <= 300) || REDIRECT_CODES.has(statusCode);
}
function combineCookieStrings(...strings) {
    return strings.filter(string => string && string.trim().length > 0).join(";\x20");
}
function responseCookieInspectorDecorator(jar, redirectHelper) {
    return async (response) => {
        let { headers, config } = response;
        let setCookieHeader = headers["set-cookie"];
        let hasSetCookieHeader = setCookieHeader && Array.isArray(setCookieHeader);
        let absoluteUrl = getAbsoluteUrlFromConfig(response.config);
        if (hasSetCookieHeader) {
            await Promise.all(setCookieHeader.map(cookie => jar.setCookie(cookie, absoluteUrl, {
                secure: true,
                http: true
            })));
        }
        const isRedirect = REDIRECT_CODES.has(response.status);
        const { instance } = redirectHelper;
        if (isRedirect && redirectHelper.totalRedirects > 0) {
            redirectHelper.running = true;
            if (response.status != 307) {
                config.method = "GET";
                config.params = config.data;
                delete config.data;
                delete config.headers['Content-Length'];
            }
            if (!headers.location) {
                throw new exceptions_1.RequestException("Location header missed");
            }
            let requestUrl = new url_1.URL(headers.location, absoluteUrl).toString();
            config.url = requestUrl;
            redirectHelper.totalRedirects--;
            return instance.request(config);
        }
        else {
            redirectHelper.running = false;
            redirectHelper.totalRedirects = axios_1.default.defaults.maxRedirects || 5;
        }
        Object.assign(redirectHelper.backupConfig, config, redirectHelper.backupConfig);
        return response;
    };
}
function getAbsoluteUrlFromConfig(config) {
    return config.baseURL && !isAbsoluteURL_1.default(config.url)
        ? combineURLs_1.default(config.baseURL, config.url)
        : config.url;
}
