/**
 * author: CxZMoE
 * @email: cxzmoe@aliyun.com
 */

const electron = require('electron')
const { app, BrowserWindow, Tray,Menu } = require('electron')
const process = require('child_process')

// 启动api
/*
var neteaseApi = process.exec("PORT=50505 node ./NeteaseCloudMusicApi/app.js",(err,stdout)=>{
    console.log(stdout)
    if (err){
        console.log(err)
        return
    }
})
*/

let win = null
function createWindow(title, width, height) {
    win = new BrowserWindow({
        title: title,
        width: width,
        height: height,
        resizable: false,
        maximizable: true,
        center: true,
        hasShadow:true,
        autoHideMenuBar: true,
        frame:false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
            
        },
        icon: __dirname + "/static/pics/BILIBILI.png"

    })

    win.setMenu(null)
    
    win.loadFile(__dirname +"/static/pages/index.html")
}
let tray = null
global.windowHided = {is:false}

app.on('ready', function () {
    createWindow("网易云音乐 Electron", 800, 600)
    tray = new Tray(__dirname + "/static/pics/BILIBILI.png")
    tray.setTitle("网易云音乐 Electron")
    const contextMenu = Menu.buildFromTemplate([
        {label:"显示",type: "normal"},
        {label:"隐藏到托盘",type: "normal"},
        {label:"关闭",type: "normal"}
    ])
    tray.setContextMenu(contextMenu)
    contextMenu.items[0].click = ()=>{
        BrowserWindow.fromId(win.id).show()
        global.windowHided.is = true
    }
    contextMenu.items[1].click = ()=>{
        BrowserWindow.fromId(win.id).hide()
        global.windowHided.is = true
    }
    contextMenu.items[2].click = ()=>{
        BrowserWindow.fromId(win.id).close()
        app.exit()
    }
    tray.setToolTip('网易云音乐Electron')
})

app.on('will-quit', function () {
    // 解绑全局按键
    let globalShortcut = require('electron').remote.globalShortcut
    globalShortcut.unregisterAll()

    // 退出网易云API
    neteaseApi.kill("SIGKILL")
})