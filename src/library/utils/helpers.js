"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomUserAgent = exports.jsonTryToParse = void 0;
const user_agents_1 = __importDefault(require("user-agents"));
const jsonTryToParse = (object) => {
    try {
        let data = JSON.parse(object);
        return data;
    }
    catch (error) {
        return false;
    }
};
exports.jsonTryToParse = jsonTryToParse;
const randomUserAgent = () => {
    return new user_agents_1.default().toString();
};
exports.randomUserAgent = randomUserAgent;
