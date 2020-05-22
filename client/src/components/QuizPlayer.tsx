import React, { FunctionComponent } from "react";
import useWebSocket from "react-use-websocket";

import { WEBSOCKET_HOST } from "../urls";
import { WebsocketMessage } from "server/src/messages/outgoing/user";
import { AnswerQuestionMessage } from "server/src/messages/incoming/user";

interface Props {
  userName: string;
}

const QuizPlayer: FunctionComponent<Props> = (props) => {
  const { lastJsonMessage, sendMessage } = useWebSocket(
    `${WEBSOCKET_HOST}/ws`,
    {
      shouldReconnect: () => true,
    }
  );

  const message = lastJsonMessage as WebsocketMessage | undefined;

  if (!message) {
    return <>No Messages Yet</>;
  } else if (message.event === "connected") {
    return <>The time is: {message.time}</>;
  } else if (message.event === "question") {
    const q = message.question;

    if (q.secondsLeft > 0) {
      const answerQuestion = (answer: string): void => {
        const message: AnswerQuestionMessage = {
          event: "answer-question",
          questionId: q.id,
          answer: answer,
        };
        sendMessage(JSON.stringify(message));
      };

      return (
        <div>
          <h1>Hello {props.userName}</h1>
          <h3>Time Left: {q.secondsLeft}</h3>
          <p>{q.text}</p>

          {q.answers.map((a) => (
            <button
              onClick={() => {
                answerQuestion(a.text);
              }}
            >
              {a.text}
            </button>
          ))}
        </div>
      );
    } else {
      return (
        <>
          <p>Question is over, waiting for next one.</p>
          <p>Did you get that last one right?!</p>
        </>
      );
    }
  } else if (message.event === "ack-answer") {
    return <>You answered {message.answer}</>;
  } else if (message.event === "question-score") {
    const { answer, points, currentScore, place } = message;

    if (answer) {
      return (
        <>
          <p>You're answer of {answer} was.....</p>
          <p>
            {points > 0
              ? `Correct! You got ${points} points(s)`
              : "Incorrect :-("}
          </p>
          <p>Your current score is: {currentScore}</p>
          <p>Your place is: {place}</p>
        </>
      );
    } else {
      return <>You missed this question and didn't answer :-(</>;
    }
  } else {
    return <>Error state</>;
  }
};

export default QuizPlayer;
