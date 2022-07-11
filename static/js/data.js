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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetDetial = void 0;
const nel_1 = require("./nel");
// 歌单详情
class SheetDetial {
    constructor(sheetId) {
        this.sheetId = sheetId;
    }
    // 更新歌单数据
    Update() {
        return __awaiter(this, void 0, void 0, function* () {
            // 获取数据
            //var url = `${netease.server}/playlist/track/all?id=${this.sheetId}&limit=10&offset=1&cookie=${netease.cookie}`
            var url = `${nel_1.netease.server}/playlist/detail?id=${this.sheetId}&cookie=${nel_1.netease.cookie}`;
            return fetch(url).then(res => res.json()).then((data) => {
                let playlist = data.playlist;
                this.name = playlist.name;
                this.creator = playlist.creator.nickname;
                this.playCount = playlist.playCount;
                this.songCount = playlist.trackCount;
                this.description = (playlist.description == null) ? "单主很懒，没有写简介。" : playlist.description;
                this.coverUrl = playlist.coverImgUrl;
                this.trackIds = playlist.trackIds;
                return this;
            });
        });
    }
    // 获取歌曲播放地址
    GetSongUrl(trackId) {
        return __awaiter(this, void 0, void 0, function* () {
            var songUrl = yield fetch(`${nel_1.netease.server}/song/url?id=${trackId}&cookie=${nel_1.netease.cookie}`).then(res => res.json()).then(data => {
                let d = data.data;
                // 定义歌曲Url变量并赋值
                return d[0].url;
            });
            return songUrl;
        });
    }
    // 获取歌曲歌词
    GetLyric(musicId) {
        return __awaiter(this, void 0, void 0, function* () {
            return fetch(`${nel_1.netease.server}/lyric?id=${musicId}`).then(res => res.json()).then(data => {
                let lyric_cuts = []; // 歌词换行切片
                let pattn = /\[[0-9]+[\u003a][0-9]+[\u002e][0-9]+\]/g;
                if (data.lrc != undefined) {
                    let lyric = data.lrc.lyric;
                    ////console.log(lyric)
                    let lines = lyric.split("\n");
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];
                        let lineSplt = line.split(']');
                        if (line.length < 2) {
                            continue;
                        }
                        let timeBase = lineSplt[0].slice(1).split('.')[0];
                        // 毫秒级定位
                        // let timeExtra = lineSplt[0].slice(1).split('.')[1]
                        let timeMinute = timeBase.split(":")[0];
                        let timeSecond = timeBase.split(":")[1];
                        let time = Number(timeMinute) * 60 + Number(timeSecond);
                        let content = lineSplt[1];
                        // 添加歌词行
                        lyric_cuts[i] = { "time": time, "content": content };
                    }
                }
                return lyric_cuts;
            });
        });
    }
}
exports.SheetDetial = SheetDetial;
//# sourceMappingURL=data.js.map