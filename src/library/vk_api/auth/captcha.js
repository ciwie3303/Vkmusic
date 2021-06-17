"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Captcha = exports.CaptchaTypes = void 0;
var CaptchaTypes;
(function (CaptchaTypes) {
    CaptchaTypes[CaptchaTypes["Image"] = 0] = "Image";
    CaptchaTypes[CaptchaTypes["GoogleCaptcha"] = 1] = "GoogleCaptcha";
})(CaptchaTypes = exports.CaptchaTypes || (exports.CaptchaTypes = {}));
class Captcha {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
    getImageCaptchaData() {
        return this.data;
    }
    getGoogleCaptchaData() {
        return this.data;
    }
    setCaptchaKey(value) {
        this.getImageCaptchaData().captchaKey = value;
        return this;
    }
}
exports.Captcha = Captcha;
