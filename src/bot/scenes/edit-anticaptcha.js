"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const bus_1 = require("../../main/bus");
const constants_1 = require("../constants");
const extensions_1 = require("../extensions");
const menu_1 = __importDefault(require("../menu"));
const ilaBus = bus_1.getILABus();
const scene = new telegraf_1.Scenes.WizardScene("edit-anticaptcha-key", extensions_1.asyncWrapper(async (context) => {
    await context.reply("📟 Введите новый ключ от анти-капчи (anti-captcha.com):", constants_1.BACK_KEYBOARD);
    return context.wizard.next();
}), extensions_1.asyncWrapper(async (context) => {
    if (!context.message || !("text" in context.message)) {
        return context.reply("📟 Пожалуйста, укажите новый ключ от анти-капчи:", constants_1.BACK_KEYBOARD);
    }
    const key = context.message.text.trim();
    const balance = await ilaBus.settings.getAntiCaptchaBalance(key);
    if (balance < .1) {
        context.reply("⚠️ Баланс указанного аккаунта анти-капчи меньше, чем 0.1$");
    }
    await ilaBus.settings.setAntiCaptchaKey(key);
    await context.reply("🔮 Аккаунт анти-капчи изменен. Текущий баланс: " + balance);
    await leaveScene(context);
}));
scene.action("back", extensions_1.asyncWrapper(async (context) => {
    await context.answerCbQuery();
    await leaveScene(context);
}));
async function leaveScene(context) {
    await menu_1.default.replyToContext(context, "/settings_menu/");
    await context.scene.leave();
}
exports.default = scene;
