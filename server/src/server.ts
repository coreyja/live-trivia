import http from 'http';

import express from 'express';
import session, { MemoryStore } from 'express-session';
import cors from 'cors';
import WebSocket from 'ws';
import { nanoid } from 'nanoid';
import basicAuth from 'express-basic-auth';
import expressWS from 'express-ws';
import { map, sum, sortBy } from 'lodash';

import { setJson, getJson, printState } from './store';
import { TriviaQuestionAttributes, TriviaQuestion, filterAnswer } from './models';

import { IncomingUserMessage } from './messages/incoming/user';
import { QuestionMessage, ConnectedMessage, AckAnswerMessage, WebsocketMessage } from './messages/outgoing/user';
import { OutgoingAdminMessage } from './messages/outgoing/admin';

const sendUserMessage = (msg: WebsocketMessage) => (client: WebSocket): void => {
  client.send(JSON.stringify(msg));
};
const sendAdminMessage = (msg: OutgoingAdminMessage) => (client: WebSocket): void => {
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

const questionToMessage = (
  { id, text, answers, endsAt }: TriviaQuestion,
  options: { now?: number } = {},
): QuestionMessage => {
  const defaultedNow = options.now || Date.now();
  const secondsLeft = (endsAt - defaultedNow) / 1000.0;

  return {
    event: 'question',
    question: {
      id,
      text,
      secondsLeft,
      answers: answers.map(filterAnswer),
    },
  };
};

const userSocketMap = new Map<string, WebSocket | undefined>();
const adminSocketMap = new Map<string, WebSocket>();

app.ws('/ws', (ws: WebSocket, req) => {
  if (!req.session || !req.session.userId) {
    ws.terminate();
    return;
  }

  const userId = req.session.userId;
  console.log(`Client connected - ${userId}`);
  userSocketMap.set(userId, ws);
  ws.on('close', () => {
    userSocketMap.set(userId, undefined);
    console.log(`Client disconnected - ${userId}`);
  });

  ws.on('message', (data) => {
    console.log(`Message from ${userId}: ${data}`);
    const json = JSON.parse(data.toString()) as IncomingUserMessage;

    if (json.event === 'answer-question') {
      const key = `answers:${userId}`;
      const usersAnswers = getJson(key) || {};
      if (usersAnswers[json.questionId]) {
      } else {
        usersAnswers[json.questionId] = json.answer;
      }
      usersAnswers;
      setJson(key, usersAnswers);

      const questions: TriviaQuestion[] = getJson('questions') || [];
      const question = questions.find((q) => q.id === json.questionId);

      if (question) {
        const m1 = questionToMessage(question);
        const m2: AckAnswerMessage = {
          event: 'ack-answer',
          question: m1.question,
          answer: json.answer,
        };
        sendUserMessage(m2)(ws);
      }
    }
  });
});

const broadcastQuestionToAllUsers = (question: TriviaQuestion): void => {
  const now = Date.now();
  const message: QuestionMessage = questionToMessage(question, { now });
  const sendToClient = sendUserMessage(message);
  userSocketMap.forEach((u) => {
    u && sendToClient(u);
  });
};

const timerify = (label: string, inner: Function) => (): void => {
  const now = Date.now();
  inner();
  console.log(`Function:${label} took ${Date.now() - now}`);
};

const numberOfAnswers = (question: TriviaQuestion): number => {
  let count = 0;

  userSocketMap.forEach((_ws, userId): void => {
    const answers = getJson(`answers:${userId}`) || {};
    if (answers[question.id]) count += 1;
  });

  return count;
};

const scoreForQuetion = (userId: string, question: TriviaQuestion): number => {
  const answers = getJson(`answers:${userId}`) || {};
  const answer = answers[question.id];

  return question.answers.find((a) => a.text === answer)?.points || 0;
};

const currentScoreForUser = (userId: string): number => {
  const questions: TriviaQuestion[] = getJson('questions') || [];

  return sum(questions.map((q): number => scoreForQuetion(userId, q)));
};

const sendScoresForQuestion = (q: TriviaQuestion): void => {
  const userScores: Record<string, number> = {};

  userSocketMap.forEach((_ws, userId) => {
    userScores[userId] = currentScoreForUser(userId);
  });

  const sortedUserScores: { userId: string; score: number }[] = sortBy(
    map(userScores, (score: number, userId: string) => ({
      userId,
      score,
    })),
    ({ score }) => score,
  );

  console.log(sortedUserScores);
  sortedUserScores.forEach(({ userId, score }, index) => {
    const ws = userSocketMap.get(userId);
    if (!ws) return;

    const answers = getJson(`answers:${userId}`) || {};
    const answer = answers[q.id];
    const place = index + 1;

    if (answer) {
      const points = scoreForQuetion(userId, q);

      sendUserMessage({
        event: 'question-score',
        questionId: q.id,
        points,
        answer,
        currentScore: score,
        place,
      })(ws);
    } else {
      sendUserMessage({
        event: 'question-score',
        questionId: q.id,
        points: 0,
        currentScore: score,
        place,
      })(ws);
    }
  });
};

const startNewQuestion = (q: TriviaQuestionAttributes): void => {
  const questionStartedAt = Date.now();

  const currentQuestion: TriviaQuestion = {
    id: q.id,
    text: q.text,
    answers: q.answers,
    endsAt: questionStartedAt + q.seconds * 1000,
  };
  const questions = getJson('questions') || [];
  // setJson('currentQuestion', currentQuestion);
  setJson('questions', questions.concat(currentQuestion));

  broadcastQuestionToAllUsers(currentQuestion);

  const user = (now: number): void => {
    userSocketMap.forEach((ws, userId) => {
      if (!ws) return;

      const answers = getJson(`answers:${userId}`) || {};
      const answer = answers[currentQuestion.id];

      const message = questionToMessage(currentQuestion, { now });

      if (answer) {
        const m: AckAnswerMessage = {
          event: 'ack-answer',
          question: message.question,
          answer: answer,
        };
        sendUserMessage(m)(ws);
      } else {
        sendUserMessage(message)(ws);
      }
    });
  };

  const admin = (now: number): void => {
    const timeLeft = currentQuestion.endsAt - now;
    const msg = sendAdminMessage({
      event: 'question-stat',
      users: userSocketMap.size,
      answers: numberOfAnswers(currentQuestion),
      timeLeft,
    });
    adminSocketMap.forEach(msg);
  };

  const poll = (): void => {
    const now = Date.now();

    user(now);
    admin(now);

    if (now < currentQuestion.endsAt) {
      setTimeout(poll, 100);
    } else {
      sendScoresForQuestion(currentQuestion);
    }
  };
  poll();
};

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

process.on('exit', printState);
process.on('SIGINT', printState);
