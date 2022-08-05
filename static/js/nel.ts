import * as remote from '@electron/remote';
const fs = remote.require('fs');
const { readFile } = remote.require('fs');
const path = remote.require('path');
const http = remote.require('http')

import log from './log'; // 调试用
import Netease from './netease';
import Dialog from './dialog';
import { SheetDetial } from './data';
import { PlayerElementAttribute, PlayerPage, PlayMode, PlayStatus } from './DPlayment';

export var netease: Netease;
var player: HTMLAudioElement;
var _this: Player;
var PData: PlayerElementAttribute;


// 全局常量
export const USR_CONFIG_DIR = remote.app.getPath('home') + '/.moe.cxz.netease-electron';
var dialog = new Dialog();


// 用户目录
function CheckConfigDir() {
    let exists: boolean = fs.existsSync(USR_CONFIG_DIR);
    if (!exists) {
        log.LogE('用户配置文件未找到');
        fs.mkdir(USR_CONFIG_DIR, { mode: '0755', recursive: true },
            () => {
                log.LogI('创建用户配置文件目录');
            }
        );
    }
}

enum SONG_PLAYBACK_MODE {
    MODE_LOOP = 0,   // 循环模式
    MODE_SEQ,        // 顺序模式
    MODE_SIG,        // 单曲循环
    MODE_RAMDOM      // 随机模式
};

export class Player {
    player: HTMLAudioElement;       // 播放器 <audio/>
    playList: HTMLUListElement;     // [元素]右小角可伸缩的小播放列表
    sheetListBox: HTMLUListElement; // [元素]页面右侧的歌单列表
    playlistBox: HTMLDivElement  // 播放列表盒子

    isProgressMoving: boolean;      // 播放进度条正在移动
    playMode: SONG_PLAYBACK_MODE;   // 播放模式

    lyricInterval: any;             // [TIMER]歌词
    mPlayList: any[];               // 主播放列表
    mPlayListName: string;
    firstLoad: boolean;

    netease: Netease;
    currentSheet: SheetDetial;
    currentOffset: number;
    constructor() {
        // 状态变量
        this.playMode = SONG_PLAYBACK_MODE.MODE_LOOP;
        this.isProgressMoving = false;

        this.player = <HTMLAudioElement>document.getElementById('player');
        player = this.player;
        PData = new PlayerElementAttribute(player);
        this.firstLoad = true;

        // 检查用户目录
        CheckConfigDir();

        // 初始化网易服务
        netease = new Netease(this.player);
        this.netease = netease;
        this.currentOffset = 0;

        _this = this;
    }

