"use strict";
const workerPool = require("workerpool");
const { VKAudio } = require("../../library/vk_api/audio");
const { Proxy } = require("../../library/net");
const { Logger } = require("../utils");
const { VK } = require("../../library/vk_api");
const { WORKER_EVENTS } = require("../base/listener");
const LISTEN_DELAY = 35000;
const NEXT_ITERATION_DELAY = 60000;
let promiseResolve;
workerPool.worker({ listenTask });
function listenTask(data = {}) {
    return new Promise(async (resolve) => {
        promiseResolve = resolve;
        const { task, sessions } = data;
        if (sessions.length < 1)
            return resolve(false);
        await VKAudio.loadAudioEnum();
        const vkSessions = await initVKSessions(sessions);
        return vkSessions.map(session => listenPlaylist(session, task));
    });
}
function listenPlaylist(session, task) {
    const playlist = {
        data: {},
        currentAudioIndex: 0,
        initialListensCount: undefined
    };
    let timer = 0;
    let speed = 0;
    let startTime = Date.now();
    start();
    async function start() {
        try {
            await initPlaylist();
            await initAudios();
            startTime = Date.now();
            await update();
        }
        catch (error) {
            Logger.error(error);
        }
    }
    async function initPlaylist() {
        await updatePlaylistData();
        if (playlist.initialListensCount == undefined) {
            playlist.initialListensCount = playlist.data.listens;
        }
    }
    async function updatePlaylistData() {
        playlist.data = await session.audio.fetchPlaylist(task.playlistMeta);
        task.actualCount = Number(playlist.data.listens);
    }
    async function initAudios() {
        playlist.data.audioList = await session.audio.reloadAudios(playlist.data.audioList);
        playlist.data.currentAudioIndex = 0;
    }
    async function update() {
        if (isFinish(task)) {
            clearTimeout(timer);
            return promiseResolve(true);
        }
        try {
            await updatePlaylistData();
            await playAudio();
            await listenAudio();
            advance();
        }
        catch (error) {
            handleError(error);
        }
        setTimeout(update, NEXT_ITERATION_DELAY);
    }
    async function fetchAd() {
        let response = await session.audio.ad.fetchAd("album_page", getCurrentAudio());
        console.log(response);
    }
    async function playAudio() {
        let audio = getCurrentAudio();
        await session.audio.startPlayback(audio);
        await session.audio.sendQueueParams(audio);
        Logger.log(`Audio ${audio.title} playback started...`);
    }
    async function listenAudio() {
        return new Promise((resolve, reject) => {
            timer = setTimeout(() => (session.audio.listenAudio(playlist.data.audioList[playlist.currentAudioIndex], task.playlistMeta).then(resolve).catch(reject)), LISTEN_DELAY);
        });
    }
    function advance() {
        let { currentAudioIndex, data } = playlist;
        updateSpeed();
        sendParent(WORKER_EVENTS.listened, {
            id: task.id,
            speed: speed,
            listens: task.actualCount,
            nextIterationTime: Date.now() + LISTEN_DELAY + NEXT_ITERATION_DELAY
        });
        Logger.log(`Playlist "${data.title}": Audio "${getCurrentAudio().title}" listened! (${task.actualCount}/${task.initialCount + task.requiredCount})`);
        playlist.currentAudioIndex = (currentAudioIndex + 1) % data.audioList.length;
        return true;
    }
    function getCurrentAudio() {
        return playlist.data.audioList[playlist.currentAudioIndex];
    }
    function updateSpeed() {
        const deltaTimeInMinutes = ((Date.now() - startTime) / 1000) / 60;
        const deltaListens = Math.abs(playlist.data.listens - (playlist.initialListensCount || 0));
        speed = Math.ceil(deltaListens / deltaTimeInMinutes);
        Logger.log("Current speed:", speed);
        return speed;
    }
    function handleError(error) {
        if (playlist) {
            Logger.error(`Listening playlist "${playlist.title}" error:`, error);
        }
        else {
            Logger.error("Listening error:", error);
        }
    }
}
function isFinish(task) {
    return ((task.initialCount + task.requiredCount) <= task.actualCount);
}
async function initVKSessions(sessions = []) {
    const vkSessions = [];
    let validCount = 0;
    for (let session of sessions) {
        const params = {
            session: session.cookies,
            userAgent: session.lastUsedUserAgent,
            proxy: session.lastUsedProxy && Proxy.from(session.lastUsedProxy)
        };
        try {
            const vk = new VK(params);
            vkSessions.push(vk);
            Logger.log(`Session validate progress: (${validCount}/${sessions.length})`);
        }
        catch (error) {
            Logger.error(error);
        }
    }
    return vkSessions;
}
function sendParent(type, payload) {
    return workerPool.workerEmit({ type, payload });
}
