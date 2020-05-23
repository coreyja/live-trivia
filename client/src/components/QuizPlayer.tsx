import React, { FunctionComponent } from "react";
import useWebSocket from "react-use-websocket";

import { WEBSOCKET_HOST } from "../urls";
import { WebsocketMessage } from "server/src/messages/outgoing/user";
import { AnswerQuestionMessage } from "server/src/messages/incoming/user";

interface Props {
  userName: string;
}

const Header: FunctionComponent<Props> = (props) => {
  return (
    <div>
      <h1>Hello {props.userName}</h1>
    </div>
  );
};

const Loading = () => <>No Messages Yet</>;

const Inner = () => {
  const { lastJsonMessage, sendMessage } = useWebSocket(
    `${WEBSOCKET_HOST}/ws`,
    {
      shouldReconnect: () => true,
    }
  );

  const message = lastJsonMessage as WebsocketMessage | undefined;

  if (!message) {
    return <Loading />;
  } else if (message.event === "connected") {
    return <>The time is: {message.time}</>;
  } else if (message.event === "question" || message.event === "ack-answer") {
    const q = message.question;

    const secondsLeft = Math.floor(Math.max(q.secondsLeft, 0));

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
        <h3>Time Left: {secondsLeft}</h3>
        <p>{q.text}</p>

        {message.event === "ack-answer"
          ? `You answered ${message.answer}`
          : q.answers.map((a) => (
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

const QuizPlayer: FunctionComponent<Props> = (props) => (
  <>
    <Header {...props} />
    <Inner />
  </>
);
export default QuizPlayer;
