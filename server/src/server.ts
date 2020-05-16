import express from 'express';
import WebSocket, { Server } from 'ws';

interface ConnectedMessage {
  time: string;
}

type WebsocketMessage = ConnectedMessage | undefined;

const sendMessage = (msg: WebsocketMessage) => (client: WebSocket): void => {
  client.send(JSON.stringify(msg));
};

const PORT = process.env.PORT || 3000;

const server = express()
  .use((_req, res) => {
    res.sendFile('index.html', { root: __dirname });
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server: server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

setInterval(() => {
  const time = new Date().toTimeString();
  const sendToClient = sendMessage({ time });

  wss.clients.forEach(sendToClient);
}, 1000);

setInterval(() => {
  console.log(`Client Count: ${wss.clients.size}`);
}, 500);
