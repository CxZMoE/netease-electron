const { readFile } = require("fs")
const { remote } = require('electron')
// 用户目录

const CONFIG_DIR = remote.app.getPath("home") + "/.moe.cxz.netease-electron"
if (require('fs').exists(CONFIG_DIR, (e) => {
    if (!e) {
        //console.log("用户配置文件未找到")
        require('fs').mkdir(CONFIG_DIR, { mode: "0755" }, () => {
            //console.log("创建用户配置文件目录")
        })
    }
}))
    //console.log("home:" + USER_HOME)


    var loginInterval = {}

// 进度条开始移动
var moveProgressPin = false



window.onload = function () {
    var player = document.getElementById("player")

    http.get(`${server}/app/log?name=netease-electron&version=v1.1`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })

        // 用于统计用户数量
        res.on('end', () => {
            //console.log("记录统计信息：" + data)
        })
    })

    // 全局timer
    var globalTimer = setInterval(() => {
        let sheetListBox = document.getElementById("sheetListBox")
        let playList = document.getElementById("playList")
        // 突出显示当前播放歌曲
        if (player.getAttribute("mode") != "fm") {
            if (sheetListBox != undefined) {
                for (let i = 0; i < sheetListBox.children.length; i++) {
                    sheetListBox.children.item(i).style.backgroundColor = "#303030"
                    sheetListBox.children.item(player.getAttribute("index")).style.backgroundColor = "#1e1e1e"
                }
            }
            if (playList.children.length > 0) {
                for (let i = 0; i < playList.children.length; i++) {
                    playList.children.item(i).style.backgroundColor = "#303030"
                    playList.children.item(player.getAttribute("index")).style.backgroundColor = "#1e1e1e"
                }
            }
        }

        // 更新播放按钮状态
        let status = player.getAttribute("status")
        let playBtn = document.getElementById("playerPlay")
        if (status == 'pause') {
            playBtn.setAttribute('src', '../pics/play.png')

        } else if (status == 'stop') { // 如果是停止
            playBtn.setAttribute('src', '../pics/play.png')
        } else {
            playBtn.setAttribute('src', '../pics/pause.png')

        }
    }, 500);


    // 绑定全局按键
    bindGlobalShortcut()



    // 播放器播放模式设置为默认模式
    player.setAttribute("mode", "normal")

    // 播放列表开关
    {
        let playlistBtn = document.getElementById("playlistBtn")
        let playlistBox = document.getElementById("playlistBox")
        let playList = document.getElementById("playList")
        playlistBtn.addEventListener('click', (e) => {
            if (playlistBox.style.height == "300px")
                playlistBox.style.height = "0px"
            else {
                playlistBox.style.height = "300px"
                playlistBox.scrollTop = playList.children.item(player.getAttribute("index")).offsetTop - 155
            }
        })
    }

    // 播放模式按钮事件
    {
        let playmodeBtn = document.getElementById("playmodeBtn")
        playmodeBtn.addEventListener("click", () => {
            switch (playMode) {
                case "list-loop":
                    playMode = "single-loop"
                    playmodeBtn.setAttribute("src", "../pics/single-loop.png")
                    break
                case "single-loop":
                    playMode = "random"
                    playmodeBtn.setAttribute("src", "../pics/random.png")
                    break
                case "random":
                    playMode = "list-loop"
                    playmodeBtn.setAttribute("src", "../pics/loop.png")
                    break
                default:
                    break
            }
        })

    }
    // 评论消失事件
    document.addEventListener('click', (e) => {
        let scb = document.getElementById("addcommentBox")
        let searchBox = document.getElementById("searchBox")

        if (scb != null && e.target.parentNode != scb && e.target != scb) {

            scb.remove()
        }

        if (searchBox != null && e.target.parentNode != searchBox && e.target != searchBox) {
            searchBox.style.height = "0px"
            searchBox.style.visibility = "hidden"

        }


    })

    // 隐藏窗口事件
    document.getElementById("titlebar").addEventListener("dblclick", (e) => {
        e.stopPropagation()
        require('electron').remote.BrowserWindow.getFocusedWindow().hide()
        require('electron').remote.getGlobal("windowHided").is = true
    })

    // 事先加载搜索页面
    readFile(path.join(__dirname, "../pages/search.html"), (err, data) => {
        let body = document.getElementsByTagName("body")[0]
        let searchBox = document.createElement("DIV")
        // <div id="searchBox" class="search-box">
        searchBox.setAttribute("id", "searchBox")
        searchBox.className = "search-box"
        searchBox.innerHTML = data

        body.appendChild(searchBox)

        // 搜索事件
        let searchKeywords = document.getElementById("searchKeywords")
        searchKeywords.addEventListener("input", (e) => {
            //if (e.keyCode != 13) {
            //    ////console.log(e.keyCode)
            //    return
            //}

            http.get(`${server}/search?keywords=${e.target.value}`, (res) => {
                let str = ''
                res.on('data', (chunk) => {
                    str += chunk
                })
                res.on('end', () => {
                    let data = JSON.parse(str)
                    if (data == undefined) {
                        //console.log(str)
                        return
                    }

                    // 搜索结果数组
                    let results = data.result.songs
                    let resultBox = document.getElementById("searchResultBox")
                    resultBox.innerHTML = ""
                    let ul = document.createElement("UL")
                    ul.className = "sheet-list-box"
                    resultBox.appendChild(ul)
                    for (let i = 0; i < results.length; i++) {
                        let li = document.createElement("LI")
                        li.className = "sheet-list-item"
                        // 音乐名称
                        li.innerText = results[i].name
                        // 音乐ID
                        li.setAttribute("musicID", results[i].id)


                        li.setAttribute('index', i)

                        // 添加列表子项
                        ul.appendChild(li)
                        li.addEventListener("click", (e) => {
                            e.stopPropagation()
                            // 获取音乐详情
                            http.get(`${server}/song/detail?ids=${li.getAttribute("musicID")}`, (res) => {

                                let str = ''
                                res.on('data', (chunk) => {
                                    str += chunk
                                })
                                res.on('end', () => {
                                    let data = JSON.parse(str)
                                    if (data == undefined) {
                                        //console.log(str)
                                        return
                                    }
                                    let song = data.songs[0]
                                    // 封面
                                    li.setAttribute("cover", song.al.picUrl)


                                    // 作者
                                    let authors = song.ar
                                    let author = ''
                                    for (let i = 0; i < authors.length; i++) {
                                        if (i == authors.length - 1) {
                                            author += authors[i].name
                                            continue
                                        }
                                        author += authors[i].name + "/"
                                    }

                                    // 获取音乐URL
                                    http.get(`${server}/song/url?id=${li.getAttribute('musicID')}&cookie=${cookie}`, (res) => {
                                        let str = ''
                                        res.on('data', (chunk) => {
                                            str += chunk
                                        })
                                        res.on('end', () => {
                                            let data = JSON.parse(str).data
                                            if (data == undefined) {
                                                getMusicDetailForLiClick(li)
                                                return
                                            }
                                            let musicUrl = JSON.parse(str).data[0].url



                                            let searchItem = [{ "name": li.innerText, "id": li.getAttribute('musicID'), "cover": li.getAttribute('cover'), "author": author }]

                                            searchItem.push.apply(searchItem, mainplaylist)
                                            mainplaylist = searchItem
                                            searchItem = null

                                            player.setAttribute('index', 0)
                                            player.setAttribute('src', musicUrl)
                                            player.play()
                                            updateCover(li.getAttribute("cover"))
                                            player.setAttribute('status', 'play')
                                            player.setAttribute('now', li.getAttribute('musicID'))

                                            // 隐藏搜索框
                                            searchBox.style.height = "0px"
                                            searchBox.style.visibility = "hidden"
                                        })
                                    })
                                })
                            })

                        })
                    }
                })
            })
        })
    })

    // 搜索页面展现事件
    document.addEventListener("keydown", (e) => {
        if (!(e.keyCode == 83 && e.ctrlKey)) {
            return
        }
        e.stopPropagation()
        let searchBox = document.getElementById("searchBox")
        let searchKeywords = document.getElementById("searchKeywords")

        if (searchBox.style.visibility == "visible") {
            searchBox.style.visibility = "hidden"
            searchBox.style.height = "0px"

            searchKeywords.blur()
        } else {
            searchBox.style.visibility = "visible"
            searchBox.style.height = "200px"
            searchKeywords.focus()
        }


    })

    // 登录按钮事件
    document.getElementById("login").addEventListener('click', (e) => {
        // 登录
        if (loginStatus == false) {
            dialog.newLoginDialog("loginDialog")

        } else {
            qd()
        }
    })

    readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
        document.getElementById("mainPage").innerHTML = data
        player.setAttribute("currentPage", "home")
    })

    // 登陆状态判定
    fs.readFile(`${CONFIG_DIR}/login.json`, { encoding: "utf8" }, (err, data) => {
        if (err) {
            //console.error(err)
            loginStatus = false
            new Notification("通知", { body: "您还未登录，请先登录。" })
            loginData = {}
            dialog.newLoginDialog("loginDialog")
            return
        } else {
            loginData = JSON.parse(data)
            if (loginData.code == 502) {
                fs.unlink(`${CONFIG_DIR}/login.json`, (err) => {
                    new Notification("登录失败", {
                        body: "账号或密码错误"

                    })
                    dialog.newLoginDialog("loginDialog")
                    return
                })
                return
            }

            cookie = loginData.cookie

            document.getElementById("loginLabel").innerText = loginData.profile.nickname


            http.get(`${server}/login/status?cookie=${cookie}`, (res) => {
                let str = ''
                res.on('data', (chunk) => {
                    str += chunk
                })

                res.on('end', () => {
                    let data = JSON.parse(str)
                    if (data.msg == "需要登录") {
                        loginStatus = false
                        new Notification("通知", { body: "登录过期，请重新登录" })
                        loginData = {}
                        dialog.newLoginDialog("loginDialog")

                    } else {
                        // 登录正常
                        // 先获取我喜欢的音乐
                        document.getElementById("login").setAttribute("src", loginData.profile.avatarUrl)
                        if (loginData.code != 502) {
                            // 有效登录
                            loginStatus = true
                            // 初始化
                            getFav()

                            initProgrss()
                            initSidebar()
                            initPlayer()
                            // 初始化封面点击
                            initCover()

                            //alert(JSON.stringify(loginData))


                        }
                    }
                })
            })
        }
    })
}


