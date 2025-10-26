## 使用

进入任何 bilibili.com / (bangumi | vedio) ，在右上角的弹窗里输入服务器 URL，roomID（提前商议好），Nickname，点击 connect 计科。

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
3. 安装项目

```sh
git clone https://github.com/yqylh/SyncBilibiliVedio
cd SyncBilibiliVedio/
cd server/
npm install
```

4. 启动

```sh
PORT=3000 \
SSL_CERT_PATH=~/ssl/cert.pem \
SSL_KEY_PATH=~/ssl/key.pem \
npm start
```

如果在本地，可用的链接为 `ws://localhost:3000`


---
一下内容为 GPT 生成

# SyncBilibiliVedio

Playback synchronization toolkit for bilibili, including a Tampermonkey userscript and a lightweight WebSocket relay server.

## Components

- `bili-sync.user.js`: userscript that injects a floating panel on bilibili video pages to connect to a sync room.
- `server/`: Node.js WebSocket relay supporting rooms, presence, and TLS (`ws` / `wss`).

## Running the Relay Server

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Run without TLS (for local HTTP testing only):
   ```bash
   PORT=3000 npm start
   ```
   > **Note:** HTTPS pages (like bilibili.com) refuse plaintext `ws://` connections. Use TLS (`wss://`) in production.

3. Run with TLS (recommended for real use):
   ```bash
   PORT=443 \
   SSL_CERT_PATH=/path/to/fullchain.pem \
   SSL_KEY_PATH=/path/to/privkey.pem \
   npm start
   ```
   - Certificates can come from services like [Let’s Encrypt](https://letsencrypt.org/).
   - Optional variables:
     - `SSL_CA_PATH` – comma-separated CA bundle files
     - `SSL_PASSPHRASE` – key passphrase if required

4. Reverse proxy alternative: place nginx/caddy in front to terminate TLS and forward to `ws://127.0.0.1:3000`.

## Userscript Usage

1. Open Tampermonkey → Create new script → paste `bili-sync.user.js` contents → Save & enable.
2. Visit a bilibili video page. The “Bili Sync” panel will appear (top-right).
3. Enter the relay server URL (e.g., `wss://your-domain:443`), room ID, and nickname, then click **Connect**.
4. Ask your friend to connect to the same room. Playback actions (play/pause/seek/rate) will mirror, and the log shows presence updates.

## Notes

- The script automatically handles video element swaps and suppresses echo loops.
- Heartbeat messages keep participants aligned; adjust `HEARTBEAT_MS` in the script if you need tighter drift correction.
- Consider protecting your relay with authentication or random room IDs when deploying publicly.

## License

MIT
