"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetDetial = void 0;
var nel_1 = require("./nel");
// 歌单详情
var SheetDetial = /** @class */ (function () {
    function SheetDetial(sheetId) {
        this.sheetId = sheetId;
    }
    // 更新歌单数据
    SheetDetial.prototype.Update = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            var _this = this;
            return __generator(this, function (_a) {
                url = "".concat(nel_1.netease.server, "/playlist/detail?id=").concat(this.sheetId, "&cookie=").concat(nel_1.netease.cookie);
                return [2 /*return*/, fetch(url).then(function (res) { return res.json(); }).then(function (data) {
                        var playlist = data.playlist;
                        _this.name = playlist.name;
                        _this.creator = playlist.creator.nickname;
                        _this.playCount = playlist.playCount;
                        _this.songCount = playlist.trackCount;
                        _this.description = (playlist.description == null) ? "单主很懒，没有写简介。" : playlist.description;
                        _this.coverUrl = playlist.coverImgUrl;
                        _this.trackIds = playlist.trackIds;
                        return _this;
                    })];
            });
        });
    };
    // 获取歌曲播放地址
    SheetDetial.prototype.GetSongUrl = function (trackId) {
        return __awaiter(this, void 0, void 0, function () {
            var songUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("".concat(nel_1.netease.server, "/song/url?id=").concat(trackId, "&cookie=").concat(nel_1.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
                            var d = data.data;
                            // 定义歌曲Url变量并赋值
                            return d[0].url;
                        })];
                    case 1:
                        songUrl = _a.sent();
                        return [2 /*return*/, songUrl];
                }
            });
        });
    };
    // 获取歌曲歌词
    SheetDetial.prototype.GetLyric = function (musicId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, fetch("".concat(nel_1.netease.server, "/lyric?id=").concat(musicId)).then(function (res) { return res.json(); }).then(function (data) {
                        var lyric_cuts = []; // 歌词换行切片
                        if (data.lrc != undefined) {
                            var lyric = data.lrc.lyric;
                            var lyricLines = lyric.split("\n");
                            // 对所有歌词的行进行解析，获取其时间(time)和内容(content)
                            for (var i = 0; i < lyricLines.length; i++) {
                                var line = lyricLines[i];
                                var lineSplt = line.split(']');
                                if (line.length < 2) {
                                    continue;
                                }
                                // 计算当前的歌词对应的时间
                                var lyricTimeCurrent = lineSplt[0].slice(1).split('.')[0];
                                var minutes = lyricTimeCurrent.split(":")[0];
                                var seconds = lyricTimeCurrent.split(":")[1];
                                var time = Number(minutes) * 60 + Number(seconds);
                                var content = lineSplt[1];
                                if (content == undefined) {
                                    content = line;
                                }
                                if (content.length == 0) {
                                    // 当前行歌词为空
                                    continue;
                                }
                                // 添加歌词行
                                lyric_cuts[i] = { "time": time, "content": content };
                            }
                        }
                        return lyric_cuts;
                    })];
            });
        });
    };
    return SheetDetial;
}());
exports.SheetDetial = SheetDetial;
