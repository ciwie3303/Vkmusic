"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const source_1 = require("telegraf-inline-menu/dist/source");
const bus_1 = require("../../main/bus");
const extensions_1 = require("../extensions");
const ilaBus = bus_1.getILABus();
const TRUE_DECORATOR = "включено";
const FALSE_DECORATOR = "отключено";
const switchDecorator = (bool) => bool ? TRUE_DECORATOR : FALSE_DECORATOR;
const listeningModeDecorator = (data) => {
    let text;
    switch (data) {
        case "parallel": {
            text = "параллельный";
            break;
        }
        case "queue": {
            text = "очередь";
            break;
        }
        default: {
            text = "не установлено (по умолчанию: параллельный)";
        }
    }
    return text;
};
let scriptOptions = {
    showAntiCaptchaKey: false,
    enableAuthorization: false,
    enableListening: false,
    enablePasswordChanging: false
};
const settingsMenu = new source_1.MenuTemplate(async () => {
    let settings = ilaBus.settings.getSettings();
    scriptOptions.enableAuthorization = !settings.skipAuthorization;
    scriptOptions.enablePasswordChanging = !settings.skipPasswordChanging;
    let listeningMethod = listeningModeDecorator(settings.listeningMode);
    let antiCaptchaValueText = (scriptOptions.showAntiCaptchaKey ? settings.antiCaptchaKey : "скрыто");
    let antiCaptchaBalance;
    if (settings.antiCaptchaKey) {
        try {
            antiCaptchaBalance = await ilaBus.settings.getAntiCaptchaBalance(settings.antiCaptchaKey);
        }
        catch (error) { }
    }
    let text = "⚙️ Вы попали в настройки скрипта\n\n" +
        `🔒 Количество потоков: *${(settings.threads || "не установлено")}*\n` +
        `🔒 Метод прослушивания: *${listeningMethod}*\n\n` +
        `📗 Ключ анти-капчи (anti-captcha.com): *${antiCaptchaValueText}*\n` +
        `📗 Авторизация при запуске: *${switchDecorator(!settings.skipAuthorization)}*\n` +
        `📗 Проверка сессий при запуске: *${switchDecorator(!settings.skipSessionChecking)}*\n` +
        `📗 Смена пароля после авторизации: *${switchDecorator(!settings.skipPasswordChanging)}*\n\n` +
        `💎 Баланс анти-капчи: *${antiCaptchaBalance || "Неизвестно"}* $\n\n`;
    let footer = "👩🏼‍🌾 Пункты помеченные замком (🔒), не могут быть изменены через бота.\n" +
        "Для того, чтобы поменять эти значения, нужно открыть _.env_ файл в корневой папке скрипта.";
    return {
        text: text + footer,
        parse_mode: "Markdown"
    };
});
settingsMenu.toggle("🔑 Показать ключ анти-капчи", "show-anticaptcha-key", {
    isSet(context) {
        return scriptOptions.showAntiCaptchaKey;
    },
    formatState() {
        return scriptOptions.showAntiCaptchaKey ? "😳 Скрыть ключ анти-капчи" : "🔑 Показать ключ анти-капчи";
    },
    set(context, state) {
        scriptOptions.showAntiCaptchaKey = state;
        return true;
    }
});
settingsMenu.interact("✏️ Изменить ключ анти-капчи", "edit-anticaptcha-key", {
    async do(context) {
        context.scene.enter("edit-anticaptcha-key");
        return true;
    }
});
settingsMenu.toggle("▶️ Включить авторизацию", "enable-authorization", {
    isSet(context) {
        return scriptOptions.enableAuthorization;
    },
    formatState() {
        return scriptOptions.enableAuthorization ? "⏸ Выключить авторизацию" : "▶️ Включить авторизацию";
    },
    set(context, state) {
        scriptOptions.enableAuthorization = state;
        ilaBus.settings.setAuthorizationState(state);
        return true;
    }
});
settingsMenu.toggle("▶️ Включить смену пароля", "enable-passwordchange", {
    isSet(context) {
        return scriptOptions.enablePasswordChanging;
    },
    formatState() {
        return scriptOptions.enablePasswordChanging ? "⏸ Выключить смену пароля" : "▶️ Включить смену пароля";
    },
    set(context, state) {
        scriptOptions.enablePasswordChanging = state;
        ilaBus.settings.setPasswordChangeState(state);
        return true;
    }
});
settingsMenu.manualRow(extensions_1.backButtons);
exports.default = settingsMenu;
