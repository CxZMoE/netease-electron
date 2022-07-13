"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerPage = exports.PlayStatus = exports.PlayMode = exports.PlayerElementAttribute = void 0;
var PlayerElementAttribute = /** @class */ (function () {
    function PlayerElementAttribute(e) {
        this.element = e;
        this.status = PlayStatus.Stop;
    }
    Object.defineProperty(PlayerElementAttribute.prototype, "src", {
        get: function () {
            console.log(">> 获取播放地址");
            return this.element.src;
        },
        // 播放网络地址
        set: function (v) {
            console.log('>> 设置播放地址:', v);
            this.element.setAttribute('src', v);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PlayerElementAttribute.prototype, "cover", {
        // 当前歌曲封面URL
        set: function (v) {
            console.log(">> [".concat(this.currentPage, "]\u8BBE\u7F6E\u5C01\u9762:"), v);
            document.getElementById('cover').setAttribute('src', v);
            // 如果当前的页面是Music（音乐）页面，则同时刷新唱片的图片。
            if (this.currentPage == PlayerPage.Music) {
                var diskCover = document.getElementById('diskCover');
                diskCover.setAttribute('src', v);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PlayerElementAttribute.prototype, "pTime", {
        // 当前播放时间
        get: function () {
            console.log(">> 获取播放时间");
            return this.element.currentTime;
        },
        set: function (v) {
            console.log(">> 设置播放时间:", v);
            this.element.currentTime = v;
        },
        enumerable: false,
        configurable: true
    });
    return PlayerElementAttribute;
}());
exports.PlayerElementAttribute = PlayerElementAttribute;
;
var PlayMode;
(function (PlayMode) {
    PlayMode[PlayMode["Normal"] = 0] = "Normal";
    PlayMode[PlayMode["FM"] = 1] = "FM";
})(PlayMode = exports.PlayMode || (exports.PlayMode = {}));
var PlayStatus;
(function (PlayStatus) {
    PlayStatus[PlayStatus["Playing"] = 0] = "Playing";
    PlayStatus[PlayStatus["Pause"] = 1] = "Pause";
    PlayStatus[PlayStatus["Stop"] = 2] = "Stop";
})(PlayStatus = exports.PlayStatus || (exports.PlayStatus = {}));
var PlayerPage;
(function (PlayerPage) {
    PlayerPage[PlayerPage["Home"] = 0] = "Home";
    PlayerPage[PlayerPage["FM"] = 1] = "FM";
    PlayerPage[PlayerPage["Music"] = 2] = "Music";
})(PlayerPage = exports.PlayerPage || (exports.PlayerPage = {}));
