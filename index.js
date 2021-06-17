"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./src/main/index");
const utils_1 = require("./src/main/utils");
const readline_1 = require("readline");
const ila = new index_1.ILA({ rootPath: __dirname });
const readline = readline_1.createInterface({
    input: process.stdin,
    output: process.stdout
});
runAssistant(init);
async function init() {
    const version = utils_1.getProductVersion();
    utils_1.Logger.log("🔮 ILA version:", version);
    utils_1.setConsoleTitle("🔮 ILA v" + version);
    index_1.setIlaInstance(ila);
    try {
        await ila.init();
        await start();
    }
    catch (error) {
        utils_1.Logger.error(error);
    }
}
async function start() {
    const { default: bot } = require("./src/bot/index");
    await bot.launch();
    utils_1.Logger.log("Bot lauched");
    await ila.start();
}
function runAssistant(onReady) {
    const prefix = "[ila assistant]";
    const ask = (query) => new Promise((resolve) => (readline.question(formatQuery(query), (answer) => resolve(answer.trim()))));
    const { settings } = ila.storage;
    const steps = {
        async askBotToken() {
            if (settings.data.botToken)
                return this.askBotPassword();
            const answer = await ask("Enter the telegram bot token: ");
            if (answer.length != 46) {
                printError("Incorrect bot token");
                return this.askBotToken();
            }
            settings.data.botToken = answer;
            return this.askBotPassword();
        },
        async askBotPassword() {
            if (settings.data.botPassword)
                return this.askThreadsNumber();
            const answer = await ask(`Enter the bot password: `);
            if (!answer) {
                printError("Incorrect bot password!");
                return this.askBotPassword();
            }
            settings.data.botPassword = answer;
            return this.askThreadsNumber();
        },
        async askThreadsNumber() {
            if (settings.data.threads)
                return this.askAntiCaptchaKey();
            const answer = await ask(`Enter the number of threads: `);
            if (!answer) {
                settings.data.threads = 4;
                return this.askAntiCaptchaKey();
            }
            if (!isNaturalNumber(answer) || !inRange(answer, 1, 128)) {
                printError("Incorrect threads number");
                return this.askThreadsNumber();
            }
            settings.data.threads = Number(answer);
            return this.askAntiCaptchaKey();
        },
        async askAntiCaptchaKey() {
            if (settings.data.antiCaptchaKey)
                return this.stop();
            const answer = await ask(`Enter the anti captcha key (default: ${settings.data.antiCaptchaKey}): `);
            if (answer.length != 32) {
                printError("Incorrect anti-captcha key");
                return this.askAntiCaptchaKey();
            }
            settings.data.antiCaptchaKey = answer;
            return this.stop();
        },
        start() {
            return this.askBotToken();
        },
        stop() {
            readline.close();
            settings.save();
            onReady();
        }
    };
    steps.start();
    function inRange(value, from, to) {
        value = Number(value);
        return (from >= value && value <= to);
    }
    function isNaturalNumber(value) {
        let number = Number(value);
        if (number == NaN || number < 0) {
            return false;
        }
        return true;
    }
    function printLog(message) {
        console.log(formatQuery(message));
    }
    function printError(message) {
        console.log(`${utils_1.Logger.ForegroundColors.FgRed}${prefix}:${utils_1.Logger.SpecialSymbols.Reset} ${message}`);
    }
    function formatQuery(...queries) {
        return `${utils_1.Logger.ForegroundColors.FgCyan}${prefix}:${utils_1.Logger.SpecialSymbols.Reset} ${queries.join(" ")}`;
    }
}
function exitHandler() {
    utils_1.Logger.log("Saving the state to the cache...");
    ila.stop().then(() => {
        utils_1.Logger.log("Exit the process...");
        process.kill(0);
    });
}
process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', (error) => {
    utils_1.Logger.error("Uncaught error:", error);
    exitHandler();
});
