"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAudioEnum = void 0;
const audio_exception_1 = __importStar(require("../../exceptions/audio_exception"));
const fetch_1 = require("../../net/fetch");
const constants_1 = require("../../utils/constants");
const AUDIO_ENUMS_PATTERN = /({AUDIO_ITEM_INDEX.+?})/i;
const COMMON_JS_FILE_PATTERN = /src="(\S+\/bundles\/common\.[a-z0-9]+\.js)(?:\?[a-z0-9]+)/i;
const fetch = fetch_1.fetchDecorator({
    headers: { "User-Agent": constants_1.DESKTOP_USER_AGENT }
});
const parseJson = (jsObject = {}) => JSON.parse(eval(`JSON.stringify(${jsObject})`));
const fetchCommonJSFile = async () => {
    let { data: pageHtml } = await fetch.get("https://vk.com/test");
    let pathMatchResult = pageHtml.match(COMMON_JS_FILE_PATTERN);
    if (!pathMatchResult) {
        throw new audio_exception_1.default({
            message: "Unable to get a common.js file",
            kind: audio_exception_1.AudioRejectKind.Failed,
            payload: pageHtml
        });
    }
    return fetch
        .get(pathMatchResult[1])
        .then(response => response.data);
};
const parseAudioEnum = async () => {
    let commonJSFile = await fetchCommonJSFile();
    let audioEnumMatchResult = commonJSFile?.match(AUDIO_ENUMS_PATTERN);
    if (!audioEnumMatchResult) {
        throw new audio_exception_1.default({
            message: "Unable to get the audio enum",
            kind: audio_exception_1.AudioRejectKind.Failed,
            payload: commonJSFile
        });
    }
    return parseJson(audioEnumMatchResult[1]);
};
exports.parseAudioEnum = parseAudioEnum;
