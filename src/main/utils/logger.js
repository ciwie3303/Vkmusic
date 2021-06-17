"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs_1 = require("fs");
const stream_1 = require("stream");
class LoggerWriteStream extends stream_1.Writable {
    constructor() {
        super();
    }
    _write(chunk, encoding, callback) {
        callback();
    }
    ;
}
var Logger;
(function (Logger) {
    let SpecialSymbols;
    (function (SpecialSymbols) {
        SpecialSymbols["Reset"] = "\u001B[0m";
        SpecialSymbols["Bright"] = "\u001B[1m";
        SpecialSymbols["Dim"] = "\u001B[2m";
        SpecialSymbols["Underscore"] = "\u001B[4m";
        SpecialSymbols["Blink"] = "\u001B[5m";
        SpecialSymbols["Reverse"] = "\u001B[7m";
        SpecialSymbols["Hidden"] = "\u001B[8m";
    })(SpecialSymbols = Logger.SpecialSymbols || (Logger.SpecialSymbols = {}));
    let ForegroundColors;
    (function (ForegroundColors) {
        ForegroundColors["FgBlack"] = "\u001B[30m";
        ForegroundColors["FgRed"] = "\u001B[31m";
        ForegroundColors["FgGreen"] = "\u001B[32m";
        ForegroundColors["FgYellow"] = "\u001B[33m";
        ForegroundColors["FgBlue"] = "\u001B[34m";
        ForegroundColors["FgMagenta"] = "\u001B[35m";
        ForegroundColors["FgCyan"] = "\u001B[36m";
        ForegroundColors["FgWhite"] = "\u001B[37m";
    })(ForegroundColors = Logger.ForegroundColors || (Logger.ForegroundColors = {}));
    let BackgroundColors;
    (function (BackgroundColors) {
        BackgroundColors["BgBlack"] = "\u001B[40m";
        BackgroundColors["BgRed"] = "\u001B[41m";
        BackgroundColors["BgGreen"] = "\u001B[42m";
        BackgroundColors["BgYellow"] = "\u001B[43m";
        BackgroundColors["BgBlue"] = "\u001B[44m";
        BackgroundColors["BgMagenta"] = "\u001B[45m";
        BackgroundColors["BgCyan"] = "\u001B[46m";
        BackgroundColors["BgWhite"] = "\u001B[47m";
    })(BackgroundColors = Logger.BackgroundColors || (Logger.BackgroundColors = {}));
    const groups = {
        count: 0,
        backgroundColor: BackgroundColors.BgMagenta,
        foregroundColor: ForegroundColors.FgMagenta,
        builderParams: {}
    };
    groups.builderParams = {
        foregroundColor: groups.foregroundColor,
        backgroundColor: groups.backgroundColor,
        showPointer: false,
        showCurrentTime: false
    };
    let writeStream = new LoggerWriteStream();
    function setWriteStream(stream) {
        writeStream = stream;
    }
    Logger.setWriteStream = setWriteStream;
    function clear() {
        console.clear();
    }
    Logger.clear = clear;
    function log(...messages) {
        let buffer = getConsoleBuilderBuffer("LOG", {
            backgroundColor: BackgroundColors.BgCyan,
            foregroundColor: ForegroundColors.FgCyan
        });
        console.log(buffer, ...messages);
        logToFile("log", ...messages);
    }
    Logger.log = log;
    function warn(...messages) {
        let buffer = getConsoleBuilderBuffer("WARN", {
            backgroundColor: BackgroundColors.BgYellow,
            foregroundColor: ForegroundColors.FgYellow
        });
        console.log(buffer, ...messages);
        logToFile("warn", ...messages);
    }
    Logger.warn = warn;
    function debug(...messages) {
        let buffer = getConsoleBuilderBuffer("DEBUG", {
            backgroundColor: BackgroundColors.BgGreen,
            foregroundColor: ForegroundColors.FgGreen
        });
        console.log(buffer, ...messages);
    }
    Logger.debug = debug;
    function error(...messages) {
        let buffer = getConsoleBuilderBuffer("ERROR", {
            backgroundColor: BackgroundColors.BgRed,
            foregroundColor: ForegroundColors.FgRed
        });
        console.log(buffer, ...messages);
        logToFile("error", ...messages);
    }
    Logger.error = error;
    function group(...messages) {
        let buffer = getConsoleBuilderBuffer("GROUP", groups.builderParams);
        console.log(`${buffer}${ForegroundColors.FgMagenta}`, ...messages, SpecialSymbols.Reset);
        groups.count++;
    }
    Logger.group = group;
    function groupEnd(...messages) {
        if (groups.count != 0) {
            groups.count--;
            let buffer = getConsoleBuilderBuffer("GROUP", groups.builderParams);
            console.log(buffer + groups.foregroundColor, ...messages, SpecialSymbols.Reset, "\n");
        }
    }
    Logger.groupEnd = groupEnd;
    function logToFile(prefix = "ila-log", ...messages) {
        let date = new Date();
        let dateLocaled = date.toLocaleDateString("ru-RU");
        let timeLocaled = date.toLocaleTimeString("ru-RU");
        let endOfLine = "\n";
        let normailizedMessages = messages.map(data => {
            if (!data)
                return "undefined";
            if (data instanceof Error) {
                return data.stack;
            }
            if (typeof data == "object") {
                return JSON.stringify(data, null, "\t");
            }
            return data.toString();
        }).join(" ");
        if (writeStream instanceof fs_1.WriteStream)
            writeStream.write(`(${dateLocaled} ${timeLocaled}) [${prefix}]: ${normailizedMessages}${endOfLine}`);
    }
    const DEFAULT_CONSOLE_BUILDER_OPTIONS = {
        foregroundColor: ForegroundColors.FgCyan,
        backgroundColor: BackgroundColors.BgCyan,
        showLabel: true,
        showPointer: true,
        considerGroup: true,
        showCurrentTime: true
    };
    function getConsoleBuilderBuffer(label, options) {
        options = {
            ...DEFAULT_CONSOLE_BUILDER_OPTIONS,
            ...options
        };
        let buffer = "";
        let { showCurrentTime, showPointer, showLabel, foregroundColor, backgroundColor, considerGroup } = options;
        if (considerGroup && groups.count > 0) {
            let tabString = "\t".repeat(groups.count);
            let verticalLine = `${groups.foregroundColor}|${SpecialSymbols.Reset}`;
            buffer += `${tabString}${verticalLine} `;
        }
        if (showCurrentTime) {
            let dateTime = new Date();
            let timeString = `${foregroundColor}[${dateTime.toLocaleTimeString()}]${SpecialSymbols.Reset} `;
            buffer += timeString;
        }
        if (showLabel) {
            let labelString = `${SpecialSymbols.Bright}${backgroundColor} ${label} ${SpecialSymbols.Reset} `;
            buffer += labelString;
        }
        if (showPointer) {
            let pointerString = `${foregroundColor}${SpecialSymbols.Blink}>>${SpecialSymbols.Reset}`;
            buffer += pointerString;
        }
        return buffer;
    }
})(Logger = exports.Logger || (exports.Logger = {}));
