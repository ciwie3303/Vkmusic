"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATTERN_MATCH_PROXY = void 0;
const proxy_agent_1 = __importDefault(require("proxy-agent"));
const proxy_exception_1 = __importDefault(require("../exceptions/proxy_exception"));
exports.PATTERN_MATCH_PROXY = /(?:.*\:\/\/)?(?:(\S+):(\S+)[@:])?((?:\d{1,3}\.){3}\d{1,3}|\S+):(\d{2,5})/i;
class Proxy {
    constructor(options) {
        this.valid = true;
        this.type = options.type;
        this.port = options.port;
        this.auth = options.auth;
        this.address = options.address;
    }
    isValid() {
        return this.valid;
    }
    setValid(value) {
        this.valid = value;
    }
    getAgent() {
        return Proxy.getAgentFrom(this);
    }
    getProxyData() {
        return Proxy.getProxyData(this);
    }
    toString() {
        return Proxy.stringify(this);
    }
    static getAgentFrom(proxy) {
        return new proxy_agent_1.default(Proxy.stringify(proxy));
    }
    static stringify(proxy) {
        let { auth, type, port, address } = proxy;
        let authString = auth ? `${auth.username}:${auth.password}@` : "";
        return `${type}://${authString}${address}:${port}`;
    }
    static getProxyData(proxy) {
        return {
            type: proxy.type,
            address: proxy.address,
            port: proxy.port,
            auth: proxy.auth
        };
    }
    static fromString(type, data) {
        let matchResult = data.match(exports.PATTERN_MATCH_PROXY);
        if (!matchResult)
            throw new proxy_exception_1.default("Incorrect specified proxy string: " + data);
        let [, username, password, address, port] = matchResult;
        return new Proxy({
            type, address,
            port: parseInt(port, 0xA),
            auth: (username || password) && { username, password } || undefined
        });
    }
    static from(proxy) {
        return new Proxy(proxy);
    }
}
exports.default = Proxy;
