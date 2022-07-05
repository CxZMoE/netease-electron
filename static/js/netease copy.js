const fs = require("fs")
const http = require("http")
const { url } = require("inspector")
const { time, clear } = require("console")
const path = require("path")
//const server = "http://127.0.0.1:19696"
const server = "http://39.108.90.170:19696"

var loginData = {}
// 登录状态
var loginStatus = false

// 播放列表储存在这里
var sheets = {}
var cookie = ''
var currentLyric = []
var lyricInterval = {}

var playMode = "list-loop"

//var sheets.playlist = []
// 上一次点击的歌单，如果歌单内的歌曲被播放，则播放列表(sheets.playlist)切换到歌单
var lastClickSheet = {}

/* sheets.playlist Elemet format*/
/*
{
    "name": "okma"
    "id": 186004,
    "v": 129,
    "alg": null
}
*/


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
                    console.log(err)
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
                sheets = JSON.parse(str)
                // 清空内容
                sheetListBox.innerHTML = ""

                // 获取歌单详细信息
                // 获取第一个歌单，即：我喜欢的音乐
                getSheet(sheets.playlist[0].id)
                //getplaylist(sheets.playlist[0].id)
                player.setAttribute("sheet", sheets.playlist[0].id)
                loadSheetDetialBox(sheets, 0)
            }
        })

    })
}


function attachPlaylist(sheetListBox) {
    //console.log("ids:" + ids.split(",").length)
    //console.log(ids)


    if (player.getAttribute("mode") != "fm") {
        let list = document.getElementById("playList")
        let playlistSheetName = document.getElementById("playlistSheetName")

        playlistSheetName.innerText = player.getAttribute("sheetName")

        list.innerHTML = ""
        //console.log("attach:"+sheetListBox)
        for (let i = 0; i < sheetListBox.children.length; i++) {
            let c = sheetListBox.children.item(i).cloneNode(true)
            c.getElementsByTagName("P")[0].innerText = c.getElementsByTagName("P")[0].innerText.split("-")[0]
            c.addEventListener('click', () => {
                // 设置上次播放的歌曲ID
                player.setAttribute("last", player.getAttribute('now'))
                player.setAttribute("lastIndex", player.getAttribute("index"))

                // 设置当前播放的index
                player.setAttribute('index', c.getAttribute('index'))


                //alert(li.getAttribute('index'))
                // 获取歌曲播放Url
                getMusicDetailForLiClick(c)
                //alert(sheets.playlist[li.getAttribute('index')].cover)
                //console.log("choose:" + li.getAttribute('index'))
                //console.log("and the cover is :" + sheets.playlist[li.getAttribute('index')].cover)
                //updateCover(sheets.playlist[li.getAttribute('index')].cover)
            })

            list.appendChild(c)
        }

    } else {

    }
}


// 绑定列表中歌曲名称
function bindListItemName(list, ids) {
    //console.log("ids:" + ids.split(",").length)
    //console.log(ids)
    http.get(`${server}/song/detail?ids=${ids}`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            let songs = JSON.parse(str).songs
            //console.log(JSON.stringify(songs))
            //console.log(lastClickSheet.length)
            //console.log(sheets.playlist.length)

            if (songs == undefined) {
                bindListItemName(list, ids)
                return
            }
            for (let i = 0; i < songs.length; i++) {

                //console.log(songs[i].al.picUrl)
                sheets.playlist[i].name = songs[i].name + " - " + songs[i].ar[0].name
                //console.log(i)
                //console.log(songs[i].name)
                sheets.playlist[i].cover = songs[i].al.picUrl
                if (sheets.playlist[i].cover == undefined) {
                    bindListItemName(list, ids)
                    return
                }

                sheets.playlist[i].albumId = songs[i].al.id
                sheets.playlist[i].albumName = songs[i].al.name

                // 旁边的图标
                let coverLeft = document.createElement("IMG")
                coverLeft.style.float = "left"
                coverLeft.style.width = "35px"
                coverLeft.style.height = "35px"
                coverLeft.setAttribute("src", songs[i].al.picUrl)

                // 显示列表中的歌曲名称
                //list.children[i].innerText = songs[i].name
                let p = document.createElement("P")
                p.innerText = sheets.playlist[i].name
                list.children[i].appendChild(coverLeft)
                list.children[i].appendChild(p)

                //list.childNodes[2].firstChild.setAttribute("src", songs[i].al.picUrl)
            }

            // 复制到播放列表
            attachPlaylist(list)

        })
    })
}

