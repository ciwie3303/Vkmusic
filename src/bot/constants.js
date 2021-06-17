"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneNames = exports.LoadMethod = exports.BACK_KEYBOARD = exports.BACK_BUTTON = exports.BACK_MAIN_MENU_TEXT = exports.BACK_BUTTON_TEXT = exports.ERROR_EMOJI = exports.TEXT_EMOJI = exports.FILE_EMOJI = exports.FILENAME_PREFIX = void 0;
const telegraf_1 = require("telegraf");
exports.FILENAME_PREFIX = "ila_d6bc4f1";
exports.FILE_EMOJI = "📁";
exports.TEXT_EMOJI = "📝";
exports.ERROR_EMOJI = "🤬";
exports.BACK_BUTTON_TEXT = "Назад";
exports.BACK_MAIN_MENU_TEXT = "Вернуться в главное меню";
exports.BACK_BUTTON = telegraf_1.Markup.button.callback(exports.BACK_BUTTON_TEXT, "back");
exports.BACK_KEYBOARD = telegraf_1.Markup.inlineKeyboard([
    [exports.BACK_BUTTON]
]);
var LoadMethod;
(function (LoadMethod) {
    LoadMethod[LoadMethod["FILE"] = 0] = "FILE";
    LoadMethod[LoadMethod["TEXT"] = 1] = "TEXT";
})(LoadMethod = exports.LoadMethod || (exports.LoadMethod = {}));
var SceneNames;
(function (SceneNames) {
    SceneNames["AddListenTask"] = "addListenTask";
})(SceneNames = exports.SceneNames || (exports.SceneNames = {}));
