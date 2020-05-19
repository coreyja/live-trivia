import React from "react";
import useWebSocket from "react-use-websocket";

import { WEBSOCKET_HOST } from "../urls";

interface Props {
  userName: string;
}

const QuizPlayer = (props: Props) => {
  const { lastJsonMessage, sendMessage } = useWebSocket(
    `${WEBSOCKET_HOST}/ws`,
    {
      shouldReconnect: () => true,
    }
  );

  return (
    <div>
      <h1>Hello {props.userName}</h1>
      <p>{lastJsonMessage && JSON.stringify(lastJsonMessage)}</p>

      <button
        onClick={() => {
          sendMessage("test");
        }}
      >
        Submit
      </button>
    </div>
  );
};

export default QuizPlayer;
