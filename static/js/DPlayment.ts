import { netease } from './nel';

export class PlayerElementAttribute {
    now: string     // 当前播放歌曲ID
    last: string    // 上一首播放ID

    status: PlayStatus  // 播放状态
    mode: PlayMode    // 播放模式   

    pIndex: number  // 播放列表序号
    lIndex: number  // 上一首播放歌曲的序号
    count: number   // 播放列表长度

    currentPage: PlayerPage // 当前页面名称 'home'

    sheet: string   // 当前歌单ID
    sheetName: string // 当前歌单名称
    sheetCreator: string // 当前歌单创建者
    sheetPlayCount: number // 当前歌单播放次数
    sheetTrackCount: number // 当前歌单歌曲数量
    sheetDescription: string // 当前歌单描述
    sheetCover: string // 当前歌单封面Url

    name: string // 当前播放歌曲名称
    author: string // 当前播放歌曲作者

    element: HTMLAudioElement // 绑定元素
    pLength: number // 播放长度
    constructor(e) {
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

    // 播放网络地址
    public set src(v: string) {
        // console.log('>> 设置播放地址:', v);
        this.element.setAttribute('src', v);
    }
    public get src(): string {
        // console.log(">> 获取播放地址")
        return this.element.src;
    }

    
    public get cover() : string {
        return document.getElementById('diskCover').getAttribute('src');
    }
    
    // 当前歌曲封面URL
    public set cover(v: string) {
        // console.log(`>> [${this.currentPage}]设置封面:`, v);
        document.getElementById('cover').setAttribute('src', v);
        // 如果当前的页面是Music（音乐）页面，则同时刷新唱片的图片。
        if (this.currentPage == PlayerPage.Music) {
            let diskCover = document.getElementById('diskCover');
            diskCover.setAttribute('src', v);
        }
    }

    // 当前播放时间
    public get pTime(): number {
        // console.log(">> 获取播放时间");
        return this.element.currentTime;
    }

    public set pTime(v: number) {
        // console.log(">> 设置播放时间:", v);
        this.element.currentTime = v;
    }
    
    // 获取播放进度
    
    public get pProgress() : number {
        return this.pTime / this.pLength;
    }
    
    public set pProgress(v : number) {
        this.element.currentTime = v * this.pLength;
    }
    
    







};

export enum PlayMode {
    Normal = 0,
    FM = 1
}

export enum PlayStatus {
    Playing = 0,
    Pause,
    Stop
}

export enum PlayerPage {
    Home = 0,
    FM,
    Music
}