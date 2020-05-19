import http from 'http';

import express from 'express';
import session, { MemoryStore } from 'express-session';
import cors from 'cors';
import WebSocket from 'ws';
import { nanoid } from 'nanoid';
import basicAuth from 'express-basic-auth';
import expressWS from 'express-ws';
import { map } from 'lodash';

import { get, set, setJson, getJson } from './store';
import {
  TriviaQuestionAttributes,
  TriviaQuestion,
  WebsocketMessage,
  QuestionMessage,
  questionToMessage,
  ConnectedMessage,
} from './models';

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

const userSocketMap = new Map<string, WebSocket>();

app.ws('/ws', (ws: WebSocket, req) => {
  if (!req.session || !req.session.userId) {
    ws.terminate();
    return;
  }

  const userId = req.session.userId;
  console.log(`Client connected - ${userId}`);
  userSocketMap.set(userId, ws);
  ws.on('close', () => {
    userSocketMap.delete(userId);
    console.log(`Client disconnected - ${userId}`);
  });
  ws.on('message', (data) => {
    console.log(`Message from ${userId}: ${data}`);
  });
});

const broadcastQuestionToAllUsers = (question: TriviaQuestion): void => {
  const message: QuestionMessage = questionToMessage(question);
  const sendToClient = sendMessage(message);
  userSocketMap.forEach(sendToClient);
};

const startNewQuestion = (q: TriviaQuestionAttributes): void => {
  const questionStartedAt = Date.now();

  const currentQuestion: TriviaQuestion = {
    id: q.id,
    text: q.text,
    answers: q.answers,
    endsAt: questionStartedAt + q.seconds * 1000,
  };
  setJson('currentQuestion', currentQuestion);
  broadcastQuestionToAllUsers(currentQuestion);
};

const adminSocketMap = new Map<string, WebSocket>();
app.ws('/ws/admin', (ws, req) => {
  if (!req.session || !req.session.adminId) {
    ws.terminate();
    return;
  }

  const adminId = req.session.adminId;
  console.log(`Admin Client connected - ${adminId}`);
  adminSocketMap.set(adminId, ws);
  ws.on('close', () => console.log(`Admin Client disconnected - ${adminId}`));
  ws.on('message', (data) => {
    console.log(`Message from Admin ${adminId}: ${data}`);

    const json = JSON.parse(data.toString());
    if (json.event === 'new-question') {
      const body = json.body;

      const a1 = { text: body.answer1, points: body.correctAnswer === 'answer1' ? 1 : 0 };
      const a2 = { text: body.answer2, points: body.correctAnswer === 'answer2' ? 1 : 0 };
      const a3 = { text: body.answer3, points: body.correctAnswer === 'answer3' ? 1 : 0 };
      const a4 = { text: body.answer4, points: body.correctAnswer === 'answer4' ? 1 : 0 };

      startNewQuestion({ id: nanoid(), text: body.question, answers: [a1, a2, a3, a4], seconds: body.seconds });
    }
  });
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

setInterval(() => {
  const time = new Date().toTimeString();
  const q = getJson('currentQuestion') as TriviaQuestion | undefined;
  const message: WebsocketMessage = q ? questionToMessage(q) : { event: 'connected', time };
  const sendToClient = sendMessage(message);

  wss.clients && wss.clients.forEach(sendToClient);
}, 1000);

setInterval(() => {
  console.log(`Client Count: ${wss.clients && wss.clients.size}`);
}, 500);
