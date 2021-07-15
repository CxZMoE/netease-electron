const fs = require("fs")
const http = require("http")
const { url } = require("inspector")
const { time, clear } = require("console")
const path = require("path")
const { fileURLToPath } = require("url")
const { stringify } = require("querystring")
const server = "http://127.0.0.1:50505"
//const server = "http://39.108.90.170:50505"
const analyze = "http://39.108.90.170:3333"

var dialog = new Dialog()

var loginData = {}
// 登录状态
var loginStatus = false

// 播放列表储存在这里
var cookie = ''
var currentLyric = []

var firstLoad = true

var playMode = "list-loop"

//var  = []
// 上一次点击的歌单，如果歌单内的歌曲被播放，则播放列表()切换到歌单

// 每日歌单列表
var dailySheet = []

// 私人FM列表
var fmSheet = []

// 播放列表
var mainplaylist = []
var mainplaylist_id = ""

// 歌词计时器
var lyricInterval = {}

// 写入用户配置文件
function writeConfig(data) {
    fs.writeFile(`${CONFIG_DIR}/login.json`, data, (err) => {
        if (err) {
            return console.error(err)
        }
    })
}

// 登录
function login(username, password) {
    http.get(`${server}/login?email=${username}&password=${password}`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk

        })

        res.on('end', () => {
            let data = JSON.parse(str)
            console.log(data)
            // 保存登录信息
            if (data.code != 502) {
                loginData = JSON.parse(str)
                cookie = loginData.cookie
                new Notification("通知", {
                    body: "登录成功"
                })
                document.getElementById("loginLabel").innerText = "已登录"
                loginStatus == true
                writeConfig(str)
                let d = new Dialog()
                d.closeDialog("loginDialog")
                require('electron').remote.getCurrentWindow().reload()

            } else {
                fs.unlink(`${CONFIG_DIR}/login.json`, (err) => {
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
function qd() {
    http.get(`${server}/daily_signin?type=0&cookie=${cookie}`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            let data = JSON.parse(str)
            if (res.statusCode == 200) {
                new Notification("通知", { body: "安卓签到成功，积分+3" })
                http.get(`${server}/daily_signin?type=0&cookie=${cookie}`, (res) => {
                    let str = ''
                    res.on('data', (chunk) => {
                        str += chunk
                    })
                    res.on('end', () => {
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
function logout(username, password) {

    http.get(`${server}/logout`, (res) => {

        let str = ''
        res.on('data', (chunk) => {
            str += chunk

        })

        res.on('end', () => {

            // 保存登录信息
            if (res.statusCode == 200) {
                fs.unlink(`${CONFIG_DIR}/login.json`, (err) => {
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

// 获取我喜欢的音乐
function getFav() {
    let uid = loginData.account.id
    let sheetListBox = document.getElementById("sheetListBox")
    http.get(`${server}/user/playlist?uid=${uid}`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            if (res.statusCode == 200) {
                //console.log("获取我最喜欢的音乐")
                let sheetlist = JSON.parse(str).playlist
                // 清空内容
                sheetListBox.innerHTML = ""

                // 设置当前歌单为我喜欢的音乐
                player.setAttribute("sheet", sheetlist[0].id)

                // 设置当前播放的歌单名称
                player.setAttribute('sheetName', sheetlist[0].name)

                // 获取歌单歌曲列表
                getSheet(sheetlist[0].id)


            }
        })

    })
}

// 获取心跳模式
function getHeart(){
    let mid = mainplaylist[player.getAttribute('index')].id
    let sheetid = mainplaylist_id
    let url = `${server}/playmode/intelligence/list?id=${mid}&pid=${sheetid}&cookie=${cookie}`
    //console.log("get heart:"+url)
    http.get(url,(res)=>{
        let str = ''
        res.on('data',(chunk)=>{
            str += chunk
        })
        res.on('end',()=>{
            if (res.statusCode == 200){
                //console.log("获取心跳模式歌单")
                //console.log(str)
                let sheetlist = JSON.parse(str).data
                // 清空内容
                sheetListBox.innerHTML = ""

                // 设置当前歌单为我喜欢的音乐
                player.setAttribute("sheet", sheetid)

                // 设置当前播放的歌单名称
                player.setAttribute('sheetName', sheetlist[0].songInfo.name)
                // 获取歌单歌曲列表
                getSheet("heart",sheetlist)
            }
        })
    })
}


// 绑定实时当前歌单显示框
function attachPlaylist() {
    let sheetListBox = document.getElementById("sheetListBox")
    // 只有在不是私人FM模式下才执行
    if (player.getAttribute("mode") != "fm") {
        let playList = document.getElementById("playList")
        let playlistSheetName = document.getElementById("playlistSheetName")

        playlistSheetName.innerText = player.getAttribute("sheetName")

        playList.innerHTML = ""
        //console.log("attach:" + sheetListBox)
        for (let i = 0; i < sheetListBox.children.length; i++) {

            let c = sheetListBox.children.item(i).cloneNode(true)
            c.getElementsByTagName("P")[0].innerText = c.getElementsByTagName("P")[0].innerText.split("-")[0]
            c.addEventListener('click', () => {
                player.setAttribute("mode", "normal")

                // 初始化主播放列表
                initMainPlaylist(playList)
                //attachPlaylist()
                // 设置上次播放的歌曲ID
                player.setAttribute("last", player.getAttribute('now'))
                // 设置上次播放的序号
                player.setAttribute("lastIndex", player.getAttribute("index"))

                // 设置当前播放的index
                player.setAttribute('index', c.getAttribute('index'))

                // 获取歌曲播放Url
                sourceMusicUrl(c)

            })

            playList.appendChild(c)
        }

    }

}

// 绑定列表中歌曲名称
function bindListItemName(list, ids) {
    let ids_s = ids.split(",")
    let ids_size = ids_s.length
    let count = 0
    let t_count = 0
    let limit = 500
    if (ids_size > limit){
        //console.log("large sheet,split request.")
        let steps = parseInt(ids_size/limit)
        //console.log("size:"+ids_size+"limit:"+limit+"steps:"+steps)
        //console.log("steps:"+steps)
        for (let i=0;i<=steps;i++){
            let step = i
            let step_count = limit
            //console.log('step_count:'+step_count)
            if (i==steps){
                step_count = ids_size - (limit*steps)
            }
            t_count += step_count
            //console.log("t_count:"+t_count)
            let new_ids = ""
            //console.log("step_count"+step_count)
            for (let j=0;j<step_count;j++){
                ////console.log(ids_s[j])
                
                if (j == step_count-1){
                    new_ids = new_ids + ids_s[j] + ""
                }else{
                    new_ids = new_ids + ids_s[j] + ","
                }
            }
            
            http.get(`${server}/song/detail?ids=${new_ids}`, (res) => {
                let str = ''
                
                res.on('data', (chunk) => {
                    str += chunk
                })
                
                res.on('end', () => {
                    //console.log(`${server}/song/detail?ids=${new_ids}`)
                    ////console.log(str)
                    let songs = JSON.parse(str).songs
        
        
                    if (songs == undefined) {
                        bindListItemName(list, ids)
                        return
                    }
                    for (let i = 0; i < songs.length; i++) {
                        let item_index = step*limit+i
                        // 为列表项目绑定歌曲名
                        list.children.item(item_index).setAttribute("name", songs[i].name)
                        //console.log('['+count+']get one: '+songs[i].name)
                        
                        // 为列表项目绑定封面
                        list.children.item(item_index).setAttribute("cover", songs[i].al.picUrl)
        
                        // 为列表项目绑定专辑ID
                        list.children.item(item_index).setAttribute("albumId", songs[i].al.id)
        
                        // 为列表项目绑定专辑名称
                        list.children.item(item_index).setAttribute("albumName", songs[i].al.name)
        
                        // 为列表项目生成作者字符串
                        let authors = songs[i].ar
                        let author = ''
                        for (let i = 0; i < authors.length; i++) {
                            if (i == authors.length - 1) {
                                author += authors[i].name
                                continue
                            }
                            author += authors[i].name + "/"
                        }
        
                        list.children.item(item_index).setAttribute('author', author)
        
                        // 列表项目左侧的歌曲封面
                        let coverLeft = document.createElement("IMG")
                        coverLeft.style.float = "left"
                        coverLeft.style.width = "35px"
                        coverLeft.style.height = "35px"
                        coverLeft.setAttribute("src", songs[i].al.picUrl)
        
        
                        // 列表项目的歌曲名称
                        let p = document.createElement("P")
                        p.innerText = songs[i].name + " - " + author
                        list.children[item_index].appendChild(coverLeft)
                        list.children[item_index].appendChild(p)
        
                        count ++
        
                        if (count == ids_size - 1){
                            // 初始化主播放列表（第一次肯定为空）
                            if (firstLoad) {
                                initMainPlaylist(list)
                            }
                        }
                        
                    }
                })
                
            })
            
        }
        
    }else{
        http.get(`${server}/song/detail?ids=${ids}`, (res) => {
            let str = ''
            res.on('data', (chunk) => {
                str += chunk
            })
            
            res.on('end', () => {
                //console.log(`${server}/song/detail?ids=${ids}`)
                //console.log(str)
                let songs = JSON.parse(str).songs
    
    
                if (songs == undefined) {
                    bindListItemName(list, ids)
                    return
                }
                for (let i = 0; i < songs.length; i++) {
    
                    // 为列表项目绑定歌曲名
                    list.children.item(i).setAttribute("name", songs[i].name)
    
                    // 为列表项目绑定封面
                    list.children.item(i).setAttribute("cover", songs[i].al.picUrl)
    
                    // 为列表项目绑定专辑ID
                    list.children.item(i).setAttribute("albumId", songs[i].al.id)
    
                    // 为列表项目绑定专辑名称
                    list.children.item(i).setAttribute("albumName", songs[i].al.name)
    
                    // 为列表项目生成作者字符串
                    let authors = songs[i].ar
                    let author = ''
                    for (let i = 0; i < authors.length; i++) {
                        if (i == authors.length - 1) {
                            author += authors[i].name
                            continue
                        }
                        author += authors[i].name + "/"
                    }
    
                    list.children.item(i).setAttribute('author', author)
    
                    // 列表项目左侧的歌曲封面
                    let coverLeft = document.createElement("IMG")
                    coverLeft.style.float = "left"
                    coverLeft.style.width = "35px"
                    coverLeft.style.height = "35px"
                    coverLeft.setAttribute("src", songs[i].al.picUrl)
    
    
                    // 列表项目的歌曲名称
                    let p = document.createElement("P")
                    p.innerText = songs[i].name + " - " + author
                    list.children[i].appendChild(coverLeft)
                    list.children[i].appendChild(p)
    
    
    
    
                }
    
                // 初始化主播放列表（第一次肯定为空）
                if (firstLoad) {
                    initMainPlaylist(list)
                }
            })
        })
    }
    
}

// 生成IDS请求参数
function generateIdsList() {
    let sheetListBox = document.getElementById("sheetListBox")
    if (sheetListBox == undefined) {
        consolg.log("sheetlistbox is undefined")
    }
    let ids = ''
    ////console.log(sheetListBox)
    for (let i = 0; i < sheetListBox.children.length; i++) {
        if (i == sheetListBox.children.length - 1) {
            ids += sheetListBox.children[i].getAttribute('musicID')
        } else {
            ids += sheetListBox.children[i].getAttribute('musicID') + ','
        }
    }
    return ids
}

// 歌单项目点击后获取音乐Url
function sourceMusicUrl(li) {

    // 获取URL，添加cookie可以获取到无损
    http.get(`${server}/song/url?id=${li.getAttribute('musicID')}&cookie=${cookie}`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            let data = JSON.parse(str).data

            // 定义歌曲Url变量并赋值
            let musicUrl = data[0].url

            // 设置播放器的源地址
            player.setAttribute('src', musicUrl)

            // 开始播放

            // 如果是刚打开程序
            if (firstLoad) {
                player.setAttribute("index", 0)
                player.setAttribute("cover", mainplaylist[0].cover)
                player.setAttribute("now", mainplaylist[0].id)
                player.setAttribute("status", "pause")
                updateCover(player.getAttribute("cover"))
                //sourceMusicUrl(document.getElementById("sheetListBox").children.item(0))
                firstLoad = !firstLoad
                return
            }

            //console.log("开始播放：" + musicUrl)
            player.play()

            // 设置当前状态为《播放》
            player.setAttribute('status', 'play')

            // 绑定当前的播放音乐的ID
            player.setAttribute('now', li.getAttribute('musicID'))

            // 绑定当前播放音乐的名称
            player.setAttribute("name", li.getAttribute('name'))

            // 绑定当前播放音乐的作者名称
            player.setAttribute("author", li.getAttribute('author'))

            /**
             * // 为列表项目绑定歌曲名
                    list.children.items(i).setAttribute("name", songs[i].name)

                    // 为列表项目绑定封面
                    list.children.items(i).setAttribute("cover", songs[i].al.picUrl)

                    // 为列表项目绑定专辑ID
                    list.children.items(i).setAttribute("albumId", songs[i].al.id)

                    // 为列表项目绑定专辑名称
                    list.children.items(i).setAttribute("albumName", songs[i].al.name)
             */



        })
    })
}


// 更新封面方法
function updateCover(coverUrl) {
    //console.log("更新封面：" + coverUrl)
    // 获取左下角专辑图片框
    let cover = document.getElementById("cover")

    // 如果当前的页面是Music（音乐）页面，则同时刷新唱片的图片。
    if (document.getElementById("player").getAttribute("currentPage") == "music") {
        let diskCover = document.getElementById("diskCover")
        diskCover.setAttribute("src", coverUrl)
    }

    // 设置当前封面
    player.setAttribute("cover", coverUrl)

    // 设置左下角专辑图片框的源地址
    cover.setAttribute("src", coverUrl)
}



// 输入歌单ID，获取歌单内容
function getSheet(id,playlist) {


    if (id == "heart"){
        //mainplaylist_id = "heart"
            

    
                // 设置player的播放列表长度参数
                player.setAttribute("count", playlist.length)
    
    
                // 设置当前播放的歌单名称
                player.setAttribute('sheetName', "heart")
                // 绑定当前歌单创造者
                player.setAttribute("sheetCreator", "ai")
                // 绑定当前歌单播放数
                player.setAttribute("sheetPlayCount", 0)
                // 绑定当前歌单歌曲数
                player.setAttribute("sheetTrackCount", playlist.length)
                // 绑定当前歌单简介
                //player.setAttribute("sheetDescription", ((playlist.description == null) ? "单主很懒，没有写简介。" : playlist.description))
                // 绑定当前歌单封面
                //player.setAttribute("sheetCover", playlist.coverImgUrl)
    
                // 加载歌单详情框
                //loadSheetDetialBox(0)
    
                // 遍历所有的歌单ID以执行一些操作
                for (let i = 0; i < playlist.length; i++) {
    
                    // 创建一条列表项，每个列表项目对应一首歌
                    let li = document.createElement('LI')
    
                    // 添加样式 背景色#303030
                    li.classList.add(["sheet-list-item"])
                    li.classList.add(["light-dark"])
    
                    // 为列表项设置序号和对应音乐ID以方便点击时候直接调用获取到音乐Url
                    li.setAttribute('index', i)
                    li.setAttribute('musicID', playlist[i].id)
    
                    // 为列表项添加点击事件
                    li.addEventListener('click', () => {
    
                        // 设置上次播放的歌曲ID
                        player.setAttribute("last", player.getAttribute('now'))
                        player.setAttribute("lastIndex", player.getAttribute("index"))
    
                        // 设置当前播放的index
                        player.setAttribute('index', li.getAttribute('index'))
    
                        // 设置当前播放的歌单名称
                        player.setAttribute('sheetName', "心动模式歌单")
    
                        // 为播放器绑定播放地址，并开始播放
                        sourceMusicUrl(li)
                        //initMainPlaylist()
                        attachPlaylist()
                        // 初始化主播放列表
                        initMainPlaylist(playList)
                    })
    
    
                    sheetListBox.appendChild(li)
    
                }
    
    
                // 这个时候列表项还没有获取到歌曲名和专辑图片，需要另外获取
                // `${server}/song/detail?ids=${ids}
    
                // 为所有列表项生成综合请求参数ids，通过上面的
                // 址可以反馈到所有列表项目音乐详情的一个数组
                let ids = generateIdsList()
    
                // 为列表项绑定额外的数据
                /**
                 * // 为列表项目绑定歌曲名
                        list.children.items(i).setAttribute("name", songs[i].name)
    
                        // 为列表项目绑定封面
                        list.children.items(i).setAttribute("cover", songs[i].al.picUrl)
    
                        // 为列表项目绑定专辑ID
                        list.children.items(i).setAttribute("albumId", songs[i].al.id)
    
                        // 为列表项目绑定专辑名称
                        list.children.items(i).setAttribute("albumName", songs[i].al.name)
                 */
                bindListItemName(sheetListBox, ids)
    
                // 歌单界面形成☝
    }else{
        // 请求
    http.get(`${server}/playlist/detail?id=${id}&cookie=${cookie}`, (res) => {

        // 获取歌单列表控件
        let sheetListBox = document.getElementById("sheetListBox")
        
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            console.log(str)
            mainplaylist_id = id
            // 这里实际上获取到一个歌单的详情，不是歌单列表哦2333
            let playlist = JSON.parse(str).playlist


            // playlist.trackIds 为当前歌单的所有歌曲ID的列表（只包含ID）
            let trackIds = playlist.trackIds

            // 设置player的播放列表长度参数
            player.setAttribute("count", trackIds.length)


            // 设置当前播放的歌单名称
            player.setAttribute('sheetName', playlist.name)
            // 绑定当前歌单创造者
            player.setAttribute("sheetCreator", playlist.creator.nickname)
            // 绑定当前歌单播放数
            player.setAttribute("sheetPlayCount", playlist.playCount)
            // 绑定当前歌单歌曲数
            player.setAttribute("sheetTrackCount", playlist.trackCount)
            // 绑定当前歌单简介
            player.setAttribute("sheetDescription", ((playlist.description == null) ? "单主很懒，没有写简介。" : playlist.description))
            // 绑定当前歌单封面
            player.setAttribute("sheetCover", playlist.coverImgUrl)

            // 加载歌单详情框
            loadSheetDetialBox(0)

            // 遍历所有的歌单ID以执行一些操作
            for (let i = 0; i < trackIds.length; i++) {

                // 创建一条列表项，每个列表项目对应一首歌
                let li = document.createElement('LI')

                // 添加样式 背景色#303030
                li.classList.add(["sheet-list-item"])
                li.classList.add(["light-dark"])

                // 为列表项设置序号和对应音乐ID以方便点击时候直接调用获取到音乐Url
                li.setAttribute('index', i)
                li.setAttribute('musicID', trackIds[i].id)

                // 为列表项添加点击事件
                li.addEventListener('click', () => {

                    // 设置上次播放的歌曲ID
                    player.setAttribute("last", player.getAttribute('now'))
                    player.setAttribute("lastIndex", player.getAttribute("index"))

                    // 设置当前播放的index
                    player.setAttribute('index', li.getAttribute('index'))

                    // 设置当前播放的歌单名称
                    player.setAttribute('sheetName', playlist.name)

                    // 为播放器绑定播放地址，并开始播放
                    sourceMusicUrl(li)
                    //initMainPlaylist()
                    attachPlaylist()
                    // 初始化主播放列表
                    initMainPlaylist(playList)
                })


                sheetListBox.appendChild(li)

            }


            // 这个时候列表项还没有获取到歌曲名和专辑图片，需要另外获取
            // `${server}/song/detail?ids=${ids}

            // 为所有列表项生成综合请求参数ids，通过上面的
            // 址可以反馈到所有列表项目音乐详情的一个数组
            let ids = generateIdsList()

            // 为列表项绑定额外的数据
            /**
             * // 为列表项目绑定歌曲名
                    list.children.items(i).setAttribute("name", songs[i].name)

                    // 为列表项目绑定封面
                    list.children.items(i).setAttribute("cover", songs[i].al.picUrl)

                    // 为列表项目绑定专辑ID
                    list.children.items(i).setAttribute("albumId", songs[i].al.id)

                    // 为列表项目绑定专辑名称
                    list.children.items(i).setAttribute("albumName", songs[i].al.name)
             */
            bindListItemName(sheetListBox, ids)

            // 歌单界面形成☝

        })
    })
    }
    
}

function initMainPlaylist(list) {
    //let list = document.getElementById("sheetListBox")
    // 生成主播放列表（播放后切换到这个歌单）
    // 清空
    mainplaylist = []
    // 加载
    for (let i = 0; i < list.children.length; i++) {
        let item = {
            "name": list.children[i].getAttribute('name'),
            "id": list.children[i].getAttribute('musicID'),
            "author": list.children[i].getAttribute('author'),
            "cover": list.children[i].getAttribute("cover"),
            "albumId": list.children[i].getAttribute("albumId"),
            "albumName": list.children[i].getAttribute("albumName")
        }
        mainplaylist.push(item)
    }
    if (firstLoad)
        sourceMusicUrl(document.getElementById("sheetListBox").children.item(0))

}
// 获取歌单列表并绑定到界面
function getSheets() {

    let id = loginData.account.id
    let sheet = {}
    let str = ''

    // 根据用户ID请求用户歌单简略信息
    http.get(`${server}/user/playlist?uid=${id}`, (res) => {
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            // 获取列表盒子
            let sheetListBox = document.getElementById("sheetListBox")

            // 解析JSON为对象
            let data = JSON.parse(str)
            // 请求失败
            if (data.code != 200) {
                //console.log(str)
                return
            }

            // 歌单列表
            let sheetlist = data.playlist

            // 重置列表盒子内容
            sheetListBox.innerHTML = ""


            // 遍历所有的歌单
            for (let i = 0; i < sheetlist.length; i++) {

                // 创建一个列表项目，用于显示一个歌单项目
                let li = document.createElement('LI')

                // 设置项目的样式
                li.classList.add(["sheet-list-item"])
                // #303030
                li.classList.add(["light-dark"])

                // 设置列表项目对应的序号 争议
                li.setAttribute('index', i)



                // 旁边的图标
                let coverLeft = document.createElement("IMG")
                coverLeft.style.float = "left"
                coverLeft.style.width = "35px"
                coverLeft.style.height = "35px"
                coverLeft.setAttribute("src", sheetlist[i].coverImgUrl)
                li.appendChild(coverLeft)

                // 为每个歌单设置名字
                let p = document.createElement("P")
                p.innerText = sheetlist[i].name
                li.appendChild(p)
                sheetListBox.appendChild(li)

                // 歌单列表项目点击事件
                li.addEventListener('click', function (e) {
                    // 再次清空列表盒子的内容，用歌单的歌曲列表取代歌单列表
                    sheetListBox.innerHTML = ""

                    // 请求单个歌单的详情
                    http.get(`${server}/playlist/detail?id=${sheetlist[li.getAttribute('index')].id}`, (res) => {
                        let str = ''

                        res.on('data', (chunk) => {
                            str += chunk
                        })

                        res.on('end', () => {
                            // 详细播放列表信息 对象
                            let playlist = JSON.parse(str).playlist

                            // 歌单内所有歌曲ID的数组 争议
                            let trackIds = playlist.trackIds


                            // 加载歌单详情框
                            loadSheetDetialBox(playlist, li.getAttribute('index'))

                            // 获取歌单
                            getSheet(sheetlist[li.getAttribute('index')].id)

                            // 设置当前播放的歌单为点击的歌单
                            player.setAttribute("sheet", sheetlist[li.getAttribute('index')].id)


                        })
                    })

                })
            }
            // 形成歌单列表界面☝
        })

    })
}

// 为歌单详情框填充内容
function loadSheetDetialBox() {

    // 为侧边栏添加歌单详情

    // 歌单详情介绍
    let sheetDetialBoxImg = document.getElementById("sheetDetialBoxImg")
    let sheetDetialContent = document.getElementsByClassName("sheet-detail-content")[0]

    let imgUrl = player.getAttribute("sheetCover")
    sheetDetialBoxImg.setAttribute("src", imgUrl)

    // 名称
    let nameBox = document.createElement("DIV")
    nameBox.innerText = "歌单名：" + player.getAttribute("sheetName")

    // 创造者
    let creatorBox = document.createElement("DIV")
    creatorBox.innerText = "创建者：" + player.getAttribute("sheetCreator")
    // 播放数
    let playNumBox = document.createElement("DIV")
    playNumBox.innerText = "播放数：" + player.getAttribute("sheetPlayCount")
    // 歌曲数
    let trackCountBox = document.createElement("DIV")
    trackCountBox.innerText = "歌曲数：" + player.getAttribute("sheetTrackCount")
    // 简介
    let descripBox = document.createElement("DIV")
    descripBox.innerText = "简介：" + player.getAttribute("sheetDescription")


    sheetDetialContent.innerHTML = ""
    sheetDetialContent.appendChild(nameBox)
    sheetDetialContent.appendChild(creatorBox)
    sheetDetialContent.appendChild(playNumBox)
    sheetDetialContent.appendChild(trackCountBox)
    sheetDetialContent.appendChild(descripBox)

}

// 加载每日推荐歌单
function loadDailyRecommandedSongs() {

    http.get(`${server}/recommend/songs?cookie=${cookie}`, (res) => {
        let sheetListBox = document.getElementById("sheetListBox")
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            if (res.statusCode != 200) {
                loadMusicPage()
                return
            }

            // 创建推荐歌单数组
            let rcms = JSON.parse(str).recommend

            // 清空dailySheet数组内容
            mainplaylist = []

            // 遍历推荐歌曲
            for (let i = 0; i < rcms.length; i++) {

                let authors = rcms[i].artists
                let author = ''
                for (let i = 0; i < authors.length; i++) {
                    if (i == authors.length - 1) {
                        author += authors[i].name
                        continue
                    }
                    author += authors[i].name + "/"
                }

                //填充主播放列表
                mainplaylist.push({ "id": rcms[i].id, "name": rcms[i].name, "cover": rcms[i].album.picUrl, "author": author })

                // 创建列表项
                let li = document.createElement('LI')
                // 添加样式
                li.classList.add(["sheet-list-item"])
                li.classList.add(["light-dark"])

                // 设置列表向的序号
                li.setAttribute('index', i)

                li.setAttribute('musicID', rcms[i].id)
                // 创建列表项左侧歌曲封面框
                let coverLeft = document.createElement("IMG")
                coverLeft.style.float = "left"
                coverLeft.style.width = "35px"
                coverLeft.style.height = "35px"

                // 为封面框添加图片源 争议
                // 用到了上面初始化好的dailySheet
                // 设置封面
                coverLeft.setAttribute("src", mainplaylist[i].cover)

                // 封面框右侧的歌曲名称
                let p = document.createElement("P")
                p.innerText = rcms[i].name
                li.appendChild(coverLeft)
                li.appendChild(p)

                // 列表项的点击事件，初始化一些东西然后开始播放
                li.addEventListener('click', () => {

                    // 播放器绑定上次播放的歌曲ID
                    player.setAttribute("last", player.getAttribute('now'))
                    player.setAttribute("lastIndex", player.getAttribute("index"))

                    // 播放器绑定当前播放的index
                    player.setAttribute('index', li.getAttribute('index'))
                    player.setAttribute("now", mainplaylist[li.getAttribute('index')].id)


                    // 播放器绑定当前播放音乐的封面
                    player.setAttribute("cover", mainplaylist[li.getAttribute('index')].cover)

                    // 获取播放地址
                    http.get(`${server}/song/url?id=${player.getAttribute("now")}&cookie=${cookie}`, (res) => {
                        let str = ''
                        res.on('data', (chunk) => {
                            str += chunk
                        })
                        res.on('end', () => {
                            // 对象
                            let data = JSON.parse(str).data

                            // 播放地址
                            let musicUrl = data[0].url


                            // 为播放器添加播放源
                            player.setAttribute('src', musicUrl)

                            firstLoad = false
                            // 开始播放
                            player.play()
                            //document.getElementById("musicTitle").innerText = "正在播放："+[player.getAttribute("index")].name
                            player.setAttribute('status', 'play')


                            // 封面 争议
                            //updateCover(dailySheet[li.getAttribute('index')].cover)
                        })
                    })
                })


                // 填充列表
                sheetListBox.appendChild(li)
            }

            // 设置当前歌单的名字，会显示在实时歌单和歌单详情里
            player.setAttribute("sheetName", "每日推荐")

            // 刷新实时歌单
            attachPlaylist()
        })
    })
}

// 加载私人定制FM
function loadFM() {

    // 读取音乐界面代码
    readFile(path.join(__dirname, "../pages/music.html"), (err, data) => {

        // 右侧主容器初始化
        document.getElementById("mainPage").innerHTML = data

        // 设置当前页面为音乐详情
        document.getElementById("player").setAttribute("currentPage", "music")

        // 加载播放FM歌曲
        http.get(`${server}/personal_fm?cookie=${cookie}&timestamp=${new Date().getTime()}`, (res) => {
            let str = ''
            res.on('data', (chunk) => {
                str += chunk
            })
            res.on('end', () => {
                if (res.statusCode != 200) {
                    loadMusicPage()
                    return
                }

                // FM歌曲列表对象
                let fms = JSON.parse(str).data




                // 清空FM歌单列表
                mainplaylist = []



                // 填充主播放列表
                for (let i = 0; i < fms.length; i++) {
                    let authors = fms[i].artists
                    let author = ''
                    for (let i = 0; i < authors.length; i++) {
                        if (i == authors.length - 1) {
                            author += authors[i].name
                            continue
                        }
                        author += authors[i].name + "/"
                    }
                    mainplaylist.push({ "id": fms[i].id, "name": fms[i].name, "cover": fms[i].album.picUrl, "author": author })
                }


                // 初始化绑定播放器当前播放序号、当前音乐ID、当前封面
                player.setAttribute("index", 0)
                player.setAttribute("now", fms[0].id)
                player.setAttribute("cover", fms[0].album.picUrl)

                // 获取播放地址
                http.get(`${server}/song/url?id=${player.getAttribute("now")}&cookie=${cookie}`, (res) => {
                    let str = ''
                    res.on('data', (chunk) => {
                        str += chunk
                    })
                    res.on('end', () => {
                        // 对象
                        let data = JSON.parse(str).data

                        // 播放地址
                        let musicUrl = data[0].url


                        firstLoad = false
                        // 为播放器设置播放源地址
                        player.setAttribute('src', musicUrl)

                        // 播放器开始播放
                        player.play()

                        // 设置播放状态为播放
                        player.setAttribute('status', 'play')

                        // 加载歌词
                        showLyric()
                        // 更新封面
                        updateCover(mainplaylist[0].cover)
                        // 加载评论
                        loadComment(1)
                        /// 加载喜不喜欢按钮
                        loadLikeBtn()
                        //loadDislikeBtn()
                        loadCollectBtn()
                        // 加载开始评论按钮
                        loadAddcommentBtn()
                    })
                })
            })
        })

    })

}

// 加载评论
function loadComment(page) {
    ////console.log("show")
    if (page < 1) {
        page = 1
    }

    let musicPanelBottom = document.getElementById("musicPanelBottom")

    //console.log("加载评论：" + `${server}/comment/music?id=${player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`)
    http.get(`${server}/comment/music?id=${player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            let hot = JSON.parse(str).hotComments
            let normal = JSON.parse(str).comments
            ////console.log(str)
            musicPanelBottom.innerHTML = ""

            let hotcommentList = document.createElement("UL")
            hotcommentList.setAttribute("id", "hotcommentList")

            let normalcommentList = document.createElement("UL")
            normalcommentList.setAttribute("id", "normalcommentList")

            normalcommentList.setAttribute("count", JSON.parse(str).total)
            normalcommentList.setAttribute("page", 1)
            normalcommentList.setAttribute("pages", Math.round(JSON.parse(str).total / 3))

            ////console.log(Math.round(JSON.parse(str).total / 3))
            for (let i = 0; i < hot.length; i++) {
                let user = hot[i].user.nickname
                let content = hot[i].content
                let li = document.createElement("LI")

                //li.classList.add(["comment-line"])
                let contentDiv = document.createElement("DIV")
                contentDiv.innerText = content
                contentDiv.classList.add(["comment-line"])
                contentDiv.classList.add(["light-dark"])
                let userP = document.createElement("DIV")

                userP.classList.add(["comment-label-mute"])
                userP.innerText = user
                contentDiv.appendChild(userP)
                li.appendChild(contentDiv)

                hotcommentList.appendChild(li)
            }

            normalcommentList.innerHTML = ""
            for (let i = 0; i < normal.length; i++) {
                let user = normal[i].user.nickname
                let content = normal[i].content
                let li = document.createElement("LI")

                //li.classList.add(["comment-line"])
                let contentDiv = document.createElement("DIV")
                contentDiv.innerText = content
                contentDiv.classList.add(["comment-line"])
                contentDiv.classList.add(["light-dark"])
                let userP = document.createElement("DIV")

                userP.classList.add(["comment-label-mute"])
                userP.innerText = user
                contentDiv.appendChild(userP)
                li.appendChild(contentDiv)

                normalcommentList.appendChild(li)
            }

            let hotcommentBtn = document.getElementById("hotcommentBtn")
            let normalcommentBtn = document.getElementById("normalcommentBtn")

            hotcommentBtn.addEventListener("click", (e) => {

                e.stopPropagation()
                hotcommentList.style.display = "block"
                normalcommentList.style.display = "none"
                document.getElementById("commentPageUp").style.display = "none"
                document.getElementById("commentPageDown").style.display = "none"
            })
            normalcommentBtn.addEventListener("click", (e) => {
                e.stopPropagation()
                normalcommentList.style.display = "block"
                hotcommentList.style.display = "none"
                document.getElementById("commentPageUp").style.display = "block"
                document.getElementById("commentPageDown").style.display = "block"
                normalcommentList.setAttribute("page", 1)

            })

            let commentPageUpFunc = (e) => {
                e.stopPropagation()
                let page = Number(normalcommentList.getAttribute("page"))
                if (page > 1) {
                    page = Number(page) - 1
                    normalcommentList.setAttribute("page", page)
                    http.get(`${server}/comment/music?id=${player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`, (res) => {
                        let str = ''
                        res.on('data', (chunk) => {
                            str += chunk
                        })
                        res.on('end', () => {
                            let normal = JSON.parse(str).comments
                            ////console.log(str)
                            if (normal != undefined) {
                                normalcommentList.innerHTML = ""
                                for (let i = 0; i < normal.length; i++) {
                                    let user = normal[i].user.nickname
                                    let content = normal[i].content
                                    let li = document.createElement("LI")

                                    //li.classList.add(["comment-line"])
                                    let contentDiv = document.createElement("DIV")
                                    contentDiv.innerText = content
                                    contentDiv.classList.add(["comment-line"])
                                    contentDiv.classList.add(["light-dark"])
                                    let userP = document.createElement("DIV")

                                    userP.classList.add(["comment-label-mute"])
                                    userP.innerText = user
                                    contentDiv.appendChild(userP)
                                    li.appendChild(contentDiv)

                                    normalcommentList.appendChild(li)
                                    normalcommentList.scrollTop = 0
                                }
                            }
                        })

                    })
                }
            }


            let commentPageDownFunc = (e) => {
                e.stopPropagation()
                let page = Number(normalcommentList.getAttribute("page"))

                ////console.log("still")
                ////console.log("still+"+page)
                ////console.log("stillpages:"+normalcommentList.getAttribute("pages"))
                ////console.log("??"+(page < normalcommentList.getAttribute("pages")))
                if (page < Number(normalcommentList.getAttribute("pages"))) {

                    page = Number(page) + 1
                    normalcommentList.setAttribute("page", page)
                    ////console.log(normalcommentList.getAttribute("pages"))
                    ////console.log(normalcommentList.getAttribute("page"))
                    ////console.log(page)
                    http.get(`${server}/comment/music?id=${player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`, (res) => {
                        let str = ''
                        res.on('data', (chunk) => {
                            str += chunk
                        })
                        res.on('end', () => {

                            let normal = JSON.parse(str).comments
                            ////console.log(str)
                            if (normal != undefined) {
                                normalcommentList.innerHTML = ""
                                for (let i = 0; i < normal.length; i++) {
                                    let user = normal[i].user.nickname
                                    let content = normal[i].content
                                    let li = document.createElement("LI")

                                    //li.classList.add(["comment-line"])
                                    let contentDiv = document.createElement("DIV")
                                    contentDiv.innerText = content
                                    contentDiv.classList.add(["comment-line"])
                                    contentDiv.classList.add(["light-dark"])
                                    let userP = document.createElement("DIV")

                                    userP.classList.add(["comment-label-mute"])
                                    userP.innerText = user
                                    contentDiv.appendChild(userP)
                                    li.appendChild(contentDiv)

                                    normalcommentList.appendChild(li)
                                    normalcommentList.scrollTop = 0
                                }
                            }
                        })

                    })
                }
            }
            let commentPageUp = document.getElementById("commentPageUp")
            let commentPageDown = document.getElementById("commentPageDown")
            commentPageUp.style.display = "none"
            commentPageDown.style.display = "none"
            commentPageUp.addEventListener("click", commentPageUpFunc)

            commentPageDown.addEventListener("click", commentPageDownFunc)

            musicPanelBottom.appendChild(hotcommentList)
            musicPanelBottom.appendChild(normalcommentList)
        })


    })
}

function loadLikeBtn() {
    // 喜欢按钮
    let likeBtn = document.getElementById("likeBtn")
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        http.get(`${server}/like?id=${player.getAttribute("now")}&cookie=${cookie}`, (res) => {
            let str = ''
            res.on('data', (chunk) => {
                str += chunk
            })
            res.on('end', () => {
                //console.log(str)
                if (JSON.parse(str).code == 200) {
                    new Notification("通知", {
                        body: "喜欢歌曲成功"
                    })
                }else {
                    new Notification("通知", {
                        body: "喜欢歌曲失败"
                    })
                    //console.log(str)
                }
            })
        })
    })
}


// 加载收藏按钮
function loadCollectBtn(){
    // 收藏按钮
    let collectBtn = document.getElementById("collectBtn")
    collectBtn.addEventListener("click",(e)=>{
        let mid = player.getAttribute("now")
        http.get(`${server}/user/playlist?uid=${loginData.account.id}`,(res)=>{
        let str = ''
        res.on('data',(chunk)=>{
            str += chunk
        })
        res.on('end',()=>{
            let sheetlist = JSON.parse(str).playlist
            //console.log("[url]"+`${server}/user/playlist?uid=${loginData.account.id}`+"sheetlist:"+str)
            let req = new XMLHttpRequest()
            
            let collectDialog = dialog.newCollectDialog("collect_dialog",sheetlist,mid,cookie)
        })
    })
    })
}

function loadDislikeBtn() {
    // 不喜欢按钮
    let dislikeBtn = document.getElementById("dislikeBtn")
    dislikeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        http.get(`${server}/like?id=${player.getAttribute("now")}&like=false&cookie=${cookie}`, (res) => {
            let str = ''
            res.on('data', (chunk) => {
                str += chunk
            })
            res.on('end', () => {
                if (JSON.parse(str).code == 200) {
                    //console.log(str)
                    new Notification("通知", {
                        body: "取消喜欢歌曲成功，可能需要一点点时间系统才会更新。"
                    })
                } else {
                    new Notification("通知", {
                        body: "取消喜欢歌曲失败"
                    })
                }
            })
        })
    })
}

function loadAddcommentBtn() {
    let startcommentBtn = document.getElementById("startcommentBtn")
    startcommentBtn.addEventListener('click', (e) => {
        e.stopPropagation()

        // 输入窗口
        let addcommentBox = document.createElement("DIV")
        addcommentBox.setAttribute("id", "addcommentBox")
        addcommentBox.className = "addcommentBox"

        // 输入框
        let commentTextBox = document.createElement("INPUT")
        commentTextBox.setAttribute("type", "text")
        commentTextBox.setAttribute('id', "commentTextBox")
        commentTextBox.setAttribute("placeholder", "输入评论")
        addcommentBox.appendChild(commentTextBox)

        // 提交按钮
        let addcommentBtn = document.createElement("button")
        addcommentBtn.setAttribute("id", "addcommentBtn")
        addcommentBtn.innerText = "提交"
        addcommentBox.appendChild(addcommentBtn)
        addcommentBtn.addEventListener('click', (e) => {
            e.stopPropagation()
            http.get(`${server}/comment?type=0&t=1&id=${player.getAttribute("now")}&content=${commentTextBox.value}&cookie=${cookie}`, (res) => {
                let str = ''
                res.on('data', (chunk) => {
                    str += chunk

                })
                res.on('end', () => {
                    if (JSON.parse(str).code == 200) {
                        new Notification("通知", {
                            body: "评论发送成功"
                        })
                        addcommentBox.remove()
                        loadComment(1)
                    } else {
                        //console.log(str)
                    }
                })
            })
        })


        document.getElementsByTagName("body")[0].appendChild(addcommentBox)

        commentTextBox.focus()

    })
}

function loadMusicPage() {

    // FM模式设置
    if (player.getAttribute("mode") == 'fm') {
        loadFM()

    }

    if (player.getAttribute("mode") == 'normal') {
        readFile(path.join(__dirname, "../pages/music.html"), (err, data) => {

            document.getElementById("mainPage").innerHTML = data

            // 设置当前页面为音乐详情
            document.getElementById("player").setAttribute("currentPage", "music")
            ////console.log(player.getAttribute('index'))
            ////console.log(player.getAttribute('index').cover)
            let diskCover = document.getElementById("diskCover")
            diskCover.setAttribute("src", mainplaylist[player.getAttribute('index')].cover)

            //加载歌词
            showLyric()

            // 加载喜不喜欢按钮
            loadLikeBtn()
            //loadDislikeBtn()
            loadCollectBtn()
            // 加载开始评论按钮
            loadAddcommentBtn()
            // 评论
            loadComment(1)
        })
    }

}

// 显示歌词
function showLyric() {

    let lyricBox = document.getElementById("lyric")
    getLryic(player.getAttribute('now'), lyricBox)
}

function getLryic(id, lyricBox) {
    http.get(`${server}/lyric?id=${id}`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            currentLyric = []
            let pattn = /\[[0-9]+[\u003a][0-9]+[\u002e][0-9]+\]/g



            if (JSON.parse(str).lrc != undefined) {
                let lyric = JSON.parse(str).lrc.lyric
                ////console.log(lyric)
                let lines = lyric.split("\n")
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i]
                    let lineSplt = line.split(']')
                    if (line.length < 2) {
                        continue
                    }
                    let timeBase = lineSplt[0].slice(1).split('.')[0]
                    // 毫秒级定位
                    // let timeExtra = lineSplt[0].slice(1).split('.')[1]
                    let timeMinute = timeBase.split(":")[0]
                    let timeSecond = timeBase.split(":")[1]
                    let time = Number(timeMinute) * 60 + Number(timeSecond)
                    let content = lineSplt[1]

                    // 添加歌词行
                    currentLyric[i] = { "time": time, "content": content }

                }

                ////console.log(JSON.stringify(currentLyric))
                // 加载歌词页面
                readFile(path.join(__dirname, "../pages/lyric.html"), (err, data) => {
                    let lyricBox = document.getElementById("lyric")

                    lyricBox.innerHTML = data
                    let lyricLines = document.getElementById("lyric-lines")
                    for (let i = 0; i < currentLyric.length; i++) {
                        ////console.log("123")
                        let l = document.createElement("LI")
                        //l.classList.add(["menu-item"])
                        l.setAttribute('time', currentLyric[i].time)
                        l.id = 'lyric-' + currentLyric[i].time
                        l.innerText = currentLyric[i].content
                        lyricLines.appendChild(l)
                        l.addEventListener("dblclick", (() => {
                            player.currentTime = l.getAttribute("time")
                        }))
                    }

                    lyricInterval = setInterval(() => {
                        ////console.log(lyricBox.scrollTop)

                        let ct = document.getElementById("player").getAttribute("time")
                        let currentLine = document.getElementById("lyric-" + ct)
                        if (currentLine != undefined) {
                            for (let i = 0; i < lyricLines.children.length; i++) {
                                lyricLines.children.item(i).style.color = "ivory"
                            }
                            currentLine.style.color = "coral"
                            ////console.log(currentLine.offsetTop)
                            // 保持歌词内容显示
                            lyricBox.scrollTop = currentLine.offsetTop - 132
                        }


                    }, 200);
                })
            } else {
                readFile(path.join(__dirname, "../pages/lyric.html"), (err, data) => {
                    let lyricBox = document.getElementById("lyric")

                    lyricBox.innerHTML = data
                    let lyricLines = document.getElementById("lyric-lines")
                    let l = document.createElement("LI")
                    l.innerText = "纯音乐，敬请聆听。"
                    lyricLines.appendChild(l)
                })
            }


            ////console.log(JSON.stringify(currentLyric))
            //lyric = lyric.replace(pattn, '')
        })
    })
}