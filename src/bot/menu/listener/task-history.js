"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extensions_1 = require("../../extensions");
const bus_1 = require("../../../main/bus");
const source_1 = require("telegraf-inline-menu/dist/source");
const ilaBus = bus_1.getILABus();
const ENTRIES_PER_PAGE = 3;
let tasksCount;
const menuHistory = new source_1.MenuTemplate(async (context) => {
    const offset = context.session.page - 1 || 0;
    let tasks = ilaBus.listens.getHistory();
    tasksCount = tasks.length;
    tasks = tasks.slice(offset * ENTRIES_PER_PAGE, (offset * ENTRIES_PER_PAGE) + ENTRIES_PER_PAGE);
    return {
        text: "📓 История заданий\n\n" +
            `📃 Количество заданий: ${tasksCount}\n\n` +
            tasks.map(extensions_1.taskDecorator).join("\n\n"),
        parse_mode: "Markdown"
    };
});
menuHistory.interact("🔃 Обновить", "update", {
    do() { return true; }
});
menuHistory.pagination("test", {
    getCurrentPage(context) {
        return context.session.page;
    },
    getTotalPages(context) {
        return Math.ceil(tasksCount / ENTRIES_PER_PAGE);
    },
    setPage(context, pageNumber) {
        context.session.page = pageNumber;
    }
});
menuHistory.manualRow(extensions_1.backButtons);
exports.default = menuHistory;
