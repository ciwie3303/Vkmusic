"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const source_1 = require("telegraf-inline-menu/dist/source");
const bus_1 = require("../../main/bus");
const logger_1 = require("../../main/utils/logger");
const extensions_1 = require("../extensions");
const constants_1 = require("../constants");
const ilaBus = bus_1.getILABus();
const PROXY_DECLINATION = ["прокси-адрес", "прокси-адреса", "прокси-адресов"];
const proxyMenuBodyText = "*Прокси-меню.* 🌏\n\n" +
    "Здесь вы можете добавить или выгрузить список всех прокси, используемые в скрипте. 😀\n\n" +
    "Скрипт поддерживает 4 типа прокси-адресов: _HTTP, HTTPS, SOCKS4, SOCKS5_.";
let selectedProxy = "";
const proxyMenu = new source_1.MenuTemplate(async (context) => {
    let proxyString;
    let proxy = selectedProxy && ilaBus.proxy.getProxy();
    if (proxy) {
        let currentProxyLength = selectedProxy.toLowerCase() == "http" ? proxy.http.length : proxy.socks.length;
        proxyString = `\n\n🐼 Кол-во ${selectedProxy} прокси-адресов: ${currentProxyLength}`;
    }
    return {
        text: proxyMenuBodyText + (proxyString ? proxyString : ""),
        parse_mode: "Markdown"
    };
});
proxyMenu.select("proxy-select", ["HTTP", "SOCKS"], {
    set(context, key) {
        selectedProxy = key;
        return true;
    },
    async isSet(context, key) {
        return key == selectedProxy;
    }
});
proxyMenu.interact("📲 Скачать", "proxy-download", {
    hide() {
        return !Boolean(selectedProxy);
    },
    async do(context) {
        await context.answerCbQuery();
        try {
            const response = await ilaBus.proxy.getProxyFile(selectedProxy == "HTTP" ? "http" : "socks5");
            if (response.file.size == 0) {
                await extensions_1.sendTemporaryMessage(context, {
                    message: "😶 Файл с указанными прокси-адресами пуст.",
                    delay: 2000
                });
                return true;
            }
            const dataSize = response.data.length;
            const declination = extensions_1.numberDeclination(dataSize, PROXY_DECLINATION);
            const caption = `🐖 (${selectedProxy.toUpperCase()}) Файл получен.\n📔 Файл содержит ${dataSize} ${declination}.`;
            await context.replyWithDocument({
                source: response.file.buffer,
                filename: `${constants_1.FILENAME_PREFIX}_${selectedProxy.toLowerCase()}_proxy.txt`
            }, { caption });
            return true;
        }
        catch (error) {
            logger_1.Logger.error(error);
            context.reply("Произошла ошибка при получении файла.\n\nПодробнее: ");
        }
        finally {
            return false;
        }
    }
});
proxyMenu.interact("➕ Добавить", "proxy-add", {
    hide() {
        return !Boolean(selectedProxy);
    },
    async do(context) {
        context.scene.enter("proxy-load", { type: selectedProxy });
        return true;
    },
    joinLastRow: true
});
proxyMenu.manualRow(extensions_1.backButtons);
exports.default = proxyMenu;
