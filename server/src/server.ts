import http from 'http';

import express from 'express';
import session, { MemoryStore } from 'express-session';
import cors from 'cors';
import WebSocket from 'ws';
import { nanoid } from 'nanoid';

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

const app = express();

app.use(sessionParser);
app.use('/', express.static('public'));

app.post('/login', function (req, res) {
  if (req.session && req.session.userId) {
    res.send({ result: 'OK', message: 'Already logged in' });
    return;
  }
  debugger;

  const id = nanoid();
  console.log(`Updating session for user ${id}`);
  req.session!.userId = id;
  res.send({ result: 'OK', message: 'Session updated' });
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');

  sessionParser(request, {} as any, () => {
    if (!request.session.userId) {
      socket.destroy();
      return;
    }

    console.log(`There is a user id now - ${request.session.userId}`);
    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request);
    });
  });
});

wss.on('connection', (ws, request) => {
  const userId = (request as any).session.userId;

  console.log(`Client connected - ${userId}`);

  ws.on('close', () => console.log(`Client connected - ${userId}`));

  ws.on('message', (data) => {
    console.log(`Message from ${userId}: ${data}`);
  });
});

server.listen(PORT, () => console.log(`Listening on ${PORT}`));

setInterval(() => {
  const time = new Date().toTimeString();
  const sendToClient = sendMessage({ time });

  wss.clients && wss.clients.forEach(sendToClient);
}, 1000);

setInterval(() => {
  console.log(`Client Count: ${wss.clients && wss.clients.size}`);
}, 500);