function initCover() {


    var cover = document.getElementById('cover')
    var player = document.getElementById("player")
    cover.addEventListener("click", (e) => {
        e.stopPropagation()
        let page = player.getAttribute("currentPage")
        if (page == "music") {

            readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
                document.getElementById("mainPage").innerHTML = data
                //console.log("load sheet:" + player.getAttribute('sheet'))
                getSheet(player.getAttribute('sheet'))
                document.getElementById("player").setAttribute("currentPage", "home")
                // 加载歌词
                showLyric()
                // 更新封面
                updateCover(mainplaylist[player.getAttribute('index')].cover)
                // 加载评论
                loadComment(1)
                /// 加载喜不喜欢按钮
                loadLikeBtn()
                loadCollectBtn()
                //loadDislikeBtn()
                // 加载开始评论按钮
                loadAddcommentBtn()
            })
        } else {
            loadMusicPage()
        }

    })
}



// 初始化播放进度条
function initProgrss() {
    // 为播放条添加拖拽效果
    var progressPin = document.getElementById("progressPin")
    var progress = document.getElementById("progress")
    var player = document.getElementById("player")
    var ctlabel = document.getElementById("currentTimeLabel")
    // 处理拖动
    progressPin.addEventListener('mousedown', (e) => {
        progressPin.setAttribute("l_x", e.x)
        moveProgressPin = true
    })
    progressPin.addEventListener('mouseup', (e) => {

        let l_x = progressPin.getAttribute("l_x")
        let toTime = ((l_x - progress.getBoundingClientRect().x) / progress.getBoundingClientRect().width) * player.getAttribute("length")
        player.currentTime = toTime

        moveProgressPin = false
    })
    progressPin.addEventListener('mouseout', (e) => {
        moveProgressPin = false
    })

    progressPin.addEventListener('mousemove', (e) => {
        if (moveProgressPin) {

            let rect = progressPin.getBoundingClientRect()

            // 上一次坐标
            let l_x = progressPin.getAttribute("l_x")
            let toTime = ((l_x - progress.getBoundingClientRect().x) / progress.getBoundingClientRect().width) * player.getAttribute("length")
            ctlabel.innerText = parseInt(toTime / 60) + ":" + parseInt(toTime % 60)
            // 移动
            progressPin.style.left = rect.x + (e.x - l_x) + 'px'

            // 设置上一次坐标
            progressPin.setAttribute("l_x", e.x)
        }

    })
}

