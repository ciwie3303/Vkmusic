"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = exports.FILE_IS_EMPTY = void 0;
exports.FILE_IS_EMPTY = "😶 Файл пуст.";
const format = (text, ...args) => {
    let index = 0;
    return text.replace(/{}/g, () => args[index++]);
};
exports.format = format;
