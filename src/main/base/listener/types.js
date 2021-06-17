"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORKER_EVENTS = exports.Priority = void 0;
var Priority;
(function (Priority) {
    Priority[Priority["LOW"] = 0] = "LOW";
    Priority[Priority["MEDIUM"] = 1] = "MEDIUM";
    Priority[Priority["HIGH"] = 2] = "HIGH";
})(Priority = exports.Priority || (exports.Priority = {}));
exports.WORKER_EVENTS = {
    listened: 1 << 0,
    invalid_session: 1 << 1,
    invalid_proxy: 1 << 2,
};
