# Installation script for netease-electron
mkdir temp

DL_URL="https://github.com/CxZMoE/netease-electron/releases/download/v1.2/netease-electron-v1.2-linux-x64.tar.gz"
echo "下载安装包: $DL_URL"
cd temp
wget $DL_URL
tar -zxvf netease-electron-v1.2-linux-x64.tar.gz

SOURCE_DIR=$(dirname $(readlink -f "$0"))
echo "Source Directory:  $SOURCE_DIR"


echo "开始复制程序根目录..."
sudo cp $SOURCE_DIR/netease-electron-linux-x64 -r /usr/share/netease-electron 
sudo ln -sf /usr/share/netease-electron/netease-electron /usr/bin/netease-electron

echo "创建快捷方式"
sudo cp $SOURCE_DIR/netease-electron.desktop /usr/share/applications/
sudo chmod +x /usr/share/applications/netease-electron.desktop

echo "安装完成"
cd ..
rm -rf temp

exit 0