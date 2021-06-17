"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const bus_1 = require("../../main/bus");
const helpers_1 = require("../../main/utils/helpers");
const constants_1 = require("../constants");
const extensions_1 = require("../extensions");
const menu_1 = __importDefault(require("../menu"));
const ilaBus = bus_1.getILABus();
const addNewTaskScene = new telegraf_1.Scenes.WizardScene("add-new-task", extensions_1.asyncWrapper(async (context) => {
    let state = extensions_1.getStateReference(context);
    state.task = {};
    await context.reply("🔗 Укажите ссылку на плейлист.", constants_1.BACK_KEYBOARD);
    return context.wizard.next();
}), extensions_1.asyncWrapper(async (context) => {
    let state = extensions_1.getStateReference(context);
    if (context.message && "text" in context.message) {
        let string = context.message.text.trim();
        let result = helpers_1.parsePlaylistUrl(string);
        if (result) {
            state.task.playlistUrl = string;
            await context.reply("🙂 *Укажите требуемое кол-во прослушиваний.*\n\n" +
                "🎗 Указанное число, будет прибавлено к фактическому числу прослушиваний на плейлисте.\n" +
                "Как только заданное число прослушиваний выполнится, задание будет *удалено*", {
                reply_markup: constants_1.BACK_KEYBOARD.reply_markup,
                parse_mode: "Markdown"
            });
            return context.wizard.next();
        }
    }
    await context.reply(`${constants_1.ERROR_EMOJI} Некорректная ссылка на плейлист. Отправьте ещё раз.`, constants_1.BACK_KEYBOARD);
}), extensions_1.asyncWrapper(async (context) => {
    let state = extensions_1.getStateReference(context);
    if (context.message && "text" in context.message) {
        let number = Number(context.message.text);
        if (number != NaN && number >= 1) {
            state.task.totalCount = number;
            await context.replyWithMarkdown("📊 *Выберите приоритет для вашего задания*", telegraf_1.Markup.inlineKeyboard([
                [
                    telegraf_1.Markup.button.callback("🐢 Низкий", "priority-0"),
                    telegraf_1.Markup.button.callback("🌟 Средний", "priority-1"),
                    telegraf_1.Markup.button.callback("🔥 Высокий", "priority-2")
                ],
                [constants_1.BACK_BUTTON]
            ]));
            return;
        }
    }
    context.reply(`${constants_1.ERROR_EMOJI} Некорректное число. Попробуйте ещё раз.`, constants_1.BACK_KEYBOARD);
}));
addNewTaskScene.action(/priority-(\d+)/i, extensions_1.asyncWrapper(async (context) => {
    await context.answerCbQuery();
    if (!context.match) {
        await context.reply(`${constants_1.ERROR_EMOJI} Выберите приоритет\n\nЛибо вернитесь в меню прослушиваний`, {
            reply_markup: constants_1.BACK_KEYBOARD.reply_markup,
            parse_mode: "Markdown"
        });
        return;
    }
    const state = extensions_1.getStateReference(context);
    let [, priorityNumber] = context.match;
    priorityNumber = Number(priorityNumber);
    if (priorityNumber < 0 || priorityNumber > 3) {
        return context.reply(`${constants_1.ERROR_EMOJI} Некорректный приоритет.`, constants_1.BACK_KEYBOARD);
    }
    state.task.priority = priorityNumber;
    await ilaBus.listens.addTask(state.task);
    await await context.replyWithMarkdown(`🦁 *Задание добавлено*`);
    await finish(context);
}));
addNewTaskScene.action("back", extensions_1.asyncWrapper(async (context) => {
    await context.answerCbQuery();
    await finish(context);
}));
async function finish(context) {
    await menu_1.default.replyToContext(context, "/listens_control_menu/");
    return context.scene.leave();
}
exports.default = addNewTaskScene;
