"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
class Task {
    constructor(options) {
        this.id = Task.generateId();
        this.speed = 0;
        this.enabled = options.enabled || false;
        this.playlistMeta = options.playlistMeta;
        this.initialCount = options.initialCount || 0;
        this.actualCount = options.actualCount;
        this.requiredCount = options.requiredCount;
        this.priority = options.priority;
        this.maxSessionsCount = options.maxSessionsCount || 0;
    }
    static create(task) {
        return new Task(task);
    }
    static generateId() {
        return new Array(8)
            .fill(0)
            .map(e => (Math.random() * 0xFF ^ 0)).slice(0, 8).join("");
    }
}
exports.Task = Task;
