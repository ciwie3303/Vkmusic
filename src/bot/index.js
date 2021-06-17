"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bus_1 = require("../main/bus");
const utils_1 = require("../main/utils");
const telegraf_1 = require("telegraf");
const menu_1 = __importDefault(require("./menu"));
const scenes = __importStar(require("./scenes"));
const bus = bus_1.getILABus();
const settings = bus.settings.getSettings();
const bot = new telegraf_1.Telegraf(settings.botToken);
const stage = new telegraf_1.Scenes.Stage([
    scenes.addTask,
    scenes.proxyLoad,
    scenes.accountsAdd,
    scenes.editAntiCaptchaKey,
    scenes.editTask
]);
let answerWaiting = false;
let auth = false;
bot.use(telegraf_1.session());
bot.use((context, next) => {
    if (auth)
        return next();
    if (!answerWaiting) {
        context.reply("🤬 Введите пароль для продолжения работы:");
        answerWaiting = true;
        return;
    }
    if (context.message && "text" in context.message) {
        const { botPassword } = bus.settings.getSettings();
        const userPassword = context.message.text.trim();
        if (userPassword != botPassword) {
            context.reply("🤬 Неправильный пароль!");
            return;
        }
        auth = true;
        return menu_1.default.replyToContext(context);
    }
    context.reply("Неправильный пароль");
});
bot.use(stage.middleware());
bot.use(menu_1.default.middleware());
bot.start(async (context) => menu_1.default.replyToContext(context));
bot.catch((error, context) => {
    utils_1.Logger.error(error);
    if (error instanceof telegraf_1.TelegramError) {
        return;
    }
    context.reply("😩 Произошла ошибка\n\nПодробнее:" + JSON.stringify(error, null, "\t"));
});
exports.default = bot;