// 生成IDS请求参数
function generateIdsList() {
    let sheetListBox = document.getElementById("sheetListBox")
    if (sheetListBox == undefined) {
        consolg.log("sheetlistbox is undefined")
    }
    let ids = ''
    //console.log(sheetListBox)
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
function getMusicDetailForLiClick(li) {
    // 获取播放器控件


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


            player.setAttribute('src', musicUrl)
            player.play()

            player.setAttribute('status', 'play')
            player.setAttribute('now', li.getAttribute('musicID'))

        })
    })
}


function getMusicDetail() {
    // 获取播放器控件

    let intel = setInterval(() => {
        if (sheets.playlist[player.getAttribute("index")] != undefined) {
            http.get(`${server}/song/url?id=${sheets.playlist[player.getAttribute("index")].id}&cookie=${cookie}`, (res) => {
                let str = ''
                res.on('data', (chunk) => {
                    str += chunk
                })
                res.on('end', () => {
                    let musicUrl = JSON.parse(str).data[0].url
                    player.setAttribute('src', musicUrl)
                    //player.play()

                    player.setAttribute('status', 'pause')
                    player.setAttribute('now', sheets.playlist[player.getAttribute("index")].id)
                    sheets.playlist = lastClickSheet
                    clearInterval(intel)
                })
            })
        }
    }, 500);

}

// 更新封面
function updateCover(coverUrl) {
    // 获取专辑图片框
    //alert(coverUrl)

    let cover = document.getElementById("cover")

    if (document.getElementById("player").getAttribute("currentPage") == "music") {
        let diskCover = document.getElementById("diskCover")
        diskCover.setAttribute("src", coverUrl)
    }

    if (coverUrl != undefined) {
        cover.setAttribute("src", coverUrl)
        player.setAttribute("cover", coverUrl)
    } else {
        console.log("coverurl is undefined")
    }



}



// 获取歌单

// 右下角点击获取当前播放列表
function getplaylist(id) {

    let playlistBox = document.getElementById("playList")
    http.get(`${server}/playlist/detail?id=${id}`, (res) => {

        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {

            let plist = JSON.parse(str).playlist

            if (plist == undefined) {
                console.log("plist is undefined.")
                getplaylist(id)
                return
            }
            //console.log(plist.length)
            //console.log(str)


            // 为上个点击歌单赋值以便切换当前播放列表
            lastClickSheet = plist.trackIds
            //console.log("trackIdsLength:" + lastClickSheet.length)
            if (lastClickSheet.length > 1) {
                sheets.playlist = lastClickSheet
            }

            for (let i = 0; i < lastClickSheet.length; i++) {
                let li = document.createElement('LI')
                li.classList.add(["sheet-list-item"])
                li.classList.add(["light-dark"])

                // 添加序号和歌曲id
                li.setAttribute('index', i)
                li.setAttribute('musicID', lastClickSheet[i].id)

                playlistBox.appendChild(li)

                li.addEventListener('click', () => {
                    // 设置上次播放的歌曲ID
                    player.setAttribute("last", player.getAttribute('now'))
                    player.setAttribute("lastIndex", player.getAttribute("index"))

                    // 设置当前播放的index
                    player.setAttribute('index', li.getAttribute('index'))
                    player.setAttribute("now", sheets.playlist[li.getAttribute('index')].id)

                    // 获取歌曲播放Url
                    getMusicDetailForLiClick(li)

                })
            }
            // 组成IDS列表，用于获取IDS列表中所有歌曲的详细信息

            // 生成ids请求参数
            let ids = generateIdsList()

            // 刷新歌曲名称
            bindPlaylistDetial(ids)

            // 形成歌单界面☝

        })
    })
}
function getSheet(id) {

    http.get(`${server}/playlist/detail?id=${id}`, (res) => {
        let sheetListBox = document.getElementById("sheetListBox")
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {

            let plist = JSON.parse(str).playlist

            if (plist == undefined) {
                console.log("plist is undefined.")
                getSheet(id)
                return
            }
            //console.log(plist.length)
            //console.log(str)
            // let mainPage = document.getElementById("mainPage")

            // 为上个点击歌单赋值以便切换当前播放列表
            lastClickSheet = plist.trackIds
            //console.log("trackIdsLength:" + lastClickSheet.length)
            if (lastClickSheet.length > 1) {
                sheets.playlist = lastClickSheet
            }

            // 设置player的播放列表长度参数
            player.setAttribute("count", lastClickSheet.length)
            for (let i = 0; i < lastClickSheet.length; i++) {
                let li = document.createElement('LI')
                li.classList.add(["sheet-list-item"])
                li.classList.add(["light-dark"])

                // 添加序号和歌曲id
                li.setAttribute('index', i)

                li.setAttribute('musicID', lastClickSheet[i].id)

                li.addEventListener('click', () => {
                    //console.log(li)
                    // 设置上次播放的歌曲ID
                    player.setAttribute("last", player.getAttribute('now'))
                    player.setAttribute("lastIndex", player.getAttribute("index"))

                    // 设置当前播放的index
                    player.setAttribute('index', li.getAttribute('index'))


                    //alert(li.getAttribute('index'))
                    // 获取歌曲播放Url
                    getMusicDetailForLiClick(li)
                    //alert(sheets.playlist[li.getAttribute('index')].cover)
                    //console.log("choose:" + li.getAttribute('index'))
                    //console.log("and the cover is :" + sheets.playlist[li.getAttribute('index')].cover)
                    //updateCover(sheets.playlist[li.getAttribute('index')].cover)
                })


                sheetListBox.appendChild(li)


            }
            //console.log(add)
            //console.log(sheetListBox)

            // 组成IDS列表，用于获取IDS列表中所有歌曲的详细信息

            // 生成ids请求参数
            let ids = generateIdsList()

            // 刷新歌曲名称
            bindListItemName(sheetListBox, ids)

            // 形成歌单界面☝

        })
    })
}

