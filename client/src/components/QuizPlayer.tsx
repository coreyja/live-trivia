import React, { FunctionComponent } from "react";
import useWebSocket from "react-use-websocket";

import { WEBSOCKET_HOST } from "../urls";
import { WebsocketMessage, AnswerQuestionMessage } from "server/src/models";

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
          Question is over, waiting for next one. Did you get that last one
          right?!
        </>
      );
    }
  } else if (message.event === "ack-answer") {
    return <>You answered {message.answer}</>;
  } else {
    return <>Error state</>;
  }
};

export default QuizPlayer;
