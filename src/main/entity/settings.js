"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultSettings = void 0;
const createDefaultSettings = () => {
    return {
        maxTasksHistoryCapacity: 20,
        threads: 4,
        botToken: "",
        botPassword: "",
        antiCaptchaKey: "",
        listeningMode: "parallel",
        enableMonetize: false,
        skipAuthorization: false,
        skipSessionChecking: false,
        skipPasswordChanging: true,
    };
};
exports.createDefaultSettings = createDefaultSettings;
