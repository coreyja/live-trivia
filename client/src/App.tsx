import React, { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

import "./App.css";

const HOST = process.env.REACT_APP_HOST || window.location.origin;
const WEBSOCKET_HOST = HOST.replace(/^http/, "ws");

function EchoTime() {}

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