// 初始化侧边栏事件
function initSidebar() {

    // 歌单按钮点击
    var sheetBtn = document.getElementById("sheetBtn")
    sheetBtn.addEventListener("click", function (e) {
        e.stopPropagation()
        readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
            document.getElementById("mainPage").innerHTML = data
            getSheets()
            document.getElementById("player").setAttribute("currentPage", "home")
            player.setAttribute("mode", "normal")
        })

    })

    // 我喜欢的音乐按钮点击
    var favBtn = document.getElementById("favBtn")
    favBtn.addEventListener("click", function (e) {
        e.stopPropagation()
        readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
            document.getElementById("mainPage").innerHTML = data
            getFav()
            document.getElementById("player").setAttribute("currentPage", "home")
            player.setAttribute("mode", "normal")
        })

    })

    // 私人FM点击
    var fmBtn = document.getElementById("fmBtn")
    fmBtn.addEventListener("click", function (e) {
        e.stopPropagation()
        player.setAttribute("mode", "fm")

        loadMusicPage()

    })

    // 心跳点击
    var heartBtn = document.getElementById("heart")
    heartBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        // getFav()
        getHeart()
    })

    // 每日推荐被点击
    var dailyRecommendBtn = document.getElementById("dailyRecommendBtn")
    dailyRecommendBtn.addEventListener("click", function (e) {
        e.stopPropagation()
        player.setAttribute("mode", "normal")
        readFile(path.join(__dirname, "../pages/sheetlist.html"), (err, data) => {
            document.getElementById("mainPage").innerHTML = data
            loadDailyRecommandedSongs()
            document.getElementById("player").setAttribute("currentPage", "home")
            player.setAttribute("mode", "normal")
        })

    })
}

