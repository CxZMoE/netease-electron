"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = exports.USR_CONFIG_DIR = exports.netease = void 0;
const remote = require("@electron/remote");
const fs = remote.require('fs');
const { readFile } = remote.require('fs');
const path = remote.require('path');
const http = remote.require('http');
const log_1 = require("./log"); // 调试用
const netease_1 = require("./netease");
const dialog_1 = require("./dialog");
const data_1 = require("./data");
var player;
var _this;
// 全局常量
exports.USR_CONFIG_DIR = remote.app.getPath("home") + "/.moe.cxz.netease-electron";
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
        exports.netease = new netease_1.default(this.player);
        this.netease = exports.netease;
        this.currentOffset = 0;
        _this = this;
    }
    InitDom() {
        console.log('init dom');
        var player = _this.player;
        // 播放器播放模式设置为默认模式
        player.setAttribute("mode", "normal");
        // [全局定时器] 用于实时监控播放状态
        setInterval(() => {
            this.sheetListBox = document.getElementById("sheetListBox"); // 歌单列表
            let playList = document.getElementById("playList"); // 播放列表
            // 突出显示当前播放歌曲, 更新背景色
            if (_this.player.getAttribute("mode") != "fm") {
                // 如果歌单列表存在，更新项目的背景色
                if (this.sheetListBox) {
                    if (this.sheetListBox.children.length > 0) {
                        let sheetListBoxItemSelected = this.sheetListBox.children.item(Number(_this.player.getAttribute("index")));
                        for (let i = 0; i < this.sheetListBox.children.length; i++) {
                            let sheetListBoxItem = this.sheetListBox.children.item(i);
                            // [其它] 背景
                            sheetListBoxItem.style.backgroundColor = "#303030";
                            // [选中项]
                            sheetListBoxItemSelected.style.backgroundColor = "#1e1e1e";
                        }
                        // 如果播放列表存在，更新项目的背景色
                        if (playList && playList.children.length > 0) {
                            let sheetListBoxItemSelected = this.sheetListBox.children.item(Number(_this.player.getAttribute("index")));
                            for (let i = 0; i < playList.children.length; i++) {
                                let sheetListBoxItem = this.sheetListBox.children.item(i);
                                sheetListBoxItem.style.backgroundColor = "#303030";
                                sheetListBoxItemSelected.style.backgroundColor = "#1e1e1e";
                            }
                        }
                    }
                }
            }
            // 更新播放按钮状态
            let status = _this.player.getAttribute("status");
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
                    let playIndex = Number(_this.player.getAttribute("index"));
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
            remote.BrowserWindow.getFocusedWindow().hide();
            remote.getGlobal("windowHided").is = true;
        });
        // 事先加载搜索页面
        readFile(path.join(__dirname, "../pages/search.html"), (err, data) => {
            let body = document.getElementsByTagName("body")[0];
            // 创建搜索框结点
            let searchBox = document.createElement("DIV");
            // <div id="searchBox" class="search-box">
            searchBox.setAttribute("id", "searchBox");
            searchBox.className = "search-box";
            searchBox.innerHTML = data.toString();
            _this.sheetListBox = document.getElementById("sheetListBox");
            body.appendChild(searchBox);
            // 搜索事件
            let searchKeywords = document.getElementById("searchKeywords");
            searchKeywords.addEventListener("input", (e) => {
                //if (e.keyCode != 13) {
                //    ////console.log(e.keyCode)
                //    return
                //}
                let target = e.target;
                fetch(`${exports.netease.server}/search?keywords=${target.value}`).then((res) => {
                    return res.json();
                }).then((data) => {
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
                            fetch(`${exports.netease.server}/song/detail?ids=${li.getAttribute("musicID")}`).then(res => res.json()).then(data => {
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
                                fetch(`${exports.netease.server}/song/url?id=${li.getAttribute('musicID')}&cookie=${exports.netease.cookie}`).then(res => res.json()).then((data) => {
                                    if (data == undefined) {
                                        this.getMusicDetailForLiClick(li);
                                        return;
                                    }
                                    let musicUrl = data.data[0].url;
                                    let searchItem = [{ "name": li.innerText, "id": li.getAttribute('musicID'), "cover": li.getAttribute('cover'), "author": author }];
                                    searchItem.push.apply(searchItem, _this.mainplaylist);
                                    _this.mainplaylist = searchItem;
                                    searchItem = null;
                                    player.setAttribute('index', "0");
                                    player.setAttribute('src', musicUrl);
                                    player.play();
                                    _this.updateCover(li.getAttribute("cover"));
                                    player.setAttribute('status', 'play');
                                    player.setAttribute('now', li.getAttribute('musicID'));
                                    // 隐藏搜索框
                                    searchBox.style.height = "0px";
                                    searchBox.style.visibility = "hidden";
                                });
                            });
                        });
                    }
                });
            });
        });
        // 事先加载主页
        readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
            console.log(data);
            document.getElementById("mainPage").innerHTML = data.toString();
            player.setAttribute("currentPage", "home");
            _this.sheetListBox = document.getElementById("sheetListBox");
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
            var netease = _this.netease;
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
        // 登陆状态判定
        fs.readFile(`${exports.USR_CONFIG_DIR}/login.json`, { encoding: "utf8" }, (err, data) => {
            if (err) {
                //console.error(err)
                exports.netease.loginStatus = false;
                new Notification("通知", { body: "您还未登录，请先登录。" });
                _this.netease.data = {};
                dialog.newLoginDialog("loginDialog", function () {
                    let username = document.getElementById("username");
                    let password = document.getElementById("password");
                    exports.netease.login(username.value, password.value);
                });
                return;
            }
            else {
                exports.netease.data = JSON.parse(data);
                if (exports.netease.data.code == 502) {
                    fs.unlink(`${exports.USR_CONFIG_DIR}/login.json`, (err) => {
                        new Notification("登录失败", {
                            body: "账号或密码错误"
                        });
                        dialog.newLoginDialog("loginDialog", function () {
                            let username = document.getElementById("username");
                            let password = document.getElementById("password");
                            exports.netease.login(username.value, password.value);
                        });
                        return;
                    });
                    return;
                }
                exports.netease.cookie = exports.netease.data.cookie;
                document.getElementById("loginLabel").innerText = exports.netease.data.profile.nickname;
                fetch(`${exports.netease.server}/login/status?cookie=${exports.netease.cookie}`).then(res => res.json()).then(data => {
                    if (data.msg == "需要登录") {
                        exports.netease.loginStatus = false;
                        new Notification("通知", { body: "登录过期，请重新登录" });
                        exports.netease.data = {};
                        dialog.newLoginDialog("loginDialog", function () {
                            let username = document.getElementById("username");
                            let password = document.getElementById("password");
                            exports.netease.login(username.value, password.value);
                        });
                    }
                    else {
                        // 登录正常
                        // 先获取我喜欢的音乐
                        document.getElementById("login").setAttribute("src", exports.netease.data.profile.avatarUrl);
                        if (data.code != 502) {
                            // 有效登录
                            exports.netease.loginStatus = true;
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
            }
        });
    }
    // 初始化播放进度条
    initProgrss() {
        // 为播放条添加拖拽效果
        var progressPin = document.getElementById("progressPin");
        var progress = document.getElementById("progress");
        var player = _this.player;
        var ctlabel = document.getElementById("currentTimeLabel");
        // 处理拖动
        progressPin.addEventListener('mousedown', (e) => {
            progressPin.setAttribute("l_x", e.x.toString());
            this.isMoveProgress = true;
        });
        progressPin.addEventListener('mouseup', (e) => {
            let l_x = Number(progressPin.getAttribute("l_x"));
            let toTime = ((l_x - progress.getBoundingClientRect().x) / progress.getBoundingClientRect().width) * Number(_this.player.getAttribute("length"));
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
                let toTime = ((l_x - progress.getBoundingClientRect().x) / progress.getBoundingClientRect().width) * Number(_this.player.getAttribute("length"));
                ctlabel.innerText = Number(toTime / 60).toFixed(0) + ":" + (Number(toTime % 60).toFixed(toTime % 60));
                // 移动
                progressPin.style.left = rect.x + (e.x - l_x) + 'px';
                // 设置上一次坐标
                progressPin.setAttribute("l_x", e.x.toString());
            }
        });
    }
    // 初始化侧边栏事件
    initSidebar() {
        // 歌单按钮点击
        var sheetBtn = document.getElementById("sheetBtn");
        sheetBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
                document.getElementById("mainPage").innerHTML = data.toString();
                _this.sheetListBox = document.getElementById("sheetListBox");
                player.setAttribute("currentPage", "home");
                player.setAttribute("mode", "normal");
                _this.getSheets();
            });
        });
        // 我喜欢的音乐按钮点击
        var favBtn = document.getElementById("favBtn");
        favBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
                document.getElementById("mainPage").innerHTML = data.toString();
                _this.sheetListBox = document.getElementById("sheetListBox");
                player.setAttribute("currentPage", "home");
                player.setAttribute("mode", "normal");
                _this.getFav();
            });
        });
        // 私人FM点击
        var fmBtn = document.getElementById("fmBtn");
        fmBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            player.setAttribute("mode", "fm");
            _this.loadMusicPage();
        });
        // 心跳点击
        var heartBtn = document.getElementById("heart");
        heartBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            // getFav()
            _this.getHeart();
        });
        // 每日推荐被点击
        var dailyRecommendBtn = document.getElementById("dailyRecommendBtn");
        dailyRecommendBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            player.setAttribute("mode", "normal");
            readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
                document.getElementById("mainPage").innerHTML = data.toString();
                _this.sheetListBox = document.getElementById("sheetListBox");
                _this.loadDailyRecommandedSongs();
                player.setAttribute("currentPage", "home");
                player.setAttribute("mode", "normal");
            });
        });
    }
    // 初始化播放器
    initPlayer() {
        // 获取播放器控件
        var player = _this.player;
        // 设置初始播放序号
        player.setAttribute('index', "0");
        // 初始状态为停止
        player.setAttribute('status', 'stop');
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
            if (!_this.isMoveProgress) {
                // 当前播放时间（秒） 标签
                var ctlabel = document.getElementById("currentTimeLabel");
                // 歌曲长度（秒） 标签
                var lengthLabel = document.getElementById("lengthLabel");
                let musicLength = Number(_this.player.getAttribute('length'));
                // 更新当前时间
                ctlabel.innerText = Number(player.currentTime / 60).toFixed(0) + ":" + (Number(player.currentTime % 60).toFixed(0));
                // 更新总时长
                lengthLabel.innerText = Number(musicLength / 60).toFixed(0) + ":" + (Number(musicLength % 60).toFixed(0));
                // 标记歌曲进度
                let progress = player.currentTime / player.duration;
                // progress为播放进度百分比小数形式
                player.setAttribute('progress', progress.toString());
                // 当前时间（秒）
                player.setAttribute('time', Number(player.currentTime).toFixed(0).toString());
                // 获取进度条滑块
                var progressPin = document.getElementById("progressPin");
                // 获取进度条
                var progressBar = document.getElementById("progress");
                // 计算进度条位置偏移
                let offset = progressBar.clientWidth * progress;
                // 移动进度条
                progressPin.style.left = x + offset + 'px';
            }
        }));
        // 加载完毕后设置长度参数
        player.addEventListener('canplay', () => {
            player.setAttribute('length', player.duration.toString());
            // 更新封面
            // console.log(_this.mainplaylist)
            let cover = _this.mainplaylist[_this.player.getAttribute('index')].cover;
            _this.updateCover(cover);
            document.getElementById("musicTitle").innerText = "正在播放：" + _this.mainplaylist[_this.player.getAttribute('index')].name; //+ " - " + mainplaylist[_this.player.getAttribute('index')].author
            // 显示歌词
            clearInterval(this.lyricInterval);
            if (_this.player.getAttribute("currentPage") == 'music') {
                _this.showLyric();
                _this.loadComment(1);
            }
        });
        // 错误处理
        player.addEventListener('error', (e) => {
            new Notification("无法播放", {
                body: "无法播放，可能是没有版权或者权限。"
            });
            //console.log("无法播放，可能是没有版权或者权限。")
            //console.log(_this.player)
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
        this.bindGlobalShortcut();
    }
    /**
     *  绑定全局按键
     */
    bindGlobalShortcut() {
        // 绑定全局案件
        let globalShortcut = remote.globalShortcut;
        let nextKey = 'CommandOrControl+Alt+Right';
        let lastKey = 'CommandOrControl+Alt+Left';
        let playPauseKey = `CommandOrControl+Alt+P`;
        let volUpKey = `CommandOrControl+Alt+Up`;
        let volDownKey = `CommandOrControl+Alt+Down`;
        var _this = this;
        var _player = _this.player;
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
        var player = _this.player;
        // 获取播放器控件
        // 获取播放状态
        let status = _this.player.getAttribute('status');
        // 获取播放按钮
        let playBtn = document.getElementById("playerPlay");
        // 如果是暂停
        if (status == 'pause') {
            player.play();
            player.setAttribute('status', 'play');
            // 暂停图标
            playBtn.setAttribute('src', '../pics/pause.png');
        }
        else if (status == 'stop') { // 如果是停止
            player.currentTime = 0;
            player.play();
            // 播放列表项目数量 争议 是否需要重新获取歌曲URL
            //let count = _this.player.getAttribute("count")
            // 播放地址
            /*
            if ( count > 0) {
                http.get(`${netease.server}/song/url?id=${[0].id}&cookie=${netease.cookie}`, (res) => {
                    
                    
                    res.on('data', (str) => {
                        let musicUrl = JSON.parse(str).data[0].url
                        player.setAttribute('src', musicUrl)
                        player.play()
    
                        player.setAttribute('status', 'play')
                        player.setAttribute('now', [0].id)
                        // 暂停图标
                        playBtn.setAttribute('src', '../pics/play.png')
                    })
                })
            }*/
        }
        else {
            player.pause();
            player.setAttribute('status', 'pause');
            // 播放图标
            playBtn.setAttribute('src', '../pics/play.png');
        }
    }
    // 上一首
    last() {
        var player = _this.player;
        // 获取播放器控件
        // 设置上次播放的歌曲ID和序号
        player.setAttribute("last", _this.player.getAttribute('now'));
        player.setAttribute("lastIndex", _this.player.getAttribute("index"));
        // 播放列表数量
        let count = _this.mainplaylist.length;
        var index = Number(_this.player.getAttribute('index'));
        if (index == 0) {
            player.setAttribute('index', String(count - 1));
        }
        else {
            player.setAttribute('index', String(index - 1));
        }
        // 获取歌曲播放地址
        fetch(`${exports.netease.server}/song/url?id=${_this.mainplaylist[_this.player.getAttribute('index')].id}&cookie=${exports.netease.cookie}`).then(res => res.json()).then(data => {
            let musicUrl = data.data[0].url;
            player.setAttribute('src', musicUrl);
            player.play();
            player.setAttribute('status', 'play');
            player.setAttribute('now', _this.mainplaylist[_this.player.getAttribute('index')].id);
        });
    }
    // 下一首
    next() {
        // 获取播放器控件
        var player = _this.player;
        // 设置上次播放的歌曲ID和序号
        player.setAttribute("last", _this.player.getAttribute('now'));
        player.setAttribute("lastIndex", _this.player.getAttribute("index"));
        let mode = _this.player.getAttribute("mode");
        if (mode == "fm" && _this.player.getAttribute('index') == "0") {
            this.loadFM();
            return;
        }
        // 播放列表数量
        let count = Number(_this.player.getAttribute("count"));
        let index = Number(_this.player.getAttribute('index'));
        // 设置这次播放的歌曲ID和序号
        // 列表循环
        switch (this.playMode) {
            case "list-loop":
                {
                    if (index == count - 1) {
                        player.setAttribute('index', "0");
                    }
                    else {
                        player.setAttribute('index', String(index + 1));
                    }
                    break;
                }
            case "single-loop":
                {
                    player.setAttribute('index', _this.player.getAttribute('index'));
                    break;
                }
            case "random":
                {
                    player.setAttribute('index', String(count * Math.random()));
                    break;
                }
            default:
                break;
        }
        fetch(`${exports.netease.server}/song/url?id=${_this.mainplaylist[_this.player.getAttribute('index')].id}&cookie=${exports.netease.cookie}`).then(res => res.json()).then(data => {
            let cover = _this.mainplaylist[_this.player.getAttribute('index')].cover;
            _this.updateCover(cover);
            // 播放地址
            let musicUrl = data.data[0].url;
            player.setAttribute('src', musicUrl);
            player.play();
            // 设置当前播放的音乐ID
            player.setAttribute('now', _this.mainplaylist[_this.player.getAttribute('index')].id);
            // 修改播放器播放状态为播放
            player.setAttribute('status', 'play');
        });
    }
    getMusicDetailForLiClick(li) {
        // 获取播放器控件
        var player = _this.player;
        fetch(`${exports.netease.server}/song/url?id=${li.getAttribute('musicID')}&cookie=${exports.netease.cookie}`).then(res => res.json()).then((data) => {
            if (data == undefined) {
                this.getMusicDetailForLiClick(li);
                return;
            }
            let musicUrl = data.data[0].url;
            player.setAttribute('src', musicUrl);
            player.play();
            player.setAttribute('status', 'play');
            player.setAttribute('now', li.getAttribute('musicID'));
        });
    }
    initCover() {
        var cover = document.getElementById('cover');
        var player = _this.player;
        cover.addEventListener("click", (e) => {
            e.stopPropagation();
            let page = _this.player.getAttribute("currentPage");
            if (page == "music") {
                readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
                    let MainPage = document.getElementById("mainPage");
                    MainPage.innerHTML = data.toString();
                    _this.sheetListBox = document.getElementById("sheetListBox");
                    //console.log("load sheet:" + _this.player.getAttribute('sheet'))
                    _this.getSheet(_this.player.getAttribute('sheet'));
                    player.setAttribute("currentPage", "home");
                    // 加载歌词
                    // _this.showLyric()
                    // 更新封面
                    // _this.updateCover(_this.mainplaylist[_this.player.getAttribute('index')].cover)
                    // 加载评论
                    // _this.loadComment(1)
                    // /// 加载喜不喜欢按钮
                    // _this.loadLikeBtn()
                    // _this.loadCollectBtn()
                    //loadDislikeBtn()
                    // 加载开始评论按钮
                    // _this.loadAddcommentBtn()
                });
            }
            else {
                this.loadMusicPage();
                console.log("not music");
                // _this.loadAddcommentBtn()
            }
        });
    }
    // 获取我喜欢的音乐
    getFav() {
        let uid = exports.netease.data.account.id;
        fetch(`${exports.netease.server}/user/playlist?uid=${uid}`).then(res => res.json()).then(data => {
            let sheetlist = data.playlist;
            // 清空内容
            _this.sheetListBox.innerHTML = "";
            // 设置当前歌单为我喜欢的音乐
            player.setAttribute("sheet", sheetlist[0].id);
            // 设置当前播放的歌单名称
            player.setAttribute('sheetName', sheetlist[0].name);
            // 获取歌单歌曲列表
            _this.getSheet(sheetlist[0].id);
        });
    }
    // 获取心跳模式
    getHeart() {
        let mid = _this.mainplaylist[_this.player.getAttribute('index')].id;
        let sheetid = _this.mainplaylist_id;
        let url = `${exports.netease.server}/playmode/intelligence/list?id=${mid}&pid=${sheetid}&cookie=${exports.netease.cookie}`;
        //console.log("get heart:"+url)
        fetch(url).then(res => res.json()).then(data => {
            //console.log("获取心跳模式歌单")
            //console.log(str)
            let heartSheet = data.data;
            // 清空内容
            _this.sheetListBox.innerHTML = "";
            // 设置当前歌单为我喜欢的音乐
            player.setAttribute("sheet", String(sheetid));
            // 设置当前播放的歌单名称
            player.setAttribute('sheetName', heartSheet[0].songInfo.name);
            console.log(heartSheet);
            _this.mainplaylist = heartSheet;
            // 获取歌单歌曲列表
            _this.getSheet("heart");
        });
    }
    // 绑定实时当前歌单显示框
    attachPlaylist() {
        console.log("attachPlaylist");
        // 只有在不是私人FM模式下才执行
        if (_this.player.getAttribute("mode") != "fm") {
            let playList = document.getElementById("playList");
            let playlistSheetName = document.getElementById("playlistSheetName");
            playlistSheetName.innerText = _this.player.getAttribute("sheetName");
            playList.innerHTML = "";
            //console.log("attach:" + sheetListBox)
            for (let i = 0; i < _this.sheetListBox.children.length; i++) {
                let c = _this.sheetListBox.children.item(i).cloneNode(true);
                let title = c.getElementsByTagName("P")[0];
                title.innerText = title.innerText.split("-")[0];
                c.addEventListener('click', () => {
                    player.setAttribute("mode", "normal");
                    // 初始化主播放列表
                    _this.initMainPlaylist();
                    //attachPlaylist()
                    // 设置上次播放的歌曲ID
                    player.setAttribute("last", _this.player.getAttribute('now'));
                    // 设置上次播放的序号
                    player.setAttribute("lastIndex", _this.player.getAttribute("index"));
                    // 设置当前播放的index
                    player.setAttribute('index', c.getAttribute('index'));
                    // 获取歌曲播放Url
                    _this.sourceMusicUrl(c);
                });
                playList.appendChild(c);
            }
        }
    }
    // 绑定列表中歌曲名称
    bindListItemName(offset, limit) {
        console.log(this.currentSheet);
        fetch(`${exports.netease.server}/playlist/track/all?id=${this.currentSheet.sheetId}&limit=${limit}&offset=${offset}`).then(res => res.json()).then(data => {
            //console.log(`${netease.server}/song/detail?ids=${new_ids}`)
            ////console.log(str)
            let songs = data.songs;
            // 遍历所有的歌单ID以执行一些操作
            console.log(songs);
            for (let i = offset * limit; i < offset * limit + limit; i++) {
                //console.log("添加歌单项目元素")
                // 创建一条列表项，每个列表项目对应一首歌
                let li = document.createElement('LI');
                // 添加样式 背景色#303030
                li.classList.add("sheet-list-item");
                li.classList.add("light-dark");
                // 为列表项设置序号和对应音乐ID以方便点击时候直接调用获取到音乐Url
                li.setAttribute('index', String(i));
                li.setAttribute('musicID', this.currentSheet.trackIds[i].id);
                // 为列表项添加点击事件
                li.addEventListener('click', () => {
                    // 设置上次播放的歌曲ID
                    player.setAttribute("last", _this.player.getAttribute('now'));
                    player.setAttribute("lastIndex", _this.player.getAttribute("index"));
                    // 设置当前播放的index
                    player.setAttribute('index', li.getAttribute('index'));
                    // 设置当前播放的歌单名称
                    player.setAttribute('sheetName', this.currentSheet.name);
                    // 为播放器绑定播放地址，并开始播放
                    _this.sourceMusicUrl(li);
                    //initMainPlaylist()
                    _this.attachPlaylist();
                    // 初始化主播放列表
                    _this.initMainPlaylist();
                });
                // 为列表项目绑定歌曲名
                li.setAttribute("name", songs[i].name);
                //console.log('['+count+']get one: '+songs[i].name)
                // 为列表项目绑定封面
                li.setAttribute("cover", songs[i].al.picUrl);
                // 为列表项目绑定专辑ID
                li.setAttribute("albumId", songs[i].al.id);
                // 为列表项目绑定专辑名称
                li.setAttribute("albumName", songs[i].al.name);
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
                li.setAttribute('author', author);
                // 列表项目左侧的歌曲封面
                let coverLeft = document.createElement("IMG");
                coverLeft.style.float = "left";
                coverLeft.style.width = "35px";
                coverLeft.style.height = "35px";
                coverLeft.setAttribute("src", songs[i].al.picUrl);
                // 列表项目的歌曲名称
                let p = document.createElement("P");
                p.innerText = songs[i].name + " - " + author;
                li.appendChild(coverLeft);
                li.appendChild(p);
                // 初始化主播放列表（第一次肯定为空）
                if (this.firstLoad) {
                    _this.initMainPlaylist();
                }
                _this.sheetListBox.appendChild(li);
            }
        });
    }
    // 生成IDS请求参数
    generateIdsList() {
        if (_this.sheetListBox == undefined) {
            console.log("sheetlistbox is undefined");
        }
        let ids = '';
        ////console.log(sheetListBox)
        for (let i = 0; i < _this.sheetListBox.children.length; i++) {
            if (i == _this.sheetListBox.children.length - 1) {
                ids += _this.sheetListBox.children[i].getAttribute('musicID');
            }
            else {
                ids += _this.sheetListBox.children[i].getAttribute('musicID') + ',';
            }
        }
        return ids;
    }
    // 歌单项目点击后获取音乐Url
    sourceMusicUrl(li) {
        // 获取URL，添加cookie可以获取到无损
        exports.netease.getMusicUrl(li.getAttribute('musicID'), function (musicUrl) {
            // 设置播放器的源地址
            player.setAttribute('src', musicUrl);
            // 开始播放
            // 如果是刚打开程序
            if (_this.firstLoad) {
                player.setAttribute("index", "0");
                player.setAttribute("cover", _this.mainplaylist[0].cover);
                player.setAttribute("now", _this.mainplaylist[0].id);
                player.setAttribute("status", "pause");
                _this.updateCover(_this.player.getAttribute("cover"));
                //sourceMusicUrl(document.getElementById("sheetListBox").children.item(0))
                _this.firstLoad = false;
                return;
            }
            //console.log("开始播放：" + musicUrl)
            _this.player.play();
            // 设置当前状态为《播放》
            player.setAttribute('status', 'play');
            // 绑定当前的播放音乐的ID
            player.setAttribute('now', li.getAttribute('musicID'));
            // 绑定当前播放音乐的名称
            player.setAttribute("name", li.getAttribute('name'));
            player.title = li.getAttribute('name');
            // 绑定当前播放音乐的作者名称
            player.setAttribute("author", li.getAttribute('author'));
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
        if (player.getAttribute("currentPage") == "music") {
            let diskCover = document.getElementById("diskCover");
            diskCover.setAttribute("src", coverUrl);
        }
        // 设置当前封面
        player.setAttribute("cover", coverUrl);
        // 设置左下角专辑图片框的源地址
        cover.setAttribute("src", coverUrl);
    }
    // 输入歌单ID，获取歌单内容
    getSheet(id) {
        // 心动模式
        if (id == "heart") {
            //mainplaylist_id = "heart"
            // 设置player的播放列表长度参数
            // player.setAttribute("count", playlist.length)
            // 设置当前播放的歌单名称
            player.setAttribute('sheetName', "heart");
            // 绑定当前歌单创造者
            player.setAttribute("sheetCreator", "ai");
            // 绑定当前歌单播放数
            player.setAttribute("sheetPlayCount", "0");
            // 绑定当前歌单歌曲数
            let count = parseInt(player.getAttribute("sheetTrackCount"));
            // 绑定当前歌单简介
            //player.setAttribute("sheetDescription", ((playlist.description == null) ? "单主很懒，没有写简介。" : playlist.description))
            // 绑定当前歌单封面
            //player.setAttribute("sheetCover", playlist.coverImgUrl)
            // 加载歌单详情框
            //loadSheetDetialBox(0)
            // 遍历所有的歌单ID以执行一些操作
            for (let i = 0; i < 10; i++) {
                // 创建一条列表项，每个列表项目对应一首歌
                let li = document.createElement('LI');
                // 添加样式 背景色#303030
                li.classList.add("sheet-list-item");
                li.classList.add("light-dark");
                // 为列表项设置序号和对应音乐ID以方便点击时候直接调用获取到音乐Url
                li.setAttribute('index', String(i));
                //console.log(_this.mainplaylist)
                li.setAttribute('musicID', _this.mainplaylist[i].id);
                // 为列表项添加点击事件
                li.addEventListener('click', () => {
                    // 设置上次播放的歌曲ID
                    player.setAttribute("last", _this.player.getAttribute('now'));
                    player.setAttribute("lastIndex", _this.player.getAttribute("index"));
                    // 设置当前播放的index
                    player.setAttribute('index', li.getAttribute('index'));
                    // 设置当前播放的歌单名称
                    player.setAttribute('sheetName', "心动模式歌单");
                    // 为播放器绑定播放地址，并开始播放
                    _this.sourceMusicUrl(li);
                    //initMainPlaylist()
                    _this.attachPlaylist();
                    // 初始化主播放列表
                    _this.initMainPlaylist();
                });
                _this.sheetListBox.appendChild(li);
            }
            console.log("歌单长度：", _this.mainplaylist.length);
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
            _this.bindListItemName(_this.currentOffset, 20);
            // 歌单界面形成☝
        }
        else {
            let sheet = new data_1.SheetDetial(id);
            sheet.Update().then((data) => {
                // 请求
                // 这里实际上获取到一个歌单的详情，不是歌单列表哦2333
                this.currentSheet = data;
                console.log(sheet);
                _this.mainplaylist_id = id;
                // playlist.trackIds 为当前歌单的所有歌曲ID的列表（只包含ID）
                // 设置player的播放列表长度参数
                player.setAttribute("count", String(data.songCount));
                // 设置当前播放的歌单名称
                player.setAttribute('sheetName', data.name);
                // 绑定当前歌单创造者
                player.setAttribute("sheetCreator", data.creator);
                // 绑定当前歌单播放数
                player.setAttribute("sheetPlayCount", String(data.playCount));
                // 绑定当前歌单歌曲数
                player.setAttribute("sheetTrackCount", String(data.songCount));
                // 绑定当前歌单简介
                player.setAttribute("sheetDescription", ((data.description == null) ? "单主很懒，没有写简介。" : data.description));
                // 绑定当前歌单封面
                player.setAttribute("sheetCover", data.coverUrl);
                // 加载歌单详情框
                this.loadSheetDetialBox();
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
                _this.bindListItemName(_this.currentOffset, 20);
                // 歌单界面形成☝
                _this.sheetListBox = document.getElementById("sheetListBox");
                _this.sheetListBox.onscroll = function (ev) {
                    console.log("offsetHeight", _this.sheetListBox.offsetHeight);
                    console.log("scrollHeight", _this.sheetListBox.scrollHeight);
                    console.log("scrollTop", _this.sheetListBox.scrollTop);
                    console.log("offsetTop", _this.sheetListBox.offsetTop);
                    console.log("clientHeight", _this.sheetListBox.clientHeight);
                    console.log("offsetHeight", document.body.offsetHeight);
                    if (_this.sheetListBox.scrollHeight == _this.sheetListBox.scrollTop + _this.sheetListBox.clientHeight) {
                        console.log("touch");
                        _this.currentOffset += 1;
                        _this.bindListItemName(_this.currentOffset, 20);
                    }
                };
            });
        }
    }
    initMainPlaylist() {
        let list = _this.sheetListBox;
        // 生成主播放列表（播放后切换到这个歌单）
        // 清空
        _this.mainplaylist = [];
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
            _this.mainplaylist.push(item);
        }
        if (_this.firstLoad) {
            let li = list.children.item(0);
            _this.sourceMusicUrl(li);
        }
    }
    // 获取歌单列表并绑定到界面
    getSheets() {
        let id = exports.netease.data.account.id;
        // 根据用户ID请求用户歌单简略信息
        fetch(`${exports.netease.server}/user/playlist?uid=${id}`).then(res => res.json()).then(data => {
            // 获取列表盒子
            // 解析JSON为对象
            // 请求失败
            if (data.code != 200) {
                console.log('not 200');
                return;
            }
            console.log(data);
            // 歌单列表
            let sheetlist = data.playlist;
            // 重置列表盒子内容
            _this.sheetListBox.innerHTML = "";
            // 遍历所有的歌单
            for (let i = 0; i < sheetlist.length; i++) {
                // 创建一个列表项目，用于显示一个歌单项目
                let li = document.createElement('LI');
                // 设置项目的样式
                li.classList.add("sheet-list-item");
                // #303030
                li.classList.add("light-dark");
                // 设置列表项目对应的序号 争议
                li.setAttribute('index', String(i));
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
                // 歌单列表项目点击事件
                li.addEventListener('click', (e) => {
                    // 再次清空列表盒子的内容，用歌单的歌曲列表取代歌单列表
                    _this.sheetListBox.innerHTML = "";
                    // 请求单个歌单的详情
                    let sheet = new data_1.SheetDetial(sheetlist[li.getAttribute('index')].id);
                    sheet.Update().then(sheet => {
                        // 详细播放列表信息 对象
                        // 歌单内所有歌曲ID的数组 争议
                        let trackIds = sheet.trackIds;
                        // 加载歌单详情框
                        this.loadSheetDetialBox();
                        // 获取歌单
                        _this.getSheet(sheet.sheetId);
                        // 设置当前播放的歌单为点击的歌单
                        player.setAttribute("sheet", sheet.sheetId);
                    });
                });
                _this.sheetListBox.appendChild(li);
            }
            // 形成歌单列表界面☝
        });
    }
    // 为歌单详情框填充内容
    loadSheetDetialBox() {
        // 为侧边栏添加歌单详情
        // 歌单详情介绍
        let sheetDetialBoxImg = document.getElementById("sheetDetialBoxImg");
        let sheetDetialContent = document.getElementsByClassName("sheet-detail-content")[0];
        let imgUrl = _this.player.getAttribute("sheetCover");
        sheetDetialBoxImg.setAttribute("src", imgUrl);
        // 名称
        let nameBox = document.createElement("DIV");
        nameBox.innerText = "歌单名：" + _this.player.getAttribute("sheetName");
        // 创造者
        let creatorBox = document.createElement("DIV");
        creatorBox.innerText = "创建者：" + _this.player.getAttribute("sheetCreator");
        // 播放数
        let playNumBox = document.createElement("DIV");
        playNumBox.innerText = "播放数：" + _this.player.getAttribute("sheetPlayCount");
        // 歌曲数
        let trackCountBox = document.createElement("DIV");
        trackCountBox.innerText = "歌曲数：" + _this.player.getAttribute("sheetTrackCount");
        // 简介
        let descripBox = document.createElement("DIV");
        descripBox.innerText = "简介：" + _this.player.getAttribute("sheetDescription");
        sheetDetialContent.innerHTML = "";
        sheetDetialContent.appendChild(nameBox);
        sheetDetialContent.appendChild(creatorBox);
        sheetDetialContent.appendChild(playNumBox);
        sheetDetialContent.appendChild(trackCountBox);
        sheetDetialContent.appendChild(descripBox);
    }
    // 加载每日推荐歌单
    loadDailyRecommandedSongs() {
        fetch(`${exports.netease.server}/recommend/songs?cookie=${exports.netease.cookie}`).then((res => res.json())).then(data => {
            // 创建推荐歌单数组
            let rcms = data.data.dailySongs;
            console.log(rcms);
            // 清空dailySheet数组内容
            _this.mainplaylist = [];
            // 遍历推荐歌曲
            for (let i = 0; i < rcms.length; i++) {
                let authors = rcms[i].ar;
                let author = '';
                for (let i = 0; i < authors.length; i++) {
                    if (i == authors.length - 1) {
                        author += authors[i].name;
                        continue;
                    }
                    author += authors[i].name + "/";
                }
                //填充主播放列表
                _this.mainplaylist.push({ "id": rcms[i].id, "name": rcms[i].name, "cover": rcms[i].al.picUrl, "author": author });
                // 创建列表项
                let li = document.createElement('LI');
                // 添加样式
                li.classList.add("sheet-list-item");
                li.classList.add("light-dark");
                // 设置列表向的序号
                li.setAttribute('index', String(i));
                li.setAttribute('musicID', rcms[i].id);
                // 创建列表项左侧歌曲封面框
                let coverLeft = document.createElement("IMG");
                coverLeft.style.float = "left";
                coverLeft.style.width = "35px";
                coverLeft.style.height = "35px";
                // 为封面框添加图片源 争议
                // 用到了上面初始化好的dailySheet
                // 设置封面
                coverLeft.setAttribute("src", _this.mainplaylist[i].cover);
                // 封面框右侧的歌曲名称
                let p = document.createElement("P");
                p.innerText = rcms[i].name;
                li.appendChild(coverLeft);
                li.appendChild(p);
                // 列表项的点击事件，初始化一些东西然后开始播放
                li.addEventListener('click', () => {
                    // 播放器绑定上次播放的歌曲ID
                    player.setAttribute("last", _this.player.getAttribute('now'));
                    player.setAttribute("lastIndex", _this.player.getAttribute("index"));
                    // 播放器绑定当前播放的index
                    player.setAttribute('index', li.getAttribute('index'));
                    player.setAttribute("now", _this.mainplaylist[li.getAttribute('index')].id);
                    // 播放器绑定当前播放音乐的封面
                    player.setAttribute("cover", _this.mainplaylist[li.getAttribute('index')].cover);
                    // 获取播放地址
                    _this.netease.getMusicUrl(_this.player.getAttribute("now"), function (musicUrl) {
                        // 为播放器添加播放源
                        player.setAttribute('src', musicUrl);
                        _this.firstLoad = false;
                        // 开始播放
                        _this.player.play();
                        //document.getElementById("musicTitle").innerText = "正在播放："+[_this.player.getAttribute("index")].name
                        player.setAttribute('status', 'play');
                    });
                });
                // 填充列表
                _this.sheetListBox.appendChild(li);
            }
            // 设置当前歌单的名字，会显示在实时歌单和歌单详情里
            player.setAttribute("sheetName", "每日推荐");
            // 刷新实时歌单
            _this.attachPlaylist();
        });
    }
    // 加载私人定制FM
    loadFM() {
        // 读取音乐界面代码
        readFile(path.join(__dirname, "../pages/music.html"), (err, data) => {
            // 右侧主容器初始化
            document.getElementById("mainPage").innerHTML = data.toString();
            _this.sheetListBox = document.getElementById("sheetListBox");
            // 设置当前页面为音乐详情
            player.setAttribute("currentPage", "music");
            // 加载播放FM歌曲
            // 清空FM歌单列表
            _this.mainplaylist = [];
            var netease = _this.netease;
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
                    _this.mainplaylist.push({ "id": fms[i].id, "name": fms[i].name, "cover": fms[i].album.picUrl, "author": author });
                }
                // 初始化绑定播放器当前播放序号、当前音乐ID、当前封面
                player.setAttribute("index", "0");
                player.setAttribute("now", fms[0].id);
                player.setAttribute("cover", fms[0].album.picUrl);
                // 获取播放地址
                netease.getMusicUrl(fms[0].id, function (musicUrl) {
                    _this.firstLoad = false;
                    // 为播放器设置播放源地址
                    player.setAttribute('src', musicUrl);
                    // 播放器开始播放
                    _this.player.play();
                    // 设置播放状态为播放
                    player.setAttribute('status', 'play');
                    // 加载歌词
                    _this.showLyric();
                    // 更新封面
                    _this.updateCover(_this.mainplaylist[0].cover);
                    // 加载评论
                    _this.loadComment(1);
                    /// 加载喜不喜欢按钮
                    _this.loadLikeBtn();
                    //loadDislikeBtn()
                    _this.loadCollectBtn();
                    // 加载开始评论按钮
                    _this.loadAddcommentBtn();
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
        //console.log("加载评论：" + `${netease.server}/comment/music?id=${_this.player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`)
        fetch(`${exports.netease.server}/comment/music?id=${_this.player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`).then(res => res.json()).then(data => {
            let hot = data.hotComments;
            let normal = data.comments;
            ////console.log(str)
            musicPanelBottom.innerHTML = "";
            let hotcommentList = document.createElement("UL");
            hotcommentList.setAttribute("id", "hotcommentList");
            let normalcommentList = document.createElement("UL");
            normalcommentList.setAttribute("id", "normalcommentList");
            normalcommentList.setAttribute("count", data.total);
            normalcommentList.setAttribute("page", "1");
            normalcommentList.setAttribute("pages", String(Math.round(data.total / 3)));
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
                    fetch(`${exports.netease.server}/comment/music?id=${_this.player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`).then(res => res.json()).then(data => {
                        let normal = data.comments;
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
                    fetch(`${exports.netease.server}/comment/music?id=${_this.player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`).then(res => res.json()).then(data => {
                        let normal = data.comments;
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
    }
    loadLikeBtn() {
        // 喜欢按钮
        let likeBtn = document.getElementById("likeBtn");
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fetch(`${exports.netease.server}/like?id=${_this.player.getAttribute("now")}&cookie=${exports.netease.cookie}`).then(res => res.json()).then(data => {
                //console.log(str)
                if (data.code == 200) {
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
    }
    // 加载收藏按钮
    loadCollectBtn() {
        // 收藏按钮
        let collectBtn = document.getElementById("collectBtn");
        collectBtn.addEventListener("click", (e) => {
            let mid = _this.player.getAttribute("now");
            fetch(`${exports.netease.server}/user/playlist?uid=${exports.netease.data.account.id}`).then(res => res.json()).then(data => {
                let sheetlist = data.playlist;
                //console.log("[url]"+`${netease.server}/user/playlist?uid=${this.data.account.id}`+"sheetlist:"+str)
                let req = new XMLHttpRequest();
                let collectDialog = dialog.newCollectDialog("collect_dialog", sheetlist, mid, exports.netease.cookie);
            });
        });
    }
    loadDislikeBtn() {
        // 不喜欢按钮
        let dislikeBtn = document.getElementById("dislikeBtn");
        dislikeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fetch(`${exports.netease.server}/like?id=${_this.player.getAttribute("now")}&like=false&cookie=${exports.netease.cookie}`).then(res => res.json()).then(data => {
                if (data.code == 200) {
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
                var url = `${exports.netease.server}/comment?type=0&t=1&id=${_this.player.getAttribute("now")}&content=${commentTextBox.value}&cookie=${exports.netease.cookie}`;
                fetch(url).then(res => res.json()).then(data => {
                    if (data.code == 200) {
                        new Notification("通知", {
                            body: "评论发送成功"
                        });
                        addcommentBox.remove();
                        _this.loadComment(1);
                    }
                    else {
                        //console.log(str)
                    }
                });
            });
            document.getElementsByTagName("body")[0].appendChild(addcommentBox);
            commentTextBox.focus();
        });
    }
    loadMusicPage() {
        console.log("load music page", _this.player.getAttribute("mode"));
        // FM模式设置
        if (_this.player.getAttribute("mode") == 'fm') {
            this.loadFM();
        }
        if (_this.player.getAttribute("mode") == 'normal') {
            readFile(path.join(__dirname, "../pages/music.html"), (err, data) => {
                document.getElementById("mainPage").innerHTML = data.toString();
                _this.sheetListBox = document.getElementById("sheetListBox");
                // 设置当前页面为音乐详情
                player.setAttribute("currentPage", "music");
                ////console.log(_this.player.getAttribute('index'))
                ////console.log(_this.player.getAttribute('index').cover)
                let diskCover = document.getElementById("diskCover");
                diskCover.setAttribute("src", _this.mainplaylist[_this.player.getAttribute('index')].cover);
                //加载歌词
                _this.showLyric();
                // 加载喜不喜欢按钮
                _this.loadLikeBtn();
                //loadDislikeBtn()
                _this.loadCollectBtn();
                // 加载开始评论按钮
                _this.loadAddcommentBtn();
                // 评论
                _this.loadComment(1);
            });
        }
    }
    // 显示歌词
    showLyric() {
        this.currentSheet.GetLyric(_this.player.getAttribute('now')).then((lyricCuts) => {
            readFile(path.join(__dirname, "../pages/lyric.html"), (err, data) => {
                let lyricBox = document.getElementById("lyric");
                lyricBox.innerHTML = data.toString();
                // 根据歌词的长度判断歌曲是轻音乐还是正常歌曲
                if (lyricCuts.length > 0) {
                    _this.sheetListBox = document.getElementById("sheetListBox");
                    let lyricLines = document.getElementById("lyric-lines");
                    for (let i = 0; i < lyricCuts.length; i++) {
                        ////console.log("123")
                        let l = document.createElement("LI");
                        //l.classList.add("menu-item")
                        l.setAttribute('time', lyricCuts[i].time);
                        l.id = 'lyric-' + lyricCuts[i].time;
                        l.innerText = lyricCuts[i].content;
                        lyricLines.appendChild(l);
                        l.addEventListener("dblclick", (() => {
                            _this.player.currentTime = Number(l.getAttribute("time"));
                        }).bind(this));
                    }
                    this.lyricInterval = setInterval(() => {
                        ////console.log(lyricBox.scrollTop)
                        let ct = player.getAttribute("time");
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
                }
                else {
                    _this.sheetListBox = document.getElementById("sheetListBox");
                    let lyricLines = document.getElementById("lyric-lines");
                    let l = document.createElement("LI");
                    l.innerText = "纯音乐，敬请聆听。";
                    lyricLines.appendChild(l);
                }
            });
        });
    }
}
exports.Player = Player;
//# sourceMappingURL=nel.js.map