"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatEnabledTask = exports.convertPlaylistInfoToUrl = exports.getSelectedTask = exports.taskDecorator = exports.fetchTasks = exports.backButtons = exports.advanceSceneStep = exports.sendLoadMethodChoice = exports.asyncWrapper = exports.escapeMarkdownSymbols = exports.fetchArrayBuffer = exports.numberDeclination = exports.getStateReference = exports.sendTemporaryMessage = void 0;
const utils_1 = require("../main/utils");
const axios_1 = __importDefault(require("axios"));
const telegraf_1 = require("telegraf");
const telegraf_inline_menu_1 = require("telegraf-inline-menu");
const constants_1 = require("./constants");
const sendTemporaryMessage = async (context, { message, delay, extra }) => {
    let { message_id } = await context.reply(message, extra);
    setTimeout(() => context.deleteMessage(message_id), delay);
};
exports.sendTemporaryMessage = sendTemporaryMessage;
const getStateReference = (context) => {
    return context.wizard.state;
};
exports.getStateReference = getStateReference;
const numberDeclination = (int, variants) => {
    let cases = [2, 0, 1, 1, 1, 2];
    return variants[(int % 100 > 4 && int % 100 < 20)
        ? 2
        : cases[(int % 10 < 5) ? int % 10 : 5]];
};
exports.numberDeclination = numberDeclination;
const fetchArrayBuffer = async (url) => {
    const response = await axios_1.default.get(url, { responseType: "arraybuffer" });
    return response.data;
};
exports.fetchArrayBuffer = fetchArrayBuffer;
const escapeMarkdownSymbols = (text) => {
    return text
        .replace("_", "\\_")
        .replace("*", "\\*")
        .replace("[", "\\[")
        .replace("`", "\\`");
};
exports.escapeMarkdownSymbols = escapeMarkdownSymbols;
const asyncWrapper = (handler) => {
    return async (context) => {
        try {
            await handler(context);
        }
        catch (error) {
            let markup = constants_1.BACK_KEYBOARD.reply_markup;
            await context.reply(`${constants_1.ERROR_EMOJI} При выполнении команды произошла ошибка:\n\nПодробнее: *${error.message}*`, { parse_mode: "Markdown", reply_markup: markup });
        }
    };
};
exports.asyncWrapper = asyncWrapper;
function sendLoadMethodChoice(context) {
    return context.reply("☺ Выберите способ загрузки:", telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback(`${constants_1.FILE_EMOJI} Файл`, "file-format"),
            telegraf_1.Markup.button.callback(`${constants_1.TEXT_EMOJI} Текст`, "text-format")
        ],
        [telegraf_1.Markup.button.callback(constants_1.BACK_BUTTON_TEXT, "back")]
    ]));
}
exports.sendLoadMethodChoice = sendLoadMethodChoice;
const advanceSceneStep = (context, offset = 0) => {
    return context.wizard.selectStep(context.wizard.cursor + offset + 1);
};
exports.advanceSceneStep = advanceSceneStep;
exports.backButtons = telegraf_inline_menu_1.createBackMainMenuButtons("Назад", "Главное меню");
async function fetchTasks(context, ilaBus, vk) {
    const { session } = context;
    session.tasks = ilaBus.listens.getTasks();
    await Promise.all(session.tasks.map(async (task) => {
        try {
            const playlistContent = await vk.audio.fetchPlaylist(task.playlistMeta);
            task.playlistContent = playlistContent;
        }
        catch (error) {
            utils_1.Logger.error("Unable to get playlist info", error);
        }
    }));
    return session.tasks;
}
exports.fetchTasks = fetchTasks;
function taskDecorator(task) {
    task.nextIterationTime ?? (task.nextIterationTime = 0);
    const deltaTime = task.nextIterationTime - Date.now();
    const remainedSecound = Math.floor(deltaTime / 1000);
    const nextIterationTimeDecorator = remainedSecound >= 0
        ? `⏳ Следующее прослушивание через ${remainedSecound} сек.\n`
        : ``;
    const { playlistContent, playlistMeta: playlistInfo } = task;
    const listened = task.actualCount - task.initialCount;
    const remainedListens = (task.requiredCount - listened);
    const playlistUrl = convertPlaylistInfoToUrl(playlistInfo);
    const playlistText = playlistContent ? (`🐶 Название плейлиста: ${exports.escapeMarkdownSymbols(playlistContent.title)}\n` +
        `🐺 Владелец плейлиста: [${exports.escapeMarkdownSymbols(playlistContent.authorName)}](vk.com${playlistContent.authorHref})\n` +
        `📒 Описание плейлиста: _${exports.escapeMarkdownSymbols(playlistContent.description || "отсутсвует")}_\n` +
        `🏢 Официальный плейлист: _${playlistContent.isOfficial ? "да" : "нет"}_\n` +
        `🗽 Статус: _${task.enabled ? "включен" : "выключен"}_\n` +
        `📼 Плейлист: [ссылка](${playlistUrl})\n` +
        `🔉 Количество аудиозаписей: ${playlistContent.audioList.length}\n` +
        `🚄 Скорость прослушиваний: [${task.speed}] LPM\n` + nextIterationTimeDecorator +
        `🍏 Осталось прослушать: [${remainedListens > 0 ? remainedListens : 0}]\n` +
        `🍎 Фактическое кол-во прослушиваний: [${task.actualCount}]\n` +
        `🧲 Всего прослушано: [${listened}]`) : "🤬 Не могу получить информацию о плейлисте, пожалуйста удалите текущее задание и добавьте снова!";
    return playlistText;
}
exports.taskDecorator = taskDecorator;
function getSelectedTask({ session }) {
    return session.tasks[session.taskIndex];
}
exports.getSelectedTask = getSelectedTask;
function convertPlaylistInfoToUrl(playlistInfo) {
    return `vk.com/music/playlist/${playlistInfo.ownerId}_${playlistInfo.id}`;
}
exports.convertPlaylistInfoToUrl = convertPlaylistInfoToUrl;
function formatEnabledTask(value) {
    return value ? "выполняется" : "приостановлен";
}
exports.formatEnabledTask = formatEnabledTask;