    InitDom() {
        log.LogI('初始化DOM');
        var player = _this.player;
        // 播放器播放模式设置为默认模式
        PData.mode = PlayMode.Normal;

        this.playList = <HTMLUListElement>document.getElementById('playList');
        this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');   // 歌单列表           // 播放列表

        // [全局定时器] 用于实时监控播放状态
        setInterval(() => {
            if (!this.playList) {
                try {
                    this.playList = <HTMLUListElement>document.getElementById('playList');
                } catch (_) {
                    return;
                }
            }
            // 突出显示当前播放歌曲, 更新背景色
            if (PData.mode != PlayMode.FM) {
                // 如果歌单列表存在，更新项目的背景色
                if (this.sheetListBox) {
                    if (this.sheetListBox.children.length > 0) {
                        let sheetListBoxItemSelected = <HTMLLIElement>this.sheetListBox.children.item(PData.pIndex);
                        for (let i = 0; i < this.sheetListBox.children.length; i++) {
                            let sheetListBoxItem = <HTMLLIElement>this.sheetListBox.children.item(i);
                            // [其它] 背景
                            sheetListBoxItem.style.backgroundColor = '#303030';
                            // [选中项]
                            sheetListBoxItemSelected.style.backgroundColor = '#1e1e1e';
                        }
                        // 如果播放列表存在，更新项目的背景色
                        if (this.playList && this.playList.children.length > 0) {
                            let playListItemSelected = <HTMLLIElement>this.playList.children.item(PData.pIndex);
                            for (let i = 0; i < this.playList.children.length; i++) {
                                let sheetListBoxItem = <HTMLLIElement>this.playList.children.item(i);
                                sheetListBoxItem.style.backgroundColor = '#303030'
                                playListItemSelected.style.backgroundColor = '#1e1e1e'
                            }
                        }
                    }

                }
            }

            // 更新播放按钮状态
            let status = PData.status
            let playBtn = document.getElementById('playerPlay')
            if (status == PlayStatus.Pause) {
                playBtn.setAttribute('src', '../pics/play.png')
                let diskCover = document.getElementById('diskCover')
                if (diskCover) {
                    diskCover.className = "";
                }
            } else if (status == PlayStatus.Stop) { // 如果是停止
                let diskCover = document.getElementById('diskCover')
                if (diskCover) {
                    diskCover.className = "";
                }
                playBtn.setAttribute('src', '../pics/play.png')
            } else {
                let diskCover = document.getElementById('diskCover')
                if (diskCover) {
                    diskCover.className = "rotating";
                }
                playBtn.setAttribute('src', '../pics/pause.png')
            }

        }, 500);

        // 播放列表开关
        {
            let playlistBtn = document.getElementById('playlistBtn');
            _this.playlistBox = <HTMLDivElement>document.getElementById('playlistBox');
            let playList = document.getElementById('playList');

            // 控制播放列表元素的高度
            playlistBtn.addEventListener('click', (e) => {
                if (_this.playlistBox.style.height == '300px')
                    _this.playlistBox.style.height = '0px'
                else {
                    let playIndex = Number(PData.pIndex);
                    _this.playlistBox.style.height = '300px'
                    _this.playlistBox.scrollTop = (<HTMLElement>playList.children.item(playIndex)).offsetTop - 155
                }
            })
        }

        // 播放模式按钮事件
        {
            let playmodeBtn = document.getElementById('playmodeBtn')
            playmodeBtn.addEventListener('click', () => {
                switch (this.playMode) {
                    case SONG_PLAYBACK_MODE.MODE_LOOP:
                        this.playMode = SONG_PLAYBACK_MODE.MODE_SIG;
                        playmodeBtn.setAttribute('src', '../pics/single-loop.png')
                        break
                    case SONG_PLAYBACK_MODE.MODE_SIG:
                        this.playMode = SONG_PLAYBACK_MODE.MODE_RAMDOM;
                        playmodeBtn.setAttribute('src', '../pics/random.png')
                        break
                    case SONG_PLAYBACK_MODE.MODE_RAMDOM:
                        this.playMode = SONG_PLAYBACK_MODE.MODE_LOOP
                        playmodeBtn.setAttribute('src', '../pics/loop.png')
                        break
                    default:
                        break
                }
            })
        }
        // 评论消失事件
        document.addEventListener('click', (e) => {
            let addCommentBox = document.getElementById('addcommentBox')
            let searchBox = document.getElementById('searchBox')
            let target = <HTMLElement>e.target;

            // 点击对象不是评论添加框的时候关闭框
            if (addCommentBox != null && target != addCommentBox && e.target != addCommentBox) {
                addCommentBox.remove()
            }

            // 点击对象不是搜索框的时候隐藏搜索框
            if (searchBox != null && target != searchBox && e.target != searchBox) {
                searchBox.style.height = '0px'
                searchBox.style.visibility = 'hidden'
            }
        })

        // 隐藏窗口事件
        document.getElementById('titlebar').addEventListener('dblclick', (e) => {
            e.stopPropagation()
            remote.BrowserWindow.getFocusedWindow().hide()
            remote.getGlobal('windowHided').is = true
        })

        // 事先加载搜索页面
        readFile(path.join(__dirname, '../pages/search.html'), (err, data) => {
            let body = document.getElementsByTagName('body')[0];

            // 创建搜索框结点
            let searchBox = <HTMLDivElement>document.createElement('DIV');


            searchBox.setAttribute('id', 'searchBox');
            searchBox.className = 'search-box';
            searchBox.innerHTML = data.toString();
            _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
            body.appendChild(searchBox)

            // 搜索事件
            let searchKeywords = document.getElementById('searchKeywords')
            searchKeywords.addEventListener('keydown', (e) => {
                let target = <HTMLInputElement>e.target;
                if (e.keyCode != undefined && e.keyCode == 13) {
                    fetch(`${netease.server}/search?keywords=${target.value}&cookie=${netease.cookie}`).then((res) => {
                        return res.json()
                    }).then((data) => {
                        if (!data) {
                            return
                        }

                        // 搜索结果数组
                        let results = data.result.songs
                        let ids = []
                        let resultBox = document.getElementById('searchResultBox')
                        resultBox.innerHTML = ''
                        let ul = document.createElement('UL')
                        ul.className = 'sheet-list-box'
                        resultBox.appendChild(ul)
                        for (var i=0;i<results.length;i++){
                            ids.push(results[i].id)
                        }
                        console.log('search for:', ids)
                        fetch(`${netease.server}/song/detail?ids=${ids.join(",")}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
                            if (!data) {
                                return
                            }
                            for (var i = 0; i < data.songs.length; i++) {
                                let song = data.songs[i]
                                let li = <HTMLLIElement>document.createElement('LI')
                                li.className = 'sheet-list-item'
                                // 创建图片框
                                let pic = <HTMLImageElement>document.createElement('img')
                                pic.style.float = 'left'
                                pic.style.width = '35px'
                                pic.style.height = '35px'
                                // 创建标题
                                let p = <HTMLParagraphElement>document.createElement('p')

                                li.appendChild(pic)
                                li.appendChild(p)
                                // 添加列表子项
                                ul.appendChild(li)

                                pic.src = song.al.picUrl
                                pic.alt = ""
                                // 作者
                                let authors = song.ar
                                let author = ''
                                for (let i = 0; i < authors.length; i++) {
                                    if (i == authors.length - 1) {
                                        author += authors[i].name
                                        continue
                                    }
                                    author += authors[i].name + '/'
                                }
                                p.innerText = `${author} - ${results[i].name}`
                                li.onclick = function () {
                                    // 获取音乐URL
                                    _this.currentSheet.GetSongUrl(song.id).then(
                                        musicUrl => {
                                            // 设置播放列表
                                            let searchItem = [{'name': song.name, 'id': song.id, 'cover': song.al.picUrl, 'author': author }]

                                            searchItem.push.apply(searchItem, _this.mPlayList)
                                            _this.mPlayList = searchItem
                                            searchItem = null

                                            PData.pIndex = 0;
                                            PData.src = musicUrl;
                                            player.play();
                                            PData.cover = song.al.picUrl;
                                            PData.status = PlayStatus.Playing;
                                            PData.now = song.id;

                                            // 隐藏搜索框
                                            searchBox.style.height = '0px'
                                            searchBox.style.visibility = 'hidden'
                                        }
                                    )
                                }
                            }

                        });
                    })
                }

            })
        })

        // 事先加载主页
        readFile(path.join(__dirname, '../pages/sheetlist.html'), (err, data) => {
            (<HTMLDivElement>document.getElementById('content')).innerHTML = data.toString();
            PData.currentPage = PlayerPage.Home;
            _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
        })

        // 搜索页面展现事件
        document.addEventListener('keydown', (e) => {
            if (!(e.keyCode == 83 && e.ctrlKey)) {
                return
            }
            e.stopPropagation()
            let searchBox = document.getElementById('searchBox')
            let searchKeywords = document.getElementById('searchKeywords')

            if (searchBox.style.visibility == 'visible') {
                searchBox.style.visibility = 'hidden'
                searchBox.style.height = '0px'
                searchKeywords.blur()
            } else {
                searchBox.style.visibility = 'visible'
                searchBox.style.height = '200px'
                searchKeywords.focus()
            }
        })


        // 登录按钮事件
        document.getElementById('login').addEventListener('click', (e) => {
            var netease = _this.netease;
            // 登录
            if (netease.loginStatus == false) {
                dialog.newLoginDialog('loginDialog', function () {
                    let username = <HTMLInputElement>document.getElementById('username');
                    let password = <HTMLInputElement>document.getElementById('password');
                    netease.login(username.value, password.value);
                })
            } else {
                netease.qd()
            }
        })


        // 登陆状态判定
        fs.readFile(`${USR_CONFIG_DIR}/login.json`, { encoding: 'utf8' }, (err, data) => {
            if (err) {
                netease.loginStatus = false
                new Notification('通知', { body: '您还未登录，请先登录。' })
                _this.netease.data = {}
                dialog.newLoginDialog('loginDialog', function () {
                    let username = <HTMLInputElement>document.getElementById('username');
                    let password = <HTMLInputElement>document.getElementById('password');
                    netease.login(username.value, password.value);
                });
                return
            } else {
                netease.data = JSON.parse(data)
                if (netease.data.code == 502) {
                    fs.unlink(`${USR_CONFIG_DIR}/login.json`, (err) => {
                        new Notification('登录失败', {
                            body: '账号或密码错误'

                        })
                        dialog.newLoginDialog('loginDialog', function () {
                            let username = <HTMLInputElement>document.getElementById('username');
                            let password = <HTMLInputElement>document.getElementById('password');
                            netease.login(username.value, password.value);
                        });
                        return
                    })
                    return
                }

                netease.cookie = netease.data.cookie

                document.getElementById('loginLabel').innerText = netease.data.profile.nickname

                fetch(`${netease.server}/login/status?cookie=${netease.cookie}`).then(res => res.json()).then(data => {
                    if (data.msg == '需要登录') {
                        netease.loginStatus = false
                        new Notification('通知', { body: '登录过期，请重新登录' })
                        netease.data = {}
                        dialog.newLoginDialog('loginDialog', function () {
                            let username = <HTMLInputElement>document.getElementById('username');
                            let password = <HTMLInputElement>document.getElementById('password');
                            netease.login(username.value, password.value);
                        });

                    } else {
                        // 登录正常
                        // 先获取我喜欢的音乐
                        document.getElementById('login').setAttribute('src', netease.data.profile.avatarUrl)
                        if (data.code != 502) {
                            // 有效登录
                            netease.loginStatus = true
                            // 初始化
                            this.getFav()

                            this.initProgrss()
                            this.initSidebar()
                            this.initPlayer()
                            // 初始化封面点击
                            this.initCover()
                        }
                    }
                })
            }
        })
    }
    // 初始化播放进度条
    initProgrss() {
        // 为播放条添加拖拽效果
        var progressPin = document.getElementById('progressPin');
        var progress = document.getElementById('progress');
        var progressBar = document.getElementById('progress-bar');
        var player = _this.player;
        var ctlabel = document.getElementById('currentTimeLabel');
        var totalLabel = document.getElementById('lengthLabel');
        var offset = 0;

        // 处理拖动
        var pinWidth = progressPin.offsetWidth;
        progressBar.addEventListener('mousedown', (e) => {
            _this.isProgressMoving = true;
        })
        progressBar.addEventListener('mouseup', (e) => {
            _this.isProgressMoving = false;
            let barWidth = progressBar.clientWidth - pinWidth;
            PData.pProgress = offset / barWidth;
        })

        progressBar.addEventListener('mousemove', (e) => {
            if (_this.isProgressMoving) {
                let barWidth = progressBar.clientWidth - pinWidth;
                offset = e.x - progressBar.offsetLeft - pinWidth / 2;
                // console.log(progress.clientWidth)
                if (offset >= 0 && offset < barWidth) {
                    progressPin.style.marginLeft = offset + 'px';
                }
            }
        })

        // progressBar.addEventListener('mouseout', (e)=>{
        //     _this.isProgressMoving = false;
        // })



        player.addEventListener('timeupdate', function () {
            // PData.pLength 歌曲长度[s]
            // PData.pTime   播放时间[s]

            // 更新播放进度
            totalLabel.innerHTML = `${(PData.pLength / 60).toFixed(0)}:${(PData.pLength % 60).toFixed(0)}`;
            ctlabel.innerText = `${(PData.pTime / 60).toFixed(0)}:${(PData.pTime % 60).toFixed(0)}`;
            if (!_this.isProgressMoving) {
                var barWidth = progressBar.clientWidth - pinWidth;
                offset = barWidth * PData.pProgress;
                progressPin.style.marginLeft = offset + 'px';
            }
        });
    }

    // 初始化侧边栏事件
    initSidebar() {
        // 歌单按钮点击
        var sheetBtn = document.getElementById('sheetBtn')
        sheetBtn.addEventListener('click', function (e) {
            e.stopPropagation()
            readFile(path.join(__dirname, '../pages/sheetlist.html'), (err, data) => {
                (<HTMLElement>document.getElementById('content')).innerHTML = data.toString()
                _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
                PData.currentPage = PlayerPage.Home;
                PData.mode = PlayMode.Normal;

                _this.getSheets()
            })
        })

        // 我喜欢的音乐按钮点击
        var favBtn = document.getElementById('favBtn')
        favBtn.addEventListener('click', function (e) {
            e.stopPropagation()
            readFile(path.join(__dirname, '../pages/sheetlist.html'), (err, data) => {
                (<HTMLElement>document.getElementById('content')).innerHTML = data.toString()
                _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
                PData.currentPage = PlayerPage.Home;
                PData.mode = PlayMode.Normal;
                _this.getFav()
            })
        })

        // 私人FM点击
        var fmBtn = document.getElementById('fmBtn')
        fmBtn.addEventListener('click', function (e) {
            e.stopPropagation()
            PData.mode = PlayMode.FM
            PData.currentPage = PlayerPage.Music;
            _this.loadMusicPage()

        })

        // 心跳点击
        var heartBtn = document.getElementById('heart')
        heartBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            // getFav()
            _this.getHeart()
            PData.currentPage = PlayerPage.Home;
            PData.mode = PlayMode.HEART;
        })

        // 每日推荐被点击
        var dailyRecommendBtn = document.getElementById('dailyRecommendBtn')
        dailyRecommendBtn.addEventListener('click', function (e) {
            e.stopPropagation()
            PData.mode = PlayMode.Normal;
            readFile(path.join(__dirname, '../pages/sheetlist.html'), (err, data) => {
                (<HTMLElement>document.getElementById('content')).innerHTML = data.toString()
                _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
                _this.loadDailyRecommandedSongs()
                PData.currentPage = PlayerPage.Home;
                PData.mode = PlayMode.DAILYREC;
            })

        })
    }

    // 初始化播放器
    initPlayer() {
        // 获取播放器控件
        var player = _this.player

        // 设置初始播放序号
        PData.pIndex = 0;
        // 初始状态为停止
        PData.status = PlayStatus.Stop;


        // 播放完毕时候下一首
        player.addEventListener('ended', (function () {
            // 下一首
            _this.next()
        }));

        // 加载完毕后设置长度参数
        player.addEventListener('canplay', () => {
            PData.pLength = player.duration;

            // 更新封面
            //PData.cover = _this.mPlayList[PData.pIndex].cover

            document.getElementById('musicTitle').innerText = '正在播放：' + _this.mPlayList[PData.pIndex].name //+ ' - ' + mPlayList[PData.pIndex].author


            // 显示歌词
            clearInterval(this.lyricInterval)
            if (PData.currentPage == PlayerPage.Music) {
                _this.showLyric()
                _this.loadComment(1, 25)
            }

        })

        // 错误处理
        player.addEventListener('error', (e) => {
            new Notification('无法播放', {
                body: '无法播放，可能是没有版权或者权限。'
            })
            _this.next()
        })
        // Buttons
        let lastBtn = document.getElementById('playerLast')
        let playBtn = document.getElementById('playerPlay')
        let nextBtn = document.getElementById('playerNext')

        // 绑定按钮的事件
        nextBtn.addEventListener('click', function () {
            _this.next()
        })

        lastBtn.addEventListener('click', function () {
            _this.last()
        })

        playBtn.addEventListener('click', function () {
            _this.play()
        })

        this.bindGlobalShortcut()

    }

    /**
     *  绑定全局按键
     */

    bindGlobalShortcut() {
        // 绑定全局案件
        let globalShortcut = remote.globalShortcut
        let nextKey = 'CommandOrControl+Alt+Right'
        let lastKey = 'CommandOrControl+Alt+Left'
        let playPauseKey = `CommandOrControl+Alt+P`
        let volUpKey = `CommandOrControl+Alt+Up`
        let volDownKey = `CommandOrControl+Alt+Down`

        var _this = this;
        var _player = _this.player;
        let nextShortcut = globalShortcut.register(nextKey, () => {
            _this.next()
            if (!nextShortcut) {
                ////console\.log\('注册按键失败')
            }
        })
        let lastShortcut = globalShortcut.register(lastKey, (() => {
            _this.last()
            if (!lastShortcut) {
                ////console\.log\('注册按键失败')
            }
        }))

        let playPauseShortcut = globalShortcut.register(playPauseKey, () => {
            _this.play()
            if (!playPauseShortcut) {
                ////console\.log\('注册按键失败')
            }
        })

        let volUpKeyShortcut = globalShortcut.register(volUpKey, () => {
            if (_player.volume <= 0.8) {
                _player.volume += 0.2
            }
            ////console\.log\('音量：' + player.volume)
            if (!volUpKeyShortcut) {
                ////console\.log\('注册按键失败')
            }
        })

        let volDownKeyShortcut = globalShortcut.register(volDownKey, () => {
            if (_player.volume >= 0.2) {
                _player.volume -= 0.2
            }
            ////console\.log\('音量：' + player.volume)
            if (!volDownKeyShortcut) {
                ////console\.log\('注册按键失败')
            }
        })
    }

    /**
     *  播放控制
     */

    // 播放
    play() {
        console.log("播放按钮")
        var player = _this.player;
        // 获取播放器控件
        // 获取播放状态
        let status = PData.status;

        // 获取播放按钮
        let playBtn = document.getElementById('playerPlay')

        // console.log(status)
        // 如果是暂停
        if (status == PlayStatus.Pause) {
            console.log('播放');
            player.play()
            PData.status = PlayStatus.Playing;
            // 暂停图标
            playBtn.setAttribute('src', '../pics/pause.png')

        } else if (status == PlayStatus.Stop) { // 如果是停止
            console.log('播放');
            player.currentTime = 0
            player.play()
            PData.status = PlayStatus.Playing;
        } else {
            console.log('暂停');
            player.pause()
            PData.status = PlayStatus.Pause;
            // 播放图标
            playBtn.setAttribute('src', '../pics/play.png')

        }
    }

    // 上一首
    last() {
        var player = _this.player;
        // 获取播放器控件
        // 设置上次播放的歌曲ID和序号
        PData.last = PData.now;
        PData.lIndex = PData.pIndex;


        // 播放列表数量
        let count = _this.mPlayList.length

        if (PData.pIndex == 0) {
            PData.pIndex = count - 1;
        } else {
            PData.pIndex = PData.pIndex - 1;
        }

        // 获取歌曲播放地址
        _this.currentSheet.GetSongUrl(_this.mPlayList[PData.pIndex].id).then(musicUrl => {
            PData.src = musicUrl;
            player.play()

            PData.status = PlayStatus.Playing
            PData.now = _this.mPlayList[PData.pIndex].id;
        })
    }

    // 下一首
    next() {
        // 获取播放器控件
        var player = _this.player;

        // 设置上次播放的歌曲ID和序号
        PData.last = PData.now;
        PData.lIndex = PData.pIndex;
        if (PData.mode == PlayMode.FM && PData.pIndex == 0) {
            this.loadFM()

            return
        }


        // 播放列表数量
        let count = Number(PData.count)
        let index = Number(PData.pIndex);
        // 设置这次播放的歌曲ID和序号
        // 列表循环
        switch (this.playMode) {
            case SONG_PLAYBACK_MODE.MODE_LOOP:
                {
                    if (index == count - 1) {
                        PData.pIndex = 0;
                    } else {
                        PData.pIndex = index + 1;
                    }
                    break
                }
            case SONG_PLAYBACK_MODE.MODE_SIG:
                {
                    PData.pIndex = PData.pIndex;
                    break
                }
            case SONG_PLAYBACK_MODE.MODE_RAMDOM:
                {
                    PData.pIndex = count * Math.random();
                    break
                }
            default:
                break
        }

        fetch(`${netease.server}/song/url?id=${_this.mPlayList[PData.pIndex].id}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
            PData.cover = _this.mPlayList[PData.pIndex].cover;

            // 播放地址
            let musicUrl = data.data[0].url;
            PData.src = musicUrl;
            player.play();

            // 设置当前播放的音乐ID
            PData.now = _this.mPlayList[PData.pIndex].id;

            // 修改播放器播放状态为播放
            PData.status = PlayStatus.Playing;
        })
    }

    getMusicDetailForLiClick(li: HTMLLIElement) {
        // 获取播放器控件

        var player = _this.player;

        fetch(`${netease.server}/song/url?id=${li.getAttribute('musicID')}&cookie=${netease.cookie}`).then(res => res.json()).then((data) => {
            if (data == undefined) {
                this.getMusicDetailForLiClick(li)
                return
            }
            let musicUrl = data.data[0].url


            PData.src = musicUrl
            player.play()

            PData.status = PlayStatus.Playing;
            PData.now = li.getAttribute('musicID');
        });
    }

    initCover() {
        var cover = document.getElementById('cover')
        var player = _this.player;

        cover.addEventListener('click', (e) => {
            console.log(PData.currentPage);
            console.log(PData.mode);
            e.stopPropagation()
            let page = PData.currentPage
            if (page == PlayerPage.Music) {
                readFile(path.join(__dirname, '../pages/sheetlist.html'), (err, data) => {
                    let MainPage = <HTMLElement>document.getElementById('content');
                    MainPage.innerHTML = data.toString();
                    _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
                    switch (PData.mode) {
                        case PlayMode.DAILYREC: {
                            _this.loadDailyRecommandedSongs();
                            break;
                        }
                        case PlayMode.Normal: {
                            console.log("获取歌单Normal");
                            _this.getSheet(PData.sheet);
                            break;
                        }
                        case PlayMode.FM: {
                            console.log("获取FM歌单");
                            _this.getSheet(PData.sheet);
                            break;
                        }
                        case PlayMode.HEART: {
                            console.log("获取心跳歌单");
                            _this.getHeart();
                            break;
                        }
                    }
                    PData.currentPage = PlayerPage.Home;
                })

            } else {
                this.loadMusicPage();
            }

        })
    }

    // 获取我喜欢的音乐
    getFav() {
        let uid = netease.data.account.id

        fetch(`${netease.server}/user/playlist?uid=${uid}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
            let sheetlist = data.playlist;
            // 清空内容
            _this.sheetListBox.innerHTML = '';

            // 设置当前歌单为我喜欢的音乐
            PData.sheet = sheetlist[0].id;
            PData.favorateSheetId = PData.sheet;
            // 设置当前播放的歌单名称
            PData.sheetName = sheetlist[0].name;

            // 获取歌单歌曲列表
            _this.getSheet(sheetlist[0].id);
        })
    }

    // 获取心跳模式
    getHeart() {
        let mid = _this.mPlayList[PData.pIndex].id
        let url = `${netease.server}/playmode/intelligence/list?id=${mid}&pid=${PData.favorateSheetId}&cookie=${netease.cookie}`

        fetch(url).then(res => res.json()).then(data => {
            let heartSheet = data.data
            // 清空内容
            _this.sheetListBox.innerHTML = ''

            // 设置当前歌单为我喜欢的音乐
            PData.sheet = PData.favorateSheetId;
            // 设置当前播放的歌单名称
            PData.sheetName = heartSheet[0].songInfo.name;
            _this.mPlayList = heartSheet;
            // 获取歌单歌曲列表
            _this.getSheet('heart')
        })
    }


    // 绑定实时当前歌单显示框
    attachPlaylist() {
        //console\.log\('attachPlaylist');

        // 只有在不是私人FM模式下才执行
        if (PData.mode != PlayMode.FM) {
            let playList = <HTMLUListElement>document.getElementById('playList')
            let playlistSheetName = document.getElementById('playlistSheetName')

            playlistSheetName.innerText = PData.sheetName;

            playList.innerHTML = ''
            ////console\.log\('attach:' + sheetListBox)
            for (let i = 0; i < _this.sheetListBox.children.length; i++) {

                let c = <HTMLLIElement>_this.sheetListBox.children.item(i).cloneNode(true)
                let title = <HTMLParagraphElement>c.getElementsByTagName('P')[0]
                title.innerText = title.innerText.split('-')[0]
                c.addEventListener('click', () => {
                    // 初始化主播放列表
                    _this.initMainPlaylist()

                    // 设置上次播放的歌曲ID
                    PData.last = PData.now;
                    // 设置上次播放的序号
                    PData.lIndex = PData.pIndex;
                    // 设置当前播放的index
                    PData.pIndex = i;
                    // 设置歌曲封面
                    PData.cover = _this.mPlayList[i].cover

                    // 获取歌曲播放Url
                    _this.sourceMusicUrl(c)
                    this.playList.scrollTop = (<HTMLLIElement>(this.playList.children.item(PData.pIndex))).offsetTop - 25;
                    if (this.sheetListBox && this.sheetListBox.children.length > 0) {
                        this.sheetListBox.scrollTop = (<HTMLLIElement>(this.playList.children.item(PData.pIndex))).offsetTop - 25;
                    }
                })

                playList.appendChild(c)
            }

        }

    }

    // 创建播放列表
    bindListItemName(offset: number, limit: number) {
        //console\.log\(this.currentSheet)
        fetch(`${netease.server}/playlist/track/all?id=${this.currentSheet.sheetId}&limit=${limit}&offset=${offset * 10}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
            ////console\.log\(`${netease.server}/song/detail?ids=${new_ids}`)
            //////console\.log\(str)
            let songs = <any[]>data.songs
            // 遍历所有的歌单ID以执行一些操作
            //console\.log\(songs)
            let previous_length = _this.sheetListBox.children.length;
            // console.log(`previous: ${previous_length}`);
            for (let i = offset * limit; i < offset * limit + limit && i < _this.currentSheet.songCount; i++) {
                //console\.log\(i);
                ////console\.log\('添加歌单项目元素')
                // 创建一条列表项，每个列表项目对应一首歌
                let li = <HTMLLIElement>document.createElement('LI')

                // 添加样式 背景色#303030
                li.classList.add('sheet-list-item')
                li.classList.add('light-dark')

                // 为列表项设置序号和对应音乐ID以方便点击时候直接调用获取到音乐Url
                li.setAttribute('pIndex', String(i))
                li.setAttribute('musicID', this.currentSheet.trackIds[i].id)

                // 为列表项添加点击事件
                li.addEventListener('click', (ev) => {

                    // 设置上次播放的歌曲ID
                    PData.last = PData.now;
                    PData.lIndex = PData.pIndex;

                    // 设置当前播放的index
                    PData.pIndex = parseInt(li.getAttribute('pIndex'));

                    // 设置当前播放的歌单名称
                    PData.sheetName = this.currentSheet.name;
                    PData.cover = songs[i].al.picUrl;
                    // 为播放器绑定播放地址，并开始播放
                    _this.sourceMusicUrl(li)
                    //initMainPlaylist()
                    // _this.attachPlaylist()
                    // 初始化主播放列表
                    _this.initMainPlaylist()
                    this.playList.parentElement.scrollTop = (<HTMLLIElement>(this.playList.children.item(PData.pIndex))).offsetTop - 25;
                })

                // 还原坐标
                let index = i - previous_length;
                // console.log(`index: ${index}`)
                // 为列表项目绑定歌曲名
                li.setAttribute('name', songs[index].name)
                ////console\.log\('['+count+']get one: '+songs[i].name)

                // 为列表项目绑定封面
                li.setAttribute('cover', songs[index].al.picUrl)

                // 为列表项目绑定专辑ID
                li.setAttribute('albumId', songs[index].al.id)

                // 为列表项目绑定专辑名称
                li.setAttribute('albumName', songs[index].al.name)

                // 为列表项目生成作者字符串
                let authors = songs[index].ar
                let author = ''
                for (let i = 0; i < authors.length; i++) {
                    if (i == authors.length - 1) {
                        author += authors[i].name
                        continue
                    }
                    author += authors[i].name + '/'
                }

                li.setAttribute('author', author)

                // 列表项目左侧的歌曲封面
                let coverLeft = document.createElement('IMG')
                coverLeft.style.float = 'left'
                coverLeft.style.width = '35px'
                coverLeft.style.height = '35px'
                coverLeft.setAttribute('src', songs[index].al.picUrl)


                // 列表项目的歌曲名称
                let p = document.createElement('P')
                p.innerText = `${i + 1} ` + songs[index].name + ' - ' + author
                li.appendChild(coverLeft)
                li.appendChild(p)


                _this.sheetListBox.appendChild(li)
            }
            // 添加到播放列表
            _this.attachPlaylist()

            // 初始化主播放列表（第一次肯定为空）
            if (this.firstLoad) {
                _this.initMainPlaylist()
            }
        })

    }

    // 生成IDS请求参数
    generateIdsList() {

        if (_this.sheetListBox == undefined) {
            //console\.log\('sheetlistbox is undefined')
        }
        let ids = ''
        //////console\.log\(sheetListBox)
        for (let i = 0; i < _this.sheetListBox.children.length; i++) {
            if (i == _this.sheetListBox.children.length - 1) {
                ids += _this.sheetListBox.children[i].getAttribute('musicID')
            } else {
                ids += _this.sheetListBox.children[i].getAttribute('musicID') + ','
            }
        }
        return ids
    }

    // 歌单项目点击后获取音乐Url
    sourceMusicUrl(li: HTMLLIElement) {
        //console\.log\('获取播放地址')
        // 获取URL，添加cookie可以获取到无损
        netease.getMusicUrl(li.getAttribute('musicID'), function (musicUrl) {
            // 设置播放器的源地址
            PData.src = musicUrl

            // 开始播放

            // 如果是刚打开程序
            if (_this.firstLoad) {
                PData.pIndex = 0;
                PData.cover = _this.mPlayList[0].cover;
                PData.now = _this.mPlayList[0].id;
                PData.status = PlayStatus.Pause;
                //sourceMusicUrl(document.getElementById('sheetListBox').children.item(0))
                _this.firstLoad = false;
                return
            }

            //console\.log\('开始播放：' + musicUrl)
            _this.player.play()
            // 设置当前状态为《播放》
            PData.status = PlayStatus.Playing;

            // 绑定当前的播放音乐的ID
            PData.now = li.getAttribute('musicID');

            // 绑定当前播放音乐的名称
            PData.name = li.getAttribute('name')
            player.title = li.getAttribute('name');
            // 绑定当前播放音乐的作者名称
            PData.author = li.getAttribute('author')

        })
    }


    // 输入歌单ID，获取歌单内容
    getSheet(id: string) {
        _this.currentOffset = 0;
        _this.mPlayListName = id
        // 心动模式
        if (id == 'heart') {
            // 设置当前播放的歌单名称
            PData.sheetName = 'heart';
            // 绑定当前歌单创造者
            PData.sheetCover = 'ai'
            PData.sheetCreator = 'ai'
            // 绑定当前歌单播放数
            PData.sheetPlayCount = 0;

            // 遍历所有的歌单ID以执行一些操作
            for (let i = 0; i < _this.mPlayList.length; i++) {

                // 创建一条列表项，每个列表项目对应一首歌
                let li = <HTMLLIElement>document.createElement('LI')

                // 添加样式 背景色#303030
                li.classList.add('sheet-list-item')
                li.classList.add('light-dark')

                // 为列表项设置序号和对应音乐ID以方便点击时候直接调用获取到音乐Url
                li.setAttribute('pIndex', String(i))
                li.setAttribute('musicID', _this.mPlayList[i].id)

                // 为列表项添加点击事件
                li.addEventListener('click', () => {

                    // 设置上次播放的歌曲ID
                    PData.last = PData.now;
                    PData.lIndex = PData.pIndex;

                    // 设置当前播放的index
                    PData.pIndex = parseInt(li.getAttribute('pIndex'));
                    // 设置当前播放的歌单名称
                    PData.sheetName = '心动模式歌单';

                    // 为播放器绑定播放地址，并开始播放
                    _this.sourceMusicUrl(li);
                    //initMainPlaylist()
                    _this.attachPlaylist();
                    // 初始化主播放列表
                    _this.initMainPlaylist();
                });
                var songInfo = <any>_this.mPlayList[i].songInfo;
                li.setAttribute('name', songInfo.name)
                ////console\.log\('['+count+']get one: '+songs[i].name)

                // 为列表项目绑定封面
                li.setAttribute('cover', songInfo.al.picUrl)

                // 为列表项目绑定专辑ID
                li.setAttribute('albumId', songInfo.al.id)

                // 为列表项目绑定专辑名称
                li.setAttribute('albumName', songInfo.al.name)

                // 为列表项目生成作者字符串
                let authors = songInfo.ar
                let author = ''
                for (let i = 0; i < authors.length; i++) {
                    if (i == authors.length - 1) {
                        author += authors[i].name
                        continue
                    }
                    author += authors[i].name + '/'
                }

                li.setAttribute('author', author)

                // 列表项目左侧的歌曲封面
                let coverLeft = document.createElement('IMG')
                coverLeft.style.float = 'left'
                coverLeft.style.width = '35px'
                coverLeft.style.height = '35px'
                coverLeft.setAttribute('src', songInfo.al.picUrl)


                // 列表项目的歌曲名称
                let p = document.createElement('P')
                p.innerText = `${i + 1} ` + songInfo.name + ' - ' + author
                li.appendChild(coverLeft)
                li.appendChild(p)


                _this.sheetListBox.appendChild(li)
                _this.sheetListBox.appendChild(li);
            }

            //console\.log\('歌单长度：', _this.mPlayList.length);
            // 这个时候列表项还没有获取到歌曲名和专辑图片，需要另外获取
            // `${netease.server}/song/detail?ids=${ids}

            // 为所有列表项生成综合请求参数ids，通过上面的
            // 址可以反馈到所有列表项目音乐详情的一个数组
            let ids = this.generateIdsList()

            // 为列表项绑定额外的数据
            /**
             * // 为列表项目绑定歌曲名
                    list.children.items('i').setAttribute('name', songs[i].name)
     
                    // 为列表项目绑定封面
                    list.children.items('i').setAttribute('cover', songs[i].al.picUrl)
     
                    // 为列表项目绑定专辑ID
                    list.children.items('i').setAttribute('albumId', songs[i].al.id)
     
                    // 为列表项目绑定专辑名称
                    list.children.items('i').setAttribute('albumName', songs[i].al.name)
             */
            // _this.bindListItemName(_this.currentOffset, 10)

            // 歌单界面形成☝
        } else {
            let sheet = new SheetDetial(id);
            sheet.Update().then((data: SheetDetial) => {
                // 请求
                // 这里实际上获取到一个歌单的详情，不是歌单列表哦2333
                this.currentSheet = data;

                // playlist.trackIds 为当前歌单的所有歌曲ID的列表（只包含ID）
                // 设置player的播放列表长度参数
                try {
                    PData.count = data.songCount;
                    // 设置当前播放的歌单名称
                    PData.sheetName = data.name;
                    // 绑定当前歌单创造者
                    PData.sheetCreator = data.creator;
                    // 绑定当前歌单播放数
                    PData.sheetPlayCount = data.playCount;
                    // 绑定当前歌单歌曲数
                    PData.sheetTrackCount = data.songCount;
                    // 绑定当前歌单简介
                    PData.sheetDescription = (data.description == null) ? '单主很懒，没有写简介。' : data.description;
                    // 绑定当前歌单封面
                    PData.sheetCover = data.coverUrl;
                } catch (_) { };

                // 加载歌单详情框
                this.loadSheetDetialBox()

                // 这个时候列表项还没有获取到歌曲名和专辑图片，需要另外获取
                // `${netease.server}/song/detail?ids=${ids}

                // 为所有列表项生成综合请求参数ids，通过上面的
                // 址可以反馈到所有列表项目音乐详情的一个数组
                let ids = this.generateIdsList()

                _this.bindListItemName(_this.currentOffset, 20)
                _this.currentOffset = 1;
                // 歌单界面形成☝
                _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
                _this.sheetListBox.onscroll = async function (ev: Event) {
                    // console.log('offsetHeight', _this.sheetListBox.offsetHeight);
                    // //console\.log\('scrollHeight', _this.sheetListBox.scrollHeight);
                    // //console\.log\('scrollTop', _this.sheetListBox.scrollTop);
                    // //console\.log\('offsetTop', _this.sheetListBox.offsetTop);
                    // //console\.log\('clientHeight', _this.sheetListBox.clientHeight);
                    // //console\.log\('offsetHeight', document.body.offsetHeight);
                    if (_this.sheetListBox.scrollHeight - 1 <= _this.sheetListBox.scrollTop + _this.sheetListBox.clientHeight) {
                        //console\.log\('touch')
                        _this.currentOffset += 1;
                        _this.sheetListBox.scrollTop = _this.sheetListBox.scrollTop - 5;
                        await _this.bindListItemName(_this.currentOffset, 10);

                    }
                }
                _this.playlistBox.onscroll = async function (ev) {
                    if (_this.playlistBox.scrollHeight - 1 <= _this.playlistBox.scrollTop + _this.playlistBox.clientHeight) {
                        //console\.log\('touch')
                        _this.currentOffset += 1;
                        _this.playlistBox.scrollTop = _this.playlistBox.scrollTop - 5;
                        await _this.bindListItemName(_this.currentOffset, 10);

                    }
                };
            });

        }

    }
    // 使用当前的播放列表DOM元素初始化数据列表
    initMainPlaylist() {
        let list = _this.playList;
        // 生成主播放列表（播放后切换到这个歌单）
        // 清空
        _this.mPlayList = []
        // 加载
        for (let i = 0; i < list.children.length; i++) {
            let item = {
                'name': list.children[i].getAttribute('name'),
                'id': list.children[i].getAttribute('musicID'),
                'author': list.children[i].getAttribute('author'),
                'cover': list.children[i].getAttribute('cover'),
                'albumId': list.children[i].getAttribute('albumId'),
                'albumName': list.children[i].getAttribute('albumName')
            }
            _this.mPlayList.push(item)
        }
        if (this.firstLoad) {
            this.sourceMusicUrl(<HTMLLIElement>list.firstChild);
        }


    }
    // 获取歌单列表并绑定到界面
    getSheets() {
        let id = netease.data.account.id
        // 根据用户ID请求用户歌单简略信息
        fetch(`${netease.server}/user/playlist?uid=${id}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
            // 获取列表盒子

            // 解析JSON为对象
            // 请求失败
            if (data.code != 200) {
                //console\.log\('not 200')
                return
            }
            //console\.log\(data)
            // 歌单列表
            let sheetlist = data.playlist

            // 重置列表盒子内容
            _this.sheetListBox.innerHTML = ''


            // 遍历所有的歌单
            for (let i = 0; i < sheetlist.length; i++) {

                // 创建一个列表项目，用于显示一个歌单项目
                let li = document.createElement('LI')

                // 设置项目的样式
                li.classList.add('sheet-list-item')
                // #303030
                li.classList.add('light-dark')

                // 设置列表项目对应的序号 争议
                li.setAttribute('pIndex', String(i))



                // 旁边的图标
                let coverLeft = document.createElement('IMG')
                coverLeft.style.float = 'left'
                coverLeft.style.width = '35px'
                coverLeft.style.height = '35px'
                coverLeft.setAttribute('src', sheetlist[i].coverImgUrl)
                li.appendChild(coverLeft)

                // 为每个歌单设置名字
                let p = document.createElement('P')
                p.innerText = sheetlist[i].name
                li.appendChild(p)


                // 歌单列表项目点击事件
                li.addEventListener('click', (e) => {
                    // 再次清空列表盒子的内容，用歌单的歌曲列表取代歌单列表
                    _this.sheetListBox.innerHTML = ''

                    // 请求单个歌单的详情
                    let sheet = new SheetDetial(sheetlist[li.getAttribute('pIndex')].id);
                    sheet.Update().then(sheet => {
                        // 详细播放列表信息 对象
                        // 加载歌单详情框
                        this.loadSheetDetialBox();
                        // 获取歌单
                        _this.getSheet(sheet.sheetId);
                        // 设置当前播放的歌单为点击的歌单
                        PData.sheet = sheet.sheetId;
                    })
                })
                _this.sheetListBox.appendChild(li);
            }
            // 形成歌单列表界面☝
        })
    }

    // 为歌单详情框填充内容
    loadSheetDetialBox() {

        // 为侧边栏添加歌单详情

        // 歌单详情介绍
        let sheetDetialBoxImg = document.getElementById('sheetDetialBoxImg')
        let sheetDetialContent = document.getElementsByClassName('sheet-detail-content')[0]

        let imgUrl = PData.sheetCover;
        sheetDetialBoxImg.setAttribute('src', imgUrl);

        // 名称
        let nameBox = document.createElement('DIV');
        nameBox.innerText = '歌单名：' + PData.sheetName;

        // 创造者
        let creatorBox = document.createElement('DIV');
        creatorBox.innerText = '创建者：' + PData.sheetCreator;
        // 播放数
        let playNumBox = document.createElement('DIV');
        playNumBox.innerText = '播放数：' + PData.sheetPlayCount;
        // 歌曲数
        let trackCountBox = document.createElement('DIV');
        trackCountBox.innerText = '歌曲数：' + PData.sheetTrackCount;
        // 简介
        let descripBox = document.createElement('DIV');
        descripBox.innerText = '简介：' + PData.sheetDescription;


        sheetDetialContent.innerHTML = ''
        sheetDetialContent.appendChild(nameBox)
        sheetDetialContent.appendChild(creatorBox)
        sheetDetialContent.appendChild(playNumBox)
        sheetDetialContent.appendChild(trackCountBox)
        sheetDetialContent.appendChild(descripBox)

    }

    // 加载每日推荐歌单
    loadDailyRecommandedSongs() {
        fetch(`${netease.server}/recommend/songs?cookie=${netease.cookie}`).then((res => res.json())).then(data => {
            // 创建推荐歌单数组
            let rcms = data.data.dailySongs
            //console\.log\(rcms)
            // 清空dailySheet数组内容
            _this.mPlayList = []

            // 遍历推荐歌曲
            for (let i = 0; i < rcms.length; i++) {

                let authors = rcms[i].ar
                let author = ''
                for (let i = 0; i < authors.length; i++) {
                    if (i == authors.length - 1) {
                        author += authors[i].name
                        continue
                    }
                    author += authors[i].name + '/'
                }

                //填充主播放列表
                _this.mPlayList.push({ 'id': rcms[i].id, 'name': rcms[i].name, 'cover': rcms[i].al.picUrl, 'author': author })

                // 创建列表项
                let li = document.createElement('LI')
                // 添加样式
                li.classList.add('sheet-list-item')
                li.classList.add('light-dark')

                // 设置列表向的序号
                li.setAttribute('pIndex', String(i))

                li.setAttribute('musicID', rcms[i].id)
                // 创建列表项左侧歌曲封面框
                let coverLeft = document.createElement('IMG')
                coverLeft.style.float = 'left'
                coverLeft.style.width = '35px'
                coverLeft.style.height = '35px'

                // 为封面框添加图片源 争议
                // 用到了上面初始化好的dailySheet
                // 设置封面
                coverLeft.setAttribute('src', _this.mPlayList[i].cover)

                // 封面框右侧的歌曲名称
                let p = document.createElement('P')
                p.innerText = rcms[i].name
                li.appendChild(coverLeft)
                li.appendChild(p)

                // 列表项的点击事件，初始化一些东西然后开始播放
                li.addEventListener('click', () => {

                    // 播放器绑定上次播放的歌曲ID
                    PData.last = PData.now;
                    PData.lIndex = PData.pIndex;

                    // 播放器绑定当前播放的index
                    PData.pIndex = parseInt(li.getAttribute('pIndex'));
                    PData.now = _this.mPlayList[li.getAttribute('pIndex')].id;


                    // 播放器绑定当前播放音乐的封面
                    PData.cover = _this.mPlayList[li.getAttribute('pIndex')].cover;

                    // 获取播放地址
                    _this.netease.getMusicUrl(PData.now, function (musicUrl) {
                        // 为播放器添加播放源
                        PData.src = musicUrl;

                        _this.firstLoad = false;
                        // 开始播放
                        _this.player.play();
                        //document.getElementById('musicTitle').innerText = '正在播放：'+[PData.pIndex].name
                        PData.status = PlayStatus.Playing;;
                    });
                })


                // 填充列表
                _this.sheetListBox.appendChild(li);
            }

            // 设置当前歌单的名字，会显示在实时歌单和歌单详情里
            PData.sheetName = '每日推荐';

            // 刷新实时歌单
            _this.attachPlaylist()
        })
    }

    // 加载私人定制FM
    loadFM() {
        // 读取音乐界面代码
        readFile(path.join(__dirname, '../pages/music.html'), (err, data) => {
            // 右侧主容器初始化
            document.getElementById('content').innerHTML = data.toString()
            _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
            // 设置当前页面为音乐详情
            PData.currentPage = PlayerPage.Music;

            // 加载播放FM歌曲

            // 清空FM歌单列表
            _this.mPlayList = []
            var netease = _this.netease;
            netease.getFMList(
                function (fms) {
                    // 填充主播放列表
                    for (let i = 0; i < fms.length; i++) {
                        let authors = fms[i].artists
                        let author = ''
                        for (let i = 0; i < authors.length; i++) {
                            if (i == authors.length - 1) {
                                author += authors[i].name
                                continue
                            }
                            author += authors[i].name + '/'
                        }
                        _this.mPlayList.push({ 'id': fms[i].id, 'name': fms[i].name, 'cover': fms[i].album.picUrl, 'author': author })
                    }


                    // 初始化绑定播放器当前播放序号、当前音乐ID、当前封面
                    PData.pIndex = 0;
                    PData.now = fms[0].id;
                    PData.cover = fms[0].album.picUrl;
                    PData.name = fms[0].name
                    // 获取播放地址
                    netease.getMusicUrl(PData.now, function (musicUrl) {
                        _this.firstLoad = false
                        // 为播放器设置播放源地址
                        PData.src = musicUrl

                        // 播放器开始播放
                        _this.player.play()

                        // 设置播放状态为播放
                        PData.status = PlayStatus.Playing;

                        // 加载歌词
                        _this.showLyric()
                        // 更新封面
                        PData.cover = _this.mPlayList[0].cover;
                        // 加载评论
                        _this.loadComment(1, 25);
                        /// 加载喜不喜欢按钮
                        _this.loadLikeBtn();
                        //loadDislikeBtn()
                        _this.loadCollectBtn();
                        // 加载开始评论按钮
                        _this.loadAddcommentBtn();
                        _this.loadDownloadBtn()
                    })
                },
                this.loadMusicPage
            )

        })
    }
    // 加载评论
    loadComment(page: number, limit: number) {
        //////console\.log\('show')
        if (page < 1) {
            page = 1
        }

        let musicPanelBottom = document.getElementById('musicPanelBottom')

        fetch(`${netease.server}/comment/music?id=${PData.now}&limit=${limit}&offset=${(page - 1) * 3}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
            let hot = data.hotComments
            let normal = data.comments
            // musicPanelBottom.innerHTML = ''

            // let hotcommentList = document.createElement('UL')
            // hotcommentList.setAttribute('id', 'hotcommentList')

            let normalcommentList = document.getElementById('normalcommentList');
            normalcommentList.setAttribute('count', data.total);
            normalcommentList.setAttribute('page', '1');
            normalcommentList.setAttribute('pages', String(Math.round(data.total / 3)));
            normalcommentList.innerHTML = '';
            // for (let i = 0; i < hot.length; i++) {
            //     let user = hot[i].user.nickname
            //     let content = hot[i].content
            //     let li = document.createElement('LI')

            //     //li.classList.add('comment-line')
            //     let contentDiv = document.createElement('DIV')
            //     contentDiv.innerText = content
            //     contentDiv.classList.add('comment-line')
            //     contentDiv.classList.add('light-dark')
            //     let userP = document.createElement('DIV')

            //     userP.classList.add('comment-label-mute')
            //     userP.innerText = user
            //     contentDiv.appendChild(userP)
            //     li.appendChild(contentDiv)

            //     hotcommentList.appendChild(li)
            // }

            for (let i = 0; i < normal.length; i++) {
                let user = normal[i].user.nickname
                let content = normal[i].content
                let li = document.createElement('LI')

                //li.classList.add('comment-line')
                let contentDiv = document.createElement('DIV')
                contentDiv.innerText = content
                contentDiv.classList.add('comment-line')
                contentDiv.classList.add('light-dark')
                let userP = document.createElement('DIV')

                userP.classList.add('comment-label-mute')
                userP.innerText = user
                contentDiv.appendChild(userP)
                li.appendChild(contentDiv)

                normalcommentList.appendChild(li)
            }

            // 上一页/下一页 评论
            // let hotcommentBtn = document.getElementById('hotcommentBtn')
            // let normalcommentBtn = document.getElementById('normalcommentBtn')

            // hotcommentBtn.addEventListener('click', (e) => {

            //     e.stopPropagation()
            //     // hotcommentList.style.display = 'block'
            //     normalcommentList.style.display = 'none'
            //     document.getElementById('commentPageUp').style.display = 'none'
            //     document.getElementById('commentPageDown').style.display = 'none'
            // })
            // normalcommentBtn.addEventListener('click', (e) => {
            //     e.stopPropagation()
            //     normalcommentList.style.display = 'block'
            //     // hotcommentList.style.display = 'none'
            //     document.getElementById('commentPageUp').style.display = 'block'
            //     document.getElementById('commentPageDown').style.display = 'block'
            //     normalcommentList.setAttribute('page', '1')

            // })

            let commentPageUpFunc = (e) => {
                e.stopPropagation()
                let page = Number(normalcommentList.getAttribute('page'))
                if (page > 1) {
                    page = Number(page) - 1
                    normalcommentList.setAttribute('page', String(page))
                    fetch(`${netease.server}/comment/music?id=${PData.now}&limit=${limit}&offset=${(page - 1) * 3}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
                        let normal = data.comments
                        //////console\.log\(str)
                        if (normal != undefined) {
                            normalcommentList.innerHTML = ''
                            for (let i = 0; i < normal.length; i++) {
                                let user = normal[i].user.nickname
                                let content = normal[i].content
                                let li = document.createElement('LI')

                                //li.classList.add('comment-line')
                                let contentDiv = document.createElement('DIV')
                                contentDiv.innerText = content
                                contentDiv.classList.add('comment-line')
                                contentDiv.classList.add('light-dark')
                                let userP = document.createElement('DIV')

                                userP.classList.add('comment-label-mute')
                                userP.innerText = user
                                contentDiv.appendChild(userP)
                                li.appendChild(contentDiv)

                                normalcommentList.appendChild(li)
                                normalcommentList.scrollTop = 0
                            }
                        }
                    })
                }
            }


            let commentPageDownFunc = () => {
                // e.stopPropagation()
                let page = Number(normalcommentList.getAttribute('page'))

                //////console\.log\('still')
                //////console\.log\('still+'+page)
                //////console\.log\('stillpages:'+normalcommentList.getAttribute('pages'))
                //////console\.log\('??'+(page < normalcommentList.getAttribute('pages')))
                if (page < Number(normalcommentList.getAttribute('pages'))) {

                    page = Number(page) + 1
                    normalcommentList.setAttribute('page', String(page))
                    //////console\.log\(normalcommentList.getAttribute('pages'))
                    //////console\.log\(normalcommentList.getAttribute('page'))
                    //////console\.log\(page)
                    fetch(`${netease.server}/comment/music?id=${PData.now}&limit=${limit}&offset=${(page - 1) * 3}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
                        let normal = data.comments
                        //////console\.log\(str)
                        if (normal != undefined) {
                            // normalcommentList.innerHTML = ''
                            for (let i = 0; i < normal.length; i++) {
                                let user = normal[i].user.nickname
                                let content = normal[i].content
                                let li = document.createElement('LI')

                                //li.classList.add('comment-line')
                                let contentDiv = document.createElement('DIV')
                                contentDiv.innerText = content
                                contentDiv.classList.add('comment-line')
                                contentDiv.classList.add('light-dark')
                                let userP = document.createElement('DIV')

                                userP.classList.add('comment-label-mute')
                                userP.innerText = user
                                contentDiv.appendChild(userP)
                                li.appendChild(contentDiv)

                                normalcommentList.appendChild(li)
                                normalcommentList.scrollTop = 0
                            }
                        }
                    })
                }
            }
            // let commentPageUp = document.getElementById('commentPageUp')
            // let commentPageDown = document.getElementById('commentPageDown')
            // commentPageUp.style.display = 'none'
            // commentPageDown.style.display = 'none'
            // commentPageUp.addEventListener('click', commentPageUpFunc)

            // commentPageDown.addEventListener('click', commentPageDownFunc)

            //musicPanelBottom.appendChild(hotcommentList)
            // musicPanelBottom.appendChild(normalcommentList)
            musicPanelBottom.onscroll = function (ev) {
                if (musicPanelBottom.scrollHeight - 1 <= musicPanelBottom.scrollTop + musicPanelBottom.clientHeight) {
                    //console\.log\('touch')
                    // _this.currentOffset += 1;
                    musicPanelBottom.scrollTop = musicPanelBottom.scrollTop - 5;
                    // await _this.bindListItemName(_this.currentOffset, 10);
                    commentPageDownFunc();
                }
            }
        })
    }

    loadLikeBtn() {
        // 喜欢按钮
        let likeBtn = document.getElementById('likeBtn')
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            fetch(`${netease.server}/like?id=${PData.now}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
                ////console\.log\(str)
                if (data.code == 200) {
                    new Notification('通知', {
                        body: '喜欢歌曲成功'
                    })
                } else {
                    new Notification('通知', {
                        body: '喜欢歌曲失败'
                    })
                    ////console\.log\(str)
                }
            })
        })
    }


    // 加载收藏按钮
    loadCollectBtn() {
        // 收藏按钮
        let collectBtn = document.getElementById('collectBtn')
        collectBtn.addEventListener('click', (e) => {
            let mid = PData.now
            fetch(`${netease.server}/user/playlist?uid=${netease.data.account.id}&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
                let sheetlist = data.playlist
                ////console\.log\('[url]'+`${netease.server}/user/playlist?uid=${this.data.account.id}`+'sheetlist:'+str)
                let req = new XMLHttpRequest()
                let collectDialog = dialog.newCollectDialog('collect_dialog', sheetlist, mid, netease.cookie)
            })
        })
    }

