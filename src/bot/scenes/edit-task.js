"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const extensions_1 = require("../extensions");
const menu_1 = __importDefault(require("../menu"));
const bus_1 = require("../../main/bus");
const logger_1 = require("../../main/utils/logger");
const telegraf_1 = require("telegraf");
const bus = bus_1.getILABus();
const CHANGE_TASK_KEYBOARD = telegraf_1.Markup.inlineKeyboard([
    [telegraf_1.Markup.button.callback("Скорость", "task-speed")],
    [constants_1.BACK_BUTTON]
]);
const scene = new telegraf_1.Scenes.WizardScene("edit-task", extensions_1.asyncWrapper(async (context) => {
    const { task } = extensions_1.getStateReference(context);
    const title = task.playlistContent?.title ?? " ";
    await context.reply(`✏ Изменение задания ${title}🤨\n\nЧто хотите поменять?`, CHANGE_TASK_KEYBOARD);
}), extensions_1.asyncWrapper(async (context) => {
    if (!context.message || !("text" in context.message)) {
        return sendIncorrectError(context);
    }
    const number = Number(context.message.text.trim());
    const { sessions } = bus.getCache();
    const { task } = extensions_1.getStateReference(context);
    if (!number) {
        return sendIncorrectError(context);
    }
    else if (number < 0 || number > sessions.length) {
        return sendIncorrectNumber(context);
    }
    try {
        await bus.listens.editTask(task.id, { maxSessionsCount: number });
        await context.reply("😁 Задание успешно изменило свое ограничение");
    }
    catch (error) {
        await context.reply("🤬 При установке ограничения произошла ошибка, подробнее в консоли.");
        logger_1.Logger.error(error);
    }
    await leaveScene(context);
}));
scene.action("task-speed", extensions_1.asyncWrapper(async (context) => {
    await context.answerCbQuery();
    const { task } = extensions_1.getStateReference(context);
    const { sessions } = bus.getCache();
    await context.reply("👽 Укажите максимальное кол-во сессий для задания.\n\n" +
        "Вы указываете число, которое служит ограничением в накрутке, " +
        "заданное число позволяет сказать скрипту, какое максимальное количество сессий, " +
        "будет задействовано для прослушивания, конкретно, этого задания.\n\n" +
        `❕ Максимальное допустимое число сессий: ${sessions.length}\n` +
        `❕ Чтобы отключить ограничение, напишите 0\n` +
        "❕ Текущее ограничение: " + (task.maxSessionsCount || "не задано"), constants_1.BACK_KEYBOARD);
    return context.wizard.next();
}));
scene.action("back", extensions_1.asyncWrapper(async (context) => {
    await context.answerCbQuery();
    await leaveScene(context);
}));
function sendIncorrectNumber(context) {
    const { sessions } = bus.getCache();
    return context.reply("🤬 Число не может быть отрицательным!\n\n" +
        `❕ Пожалуйста, укажите натуральное число, которое не превышает кол-во сессий: ${sessions.length}.\n` +
        `❕ Чтобы отключить ограничение, отправьте 0.`);
}
function sendIncorrectError(context) {
    return context.reply("😒 Пожалуйста, укажите максимальное кол-во сессий:", constants_1.BACK_KEYBOARD);
}
async function leaveScene(context) {
    await menu_1.default.replyToContext(context, "/listens_control_menu/");
    await context.scene.leave();
}
exports.default = scene;