// 获取歌单列表
function getSheets() {

    let id = loginData.account.id
    let sheet = {}
    let str = ''
    http.get(`${server}/user/playlist?uid=${id}`, (res) => {
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            let sheetListBox = document.getElementById("sheetListBox")


            if (res.statusCode == 200) {
                sheets = JSON.parse(str)
                // 清空内容
                sheetListBox.innerHTML = ""

                for (let i = 0; i < sheets.playlist.length; i++) {
                    // 获取歌单详细信息

                    let li = document.createElement('LI')

                    // 列表中添加歌曲
                    li.classList.add(["sheet-list-item"])
                    li.classList.add(["light-dark"])

                    // 设置序号
                    li.setAttribute('index', i)

                    // 形成歌单列表界面☝

                    // 旁边的图标
                    let coverLeft = document.createElement("IMG")
                    coverLeft.style.float = "left"
                    coverLeft.style.width = "35px"
                    coverLeft.style.height = "35px"
                    coverLeft.setAttribute("src", sheets.playlist[i].coverImgUrl)
                    li.appendChild(coverLeft)

                    // 为每个歌单设置名字
                    let p = document.createElement("P")
                    p.innerText = sheets.playlist[i].name
                    li.appendChild(p)
                    sheetListBox.appendChild(li)

                    // 歌单列表项目点击事件
                    li.addEventListener('click', function (e) {
                        //alert(sheets.playlist[li.getAttribute('index')].name)
                        sheetListBox.innerHTML = ""

                        http.get(`${server}/playlist/detail?id=${sheets.playlist[li.getAttribute('index')].id}`, (res) => {
                            //console.log(sheets.playlist[li.getAttribute('index')].id)
                            //console.log(sheets.playlist.length)
                            //console.log(JSON.stringify(sheets.playlist))
                            let str = ''
                            res.on('data', (chunk) => {
                                str += chunk
                            })
                            res.on('end', () => {
                                // detail下的playlist
                                let plist = JSON.parse(str).playlist

                                // 为上个点击歌单赋值以便切换当前播放列表
                                lastClickSheet = plist.trackIds

                                loadSheetDetialBox(sheets, li.getAttribute('index'))



                                // 获取歌单
                                getSheet(sheets.playlist[li.getAttribute('index')].id)
                                player.setAttribute("sheet", sheets.playlist[li.getAttribute('index')].id)
                                //player.setAttribute("sheetName",sheets.playlist[li.getAttribute('index')].name)
                                // 形成歌单界面☝

                            })
                        })

                    })
                }
            }
        })

    })
}

