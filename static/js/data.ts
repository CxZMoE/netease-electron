
import { netease } from './nel';

// 歌单详情
export class SheetDetial {
    // // 设置player的播放列表长度参数
    sheetId: string;        // 歌单的ID
    name: string;           // 歌单名称
    creator: string;        // 歌单创建者
    playCount: Number;      // 歌单播放量
    songCount: Number;      // 歌曲的数量
    description: string;    // 歌单的简介
    coverUrl: string        // 歌单封面的Url

    trackIds: any[];     // 歌单的歌曲Id列表


    constructor(sheetId: string) {
        this.sheetId = sheetId;
    }

    // 更新歌单数据
    async Update() {
        // 获取数据
        //var url = `${netease.server}/playlist/track/all?id=${this.sheetId}&limit=10&offset=1&cookie=${netease.cookie}`
        var url = `${netease.server}/playlist/detail?id=${this.sheetId}&cookie=${netease.cookie}`
        return fetch(url).then(res => res.json()).then((data: any) => {
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
    }



    // 获取歌曲播放地址
    async GetSongUrl(trackId: number) {
        var songUrl = await fetch(`${netease.server}/song/url?id=${trackId}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
            let d = data.data
            // 定义歌曲Url变量并赋值
            return <string>d[0].url
        })

        return songUrl;
    }

    // 获取歌曲歌词
    async GetLyric(musicId: string) {
        return fetch(`${netease.server}/lyric?id=${musicId}`).then(res => res.json()).then(data => {
            let lyric_cuts = <any[]>[];    // 歌词换行切片
            let pattn = /\[[0-9]+[\u003a][0-9]+[\u002e][0-9]+\]/g
            if (data.lrc != undefined) {
                let lyric = data.lrc.lyric
                ////console.log(lyric)
                let lines = lyric.split("\n")
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i]
                    let lineSplt = line.split(']')
                    if (line.length < 2) {
                        continue
                    }
                    let timeBase = lineSplt[0].slice(1).split('.')[0]
                    // 毫秒级定位
                    // let timeExtra = lineSplt[0].slice(1).split('.')[1]
                    let timeMinute = timeBase.split(":")[0]
                    let timeSecond = timeBase.split(":")[1]
                    let time = Number(timeMinute) * 60 + Number(timeSecond)
                    let content = lineSplt[1]

                    // 添加歌词行
                    lyric_cuts[i] = { "time": time, "content": content }

                }
            }
            return lyric_cuts;
        })
    }
}