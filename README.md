## 使用

进入任何 bilibili.com / (bangumi | vedio) ，在右上角的弹窗里输入服务器 URL，roomID（提前商议好），Nickname，点击 connect 即可。

## Chrome安装

1. 在 Chrome 安装油猴
2. 复制 bili-sync.user.js的内容，在油猴点击添加新脚本，覆盖粘贴保存就好了

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

---
以下内容为 GPT 生成

## Notes

- The script automatically handles video element swaps and suppresses echo loops.
- Heartbeat messages keep participants aligned; adjust `HEARTBEAT_MS` in the script if you need tighter drift correction.
- Consider protecting your relay with authentication or random room IDs when deploying publicly.

## License

MIT
