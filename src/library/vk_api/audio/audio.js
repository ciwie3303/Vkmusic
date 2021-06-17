"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAuthorName = void 0;
const cheerio_1 = __importDefault(require("cheerio"));
const querystring_1 = require("querystring");
const exceptions_1 = require("../../exceptions");
const audio_exception_1 = require("../../exceptions/audio_exception");
const audio_parser_1 = require("./audio_parser");
const audio_ad_1 = __importDefault(require("./ad/audio_ad"));
const LISTEN_SEC = 35;
class VKAudio {
    constructor(context) {
        this.context = context;
        this.fetchConfig = {
            headers: { "x-requested-with": "XMLHttpRequest" }
        };
        this.deviceId = VKAudio.getDeviceId();
        this.ad = new audio_ad_1.default(context);
    }
    async startPlayback(audio) {
        const options = {
            al: 1,
            act: "start_playback",
            audio_id: audio.id,
            owner_id: audio.ownerId,
            hash: audio.hashes.actionHash,
            uuid: this.deviceId
        };
        const { data } = await this.context.fetch.post("/al_audio.php?act=start_playback", querystring_1.stringify(options), this.fetchConfig);
        return this.processResponse(data);
    }
    async sendQueueParams(audio) {
        const options = {
            al: 1,
            act: "queue_params",
            audio_id: audio.id,
            owner_id: audio.ownerId,
            hash: audio.hashes.actionHash
        };
        const { data } = await this.context.fetch.post("/al_audio.php?act=queue_params", querystring_1.stringify(options), this.fetchConfig);
        return this.processResponse(data);
    }
    async listenAudio(audio, playlist, extListenedData = {}) {
        extListenedData.context ?? (extListenedData.context = AudioContext.ALBUM_PAGE);
        extListenedData.end_stream_reason ?? (extListenedData.end_stream_reason = AudioStopReason.STOP_BUTTON);
        extListenedData.listened ?? (extListenedData.listened = LISTEN_SEC);
        let hasAccessHash = Boolean(playlist.accessHash);
        extListenedData.playlist_id = `${playlist.ownerId}_${playlist.id}`;
        if (hasAccessHash)
            extListenedData.playlist_id += `_${playlist.accessHash}`;
        let options = {
            al: 1,
            v: 5,
            act: "listened_data",
            state: "app",
            impl: "html5",
            hash: audio.hashes.urlHash,
            audio_id: audio.fullId,
            track_code: audio.trackCode,
            ...extListenedData
        };
        let { data } = await this.context.fetch.post("/al_audio.php", querystring_1.stringify(options), this.fetchConfig);
        return this.processResponse(data);
    }
    reloadAudios(audios) {
        let chunkSize = 0x5;
        let promiseChunks = [];
        for (let audioIndex = 0; audioIndex < 15; audioIndex += chunkSize) {
            let audioFullIdsChunk = [];
            let audiosChunk = audios.slice(audioIndex, audioIndex + chunkSize);
            if (audiosChunk.length < 1)
                break;
            for (let { fullId, url, hashes: { actionHash, urlHash } } of audiosChunk) {
                if (!url && urlHash) {
                    audioFullIdsChunk.push(`${fullId}_${actionHash}_${urlHash}`);
                }
            }
            let promise = this.fetchAudioUrls(audioFullIdsChunk)
                .catch(error => this.handleFetchAudioError(error, audioFullIdsChunk));
            promiseChunks.push(promise);
        }
        return Promise.all(promiseChunks)
            .then(data => data.reduce((acc, chunk) => acc.concat(chunk), []));
    }
    async fetchPlaylist(playlistInfo) {
        let { data } = await this.context.fetch.post("/al_audio.php?act=load_section", querystring_1.stringify({
            al: 1,
            act: "load_section",
            type: "playlist",
            playlist_id: playlistInfo.id,
            owner_id: playlistInfo.ownerId,
            access_hash: playlistInfo.accessHash,
            is_loading_all: 1,
            claim: 0,
            offset: 0
        }), this.fetchConfig);
        let { data: [playlistData] } = this.processResponse(data);
        if (!playlistData) {
            throw new exceptions_1.AudioException({
                message: "Unable to load playlist content. Please, specify valid ownerId or playlistId",
                kind: audio_exception_1.AudioRejectKind.Failed
            });
        }
        return VKAudio.normilizePlaylistObject(playlistData);
    }
    async fetchOwnerPlaylists(ownerId, offset = 0) {
        let { data } = await this.context.fetch.post("/al_audio.php?act=owner_playlists", querystring_1.stringify({
            al: 1,
            group_id: 0,
            owner_id: ownerId,
            is_attach: 0,
            offset
        }), this.fetchConfig);
        return this.processResponse(data);
    }
    async fetchPlaylistsByAudio(audio) {
        let { data } = await this.context.fetch.post("/al_audio.php", querystring_1.stringify({
            al: 1,
            act: "playlists_by_audio",
            owner_id: 225166577,
            audio_owner_id: audio.ownerId,
            audio_id: audio.id
        }), this.fetchConfig);
        return this.processResponse(data);
    }
    handleFetchAudioError(error, audiosChunk) {
        if (error instanceof exceptions_1.AudioException) {
            let [errorMessage] = error.payload;
            switch (errorMessage) {
                case "bad_hash": {
                    return this.fetchAudios(audiosChunk).then(items => {
                        let fullIds = items.map(audio => audio.fullId);
                        return this.fetchAudioUrls(fullIds);
                    });
                }
                case "no_audios": throw error;
            }
        }
        throw error;
    }
    async fetchAudioUrls(audios) {
        let { data } = await this.context.fetch.post("/al_audio.php", querystring_1.stringify({
            al: 1,
            act: "reload_audio",
            ids: audios.join(",")
        }), this.fetchConfig);
        let { data: [audioList] } = this.processResponse(data);
        return audioList.map(VKAudio.normalizeAudioObject);
    }
    async fetchAudios(audios) {
        let { data } = await this.context.fetch.post("/al_audio.php", querystring_1.stringify({
            al: 1,
            act: "reload_audios",
            audio_ids: audios.join(",")
        }), this.fetchConfig);
        let { data: [audioList] } = this.processResponse(data);
        return audioList.map(VKAudio.normalizeAudioObject);
    }
    processResponse(response) {
        if (!response.payload)
            throw new exceptions_1.AudioException({
                message: "Cannot get a payload data",
                kind: audio_exception_1.AudioRejectKind.Failed
            });
        let [code, data] = response.payload;
        code = Number(code);
        data = VKAudio.normalizeResponse(data);
        let kind = exceptions_1.AudioException.getRejectKindByCode(code);
        if (kind)
            throw new exceptions_1.AudioException({
                message: `Catched error #${code}`,
                payload: data,
                kind
            });
        return { code, data };
    }
    static async loadAudioEnum() {
        if (!VKAudio.AUDIO_ENUM) {
            VKAudio.AUDIO_ENUM = await audio_parser_1.parseAudioEnum();
        }
        return this;
    }
    static normalizeResponse(payload) {
        if (!Array.isArray(payload))
            return payload;
        return payload.map(data => (typeof data == "string" && data.slice(-1) == '"') ? data.slice(1, -1) : data);
    }
    static normalizeAudioObject(audio) {
        if (!VKAudio.AUDIO_ENUM)
            throw new exceptions_1.AudioException({
                message: "Audio enum is't initialized",
                kind: audio_exception_1.AudioRejectKind.Failed
            });
        let { AUDIO_ITEM_INDEX_ID, AUDIO_ITEM_INDEX_OWNER_ID, AUDIO_ITEM_INDEX_URL, AUDIO_ITEM_INDEX_TITLE, AUDIO_ITEM_INDEX_PERFORMER, AUDIO_ITEM_INDEX_DURATION, AUDIO_ITEM_INDEX_ALBUM_ID, AUDIO_ITEM_INDEX_AUTHOR_LINK, AUDIO_ITEM_INDEX_LYRICS, AUDIO_ITEM_INDEX_FLAGS, AUDIO_ITEM_INDEX_CONTEXT, AUDIO_ITEM_INDEX_EXTRA, AUDIO_ITEM_INDEX_HASHES, AUDIO_ITEM_INDEX_COVER_URL, AUDIO_ITEM_INDEX_ADS, AUDIO_ITEM_INDEX_SUBTITLE, AUDIO_ITEM_INDEX_MAIN_ARTISTS, AUDIO_ITEM_INDEX_FEAT_ARTISTS, AUDIO_ITEM_INDEX_ALBUM, AUDIO_ITEM_INDEX_TRACK_CODE, AUDIO_ITEM_INDEX_RESTRICTION, AUDIO_ITEM_INDEX_ALBUM_PART, AUDIO_ITEM_ACCESS_KEY, AUDIO_ITEM_CHART_INFO_INDEX, } = VKAudio.AUDIO_ENUM;
        let [addHash, editHash, actionHash, deleteHash, replaceHash, urlHash, restoreHash] = audio[AUDIO_ITEM_INDEX_HASHES].split("/");
        let hashes = { addHash, editHash, actionHash, deleteHash, replaceHash, urlHash, restoreHash };
        let coverUrls = audio[AUDIO_ITEM_INDEX_COVER_URL].split(",");
        return {
            id: audio[AUDIO_ITEM_INDEX_ID],
            ownerId: audio[AUDIO_ITEM_INDEX_OWNER_ID],
            fullId: `${audio[AUDIO_ITEM_INDEX_OWNER_ID]}_${audio[AUDIO_ITEM_INDEX_ID]}`,
            url: audio[AUDIO_ITEM_INDEX_URL],
            title: audio[AUDIO_ITEM_INDEX_TITLE],
            perfomer: audio[AUDIO_ITEM_INDEX_PERFORMER],
            duration: audio[AUDIO_ITEM_INDEX_DURATION],
            albumId: audio[AUDIO_ITEM_INDEX_ALBUM_ID],
            authorLink: audio[AUDIO_ITEM_INDEX_AUTHOR_LINK],
            lyrics: audio[AUDIO_ITEM_INDEX_LYRICS],
            flags: audio[AUDIO_ITEM_INDEX_FLAGS],
            context: audio[AUDIO_ITEM_INDEX_CONTEXT],
            extra: audio[AUDIO_ITEM_INDEX_EXTRA], hashes, coverUrls,
            ads: audio[AUDIO_ITEM_INDEX_ADS],
            subtitle: audio[AUDIO_ITEM_INDEX_SUBTITLE],
            mainArtists: audio[AUDIO_ITEM_INDEX_MAIN_ARTISTS],
            feetArtists: audio[AUDIO_ITEM_INDEX_FEAT_ARTISTS],
            album: audio[AUDIO_ITEM_INDEX_ALBUM],
            trackCode: audio[AUDIO_ITEM_INDEX_TRACK_CODE],
            restriction: audio[AUDIO_ITEM_INDEX_RESTRICTION],
            albumPart: audio[AUDIO_ITEM_INDEX_ALBUM_PART],
            accessKey: audio[AUDIO_ITEM_ACCESS_KEY],
            chartInfo: audio[AUDIO_ITEM_CHART_INFO_INDEX],
            canEdit: Boolean(editHash),
            canDelete: Boolean(deleteHash)
        };
    }
    static normilizePlaylistObject(playlistContent) {
        if (!VKAudio.AUDIO_ENUM)
            throw new exceptions_1.AudioException({
                message: "Audio enum is't initialized",
                kind: audio_exception_1.AudioRejectKind.Failed
            });
        if (!playlistContent)
            throw new exceptions_1.AudioException({
                message: "Unexpected error",
                kind: audio_exception_1.AudioRejectKind.Failed
            });
        return {
            id: playlistContent.id,
            title: playlistContent.title,
            ownerId: playlistContent.ownerId,
            authorName: exports.parseAuthorName(playlistContent.authorName || "Unknown"),
            accessHash: playlistContent.accessHash,
            authorHref: playlistContent.authorHref,
            audioList: playlistContent.list.map(array => this.normalizeAudioObject(array)),
            description: playlistContent.description,
            editHash: playlistContent.editHash,
            followHash: playlistContent.followHash,
            isBlocked: playlistContent.isBlocked,
            isFollowed: playlistContent.isFollowed,
            isGeneratedPlaylist: playlistContent.is_generated_playlist,
            isOfficial: playlistContent.isOfficial,
            lastUpdated: playlistContent.lastUpdated,
            listens: Number(playlistContent.listens),
            permissions: playlistContent.permissions,
            totalCount: playlistContent.totalCount
        };
    }
    static getDeviceId() {
        const random256Array = new Array();
        let array = new Array();
        let uint16Array = new Uint16Array(array);
        for (let o = 0; o < 256; ++o)
            random256Array[o] = (o + 256).toString(16).substr(1);
        for (let i = 0; i < 16; i++) {
            let random = Math.random() * 0xFFFF ^ 0;
            array.push(random);
        }
        uint16Array = new Uint16Array(array);
        let offset = 0;
        return [
            array[uint16Array[offset++]], array[uint16Array[offset++]], array[uint16Array[offset++]], array[uint16Array[offset++]], "-",
            array[uint16Array[offset++]], array[uint16Array[offset++]], "-",
            array[uint16Array[offset++]], array[uint16Array[offset++]], "-",
            array[uint16Array[offset++]], array[uint16Array[offset++]], "-",
            array[uint16Array[offset++]], array[uint16Array[offset++]],
            array[uint16Array[offset++]], array[uint16Array[offset++]], array[uint16Array[offset++]], array[uint16Array[offset++]]
        ].join("");
    }
}
exports.default = VKAudio;
const parseAuthorName = (text) => {
    let $ = cheerio_1.default.load(text);
    return $.root().text();
};
exports.parseAuthorName = parseAuthorName;
var AudioContext;
(function (AudioContext) {
    AudioContext["MY"] = "my";
    AudioContext["ATTACH"] = "attach";
    AudioContext["MODULE"] = "module";
    AudioContext["PODCAST"] = "podcast";
    AudioContext["USER_LIST"] = "user_list";
    AudioContext["GROUP_LIST"] = "group_list";
    AudioContext["ALBUM_PAGE"] = "album_page";
    AudioContext["RECOMS_RECOMS"] = "recoms_recoms";
    AudioContext["EDIT_PLAYLIST"] = "edit_playlist";
    AudioContext["ATTACH_PREVIEW"] = "attach_preview";
    AudioContext["RECOMS_RECENT_AUDIOS"] = "recoms_recent_audios";
})(AudioContext || (AudioContext = {}));
var AudioStopReason;
(function (AudioStopReason) {
    AudioStopReason["NEW"] = "new";
    AudioStopReason["PREVIOS"] = "prev";
    AudioStopReason["STOP_BUTTON"] = "stop_btn";
    AudioStopReason["NEXT_BUTTON"] = "next_btn";
    AudioStopReason["PLAYLIST_NEXT"] = "playlist_next";
    AudioStopReason["PLAYLIST_CHANGE"] = "playlist_change";
})(AudioStopReason || (AudioStopReason = {}));
