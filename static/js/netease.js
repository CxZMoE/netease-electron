"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const remote = require("@electron/remote");
const fs = remote.require('fs');
const http = remote.require('http');
const dialog_1 = require("./dialog");
const nel_1 = require("./nel");
exports.server = "http://127.0.0.1:3000";
class Netease {
    constructor(player) {
        this.server = exports.server;
        this.player = player;
        this.loginStatus = false;
    }
    // 写入用户配置文件
    writeConfig(data) {
        fs.writeFile(`${nel_1.USR_CONFIG_DIR}/login.json`, data, (err) => {
            if (err) {
                return console.error(err);
            }
        });
    }
    // 登录
    login(username, password) {
        console.log('login');
        fetch(`${exports.server}/login?email=${username}&password=${password}`).then(res => res.json()).then(data => {
            console.log('end');
            console.log(data);
            // 保存登录信息
            if (data.code != 502) {
                this.data = data;
                console.log(this.data);
                this.cookie = this.data.cookie;
                new Notification("通知", {
                    body: "登录成功"
                });
                document.getElementById("loginLabel").innerText = "已登录";
                this.loginStatus = true;
                this.writeConfig(JSON.stringify(data));
                let d = new dialog_1.default();
                d.closeDialog("loginDialog");
                remote.getCurrentWindow().reload();
            }
            else {
                fs.unlink(`${nel_1.USR_CONFIG_DIR}/login.json`, (err) => {
                    new Notification("登录失败", {
                        body: "账号或密码错误"
                    });
                    return;
                });
                //alert("密码错误：" + str)
            }
        });
    }
    // 签到
    qd() {
        fetch(`${exports.server}/daily_signin?type=0&cookie=${this.cookie}`).then(res => res.json()).then(data => {
            if (data.code == 200) {
                new Notification("通知", { body: "安卓签到成功，积分+3" });
                fetch(`${exports.server}/daily_signin?type=0&cookie=${this.cookie}`).then(res => res.json()).then(data => {
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
    }
    // 登出
    logout(username, password) {
        fetch(`${exports.server}/logout`).then(res => res.json()).then(data => {
            // 删除登录信息
            if (data.code == 200) {
                fs.unlink(`${nel_1.USR_CONFIG_DIR}/login.json`, (err) => {
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
    }
    // 获取音乐URL
    getMusicUrl(musicId, callback) {
        fetch(`${exports.server}/song/url?id=${musicId}&cookie=${this.cookie}`).then(res => res.json()).then(data => {
            let d = data.data;
            // 定义歌曲Url变量并赋值
            let musicUrl = d[0].url;
            callback(musicUrl);
        });
    }
    // 获取FM播放列表
    getFMList(callback, onerr) {
        fetch(`${exports.server}/personal_fm?cookie=${this.cookie}&timestamp=${new Date().getTime()}`).then(res => res.json()).then(data => {
            if (data.code != 200) {
                onerr();
                return;
            }
            // FM歌曲列表对象
            let fms = data.data;
            callback(fms);
        });
    }
}
exports.default = Netease;
//# sourceMappingURL=netease.js.map