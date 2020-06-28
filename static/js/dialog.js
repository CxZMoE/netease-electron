function Dialog() {
    this.list = new Array()

    
}

// 创建对话框
Dialog.prototype.createDialog = function (id, title, width, height, content) {
    readFile(`./static/pages/dialog.html`, (err, data) => {
        // body
        let m = document.getElementsByTagName("body")[0]
        // 外层div
        let d = document.createElement("DIV")
        d.innerHTML = data
        // 设置属性
        d.getElementsByTagName("p")[0].innerText = title
        d.style.width = width
        d.style.height = height
        d.setAttribute("id", id)
        d.setAttribute("type", "dialog")
        d.getElementsByClassName("dialog-box-body")[0].innerHTML = content
        d.getElementsByClassName("dialog-button")[0].addEventListener('click',(e)=>{
            this.closeDialog(d.getAttribute("id"))
        })
        this.list.push(id)
        m.appendChild(d)

        // 样式
        d.classList.add(["dialog-box"])


        // 处理拖动
        d.addEventListener('mousedown', (e) => {
            d.setAttribute("l_x", e.x)
            d.setAttribute("l_y", e.y)
            d.setAttribute("m_move", true)
        })
        d.addEventListener('mouseup', (e) => {
            d.setAttribute("m_move", false)
        })
        d.addEventListener('mouseout', (e) => {
            d.setAttribute("m_move", false)
        })

        d.addEventListener('mousemove', (e) => {
            if (d.getAttribute("m_move") == "true") {
                let rect = d.getBoundingClientRect()

                // 上一次坐标
                let l_x = d.getAttribute("l_x")
                let l_y = d.getAttribute("l_y")

                // 移动
                d.style.left = rect.x + (e.x - l_x) + 'px'
                d.style.top = rect.y + (e.y - l_y) + 'px'

                // 设置上一次坐标
                d.setAttribute("l_x", e.x)
                d.setAttribute("l_y", e.y)
            }

        })
    })
    return id
}

// 关闭对话框
Dialog.prototype.closeDialog = function(id){
    let d = document.getElementById(id)
    d.remove()
    //let idIndex = this.list.indexOf(id)
    //this.list.slice(0,idIndex).push(this.list.slice(idIndex+1,this.list.length))
}

// 设置内容
Dialog.prototype.setContent = function(id,content){
    let b = document.getElementById(id).getElementsByClassName("dialog-box-body")[0]
    b.innerHTML = content
}

// 获取标题元素
Dialog.prototype.getTitleElement = function(id){
    return document.getElementById(id).document.getElementsByName("P")[0]
}

// 获取内容元素
Dialog.prototype.getContentElement = function(id){
    return document.getElementById(id).getElementsByClassName("dialog-box-body")[0]
}

Dialog.prototype.newLoginDialog = function(id){
    readFile(path.join(__dirname, "../pages/login.html"), (err, data) => {
        // body
        let m = document.getElementsByTagName("body")[0]
        let newNode = document.createElement("DIV")
        //<div id="loginDialog" class="dialog-box">
        newNode.setAttribute("id",id)
        newNode.classList.add(["dialog-box"])
        newNode.setAttribute("id",id)
        newNode.innerHTML = data
        m.appendChild(newNode)
        let d = document.getElementById("loginDialogTitle")
        
        // 处理拖动
        newNode.addEventListener('mousedown', (e) => {
            newNode.setAttribute("l_x", e.x)
            newNode.setAttribute("l_y", e.y)
            newNode.setAttribute("m_move", true)
        })
        newNode.addEventListener('mouseup', (e) => {
            newNode.setAttribute("m_move", false)
        })
        newNode.addEventListener('mouseout', (e) => {
            newNode.setAttribute("m_move", false)
        })

        document.getElementById("loginBtn").addEventListener('click', (e) => {
                e.preventDefault()
                login(document.getElementById("username").value, document.getElementById("password").value)
        })
        newNode.addEventListener('mousemove', (e) => {
            if (newNode.getAttribute("m_move") == "true") {
                let rect = newNode.getBoundingClientRect()

                // 上一次坐标
                let l_x = newNode.getAttribute("l_x")
                let l_y = newNode.getAttribute("l_y")

                // 移动
                newNode.style.left = rect.x + (e.x - l_x) + 'px'
                newNode.style.top = rect.y + (e.y - l_y) + 'px'

                // 设置上一次坐标
                newNode.setAttribute("l_x", e.x)
                newNode.setAttribute("l_y", e.y)
            }

        })

        // 处理关闭
        let loginDialogCloseBtn = document.getElementById("loginDialogCloseBtn")
        loginDialogCloseBtn.addEventListener("click",(e)=>{
            e.stopPropagation()
            newNode.remove()
        })
    })
    return id
}