// 初始化播放器
function initPlayer() {
    // 获取播放器控件
    var player = document.getElementById("player")

    // 设置初始播放序号
    player.setAttribute('index', 0)
    // 初始状态为停止
    player.setAttribute('status', 'stop')


    // 播放完毕时候下一首
    player.addEventListener('ended', function () {
        // 下一首
        next()
    })

    let x = progressPin.getClientRects().item(0).x

    // 更新播放进度
    player.addEventListener('timeupdate', function (e) {

        // 在不拖动进度滑块的时候做：
        if (!moveProgressPin) {
            // 当前播放时间（秒） 标签
            var ctlabel = document.getElementById("currentTimeLabel")
            // 歌曲长度（秒） 标签
            var lengthLabel = document.getElementById("lengthLabel")

            let musicLength = player.getAttribute('length')
            // 更新当前时间
            ctlabel.innerText = parseInt(player.currentTime / 60) + ":" + parseInt(player.currentTime % 60)

            // 更新总时长
            lengthLabel.innerText = parseInt(musicLength / 60) + ":" + parseInt(musicLength % 60)

            // 标记歌曲进度
            let progress = player.currentTime / player.duration

            // progress为播放进度百分比小数形式
            player.setAttribute('progress', progress)

            // 当前时间（秒）
            player.setAttribute('time', parseInt(player.currentTime))

            // 获取进度条滑块
            var progressPin = document.getElementById("progressPin")
            // 获取进度条
            var progressBar = document.getElementById("progress")

            // 计算进度条位置偏移
            let offset = progressBar.clientWidth * progress
            // 移动进度条
            progressPin.style.left = x + offset + 'px'
        }

    })

    // 加载完毕后设置长度参数
    player.addEventListener('canplay', () => {
        player.setAttribute('length', player.duration)

        // 更新封面
        let cover = mainplaylist[player.getAttribute('index')].cover
        updateCover(cover)
        document.getElementById("musicTitle").innerText = "正在播放：" + mainplaylist[player.getAttribute('index')].name //+ " - " + mainplaylist[player.getAttribute('index')].author


        // 显示歌词
        clearInterval(lyricInterval)
        if (player.getAttribute("currentPage") == 'music') {
            showLyric()
            loadComment(1)
        }

    })

    // 错误处理
    player.addEventListener('error', (e) => {
        new Notification("无法播放", {
            body: "无法播放，可能是没有版权或者权限。"
        })
        //console.log("无法播放，可能是没有版权或者权限。")
        //console.log(player)

        next()
    })
    // Buttons
    let lastBtn = document.getElementById("playerLast")
    let playBtn = document.getElementById("playerPlay")
    let nextBtn = document.getElementById("playerNext")

    // 绑定按钮的事件
    nextBtn.addEventListener('click', function () {
        next()
    })

    lastBtn.addEventListener('click', function () {
        last()
    })

    playBtn.addEventListener('click', function () {
        play()
    })



}

