"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioRejectKind = void 0;
const library_exception_1 = __importDefault(require("./library_exception"));
var AudioRejectKind;
(function (AudioRejectKind) {
    AudioRejectKind[AudioRejectKind["EmailNotConfirmed"] = 1] = "EmailNotConfirmed";
    AudioRejectKind[AudioRejectKind["CaptchaRequired"] = 2] = "CaptchaRequired";
    AudioRejectKind[AudioRejectKind["AuthFailed"] = 3] = "AuthFailed";
    AudioRejectKind[AudioRejectKind["MakeRedirect"] = 4] = "MakeRedirect";
    AudioRejectKind[AudioRejectKind["Reload"] = 5] = "Reload";
    AudioRejectKind[AudioRejectKind["MobileActivationRequired"] = 15] = "MobileActivationRequired";
    AudioRejectKind[AudioRejectKind["Message"] = 7] = "Message";
    AudioRejectKind[AudioRejectKind["Failed"] = 8] = "Failed";
    AudioRejectKind[AudioRejectKind["VotesPayment"] = 9] = "VotesPayment";
    AudioRejectKind[AudioRejectKind["ZeroZone"] = 10] = "ZeroZone";
    AudioRejectKind[AudioRejectKind["EvalCode"] = 13] = "EvalCode";
    AudioRejectKind[AudioRejectKind["OTP"] = 14] = "OTP";
    AudioRejectKind[AudioRejectKind["PasswordValidationRequired"] = 15] = "PasswordValidationRequired";
})(AudioRejectKind = exports.AudioRejectKind || (exports.AudioRejectKind = {}));
class AudioException extends library_exception_1.default {
    constructor(options) {
        super(options.message);
        this.kind = options.kind;
        this.payload = options.payload;
    }
    toString() {
        return `${this.name}: Code №${this.kind} -> ${this.message}`;
    }
    static getRejectKindByCode(code) {
        if (code == 0)
            return;
        switch (code) {
            case 1: return AudioRejectKind.EmailNotConfirmed;
            case 2: return AudioRejectKind.CaptchaRequired;
            case 3: return AudioRejectKind.AuthFailed;
            case 4: return AudioRejectKind.MakeRedirect;
            case 5: return AudioRejectKind.Reload;
            case 6:
            case 11:
            case 12:
                return AudioRejectKind.MobileActivationRequired;
            case 7: return AudioRejectKind.Message;
            case 8: return AudioRejectKind.Failed;
            case 9: return AudioRejectKind.VotesPayment;
            case 10: return AudioRejectKind.ZeroZone;
            case 13: return AudioRejectKind.EvalCode;
            case 14: return AudioRejectKind.OTP;
            case 15: return AudioRejectKind.PasswordValidationRequired;
            default: {
                if (code >= -1 && code <= -3)
                    return AudioRejectKind.Failed;
            }
        }
    }
}
exports.default = AudioException;
