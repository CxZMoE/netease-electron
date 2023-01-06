"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var remote = require("@electron/remote");
var readFile = remote.require('fs').readFile;
var path = remote.require('path');
var netease_1 = require("./netease");
var Dialog = /** @class */ (function () {
    function Dialog() {
        // 创建对话框
        this.createDialog = function (id, title, width, height, content) {
            var _this = this;
            readFile("".concat(__dirname, "\\..\\pages\\dialog.html"), function (err, data) {
                console.log(__dirname);
                // body
                var m = document.getElementsByTagName("body")[0];
                // 外层div
                var d = document.createElement("DIV");
                d.innerHTML = data.toString('utf-8');
                // 设置属性
                d.getElementsByTagName("p")[0].innerText = title;
                d.style.width = width;
                d.style.height = height;
                d.setAttribute("id", id);
                d.setAttribute("type", "dialog");
                d.getElementsByClassName("dialog-box-body")[0].innerHTML = content;
                d.getElementsByClassName("dialog-button")[0].addEventListener('click', function (e) {
                    _this.closeDialog(d.getAttribute("id"));
                });
                _this.list.push(id);
                m.appendChild(d);
                // 样式
                d.classList.add("dialog-box");
                // 处理拖动
                d.addEventListener('mousedown', function (e) {
                    d.setAttribute("l_x", e.x.toString());
                    d.setAttribute("l_y", e.y.toString());
                    d.setAttribute("m_move", "true");
                });
                d.addEventListener('mouseup', function (e) {
                    d.setAttribute("m_move", "false");
                });
                d.addEventListener('mouseout', function (e) {
                    d.setAttribute("m_move", "false");
                });
                d.addEventListener('mousemove', function (e) {
                    if (d.getAttribute("m_move") == "true") {
                        var rect = d.getBoundingClientRect();
                        // 上一次坐标
                        var l_x = Number(d.getAttribute("l_x"));
                        var l_y = Number(d.getAttribute("l_y"));
                        // 移动
                        d.style.left = rect.x + (e.x - l_x) + 'px';
                        d.style.top = rect.y + (e.y - l_y) + 'px';
                        // 设置上一次坐标
                        d.setAttribute("l_x", e.x.toString());
                        d.setAttribute("l_y", e.y.toString());
                    }
                });
            });
            return id;
        };
        // 关闭对话框
        this.closeDialog = function (id) {
            var d = document.getElementById(id);
            d.remove();
            //let idIndex = this.list.indexOf(id)
            //this.list.slice(0,idIndex).push(this.list.slice(idIndex+1,this.list.length))
        };
        // 设置内容
        this.setContent = function (id, content) {
            var b = document.getElementById(id).getElementsByClassName("dialog-box-body")[0];
            b.innerHTML = content;
        };
        // 获取标题元素
        this.getTitleElement = function (id) {
            return document.getElementById(id).getElementsByTagName("P")[0];
        };
        // 获取内容元素
        this.getContentElement = function (id) {
            return document.getElementById(id).getElementsByClassName("dialog-box-body")[0];
        };
        this.newLoginDialog = function (id, loginCallback) {
            readFile(path.join(__dirname, "../pages/login.html"), function (err, data) {
                // body
                var m = document.getElementsByTagName("body")[0];
                var newNode = document.createElement("DIV");
                //<div id="loginDialog" class="dialog-box">
                newNode.setAttribute("id", id);
                newNode.classList.add("dialog-box");
                newNode.setAttribute("id", id);
                newNode.innerHTML = data.toString();
                m.appendChild(newNode);
                var d = document.getElementById("loginDialogTitle");
                // 处理拖动
                newNode.addEventListener('mousedown', function (e) {
                    newNode.setAttribute("l_x", e.x.toString());
                    newNode.setAttribute("l_y", e.y.toString());
                    newNode.setAttribute("m_move", "true");
                });
                newNode.addEventListener('mouseup', function (e) {
                    newNode.setAttribute("m_move", "false");
                });
                newNode.addEventListener('mouseout', function (e) {
                    newNode.setAttribute("m_move", "false");
                });
                // document.getElementById("loginBtn").addEventListener('click', (e) => {
                //     e.preventDefault()
                //     loginCallback()
                // })
                newNode.addEventListener('mousemove', function (e) {
                    if (newNode.getAttribute("m_move") == "true") {
                        var rect = newNode.getBoundingClientRect();
                        // 上一次坐标
                        var l_x = Number(newNode.getAttribute("l_x"));
                        var l_y = Number(newNode.getAttribute("l_y"));
                        // 移动
                        newNode.style.left = rect.x + (e.x - l_x) + 'px';
                        newNode.style.top = rect.y + (e.y - l_y) + 'px';
                        // 设置上一次坐标
                        newNode.setAttribute("l_x", e.x.toString());
                        newNode.setAttribute("l_y", e.y.toString());
                    }
                });
                // 处理关闭
                var loginDialogCloseBtn = document.getElementById("loginDialogCloseBtn");
                loginDialogCloseBtn.addEventListener("click", function (e) {
                    e.stopPropagation();
                    newNode.remove();
                });
                fetch("".concat(netease_1.server, "/login/qr/key?timerstamp=").concat(Date.now())).then(function (res) { return res.json(); }).then(function (data) {
                    // {"data":{"code":200,"unikey":"ae5522bd-f6be-4a01-be78-021490308218"},"code":200}
                    data = data.data;
                    console.log(data);
                    if (data != undefined && data.code == 200) {
                        // 获取Key
                        var key_1 = data.unikey;
                        console.log("Get unikey for qrcode: ".concat(key_1));
                        // 生成二维码
                        fetch("".concat(netease_1.server, "/login/qr/create?key=").concat(key_1, "&qrimg=1&timerstamp=").concat(Date.now())).then(function (res) { return res.json(); }).then(function (data) {
                            console.log(data);
                            data = data.data;
                            if (data != undefined) {
                                var qrimg = data.qrimg;
                                // var sc = document.createElement("script");
                                // sc.type = "text/javascript";
                                // sc.src = "../js/utils/qrcode.min.js";
                                console.log("\u4F7F\u7528qrimg: ".concat(qrimg, " \u751F\u6210\u4E8C\u7EF4\u7801"));
                                // sc.innerText = `new QRCode(document.getElementById("qrcode"), "${qrurl}");`
                                var sc = document.createElement("img");
                                sc.src = qrimg;
                                // document.body.appendChild(sc);
                                document.getElementById("qrcode").appendChild(sc);
                                var qrScanInt;
                                qrScanInt = setInterval(function () {
                                    console.log(">> check qrcode scan: " + key_1);
                                    fetch("".concat(netease_1.server, "/login/qr/check?key=").concat(key_1, "&timerstamp=").concat(Date.now())).then(function (res) { return res.json(); }).then(function (data) {
                                        console.log(data);
                                        // {code: 803, message: '授权登陆成功', cookie: 'MUSIC_R_T=1494151088229; Max-Age=2147483647; Expir…2091 13:00:18 GMT; Path=/wapi/clientlog; HTTPOnly'}
                                        if (data.code == 803) {
                                            console.log(data.message);
                                            var cookie = data.cookie;
                                            fetch("".concat(netease_1.server, "/user/account?cookie=").concat(cookie)).then(function (res) { return res.json(); }).then(function (data) {
                                                console.log(data);
                                                loginCallback(cookie, data);
                                            });
                                        }
                                    });
                                }, 1000);
                            }
                        });
                    }
                });
            });
            return id;
        };
        this.newCollectDialog = function (id, sheetlist, now, cookie) {
            readFile(path.join(__dirname, "../pages/collect.html"), function (err, data) {
                // body
                var m = document.getElementsByTagName("body")[0];
                var newNode = document.createElement("DIV");
                //<div id="loginDialog" class="dialog-box">
                newNode.setAttribute("id", id);
                newNode.classList.add("dialog-box");
                newNode.setAttribute("id", id);
                newNode.innerHTML = data.toString();
                m.appendChild(newNode);
                var d = document.getElementById("collectDialogTitle");
                // 处理拖动
                newNode.addEventListener('mousedown', function (e) {
                    newNode.setAttribute("l_x", e.x.toString());
                    newNode.setAttribute("l_y", e.y.toString());
                    newNode.setAttribute("m_move", "true");
                });
                newNode.addEventListener('mouseup', function (e) {
                    newNode.setAttribute("m_move", "false");
                });
                newNode.addEventListener('mouseout', function (e) {
                    newNode.setAttribute("m_move", "false");
                });
                newNode.addEventListener('mousemove', function (e) {
                    if (newNode.getAttribute("m_move") == "true") {
                        var rect = newNode.getBoundingClientRect();
                        // 上一次坐标
                        var l_x = Number(newNode.getAttribute("l_x"));
                        var l_y = Number(newNode.getAttribute("l_y"));
                        // 移动
                        newNode.style.left = rect.x + (e.x - l_x) + 'px';
                        newNode.style.top = rect.y + (e.y - l_y) + 'px';
                        // 设置上一次坐标
                        newNode.setAttribute("l_x", e.x.toString());
                        newNode.setAttribute("l_y", e.y.toString());
                    }
                });
                // 处理关闭
                var collectDialogCloseBtn = document.getElementById("collectDialogCloseBtn");
                collectDialogCloseBtn.addEventListener("click", function (e) {
                    //e.stopPropagation()
                    newNode.remove();
                });
                // 加载歌单
                var sheet_select = document.getElementById("collect-sheet");
                for (var i = 0; i < sheetlist.length; i++) {
                    var opt = document.createElement("option");
                    opt.value = sheetlist[i].id;
                    //console.log(sheetlist[i].name)
                    opt.innerText = sheetlist[i].name;
                    sheet_select.appendChild(opt);
                }
                var collectAddBtn = document.getElementById("collectAddBtn");
                collectAddBtn.addEventListener("click", function (e) {
                    e.stopPropagation();
                    var req = new XMLHttpRequest();
                    req.open("GET", "".concat(netease_1.server, "/playlist/tracks?op=add&pid=").concat(sheet_select.options[sheet_select.selectedIndex].value, "&tracks=").concat(now, "&cookie=").concat(cookie, "&timestamp=").concat(new Date().getTime()));
                    req.send();
                    req.onreadystatechange = function (e) {
                        if (req.status == 200 && req.readyState == 4) {
                            var data_1 = req.responseText;
                            //console.log(data)
                            var status_1 = JSON.parse(data_1).status;
                            if (status_1 == 200) {
                                new Notification("通知", {
                                    body: "收藏歌曲成功"
                                });
                                newNode.remove();
                            }
                            else if (status_1 == 502) {
                                var req2 = new XMLHttpRequest();
                                req2.open("GET", "".concat(netease_1.server, "/playlist/tracks?op=del&pid=").concat(sheet_select.options[sheet_select.selectedIndex].value, "&tracks=").concat(now, "&cookie=").concat(cookie, "&timestamp=").concat(new Date().getTime()));
                                req2.send();
                                req2.onreadystatechange = function (e) {
                                    if (req.status == 200 && req.readyState == 4) {
                                        new Notification("通知", {
                                            body: "取消收藏歌曲成功"
                                        });
                                        newNode.remove();
                                    }
                                };
                            }
                            else {
                                new Notification("通知", {
                                    body: "收藏歌曲失败"
                                });
                                newNode.remove();
                            }
                        }
                    };
                });
            });
            return id;
        };
        this.list = new Array();
    }
    return Dialog;
}());
exports.default = Dialog;
