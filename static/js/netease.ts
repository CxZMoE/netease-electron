import { remote } from 'electron';
const fs = remote.require('fs');
const http = remote.require('http');
import Dialog from './dialog'
import { USR_CONFIG_DIR } from './nel'

export const server = "http://127.0.0.1:3000"
class Netease {
    server: String // 服务器地址
    data: any // 登录用户数据
    cookie: String
    currentLyric: any[]
    loginStatus: Boolean;

    player: HTMLAudioElement
    constructor(player) {
        this.server = server;
        this.player = player;
        this.loginStatus = false;
    }
    // 写入用户配置文件
    writeConfig(data) {
        fs.writeFile(`${USR_CONFIG_DIR}/login.json`, data, (err) => {
            if (err) {
                return console.error(err)
            }
        })
    }

    // 登录
    login(username, password) {
        console.log('login')
        http.get(`${server}/login?email=${username}&password=${password}`, (res) => {
            console.log('login http')
            res.on('data', (chunk) => {
                console.log('end')
                let data = JSON.parse(chunk)
                console.log(data)
                // 保存登录信息
                if (data.code != 502) {
                    this.data = data;
                    console.log(this.data);
                    this.cookie = this.data.cookie
                    new Notification("通知", {
                        body: "登录成功"
                    })
                    document.getElementById("loginLabel").innerText = "已登录"
                    this.loginStatus = true
                    this.writeConfig(String(chunk))
                    let d = new Dialog()
                    d.closeDialog("loginDialog")
                    remote.getCurrentWindow().reload()

                } else {
                    fs.unlink(`${USR_CONFIG_DIR}/login.json`, (err) => {
                        new Notification("登录失败", {
                            body: "账号或密码错误"
                        })
                        return
                    })
                    //alert("密码错误：" + str)
                }
            })
        })
    }

    // 签到
    qd() {
        http.get(`${server}/daily_signin?type=0&cookie=${this.cookie}`, (res) => {
            
             
            res.on('data', (str) => {
                let data = JSON.parse(str)
                if (res.statusCode == 200) {
                    new Notification("通知", { body: "安卓签到成功，积分+3" })
                    http.get(`${server}/daily_signin?type=0&cookie=${this.cookie}`, (res) => {
                        
                        res.on('data', (chunk) => {
                            str += chunk
                        })
                        res.on('data', (str) => {
                            let data = JSON.parse(str)
                            if (res.statusCode == 200) {
                                new Notification("通知", { body: "PC/Web签到成功，积分+2" })
                            } else if (data.code == -2) {
                                new Notification("通知", { body: "您今天已经签到过了>w<" })
                            } else {
                                //alert(str)
                                new Notification("通知", { body: "PC/Web签到失败" })
                            }
                        })
                    })
                } else if (data.code == -2) {
                    new Notification("通知", { body: "您今天已经签到过了>w<" })
                } else {
                    //alert(str)
                    new Notification("通知", { body: "安卓签到失败" })
                }
            })
        })
    }

    // 登出
    logout(username, password) {

        http.get(`${server}/logout`, (res) => {


            res.on('data', (str) => {

                // 保存登录信息
                if (res.statusCode == 200) {
                    fs.unlink(`${USR_CONFIG_DIR}/login.json`, (err) => {
                        //console.log(err)
                        new Notification("通知", {
                            body: "登出失败"
                        })
                        return
                    })
                    new Notification("通知", {
                        body: "登出成功"
                    })
                }

            })
        })
    }

    // 获取音乐URL
    getMusicUrl(musicId, callback) {
        http.get(`${server}/song/url?id=${musicId}&cookie=${this.cookie}`, (res) => {
            
             
            res.on('data', (str) => {
                let data = JSON.parse(str).data
                // 定义歌曲Url变量并赋值
                let musicUrl = data[0].url
                callback(musicUrl);
            }
            )
        })
    }

    // 获取FM播放列表
    getFMList(callback, onerr?: Function) {
        http.get(`${server}/personal_fm?cookie=${this.cookie}&timestamp=${new Date().getTime()}`, (res) => {
            
             
            res.on('data', (str) => {
                if (res.statusCode != 200) {
                    onerr();
                    return
                }

                // FM歌曲列表对象
                let fms = JSON.parse(str).data
                callback(fms)
            })
        })
    }


}

export default Netease;