function loadSheetDetialBox(sheets, index) {

    // 为侧边栏添加歌单详情

    // 歌单详情介绍
    let sheetDetialBoxImg = document.getElementById("sheetDetialBoxImg")
    let sheetDetialContent = document.getElementsByClassName("sheet-detail-content")[0]

    let imgUrl = sheets.playlist[index].coverImgUrl
    sheetDetialBoxImg.setAttribute("src", imgUrl)

    //console.log(JSON.stringify(sheets))
    // 名称
    let nameBox = document.createElement("DIV")
    nameBox.innerText = "歌单名：" + sheets.playlist[index].name
    player.setAttribute("sheetName", sheets.playlist[index].name)
    // 创造者
    let creatorBox = document.createElement("DIV")
    creatorBox.innerText = "创建者：" + sheets.playlist[index].creator.nickname
    // 播放数
    let playNumBox = document.createElement("DIV")
    playNumBox.innerText = "播放数：" + sheets.playlist[index].playCount
    // 歌曲数
    let trackCountBox = document.createElement("DIV")
    trackCountBox.innerText = "歌曲数：" + sheets.playlist[index].trackCount
    // 简介
    let descripBox = document.createElement("DIV")
    descripBox.innerText = "简介：" + ((sheets.playlist[index].description == null) ? "单主很懒，没有写简介。" : sheets.playlist[index].description)


    sheetDetialContent.innerHTML = ""
    sheetDetialContent.appendChild(nameBox)
    sheetDetialContent.appendChild(creatorBox)
    sheetDetialContent.appendChild(playNumBox)
    sheetDetialContent.appendChild(trackCountBox)
    sheetDetialContent.appendChild(descripBox)

}

// 加载每日推荐
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

            let rcms = JSON.parse(str).recommend
            sheets = {}
            sheets.playlist = []
            for (let i = 0; i < rcms.length; i++) {
                sheets.playlist.push({ "id": rcms[i].id, "name": rcms[i].name, "cover": rcms[i].album.picUrl })
                let li = document.createElement('LI')
                li.classList.add(["sheet-list-item"])
                li.classList.add(["light-dark"])

                // 添加序号和歌曲id
                li.setAttribute('index', i)

                li.setAttribute('musicID', sheets.playlist[i].id)
                // 旁边的图标
                let coverLeft = document.createElement("IMG")
                coverLeft.style.float = "left"
                coverLeft.style.width = "35px"
                coverLeft.style.height = "35px"
                coverLeft.setAttribute("src", sheets.playlist[i].cover)

                // 显示列表中的歌曲名称
                //list.children[i].innerText = songs[i].name
                let p = document.createElement("P")
                p.innerText = sheets.playlist[i].name
                li.appendChild(coverLeft)
                li.appendChild(p)

                li.addEventListener('click', () => {
                    //console.log(li)
                    // 设置上次播放的歌曲ID
                    player.setAttribute("last", player.getAttribute('now'))
                    player.setAttribute("lastIndex", player.getAttribute("index"))

                    // 设置当前播放的index
                    player.setAttribute('index', li.getAttribute('index'))
                    player.setAttribute("now", sheets.playlist[li.getAttribute('index')].id)
                    player.setAttribute("cover", sheets.playlist[li.getAttribute('index')].cover)
                    // 获取播放地址
                    http.get(`${server}/song/url?id=${player.getAttribute("now")}&cookie=${cookie}`, (res) => {
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


                            player.setAttribute('src', musicUrl)
                            player.play()
                            //document.getElementById("musicTitle").innerText = "正在播放："+sheets.playlist[player.getAttribute("index")].name
                            player.setAttribute('status', 'play')


                            // 封面
                            updateCover(rcms[li.getAttribute('index')].album.picUrl)
                            // 评论



                        })
                    })
                })


                sheetListBox.appendChild(li)
            }
            player.setAttribute("sheetName", "每日推荐")
            //console.log("daily:"+sheetListBox)
            attachPlaylist(sheetListBox)

        })
    })
}

