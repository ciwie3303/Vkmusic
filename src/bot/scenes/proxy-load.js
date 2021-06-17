"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const bus_1 = require("../../main/bus");
const menu_1 = __importDefault(require("../menu"));
const constants_1 = require("../constants");
const extensions_1 = require("../extensions");
const ilaBus = bus_1.getILABus();
const BACK_BUTTON = telegraf_1.Markup.button.callback(constants_1.BACK_BUTTON_TEXT, "back");
const BACK_KEYBOARD = telegraf_1.Markup.inlineKeyboard([
    [BACK_BUTTON]
]);
const proxyLoadScene = new telegraf_1.Scenes.WizardScene("proxy-load", extensions_1.asyncWrapper(extensions_1.sendLoadMethodChoice), extensions_1.asyncWrapper(async (context) => {
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
const fileProcess = async (context) => {
    if (!context.message || !("document" in context.message))
        return context.reply(`${constants_1.ERROR_EMOJI} Отсутствует документ содержащий прокси-адреса.\n\nПопробуйте ещё раз.`, BACK_KEYBOARD);
    const { document } = context.message;
    const { type } = extensions_1.getStateReference(context);
    if (document.mime_type != "text/plain") {
        return context.reply("Некорректный формат файла.\n\nПожалуйста, укажите текстовый документ.", BACK_KEYBOARD);
    }
    let response = await context.telegram.getFileLink(document.file_id);
    let buffer = await extensions_1.fetchArrayBuffer(response.href);
    ilaBus.proxy.addProxy(type.toLowerCase(), buffer);
    await context.reply("Прокси успешно загружены!");
    await leaveScene(context);
};
const textProcess = async (context) => {
    if (!context.message || !("text" in context.message))
        return context.reply(`${constants_1.ERROR_EMOJI} Вы не отправили список прокси-адресов.\n\nПопробуйте ещё раз.`, BACK_KEYBOARD);
    const { type } = extensions_1.getStateReference(context);
    const text = context.message.text.trim();
    await ilaBus.proxy.addProxy(type.toLowerCase(), text);
    await context.reply("Прокси успешно загружены!");
    await leaveScene(context);
};
async function leaveScene(context) {
    await menu_1.default.replyToContext(context, "/proxy_menu/");
    return context.scene.leave();
}
proxyLoadScene.action("file-format", extensions_1.asyncWrapper(async (context) => {
    context.wizard.selectStep(0);
    const state = extensions_1.getStateReference(context);
    await context.answerCbQuery();
    await context.reply(`Отправьте мне документ содержащий список ${state.type} прокси-адресов:`, BACK_KEYBOARD);
    state.method = 0;
    extensions_1.advanceSceneStep(context);
}));
proxyLoadScene.action("text-format", extensions_1.asyncWrapper(async (context) => {
    context.wizard.selectStep(0);
    const state = extensions_1.getStateReference(context);
    await context.answerCbQuery();
    await context.reply(`Отправьте мне список ${state.type} прокси-адресов:`, BACK_KEYBOARD);
    state.method = 1;
    extensions_1.advanceSceneStep(context);
}));
proxyLoadScene.action("back", extensions_1.asyncWrapper(async (context) => {
    await context.answerCbQuery();
    await leaveScene(context);
}));
exports.default = proxyLoadScene;
