const log = {
    DEBUG: true,

    LogW(msg) {
        if (this.DEBUG)
            console.log('[W]', msg);
    },

    // 打印错误
    LogE(msg) {
        if (this.DEBUG)
            console.log('[E]', msg);
    },

    // 打印信息
    LogI(msg) {
        if (this.DEBUG)
            console.log('[I]', msg);
    }
}

export default log;