
import { remote } from 'electron';
const { readFile } = remote.require('fs');
const path = remote.require('path');
import { server } from './netease';

class Dialog {
    list: Array<any>;
    constructor() {
        this.list = new Array()
    }

    // 创建对话框
    createDialog = function (id, title, width, height, content) {
        readFile(`./static/pages/dialog.html`, (err, data) => {
            // body
            let m = document.getElementsByTagName("body")[0]
            // 外层div
            let d = document.createElement("DIV")
            d.innerHTML = data.toString('utf-8');
            // 设置属性
            d.getElementsByTagName("p")[0].innerText = title
            d.style.width = width
            d.style.height = height
            d.setAttribute("id", id)
            d.setAttribute("type", "dialog")
            d.getElementsByClassName("dialog-box-body")[0].innerHTML = content
            d.getElementsByClassName("dialog-button")[0].addEventListener('click', (e) => {
                this.closeDialog(d.getAttribute("id"))
            })
            this.list.push(id)
            m.appendChild(d)

            // 样式
            d.classList.add("dialog-box")


            // 处理拖动
            d.addEventListener('mousedown', (e) => {
                d.setAttribute("l_x", e.x.toString())
                d.setAttribute("l_y", e.y.toString())
                d.setAttribute("m_move", "true")
            })
            d.addEventListener('mouseup', (e) => {
                d.setAttribute("m_move", "false")
            })
            d.addEventListener('mouseout', (e) => {
                d.setAttribute("m_move", "false")
            })

            d.addEventListener('mousemove', (e) => {
                if (d.getAttribute("m_move") == "true") {
                    let rect = d.getBoundingClientRect()

                    // 上一次坐标
                    let l_x = Number(d.getAttribute("l_x"));
                    let l_y = Number(d.getAttribute("l_y"));

                    // 移动
                    d.style.left = rect.x + (e.x - l_x) + 'px'
                    d.style.top = rect.y + (e.y - l_y) + 'px'

                    // 设置上一次坐标
                    d.setAttribute("l_x", e.x.toString());
                    d.setAttribute("l_y", e.y.toString());
                }

            })
        })
        return id
    }

    // 关闭对话框
    closeDialog = function (id) {
        let d = document.getElementById(id)
        d.remove()
        //let idIndex = this.list.indexOf(id)
        //this.list.slice(0,idIndex).push(this.list.slice(idIndex+1,this.list.length))
    }

    // 设置内容
    setContent = function (id, content) {
        let b = document.getElementById(id).getElementsByClassName("dialog-box-body")[0]
        b.innerHTML = content
    }

    // 获取标题元素
    getTitleElement = function (id) {
        return document.getElementById(id).getElementsByTagName("P")[0]
    }

    // 获取内容元素
    getContentElement = function (id) {
        return document.getElementById(id).getElementsByClassName("dialog-box-body")[0]
    }

    newLoginDialog = function (id, loginCallback: Function) {
        readFile(path.join(__dirname, "../pages/login.html"), (err, data) => {
            // body
            let m = document.getElementsByTagName("body")[0]
            let newNode = document.createElement("DIV")
            //<div id="loginDialog" class="dialog-box">
            newNode.setAttribute("id", id);
            newNode.classList.add("dialog-box");
            newNode.setAttribute("id", id);
            newNode.innerHTML = data.toString();
            m.appendChild(newNode);
            let d = document.getElementById("loginDialogTitle")

            // 处理拖动
            newNode.addEventListener('mousedown', (e) => {
                newNode.setAttribute("l_x", e.x.toString())
                newNode.setAttribute("l_y", e.y.toString())
                newNode.setAttribute("m_move", "true")
            })
            newNode.addEventListener('mouseup', (e) => {
                newNode.setAttribute("m_move", "false")
            })
            newNode.addEventListener('mouseout', (e) => {
                newNode.setAttribute("m_move", "false")
            })

            document.getElementById("loginBtn").addEventListener('click', (e) => {
                e.preventDefault()
                loginCallback()
            })
            newNode.addEventListener('mousemove', (e) => {
                if (newNode.getAttribute("m_move") == "true") {
                    let rect = newNode.getBoundingClientRect()

                    // 上一次坐标
                    let l_x = Number(newNode.getAttribute("l_x"))
                    let l_y = Number(newNode.getAttribute("l_y"))

                    // 移动
                    newNode.style.left = rect.x + (e.x - l_x) + 'px'
                    newNode.style.top = rect.y + (e.y - l_y) + 'px'

                    // 设置上一次坐标
                    newNode.setAttribute("l_x", e.x.toString())
                    newNode.setAttribute("l_y", e.y.toString())
                }

            })

            // 处理关闭
            let loginDialogCloseBtn = document.getElementById("loginDialogCloseBtn")
            loginDialogCloseBtn.addEventListener("click", (e) => {
                e.stopPropagation()
                newNode.remove()
            })
        })
        return id
    }

