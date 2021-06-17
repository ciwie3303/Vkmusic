"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmptyCache = void 0;
const createEmptyCache = () => {
    return {
        sessions: [],
        tasksHistory: [],
        tasks: []
    };
};
exports.createEmptyCache = createEmptyCache;
