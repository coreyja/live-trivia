import React, { FunctionComponent } from "react";
import useWebSocket from "react-use-websocket";

import { WEBSOCKET_HOST } from "../urls";
import { WebsocketMessage } from "server/src/models";

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

    const answerQuestion = (answer: string): void => {
      sendMessage(
        JSON.stringify({
          event: "answer-question",
          question_id: q.id,
          answer: answer,
        })
      );
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
    return <>Error state</>;
  }
};

export default QuizPlayer;
