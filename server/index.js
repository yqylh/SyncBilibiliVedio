const fs = require('fs');
const http = require('http');
const https = require('https');
const { randomUUID } = require('crypto');
const WebSocket = require('ws');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const HEARTBEAT_INTERVAL = 30000;
const TLS_CERT = process.env.SSL_CERT_PATH || process.env.TLS_CERT_PATH;
const TLS_KEY = process.env.SSL_KEY_PATH || process.env.TLS_KEY_PATH;
const TLS_CA = process.env.SSL_CA_PATH || process.env.TLS_CA_PATH;
const TLS_PASSPHRASE = process.env.SSL_PASSPHRASE || process.env.TLS_PASSPHRASE;

const useTLS = Boolean(TLS_CERT && TLS_KEY);

const rooms = new Map();

function makeId() {
  if (typeof randomUUID === 'function') return randomUUID();
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function ensureRoom(roomId) {
  let room = rooms.get(roomId);
  if (!room) {
    room = new Set();
    rooms.set(roomId, room);
  }
  return room;
}

function getRoomSnapshot(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room).map((client) => ({
    clientId: client.clientId,
    nickname: client.nickname,
  }));
}

function safeSend(ws, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch (err) {
    console.warn('send error', err.message);
  }
}

function broadcast(roomId, payload, exclude) {
  const room = rooms.get(roomId);
  if (!room) return;
  const serialized = JSON.stringify(payload);
  for (const client of room) {
    if (client === exclude) continue;
    if (client.readyState === WebSocket.OPEN) {
      client.send(serialized);
    }
  }
}

function removeFromRoom(ws) {
  if (!ws.roomId) return;
  const room = rooms.get(ws.roomId);
  if (!room) return;
  room.delete(ws);
  if (!room.size) {
    rooms.delete(ws.roomId);
  } else {
    const snapshot = getRoomSnapshot(ws.roomId);
    broadcast(ws.roomId, {
      type: 'presence',
      action: 'leave',
      clientId: ws.clientId,
      nickname: ws.nickname,
      clients: snapshot,
      serverTime: Date.now(),
    }, ws);
  }
  ws.roomId = null;
}

function handleJoin(ws, message) {
  const roomId = String(message.room || '').trim();
  const clientId = String(message.clientId || '').trim() || makeId();
  const nickname = String(message.nickname || '').trim() || 'anonymous';

  if (!roomId) {
    safeSend(ws, { type: 'error', error: { code: 'missing_room', message: 'room is required' } });
    return;
  }

  removeFromRoom(ws);

  ws.roomId = roomId;
  ws.clientId = clientId;
  ws.nickname = nickname;

  const room = ensureRoom(roomId);
  room.add(ws);

  const snapshot = getRoomSnapshot(roomId);

  safeSend(ws, {
    type: 'ack',
    room: roomId,
    clientId,
    nickname,
    clients: snapshot,
    serverTime: Date.now(),
  });

  broadcast(roomId, {
    type: 'presence',
    action: 'join',
    clientId,
    nickname,
    clients: snapshot,
    serverTime: Date.now(),
  }, ws);

  console.log(`[room ${roomId}] join ${clientId} (${nickname})`);
}

function handleEvent(ws, message) {
  if (!ws.roomId) {
    safeSend(ws, { type: 'error', error: { code: 'not_joined', message: 'join a room first' } });
    return;
  }
  if (!message.action) return;

  const payload = {
    type: message.type === 'heartbeat' ? 'heartbeat' : 'event',
    action: message.action,
    state: message.state || {},
    room: ws.roomId,
    clientId: ws.clientId,
    nickname: ws.nickname,
    sentAt: typeof message.sentAt === 'number' ? message.sentAt : Date.now(),
    serverTime: Date.now(),
  };

  broadcast(ws.roomId, payload, ws);
}

function handleMessage(ws, data) {
  let message;
  try {
    message = JSON.parse(data);
  } catch (err) {
    safeSend(ws, { type: 'error', error: { code: 'bad_json', message: 'invalid JSON payload' } });
    return;
  }

  switch (message.type) {
    case 'join':
      handleJoin(ws, message);
      break;
    case 'event':
    case 'heartbeat':
      handleEvent(ws, message);
      break;
    case 'ping':
      safeSend(ws, { type: 'pong', serverTime: Date.now() });
      break;
    default:
      safeSend(ws, { type: 'error', error: { code: 'unknown_type', message: `unsupported message type: ${message.type}` } });
  }
}

function createHttpServer() {
  if (!useTLS) {
    return http.createServer();
  }

  const options = {
    cert: fs.readFileSync(TLS_CERT),
    key: fs.readFileSync(TLS_KEY),
  };
  if (TLS_CA) {
    const segments = TLS_CA.split(',').map((item) => item.trim()).filter(Boolean);
    if (segments.length === 1) {
      options.ca = fs.readFileSync(segments[0]);
    } else if (segments.length > 1) {
      options.ca = segments.map((path) => fs.readFileSync(path));
    }
  }
  if (TLS_PASSPHRASE) {
    options.passphrase = TLS_PASSPHRASE;
  }

  return https.createServer(options);
}

const server = createHttpServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.clientId = makeId();
  ws.nickname = 'anonymous';
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    handleMessage(ws, data);
  });

  ws.on('close', () => {
    removeFromRoom(ws);
  });

  ws.on('error', (err) => {
    console.warn('socket error', err.message);
  });
});

const interval = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      removeFromRoom(ws);
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(interval);
});

server.listen(PORT, HOST, () => {
  const scheme = useTLS ? 'wss' : 'ws';
  console.log(`sync server listening on ${scheme}://${HOST}:${PORT}`);
  if (!useTLS) {
    console.log('WARNING: clients on https pages must use wss:// (enable TLS)');
  }
});
