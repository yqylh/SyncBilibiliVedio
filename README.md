# bilibili 远程同步播放视频

因为 B 站的一起看功能只支持特定番剧，而且并不好用：没法倍速等功能。  
所以用 codex 帮我写了这个工具，本脚本未经过充分测试，所有代码由 codex 编写。  

版权说明
1. 本工具仅做“同步播放时间点”控制，每个用户仍然从 B 站官方途径观看视频，且不改变视频源、无缓存／分发视频，且无收费／商业行为。
2. 用户必须合法观看视频，仅支持官方渠道观看，本工具不提供视频资源、仅同步控制。
3. 本工具仅提供服务器版本的代码，不提供现有的服务器支持。

## 使用

进入任何 bilibili.com / (bangumi | vedio) ，在右上角的弹窗里输入服务器 URL，roomID（提前商议好），Nickname，点击 connect 即可。

## Chrome安装

1. 在 Chrome 安装油猴
2. 通过 [greasy fork](https://greasyfork.org/zh-CN/scripts/553759-bilibili-playback-sync) 安装这个脚本

## 服务器安装

一台特定端口可用的服务器

1. 安装 node && npm

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
node -v
npm -v
```

2. 安装证书

```sh
sudo certbot certonly --standalone -d yourDomain
```
由于以油猴脚本的方式运行, B站禁止非 https 的链接访问, 所以服务器要提供 SSL 证书,可以通过 Let’s Encrypt 配置

3. 安装项目

```sh
git clone https://github.com/yqylh/SyncBilibiliVedio
cd SyncBilibiliVedio/
cd server/
npm install
```

4. 启动

```sh
PORT=443 \
SSL_CERT_PATH=/path/to/cert.pem \
SSL_KEY_PATH=/path/to/key.pem \
npm start
```
然后你可以在网页输入 Server URL: `wss://yourDomain`

如有侵权，请联系我。
