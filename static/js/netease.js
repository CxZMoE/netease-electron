"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
var remote = require("@electron/remote");
var fs = remote.require('fs');
var http = remote.require('http');
var dialog_1 = require("./dialog");
var nel_1 = require("./nel");
exports.server = "http://127.0.0.1:3000";
var Netease = /** @class */ (function () {
    function Netease(player) {
        this.server = exports.server;
        this.player = player;
        this.loginStatus = false;
    }
    // 写入用户配置文件
    Netease.prototype.writeConfig = function (data) {
        fs.writeFile("".concat(nel_1.USR_CONFIG_DIR, "/login.json"), data, function (err) {
            if (err) {
                return console.error(err);
            }
        });
    };
    // 登录
    Netease.prototype.login = function (username, password) {
        var _this = this;
        console.log('login');
        fetch("".concat(exports.server, "/login?email=").concat(username, "&password=").concat(password)).then(function (res) { return res.json(); }).then(function (data) {
            console.log('end');
            console.log(data);
            // 保存登录信息
            if (data.code != 502) {
                _this.data = data;
                console.log(_this.data);
                _this.cookie = _this.data.cookie;
                new Notification("通知", {
                    body: "登录成功"
                });
                document.getElementById("loginLabel").innerText = "已登录";
                _this.loginStatus = true;
                _this.writeConfig(JSON.stringify(data));
                var d = new dialog_1.default();
                d.closeDialog("loginDialog");
                remote.getCurrentWindow().reload();
            }
            else {
                fs.unlink("".concat(nel_1.USR_CONFIG_DIR, "/login.json"), function (err) {
                    new Notification("登录失败", {
                        body: "账号或密码错误"
                    });
                    return;
                });
                //alert("密码错误：" + str)
            }
        });
    };
    // 签到
    Netease.prototype.qd = function () {
        var _this = this;
        fetch("".concat(exports.server, "/daily_signin?type=0&cookie=").concat(this.cookie)).then(function (res) { return res.json(); }).then(function (data) {
            if (data.code == 200) {
                new Notification("通知", { body: "安卓签到成功，积分+3" });
                fetch("".concat(exports.server, "/daily_signin?type=0&cookie=").concat(_this.cookie)).then(function (res) { return res.json(); }).then(function (data) {
                    if (data.code == 200) {
                        new Notification("通知", { body: "PC/Web签到成功，积分+2" });
                    }
                    else if (data.code == -2) {
                        new Notification("通知", { body: "您今天已经签到过了>w<" });
                    }
                    else {
                        //alert(str)
                        new Notification("通知", { body: "PC/Web签到失败" });
                    }
                });
            }
            else if (data.code == -2) {
                new Notification("通知", { body: "您今天已经签到过了>w<" });
            }
            else {
                //alert(str)
                new Notification("通知", { body: "安卓签到失败" });
            }
        });
    };
    // 登出
    Netease.prototype.logout = function (username, password) {
        fetch("".concat(exports.server, "/logout")).then(function (res) { return res.json(); }).then(function (data) {
            // 删除登录信息
            if (data.code == 200) {
                fs.unlink("".concat(nel_1.USR_CONFIG_DIR, "/login.json"), function (err) {
                    //console.log(err)
                    new Notification("通知", {
                        body: "登出失败"
                    });
                    return;
                });
                new Notification("通知", {
                    body: "登出成功"
                });
            }
        });
    };
    // 获取音乐URL
    Netease.prototype.getMusicUrl = function (musicId, callback) {
        fetch("".concat(exports.server, "/song/url?id=").concat(musicId, "&cookie=").concat(this.cookie)).then(function (res) { return res.json(); }).then(function (data) {
            var d = data.data;
            // 定义歌曲Url变量并赋值
            var musicUrl = d[0].url;
            callback(musicUrl);
        });
    };
    // 获取FM播放列表
    Netease.prototype.getFMList = function (callback, onerr) {
        fetch("".concat(exports.server, "/personal_fm?cookie=").concat(this.cookie, "&timestamp=").concat(new Date().getTime())).then(function (res) { return res.json(); }).then(function (data) {
            if (data.code != 200) {
                onerr();
                return;
            }
            // FM歌曲列表对象
            var fms = data.data;
            callback(fms);
        });
    };
    return Netease;
}());
exports.default = Netease;
