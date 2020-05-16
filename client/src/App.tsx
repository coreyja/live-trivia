import React from 'react';
import useWebSocket from 'react-use-websocket';

import logo from './logo.svg';
import './App.css';

function App() {
  const socketUrl = 'wss://echo.websocket.org';

const {
  sendMessage,
  sendJsonMessage,
  lastMessage,
  lastJsonMessage,
  readyState,
  getWebSocket
} = useWebSocket(socketUrl, {
  onOpen: () => console.log('opened'),
  //Will attempt to reconnect on all close events, such as server shutting down
  shouldReconnect: (closeEvent) => true,
});

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Will this auto-reload...
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
