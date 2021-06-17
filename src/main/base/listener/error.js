"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioListenerError = void 0;
class AudioListenerError extends Error {
    constructor(message = "") {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AudioListenerError = AudioListenerError;
