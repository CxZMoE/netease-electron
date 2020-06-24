# Installation script for netease-electron

SOURCE_DIR=$(dirname $(readlink -f "$0"))
echo "Current Directory:  $SOURCE_DIR"

echo "开始复制程序根目录..."
sudo cp $SOURCE_DIR/netease-electron-linux-x64 -r /usr/share/netease-electron 
sudo ln -sf /usr/share/netease-electron/netease-electron /usr/bin/netease-electron

echo "创建快捷方式"
sudo cp $SOURCE_DIR/netease-electron.desktop /usr/share/applications/
sudo chmod +x /usr/share/applications/netease-electron.desktop

echo "安装完成"
