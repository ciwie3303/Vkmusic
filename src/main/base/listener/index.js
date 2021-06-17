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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioListener = void 0;
const workerpool_1 = __importStar(require("workerpool"));
const utils_1 = require("../../utils");
const listener_1 = require("./");
const metrics_1 = require("./metrics");
const events_1 = require("events");
const path_1 = require("path");
const types_1 = require("./types");
const vk_api_1 = require("../../../library/vk_api");
const WORKER_FILE_PATH = "../../workers/listener.js";
class AudioListener extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
        this.tasksHistory = [];
        this.vk = new vk_api_1.VK();
        this.tasks = [];
        this.tasksInProgress = {};
        this.running = false;
        this.metrics = new metrics_1.AudioListenerMetrics();
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    isRunning() {
        return this.running;
    }
    setSessions(sessions) {
        this.options.sessions = sessions;
        return this;
    }
    getMetrics() {
        return this.metrics.getMetrics();
    }
    getHistory() {
        return this.tasksHistory;
    }
    start() {
        return new Promise(resolve => {
            const { workerThreads: maxWorkers } = this.options;
            this.running = true;
            this.pool = workerpool_1.default.pool(path_1.join(__dirname, WORKER_FILE_PATH), { maxWorkers });
            this.updatePool();
            this.emit("start");
            resolve(true);
        });
    }
    async stop() {
        if (!this.running)
            return false;
        this.stopTasks();
        this.running = false;
        this.emit("stop");
    }
    clear() {
        this.tasks = [];
        this.tasksInProgress = {};
        this.tasksHistory = [];
        return true;
    }
    getTasks() {
        return this.tasks;
    }
    editTask(id, changeOptions = {}) {
        const taskIndex = this.findTaskIndex(id);
        if (!~taskIndex)
            throw new listener_1.AudioListenerError("Task is not found!");
        const task = this.tasks[taskIndex];
        for (let prop in changeOptions) {
            task[prop] = changeOptions[prop];
        }
        if (!this.running)
            return true;
        return this.reloadTask(task);
    }
    async registerTask(...tasks) {
        for (let task of tasks) {
            let taskIndex = this.findTaskIndex(task);
            if (taskIndex != -1)
                continue;
            this.tasks.push(task);
            this.emit("task-register", task);
        }
        await this.pourTasks();
        this.sortTasks();
        this.updatePool();
        return this;
    }
    async releaseTask(task) {
        const existsIndex = this.findTaskIndex(task);
        if (existsIndex == -1)
            return;
        const taskId = this.getTaskId(task);
        const [removedTask] = this.tasks.splice(existsIndex, 1);
        for (let worker of this.tasksInProgress[taskId]) {
            await worker.cancel().catch(error => {
                utils_1.Logger.error("Worker error:", error);
            });
        }
        delete this.tasksInProgress[taskId];
        this.tasksHistory.push(removedTask);
        this.sortTasks();
        utils_1.Logger.log(`Task ${removedTask.playlistContent?.title || removedTask.id} released!`);
        this.emit("task-release", removedTask);
        return removedTask;
    }
    async pourTasks() {
        await Promise.all([
            this.tasks.map(async (task) => {
                try {
                    if (task.playlistContent)
                        return task;
                    const playlist = await this.vk.audio.fetchPlaylist(task.playlistMeta);
                    task.playlistContent = playlist;
                }
                catch (error) {
                    utils_1.Logger.warn("Fetching playlist info:", error);
                }
                return task;
            })
        ]);
    }
    sortTasks() {
        this.tasks.sort((a, b) => {
            if (a.priority < b.priority || !a.enabled)
                return 1;
            else if (a.priority > b.priority || a.enabled)
                return -1;
            else
                return 0;
        });
        this.emit("sort");
    }
    stopTasks() {
        for (let taskId in this.tasksInProgress) {
            this.tasksInProgress[taskId].forEach(worker => worker.cancel());
        }
        this.tasksInProgress = {};
    }
    updatePool() {
        if (!this.running)
            return this;
        switch (this.options.method) {
            case "parallel": {
                this.updateParallelPool();
                break;
            }
            case "queue": {
                this.updateQueuePool();
                break;
            }
            default: throw new listener_1.AudioListenerError("The method of audio listener is't specified");
        }
        return this;
    }
    updateParallelPool() {
        const availableTasks = this.getAvailableTasks();
        for (let task of availableTasks) {
            const sessions = this.getMaxSessionsForTask(task);
            if (!sessions || sessions.length == 0)
                break;
            this.executeTask(task, { sessions });
        }
        return this;
    }
    updateQueuePool() {
        const [availableTask] = this.getAvailableTasks();
        if (!availableTask)
            return;
        const maxSessions = this.getMaxSessionsForTask(availableTask);
        const sessionChunks = utils_1.splitIntoChunks(maxSessions, this.options.workerThreads);
        for (let sessions of sessionChunks) {
            this.executeTask(availableTask, { sessions });
        }
        return this;
    }
    executeTask(task, { sessions }) {
        const params = [{ task, sessions }];
        const options = { on: this.onWorkerEvent.bind(this) };
        const workerPromise = this.pool
            .exec("listenTask", params, options)
            .then(() => this.releaseTask(task))
            .catch(error => this.onWorkerError(error, task));
        this.enqueue(task, workerPromise);
        this.emit("task-execute", task, workerPromise);
    }
    onWorkerError(error, task) {
        if (error instanceof workerpool_1.Promise.CancellationError || error instanceof workerpool_1.Promise.TimeoutError) {
            return utils_1.Logger.log(`Task №${task?.id} terminated`);
        }
        utils_1.Logger.error(`Task №${task?.id} error:`, error);
        utils_1.Logger.log(`Task №${task?.id} reloading...`);
        this.reloadTask(task);
    }
    onWorkerEvent(data) {
        switch (data.type) {
            case types_1.WORKER_EVENTS.listened: {
                utils_1.Logger.log("Recieved event type 'Listened audio'");
                const { payload } = data;
                let index = this.findTaskIndex(payload.id);
                if (index == -1)
                    return;
                let task = this.tasks[index];
                let deltaListens = Math.abs(payload.listens - task.actualCount);
                this.metrics.addListens(deltaListens);
                task.actualCount = payload.listens;
                task.speed = Number(payload.speed);
                task.nextIterationTime = payload.nextIterationTime;
                this.emit("task-progress", { task, payload });
                break;
            }
            case types_1.WORKER_EVENTS.invalid_session: {
                utils_1.Logger.log("Recieved event type 'Invalid session'");
                break;
            }
            case types_1.WORKER_EVENTS.invalid_proxy: {
                utils_1.Logger.log("Recieved event type 'Invalid proxy'");
                break;
            }
            default: utils_1.Logger.log("Unrecognized type:", data.type);
        }
        return this;
    }
    enqueue(task, pool) {
        if (this.isAvailableTask(task)) {
            this.tasksInProgress[task.id] = [];
        }
        this.tasksInProgress[task.id].push(pool);
        return this;
    }
    reloadTask(task) {
        if (!this.isAvailableTask(task)) {
            this.tasksInProgress[task.id].forEach(worker => worker.cancel());
            this.tasksInProgress[task.id] = [];
        }
        this.executeTask(task, { sessions: this.options.sessions });
    }
    getAvailableTasks() {
        return this.tasks.filter(this.isAvailableTask.bind(this));
    }
    isAvailableTask(task) {
        let id = this.getTaskId(task);
        let taskInPool = this.tasksInProgress[id];
        return !taskInPool || (Array.isArray(taskInPool) && taskInPool.length < 1);
    }
    findTaskIndex(task) {
        let id = this.getTaskId(task);
        return this.tasks.findIndex(eTask => eTask.id == id);
    }
    getTaskId(task) {
        return task.id || task.toString();
    }
    getMaxSessionsForTask(task) {
        const { sessions } = this.options;
        return sessions.slice(0, task.maxSessionsCount || sessions.length);
    }
}
exports.AudioListener = AudioListener;
__exportStar(require("./task"), exports);
__exportStar(require("./error"), exports);
__exportStar(require("./types"), exports);
