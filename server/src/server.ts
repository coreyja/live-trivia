import http from 'http';

import express from 'express';
import session, { MemoryStore } from 'express-session';
import cors from 'cors';
import WebSocket from 'ws';
import { nanoid } from 'nanoid';
import basicAuth from 'express-basic-auth';

import expressWS from 'express-ws';

interface ConnectedMessage {
  time: string;
}

type WebsocketMessage = ConnectedMessage | undefined;

// const map = new Map<string, WebSocket>();

const sendMessage = (msg: WebsocketMessage) => (client: WebSocket): void => {
  client.send(JSON.stringify(msg));
};

const PORT = process.env.PORT || 3000;

const sessionParser = session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: { secure: !process.env.INSECURE_COOKIE, httpOnly: true, sameSite: true },
  store: new MemoryStore(),
});

const expressWs = expressWS(express());
const app = expressWs.app;

app.use(express.json());
app.use(sessionParser);

app.use('/', express.static('public'));
app.use(
  '/admin/login',
  basicAuth({
    challenge: true,
    users: { admin: 'supersecret' },
  }),
);

app.get('/me', (req, res) => {
  if (!req.session) return;

  if (req.session.adminId) {
    res.send({ admin: true, adminId: req.session.adminId });
  } else if (req.session.userId) {
    res.send({ userId: req.session.userId, userName: req.session.userName });
  } else {
    res.send({ userId: null, userName: null });
  }
});

app.post('/login', function (req, res) {
  if (!req.session) return;

  if (!req.session.userId) {
    const id = nanoid();
    console.log(`Updating session for user ${id}`);
    req.session.userId = id;
  }

  if (req.body.userName) {
    req.session.userName = req.body.userName;
  }

  res.send({ userId: req.session.userId, userName: req.session.userName });
});

app.get('/admin/login', function (req, res) {
  if (!req.session) return;

  if (!req.session.adminId) {
    const id = nanoid();
    console.log(`Updating session for admin ${id}`);
    req.session.adminId = id;
  }

  res.redirect('/');
});

const wss = expressWs.getWss();

app.ws('/ws', (ws: WebSocket, req) => {
  if (!req.session || !req.session.userId) {
    ws.terminate();
    return;
  }

  const userId = req.session.userId;
  console.log(`Client connected - ${userId}`);
  ws.on('close', () => console.log(`Client disconnected - ${userId}`));
  ws.on('message', (data) => {
    console.log(`Message from ${userId}: ${data}`);
  });
});

app.ws('/ws/admin', (ws, req) => {
  if (!req.session || !req.session.adminId) {
    ws.terminate();
    return;
  }

  const adminId = req.session.adminId;
  console.log(`Admin Client connected - ${adminId}`);
  ws.on('close', () => console.log(`Admin Client disconnected - ${adminId}`));
  ws.on('message', (data) => {
    console.log(`Message from Admin ${adminId}: ${data}`);
  });
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

setInterval(() => {
  const time = new Date().toTimeString();
  const sendToClient = sendMessage({ time });

  wss.clients && wss.clients.forEach(sendToClient);
}, 1000);

setInterval(() => {
  console.log(`Client Count: ${wss.clients && wss.clients.size}`);
}, 500);
