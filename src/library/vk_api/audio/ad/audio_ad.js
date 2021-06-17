"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../../../exceptions");
const audio_exception_1 = require("../../../exceptions/audio_exception");
const querystring_1 = require("querystring");
const adman_1 = require("./adman");
const AUDIO_ADS_PATTERN = /audioAdsConfig:?.+(\{[^}]+})/i;
class AudioAd {
    constructor(context) {
        this.context = context;
        this.playing = false;
        this.currentProgress = 0;
        this.duration = 0;
        this.slotId = 3514;
        this.adEvents = [];
        this.adman = new adman_1.Adman();
    }
    isPlaying() {
        return this.playing;
    }
    getCurrentProgress() {
        return this.currentProgress;
    }
    getDuration() {
        return this.duration;
    }
    setAdsConfig(value) {
        this.adsConfig = value;
        return this;
    }
    async fetchAd(section, audio) {
        if (!this.adsConfig) {
            try {
                this.adsConfig = await this.parseAdsConfig();
            }
            catch (error) {
                throw new exceptions_1.AudioException({
                    message: "Cannot to get ads config.",
                    kind: audio_exception_1.AudioRejectKind.Failed,
                    payload: error
                });
            }
        }
        console.log(this.adsConfig);
        const params = {
            ...audio.ads,
            vk_catid: AudioAd.SECTION_IDS[section] || AudioAd.SECTION_IDS.other,
            sign: this.adsConfig.sign || ""
        };
        await this.adman.init({
            slot: this.slotId,
            params,
            browser: {
                adBlock: 0,
                mobile: false
            }
        });
        const ad = await this.adman.fetchAd();
        console.log(ad);
    }
    sendEvent(event, section) {
        const config = {
            headers: { "x-requested-with": "XMLHttpRequest" }
        };
        const eventSection = `${event}/${section}`;
        return this.context.fetch.post("/al_audio.php?act=ad_event", querystring_1.stringify({
            act: "ad_event",
            events: eventSection,
            v: 15,
            abp: 0
        }), config);
    }
    getBannersForSection() {
    }
    play() { }
    start() { }
    stop() { }
    init() { }
    skip() { }
    setVolume() { }
    async parseAdsConfig() {
        const { fetch } = this.context;
        const { data: response } = await fetch.get("/feed");
        const result = response.match(AUDIO_ADS_PATTERN);
        if (!result)
            throw new exceptions_1.AudioException({
                message: "Cannot to get audioAdsConfig",
                kind: audio_exception_1.AudioRejectKind.Failed,
                payload: response
            });
        return JSON.parse(result[1]);
    }
}
exports.default = AudioAd;
AudioAd.AD_TYPE = "preroll";
AudioAd.ALLOW_DISABLED = 1;
AudioAd.ALLOW_ALLOWED = 2;
AudioAd.ALLOW_REJECT = 3;
AudioAd.REJECT_REASON_UNKNOWN = "unknown";
AudioAd.REJECT_REASON_LIMIT = "track_limit_exceeded";
AudioAd.REJECT_REASON_SECTION = "section_not_allowed";
AudioAd.SECTION_IDS = {
    my: 101,
    my_playlists: 101,
    audio_feed: 109,
    recent: 113,
    user_wall: 104,
    group_wall: 104,
    user_list: 102,
    group_list: 103,
    user_playlists: 102,
    group_playlists: 103,
    feed: 105,
    search: 110,
    global_search: 110,
    replies: 104,
    im: 106,
    group_status: 104,
    user_status: 104,
    recs: 107,
    recs_audio: 107,
    recs_album: 107,
    other: 114
};
