"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileErrorCode = void 0;
const library_exception_1 = __importDefault(require("./library_exception"));
var FileErrorCode;
(function (FileErrorCode) {
    FileErrorCode[FileErrorCode["NotFound"] = 0] = "NotFound";
    FileErrorCode[FileErrorCode["NotLoaded"] = 1] = "NotLoaded";
    FileErrorCode[FileErrorCode["FormatError"] = 2] = "FormatError";
    FileErrorCode[FileErrorCode["TransformError"] = 3] = "TransformError";
    FileErrorCode[FileErrorCode["Unknown"] = 4] = "Unknown";
})(FileErrorCode = exports.FileErrorCode || (exports.FileErrorCode = {}));
class FileException extends library_exception_1.default {
    constructor(options) {
        super(options.message);
        this.filePath = options.path;
        this.code = options.code || FileErrorCode.Unknown;
    }
}
exports.default = FileException;
