import React, { useEffect } from "react";
import useWebSocket from "react-use-websocket";

import "./App.css";

function EchoTime({ i }: { i: number }) {
  const { lastJsonMessage, sendMessage } = useWebSocket("ws://localhost:3000");

  return (
    <div>
      <p>{lastJsonMessage && lastJsonMessage.time}</p>

      <button
        onClick={() => {
          sendMessage(`test ${i}`);
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
      {arrayUpTo(10).map((i) => (
        <EchoTime key={i} i={i} />
      ))}
    </>
  );
}

export default App;
