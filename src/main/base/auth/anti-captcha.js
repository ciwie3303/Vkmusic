"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiCaptchaError = void 0;
const anticaptchaofficial_1 = __importDefault(require("@antiadmin/anticaptchaofficial"));
const utils_1 = require("../../utils");
const auth_1 = require("../../../library/vk_api/auth");
exports.default = new class AntiCaptcha {
    constructor(key) {
        this.key = key ?? "";
    }
    getKey() {
        return this.key;
    }
    setKey(value) {
        anticaptchaofficial_1.default.setAPIKey(value);
        this.key = value;
    }
    getBalance() {
        return anticaptchaofficial_1.default.getBalance();
    }
    async isValidKey(key) {
        let tempKey = this.key;
        this.setKey(key);
        try {
            await this.getBalance();
        }
        catch (error) {
            this.setKey(tempKey);
            return false;
        }
        return true;
    }
    async checkAndGetBalance() {
        let balance = await this.getBalance();
        if (balance < .1)
            throw new AntiCaptchaError("The anticaptcha account balance is less than 10! Please, top up your account balance.");
        return balance;
    }
    solveCaptcha(payload) {
        switch (payload.type) {
            case 0: {
                let imageCaptchaData = payload.getImageCaptchaData();
                return this.solveImageCaptcha(imageCaptchaData);
            }
            case 1: {
                let googleCaptchaData = payload.getGoogleCaptchaData();
                return this.solveGoogleCaptcha(googleCaptchaData);
            }
            default: throw new AntiCaptchaError("Unrecognized captcha type.");
        }
    }
    async solveImageCaptcha(imageCaptchaData) {
        let { imageSource } = imageCaptchaData;
        let base64 = imageSource instanceof Buffer
            ? imageSource.toString("base64")
            : await utils_1.fetchImageAsBase64(imageSource);
        let solveResult = await anticaptchaofficial_1.default.solveImage(base64);
        return new auth_1.Captcha(0, {
            ...imageCaptchaData,
            captchaKey: solveResult
        });
    }
    async solveGoogleCaptcha(googleCaptchaData) {
        throw new AntiCaptchaError("Not implemented the Google anti-captcha.");
    }
};
class AntiCaptchaError extends Error {
    constructor(message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AntiCaptchaError = AntiCaptchaError;
