/**
 * author: CxZMoE
 * @email: cxzmoe@aliyun.com
 */

const { app, BrowserWindow, Tray,Menu } = require('electron')
const process = require('child_process')
require('@electron/remote/main').initialize()
// try{
//     require('electron-reloader')(module)
// }catch(_){}

// 启动api
console.log("API PATH:", `${__dirname}/NeteaseCloudMusicApi/app.js`);
var neteaseApi = process.execFile("node",
    [`${__dirname}/NeteaseCloudMusicApi/app.js`]
    ,
    {
        "env": "PORT=3000",
        "maxBuffer": 999999,
    },(err, stdout)=>{
        // console.log(stdout)
        if (err){
            console.log(err)
            return
        }
    }
)
console.log(neteaseApi)
// var neteaseApi = process.exec(`set PORT=3000 && node ${__dirname}/NeteaseCloudMusicApi/app.js`,(err,stdout)=>{
//     console.log(stdout)
//     if (err){
//         console.log(err)
//         return
//     }
// })

let win = null
function createWindow(title, width, height) {
    win = new BrowserWindow({
        title: title,
        width: width,
        height: height,
        resizable: true,
        maximizable: true,
        center: true,
        hasShadow:true,
        autoHideMenuBar: true,
        frame: true,
        minWidth: 800,
        minHeight: 600,
        opacity: 0.95,
        titleBarOverlay: {
            color: '#000000',
            symbolColor: '#FF0000',
            height: '50px'
        },
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            worldSafeExecuteJavaScript: false,
            devTools: true
        },
        icon: __dirname + "/static/pics/BILIBILI.png"

    })
    require("@electron/remote/main").enable(win.webContents);
    win.menuBarVisible = false;
    // win.webContents.openDevTools()
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
    neteaseApi.kill('SIGKILL')
})