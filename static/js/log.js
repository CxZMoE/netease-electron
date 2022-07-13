"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var log = {
    DEBUG: true,
    LogW: function (msg) {
        if (this.DEBUG)
            console.log('[W]', msg);
    },
    // 打印错误
    LogE: function (msg) {
        if (this.DEBUG)
            console.log('[E]', msg);
    },
    // 打印信息
    LogI: function (msg) {
        if (this.DEBUG)
            console.log('[I]', msg);
    }
};
exports.default = log;
