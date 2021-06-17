"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extensions_1 = require("../../extensions");
const vk_api_1 = require("../../../library/vk_api");
const bus_1 = require("../../../main/bus");
const utils_1 = require("../../../main/utils");
const source_1 = require("telegraf-inline-menu/dist/source");
const bus = bus_1.getILABus();
const vk = new vk_api_1.VK();
const taskMenu = new source_1.MenuTemplate(renderMenuBody);
taskMenu.interact("🗑 Удалить задание", "delete-task", {
    async do(context) {
        try {
            await context.answerCbQuery();
            const { tasks, taskIndex } = context.session;
            const selectedTask = tasks[taskIndex];
            if (!selectedTask) {
                await extensions_1.sendTemporaryMessage(context, {
                    message: "😥 Не удается получить текущее задание, для удаления",
                    delay: 3000
                });
                return "..";
            }
            await bus.listens.deleteTask(selectedTask.id);
            await extensions_1.sendTemporaryMessage(context, {
                message: "😁 Задание удалено.",
                delay: 2000
            });
            return "..";
        }
        catch (error) {
            await extensions_1.sendTemporaryMessage(context, {
                message: "😥 Ошибка при удалении задания.",
                delay: 3000
            });
            return false;
        }
    },
    hide({ session }) {
        return session.taskIndex == undefined || session.taskIndex < 0;
    }
});
taskMenu.interact("✏ Изменить задание", "change-task", {
    async do(context) {
        const { tasks, taskIndex } = context.session;
        const task = tasks[taskIndex];
        await context.scene.enter("edit-task", { task });
        return true;
    },
    joinLastRow: true
});
taskMenu.interact("🔃 Обновить информацию", "update", {
    do: () => true
});
taskMenu.manualRow(extensions_1.backButtons);
async function renderMenuBody(context) {
    if (!context.match) {
        return "Вы не выбрали задание, пожалуйста вернитесь в главное меню";
    }
    const { session } = context;
    session.taskIndex = Number(context.match[1]) - 1;
    const selectedTask = extensions_1.getSelectedTask(context);
    if (!selectedTask.playlistContent) {
        try {
            selectedTask.playlistContent = await vk.audio.fetchPlaylist(selectedTask.playlistMeta);
        }
        catch (error) {
            utils_1.Logger.error("Cannot to get info of playlist", selectedTask.playlistMeta);
            await extensions_1.sendTemporaryMessage(context, {
                message: "😶 Не могу получить информацию о плейлисте.",
                delay: 3000
            });
        }
    }
    const playlistText = extensions_1.taskDecorator(selectedTask);
    const headerText = `*Задание №${session.taskIndex + 1}* ` +
        `_(${extensions_1.formatEnabledTask(selectedTask.enabled)})_\n\n`;
    return {
        text: headerText + playlistText,
        parse_mode: "Markdown"
    };
}
exports.default = taskMenu;
