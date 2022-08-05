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
exports.Player = exports.USR_CONFIG_DIR = exports.netease = void 0;
var remote = require("@electron/remote");
var fs = remote.require('fs');
var readFile = remote.require('fs').readFile;
var path = remote.require('path');
var http = remote.require('http');
var log_1 = require("./log"); // 调试用
var netease_1 = require("./netease");
var dialog_1 = require("./dialog");
var data_1 = require("./data");
var DPlayment_1 = require("./DPlayment");
var player;
var _this;
var PData;
// 全局常量
exports.USR_CONFIG_DIR = remote.app.getPath('home') + '/.moe.cxz.netease-electron';
var dialog = new dialog_1.default();
// 用户目录
function CheckConfigDir() {
    var exists = fs.existsSync(exports.USR_CONFIG_DIR);
    if (!exists) {
        log_1.default.LogE('用户配置文件未找到');
        fs.mkdir(exports.USR_CONFIG_DIR, { mode: '0755', recursive: true }, function () {
            log_1.default.LogI('创建用户配置文件目录');
        });
    }
}
var SONG_PLAYBACK_MODE;
(function (SONG_PLAYBACK_MODE) {
    SONG_PLAYBACK_MODE[SONG_PLAYBACK_MODE["MODE_LOOP"] = 0] = "MODE_LOOP";
    SONG_PLAYBACK_MODE[SONG_PLAYBACK_MODE["MODE_SEQ"] = 1] = "MODE_SEQ";
    SONG_PLAYBACK_MODE[SONG_PLAYBACK_MODE["MODE_SIG"] = 2] = "MODE_SIG";
    SONG_PLAYBACK_MODE[SONG_PLAYBACK_MODE["MODE_RAMDOM"] = 3] = "MODE_RAMDOM"; // 随机模式
})(SONG_PLAYBACK_MODE || (SONG_PLAYBACK_MODE = {}));
;
var Player = /** @class */ (function () {
    function Player() {
        // 状态变量
        this.playMode = SONG_PLAYBACK_MODE.MODE_LOOP;
        this.isProgressMoving = false;
        this.player = document.getElementById('player');
        player = this.player;
        PData = new DPlayment_1.PlayerElementAttribute(player);
        this.firstLoad = true;
        // 检查用户目录
        CheckConfigDir();
        // 初始化网易服务
        exports.netease = new netease_1.default(this.player);
        this.netease = exports.netease;
        this.currentOffset = 0;
        _this = this;
    }
    Player.prototype.InitDom = function () {
        var _this_1 = this;
        log_1.default.LogI('初始化DOM');
        var player = _this.player;
        // 播放器播放模式设置为默认模式
        PData.mode = DPlayment_1.PlayMode.Normal;
        this.playList = document.getElementById('playList');
        this.sheetListBox = document.getElementById('sheetListBox'); // 歌单列表           // 播放列表
        // [全局定时器] 用于实时监控播放状态
        setInterval(function () {
            if (!_this_1.playList) {
                try {
                    _this_1.playList = document.getElementById('playList');
                }
                catch (_) {
                    return;
                }
            }
            // 突出显示当前播放歌曲, 更新背景色
            if (PData.mode != DPlayment_1.PlayMode.FM) {
                // 如果歌单列表存在，更新项目的背景色
                if (_this_1.sheetListBox) {
                    if (_this_1.sheetListBox.children.length > 0) {
                        var sheetListBoxItemSelected = _this_1.sheetListBox.children.item(PData.pIndex);
                        for (var i = 0; i < _this_1.sheetListBox.children.length; i++) {
                            var sheetListBoxItem = _this_1.sheetListBox.children.item(i);
                            // [其它] 背景
                            sheetListBoxItem.style.backgroundColor = '#303030';
                            // [选中项]
                            sheetListBoxItemSelected.style.backgroundColor = '#1e1e1e';
                        }
                        // 如果播放列表存在，更新项目的背景色
                        if (_this_1.playList && _this_1.playList.children.length > 0) {
                            var playListItemSelected = _this_1.playList.children.item(PData.pIndex);
                            for (var i = 0; i < _this_1.playList.children.length; i++) {
                                var sheetListBoxItem = _this_1.playList.children.item(i);
                                sheetListBoxItem.style.backgroundColor = '#303030';
                                playListItemSelected.style.backgroundColor = '#1e1e1e';
                            }
                        }
                    }
                }
            }
            // 更新播放按钮状态
            var status = PData.status;
            var playBtn = document.getElementById('playerPlay');
            if (status == DPlayment_1.PlayStatus.Pause) {
                playBtn.setAttribute('src', '../pics/play.png');
                var diskCover = document.getElementById('diskCover');
                if (diskCover) {
                    diskCover.className = "";
                }
            }
            else if (status == DPlayment_1.PlayStatus.Stop) { // 如果是停止
                var diskCover = document.getElementById('diskCover');
                if (diskCover) {
                    diskCover.className = "";
                }
                playBtn.setAttribute('src', '../pics/play.png');
            }
            else {
                var diskCover = document.getElementById('diskCover');
                if (diskCover) {
                    diskCover.className = "rotating";
                }
                playBtn.setAttribute('src', '../pics/pause.png');
            }
        }, 500);
        // 播放列表开关
        {
            var playlistBtn = document.getElementById('playlistBtn');
            _this.playlistBox = document.getElementById('playlistBox');
            var playList_1 = document.getElementById('playList');
            // 控制播放列表元素的高度
            playlistBtn.addEventListener('click', function (e) {
                if (_this.playlistBox.style.height == '300px')
                    _this.playlistBox.style.height = '0px';
                else {
                    var playIndex = Number(PData.pIndex);
                    _this.playlistBox.style.height = '300px';
                    _this.playlistBox.scrollTop = playList_1.children.item(playIndex).offsetTop - 155;
                }
            });
        }
        // 播放模式按钮事件
        {
            var playmodeBtn_1 = document.getElementById('playmodeBtn');
            playmodeBtn_1.addEventListener('click', function () {
                switch (_this_1.playMode) {
                    case SONG_PLAYBACK_MODE.MODE_LOOP:
                        _this_1.playMode = SONG_PLAYBACK_MODE.MODE_SIG;
                        playmodeBtn_1.setAttribute('src', '../pics/single-loop.png');
                        break;
                    case SONG_PLAYBACK_MODE.MODE_SIG:
                        _this_1.playMode = SONG_PLAYBACK_MODE.MODE_RAMDOM;
                        playmodeBtn_1.setAttribute('src', '../pics/random.png');
                        break;
                    case SONG_PLAYBACK_MODE.MODE_RAMDOM:
                        _this_1.playMode = SONG_PLAYBACK_MODE.MODE_LOOP;
                        playmodeBtn_1.setAttribute('src', '../pics/loop.png');
                        break;
                    default:
                        break;
                }
            });
        }
        // 评论消失事件
        document.addEventListener('click', function (e) {
            var addCommentBox = document.getElementById('addcommentBox');
            var searchBox = document.getElementById('searchBox');
            var target = e.target;
            // 点击对象不是评论添加框的时候关闭框
            if (addCommentBox != null && target != addCommentBox && e.target != addCommentBox) {
                addCommentBox.remove();
            }
            // 点击对象不是搜索框的时候隐藏搜索框
            if (searchBox != null && target != searchBox && e.target != searchBox) {
                searchBox.style.height = '0px';
                searchBox.style.visibility = 'hidden';
            }
        });
        // 隐藏窗口事件
        document.getElementById('titlebar').addEventListener('dblclick', function (e) {
            e.stopPropagation();
            remote.BrowserWindow.getFocusedWindow().hide();
            remote.getGlobal('windowHided').is = true;
        });
        // 事先加载搜索页面
        readFile(path.join(__dirname, '../pages/search.html'), function (err, data) {
            var body = document.getElementsByTagName('body')[0];
            // 创建搜索框结点
            var searchBox = document.createElement('DIV');
            searchBox.setAttribute('id', 'searchBox');
            searchBox.className = 'search-box';
            searchBox.innerHTML = data.toString();
            _this.sheetListBox = document.getElementById('sheetListBox');
            body.appendChild(searchBox);
            // 搜索事件
            var searchKeywords = document.getElementById('searchKeywords');
            searchKeywords.addEventListener('keydown', function (e) {
                var target = e.target;
                if (e.keyCode != undefined && e.keyCode == 13) {
                    fetch("".concat(exports.netease.server, "/search?keywords=").concat(target.value, "&cookie=").concat(exports.netease.cookie)).then(function (res) {
                        return res.json();
                    }).then(function (data) {
                        if (!data) {
                            return;
                        }
                        // 搜索结果数组
                        var results = data.result.songs;
                        var ids = [];
                        var resultBox = document.getElementById('searchResultBox');
                        resultBox.innerHTML = '';
                        var ul = document.createElement('UL');
                        ul.className = 'sheet-list-box';
                        resultBox.appendChild(ul);
                        for (var i = 0; i < results.length; i++) {
                            ids.push(results[i].id);
                        }
                        console.log('search for:', ids);
                        fetch("".concat(exports.netease.server, "/song/detail?ids=").concat(ids.join(","), "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
                            if (!data) {
                                return;
                            }
                            var _loop_1 = function () {
                                var song = data.songs[i];
                                var li = document.createElement('LI');
                                li.className = 'sheet-list-item';
                                // 创建图片框
                                var pic = document.createElement('img');
                                pic.style.float = 'left';
                                pic.style.width = '35px';
                                pic.style.height = '35px';
                                // 创建标题
                                var p = document.createElement('p');
                                li.appendChild(pic);
                                li.appendChild(p);
                                // 添加列表子项
                                ul.appendChild(li);
                                pic.src = song.al.picUrl;
                                pic.alt = "";
                                // 作者
                                var authors = song.ar;
                                var author = '';
                                for (var i_1 = 0; i_1 < authors.length; i_1++) {
                                    if (i_1 == authors.length - 1) {
                                        author += authors[i_1].name;
                                        continue;
                                    }
                                    author += authors[i_1].name + '/';
                                }
                                p.innerText = "".concat(author, " - ").concat(results[i].name);
                                li.onclick = function () {
                                    // 获取音乐URL
                                    _this.currentSheet.GetSongUrl(song.id).then(function (musicUrl) {
                                        // 设置播放列表
                                        var searchItem = [{ 'name': song.name, 'id': song.id, 'cover': song.al.picUrl, 'author': author }];
                                        searchItem.push.apply(searchItem, _this.mPlayList);
                                        _this.mPlayList = searchItem;
                                        searchItem = null;
                                        PData.pIndex = 0;
                                        PData.src = musicUrl;
                                        player.play();
                                        PData.cover = song.al.picUrl;
                                        PData.status = DPlayment_1.PlayStatus.Playing;
                                        PData.now = song.id;
                                        // 隐藏搜索框
                                        searchBox.style.height = '0px';
                                        searchBox.style.visibility = 'hidden';
                                    });
                                };
                            };
                            for (var i = 0; i < data.songs.length; i++) {
                                _loop_1();
                            }
                        });
                    });
                }
            });
        });
        // 事先加载主页
        readFile(path.join(__dirname, '../pages/sheetlist.html'), function (err, data) {
            document.getElementById('content').innerHTML = data.toString();
            PData.currentPage = DPlayment_1.PlayerPage.Home;
            _this.sheetListBox = document.getElementById('sheetListBox');
        });
        // 搜索页面展现事件
        document.addEventListener('keydown', function (e) {
            if (!(e.keyCode == 83 && e.ctrlKey)) {
                return;
            }
            e.stopPropagation();
            var searchBox = document.getElementById('searchBox');
            var searchKeywords = document.getElementById('searchKeywords');
            if (searchBox.style.visibility == 'visible') {
                searchBox.style.visibility = 'hidden';
                searchBox.style.height = '0px';
                searchKeywords.blur();
            }
            else {
                searchBox.style.visibility = 'visible';
                searchBox.style.height = '200px';
                searchKeywords.focus();
            }
        });
        // 登录按钮事件
        document.getElementById('login').addEventListener('click', function (e) {
            var netease = _this.netease;
            // 登录
            if (netease.loginStatus == false) {
                dialog.newLoginDialog('loginDialog', function () {
                    var username = document.getElementById('username');
                    var password = document.getElementById('password');
                    netease.login(username.value, password.value);
                });
            }
            else {
                netease.qd();
            }
        });
        // 登陆状态判定
        fs.readFile("".concat(exports.USR_CONFIG_DIR, "/login.json"), { encoding: 'utf8' }, function (err, data) {
            if (err) {
                exports.netease.loginStatus = false;
                new Notification('通知', { body: '您还未登录，请先登录。' });
                _this.netease.data = {};
                dialog.newLoginDialog('loginDialog', function () {
                    var username = document.getElementById('username');
                    var password = document.getElementById('password');
                    exports.netease.login(username.value, password.value);
                });
                return;
            }
            else {
                exports.netease.data = JSON.parse(data);
                if (exports.netease.data.code == 502) {
                    fs.unlink("".concat(exports.USR_CONFIG_DIR, "/login.json"), function (err) {
                        new Notification('登录失败', {
                            body: '账号或密码错误'
                        });
                        dialog.newLoginDialog('loginDialog', function () {
                            var username = document.getElementById('username');
                            var password = document.getElementById('password');
                            exports.netease.login(username.value, password.value);
                        });
                        return;
                    });
                    return;
                }
                exports.netease.cookie = exports.netease.data.cookie;
                document.getElementById('loginLabel').innerText = exports.netease.data.profile.nickname;
                fetch("".concat(exports.netease.server, "/login/status?cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
                    if (data.msg == '需要登录') {
                        exports.netease.loginStatus = false;
                        new Notification('通知', { body: '登录过期，请重新登录' });
                        exports.netease.data = {};
                        dialog.newLoginDialog('loginDialog', function () {
                            var username = document.getElementById('username');
                            var password = document.getElementById('password');
                            exports.netease.login(username.value, password.value);
                        });
                    }
                    else {
                        // 登录正常
                        // 先获取我喜欢的音乐
                        document.getElementById('login').setAttribute('src', exports.netease.data.profile.avatarUrl);
                        if (data.code != 502) {
                            // 有效登录
                            exports.netease.loginStatus = true;
                            // 初始化
                            _this_1.getFav();
                            _this_1.initProgrss();
                            _this_1.initSidebar();
                            _this_1.initPlayer();
                            // 初始化封面点击
                            _this_1.initCover();
                        }
                    }
                });
            }
        });
    };
    // 初始化播放进度条
    Player.prototype.initProgrss = function () {
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
        progressBar.addEventListener('mousedown', function (e) {
            _this.isProgressMoving = true;
        });
        progressBar.addEventListener('mouseup', function (e) {
            _this.isProgressMoving = false;
            var barWidth = progressBar.clientWidth - pinWidth;
            PData.pProgress = offset / barWidth;
        });
        progressBar.addEventListener('mousemove', function (e) {
            if (_this.isProgressMoving) {
                var barWidth = progressBar.clientWidth - pinWidth;
                offset = e.x - progressBar.offsetLeft - pinWidth / 2;
                // console.log(progress.clientWidth)
                if (offset >= 0 && offset < barWidth) {
                    progressPin.style.marginLeft = offset + 'px';
                }
            }
        });
        // progressBar.addEventListener('mouseout', (e)=>{
        //     _this.isProgressMoving = false;
        // })
        player.addEventListener('timeupdate', function () {
            // PData.pLength 歌曲长度[s]
            // PData.pTime   播放时间[s]
            // 更新播放进度
            totalLabel.innerHTML = "".concat((PData.pLength / 60).toFixed(0), ":").concat((PData.pLength % 60).toFixed(0));
            ctlabel.innerText = "".concat((PData.pTime / 60).toFixed(0), ":").concat((PData.pTime % 60).toFixed(0));
            if (!_this.isProgressMoving) {
                var barWidth = progressBar.clientWidth - pinWidth;
                offset = barWidth * PData.pProgress;
                progressPin.style.marginLeft = offset + 'px';
            }
        });
    };
    // 初始化侧边栏事件
    Player.prototype.initSidebar = function () {
        // 歌单按钮点击
        var sheetBtn = document.getElementById('sheetBtn');
        sheetBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            readFile(path.join(__dirname, '../pages/sheetlist.html'), function (err, data) {
                document.getElementById('content').innerHTML = data.toString();
                _this.sheetListBox = document.getElementById('sheetListBox');
                PData.currentPage = DPlayment_1.PlayerPage.Home;
                PData.mode = DPlayment_1.PlayMode.Normal;
                _this.getSheets();
            });
        });
        // 我喜欢的音乐按钮点击
        var favBtn = document.getElementById('favBtn');
        favBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            readFile(path.join(__dirname, '../pages/sheetlist.html'), function (err, data) {
                document.getElementById('content').innerHTML = data.toString();
                _this.sheetListBox = document.getElementById('sheetListBox');
                PData.currentPage = DPlayment_1.PlayerPage.Home;
                PData.mode = DPlayment_1.PlayMode.Normal;
                _this.getFav();
            });
        });
        // 私人FM点击
        var fmBtn = document.getElementById('fmBtn');
        fmBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            PData.mode = DPlayment_1.PlayMode.FM;
            PData.currentPage = DPlayment_1.PlayerPage.Music;
            _this.loadMusicPage();
        });
        // 心跳点击
        var heartBtn = document.getElementById('heart');
        heartBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // getFav()
            _this.getHeart();
            PData.currentPage = DPlayment_1.PlayerPage.Home;
            PData.mode = DPlayment_1.PlayMode.HEART;
        });
        // 每日推荐被点击
        var dailyRecommendBtn = document.getElementById('dailyRecommendBtn');
        dailyRecommendBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            PData.mode = DPlayment_1.PlayMode.Normal;
            readFile(path.join(__dirname, '../pages/sheetlist.html'), function (err, data) {
                document.getElementById('content').innerHTML = data.toString();
                _this.sheetListBox = document.getElementById('sheetListBox');
                _this.loadDailyRecommandedSongs();
                PData.currentPage = DPlayment_1.PlayerPage.Home;
                PData.mode = DPlayment_1.PlayMode.DAILYREC;
            });
        });
    };
    // 初始化播放器
    Player.prototype.initPlayer = function () {
        var _this_1 = this;
        // 获取播放器控件
        var player = _this.player;
        // 设置初始播放序号
        PData.pIndex = 0;
        // 初始状态为停止
        PData.status = DPlayment_1.PlayStatus.Stop;
        // 播放完毕时候下一首
        player.addEventListener('ended', (function () {
            // 下一首
            _this.next();
        }));
        // 加载完毕后设置长度参数
        player.addEventListener('canplay', function () {
            PData.pLength = player.duration;
            // 更新封面
            //PData.cover = _this.mPlayList[PData.pIndex].cover
            document.getElementById('musicTitle').innerText = '正在播放：' + _this.mPlayList[PData.pIndex].name; //+ ' - ' + mPlayList[PData.pIndex].author
            // 显示歌词
            clearInterval(_this_1.lyricInterval);
            if (PData.currentPage == DPlayment_1.PlayerPage.Music) {
                _this.showLyric();
                _this.loadComment(1, 25);
            }
        });
        // 错误处理
        player.addEventListener('error', function (e) {
            new Notification('无法播放', {
                body: '无法播放，可能是没有版权或者权限。'
            });
            _this.next();
        });
        // Buttons
        var lastBtn = document.getElementById('playerLast');
        var playBtn = document.getElementById('playerPlay');
        var nextBtn = document.getElementById('playerNext');
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
    };
    /**
     *  绑定全局按键
     */
    Player.prototype.bindGlobalShortcut = function () {
        // 绑定全局案件
        var globalShortcut = remote.globalShortcut;
        var nextKey = 'CommandOrControl+Alt+Right';
        var lastKey = 'CommandOrControl+Alt+Left';
        var playPauseKey = "CommandOrControl+Alt+P";
        var volUpKey = "CommandOrControl+Alt+Up";
        var volDownKey = "CommandOrControl+Alt+Down";
        var _this = this;
        var _player = _this.player;
        var nextShortcut = globalShortcut.register(nextKey, function () {
            _this.next();
            if (!nextShortcut) {
                ////console\.log\('注册按键失败')
            }
        });
        var lastShortcut = globalShortcut.register(lastKey, (function () {
            _this.last();
            if (!lastShortcut) {
                ////console\.log\('注册按键失败')
            }
        }));
        var playPauseShortcut = globalShortcut.register(playPauseKey, function () {
            _this.play();
            if (!playPauseShortcut) {
                ////console\.log\('注册按键失败')
            }
        });
        var volUpKeyShortcut = globalShortcut.register(volUpKey, function () {
            if (_player.volume <= 0.8) {
                _player.volume += 0.2;
            }
            ////console\.log\('音量：' + player.volume)
            if (!volUpKeyShortcut) {
                ////console\.log\('注册按键失败')
            }
        });
        var volDownKeyShortcut = globalShortcut.register(volDownKey, function () {
            if (_player.volume >= 0.2) {
                _player.volume -= 0.2;
            }
            ////console\.log\('音量：' + player.volume)
            if (!volDownKeyShortcut) {
                ////console\.log\('注册按键失败')
            }
        });
    };
    /**
     *  播放控制
     */
    // 播放
    Player.prototype.play = function () {
        console.log("播放按钮");
        var player = _this.player;
        // 获取播放器控件
        // 获取播放状态
        var status = PData.status;
        // 获取播放按钮
        var playBtn = document.getElementById('playerPlay');
        // console.log(status)
        // 如果是暂停
        if (status == DPlayment_1.PlayStatus.Pause) {
            console.log('播放');
            player.play();
            PData.status = DPlayment_1.PlayStatus.Playing;
            // 暂停图标
            playBtn.setAttribute('src', '../pics/pause.png');
        }
        else if (status == DPlayment_1.PlayStatus.Stop) { // 如果是停止
            console.log('播放');
            player.currentTime = 0;
            player.play();
            PData.status = DPlayment_1.PlayStatus.Playing;
        }
        else {
            console.log('暂停');
            player.pause();
            PData.status = DPlayment_1.PlayStatus.Pause;
            // 播放图标
            playBtn.setAttribute('src', '../pics/play.png');
        }
    };
    // 上一首
    Player.prototype.last = function () {
        var player = _this.player;
        // 获取播放器控件
        // 设置上次播放的歌曲ID和序号
        PData.last = PData.now;
        PData.lIndex = PData.pIndex;
        // 播放列表数量
        var count = _this.mPlayList.length;
        if (PData.pIndex == 0) {
            PData.pIndex = count - 1;
        }
        else {
            PData.pIndex = PData.pIndex - 1;
        }
        // 获取歌曲播放地址
        _this.currentSheet.GetSongUrl(_this.mPlayList[PData.pIndex].id).then(function (musicUrl) {
            PData.src = musicUrl;
            player.play();
            PData.status = DPlayment_1.PlayStatus.Playing;
            PData.now = _this.mPlayList[PData.pIndex].id;
        });
    };
    // 下一首
    Player.prototype.next = function () {
        // 获取播放器控件
        var player = _this.player;
        // 设置上次播放的歌曲ID和序号
        PData.last = PData.now;
        PData.lIndex = PData.pIndex;
        if (PData.mode == DPlayment_1.PlayMode.FM && PData.pIndex == 0) {
            this.loadFM();
            return;
        }
        // 播放列表数量
        var count = Number(PData.count);
        var index = Number(PData.pIndex);
        // 设置这次播放的歌曲ID和序号
        // 列表循环
        switch (this.playMode) {
            case SONG_PLAYBACK_MODE.MODE_LOOP:
                {
                    if (index == count - 1) {
                        PData.pIndex = 0;
                    }
                    else {
                        PData.pIndex = index + 1;
                    }
                    break;
                }
            case SONG_PLAYBACK_MODE.MODE_SIG:
                {
                    PData.pIndex = PData.pIndex;
                    break;
                }
            case SONG_PLAYBACK_MODE.MODE_RAMDOM:
                {
                    PData.pIndex = count * Math.random();
                    break;
                }
            default:
                break;
        }
        fetch("".concat(exports.netease.server, "/song/url?id=").concat(_this.mPlayList[PData.pIndex].id, "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
            PData.cover = _this.mPlayList[PData.pIndex].cover;
            // 播放地址
            var musicUrl = data.data[0].url;
            PData.src = musicUrl;
            player.play();
            // 设置当前播放的音乐ID
            PData.now = _this.mPlayList[PData.pIndex].id;
            // 修改播放器播放状态为播放
            PData.status = DPlayment_1.PlayStatus.Playing;
        });
    };
    Player.prototype.getMusicDetailForLiClick = function (li) {
        // 获取播放器控件
        var _this_1 = this;
        var player = _this.player;
        fetch("".concat(exports.netease.server, "/song/url?id=").concat(li.getAttribute('musicID'), "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
            if (data == undefined) {
                _this_1.getMusicDetailForLiClick(li);
                return;
            }
            var musicUrl = data.data[0].url;
            PData.src = musicUrl;
            player.play();
            PData.status = DPlayment_1.PlayStatus.Playing;
            PData.now = li.getAttribute('musicID');
        });
    };
    Player.prototype.initCover = function () {
        var _this_1 = this;
        var cover = document.getElementById('cover');
        var player = _this.player;
        cover.addEventListener('click', function (e) {
            console.log(PData.currentPage);
            console.log(PData.mode);
            e.stopPropagation();
            var page = PData.currentPage;
            if (page == DPlayment_1.PlayerPage.Music) {
                readFile(path.join(__dirname, '../pages/sheetlist.html'), function (err, data) {
                    var MainPage = document.getElementById('content');
                    MainPage.innerHTML = data.toString();
                    _this.sheetListBox = document.getElementById('sheetListBox');
                    switch (PData.mode) {
                        case DPlayment_1.PlayMode.DAILYREC: {
                            _this.loadDailyRecommandedSongs();
                            break;
                        }
                        case DPlayment_1.PlayMode.Normal: {
                            console.log("获取歌单Normal");
                            _this.getSheet(PData.sheet);
                            break;
                        }
                        case DPlayment_1.PlayMode.FM: {
                            console.log("获取FM歌单");
                            _this.getSheet(PData.sheet);
                            break;
                        }
                        case DPlayment_1.PlayMode.HEART: {
                            console.log("获取心跳歌单");
                            _this.getHeart();
                            break;
                        }
                    }
                    PData.currentPage = DPlayment_1.PlayerPage.Home;
                });
            }
            else {
                _this_1.loadMusicPage();
            }
        });
    };
    // 获取我喜欢的音乐
    Player.prototype.getFav = function () {
        var uid = exports.netease.data.account.id;
        fetch("".concat(exports.netease.server, "/user/playlist?uid=").concat(uid, "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
            var sheetlist = data.playlist;
            // 清空内容
            _this.sheetListBox.innerHTML = '';
            // 设置当前歌单为我喜欢的音乐
            PData.sheet = sheetlist[0].id;
            PData.favorateSheetId = PData.sheet;
            // 设置当前播放的歌单名称
            PData.sheetName = sheetlist[0].name;
            // 获取歌单歌曲列表
            _this.getSheet(sheetlist[0].id);
        });
    };
    // 获取心跳模式
    Player.prototype.getHeart = function () {
        var mid = _this.mPlayList[PData.pIndex].id;
        var url = "".concat(exports.netease.server, "/playmode/intelligence/list?id=").concat(mid, "&pid=").concat(PData.favorateSheetId, "&cookie=").concat(exports.netease.cookie);
        fetch(url).then(function (res) { return res.json(); }).then(function (data) {
            var heartSheet = data.data;
            // 清空内容
            _this.sheetListBox.innerHTML = '';
            // 设置当前歌单为我喜欢的音乐
            PData.sheet = PData.favorateSheetId;
            // 设置当前播放的歌单名称
            PData.sheetName = heartSheet[0].songInfo.name;
            _this.mPlayList = heartSheet;
            // 获取歌单歌曲列表
            _this.getSheet('heart');
        });
    };
    // 绑定实时当前歌单显示框
    Player.prototype.attachPlaylist = function () {
        //console\.log\('attachPlaylist');
        var _this_1 = this;
        // 只有在不是私人FM模式下才执行
        if (PData.mode != DPlayment_1.PlayMode.FM) {
            var playList = document.getElementById('playList');
            var playlistSheetName = document.getElementById('playlistSheetName');
            playlistSheetName.innerText = PData.sheetName;
            playList.innerHTML = '';
            var _loop_2 = function (i) {
                var c = _this.sheetListBox.children.item(i).cloneNode(true);
                var title = c.getElementsByTagName('P')[0];
                title.innerText = title.innerText.split('-')[0];
                c.addEventListener('click', function () {
                    // 初始化主播放列表
                    _this.initMainPlaylist();
                    // 设置上次播放的歌曲ID
                    PData.last = PData.now;
                    // 设置上次播放的序号
                    PData.lIndex = PData.pIndex;
                    // 设置当前播放的index
                    PData.pIndex = i;
                    // 设置歌曲封面
                    PData.cover = _this.mPlayList[i].cover;
                    // 获取歌曲播放Url
                    _this.sourceMusicUrl(c);
                    _this_1.playList.scrollTop = (_this_1.playList.children.item(PData.pIndex)).offsetTop - 25;
                    if (_this_1.sheetListBox && _this_1.sheetListBox.children.length > 0) {
                        _this_1.sheetListBox.scrollTop = (_this_1.playList.children.item(PData.pIndex)).offsetTop - 25;
                    }
                });
                playList.appendChild(c);
            };
            ////console\.log\('attach:' + sheetListBox)
            for (var i = 0; i < _this.sheetListBox.children.length; i++) {
                _loop_2(i);
            }
        }
    };
    // 创建播放列表
    Player.prototype.bindListItemName = function (offset, limit) {
        var _this_1 = this;
        //console\.log\(this.currentSheet)
        fetch("".concat(exports.netease.server, "/playlist/track/all?id=").concat(this.currentSheet.sheetId, "&limit=").concat(limit, "&offset=").concat(offset * 10, "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
            ////console\.log\(`${netease.server}/song/detail?ids=${new_ids}`)
            //////console\.log\(str)
            var songs = data.songs;
            // 遍历所有的歌单ID以执行一些操作
            //console\.log\(songs)
            var previous_length = _this.sheetListBox.children.length;
            var _loop_3 = function (i) {
                //console\.log\(i);
                ////console\.log\('添加歌单项目元素')
                // 创建一条列表项，每个列表项目对应一首歌
                var li = document.createElement('LI');
                // 添加样式 背景色#303030
                li.classList.add('sheet-list-item');
                li.classList.add('light-dark');
                // 为列表项设置序号和对应音乐ID以方便点击时候直接调用获取到音乐Url
                li.setAttribute('pIndex', String(i));
                li.setAttribute('musicID', _this_1.currentSheet.trackIds[i].id);
                // 为列表项添加点击事件
                li.addEventListener('click', function (ev) {
                    // 设置上次播放的歌曲ID
                    PData.last = PData.now;
                    PData.lIndex = PData.pIndex;
                    // 设置当前播放的index
                    PData.pIndex = parseInt(li.getAttribute('pIndex'));
                    // 设置当前播放的歌单名称
                    PData.sheetName = _this_1.currentSheet.name;
                    PData.cover = songs[i].al.picUrl;
                    // 为播放器绑定播放地址，并开始播放
                    _this.sourceMusicUrl(li);
                    //initMainPlaylist()
                    // _this.attachPlaylist()
                    // 初始化主播放列表
                    _this.initMainPlaylist();
                    _this_1.playList.parentElement.scrollTop = (_this_1.playList.children.item(PData.pIndex)).offsetTop - 25;
                });
                // 还原坐标
                var index = i - previous_length;
                // console.log(`index: ${index}`)
                // 为列表项目绑定歌曲名
                li.setAttribute('name', songs[index].name);
                ////console\.log\('['+count+']get one: '+songs[i].name)
                // 为列表项目绑定封面
                li.setAttribute('cover', songs[index].al.picUrl);
                // 为列表项目绑定专辑ID
                li.setAttribute('albumId', songs[index].al.id);
                // 为列表项目绑定专辑名称
                li.setAttribute('albumName', songs[index].al.name);
                // 为列表项目生成作者字符串
                var authors = songs[index].ar;
                var author = '';
                for (var i_2 = 0; i_2 < authors.length; i_2++) {
                    if (i_2 == authors.length - 1) {
                        author += authors[i_2].name;
                        continue;
                    }
                    author += authors[i_2].name + '/';
                }
                li.setAttribute('author', author);
                // 列表项目左侧的歌曲封面
                var coverLeft = document.createElement('IMG');
                coverLeft.style.float = 'left';
                coverLeft.style.width = '35px';
                coverLeft.style.height = '35px';
                coverLeft.setAttribute('src', songs[index].al.picUrl);
                // 列表项目的歌曲名称
                var p = document.createElement('P');
                // p.innerText = `${i + 1} ` + songs[index].name + ' - ' + author
                p.innerText = songs[index].name + ' - ' + author;
                li.appendChild(coverLeft);
                li.appendChild(p);
                _this.sheetListBox.appendChild(li);
            };
            // console.log(`previous: ${previous_length}`);
            for (var i = offset * limit; i < offset * limit + limit && i < _this.currentSheet.songCount; i++) {
                _loop_3(i);
            }
            // 添加到播放列表
            _this.attachPlaylist();
            // 初始化主播放列表（第一次肯定为空）
            if (_this_1.firstLoad) {
                _this.initMainPlaylist();
            }
        });
    };
    // 生成IDS请求参数
    Player.prototype.generateIdsList = function () {
        if (_this.sheetListBox == undefined) {
            //console\.log\('sheetlistbox is undefined')
        }
        var ids = '';
        //////console\.log\(sheetListBox)
        for (var i = 0; i < _this.sheetListBox.children.length; i++) {
            if (i == _this.sheetListBox.children.length - 1) {
                ids += _this.sheetListBox.children[i].getAttribute('musicID');
            }
            else {
                ids += _this.sheetListBox.children[i].getAttribute('musicID') + ',';
            }
        }
        return ids;
    };
    // 歌单项目点击后获取音乐Url
    Player.prototype.sourceMusicUrl = function (li) {
        //console\.log\('获取播放地址')
        // 获取URL，添加cookie可以获取到无损
        exports.netease.getMusicUrl(li.getAttribute('musicID'), function (musicUrl) {
            // 设置播放器的源地址
            PData.src = musicUrl;
            // 开始播放
            // 如果是刚打开程序
            if (_this.firstLoad) {
                PData.pIndex = 0;
                PData.cover = _this.mPlayList[0].cover;
                PData.now = _this.mPlayList[0].id;
                PData.status = DPlayment_1.PlayStatus.Pause;
                //sourceMusicUrl(document.getElementById('sheetListBox').children.item(0))
                _this.firstLoad = false;
                return;
            }
            //console\.log\('开始播放：' + musicUrl)
            _this.player.play();
            // 设置当前状态为《播放》
            PData.status = DPlayment_1.PlayStatus.Playing;
            // 绑定当前的播放音乐的ID
            PData.now = li.getAttribute('musicID');
            // 绑定当前播放音乐的名称
            PData.name = li.getAttribute('name');
            player.title = li.getAttribute('name');
            // 绑定当前播放音乐的作者名称
            PData.author = li.getAttribute('author');
        });
    };
    // 输入歌单ID，获取歌单内容
    Player.prototype.getSheet = function (id) {
        var _this_1 = this;
        _this.currentOffset = 0;
        _this.mPlayListName = id;
        // 心动模式
        if (id == 'heart') {
            // 设置当前播放的歌单名称
            PData.sheetName = 'heart';
            // 绑定当前歌单创造者
            PData.sheetCover = 'ai';
            PData.sheetCreator = 'ai';
            // 绑定当前歌单播放数
            PData.sheetPlayCount = 0;
            var _loop_4 = function (i) {
                // 创建一条列表项，每个列表项目对应一首歌
                var li = document.createElement('LI');
                // 添加样式 背景色#303030
                li.classList.add('sheet-list-item');
                li.classList.add('light-dark');
                // 为列表项设置序号和对应音乐ID以方便点击时候直接调用获取到音乐Url
                li.setAttribute('pIndex', String(i));
                li.setAttribute('musicID', _this.mPlayList[i].id);
                // 为列表项添加点击事件
                li.addEventListener('click', function () {
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
                songInfo = _this.mPlayList[i].songInfo;
                li.setAttribute('name', songInfo.name);
                ////console\.log\('['+count+']get one: '+songs[i].name)
                // 为列表项目绑定封面
                li.setAttribute('cover', songInfo.al.picUrl);
                // 为列表项目绑定专辑ID
                li.setAttribute('albumId', songInfo.al.id);
                // 为列表项目绑定专辑名称
                li.setAttribute('albumName', songInfo.al.name);
                // 为列表项目生成作者字符串
                var authors = songInfo.ar;
                var author = '';
                for (var i_3 = 0; i_3 < authors.length; i_3++) {
                    if (i_3 == authors.length - 1) {
                        author += authors[i_3].name;
                        continue;
                    }
                    author += authors[i_3].name + '/';
                }
                li.setAttribute('author', author);
                // 列表项目左侧的歌曲封面
                var coverLeft = document.createElement('IMG');
                coverLeft.style.float = 'left';
                coverLeft.style.width = '35px';
                coverLeft.style.height = '35px';
                coverLeft.setAttribute('src', songInfo.al.picUrl);
                // 列表项目的歌曲名称
                var p = document.createElement('P');
                p.innerText = "".concat(i + 1, " ") + songInfo.name + ' - ' + author;
                li.appendChild(coverLeft);
                li.appendChild(p);
                _this.sheetListBox.appendChild(li);
                _this.sheetListBox.appendChild(li);
            };
            var songInfo;
            // 遍历所有的歌单ID以执行一些操作
            for (var i = 0; i < _this.mPlayList.length; i++) {
                _loop_4(i);
            }
            //console\.log\('歌单长度：', _this.mPlayList.length);
            // 这个时候列表项还没有获取到歌曲名和专辑图片，需要另外获取
            // `${netease.server}/song/detail?ids=${ids}
            // 为所有列表项生成综合请求参数ids，通过上面的
            // 址可以反馈到所有列表项目音乐详情的一个数组
            var ids = this.generateIdsList();
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
        }
        else {
            var sheet = new data_1.SheetDetial(id);
            sheet.Update().then(function (data) {
                // 请求
                // 这里实际上获取到一个歌单的详情，不是歌单列表哦2333
                _this_1.currentSheet = data;
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
                }
                catch (_) { }
                ;
                // 加载歌单详情框
                _this_1.loadSheetDetialBox();
                // 这个时候列表项还没有获取到歌曲名和专辑图片，需要另外获取
                // `${netease.server}/song/detail?ids=${ids}
                // 为所有列表项生成综合请求参数ids，通过上面的
                // 址可以反馈到所有列表项目音乐详情的一个数组
                var ids = _this_1.generateIdsList();
                _this.bindListItemName(_this.currentOffset, 20);
                _this.currentOffset = 1;
                // 歌单界面形成☝
                _this.sheetListBox = document.getElementById('sheetListBox');
                _this.sheetListBox.onscroll = function (ev) {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!(_this.sheetListBox.scrollHeight - 1 <= _this.sheetListBox.scrollTop + _this.sheetListBox.clientHeight)) return [3 /*break*/, 2];
                                    //console\.log\('touch')
                                    _this.currentOffset += 1;
                                    _this.sheetListBox.scrollTop = _this.sheetListBox.scrollTop - 5;
                                    return [4 /*yield*/, _this.bindListItemName(_this.currentOffset, 10)];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    });
                };
                _this.playlistBox.onscroll = function (ev) {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!(_this.playlistBox.scrollHeight - 1 <= _this.playlistBox.scrollTop + _this.playlistBox.clientHeight)) return [3 /*break*/, 2];
                                    //console\.log\('touch')
                                    _this.currentOffset += 1;
                                    _this.playlistBox.scrollTop = _this.playlistBox.scrollTop - 5;
                                    return [4 /*yield*/, _this.bindListItemName(_this.currentOffset, 10)];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    });
                };
            });
        }
    };
    // 使用当前的播放列表DOM元素初始化数据列表
    Player.prototype.initMainPlaylist = function () {
        var list = _this.playList;
        // 生成主播放列表（播放后切换到这个歌单）
        // 清空
        _this.mPlayList = [];
        // 加载
        for (var i = 0; i < list.children.length; i++) {
            var item = {
                'name': list.children[i].getAttribute('name'),
                'id': list.children[i].getAttribute('musicID'),
                'author': list.children[i].getAttribute('author'),
                'cover': list.children[i].getAttribute('cover'),
                'albumId': list.children[i].getAttribute('albumId'),
                'albumName': list.children[i].getAttribute('albumName')
            };
            _this.mPlayList.push(item);
        }
        if (this.firstLoad) {
            this.sourceMusicUrl(list.firstChild);
        }
    };
    // 获取歌单列表并绑定到界面
    Player.prototype.getSheets = function () {
        var _this_1 = this;
        var id = exports.netease.data.account.id;
        // 根据用户ID请求用户歌单简略信息
        fetch("".concat(exports.netease.server, "/user/playlist?uid=").concat(id, "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
            // 获取列表盒子
            // 解析JSON为对象
            // 请求失败
            if (data.code != 200) {
                //console\.log\('not 200')
                return;
            }
            //console\.log\(data)
            // 歌单列表
            var sheetlist = data.playlist;
            // 重置列表盒子内容
            _this.sheetListBox.innerHTML = '';
            var _loop_5 = function (i) {
                // 创建一个列表项目，用于显示一个歌单项目
                var li = document.createElement('LI');
                // 设置项目的样式
                li.classList.add('sheet-list-item');
                // #303030
                li.classList.add('light-dark');
                // 设置列表项目对应的序号 争议
                li.setAttribute('pIndex', String(i));
                // 旁边的图标
                var coverLeft = document.createElement('IMG');
                coverLeft.style.float = 'left';
                coverLeft.style.width = '35px';
                coverLeft.style.height = '35px';
                coverLeft.setAttribute('src', sheetlist[i].coverImgUrl);
                li.appendChild(coverLeft);
                // 为每个歌单设置名字
                var p = document.createElement('P');
                p.innerText = sheetlist[i].name;
                li.appendChild(p);
                // 歌单列表项目点击事件
                li.addEventListener('click', function (e) {
                    // 再次清空列表盒子的内容，用歌单的歌曲列表取代歌单列表
                    _this.sheetListBox.innerHTML = '';
                    // 请求单个歌单的详情
                    var sheet = new data_1.SheetDetial(sheetlist[li.getAttribute('pIndex')].id);
                    sheet.Update().then(function (sheet) {
                        // 详细播放列表信息 对象
                        // 加载歌单详情框
                        _this_1.loadSheetDetialBox();
                        // 获取歌单
                        _this.getSheet(sheet.sheetId);
                        // 设置当前播放的歌单为点击的歌单
                        PData.sheet = sheet.sheetId;
                    });
                });
                _this.sheetListBox.appendChild(li);
            };
            // 遍历所有的歌单
            for (var i = 0; i < sheetlist.length; i++) {
                _loop_5(i);
            }
            // 形成歌单列表界面☝
        });
    };
    // 为歌单详情框填充内容
    Player.prototype.loadSheetDetialBox = function () {
        // 为侧边栏添加歌单详情
        // 歌单详情介绍
        var sheetDetialBoxImg = document.getElementById('sheetDetialBoxImg');
        var sheetDetialContent = document.getElementsByClassName('sheet-detail-content')[0];
        var imgUrl = PData.sheetCover;
        sheetDetialBoxImg.setAttribute('src', imgUrl);
        // 名称
        var nameBox = document.createElement('DIV');
        nameBox.innerText = '歌单名：' + PData.sheetName;
        // 创造者
        var creatorBox = document.createElement('DIV');
        creatorBox.innerText = '创建者：' + PData.sheetCreator;
        // 播放数
        var playNumBox = document.createElement('DIV');
        playNumBox.innerText = '播放数：' + PData.sheetPlayCount;
        // 歌曲数
        var trackCountBox = document.createElement('DIV');
        trackCountBox.innerText = '歌曲数：' + PData.sheetTrackCount;
        // 简介
        var descripBox = document.createElement('DIV');
        descripBox.innerText = '简介：' + PData.sheetDescription;
        sheetDetialContent.innerHTML = '';
        sheetDetialContent.appendChild(nameBox);
        sheetDetialContent.appendChild(creatorBox);
        sheetDetialContent.appendChild(playNumBox);
        sheetDetialContent.appendChild(trackCountBox);
        sheetDetialContent.appendChild(descripBox);
    };
    // 加载每日推荐歌单
    Player.prototype.loadDailyRecommandedSongs = function () {
        fetch("".concat(exports.netease.server, "/recommend/songs?cookie=").concat(exports.netease.cookie)).then((function (res) { return res.json(); })).then(function (data) {
            // 创建推荐歌单数组
            var rcms = data.data.dailySongs;
            //console\.log\(rcms)
            // 清空dailySheet数组内容
            _this.mPlayList = [];
            var _loop_6 = function (i) {
                var authors = rcms[i].ar;
                var author = '';
                for (var i_4 = 0; i_4 < authors.length; i_4++) {
                    if (i_4 == authors.length - 1) {
                        author += authors[i_4].name;
                        continue;
                    }
                    author += authors[i_4].name + '/';
                }
                //填充主播放列表
                _this.mPlayList.push({ 'id': rcms[i].id, 'name': rcms[i].name, 'cover': rcms[i].al.picUrl, 'author': author });
                // 创建列表项
                var li = document.createElement('LI');
                // 添加样式
                li.classList.add('sheet-list-item');
                li.classList.add('light-dark');
                // 设置列表向的序号
                li.setAttribute('pIndex', String(i));
                li.setAttribute('musicID', rcms[i].id);
                // 创建列表项左侧歌曲封面框
                var coverLeft = document.createElement('IMG');
                coverLeft.style.float = 'left';
                coverLeft.style.width = '35px';
                coverLeft.style.height = '35px';
                // 为封面框添加图片源 争议
                // 用到了上面初始化好的dailySheet
                // 设置封面
                coverLeft.setAttribute('src', _this.mPlayList[i].cover);
                // 封面框右侧的歌曲名称
                var p = document.createElement('P');
                p.innerText = rcms[i].name;
                li.appendChild(coverLeft);
                li.appendChild(p);
                // 列表项的点击事件，初始化一些东西然后开始播放
                li.addEventListener('click', function () {
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
                        PData.status = DPlayment_1.PlayStatus.Playing;
                        ;
                    });
                });
                // 填充列表
                _this.sheetListBox.appendChild(li);
            };
            // 遍历推荐歌曲
            for (var i = 0; i < rcms.length; i++) {
                _loop_6(i);
            }
            // 设置当前歌单的名字，会显示在实时歌单和歌单详情里
            PData.sheetName = '每日推荐';
            // 刷新实时歌单
            _this.attachPlaylist();
        });
    };
    // 加载私人定制FM
    Player.prototype.loadFM = function () {
        var _this_1 = this;
        // 读取音乐界面代码
        readFile(path.join(__dirname, '../pages/music.html'), function (err, data) {
            // 右侧主容器初始化
            document.getElementById('content').innerHTML = data.toString();
            _this.sheetListBox = document.getElementById('sheetListBox');
            // 设置当前页面为音乐详情
            PData.currentPage = DPlayment_1.PlayerPage.Music;
            // 加载播放FM歌曲
            // 清空FM歌单列表
            _this.mPlayList = [];
            var netease = _this.netease;
            netease.getFMList(function (fms) {
                // 填充主播放列表
                for (var i = 0; i < fms.length; i++) {
                    var authors = fms[i].artists;
                    var author = '';
                    for (var i_5 = 0; i_5 < authors.length; i_5++) {
                        if (i_5 == authors.length - 1) {
                            author += authors[i_5].name;
                            continue;
                        }
                        author += authors[i_5].name + '/';
                    }
                    _this.mPlayList.push({ 'id': fms[i].id, 'name': fms[i].name, 'cover': fms[i].album.picUrl, 'author': author });
                }
                // 初始化绑定播放器当前播放序号、当前音乐ID、当前封面
                PData.pIndex = 0;
                PData.now = fms[0].id;
                PData.cover = fms[0].album.picUrl;
                PData.name = fms[0].name;
                // 获取播放地址
                netease.getMusicUrl(PData.now, function (musicUrl) {
                    _this.firstLoad = false;
                    // 为播放器设置播放源地址
                    PData.src = musicUrl;
                    // 播放器开始播放
                    _this.player.play();
                    // 设置播放状态为播放
                    PData.status = DPlayment_1.PlayStatus.Playing;
                    // 加载歌词
                    _this.showLyric();
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
                    _this.loadDownloadBtn();
                });
            }, _this_1.loadMusicPage);
        });
    };
    // 加载评论
    Player.prototype.loadComment = function (page, limit) {
        //////console\.log\('show')
        if (page < 1) {
            page = 1;
        }
        var musicPanelBottom = document.getElementById('musicPanelBottom');
        fetch("".concat(exports.netease.server, "/comment/music?id=").concat(PData.now, "&limit=").concat(limit, "&offset=").concat((page - 1) * 3, "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
            var normal = data.hotComments;
            if (data.hotComments == undefined || data.hotComments.length == 0) {
                normal = data.comments;
            }
            // musicPanelBottom.innerHTML = ''
            // let hotcommentList = document.createElement('UL')
            // hotcommentList.setAttribute('id', 'hotcommentList')
            var normalcommentList = document.getElementById('normalcommentList');
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
            for (var i = 0; i < normal.length; i++) {
                var user = normal[i].user.nickname;
                var content = normal[i].content;
                var li = document.createElement('LI');
                //li.classList.add('comment-line')
                var contentDiv = document.createElement('DIV');
                contentDiv.classList.add('comment-line');
                contentDiv.classList.add('light-dark');
                var userP = document.createElement('DIV');
                userP.classList.add('comment-label-mute');
                userP.innerText = user;
                userP.style.flexGrow = '1';
                userP.style.whiteSpace = 'nowrap';
                var userImg = document.createElement('img');
                userImg.classList.add('comment-user-img');
                userImg.src = normal[i].user.avatarUrl;
                var contentP = document.createElement('p');
                contentP.innerHTML = content;
                contentP.style.padding = "0 15px";
                contentDiv.appendChild(userImg);
                contentDiv.appendChild(contentP);
                contentDiv.appendChild(userP);
                li.appendChild(contentDiv);
                // console.log(normal[i].user.avatarUrl)
                // contentDiv.style.backgroundImage = `url("${normal[i].user.avatarUrl}")`
                // contentDiv.style.backgroundSize = 'cover'
                normalcommentList.appendChild(li);
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
            var commentPageUpFunc = function (e) {
                e.stopPropagation();
                var page = Number(normalcommentList.getAttribute('page'));
                if (page > 1) {
                    page = Number(page) - 1;
                    normalcommentList.setAttribute('page', String(page));
                    fetch("".concat(exports.netease.server, "/comment/music?id=").concat(PData.now, "&limit=").concat(limit, "&offset=").concat((page - 1) * 3, "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
                        var normal = data.comments;
                        //////console\.log\(str)
                        if (normal != undefined) {
                            normalcommentList.innerHTML = '';
                            for (var i = 0; i < normal.length; i++) {
                                var user = normal[i].user.nickname;
                                var content = normal[i].content;
                                var li = document.createElement('LI');
                                //li.classList.add('comment-line')
                                var contentDiv = document.createElement('DIV');
                                contentDiv.innerHTML = content;
                                contentDiv.classList.add('comment-line');
                                contentDiv.classList.add('light-dark');
                                var userP = document.createElement('DIV');
                                userP.classList.add('comment-label-mute');
                                userP.innerHTML = user;
                                contentDiv.appendChild(userP);
                                li.appendChild(contentDiv);
                                normalcommentList.appendChild(li);
                                normalcommentList.scrollTop = 0;
                            }
                        }
                    });
                }
            };
            var commentPageDownFunc = function () {
                // e.stopPropagation()
                var page = Number(normalcommentList.getAttribute('page'));
                //////console\.log\('still')
                //////console\.log\('still+'+page)
                //////console\.log\('stillpages:'+normalcommentList.getAttribute('pages'))
                //////console\.log\('??'+(page < normalcommentList.getAttribute('pages')))
                if (page < Number(normalcommentList.getAttribute('pages'))) {
                    page = Number(page) + 1;
                    normalcommentList.setAttribute('page', String(page));
                    //////console\.log\(normalcommentList.getAttribute('pages'))
                    //////console\.log\(normalcommentList.getAttribute('page'))
                    //////console\.log\(page)
                    fetch("".concat(exports.netease.server, "/comment/music?id=").concat(PData.now, "&limit=").concat(limit, "&offset=").concat((page - 1) * 3, "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
                        var normal = data.hotComments;
                        if (data.hotComments == undefined || data.hotComments.length == 0) {
                            normal = data.comments;
                        }
                        //////console\.log\(str)
                        if (normal != undefined) {
                            // normalcommentList.innerHTML = ''
                            for (var i = 0; i < normal.length; i++) {
                                var user = normal[i].user.nickname;
                                var content = normal[i].content;
                                var li = document.createElement('LI');
                                //li.classList.add('comment-line')
                                var contentDiv = document.createElement('DIV');
                                contentDiv.classList.add('comment-line');
                                contentDiv.classList.add('light-dark');
                                var userP = document.createElement('DIV');
                                userP.classList.add('comment-label-mute');
                                userP.innerText = user;
                                userP.style.flexGrow = '1';
                                userP.style.whiteSpace = 'nowrap';
                                var userImg = document.createElement('img');
                                userImg.classList.add('comment-user-img');
                                userImg.src = normal[i].user.avatarUrl;
                                var contentP = document.createElement('p');
                                contentP.innerHTML = content;
                                contentP.style.padding = "0 15px";
                                contentDiv.appendChild(userImg);
                                contentDiv.appendChild(contentP);
                                contentDiv.appendChild(userP);
                                li.appendChild(contentDiv);
                                // console.log(normal[i].user.avatarUrl)
                                // contentDiv.style.backgroundImage = `url("${normal[i].user.avatarUrl}")`
                                // contentDiv.style.backgroundSize = 'cover'
                                normalcommentList.appendChild(li);
                            }
                        }
                    });
                }
            };
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
            };
        });
    };
    Player.prototype.loadLikeBtn = function () {
        // 喜欢按钮
        var likeBtn = document.getElementById('likeBtn');
        likeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            fetch("".concat(exports.netease.server, "/like?id=").concat(PData.now, "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
                ////console\.log\(str)
                if (data.code == 200) {
                    new Notification('通知', {
                        body: '喜欢歌曲成功'
                    });
                }
                else {
                    new Notification('通知', {
                        body: '喜欢歌曲失败'
                    });
                    ////console\.log\(str)
                }
            });
        });
    };
    // 加载收藏按钮
    Player.prototype.loadCollectBtn = function () {
        // 收藏按钮
        var collectBtn = document.getElementById('collectBtn');
        collectBtn.addEventListener('click', function (e) {
            var mid = PData.now;
            fetch("".concat(exports.netease.server, "/user/playlist?uid=").concat(exports.netease.data.account.id, "&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
                var sheetlist = data.playlist;
                ////console\.log\('[url]'+`${netease.server}/user/playlist?uid=${this.data.account.id}`+'sheetlist:'+str)
                var req = new XMLHttpRequest();
                var collectDialog = dialog.newCollectDialog('collect_dialog', sheetlist, mid, exports.netease.cookie);
            });
        });
    };
    Player.prototype.loadDislikeBtn = function () {
        // 不喜欢按钮
        var dislikeBtn = document.getElementById('dislikeBtn');
        dislikeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            fetch("".concat(exports.netease.server, "/like?id=").concat(PData.now, "&like=false&cookie=").concat(exports.netease.cookie)).then(function (res) { return res.json(); }).then(function (data) {
                if (data.code == 200) {
                    ////console\.log\(str)
                    new Notification('通知', {
                        body: '取消喜欢歌曲成功，可能需要一点点时间系统才会更新。'
                    });
                }
                else {
                    new Notification('通知', {
                        body: '取消喜欢歌曲失败'
                    });
                }
            });
        });
    };
    Player.prototype.loadAddcommentBtn = function () {
        var startcommentBtn = document.getElementById('startcommentBtn');
        startcommentBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // 输入窗口
            var addcommentBox = document.createElement('DIV');
            addcommentBox.setAttribute('id', 'addcommentBox');
            addcommentBox.className = 'addcommentBox';
            // 输入框
            var commentTextBox = document.createElement('INPUT');
            commentTextBox.setAttribute('type', 'text');
            commentTextBox.setAttribute('id', 'commentTextBox');
            commentTextBox.setAttribute('placeholder', '输入评论');
            addcommentBox.appendChild(commentTextBox);
            // 提交按钮
            var addcommentBtn = document.createElement('button');
            addcommentBtn.setAttribute('id', 'addcommentBtn');
            addcommentBtn.innerText = '提交';
            addcommentBox.appendChild(addcommentBtn);
            addcommentBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var url = "".concat(exports.netease.server, "/comment?type=0&t=1&id=").concat(PData.now, "&content=").concat(commentTextBox.value, "&cookie=").concat(exports.netease.cookie);
                fetch(url).then(function (res) { return res.json(); }).then(function (data) {
                    if (data.code == 200) {
                        new Notification('通知', {
                            body: '评论发送成功'
                        });
                        addcommentBox.remove();
                        _this.loadComment(1, 25);
                    }
                    else {
                        ////console\.log\(str)
                    }
                });
            });
            document.getElementsByTagName('body')[0].appendChild(addcommentBox);
            commentTextBox.focus();
        });
    };
    Player.prototype.loadDownloadBtn = function () {
        var _this_1 = this;
        var downloadBtn = document.getElementById("downloadBtn");
        if (downloadBtn) {
            // downloadBtn.href = PData.src
            // downloadBtn.setAttribute('download', `${PData.name}.${PData.src.split('.').slice(-1)}`)
            downloadBtn.onclick = function (e) {
                e.stopPropagation();
                console.log(__dirname);
                console.log("".concat(__dirname, "/").concat(PData.name, ".").concat(PData.src.split('.').slice(-1)));
                try {
                    (function () { return __awaiter(_this_1, void 0, void 0, function () {
                        var downloadDir, file, request;
                        return __generator(this, function (_a) {
                            downloadDir = "".concat(exports.USR_CONFIG_DIR, "\\download");
                            if (!fs.existsSync(downloadDir)) {
                                fs.mkdirSync(downloadDir, '0755');
                            }
                            file = fs.createWriteStream("".concat(downloadDir, "\\").concat(PData.name, ".").concat(PData.src.split('.').slice(-1)));
                            request = http.get(PData.src, function (response) {
                                response.pipe(file);
                                file.on('finish', function () {
                                    file.close();
                                    console.log('download file finished');
                                    dialog.createDialog("dwnfinished", "通知", 300, 300, "下载歌曲完毕");
                                });
                            });
                            request.on('error', function (err) {
                                file.unlink();
                                console.log('error', err);
                                dialog.createDialog("dwnfinished", "通知", 300, 300, "\u4E0B\u8F7D\u6B4C\u66F2\u5931\u8D25: ".concat(err));
                            });
                            return [2 /*return*/];
                        });
                    }); })();
                }
                catch (ex) {
                    console.log(ex);
                }
            };
        }
    };
    Player.prototype.loadMusicPage = function () {
        //console\.log\('load music page', PData.mode)
        // FM模式设置
        if (PData.mode == DPlayment_1.PlayMode.FM) {
            this.loadFM();
        }
        if (PData.mode == DPlayment_1.PlayMode.Normal || PData.mode == DPlayment_1.PlayMode.DAILYREC || PData.mode == DPlayment_1.PlayMode.HEART) {
            readFile(path.join(__dirname, '../pages/music.html'), function (err, data) {
                document.getElementById('content').innerHTML = data.toString();
                _this.sheetListBox = document.getElementById('sheetListBox');
                // 设置当前页面为音乐详情
                PData.currentPage = DPlayment_1.PlayerPage.Music;
                //////console\.log\(PData.pIndex)
                //////console\.log\(PData.pIndex.cover)
                var diskCover = document.getElementById('diskCover');
                diskCover.setAttribute('src', _this.mPlayList[PData.pIndex].cover);
                //加载歌词
                _this.showLyric();
                // 加载喜不喜欢按钮
                _this.loadLikeBtn();
                //loadDislikeBtn()
                _this.loadCollectBtn();
                // 加载开始评论按钮
                _this.loadAddcommentBtn();
                // 加载下载按钮
                _this.loadDownloadBtn();
                // 评论
                _this.loadComment(1, 25);
            });
        }
    };
    // 显示歌词
    Player.prototype.showLyric = function () {
        var _this_1 = this;
        this.currentSheet.GetLyric(PData.now).then(function (lyricCuts) {
            readFile(path.join(__dirname, '../pages/lyric.html'), function (err, data) {
                var lyricBox = document.getElementById('lyric');
                var lyricLines = document.getElementById("lyric-lines");
                lyricBox.innerHTML = data.toString();
                // 根据歌词的长度判断歌曲是轻音乐还是正常歌曲
                if (lyricCuts.length > 0) {
                    _this.sheetListBox = document.getElementById('sheetListBox');
                    var lyricLines_1 = document.getElementById('lyric-lines');
                    var _loop_7 = function (i) {
                        //////console\.log\('123')
                        var l = document.createElement('LI');
                        //l.classList.add('menu-item')
                        l.setAttribute('time', lyricCuts[i].time);
                        l.id = 'lyric-' + lyricCuts[i].time;
                        l.innerText = lyricCuts[i].content;
                        lyricLines_1.appendChild(l);
                        l.addEventListener('dblclick', (function () {
                            _this.player.currentTime = Number(l.getAttribute('time'));
                        }).bind(_this_1));
                    };
                    for (var i = 0; i < lyricCuts.length; i++) {
                        _loop_7(i);
                    }
                    _this_1.lyricInterval = setInterval(function () {
                        //////console\.log\(lyricBox.scrollTop)
                        var ct = parseInt(String(PData.pTime));
                        var currentLine = document.getElementById('lyric-' + ct);
                        if (currentLine != undefined) {
                            for (var i = 0; i < lyricLines_1.children.length; i++) {
                                lyricLines_1.children[i].style.color = 'ivory';
                            }
                            currentLine.style.color = 'coral';
                            // var prevoisLine = <HTMLLIElement>currentLine.previousElementSibling;
                            // if (prevoisLine) {
                            //     prevoisLine.style.color = 'ivory';
                            // }
                            // console.log(currentLine.offsetTop)
                            lyricLines_1.scrollTop = currentLine.offsetTop - (lyricLines_1.clientHeight / 2);
                        }
                    }, 200);
                }
                else {
                    _this.sheetListBox = document.getElementById('sheetListBox');
                    var lyricLines_2 = document.getElementById('lyric-lines');
                    var l = document.createElement('LI');
                    l.innerText = '纯音乐，敬请聆听。';
                    lyricLines_2.appendChild(l);
                }
            });
        });
    };
    return Player;
}());
exports.Player = Player;