/**
 *  绑定全局按键
 */

function bindGlobalShortcut() {
    // 绑定全局案件
    let globalShortcut = require('electron').remote.globalShortcut
    let nextKey = 'CommandOrControl+Alt+Right'
    let lastKey = 'CommandOrControl+Alt+Left'
    let playPauseKey = `CommandOrControl+Alt+P`
    let volUpKey = `CommandOrControl+Alt+Up`
    let volDownKey = `CommandOrControl+Alt+Down`


    let nextShortcut = globalShortcut.register(nextKey, () => {
        next()
        if (!nextShortcut) {
            //console.log("注册按键失败")
        }
    })
    let lastShortcut = globalShortcut.register(lastKey, () => {
        last()
        if (!lastShortcut) {
            //console.log("注册按键失败")
        }
    })

    let playPauseShortcut = globalShortcut.register(playPauseKey, () => {
        play()
        if (!playPauseShortcut) {
            //console.log("注册按键失败")
        }
    })

    let volUpKeyShortcut = globalShortcut.register(volUpKey, () => {
        if (player.volume <= 0.8) {
            player.volume += 0.2
        }
        //console.log("音量：" + player.volume)
        if (!volUpKeyShortcut) {
            //console.log("注册按键失败")
        }
    })

    let volDownKeyShortcut = globalShortcut.register(volDownKey, () => {
        if (player.volume >= 0.2) {
            player.volume -= 0.2
        }
        //console.log("音量：" + player.volume)
        if (!volDownKeyShortcut) {
            //console.log("注册按键失败")
        }
    })
}

// 绑定全局案件
let globalShortcut = require('electron').remote.globalShortcut
globalShortcut.unregisterAll()

let nextKey = 'CommandOrControl+Alt+Right'
let lastKey = 'CommandOrControl+Alt+Left'
let playPauseKey = `CommandOrControl+Alt+P`
let nextShortcut = globalShortcut.register(nextKey, () => {
    next()
    if (!nextShortcut) {
        //console.log("注册按键失败")
    }
})
let lastShortcut = globalShortcut.register(lastKey, () => {
    next()
    if (!lastShortcut) {
        //console.log("注册按键失败")
    }
})