    loadDislikeBtn() {
        // 不喜欢按钮
        let dislikeBtn = document.getElementById('dislikeBtn')
        dislikeBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            fetch(`${netease.server}/like?id=${PData.now}&like=false&cookie=${netease.cookie}`).then(res => res.json()).then(data => {
                if (data.code == 200) {
                    ////console\.log\(str)
                    new Notification('通知', {
                        body: '取消喜欢歌曲成功，可能需要一点点时间系统才会更新。'
                    })
                } else {
                    new Notification('通知', {
                        body: '取消喜欢歌曲失败'
                    })
                }
            })
        })
    }

    loadAddcommentBtn() {
        let startcommentBtn = document.getElementById('startcommentBtn')
        startcommentBtn.addEventListener('click', (e) => {
            e.stopPropagation()

            // 输入窗口
            let addcommentBox = <HTMLDivElement>document.createElement('DIV')
            addcommentBox.setAttribute('id', 'addcommentBox')
            addcommentBox.className = 'addcommentBox'

            // 输入框
            let commentTextBox = <HTMLInputElement>document.createElement('INPUT')
            commentTextBox.setAttribute('type', 'text')
            commentTextBox.setAttribute('id', 'commentTextBox')
            commentTextBox.setAttribute('placeholder', '输入评论')
            addcommentBox.appendChild(commentTextBox)

            // 提交按钮
            let addcommentBtn = <HTMLButtonElement>document.createElement('button')
            addcommentBtn.setAttribute('id', 'addcommentBtn')
            addcommentBtn.innerText = '提交'
            addcommentBox.appendChild(addcommentBtn)
            addcommentBtn.addEventListener('click', (e) => {
                e.stopPropagation()
                var url: string = `${netease.server}/comment?type=0&t=1&id=${PData.now}&content=${commentTextBox.value}&cookie=${netease.cookie}`;
                fetch(url).then(res => res.json()).then(data => {
                    if (data.code == 200) {
                        new Notification('通知', {
                            body: '评论发送成功'
                        })
                        addcommentBox.remove()
                        _this.loadComment(1, 25)
                    } else {
                        ////console\.log\(str)
                    }
                })
            })


            document.getElementsByTagName('body')[0].appendChild(addcommentBox)

            commentTextBox.focus()

        })
    }
    loadDownloadBtn() {
        var downloadBtn = <HTMLLinkElement>document.getElementById("downloadBtn")
        if (downloadBtn) {
            // downloadBtn.href = PData.src
            // downloadBtn.setAttribute('download', `${PData.name}.${PData.src.split('.').slice(-1)}`)
            downloadBtn.onclick = (e) => {
                e.stopPropagation()
                console.log(__dirname)
                console.log(`${__dirname}/${PData.name}.${PData.src.split('.').slice(-1)}`)
                try {
                    (async () => {
                        var downloadDir = `${USR_CONFIG_DIR}\\download`
                        if (!fs.existsSync(downloadDir)) {
                            fs.mkdirSync(downloadDir, '0755')
                        }
                        var file = fs.createWriteStream(`${downloadDir}\\${PData.name}.${PData.src.split('.').slice(-1)}`)
                        var request = http.get(PData.src, (response) => {
                            response.pipe(file)
                            file.on('finish', () => {
                                file.close()
                                console.log('download file finished')
                                dialog.createDialog("dwnfinished", "通知", 300, 300, "下载歌曲完毕");
                            })
                        })
                        request.on('error', function (err) {
                            file.unlink()
                            console.log('error', err)
                            dialog.createDialog("dwnfinished", "通知", 300, 300, `下载歌曲失败: ${err}`);
                        })
                    })()
                } catch (ex) {
                    console.log(ex)
                }
            }
        }
    }
    loadMusicPage() {

        //console\.log\('load music page', PData.mode)
        // FM模式设置
        if (PData.mode == PlayMode.FM) {
            this.loadFM()
        }

        if (PData.mode == PlayMode.Normal || PData.mode == PlayMode.DAILYREC || PData.mode == PlayMode.HEART) {
            readFile(path.join(__dirname, '../pages/music.html'), (err, data) => {

                document.getElementById('content').innerHTML = data.toString();
                _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
                // 设置当前页面为音乐详情
                PData.currentPage = PlayerPage.Music;
                //////console\.log\(PData.pIndex)
                //////console\.log\(PData.pIndex.cover)
                let diskCover = document.getElementById('diskCover')
                diskCover.setAttribute('src', _this.mPlayList[PData.pIndex].cover)

                //加载歌词
                _this.showLyric()

                // 加载喜不喜欢按钮
                _this.loadLikeBtn()
                //loadDislikeBtn()
                _this.loadCollectBtn()
                // 加载开始评论按钮
                _this.loadAddcommentBtn()
                // 加载下载按钮
                _this.loadDownloadBtn()
                // 评论
                _this.loadComment(1, 25)
            })
        }

    }

    // 显示歌词
    showLyric() {
        this.currentSheet.GetLyric(PData.now).then(
            (lyricCuts) => {
                readFile(path.join(__dirname, '../pages/lyric.html'), (err, data) => {
                    let lyricBox = document.getElementById('lyric')
                    let lyricLines = document.getElementById("lyric-lines");
                    lyricBox.innerHTML = data.toString()

                    // 根据歌词的长度判断歌曲是轻音乐还是正常歌曲
                    if (lyricCuts.length > 0) {
                        _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
                        let lyricLines = <HTMLUListElement>document.getElementById('lyric-lines')
                        for (let i = 0; i < lyricCuts.length; i++) {
                            //////console\.log\('123')
                            let l = document.createElement('LI')
                            //l.classList.add('menu-item')
                            l.setAttribute('time', lyricCuts[i].time)
                            l.id = 'lyric-' + lyricCuts[i].time
                            l.innerText = lyricCuts[i].content
                            lyricLines.appendChild(l)
                            l.addEventListener('dblclick', (() => {
                                _this.player.currentTime = Number(l.getAttribute('time'));
                            }).bind(this))
                        }

                        this.lyricInterval = setInterval(() => {
                            //////console\.log\(lyricBox.scrollTop)
                            let ct = parseInt(String(PData.pTime));
                            let currentLine = <HTMLLIElement>document.getElementById('lyric-' + ct)
                            if (currentLine != undefined) {
                                for (let i = 0; i < lyricLines.children.length; i++) {
                                    (<HTMLLIElement>lyricLines.children[i]).style.color = 'ivory';
                                }
                                currentLine.style.color = 'coral';

                                // var prevoisLine = <HTMLLIElement>currentLine.previousElementSibling;
                                // if (prevoisLine) {
                                //     prevoisLine.style.color = 'ivory';
                                // }
                                // console.log(currentLine.offsetTop)
                                lyricLines.scrollTop = currentLine.offsetTop - (lyricLines.clientHeight / 2);
                            }
                        }, 200);
                    } else {
                        _this.sheetListBox = <HTMLUListElement>document.getElementById('sheetListBox');
                        let lyricLines = document.getElementById('lyric-lines')
                        let l = document.createElement('LI')
                        l.innerText = '纯音乐，敬请聆听。'
                        lyricLines.appendChild(l)
                    }
                })
            }
        )
    }
}