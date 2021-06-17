"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorage = void 0;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const exceptions_1 = require("../exceptions");
const file_exception_1 = require("../exceptions/file_exception");
class FileStorage {
    constructor(options) {
        this.options = options;
    }
    get path() {
        return this.options.path;
    }
    get transform() {
        return this.options.transformInput;
    }
    get validateInput() {
        return this.options.validateInput;
    }
    readAsync() {
        return new Promise(resolve => {
            let data = this.read();
            return resolve(data);
        });
    }
    read() {
        let { path, transformInput, validateInput } = this.options;
        if (!fs_1.existsSync(path))
            throw new exceptions_1.FileException({
                message: "File is't found",
                code: file_exception_1.FileErrorCode.NotFound,
                path
            });
        let content = fs_1.readFileSync(path, { encoding: "utf-8" });
        if (content.length != 0 && validateInput) {
            let result = validateInput(content);
            if (!result)
                throw new exceptions_1.FileException({
                    message: `Incorrect format of the file '${path}'`,
                    code: file_exception_1.FileErrorCode.FormatError,
                    path
                });
        }
        let transformResult = transformInput(content);
        if (transformResult == undefined)
            throw new exceptions_1.FileException({
                message: "The transformInput function should return data",
                code: file_exception_1.FileErrorCode.TransformError,
                path
            });
        return this.data = transformResult;
    }
    saveAsync() {
        return new Promise(resolve => {
            this.save();
            return resolve(this);
        });
    }
    save() {
        let { path, transformOutput } = this.options;
        let transformResult = transformOutput(this.data);
        if (transformResult == undefined)
            throw new exceptions_1.FileException({
                message: "The transformOutput function should return data",
                code: file_exception_1.FileErrorCode.TransformError,
                path
            });
        fs_1.writeFileSync(path, transformResult, { encoding: "utf-8" });
        return this;
    }
    getFileHash() {
        let hash = crypto_1.createHash("sha256");
        if (!this.data)
            throw new exceptions_1.FileException({
                message: "Unable to get the hash of the file. You need to load the data.",
                path: this.options.path
            });
        let data = this.data;
        switch (typeof this.data) {
            case "object":
                data = JSON.stringify(data);
                break;
            default: {
                data = data?.toString();
            }
        }
        hash.update(data);
        return hash.digest("hex");
    }
}
exports.FileStorage = FileStorage;