    newCollectDialog = function (id, sheetlist, now, cookie) {
        readFile(path.join(__dirname, "../pages/collect.html"), (err, data) => {
            // body
            let m = document.getElementsByTagName("body")[0]
            let newNode = document.createElement("DIV")
            //<div id="loginDialog" class="dialog-box">
            newNode.setAttribute("id", id)
            newNode.classList.add("dialog-box")
            newNode.setAttribute("id", id)
            newNode.innerHTML = data.toString();
            m.appendChild(newNode)
            let d = document.getElementById("collectDialogTitle")

            // 处理拖动
            newNode.addEventListener('mousedown', (e) => {
                newNode.setAttribute("l_x", e.x.toString())
                newNode.setAttribute("l_y", e.y.toString())
                newNode.setAttribute("m_move", "true")
            })
            newNode.addEventListener('mouseup', (e) => {
                newNode.setAttribute("m_move", "false")
            })
            newNode.addEventListener('mouseout', (e) => {
                newNode.setAttribute("m_move", "false")
            })

            newNode.addEventListener('mousemove', (e) => {
                if (newNode.getAttribute("m_move") == "true") {
                    let rect = newNode.getBoundingClientRect()

                    // 上一次坐标
                    let l_x = Number(newNode.getAttribute("l_x"));
                    let l_y = Number(newNode.getAttribute("l_y"));

                    // 移动
                    newNode.style.left = rect.x + (e.x - l_x) + 'px';
                    newNode.style.top = rect.y + (e.y - l_y) + 'px';

                    // 设置上一次坐标
                    newNode.setAttribute("l_x", e.x.toString());
                    newNode.setAttribute("l_y", e.y.toString());
                }

            })

            // 处理关闭
            let collectDialogCloseBtn = document.getElementById("collectDialogCloseBtn")
            collectDialogCloseBtn.addEventListener("click", (e) => {
                //e.stopPropagation()
                newNode.remove()
            })

            // 加载歌单
            let sheet_select = <HTMLSelectElement>document.getElementById("collect-sheet")
            for (let i = 0; i < sheetlist.length; i++) {
                let opt = document.createElement("option")
                opt.value = sheetlist[i].id
                //console.log(sheetlist[i].name)
                opt.innerText = sheetlist[i].name
                sheet_select.appendChild(opt)
            }

            let collectAddBtn = document.getElementById("collectAddBtn")
            collectAddBtn.addEventListener("click", (e) => {
                e.stopPropagation()
                let req = new XMLHttpRequest()

                req.open("GET", `${server}/playlist/tracks?op=add&pid=${sheet_select.options[sheet_select.selectedIndex].value}&tracks=${now}&cookie=${cookie}&timestamp=${new Date().getTime()}`)
                req.send()
                req.onreadystatechange = function (e) {
                    if (req.status == 200 && req.readyState == 4) {
                        let data = req.responseText
                        //console.log(data)
                        let status = JSON.parse(data).code
                        if (status == 200) {
                            new Notification("通知", {
                                body: "收藏歌曲成功"
                            })
                            newNode.remove()
                        } else if (status == 502) {
                            let req2 = new XMLHttpRequest()
                            req2.open("GET", `${server}/playlist/tracks?op=del&pid=${sheet_select.options[sheet_select.selectedIndex].value}&tracks=${now}&cookie=${cookie}&timestamp=${new Date().getTime()}`)
                            req2.send()
                            req2.onreadystatechange = function (e) {
                                if (req.status == 200 && req.readyState == 4) {
                                    new Notification("通知", {
                                        body: "取消收藏歌曲成功"
                                    })
                                    newNode.remove()
                                }
                            }

                        } else {
                            new Notification("通知", {
                                body: "收藏歌曲失败"
                            })
                            newNode.remove()
                        }



                    }
                }
            })
        })
        return id
    }

}



export default Dialog;