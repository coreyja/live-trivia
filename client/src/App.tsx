import React, { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

import "./App.css";

const HOST = process.env.REACT_APP_HOST || window.location.origin;
const WEBSOCKET_HOST = HOST.replace(/^http/, "ws");

function EchoTime() {
  const { lastJsonMessage, sendMessage } = useWebSocket(
    `${WEBSOCKET_HOST}/ws`,
    {
      shouldReconnect: () => false,
    }
  );

  return (
    <div>
      <p>{lastJsonMessage && lastJsonMessage.time}</p>

      <button
        onClick={() => {
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
          fetch(`${HOST}/admin/login`, {
            method: "POST",
            body: "",
            credentials: "include",
          });
        }}
      >
        Admin Login
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

interface AdminProps {
  adminId: string;
}
const AdminApp = (_props: AdminProps) => <>Admin</>;

interface QuizProps {
  userName: string;
}
const QuizApp = (_props: QuizProps) => <>Quiz</>;
const Login = () => <>Login</>;

function WhoAmI() {
  const [adminId, setAdminId] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchMe() {
      const resp = await fetch("/me", { credentials: "include" });

      const json = await resp.json();
      if (json.adminId) {
        setAdminId(json.adminId);
      }
      if (json.userName) {
        setUserName(json.userName);
      }
    }
    fetchMe();
  }, []);

  if (adminId) {
    return <AdminApp adminId={adminId} />;
  }
  if (userName) {
    return <QuizApp userName={userName} />;
  }

  return <Login />;
}

function App() {
  return <WhoAmI />;
}

export default App;