let playPauseShortcut = globalShortcut.register(playPauseKey, () => {
    play()
    if (!playPauseShortcut) {
        //console.log("注册按键失败")
    }
})

/**
 *  播放控制
 */

// 播放
function play() {

    // 获取播放器控件


    // 获取播放状态
    let status = player.getAttribute('status')

    // 获取播放按钮
    let playBtn = document.getElementById("playerPlay")


    // 如果是暂停
    if (status == 'pause') {
        player.play()
        player.setAttribute('status', 'play')
        // 暂停图标
        playBtn.setAttribute('src', '../pics/pause.png')

    } else if (status == 'stop') { // 如果是停止

        player.currentTime = 0
        player.play()
        // 播放列表项目数量 争议 是否需要重新获取歌曲URL
        //let count = player.getAttribute("count")
        // 播放地址
        /*
        if ( count > 0) {
            http.get(`${server}/song/url?id=${[0].id}&cookie=${cookie}`, (res) => {
                let str = ''
                res.on('data', (chunk) => {
                    str += chunk
                })
                res.on('end', () => {
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
    } else {
        player.pause()
        player.setAttribute('status', 'pause')
        // 播放图标
        playBtn.setAttribute('src', '../pics/play.png')

    }
}

// 上一首
function last() {

    // 获取播放器控件
    // 设置上次播放的歌曲ID和序号
    player.setAttribute("last", player.getAttribute('now'))
    player.setAttribute("lastIndex", player.getAttribute("index"))


    // 播放列表数量
    let count = mainplaylist.length

    if (player.getAttribute('index') == 0) {
        player.setAttribute('index', count - 1)
    } else {
        player.setAttribute('index', Number(player.getAttribute('index')) - 1)
    }

    // 获取歌曲播放地址
    http.get(`${server}/song/url?id=${mainplaylist[player.getAttribute('index')].id}&cookie=${cookie}`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            let musicUrl = JSON.parse(str).data[0].url
            player.setAttribute('src', musicUrl)
            player.play()

            player.setAttribute('status', 'play')
            player.setAttribute('now', mainplaylist[player.getAttribute('index')].id)
        })
    })
}

// 下一首
function next() {
    // 获取播放器控件


    // 设置上次播放的歌曲ID和序号
    player.setAttribute("last", player.getAttribute('now'))
    player.setAttribute("lastIndex", player.getAttribute("index"))

    let mode = player.getAttribute("mode")

    if (mode == "fm" && player.getAttribute('index') == "0") {
        loadFM()

        return
    }


    // 播放列表数量
    let count = Number(player.getAttribute("count"))

    // 设置这次播放的歌曲ID和序号
    // 列表循环
    switch (playMode) {
        case "list-loop":
            {
                if (player.getAttribute('index') == count - 1) {
                    player.setAttribute('index', 0)
                } else {
                    player.setAttribute('index', Number(player.getAttribute('index')) + 1)
                }
                break
            }
        case "single-loop":
            {
                player.setAttribute('index', player.getAttribute('index'))
                break
            }
        case "random":
            {
                player.setAttribute('index', parseInt(player.getAttribute("count") * Math.random()))
                break
            }
        default:
            break
    }


    http.get(`${server}/song/url?id=${mainplaylist[player.getAttribute('index')].id}&cookie=${cookie}`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {

            // 更新封面
            let cover = mainplaylist[player.getAttribute('index')].cover
            updateCover(cover)

            // 播放地址
            let musicUrl = JSON.parse(str).data[0].url
            player.setAttribute('src', musicUrl)
            player.play()

            // 设置当前播放的音乐ID
            player.setAttribute('now', mainplaylist[player.getAttribute('index')].id)

            // 修改播放器播放状态为播放
            player.setAttribute('status', 'play')

        })
    })
}