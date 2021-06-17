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
const BACK_BUTTON = telegraf_1.Markup.button.callback(constants_1.BACK_BUTTON_TEXT, "back");
const BACK_KEYBOARD = telegraf_1.Markup.inlineKeyboard([BACK_BUTTON]);
const ilaBus = bus_1.getILABus();
const scene = new telegraf_1.Scenes.WizardScene("accounts-add", extensions_1.asyncWrapper(extensions_1.sendLoadMethodChoice), extensions_1.asyncWrapper(async (context) => {
    let { method } = extensions_1.getStateReference(context);
    switch (method) {
        case 0: {
            await fileProcess(context);
            break;
        }
        case 1: {
            await textProcess(context);
            break;
        }
        default: await extensions_1.sendLoadMethodChoice(context);
    }
}));
scene.action("file-format", extensions_1.asyncWrapper(async (context) => {
    context.wizard.selectStep(0);
    const state = extensions_1.getStateReference(context);
    await context.answerCbQuery();
    await context.reply("Отправьте мне документ содержащий список аккаунтов", BACK_KEYBOARD);
    state.method = 0;
    extensions_1.advanceSceneStep(context);
}));
scene.action("text-format", extensions_1.asyncWrapper(async (context) => {
    context.wizard.selectStep(0);
    const state = extensions_1.getStateReference(context);
    await context.answerCbQuery();
    await context.reply("Отправьте мне список аккаунтов", BACK_KEYBOARD);
    state.method = 1;
    extensions_1.advanceSceneStep(context);
}));
scene.action("back", extensions_1.asyncWrapper(async (context) => {
    await context.answerCbQuery();
    await leaveScene(context);
}));
const fileProcess = async (context) => {
    if (!context.message || !("document" in context.message)) {
        return context.reply(`${constants_1.ERROR_EMOJI} Пожалуйста, укажите файл содержащий список аккаунтов.`, BACK_KEYBOARD);
    }
    const { mime_type, file_id } = context.message.document;
    if (mime_type != "text/plain") {
        return context.reply("Некорректный формат файла.\n\nПожалуйста, укажите тектовый документ.", BACK_KEYBOARD);
    }
    let { href } = await context.telegram.getFileLink(file_id);
    let buffer = await extensions_1.fetchArrayBuffer(href);
    await submitAccounts(context, buffer);
};
const textProcess = async (context) => {
    if (!context.message || !("text" in context.message))
        return context.reply(`${constants_1.ERROR_EMOJI} Вы не отправили список аккаунтов.\n\nПопробуйте ещё раз.`, BACK_KEYBOARD);
    const text = context.message.text.trim();
    await submitAccounts(context, text);
};
async function submitAccounts(context, data) {
    await ilaBus.accounts.addAccounts(data);
    await context.reply("🙂 Аккаунты загружены!\n\n" +
        "Для того, чтобы аккаунты начали работать, нужно *перезагрузить скрипт* в главном меню.", { parse_mode: "Markdown" });
    await leaveScene(context);
}
async function leaveScene(context) {
    await menu_1.default.replyToContext(context, "/accounts_menu/");
    return context.scene.leave();
}
exports.default = scene;
