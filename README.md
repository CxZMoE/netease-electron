# netease-electron
网易云音乐第三方Linux客户端，通过Electron实现

# 安装

``` shell
# 软件将会被安装在/usr/share/netease-electron,并创建一个桌面快捷方式
# 下载release
wget https://github.com/CxZMoE/netease-electron/releases/download/v1.0-alpha/netease-electron-linux-x64.tar.gz
# 解压
tar -zxvf netease-electron-linux-x64.tar.gz
# 安装
sudo sh install.sh
```

# 截图

首页
![首页](https://github.com/CxZMoE/netease-electron/raw/master/preview/netease-electron-home.png)

歌曲页面
![歌曲页面](https://github.com/CxZMoE/netease-electron/raw/master/preview/netease-electron-music.png)

# 功能

+ 邮箱登录（点击坐上头像框）
+ 每日推荐
+ 私人FM
+ 我的歌单
+ 我喜欢的音乐
+ 双端签到（登录后点击头像）
+ 歌词显示、歌词双击定位
+ 歌曲搜索（Ctrl+S 打开）
+ 播放列表
+ 喜欢/不喜欢音乐
+ 歌曲评论显示和发送
+ 进度条
+ 全局快捷键
    + Ctrl+Alt+P 播放/暂停
    + Ctrl+Alt+右箭头 下一首
    + Ctrl+Alt+左键头 上一首
    + Ctrl+Alt+上箭头 音量+
    + Ctrl+Alt+下箭头 音量-
+ 最小化到托盘

# TODO

+ 歌曲下载和批量下载
+ 歌曲网盘
+ 心动模式
+ 本地歌曲播放
+ 离线模式

# 版本变化
## v1.0 alpha

基本功能实现
+ 邮箱登录、每日推荐、私人FM、我的歌单、我喜欢的音乐、双端签到（登录后点击头像）、歌词显示、歌词双击定位、歌曲搜索（Ctrl+S 打开）、喜欢/不喜欢音乐、歌曲评论显示和发送、进度条、全局快捷键、最小化到托盘

# 贡献
欢迎提交Issue。
欢迎Fork提交代码，教程百度上有。

# 鸣谢
+ [Binaryify/NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)
