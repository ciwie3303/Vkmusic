"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioListenerMetrics = void 0;
class AudioListenerMetrics {
    constructor() {
        this.startTime = AudioListenerMetrics.getStartDay();
        this.actualCount = 0;
        this.initialCount = 0;
        this.tasks = 0;
    }
    setStartTime(startTime) {
        this.startTime = startTime;
        return this;
    }
    addListens(value) {
        this.actualCount += value;
        return this;
    }
    getMetrics() {
        return {
            listens: this.actualCount
        };
    }
    static getStartDay() {
        return new Date().setHours(0, 0, 0, 0);
    }
}
exports.AudioListenerMetrics = AudioListenerMetrics;
