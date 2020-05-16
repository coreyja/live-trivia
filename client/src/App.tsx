import React from "react";
import useWebSocket from "react-use-websocket";

import logo from "./logo.svg";
import "./App.css";

function EchoTime() {
  const { lastJsonMessage } = useWebSocket("ws://localhost:3000");

  return <p>{lastJsonMessage && lastJsonMessage.time}</p>;
}

function arrayUpTo(n: number) {
  if (n < 0) {
    return [];
  } else {
    let a = [0];
    for (let i = 0; i < n; i++) {
      a.push(i);
    }
    return a;
  }
}

function App() {
  return (
    <>
      {arrayUpTo(100).map((i) => (
        <EchoTime key={i} />
      ))}
    </>
  );
}

export default App;
