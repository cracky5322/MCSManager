![doc_logo.png](/docs/logo.png)

[![Status](https://img.shields.io/badge/npm-v6.14.15-blue.svg)](https://www.npmjs.com/)
[![Status](https://img.shields.io/badge/node-v14.17.6-blue.svg)](https://nodejs.org/en/download/)
[![Status](https://img.shields.io/badge/License-GPL-red.svg)](https://github.com/Suwings/MCSManager)

[官方网站](http://mcsmanager.com/) | [使用文档](https://docs.mcsmanager.com/)

<br />

## 软件简介

**分布式，稳定可靠，开箱即用，高扩展性，支持 Minecraft 和其他少数游戏的控制面板。**

MCSManager 面板（简称：MCSM 面板）是一款全中文，轻量级，开箱即用，多实例和支持 Docker 的 Minecraft 服务端管理面板。

此软件在 Minecraft 和其他游戏社区内中已有一定的流行程度，它可以帮助你集中管理多个物理服务器，动态在任何主机上创建游戏服务端，并且提供安全可靠的多用户权限系统，可以很轻松的帮助你管理多个服务器。

![main_theme.png](docs/panel.png)

<br />

## 运行环境

控制面板可运行在 Windows 与 Linux 平台，无需数据库与任何系统配置，只需安装 node 环境即可快速运行，属于轻量级的 Minecraft 服务端控制面板。

必须 `Node 14.17.0` 以上，无需数据库和更改任何系统配置，开箱即可运行。

<br />

## 配置/数据文件

配置文件： `data/SystemConfig/config.json`

用户数据文件：`data/User/*.json`

远程守护进程配置：`data/RemoteServiceConfig/*.json`

面板默认访问账号：`root` `123456`

<br />

## 软件使用文档

地址：[https://docs.mcsmanager.com/](https://docs.mcsmanager.com/)

> 官方文档正在不断完善，里面的内容还有瑕疵，暂且仅供参考。

<br />

## 在 Windows 运行

对于 Windows 系统，**已整合成直接运行版本，下载即可运行**（使用管理员权限运行）:

临时下载点：https://mcsmuuwinn.coding.net/s/c6a6b5de-fd2d-4857-b5f7-2528fd7b0c30

<br />

## 在 Linux 运行

**一行命令快速安装**

```bash
wget -qO- https://cdn.jsdelivr.net/gh/MCSManager/Script/setup.sh | bash
```

- 脚本仅适用于 AMD64 架构 Ubuntu/Centos/Debian/Archlinux）
- 执行完成后，使用 `systemctl start mcsm-{web,daemon}` 即可启动面板服务。
- 面板代码与运行环境自动安装在 `/opt/mcsmanager/` 目录下。

<br />

**Linux 手动安装**

- 若一键安装不起作用，则可以尝试此步骤手动安装。

```bash
# 切换到安装目录，没有此目录请执行 mkdir /opt/
cd /opt/
# 下载运行环境（已有 Node 14+ 可忽略）
wget https://npm.taobao.org/mirrors/node/v14.17.6/node-v14.17.6-linux-x64.tar.gz
# 解压文件
tar -zxvf node-v14.17.6-linux-x64.tar.gz
# 链接程序到环境变量中
ln -s /opt/node-v14.17.6-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v14.17.6-linux-x64/bin/npm /usr/bin/npm

# 准备安装目录
mkdir /opt/mcsmanager/
cd /opt/mcsmanager/

# 下载面板端（Web）程序
git clone https://github.com/MCSManager/MCSManager-Web-Production.git
# 重命名文件夹并进入
mv MCSManager-Web-Production web
cd web
# 安装依赖库
npm install --registry=https://registry.npm.taobao.org

# 下载守护进程（Daemon）程序
git clone https://github.com/MCSManager/MCSManager-Daemon-Production.git
# 重命名文件夹并进入
mv MCSManager-Daemon-Production daemon
cd daemon
# 安装依赖库
npm install --registry=https://registry.npm.taobao.org


# 打开两个终端或两个 Screen 软件的终端窗口
# 先启动守护进程
cd /opt/mcsmanager/daemon
# 启动
node app.js

# 然后启动面板端进程
cd /opt/mcsmanager/web
# 启动
node app.js

# 访问 http://localhost:23333/ 即可进入面板。
# 默认情况下，面板端会自动扫描 daemon 文件夹并且自动连接到守护进程。
```

- 注意，这种安装方式不会自动注册面板到系统服务（Service），所以必须使用 `screen` 软件来管理。

<br />

## 浏览器兼容性

- 支持 `Chrome` `Firefox` `Safari` `Opera` 等现代主流浏览器。
- 已放弃支持 `IE` 浏览器。

<br />

## 面板权限

控制面板在运行时会检测用户是否为空，若为空会自动创建一个默认的管理员账号。

如果您忘记了管理员账号，您只能备份现有的用户配置文件夹，并且重新生成一个新的管理员账号以覆盖。

<br />

## 问题报告

欢迎发现的任何问题进行反馈，必当及时修复。

若发现严重安全漏洞又不便公开发布，请发送邮件至: Suwings@outlook.com，安全问题修复后将在代码中附加漏洞发现者姓名。

<br />

## 版权约束

此开源项目使用 [GPL 协议](LICENSE) 作为开源协议，未经过官方闭源开发授权，您如果对代码有任何修改，则必须要公开您修改后的源代码，具体约束如下。

**准许**

- 对软件源代码进行修改，复制，分发。
- 利用软件进行商业使用，赚取利润。

**必须**

- 公开提供您修改后的完整源代码。
- 在代码文件、界面中保留版权声明。

**禁止**

- 禁止售卖此软件，申请专利，著作权等。

> 更多授权与版权约束详情，请前往官方网站界面了解更多。

<br />
