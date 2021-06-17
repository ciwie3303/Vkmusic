"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const source_1 = require("telegraf-inline-menu/dist/source");
const index_1 = require("../../../main/index");
const extensions_1 = require("../../extensions");
const vk_api_1 = require("../../../library/vk_api");
const task_control_1 = __importDefault(require("./task-control"));
const task_history_1 = __importDefault(require("./task-history"));
const ENTRIES_PER_PAGE = 3;
const ilaBus = index_1.getILABus();
const vk = new vk_api_1.VK();
const listensControlMenu = new source_1.MenuTemplate(async (context) => {
    let tasks = await extensions_1.fetchTasks(context, ilaBus, vk);
    return {
        text: "Управление прослушиваниями 🤟🏼\n\n" +
            "Вы можете временно включить или отключить прослушивания на плейлисты. 🥶\n" +
            "А так же управлять заданиями, для повышения эффективности работы скрипта.\n\n" +
            `📃 Количество заданий: ${tasks.length}\n` +
            "🐱 *Выберите задание*, над которым вы хотите произвести изменения.",
        parse_mode: "Markdown"
    };
});
listensControlMenu.chooseIntoSubmenu("selected-task", ({ session }) => {
    return session.tasks?.map((_, index) => index + 1) || [];
}, task_control_1.default, {
    maxRows: 1,
    columns: ENTRIES_PER_PAGE,
    getCurrentPage: context => context.session.page,
    setPage: (context, page) => {
        context.session.page = page;
    },
    async buttonText({ session }, key) {
        const number = Number(key) - 1;
        const selectedTask = session.tasks[number];
        if (!selectedTask)
            return "ila_task_" + number;
        return `${getStatusEmoji(selectedTask.enabled)} ${selectedTask.playlistContent?.title}`;
    }
});
listensControlMenu.toggle("", "toggle_cheat", {
    isSet() {
        return ilaBus.listens.isRunning();
    },
    async set(context, newState) {
        try {
            newState
                ? ilaBus.listens.run()
                : await ilaBus.listens.stop();
        }
        catch (error) {
            console.error(error);
            await extensions_1.sendTemporaryMessage(context, {
                message: "⛔ Произошла ошибка: " + error.message,
                delay: 3000
            });
        }
        finally {
            await context.answerCbQuery();
        }
        return true;
    },
    formatState($, __, state) {
        let tag = "⏯";
        return state ? `${tag} Остановить прослушивания` : `${tag} Возобновить прослушивания`;
    }
});
listensControlMenu.interact("➕ Добавить задание", "add-task", {
    async do(context) {
        context.scene.enter("add-new-task");
        return true;
    },
    joinLastRow: true
});
listensControlMenu.interact("📊 Статистика", "metrics", {
    async do(context) {
        let metrics = ilaBus.listens.getMetrics();
        await extensions_1.sendTemporaryMessage(context, {
            message: "📊 Статистика прослушиваний\n\n" +
                `👽 Количество прослушиваний за сутки: ${metrics.listens}`,
            delay: 5000
        });
        return true;
    }
});
listensControlMenu.submenu("📝 История заданий", "history", task_history_1.default, {
    joinLastRow: true
});
listensControlMenu.interact("🔄 Обновить", "update", {
    do: () => true
});
listensControlMenu.manualRow(extensions_1.backButtons);
function getStatusEmoji(value) {
    return value ? "\ud83c\udf00" : "💤";
}
exports.default = listensControlMenu;
