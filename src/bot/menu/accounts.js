"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const source_1 = require("telegraf-inline-menu/dist/source");
const bus_1 = require("../../main/bus");
const constants_1 = require("../constants");
const extensions_1 = require("../extensions");
const ilaBus = bus_1.getILABus();
const ADD_ACCOUNT_TEXT = "➕ Добавить";
const DOWNLOAD_ACCOUNTS_TEXT = "📥 Скачать";
const ACCOUNTS_DECLINATION = ["аккаунт", "аккаунта", "аккаунтов"];
const getAccountsCountString = async () => {
    let accounts = await ilaBus.accounts.getAccounts();
    let text = accounts.length
        ? "🙂 Кол-во аккаунтов: " + accounts.length
        : "😳 Список аккаунтов пуст";
    return text;
};
const accountsMenu = new source_1.MenuTemplate(async () => {
    let accountsCount = await getAccountsCountString();
    let text = "📒 Управление аккаунтами\n\n" +
        '❗️ Будьте осторожны с кнопкой "очистить".\nПри нажатии на неё, ' +
        'вы *удалите все* аккаунты, которые были в скрипте.\n\n' + accountsCount;
    return {
        text, parse_mode: "Markdown"
    };
});
accountsMenu.interact(DOWNLOAD_ACCOUNTS_TEXT, "download-accounts", {
    async do(context) {
        context.answerCbQuery();
        let accounts = await ilaBus.accounts.getAccounts();
        if (accounts.length < 1) {
            await extensions_1.sendTemporaryMessage(context, {
                message: "😶 Список аккаунтов пуст.",
                delay: 3000
            });
            return false;
        }
        let buffer = await ilaBus.accounts.getAcccountsFile();
        const declination = extensions_1.numberDeclination(accounts.length, ACCOUNTS_DECLINATION);
        const caption = `🐖 Файл получен.\n📔 Файл содержит ${accounts.length} ${declination}.`;
        await context.replyWithDocument({
            source: buffer,
            filename: `${constants_1.FILENAME_PREFIX}_accounts.txt`
        }, { caption });
        return true;
    }
});
accountsMenu.interact(ADD_ACCOUNT_TEXT, "add-account", {
    async do(context) {
        context.scene.enter("accounts-add");
        return true;
    },
    joinLastRow: true
});
accountsMenu.manualRow(extensions_1.backButtons);
exports.default = accountsMenu;
