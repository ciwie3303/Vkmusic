"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataResourcePath = exports.splitIntoChunks = exports.getObjectHash = exports.parsePlaylistUrl = exports.getRandomElement = exports.fetchImageAsBase64 = exports.getProductVersion = exports.setConsoleTitle = exports.initLogger = void 0;
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = require("path");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
const initLogger = () => {
    let path = exports.getDataResourcePath(constants_1.DEBUG_FILENAME);
    if (!fs_1.default.existsSync(path)) {
        fs_1.default.writeFileSync(path, "");
    }
    const writeStream = fs_1.default.createWriteStream(path);
    logger_1.Logger.setWriteStream(writeStream);
};
exports.initLogger = initLogger;
const setConsoleTitle = (title) => {
    process.stdout.write(String.fromCharCode(27) + ']0;' + title + String.fromCharCode(7));
};
exports.setConsoleTitle = setConsoleTitle;
const getProductVersion = () => {
    const [major, minor, patch] = constants_1.VERSION.trim().split(".");
    let buffer = `${major}.${minor}`;
    if (patch != undefined && Number(patch) != 0) {
        buffer += "." + patch;
    }
    return buffer;
};
exports.getProductVersion = getProductVersion;
const fetchImageAsBase64 = async (imageUrl) => {
    let { data: arrayBuffer } = await axios_1.default.get(imageUrl, {
        responseType: "arraybuffer"
    });
    let binaryBuffer = Buffer.from(arrayBuffer, "binary");
    return binaryBuffer.toString("base64");
};
exports.fetchImageAsBase64 = fetchImageAsBase64;
const getRandomElement = (array, min = 0, max) => {
    max ?? (max = array.length);
    let random = min + Math.random() * (max - min) ^ 0;
    return array[random];
};
exports.getRandomElement = getRandomElement;
const PLAYLIST_URL_PATTERN = /vk\.com.+(?:audio_playlist|\/)(-?\d+)_(\d+)(?:(?:%2F|.|.+access_hash=)([a-z0-9]{18}))?/i;
const parsePlaylistUrl = (url) => {
    let matchResult = url.match(PLAYLIST_URL_PATTERN);
    if (!matchResult)
        return undefined;
    let [, ownerId, id, accessHash] = matchResult;
    return { ownerId, id, accessHash };
};
exports.parsePlaylistUrl = parsePlaylistUrl;
const getObjectHash = (data) => {
    return crypto_1.default
        .createHash("sha1")
        .update(JSON.stringify(data))
        .digest("hex");
};
exports.getObjectHash = getObjectHash;
const splitIntoChunks = (array, splitter) => {
    const chunks = [];
    const chunkSize = Math.ceil(array.length / splitter);
    for (let i = 0; i < splitter; i++) {
        let offset = chunkSize + (i * chunkSize);
        let chunk = array.slice(i * chunkSize, offset);
        if (chunk.length == 0)
            break;
        chunks.push(chunk);
    }
    return chunks;
};
exports.splitIntoChunks = splitIntoChunks;
const getDataResourcePath = (...paths) => {
    const dataPath = process.env.data_folder_path || "./data";
    return path_1.join(process.cwd(), dataPath, ...paths);
};
exports.getDataResourcePath = getDataResourcePath;
