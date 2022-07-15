"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerPage = exports.PlayStatus = exports.PlayMode = exports.PlayerElementAttribute = void 0;
var PlayerElementAttribute = /** @class */ (function () {
    function PlayerElementAttribute(e) {
        this.element = e;
        // 播放进度
        this.pLength = 0;
        this.pIndex = 0;
        this.pProgress = 0;
        this.lIndex = 0;
        this.count = 0;
        this.mode = PlayMode.Normal;
        this.status = PlayStatus.Stop;
        this.now = "";
        this.last = "";
    }
    Object.defineProperty(PlayerElementAttribute.prototype, "src", {
        get: function () {
            // console.log(">> 获取播放地址")
            return this.element.src;
        },
        // 播放网络地址
        set: function (v) {
            // console.log('>> 设置播放地址:', v);
            this.element.setAttribute('src', v);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PlayerElementAttribute.prototype, "cover", {
        get: function () {
            return document.getElementById('diskCover').getAttribute('src');
        },
        // 当前歌曲封面URL
        set: function (v) {
            // console.log(`>> [${this.currentPage}]设置封面:`, v);
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
            // console.log(">> 获取播放时间");
            return this.element.currentTime;
        },
        set: function (v) {
            // console.log(">> 设置播放时间:", v);
            this.element.currentTime = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PlayerElementAttribute.prototype, "pProgress", {
        // 获取播放进度
        get: function () {
            return this.pTime / this.pLength;
        },
        set: function (v) {
            this.element.currentTime = v * this.pLength;
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
    PlayMode[PlayMode["DAILYREC"] = 2] = "DAILYREC";
    PlayMode[PlayMode["HEART"] = 3] = "HEART";
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
