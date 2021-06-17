"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ILABus = exports.ILA = void 0;
var main_1 = require("./main");
Object.defineProperty(exports, "ILA", { enumerable: true, get: function () { return main_1.ILA; } });
var bus_1 = require("./bus");
Object.defineProperty(exports, "ILABus", { enumerable: true, get: function () { return bus_1.ILABus; } });
__exportStar(require("./bus"), exports);
__exportStar(require("./main"), exports);
