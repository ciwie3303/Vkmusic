"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LibraryException extends Error {
    constructor(message) {
        super(message);
        this.name = this.getName();
        this.message = message;
        Error.captureStackTrace(this, this.constructor);
    }
    getName() {
        return this.constructor.name;
    }
    [Symbol.toStringTag]() {
        return this.getName();
    }
    toString() {
        return `${this.name} -> ${this.message}`;
    }
}
exports.default = LibraryException;
