"use strict";
var __importDefault = (this && this.__importDefault) || function(mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_inline_menu_1 = require("telegraf-inline-menu");
const bus_1 = require("../../main/bus");
const extensions_1 = require("../extensions");
const accounts_1 = __importDefault(require("./accounts"));
const listens_control_1 = __importDefault(require("./listener/listens-control"));
const proxy_1 = __importDefault(require("./proxy"));
const settings_1 = __importDefault(require("./settings"));
const telegraf_1 = require("telegraf");
const utils_1 = require("../../main/utils");
const events_1 = __importDefault(require("./events"));
const ilaBus = bus_1.getILABus();
let mainMenuBodyText = "Вы попали в *главное меню бота.* 🥰\n\n" +
    "Выберите нужный Вам пункт для дальнейших действий\.";
const menu = new telegraf_inline_menu_1.MenuTemplate(context => ({
    text: mainMenuBodyText,
    parse_mode: "Markdown"
}));
menu.submenu("🌏 Прокси", "proxy_menu", proxy_1.default);
menu.submenu("📒 Аккаунты", "accounts_menu", accounts_1.default, { joinLastRow: true });
menu.submenu("⚡️ Прослушивания", "listens_control_menu", listens_control_1.default);
menu.submenu("🔥 События", "events", events_1.default, { joinLastRow: true });
menu.submenu("⚙️ Настройки", "settings_menu", settings_1.default, { joinLastRow: true });
menu.interact("🍥 Перезагрузить скрипт", "reload_script", {
    async do(context) {
        await context.answerCbQuery("Restarting...");
        await ilaBus.restart();
        await extensions_1.sendTemporaryMessage(context, {
            message: "🤓 *Скрипт перезагружен*",
            delay: 4000,
            extra: { parse_mode: "Markdown" }
        });
        return true;
    }
});
menu.interact("🗿 Информация о скрипте/авторе", "about", {
    async do(context) {
        await context.answerCbQuery();
        extensions_1.sendTemporaryMessage(context, {
            message: "*Информация о ILA.*\n\n🐟 ILA - это многофункциональный скрипт, позволяющий " +
                "накручивать прослушивания, и организует прослушивания одновременно на неско" +
                "лько плейлистов. Сама ILA состоит из основного скрипта и бота ILA Control " +
                "Manager, который управляет всем этим делом.\n\n🐋 ILA Control Manager - это " +
                "бот, позволяет Вам контролировать работу скрипта.\n\n🦸🏻‍♂️ " +
                `📒 Текущая версия: ${utils_1.getProductVersion()}`,
            delay: 10000,
            extra: {
                parse_mode: "Markdown",
                ...telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback("Назад", "back")]
                ])
            }
        });
        return true;
    }
});
exports.default = new telegraf_inline_menu_1.MenuMiddleware("/", menu);