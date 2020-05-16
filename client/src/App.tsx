import React, { useEffect } from "react";
import useWebSocket from "react-use-websocket";

import "./App.css";

const HOST = process.env.REACT_APP_HOST || window.location.origin;
const WEBSOCKET_HOST = HOST.replace(/^http/, "ws");

function EchoTime() {
  const { lastJsonMessage, sendMessage } = useWebSocket(WEBSOCKET_HOST, {
    shouldReconnect: () => true,
  });

  return (
    <div>
      <p>{lastJsonMessage && lastJsonMessage.time}</p>

      <button
        onClick={() => {
          sendMessage("test");
          fetch(`${HOST}/login`, {
            method: "POST",
            body: "",
            credentials: "include",
          });
        }}
      >
        Login
      </button>

      <button
        onClick={() => {
          sendMessage("test");
        }}
      >
        Submit
      </button>
    </div>
  );
}

function arrayUpTo(n: number) {
  let a = [];
  for (let i = 0; i < n; i++) {
    a.push(i);
  }
  return a;
}

function App() {
  return (
    <>
      <EchoTime />
    </>
  );
}

export default App;