// 加载歌曲界面
function loadFM() {


    readFile(path.join(__dirname, "../pages/music.html"), (err, data) => {

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

                let fms = JSON.parse(str).data
                sheets = {}
                sheets.playlist = []
                for (let i = 0; i < fms.length; i++) {
                    sheets.playlist.push({ "id": fms[i].id, "name": fms[i].name, "cover": fms[i].album.picUrl })

                }
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
                        let data = JSON.parse(str).data
                        if (data == undefined) {
                            getMusicDetailForLiClick(li)
                            return
                        }
                        let musicUrl = JSON.parse(str).data[0].url


                        player.setAttribute('src', musicUrl)
                        player.play()
                        //document.getElementById("musicTitle").innerText = "正在播放："+sheets.playlist[player.getAttribute("index")].name
                        player.setAttribute('status', 'play')
                        //sheets.playlist = lastClickSheet

                        // 歌词
                        showLyric()
                        // 封面
                        updateCover(fms[0].album.picUrl)
                        // 评论
                        showComment(1)
                        /// 加载喜不喜欢按钮
                        loadLikeBtn()
                        loadDislikeBtn()
                        // 加载开始评论按钮
                        loadAddcommentBtn()


                    })
                })
                //console.log(JSON.parse(sheets))
            })
        })

    })

}
function showComment(page) {
    //console.log("show")
    if (page < 1) {
        page = 1
    }

    let musicPanelBottom = document.getElementById("musicPanelBottom")

    http.get(`${server}/comment/music?id=${player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`, (res) => {
        let str = ''
        res.on('data', (chunk) => {
            str += chunk
        })
        res.on('end', () => {
            let hot = JSON.parse(str).hotComments
            let normal = JSON.parse(str).comments
            //console.log(str)
            musicPanelBottom.innerHTML = ""

            let hotcommentList = document.createElement("UL")
            hotcommentList.setAttribute("id", "hotcommentList")

            let normalcommentList = document.createElement("UL")
            normalcommentList.setAttribute("id", "normalcommentList")

            normalcommentList.setAttribute("count", JSON.parse(str).total)
            normalcommentList.setAttribute("page", 1)
            normalcommentList.setAttribute("pages", Math.round(JSON.parse(str).total / 3))

            //console.log(Math.round(JSON.parse(str).total / 3))
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
                            //console.log(str)
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

                //console.log("still")
                //console.log("still+"+page)
                //console.log("stillpages:"+normalcommentList.getAttribute("pages"))
                //console.log("??"+(page < normalcommentList.getAttribute("pages")))
                if (page < Number(normalcommentList.getAttribute("pages"))) {

                    page = Number(page) + 1
                    normalcommentList.setAttribute("page", page)
                    //console.log(normalcommentList.getAttribute("pages"))
                    //console.log(normalcommentList.getAttribute("page"))
                    //console.log(page)
                    http.get(`${server}/comment/music?id=${player.getAttribute("now")}&limit=3&offset=${(page - 1) * 3}`, (res) => {
                        let str = ''
                        res.on('data', (chunk) => {
                            str += chunk
                        })
                        res.on('end', () => {

                            let normal = JSON.parse(str).comments
                            //console.log(str)
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
                if (JSON.parse(str).code == 200) {
                    new Notification("通知", {
                        body: "喜欢歌曲成功"
                    })
                } else {
                    new Notification("通知", {
                        body: "喜欢歌曲失败"
                    })
                    console.log(str)
                }
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
                    console.log(str)
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
        commentTextBox.setAttribute("placeholder","输入评论")
        addcommentBox.appendChild(commentTextBox)

        // 提交按钮
        let addcommentBtn = document.createElement("button")
        addcommentBtn.setAttribute("id", "addcommentBtn")
        addcommentBtn.innerText = "提交"
        addcommentBox.appendChild(addcommentBtn)
        addcommentBtn.addEventListener('click',(e)=>{
            e.stopPropagation()
            http.get(`${server}/comment?type=0&t=1&id=${player.getAttribute("now")}&content=${commentTextBox.value}&cookie=${cookie}`,(res)=>{
                let str = ''
                res.on('data',(chunk)=>{
                    str += chunk

                })
                res.on('end',()=>{
                    if (JSON.parse(str).code == 200){
                        new Notification("通知",{
                            body:"评论发送成功"
                        })
                        addcommentBox.remove()
                        showComment(1)
                    }else{
                        console.log(str)
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
            //console.log(player.getAttribute('index'))
            //console.log(player.getAttribute('index').cover)
            let diskCover = document.getElementById("diskCover")
            diskCover.setAttribute("src", player.getAttribute("cover"))

            //加载歌词
            showLyric()

            // 加载喜不喜欢按钮
            loadLikeBtn()
            loadDislikeBtn()

            // 加载开始评论按钮
            loadAddcommentBtn()
            // 评论
            showComment(1)
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
                //console.log(lyric)
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

                //console.log(JSON.stringify(currentLyric))
                // 加载歌词页面
                readFile(path.join(__dirname, "../pages/lyric.html"), (err, data) => {
                    let lyricBox = document.getElementById("lyric")

                    lyricBox.innerHTML = data
                    let lyricLines = document.getElementById("lyric-lines")
                    for (let i = 0; i < currentLyric.length; i++) {
                        //console.log("123")
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
                        //console.log(lyricBox.scrollTop)

                        let ct = document.getElementById("player").getAttribute("time")
                        let currentLine = document.getElementById("lyric-" + ct)
                        if (currentLine != undefined) {
                            for (let i = 0; i < lyricLines.children.length; i++) {
                                lyricLines.children.item(i).style.color = "ivory"
                            }
                            currentLine.style.color = "coral"
                            //console.log(currentLine.offsetTop)
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


            //console.log(JSON.stringify(currentLyric))
            //lyric = lyric.replace(pattn, '')
        })
    })
}