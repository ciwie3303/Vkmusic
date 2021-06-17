"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extensions_1 = require("../extensions");
const bus_1 = require("../../main/bus");
const source_1 = require("telegraf-inline-menu/dist/source");
const bus = bus_1.getILABus();
const eventsStringify = {
    "authorization"(data) {
        return `Идет авторизация, кол-во аккаунтов ${data.accounts.length}`;
    },
    "initializing"(data) {
        return "Идет инициализация скрипта";
    },
    "listening"(data) {
        return `Идут прослушивания, кол-во сессий ${data.sessions.length}`;
    },
    "password_changing"(data) {
        return "Идет изменение паролей у аккаунтов";
    },
    "sessions_updating"(data) {
        return `Идет обновление сессий, кол-во сессий ${data.sessions.length}`;
    }
};
const eventDecorator = (event) => {
    let string = eventsStringify[event.type](event.payload.data);
    let date = new Date(event.payload.date);
    return `🔹 (${date.toLocaleTimeString("ru-RU")}): ${string}`;
};
const eventsMenu = new source_1.MenuTemplate(async (context) => {
    const events = bus.getEvents();
    return {
        text: (`🔥 *Последние события*\n\n` +
            events.sort((a, b) => a.payload.date < b.payload.date ? 1 : -1).map(eventDecorator).join("\n")),
        parse_mode: "Markdown"
    };
});
eventsMenu.interact("🔃 Обновить", "update", {
    do() {
        return true;
    }
});
eventsMenu.manualRow(extensions_1.backButtons);
exports.default = eventsMenu;
