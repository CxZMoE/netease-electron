"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = exports.USR_CONFIG_DIR = void 0;
const electron_1 = require("electron");
const fs = electron_1.remote.require('fs');
const { readFile } = electron_1.remote.require('fs');
const path = electron_1.remote.require('path');
const http = electron_1.remote.require('http');
const log_1 = require("./log"); // 调试用
const netease_1 = require("./netease");
const dialog_1 = require("./dialog");
var netease;
var player;
// 全局常量
exports.USR_CONFIG_DIR = electron_1.remote.app.getPath("home") + "/.moe.cxz.netease-electron";
var dialog = new dialog_1.default();
// 用户目录
function CheckConfigDir() {
    let exists = fs.existsSync(exports.USR_CONFIG_DIR);
    if (!exists) {
        log_1.default.LogE("用户配置文件未找到");
        fs.mkdir(exports.USR_CONFIG_DIR, { mode: "0755", recursive: true }, () => {
            log_1.default.LogI("创建用户配置文件目录");
        });
    }
}
class Player {
    constructor() {
        // 状态变量
        this.playMode = 'list-loop';
        this.isMoveProgress = false;
        this.player = document.getElementById("player");
        player = this.player;
        this.firstLoad = true;
        // 检查用户目录
        CheckConfigDir();
        // 初始化网易服务
        this.netease = new netease_1.default(this.player);
        netease = this.netease;
    }
    InitDom() {
        console.log('init dom');
        var player = this.player;
        // 播放器播放模式设置为默认模式
        this.player.setAttribute("mode", "normal");
        // [全局定时器] 用于实时监控播放状态
        setInterval(() => {
            let sheetListBox = document.getElementById("sheetListBox"); // 歌单列表
            let playList = document.getElementById("playList"); // 播放列表
            // 突出显示当前播放歌曲, 更新背景色
            if (this.player.getAttribute("mode") != "fm") {
                // 如果歌单列表存在，更新项目的背景色
                if (sheetListBox) {
                    let sheetListBoxItemSelected = sheetListBox.children.item(Number(this.player.getAttribute("index")));
                    for (let i = 0; i < sheetListBox.children.length; i++) {
                        let sheetListBoxItem = sheetListBox.children.item(i);
                        // [其它] 背景
                        sheetListBoxItem.style.backgroundColor = "#303030";
                        // [选中项]
                        sheetListBoxItemSelected.style.backgroundColor = "#1e1e1e";
                    }
                }
                // 如果播放列表存在，更新项目的背景色
                if (playList && playList.children.length > 0) {
                    let sheetListBoxItemSelected = sheetListBox.children.item(Number(this.player.getAttribute("index")));
                    for (let i = 0; i < playList.children.length; i++) {
                        let sheetListBoxItem = sheetListBox.children.item(i);
                        sheetListBoxItem.style.backgroundColor = "#303030";
                        sheetListBoxItemSelected.style.backgroundColor = "#1e1e1e";
                    }
                }
            }
            // 更新播放按钮状态
            let status = this.player.getAttribute("status");
            let playBtn = document.getElementById("playerPlay");
            if (status == 'pause') {
                playBtn.setAttribute('src', '../pics/play.png');
            }
            else if (status == 'stop') { // 如果是停止
                playBtn.setAttribute('src', '../pics/play.png');
            }
            else {
                playBtn.setAttribute('src', '../pics/pause.png');
            }
        }, 500);
        // 播放列表开关
        {
            let playlistBtn = document.getElementById("playlistBtn");
            let playlistBox = document.getElementById("playlistBox");
            let playList = document.getElementById("playList");
            playlistBtn.addEventListener('click', (e) => {
                if (playlistBox.style.height == "300px")
                    playlistBox.style.height = "0px";
                else {
                    let playIndex = Number(this.player.getAttribute("index"));
                    playlistBox.style.height = "300px";
                    playlistBox.scrollTop = playList.children.item(playIndex).offsetTop - 155;
                }
            });
        }
        // 播放模式按钮事件
        {
            let playmodeBtn = document.getElementById("playmodeBtn");
            playmodeBtn.addEventListener("click", () => {
                switch (this.playMode) {
                    case "list-loop":
                        this.playMode = "single-loop";
                        playmodeBtn.setAttribute("src", "../pics/single-loop.png");
                        break;
                    case "single-loop":
                        this.playMode = "random";
                        playmodeBtn.setAttribute("src", "../pics/random.png");
                        break;
                    case "random":
                        this.playMode = "list-loop";
                        playmodeBtn.setAttribute("src", "../pics/loop.png");
                        break;
                    default:
                        break;
                }
            });
        }
        // 评论消失事件
        document.addEventListener('click', (e) => {
            let scb = document.getElementById("addcommentBox");
            let searchBox = document.getElementById("searchBox");
            let target = e.target;
            if (scb != null && target != scb && e.target != scb) {
                scb.remove();
            }
            if (searchBox != null && target != searchBox && e.target != searchBox) {
                searchBox.style.height = "0px";
                searchBox.style.visibility = "hidden";
            }
        });
        // 隐藏窗口事件
        document.getElementById("titlebar").addEventListener("dblclick", (e) => {
            e.stopPropagation();
            require('electron').remote.BrowserWindow.getFocusedWindow().hide();
            require('electron').remote.getGlobal("windowHided").is = true;
        });
        // 事先加载搜索页面
        readFile(path.join(__dirname, "../pages/search.html"), (err, data) => {
            let body = document.getElementsByTagName("body")[0];
            let searchBox = document.createElement("DIV");
            // <div id="searchBox" class="search-box">
            searchBox.setAttribute("id", "searchBox");
            searchBox.className = "search-box";
            searchBox.innerHTML = data.toString();
            body.appendChild(searchBox);
            // 搜索事件
            let searchKeywords = document.getElementById("searchKeywords");
            searchKeywords.addEventListener("input", (e) => {
                //if (e.keyCode != 13) {
                //    ////console.log(e.keyCode)
                //    return
                //}
                let target = e.target;
                http.get(`${netease.server}/search?keywords=${target.value}`, (res) => {
                    res.on('data', (str) => {
                        let data = JSON.parse(str);
                        if (data == undefined) {
                            //console.log(str)
                            return;
                        }
                        // 搜索结果数组
                        let results = data.result.songs;
                        let resultBox = document.getElementById("searchResultBox");
                        resultBox.innerHTML = "";
                        let ul = document.createElement("UL");
                        ul.className = "sheet-list-box";
                        resultBox.appendChild(ul);
                        for (let i = 0; i < results.length; i++) {
                            let li = document.createElement("LI");
                            li.className = "sheet-list-item";
                            // 音乐名称
                            li.innerText = results[i].name;
                            // 音乐ID
                            li.setAttribute("musicID", results[i].id);
                            li.setAttribute('index', i.toString());
                            // 添加列表子项
                            ul.appendChild(li);
                            li.addEventListener("click", (e) => {
                                e.stopPropagation();
                                // 获取音乐详情
                                http.get(`${netease.server}/song/detail?ids=${li.getAttribute("musicID")}`, (res) => {
                                    res.on('data', (chunk) => {
                                        str += chunk;
                                    });
                                    res.on('data', (str) => {
                                        let data = JSON.parse(str);
                                        if (data == undefined) {
                                            //console.log(str)
                                            return;
                                        }
                                        let song = data.songs[0];
                                        // 封面
                                        li.setAttribute("cover", song.al.picUrl);
                                        // 作者
                                        let authors = song.ar;
                                        let author = '';
                                        for (let i = 0; i < authors.length; i++) {
                                            if (i == authors.length - 1) {
                                                author += authors[i].name;
                                                continue;
                                            }
                                            author += authors[i].name + "/";
                                        }
                                        // 获取音乐URL
                                        http.get(`${netease.server}/song/url?id=${li.getAttribute('musicID')}&cookie=${netease.cookie}`, (res) => {
                                            res.on('data', (chunk) => {
                                                str += chunk;
                                            });
                                            res.on('data', (str) => {
                                                let data = JSON.parse(str).data;
                                                if (data == undefined) {
                                                    this.getMusicDetailForLiClick(li);
                                                    return;
                                                }
                                                let musicUrl = JSON.parse(str).data[0].url;
                                                let searchItem = [{ "name": li.innerText, "id": li.getAttribute('musicID'), "cover": li.getAttribute('cover'), "author": author }];
                                                searchItem.push.apply(searchItem, this.mainplaylist);
                                                this.mainplaylist = searchItem;
                                                searchItem = null;
                                                this.player.setAttribute('index', "0");
                                                this.player.setAttribute('src', musicUrl);
                                                player.play();
                                                this.updateCover(li.getAttribute("cover"));
                                                this.player.setAttribute('status', 'play');
                                                this.player.setAttribute('now', li.getAttribute('musicID'));
                                                // 隐藏搜索框
                                                searchBox.style.height = "0px";
                                                searchBox.style.visibility = "hidden";
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    });
                });
            });
        });
        // 搜索页面展现事件
        document.addEventListener("keydown", (e) => {
            if (!(e.keyCode == 83 && e.ctrlKey)) {
                return;
            }
            e.stopPropagation();
            let searchBox = document.getElementById("searchBox");
            let searchKeywords = document.getElementById("searchKeywords");
            if (searchBox.style.visibility == "visible") {
                searchBox.style.visibility = "hidden";
                searchBox.style.height = "0px";
                searchKeywords.blur();
            }
            else {
                searchBox.style.visibility = "visible";
                searchBox.style.height = "200px";
                searchKeywords.focus();
            }
        });
        // 登录按钮事件
        document.getElementById("login").addEventListener('click', (e) => {
            var netease = this.netease;
            // 登录
            if (netease.loginStatus == false) {
                dialog.newLoginDialog("loginDialog", function () {
                    let username = document.getElementById("username");
                    let password = document.getElementById("password");
                    netease.login(username.value, password.value);
                });
            }
            else {
                netease.qd();
            }
        });
        readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
            console.log(data);
            document.getElementById("mainPage").innerHTML = data.toString();
            this.player.setAttribute("currentPage", "home");
        });
        // 登陆状态判定
        fs.readFile(`${exports.USR_CONFIG_DIR}/login.json`, { encoding: "utf8" }, (err, data) => {
            if (err) {
                //console.error(err)
                netease.loginStatus = false;
                new Notification("通知", { body: "您还未登录，请先登录。" });
                this.netease.data = {};
                dialog.newLoginDialog("loginDialog", function () {
                    let username = document.getElementById("username");
                    let password = document.getElementById("password");
                    netease.login(username.value, password.value);
                });
                return;
            }
            else {
                netease.data = JSON.parse(data);
                if (netease.data.code == 502) {
                    fs.unlink(`${exports.USR_CONFIG_DIR}/login.json`, (err) => {
                        new Notification("登录失败", {
                            body: "账号或密码错误"
                        });
                        dialog.newLoginDialog("loginDialog", function () {
                            let username = document.getElementById("username");
                            let password = document.getElementById("password");
                            netease.login(username.value, password.value);
                        });
                        return;
                    });
                    return;
                }
                netease.cookie = netease.data.cookie;
                document.getElementById("loginLabel").innerText = netease.data.profile.nickname;
                http.get(`${netease.server}/login/status?cookie=${netease.cookie}`, (res) => {
                    res.on('data', (str) => {
                        let data = JSON.parse(str);
                        if (data.msg == "需要登录") {
                            netease.loginStatus = false;
                            new Notification("通知", { body: "登录过期，请重新登录" });
                            netease.data = {};
                            dialog.newLoginDialog("loginDialog", function () {
                                let username = document.getElementById("username");
                                let password = document.getElementById("password");
                                netease.login(username.value, password.value);
                            });
                        }
                        else {
                            // 登录正常
                            // 先获取我喜欢的音乐
                            document.getElementById("login").setAttribute("src", netease.data.profile.avatarUrl);
                            if (data.code != 502) {
                                // 有效登录
                                netease.loginStatus = true;
                                // 初始化
                                this.getFav();
                                this.initProgrss();
                                this.initSidebar();
                                this.initPlayer();
                                // 初始化封面点击
                                this.initCover();
                                //alert(JSON.stringify(loginData))
                            }
                        }
                    });
                });
            }
        });
    }
    // 初始化播放进度条
    initProgrss() {
        // 为播放条添加拖拽效果
        var progressPin = document.getElementById("progressPin");
        var progress = document.getElementById("progress");
        var player = this.player;
        var ctlabel = document.getElementById("currentTimeLabel");
        // 处理拖动
        progressPin.addEventListener('mousedown', (e) => {
            progressPin.setAttribute("l_x", e.x.toString());
            this.isMoveProgress = true;
        });
        progressPin.addEventListener('mouseup', (e) => {
            let l_x = Number(progressPin.getAttribute("l_x"));
            let toTime = ((l_x - progress.getBoundingClientRect().x) / progress.getBoundingClientRect().width) * Number(this.player.getAttribute("length"));
            player.currentTime = toTime;
            this.isMoveProgress = false;
        });
        progressPin.addEventListener('mouseout', (e) => {
            this.isMoveProgress = false;
        });
        progressPin.addEventListener('mousemove', (e) => {
            if (this.isMoveProgress) {
                let rect = progressPin.getBoundingClientRect();
                // 上一次坐标
                let l_x = Number(progressPin.getAttribute("l_x"));
                let toTime = ((l_x - progress.getBoundingClientRect().x) / progress.getBoundingClientRect().width) * Number(this.player.getAttribute("length"));
                ctlabel.innerText = toTime / 60 + ":" + (toTime % 60);
                // 移动
                progressPin.style.left = rect.x + (e.x - l_x) + 'px';
                // 设置上一次坐标
                progressPin.setAttribute("l_x", e.x.toString());
            }
        });
    }
    // 初始化侧边栏事件
    initSidebar() {
        var player = this;
        // 歌单按钮点击
        var sheetBtn = document.getElementById("sheetBtn");
        sheetBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
                document.getElementById("mainPage").innerHTML = data.toString();
                player.getSheets();
                player.player.setAttribute("currentPage", "home");
                player.player.setAttribute("mode", "normal");
            });
        });
        // 我喜欢的音乐按钮点击
        var favBtn = document.getElementById("favBtn");
        favBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
                document.getElementById("mainPage").innerHTML = data.toString();
                player.getFav();
                document.getElementById("player").setAttribute("currentPage", "home");
                player.player.setAttribute("mode", "normal");
            });
        });
        // 私人FM点击
        var fmBtn = document.getElementById("fmBtn");
        fmBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            player.player.setAttribute("mode", "fm");
            player.loadMusicPage();
        });
        // 心跳点击
        var heartBtn = document.getElementById("heart");
        heartBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            // getFav()
            player.getHeart();
        });
        // 每日推荐被点击
        var dailyRecommendBtn = document.getElementById("dailyRecommendBtn");
        dailyRecommendBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            player.player.setAttribute("mode", "normal");
            readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
                document.getElementById("mainPage").innerHTML = data.toString();
                player.loadDailyRecommandedSongs();
                document.getElementById("player").setAttribute("currentPage", "home");
                player.player.setAttribute("mode", "normal");
            });
        });
    }
    // 初始化播放器
    initPlayer() {
        // 获取播放器控件
        var player = document.getElementById("player");
        // 设置初始播放序号
        this.player.setAttribute('index', "0");
        // 初始状态为停止
        this.player.setAttribute('status', 'stop');
        // 播放完毕时候下一首
        player.addEventListener('ended', (function () {
            // 下一首
            this.next();
        }).bind(this));
        var progressPin = document.getElementById("progressPin");
        let x = progressPin.getClientRects().item(0).x;
        // 更新播放进度
        player.addEventListener('timeupdate', (function (e) {
            // 在不拖动进度滑块的时候做：
            if (!this.isMoveProgress) {
                // 当前播放时间（秒） 标签
                var ctlabel = document.getElementById("currentTimeLabel");
                // 歌曲长度（秒） 标签
                var lengthLabel = document.getElementById("lengthLabel");
                let musicLength = Number(this.player.getAttribute('length'));
                // 更新当前时间
                ctlabel.innerText = `${player.currentTime / 60}:${player.currentTime % 60}`;
                // 更新总时长
                lengthLabel.innerText = `${musicLength / 60}:${musicLength % 60}`;
                // 标记歌曲进度
                let progress = player.currentTime / player.duration;
                // progress为播放进度百分比小数形式
                this.player.setAttribute('progress', progress.toString());
                // 当前时间（秒）
                this.player.setAttribute('time', player.currentTime.toString());
                // 获取进度条滑块
                var progressPin = document.getElementById("progressPin");
                // 获取进度条
                var progressBar = document.getElementById("progress");
                // 计算进度条位置偏移
                let offset = progressBar.clientWidth * progress;
                // 移动进度条
                progressPin.style.left = x + offset + 'px';
            }
        }).bind(this));
        // 加载完毕后设置长度参数
        player.addEventListener('canplay', () => {
            this.player.setAttribute('length', player.duration.toString());
            // 更新封面
            let cover = this.mainplaylist[this.player.getAttribute('index')].cover;
            this.updateCover(cover);
            document.getElementById("musicTitle").innerText = "正在播放：" + this.mainplaylist[this.player.getAttribute('index')].name; //+ " - " + mainplaylist[this.player.getAttribute('index')].author
            // 显示歌词
            clearInterval(this.lyricInterval);
            if (this.player.getAttribute("currentPage") == 'music') {
                this.showLyric();
                this.loadComment(1);
            }
        });
        var _this = this;
        // 错误处理
        player.addEventListener('error', (e) => {
            new Notification("无法播放", {
                body: "无法播放，可能是没有版权或者权限。"
            });
            //console.log("无法播放，可能是没有版权或者权限。")
            //console.log(this.player)
            _this.next();
        });
        // Buttons
        let lastBtn = document.getElementById("playerLast");
        let playBtn = document.getElementById("playerPlay");
        let nextBtn = document.getElementById("playerNext");
        // 绑定按钮的事件
        nextBtn.addEventListener('click', function () {
            _this.next();
        });
        lastBtn.addEventListener('click', function () {
            _this.last();
        });
        playBtn.addEventListener('click', function () {
            _this.play();
        });
    }
    /**
     *  绑定全局按键
     */
    bindGlobalShortcut() {
        // 绑定全局案件
        let globalShortcut = require('electron').remote.globalShortcut;
        let nextKey = 'CommandOrControl+Alt+Right';
        let lastKey = 'CommandOrControl+Alt+Left';
        let playPauseKey = `CommandOrControl+Alt+P`;
        let volUpKey = `CommandOrControl+Alt+Up`;
        let volDownKey = `CommandOrControl+Alt+Down`;
        var _this = this;
        var _player = this.player;
        let nextShortcut = globalShortcut.register(nextKey, () => {
            _this.next();
            if (!nextShortcut) {
                //console.log("注册按键失败")
            }
        });
        let lastShortcut = globalShortcut.register(lastKey, (() => {
            _this.last();
            if (!lastShortcut) {
                //console.log("注册按键失败")
            }
        }));
        let playPauseShortcut = globalShortcut.register(playPauseKey, () => {
            _this.play();
            if (!playPauseShortcut) {
                //console.log("注册按键失败")
            }
        });
        let volUpKeyShortcut = globalShortcut.register(volUpKey, () => {
            if (_player.volume <= 0.8) {
                _player.volume += 0.2;
            }
            //console.log("音量：" + player.volume)
            if (!volUpKeyShortcut) {
                //console.log("注册按键失败")
            }
        });
        let volDownKeyShortcut = globalShortcut.register(volDownKey, () => {
            if (_player.volume >= 0.2) {
                _player.volume -= 0.2;
            }
            //console.log("音量：" + player.volume)
            if (!volDownKeyShortcut) {
                //console.log("注册按键失败")
            }
        });
    }
    /**
     *  播放控制
     */
    // 播放
    play() {
        var player = this.player;
        // 获取播放器控件
        // 获取播放状态
        let status = this.player.getAttribute('status');
        // 获取播放按钮
        let playBtn = document.getElementById("playerPlay");
        // 如果是暂停
        if (status == 'pause') {
            player.play();
            this.player.setAttribute('status', 'play');
            // 暂停图标
            playBtn.setAttribute('src', '../pics/pause.png');
        }
        else if (status == 'stop') { // 如果是停止
            player.currentTime = 0;
            player.play();
            // 播放列表项目数量 争议 是否需要重新获取歌曲URL
            //let count = this.player.getAttribute("count")
            // 播放地址
            /*
            if ( count > 0) {
                http.get(`${netease.server}/song/url?id=${[0].id}&cookie=${netease.cookie}`, (res) => {
                    
                    
                    res.on('data', (str) => {
                        let musicUrl = JSON.parse(str).data[0].url
                        this.player.setAttribute('src', musicUrl)
                        player.play()
    
                        this.player.setAttribute('status', 'play')
                        this.player.setAttribute('now', [0].id)
                        // 暂停图标
                        playBtn.setAttribute('src', '../pics/play.png')
                    })
                })
            }*/
        }
        else {
            player.pause();
            this.player.setAttribute('status', 'pause');
            // 播放图标
            playBtn.setAttribute('src', '../pics/play.png');
        }
    }
    // 上一首
    last() {
        var player = this.player;
        // 获取播放器控件
        // 设置上次播放的歌曲ID和序号
        this.player.setAttribute("last", this.player.getAttribute('now'));
        this.player.setAttribute("lastIndex", this.player.getAttribute("index"));
        // 播放列表数量
        let count = this.mainplaylist.length;
        var index = Number(this.player.getAttribute('index'));
        if (index == 0) {
            this.player.setAttribute('index', String(count - 1));
        }
        else {
            this.player.setAttribute('index', String(index - 1));
        }
        // 获取歌曲播放地址
        http.get(`${netease.server}/song/url?id=${this.mainplaylist[this.player.getAttribute('index')].id}&cookie=${netease.cookie}`, (res) => {
            res.on('data', (str) => {
                let musicUrl = JSON.parse(str).data[0].url;
                this.player.setAttribute('src', musicUrl);
                player.play();
                this.player.setAttribute('status', 'play');
                this.player.setAttribute('now', this.mainplaylist[this.player.getAttribute('index')].id);
            });
        });
    }
    // 下一首
    next() {
        // 获取播放器控件
        var player = this.player;
        // 设置上次播放的歌曲ID和序号
        this.player.setAttribute("last", this.player.getAttribute('now'));
        this.player.setAttribute("lastIndex", this.player.getAttribute("index"));
        let mode = this.player.getAttribute("mode");
        if (mode == "fm" && this.player.getAttribute('index') == "0") {
            this.loadFM();
            return;
        }
        // 播放列表数量
        let count = Number(this.player.getAttribute("count"));
        let index = Number(this.player.getAttribute('index'));
        // 设置这次播放的歌曲ID和序号
        // 列表循环
        switch (this.playMode) {
            case "list-loop":
                {
                    if (index == count - 1) {
                        this.player.setAttribute('index', "0");
                    }
                    else {
                        this.player.setAttribute('index', String(index + 1));
                    }
                    break;
                }
            case "single-loop":
                {
                    this.player.setAttribute('index', this.player.getAttribute('index'));
                    break;
                }
            case "random":
                {
                    this.player.setAttribute('index', String(count * Math.random()));
                    break;
                }
            default:
                break;
        }
        http.get(`${netease.server}/song/url?id=${this.mainplaylist[this.player.getAttribute('index')].id}&cookie=${netease.cookie}`, (res) => {
            res.on('data', (str) => {
                // 更新封面
                let cover = this.mainplaylist[this.player.getAttribute('index')].cover;
                this.updateCover(cover);
                // 播放地址
                let musicUrl = JSON.parse(str).data[0].url;
                this.player.setAttribute('src', musicUrl);
                player.play();
                // 设置当前播放的音乐ID
                this.player.setAttribute('now', this.mainplaylist[this.player.getAttribute('index')].id);
                // 修改播放器播放状态为播放
                this.player.setAttribute('status', 'play');
            });
        });
    }
    getMusicDetailForLiClick(li) {
        // 获取播放器控件
        var player = this.player;
        http.get(`${netease.server}/song/url?id=${li.getAttribute('musicID')}&cookie=${netease.cookie}`, (res) => {
            res.on('data', (str) => {
                let data = JSON.parse(str).data;
                if (data == undefined) {
                    this.getMusicDetailForLiClick(li);
                    return;
                }
                let musicUrl = JSON.parse(str).data[0].url;
                this.player.setAttribute('src', musicUrl);
                player.play();
                this.player.setAttribute('status', 'play');
                this.player.setAttribute('now', li.getAttribute('musicID'));
            });
        });
    }
    initCover() {
        var cover = document.getElementById('cover');
        var player = this.player;
        cover.addEventListener("click", (e) => {
            e.stopPropagation();
            let page = this.player.getAttribute("currentPage");
            if (page == "music") {
                readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
                    let MainPage = document.getElementById("mainPage");
                    MainPage.innerHTML = data.toString();
                    //console.log("load sheet:" + this.player.getAttribute('sheet'))
                    this.getSheet(this.player.getAttribute('sheet'));
                    document.getElementById("player").setAttribute("currentPage", "home");
                    // 加载歌词
                    this.showLyric();
                    // 更新封面
                    this.updateCover(this.mainplaylist[this.player.getAttribute('index')].cover);
                    // 加载评论
                    this.loadComment(1);
                    /// 加载喜不喜欢按钮
                    this.loadLikeBtn();
                    this.loadCollectBtn();
                    //loadDislikeBtn()
                    // 加载开始评论按钮
                    this.loadAddcommentBtn();
                });
            }
            else {
                this.loadMusicPage();
            }
        });
    }
    // 获取我喜欢的音乐
    getFav() {
        let uid = netease.data.account.id;
        let sheetListBox = document.getElementById("sheetListBox");
        http.get(`${netease.server}/user/playlist?uid=${uid}`, (res) => {
            res.on('data', (str) => {
                if (res.statusCode == 200) {
                    //console.log("获取我最喜欢的音乐")
                    let sheetlist = JSON.parse(str).playlist;
                    // 清空内容
                    sheetListBox.innerHTML = "";
                    // 设置当前歌单为我喜欢的音乐
                    this.player.setAttribute("sheet", sheetlist[0].id);
                    // 设置当前播放的歌单名称
                    this.player.setAttribute('sheetName', sheetlist[0].name);
                    // 获取歌单歌曲列表
                    this.getSheet(sheetlist[0].id);
                }
            });
        });
    }
    // 获取心跳模式
    getHeart() {
        let mid = this.mainplaylist[this.player.getAttribute('index')].id;
        let sheetid = this.mainplaylist_id;
        let url = `${netease.server}/playmode/intelligence/list?id=${mid}&pid=${sheetid}&cookie=${netease.cookie}`;
        //console.log("get heart:"+url)
        http.get(url, (res) => {
            res.on('data', (str) => {
                if (res.statusCode == 200) {
                    //console.log("获取心跳模式歌单")
                    //console.log(str)
                    let sheetlist = JSON.parse(str).data;
                    // 清空内容
                    this.sheetListBox.innerHTML = "";
                    // 设置当前歌单为我喜欢的音乐
                    this.player.setAttribute("sheet", String(sheetid));
                    // 设置当前播放的歌单名称
                    this.player.setAttribute('sheetName', sheetlist[0].songInfo.name);
                    // 获取歌单歌曲列表
                    this.getSheet("heart", sheetlist);
                }
            });
        });
    }
    // 绑定实时当前歌单显示框
    attachPlaylist() {
        console.log("attachPlaylist");
        let sheetListBox = document.getElementById("sheetListBox");
        // 只有在不是私人FM模式下才执行
        if (this.player.getAttribute("mode") != "fm") {
            let playList = document.getElementById("playList");
            let playlistSheetName = document.getElementById("playlistSheetName");
            playlistSheetName.innerText = this.player.getAttribute("sheetName");
            playList.innerHTML = "";
            //console.log("attach:" + sheetListBox)
            for (let i = 0; i < sheetListBox.children.length; i++) {
                let c = sheetListBox.children.item(i).cloneNode(true);
                let title = c.getElementsByTagName("P")[0];
                title.innerText = title.innerText.split("-")[0];
                c.addEventListener('click', () => {
                    this.player.setAttribute("mode", "normal");
                    // 初始化主播放列表
                    this.initMainPlaylist(playList);
                    //attachPlaylist()
                    // 设置上次播放的歌曲ID
                    this.player.setAttribute("last", this.player.getAttribute('now'));
                    // 设置上次播放的序号
                    this.player.setAttribute("lastIndex", this.player.getAttribute("index"));
                    // 设置当前播放的index
                    this.player.setAttribute('index', c.getAttribute('index'));
                    // 获取歌曲播放Url
                    this.sourceMusicUrl(c);
                });
                playList.appendChild(c);
            }
        }
    }
    // 绑定列表中歌曲名称
    bindListItemName(list, ids) {
        let ids_s = ids.split(",");
        let ids_size = ids_s.length;
        let count = 0;
        let t_count = 0;
        let limit = 500;
        if (ids_size > limit) {
            //console.log("large sheet,split request.")
            let steps = ids_size / limit;
            //console.log("size:"+ids_size+"limit:"+limit+"steps:"+steps)
            //console.log("steps:"+steps)
            for (let i = 0; i <= steps; i++) {
                let step = i;
                let step_count = limit;
                //console.log('step_count:'+step_count)
                if (i == steps) {
                    step_count = ids_size - (limit * steps);
                }
                t_count += step_count;
                //console.log("t_count:"+t_count)
                let new_ids = "";
                //console.log("step_count"+step_count)
                for (let j = 0; j < step_count; j++) {
                    ////console.log(ids_s[j])
                    if (j == step_count - 1) {
                        new_ids = new_ids + ids_s[j] + "";
                    }
                    else {
                        new_ids = new_ids + ids_s[j] + ",";
                    }
                }
                http.get(`${netease.server}/song/detail?ids=${new_ids}`, (res) => {
                    res.on('data', (str) => {
                        //console.log(`${netease.server}/song/detail?ids=${new_ids}`)
                        ////console.log(str)
                        let songs = JSON.parse(str).songs;
                        if (songs == undefined) {
                            this.bindListItemName(list, ids);
                            return;
                        }
                        for (let i = 0; i < songs.length; i++) {
                            let item_index = step * limit + i;
                            // 为列表项目绑定歌曲名
                            list.children.item(item_index).setAttribute("name", songs[i].name);
                            //console.log('['+count+']get one: '+songs[i].name)
                            // 为列表项目绑定封面
                            list.children.item(item_index).setAttribute("cover", songs[i].al.picUrl);
                            // 为列表项目绑定专辑ID
                            list.children.item(item_index).setAttribute("albumId", songs[i].al.id);
                            // 为列表项目绑定专辑名称
                            list.children.item(item_index).setAttribute("albumName", songs[i].al.name);
                            // 为列表项目生成作者字符串
                            let authors = songs[i].ar;
                            let author = '';
                            for (let i = 0; i < authors.length; i++) {
                                if (i == authors.length - 1) {
                                    author += authors[i].name;
                                    continue;
                                }
                                author += authors[i].name + "/";
                            }
                            list.children.item(item_index).setAttribute('author', author);
                            // 列表项目左侧的歌曲封面
                            let coverLeft = document.createElement("IMG");
                            coverLeft.style.float = "left";
                            coverLeft.style.width = "35px";
                            coverLeft.style.height = "35px";
                            coverLeft.setAttribute("src", songs[i].al.picUrl);
                            // 列表项目的歌曲名称
                            let p = document.createElement("P");
                            p.innerText = songs[i].name + " - " + author;
                            list.children[item_index].appendChild(coverLeft);
                            list.children[item_index].appendChild(p);
                            count++;
                            if (count == ids_size - 1) {
                                // 初始化主播放列表（第一次肯定为空）
                                if (this.firstLoad) {
                                    this.initMainPlaylist(list);
                                }
                            }
                        }
                    });
                });
            }
        }
        else {
            http.get(`${netease.server}/song/detail?ids=${ids}`, (res) => {
                res.on('data', (str) => {
                    //console.log(`${netease.server}/song/detail?ids=${ids}`)
                    //console.log(str)
                    let songs = JSON.parse(str).songs;
                    if (songs == undefined) {
                        this.bindListItemName(list, ids);
                        return;
                    }
                    for (let i = 0; i < songs.length; i++) {
                        // 为列表项目绑定歌曲名
                        list.children.item("i").setAttribute("name", songs[i].name);
                        // 为列表项目绑定封面
                        list.children.item("i").setAttribute("cover", songs[i].al.picUrl);
                        // 为列表项目绑定专辑ID
                        list.children.item("i").setAttribute("albumId", songs[i].al.id);
                        // 为列表项目绑定专辑名称
                        list.children.item("i").setAttribute("albumName", songs[i].al.name);
                        // 为列表项目生成作者字符串
                        let authors = songs[i].ar;
                        let author = '';
                        for (let i = 0; i < authors.length; i++) {
                            if (i == authors.length - 1) {
                                author += authors[i].name;
                                continue;
                            }
                            author += authors[i].name + "/";
                        }
                        list.children.item("i").setAttribute('author', author);
                        // 列表项目左侧的歌曲封面
                        let coverLeft = document.createElement("IMG");
                        coverLeft.style.float = "left";
                        coverLeft.style.width = "35px";
                        coverLeft.style.height = "35px";
                        coverLeft.setAttribute("src", songs[i].al.picUrl);
                        // 列表项目的歌曲名称
                        let p = document.createElement("P");
                        p.innerText = songs[i].name + " - " + author;
                        list.children[i].appendChild(coverLeft);
                        list.children[i].appendChild(p);
                    }
                    // 初始化主播放列表（第一次肯定为空）
                    if (this.firstLoad) {
                        this.initMainPlaylist(list);
                    }
                });
            });
        }
    }
    // 生成IDS请求参数
    generateIdsList() {
        let sheetListBox = document.getElementById("sheetListBox");
        if (sheetListBox == undefined) {
            console.log("sheetlistbox is undefined");
        }
        let ids = '';
        ////console.log(sheetListBox)
        for (let i = 0; i < sheetListBox.children.length; i++) {
            if (i == sheetListBox.children.length - 1) {
                ids += sheetListBox.children[i].getAttribute('musicID');
            }
            else {
                ids += sheetListBox.children[i].getAttribute('musicID') + ',';
            }
        }
        return ids;
    }
    // 歌单项目点击后获取音乐Url
    sourceMusicUrl(li) {
        // 获取URL，添加cookie可以获取到无损
        this.netease.getMusicUrl(li.getAttribute('musicID'), function (musicUrl) {
            // 设置播放器的源地址
            this.player.setAttribute('src', musicUrl);
            // 开始播放
            // 如果是刚打开程序
            if (this.firstLoad) {
                this.player.setAttribute("index", 0);
                this.player.setAttribute("cover", this.mainplaylist[0].cover);
                this.player.setAttribute("now", this.mainplaylist[0].id);
                this.player.setAttribute("status", "pause");
                this.updateCover(this.player.getAttribute("cover"));
                //sourceMusicUrl(document.getElementById("sheetListBox").children.item(0))
                this.firstLoad = false;
                return;
            }
            //console.log("开始播放：" + musicUrl)
            this.player.play();
            // 设置当前状态为《播放》
            this.player.setAttribute('status', 'play');
            // 绑定当前的播放音乐的ID
            this.player.setAttribute('now', li.getAttribute('musicID'));
            // 绑定当前播放音乐的名称
            this.player.setAttribute("name", li.getAttribute('name'));
            // 绑定当前播放音乐的作者名称
            this.player.setAttribute("author", li.getAttribute('author'));
            /**
             * // 为列表项目绑定歌曲名
                    list.children.items("i").setAttribute("name", songs[i].name)
     
                    // 为列表项目绑定封面
                    list.children.items("i").setAttribute("cover", songs[i].al.picUrl)
     
                    // 为列表项目绑定专辑ID
                    list.children.items("i").setAttribute("albumId", songs[i].al.id)
     
                    // 为列表项目绑定专辑名称
                    list.children.items("i").setAttribute("albumName", songs[i].al.name)
             */
        });
    }
    // 更新封面方法
    updateCover(coverUrl) {
        //console.log("更新封面：" + coverUrl)
        // 获取左下角专辑图片框
        let cover = document.getElementById("cover");
        // 如果当前的页面是Music（音乐）页面，则同时刷新唱片的图片。
        if (document.getElementById("player").getAttribute("currentPage") == "music") {
            let diskCover = document.getElementById("diskCover");
            diskCover.setAttribute("src", coverUrl);
        }
        // 设置当前封面
        this.player.setAttribute("cover", coverUrl);
        // 设置左下角专辑图片框的源地址
        cover.setAttribute("src", coverUrl);
    }
    // 输入歌单ID，获取歌单内容
    getSheet(id, playlist) {
        if (id == "heart") {
            //mainplaylist_id = "heart"
            // 设置player的播放列表长度参数
            this.player.setAttribute("count", playlist.length);
            // 设置当前播放的歌单名称
            this.player.setAttribute('sheetName', "heart");
            // 绑定当前歌单创造者
            this.player.setAttribute("sheetCreator", "ai");
            // 绑定当前歌单播放数
            this.player.setAttribute("sheetPlayCount", "0");
            // 绑定当前歌单歌曲数
            this.player.setAttribute("sheetTrackCount", playlist.length);
            // 绑定当前歌单简介
            //this.player.setAttribute("sheetDescription", ((playlist.description == null) ? "单主很懒，没有写简介。" : playlist.description))
            // 绑定当前歌单封面
            //this.player.setAttribute("sheetCover", playlist.coverImgUrl)
            // 加载歌单详情框
            //loadSheetDetialBox(0)
            // 遍历所有的歌单ID以执行一些操作
            for (let i = 0; i < playlist.length; i++) {
                // 创建一条列表项，每个列表项目对应一首歌
                let li = document.createElement('LI');
                // 添加样式 背景色#303030
                li.classList.add("sheet-list-item");
                li.classList.add("light-dark");
                // 为列表项设置序号和对应音乐ID以方便点击时候直接调用获取到音乐Url
                li.setAttribute('index', "i");
                li.setAttribute('musicID', playlist[i].id);
                // 为列表项添加点击事件
                li.addEventListener('click', () => {
                    // 设置上次播放的歌曲ID
                    this.player.setAttribute("last", this.player.getAttribute('now'));
                    this.player.setAttribute("lastIndex", this.player.getAttribute("index"));
                    // 设置当前播放的index
                    this.player.setAttribute('index', li.getAttribute('index'));
                    // 设置当前播放的歌单名称
                    this.player.setAttribute('sheetName', "心动模式歌单");
                    // 为播放器绑定播放地址，并开始播放
                    this.sourceMusicUrl(li);
                    //initMainPlaylist()
                    this.attachPlaylist();
                    // 初始化主播放列表
                    this.initMainPlaylist(this.playList);
                });
                this.sheetListBox.appendChild(li);
            }
            // 这个时候列表项还没有获取到歌曲名和专辑图片，需要另外获取
            // `${netease.server}/song/detail?ids=${ids}
            // 为所有列表项生成综合请求参数ids，通过上面的
            // 址可以反馈到所有列表项目音乐详情的一个数组
            let ids = this.generateIdsList();
            // 为列表项绑定额外的数据
            /**
             * // 为列表项目绑定歌曲名
                    list.children.items("i").setAttribute("name", songs[i].name)
     
                    // 为列表项目绑定封面
                    list.children.items("i").setAttribute("cover", songs[i].al.picUrl)
     
                    // 为列表项目绑定专辑ID
                    list.children.items("i").setAttribute("albumId", songs[i].al.id)
     
                    // 为列表项目绑定专辑名称
                    list.children.items("i").setAttribute("albumName", songs[i].al.name)
             */
            this.bindListItemName(this.sheetListBox, ids);
            // 歌单界面形成☝
        }
        else {
            // 请求
            http.get(`${netease.server}/playlist/detail?id=${id}&cookie=${netease.cookie}`, (res) => {
                // 获取歌单列表控件
                let sheetListBox = document.getElementById("sheetListBox");
                res.on('data', (str) => {
                    console.log(str);
                    this.mainplaylist_id = id;
                    // 这里实际上获取到一个歌单的详情，不是歌单列表哦2333
                    let playlist = JSON.parse(str).playlist;
                    // playlist.trackIds 为当前歌单的所有歌曲ID的列表（只包含ID）
                    let trackIds = playlist.trackIds;
                    // 设置player的播放列表长度参数
                    this.player.setAttribute("count", trackIds.length);
                    // 设置当前播放的歌单名称
                    this.player.setAttribute('sheetName', playlist.name);
                    // 绑定当前歌单创造者
                    this.player.setAttribute("sheetCreator", playlist.creator.nickname);
                    // 绑定当前歌单播放数
                    this.player.setAttribute("sheetPlayCount", playlist.playCount);
                    // 绑定当前歌单歌曲数
                    this.player.setAttribute("sheetTrackCount", playlist.trackCount);
                    // 绑定当前歌单简介
                    this.player.setAttribute("sheetDescription", ((playlist.description == null) ? "单主很懒，没有写简介。" : playlist.description));
                    // 绑定当前歌单封面
                    this.player.setAttribute("sheetCover", playlist.coverImgUrl);
                    // 加载歌单详情框
                    this.loadSheetDetialBox();
                    // 遍历所有的歌单ID以执行一些操作
                    for (let i = 0; i < trackIds.length; i++) {
                        // 创建一条列表项，每个列表项目对应一首歌
                        let li = document.createElement('LI');
                        // 添加样式 背景色#303030
                        li.classList.add("sheet-list-item");
                        li.classList.add("light-dark");
                        // 为列表项设置序号和对应音乐ID以方便点击时候直接调用获取到音乐Url
                        li.setAttribute('index', "i");
                        li.setAttribute('musicID', trackIds[i].id);
                        // 为列表项添加点击事件
                        li.addEventListener('click', () => {
                            // 设置上次播放的歌曲ID
                            this.player.setAttribute("last", this.player.getAttribute('now'));
                            this.player.setAttribute("lastIndex", this.player.getAttribute("index"));
                            // 设置当前播放的index
                            this.player.setAttribute('index', li.getAttribute('index'));
                            // 设置当前播放的歌单名称
                            this.player.setAttribute('sheetName', playlist.name);
                            // 为播放器绑定播放地址，并开始播放
                            this.sourceMusicUrl(li);
                            //initMainPlaylist()
                            this.attachPlaylist();
                            // 初始化主播放列表
                            this.initMainPlaylist(this.playList);
                        });
                        sheetListBox.appendChild(li);
                    }
                    // 这个时候列表项还没有获取到歌曲名和专辑图片，需要另外获取
                    // `${netease.server}/song/detail?ids=${ids}
                    // 为所有列表项生成综合请求参数ids，通过上面的
                    // 址可以反馈到所有列表项目音乐详情的一个数组
                    let ids = this.generateIdsList();
                    // 为列表项绑定额外的数据
                    /**
                     * // 为列表项目绑定歌曲名
                            list.children.items("i").setAttribute("name", songs[i].name)
        
                            // 为列表项目绑定封面
                            list.children.items("i").setAttribute("cover", songs[i].al.picUrl)
        
                            // 为列表项目绑定专辑ID
                            list.children.items("i").setAttribute("albumId", songs[i].al.id)
        
                            // 为列表项目绑定专辑名称
                            list.children.items("i").setAttribute("albumName", songs[i].al.name)
                     */
                    this.bindListItemName(sheetListBox, ids);
                    // 歌单界面形成☝
                });
            });
        }
    }
    initMainPlaylist(list) {
        //let list = document.getElementById("sheetListBox")
        // 生成主播放列表（播放后切换到这个歌单）
        // 清空
        this.mainplaylist = [];
        // 加载
        for (let i = 0; i < list.children.length; i++) {
            let item = {
                "name": list.children[i].getAttribute('name'),
                "id": list.children[i].getAttribute('musicID'),
                "author": list.children[i].getAttribute('author'),
                "cover": list.children[i].getAttribute("cover"),
                "albumId": list.children[i].getAttribute("albumId"),
                "albumName": list.children[i].getAttribute("albumName")
            };
            this.mainplaylist.push(item);
        }
        if (this.firstLoad)
            this.sourceMusicUrl(document.getElementById("sheetListBox").children.item(0));
    }
    // 获取歌单列表并绑定到界面
    getSheets() {
        let id = netease.data.account.id;
        let sheet = {};
        // 根据用户ID请求用户歌单简略信息
        http.get(`${netease.server}/user/playlist?uid=${id}`, (res) => {
            res.on('data', (str) => {
                // 获取列表盒子
                let sheetListBox = document.getElementById("sheetListBox");
                // 解析JSON为对象
                let data = JSON.parse(str);
                // 请求失败
                if (data.code != 200) {
                    //console.log(str)
                    return;
                }
                // 歌单列表
                let sheetlist = data.playlist;
                // 重置列表盒子内容
                sheetListBox.innerHTML = "";
                // 遍历所有的歌单
                for (let i = 0; i < sheetlist.length; i++) {
                    // 创建一个列表项目，用于显示一个歌单项目
                    let li = document.createElement('LI');
                    // 设置项目的样式
                    li.classList.add("sheet-list-item");
                    // #303030
                    li.classList.add("light-dark");
                    // 设置列表项目对应的序号 争议
                    li.setAttribute('index', "i");
                    // 旁边的图标
                    let coverLeft = document.createElement("IMG");
                    coverLeft.style.float = "left";
                    coverLeft.style.width = "35px";
                    coverLeft.style.height = "35px";
                    coverLeft.setAttribute("src", sheetlist[i].coverImgUrl);
                    li.appendChild(coverLeft);
                    // 为每个歌单设置名字
                    let p = document.createElement("P");
                    p.innerText = sheetlist[i].name;
                    li.appendChild(p);
                    sheetListBox.appendChild(li);
                    // 歌单列表项目点击事件
                    li.addEventListener('click', (e) => {
                        // 再次清空列表盒子的内容，用歌单的歌曲列表取代歌单列表
                        sheetListBox.innerHTML = "";
                        // 请求单个歌单的详情
                        http.get(`${netease.server}/playlist/detail?id=${sheetlist[li.getAttribute('index')].id}`, (res) => {
                            res.on('data', (chunk) => {
                                str += chunk;
                            });
                            res.on('data', (str) => {
                                // 详细播放列表信息 对象
                                let playlist = JSON.parse(str).playlist;
                                // 歌单内所有歌曲ID的数组 争议
                                let trackIds = playlist.trackIds;
                                // 加载歌单详情框
                                this.loadSheetDetialBox();
                                // 获取歌单
                                this.getSheet(sheetlist[li.getAttribute('index')].id);
                                // 设置当前播放的歌单为点击的歌单
                                this.player.setAttribute("sheet", sheetlist[li.getAttribute('index')].id);
                            });
                        });
                    });
                }
                // 形成歌单列表界面☝
            });
        });
    }
    // 为歌单详情框填充内容
    loadSheetDetialBox() {
        // 为侧边栏添加歌单详情
        // 歌单详情介绍
        let sheetDetialBoxImg = document.getElementById("sheetDetialBoxImg");
        let sheetDetialContent = document.getElementsByClassName("sheet-detail-content")[0];
        let imgUrl = this.player.getAttribute("sheetCover");
        sheetDetialBoxImg.setAttribute("src", imgUrl);
        // 名称
        let nameBox = document.createElement("DIV");
        nameBox.innerText = "歌单名：" + this.player.getAttribute("sheetName");
        // 创造者
        let creatorBox = document.createElement("DIV");
        creatorBox.innerText = "创建者：" + this.player.getAttribute("sheetCreator");
        // 播放数
        let playNumBox = document.createElement("DIV");
        playNumBox.innerText = "播放数：" + this.player.getAttribute("sheetPlayCount");
        // 歌曲数
        let trackCountBox = document.createElement("DIV");
        trackCountBox.innerText = "歌曲数：" + this.player.getAttribute("sheetTrackCount");
        // 简介
        let descripBox = document.createElement("DIV");
        descripBox.innerText = "简介：" + this.player.getAttribute("sheetDescription");
        sheetDetialContent.innerHTML = "";
        sheetDetialContent.appendChild(nameBox);
        sheetDetialContent.appendChild(creatorBox);
        sheetDetialContent.appendChild(playNumBox);
        sheetDetialContent.appendChild(trackCountBox);
        sheetDetialContent.appendChild(descripBox);
    }
    // 加载每日推荐歌单
    loadDailyRecommandedSongs() {
        http.get(`${netease.server}/recommend/songs?cookie=${netease.cookie}`, (res) => {
            let sheetListBox = document.getElementById("sheetListBox");
            res.on('data', (str) => {
                if (res.statusCode != 200) {
                    this.loadMusicPage();
                    return;
                }
                // 创建推荐歌单数组
                let rcms = JSON.parse(str).recommend;
                // 清空dailySheet数组内容
                this.mainplaylist = [];
                // 遍历推荐歌曲
                for (let i = 0; i < rcms.length; i++) {
                    let authors = rcms[i].artists;
                    let author = '';
                    for (let i = 0; i < authors.length; i++) {
                        if (i == authors.length - 1) {
                            author += authors[i].name;
                            continue;
                        }
                        author += authors[i].name + "/";
                    }
                    //填充主播放列表
                    this.mainplaylist.push({ "id": rcms[i].id, "name": rcms[i].name, "cover": rcms[i].album.picUrl, "author": author });
                    // 创建列表项
                    let li = document.createElement('LI');
                    // 添加样式
                    li.classList.add("sheet-list-item");
                    li.classList.add("light-dark");
                    // 设置列表向的序号
                    li.setAttribute('index', "i");
                    li.setAttribute('musicID', rcms[i].id);
                    // 创建列表项左侧歌曲封面框
                    let coverLeft = document.createElement("IMG");
                    coverLeft.style.float = "left";
                    coverLeft.style.width = "35px";
                    coverLeft.style.height = "35px";
                    // 为封面框添加图片源 争议
                    // 用到了上面初始化好的dailySheet
                    // 设置封面
                    coverLeft.setAttribute("src", this.mainplaylist[i].cover);
                    // 封面框右侧的歌曲名称
                    let p = document.createElement("P");
                    p.innerText = rcms[i].name;
                    li.appendChild(coverLeft);
                    li.appendChild(p);
                    // 列表项的点击事件，初始化一些东西然后开始播放
                    li.addEventListener('click', () => {
                        // 播放器绑定上次播放的歌曲ID
                        this.player.setAttribute("last", this.player.getAttribute('now'));
                        this.player.setAttribute("lastIndex", this.player.getAttribute("index"));
                        // 播放器绑定当前播放的index
                        this.player.setAttribute('index', li.getAttribute('index'));
                        this.player.setAttribute("now", this.mainplaylist[li.getAttribute('index')].id);
                        // 播放器绑定当前播放音乐的封面
                        this.player.setAttribute("cover", this.mainplaylist[li.getAttribute('index')].cover);
                        // 获取播放地址
                        this.netease.getMusicUrl(this.player.getAttribute("now"), function (musicUrl) {
                            // 为播放器添加播放源
                            this.player.setAttribute('src', musicUrl);
                            this.firstLoad = false;
                            // 开始播放
                            this.player.play();
                            //document.getElementById("musicTitle").innerText = "正在播放："+[this.player.getAttribute("index")].name
                            this.player.setAttribute('status', 'play');
                        });
                    });
                    // 填充列表
                    sheetListBox.appendChild(li);
                }
                // 设置当前歌单的名字，会显示在实时歌单和歌单详情里
                this.player.setAttribute("sheetName", "每日推荐");
                // 刷新实时歌单
                this.attachPlaylist();
            });
        });
    }
    // 加载私人定制FM
    loadFM() {
        // 读取音乐界面代码
        readFile(path.join(__dirname, "../pages/music.html"), (err, data) => {
            // 右侧主容器初始化
            document.getElementById("mainPage").innerHTML = data.toString();
            // 设置当前页面为音乐详情
            document.getElementById("player").setAttribute("currentPage", "music");
            // 加载播放FM歌曲
            // 清空FM歌单列表
            this.mainplaylist = [];
            var netease = this.netease;
            netease.getFMList(function (fms) {
                // 填充主播放列表
                for (let i = 0; i < fms.length; i++) {
                    let authors = fms[i].artists;
                    let author = '';
                    for (let i = 0; i < authors.length; i++) {
                        if (i == authors.length - 1) {
                            author += authors[i].name;
                            continue;
                        }
                        author += authors[i].name + "/";
                    }
                    this.mainplaylist.push({ "id": fms[i].id, "name": fms[i].name, "cover": fms[i].album.picUrl, "author": author });
                }
                // 初始化绑定播放器当前播放序号、当前音乐ID、当前封面
                this.player.setAttribute("index", 0);
                this.player.setAttribute("now", fms[0].id);
                this.player.setAttribute("cover", fms[0].album.picUrl);
                // 获取播放地址
                netease.getMusicUrl(fms[0].id, function (musicUrl) {
                    this.firstLoad = false;
                    // 为播放器设置播放源地址
                    this.player.setAttribute('src', musicUrl);
                    // 播放器开始播放
                    this.player.play();
                    // 设置播放状态为播放
                    this.player.setAttribute('status', 'play');
                    // 加载歌词
                    this.showLyric();
                    // 更新封面
                    this.updateCover(this.mainplaylist[0].cover);
                    // 加载评论
                    this.loadComment(1);
                    /// 加载喜不喜欢按钮
                    this.loadLikeBtn();
                    //loadDislikeBtn()
                    this.loadCollectBtn();
                    // 加载开始评论按钮
                    this.loadAddcommentBtn();
                });
            }, this.loadMusicPage);
        });
    }
    // 加载评论
    loadComment(page) {
        ////console.log("show")
        if (page < 1) {
            page = 1;
        }
        let musicPanelBottom = document.getElementById("musicPanelBottom");
        //console.log("加载评论：" + `${netease.server}/comment/music?id=${this.player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`)
        http.get(`${netease.server}/comment/music?id=${this.player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`, (res) => {
            res.on('data', (str) => {
                let hot = JSON.parse(str).hotComments;
                let normal = JSON.parse(str).comments;
                ////console.log(str)
                musicPanelBottom.innerHTML = "";
                let hotcommentList = document.createElement("UL");
                hotcommentList.setAttribute("id", "hotcommentList");
                let normalcommentList = document.createElement("UL");
                normalcommentList.setAttribute("id", "normalcommentList");
                normalcommentList.setAttribute("count", JSON.parse(str).total);
                normalcommentList.setAttribute("page", "1");
                normalcommentList.setAttribute("pages", String(Math.round(JSON.parse(str).total / 3)));
                ////console.log(Math.round(JSON.parse(str).total / 3))
                for (let i = 0; i < hot.length; i++) {
                    let user = hot[i].user.nickname;
                    let content = hot[i].content;
                    let li = document.createElement("LI");
                    //li.classList.add("comment-line")
                    let contentDiv = document.createElement("DIV");
                    contentDiv.innerText = content;
                    contentDiv.classList.add("comment-line");
                    contentDiv.classList.add("light-dark");
                    let userP = document.createElement("DIV");
                    userP.classList.add("comment-label-mute");
                    userP.innerText = user;
                    contentDiv.appendChild(userP);
                    li.appendChild(contentDiv);
                    hotcommentList.appendChild(li);
                }
                normalcommentList.innerHTML = "";
                for (let i = 0; i < normal.length; i++) {
                    let user = normal[i].user.nickname;
                    let content = normal[i].content;
                    let li = document.createElement("LI");
                    //li.classList.add("comment-line")
                    let contentDiv = document.createElement("DIV");
                    contentDiv.innerText = content;
                    contentDiv.classList.add("comment-line");
                    contentDiv.classList.add("light-dark");
                    let userP = document.createElement("DIV");
                    userP.classList.add("comment-label-mute");
                    userP.innerText = user;
                    contentDiv.appendChild(userP);
                    li.appendChild(contentDiv);
                    normalcommentList.appendChild(li);
                }
                let hotcommentBtn = document.getElementById("hotcommentBtn");
                let normalcommentBtn = document.getElementById("normalcommentBtn");
                hotcommentBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    hotcommentList.style.display = "block";
                    normalcommentList.style.display = "none";
                    document.getElementById("commentPageUp").style.display = "none";
                    document.getElementById("commentPageDown").style.display = "none";
                });
                normalcommentBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    normalcommentList.style.display = "block";
                    hotcommentList.style.display = "none";
                    document.getElementById("commentPageUp").style.display = "block";
                    document.getElementById("commentPageDown").style.display = "block";
                    normalcommentList.setAttribute("page", "1");
                });
                let commentPageUpFunc = (e) => {
                    e.stopPropagation();
                    let page = Number(normalcommentList.getAttribute("page"));
                    if (page > 1) {
                        page = Number(page) - 1;
                        normalcommentList.setAttribute("page", String(page));
                        http.get(`${netease.server}/comment/music?id=${this.player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`, (res) => {
                            res.on('data', (chunk) => {
                                str += chunk;
                            });
                            res.on('data', (str) => {
                                let normal = JSON.parse(str).comments;
                                ////console.log(str)
                                if (normal != undefined) {
                                    normalcommentList.innerHTML = "";
                                    for (let i = 0; i < normal.length; i++) {
                                        let user = normal[i].user.nickname;
                                        let content = normal[i].content;
                                        let li = document.createElement("LI");
                                        //li.classList.add("comment-line")
                                        let contentDiv = document.createElement("DIV");
                                        contentDiv.innerText = content;
                                        contentDiv.classList.add("comment-line");
                                        contentDiv.classList.add("light-dark");
                                        let userP = document.createElement("DIV");
                                        userP.classList.add("comment-label-mute");
                                        userP.innerText = user;
                                        contentDiv.appendChild(userP);
                                        li.appendChild(contentDiv);
                                        normalcommentList.appendChild(li);
                                        normalcommentList.scrollTop = 0;
                                    }
                                }
                            });
                        });
                    }
                };
                let commentPageDownFunc = (e) => {
                    e.stopPropagation();
                    let page = Number(normalcommentList.getAttribute("page"));
                    ////console.log("still")
                    ////console.log("still+"+page)
                    ////console.log("stillpages:"+normalcommentList.getAttribute("pages"))
                    ////console.log("??"+(page < normalcommentList.getAttribute("pages")))
                    if (page < Number(normalcommentList.getAttribute("pages"))) {
                        page = Number(page) + 1;
                        normalcommentList.setAttribute("page", String(page));
                        ////console.log(normalcommentList.getAttribute("pages"))
                        ////console.log(normalcommentList.getAttribute("page"))
                        ////console.log(page)
                        http.get(`${netease.server}/comment/music?id=${this.player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`, (res) => {
                            res.on('data', (chunk) => {
                                str += chunk;
                            });
                            res.on('data', (str) => {
                                let normal = JSON.parse(str).comments;
                                ////console.log(str)
                                if (normal != undefined) {
                                    normalcommentList.innerHTML = "";
                                    for (let i = 0; i < normal.length; i++) {
                                        let user = normal[i].user.nickname;
                                        let content = normal[i].content;
                                        let li = document.createElement("LI");
                                        //li.classList.add("comment-line")
                                        let contentDiv = document.createElement("DIV");
                                        contentDiv.innerText = content;
                                        contentDiv.classList.add("comment-line");
                                        contentDiv.classList.add("light-dark");
                                        let userP = document.createElement("DIV");
                                        userP.classList.add("comment-label-mute");
                                        userP.innerText = user;
                                        contentDiv.appendChild(userP);
                                        li.appendChild(contentDiv);
                                        normalcommentList.appendChild(li);
                                        normalcommentList.scrollTop = 0;
                                    }
                                }
                            });
                        });
                    }
                };
                let commentPageUp = document.getElementById("commentPageUp");
                let commentPageDown = document.getElementById("commentPageDown");
                commentPageUp.style.display = "none";
                commentPageDown.style.display = "none";
                commentPageUp.addEventListener("click", commentPageUpFunc);
                commentPageDown.addEventListener("click", commentPageDownFunc);
                musicPanelBottom.appendChild(hotcommentList);
                musicPanelBottom.appendChild(normalcommentList);
            });
        });
    }
    loadLikeBtn() {
        // 喜欢按钮
        let likeBtn = document.getElementById("likeBtn");
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            http.get(`${netease.server}/like?id=${this.player.getAttribute("now")}&cookie=${netease.cookie}`, (res) => {
                res.on('data', (str) => {
                    //console.log(str)
                    if (JSON.parse(str).code == 200) {
                        new Notification("通知", {
                            body: "喜欢歌曲成功"
                        });
                    }
                    else {
                        new Notification("通知", {
                            body: "喜欢歌曲失败"
                        });
                        //console.log(str)
                    }
                });
            });
        });
    }
    // 加载收藏按钮
    loadCollectBtn() {
        // 收藏按钮
        let collectBtn = document.getElementById("collectBtn");
        collectBtn.addEventListener("click", (e) => {
            let mid = this.player.getAttribute("now");
            http.get(`${netease.server}/user/playlist?uid=${netease.data.account.id}`, (res) => {
                res.on('data', (str) => {
                    let sheetlist = JSON.parse(str).playlist;
                    //console.log("[url]"+`${netease.server}/user/playlist?uid=${this.data.account.id}`+"sheetlist:"+str)
                    let req = new XMLHttpRequest();
                    let collectDialog = dialog.newCollectDialog("collect_dialog", sheetlist, mid, netease.cookie);
                });
            });
        });
    }
    loadDislikeBtn() {
        // 不喜欢按钮
        let dislikeBtn = document.getElementById("dislikeBtn");
        dislikeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            http.get(`${netease.server}/like?id=${this.player.getAttribute("now")}&like=false&cookie=${netease.cookie}`, (res) => {
                res.on('data', (str) => {
                    if (JSON.parse(str).code == 200) {
                        //console.log(str)
                        new Notification("通知", {
                            body: "取消喜欢歌曲成功，可能需要一点点时间系统才会更新。"
                        });
                    }
                    else {
                        new Notification("通知", {
                            body: "取消喜欢歌曲失败"
                        });
                    }
                });
            });
        });
    }
    loadAddcommentBtn() {
        let startcommentBtn = document.getElementById("startcommentBtn");
        startcommentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // 输入窗口
            let addcommentBox = document.createElement("DIV");
            addcommentBox.setAttribute("id", "addcommentBox");
            addcommentBox.className = "addcommentBox";
            // 输入框
            let commentTextBox = document.createElement("INPUT");
            commentTextBox.setAttribute("type", "text");
            commentTextBox.setAttribute('id', "commentTextBox");
            commentTextBox.setAttribute("placeholder", "输入评论");
            addcommentBox.appendChild(commentTextBox);
            // 提交按钮
            let addcommentBtn = document.createElement("button");
            addcommentBtn.setAttribute("id", "addcommentBtn");
            addcommentBtn.innerText = "提交";
            addcommentBox.appendChild(addcommentBtn);
            addcommentBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                http.get(`${netease.server}/comment?type=0&t=1&id=${this.player.getAttribute("now")}&content=${commentTextBox.value}&cookie=${netease.cookie}`, (res) => {
                    res.on('data', (str) => {
                        if (JSON.parse(str).code == 200) {
                            new Notification("通知", {
                                body: "评论发送成功"
                            });
                            addcommentBox.remove();
                            this.loadComment(1);
                        }
                        else {
                            //console.log(str)
                        }
                    });
                });
            });
            document.getElementsByTagName("body")[0].appendChild(addcommentBox);
            commentTextBox.focus();
        });
    }
    loadMusicPage() {
        // FM模式设置
        if (this.player.getAttribute("mode") == 'fm') {
            this.loadFM();
        }
        if (this.player.getAttribute("mode") == 'normal') {
            readFile(path.join(__dirname, "../pages/music.html"), (err, data) => {
                document.getElementById("mainPage").innerHTML = data.toString();
                // 设置当前页面为音乐详情
                document.getElementById("player").setAttribute("currentPage", "music");
                ////console.log(this.player.getAttribute('index'))
                ////console.log(this.player.getAttribute('index').cover)
                let diskCover = document.getElementById("diskCover");
                diskCover.setAttribute("src", this.mainplaylist[this.player.getAttribute('index')].cover);
                //加载歌词
                this.showLyric();
                // 加载喜不喜欢按钮
                this.loadLikeBtn();
                //loadDislikeBtn()
                this.loadCollectBtn();
                // 加载开始评论按钮
                this.loadAddcommentBtn();
                // 评论
                this.loadComment(1);
            });
        }
    }
    // 显示歌词
    showLyric() {
        let lyricBox = document.getElementById("lyric");
        this.getLryic(this.player.getAttribute('now'), lyricBox);
    }
    getLryic(id, lyricBox) {
        http.get(`${netease.server}/lyric?id=${id}`, (res) => {
            res.on('data', (str) => {
                this.currentLyric = [];
                let pattn = /\[[0-9]+[\u003a][0-9]+[\u002e][0-9]+\]/g;
                if (JSON.parse(str).lrc != undefined) {
                    let lyric = JSON.parse(str).lrc.lyric;
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
                        this.currentLyric[i] = { "time": time, "content": content };
                    }
                    ////console.log(JSON.stringify(this.currentLyric))
                    // 加载歌词页面
                    readFile(path.join(__dirname, "../pages/lyric.html"), (err, data) => {
                        let lyricBox = document.getElementById("lyric");
                        lyricBox.innerHTML = data.toString();
                        let lyricLines = document.getElementById("lyric-lines");
                        for (let i = 0; i < this.currentLyric.length; i++) {
                            ////console.log("123")
                            let l = document.createElement("LI");
                            //l.classList.add("menu-item")
                            l.setAttribute('time', this.currentLyric[i].time);
                            l.id = 'lyric-' + this.currentLyric[i].time;
                            l.innerText = this.currentLyric[i].content;
                            lyricLines.appendChild(l);
                            l.addEventListener("dblclick", (() => {
                                this.player.currentTime = Number(l.getAttribute("time"));
                            }).bind(this));
                        }
                        this.lyricInterval = setInterval(() => {
                            ////console.log(lyricBox.scrollTop)
                            let ct = document.getElementById("player").getAttribute("time");
                            let currentLine = document.getElementById("lyric-" + ct);
                            if (currentLine != undefined) {
                                for (let i = 0; i < lyricLines.children.length; i++) {
                                    let lyricLine = lyricLines.children.item(i);
                                    lyricLine.style.color = "ivory";
                                }
                                currentLine.style.color = "coral";
                                ////console.log(currentLine.offsetTop)
                                // 保持歌词内容显示
                                lyricBox.scrollTop = currentLine.offsetTop - 132;
                            }
                        }, 200);
                    });
                }
                else {
                    readFile(path.join(__dirname, "../pages/lyric.html"), (err, data) => {
                        let lyricBox = document.getElementById("lyric");
                        lyricBox.innerHTML = data.toString();
                        let lyricLines = document.getElementById("lyric-lines");
                        let l = document.createElement("LI");
                        l.innerText = "纯音乐，敬请聆听。";
                        lyricLines.appendChild(l);
                    });
                }
                ////console.log(JSON.stringify(this.currentLyric))
                //lyric = lyric.replace(pattn, '')
            });
        });
    }
}
exports.Player = Player;
//# sourceMappingURL=nel.js.map