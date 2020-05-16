import express from 'express';
import { Server } from 'ws';

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
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);
