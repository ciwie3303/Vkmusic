"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ILAStateManager = exports.ILAState = void 0;
const utils_1 = require("./utils");
var ILAState;
(function (ILAState) {
    ILAState[ILAState["NONE"] = 0] = "NONE";
    ILAState[ILAState["AUTHORIZATION"] = 1] = "AUTHORIZATION";
    ILAState[ILAState["SESSION_UPDATING"] = 2] = "SESSION_UPDATING";
    ILAState[ILAState["LISTENING"] = 3] = "LISTENING";
})(ILAState = exports.ILAState || (exports.ILAState = {}));
class ILAStateManager {
    constructor(context) {
        this.context = context;
        this.states = {};
    }
    async restoreState() {
        if (!this.lastState)
            return;
        return this.changeState(this.lastState);
    }
    async changeState(state) {
        try {
            if (this.currentState) {
                try {
                    this.lastState = this.currentState;
                    const handler = this.states[this.currentState];
                    if (handler && handler.leave)
                        await handler.leave(this.context);
                }
                catch (error) {
                    this.currentState = undefined;
                }
            }
            const handler = this.states[state];
            if (!handler)
                return this;
            this.currentState = state;
            await handler.enter(this.context);
        }
        catch (error) {
            utils_1.Logger.error("An error occurred while changing the state");
        }
        return true;
    }
    setStateHandler(state, handler) {
        this.states[state] = handler;
        return this;
    }
}
exports.ILAStateManager = ILAStateManager;
