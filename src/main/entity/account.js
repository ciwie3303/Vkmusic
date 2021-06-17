"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountHash = void 0;
const crypto_1 = require("crypto");
const getAccountHash = (account) => {
    return account.hash || crypto_1.createHash("sha1")
        .update(`${account.login}+${account.password}`)
        .digest("hex");
};
exports.getAccountHash = getAccountHash;
