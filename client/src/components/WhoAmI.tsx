import React, { useEffect, useState } from "react";

import AdminApp from "./admin/App";
import QuizPlayer from "./QuizPlayer";

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
    return <QuizPlayer userName={userName} />;
  }

  return (
    <>
      <button
        onClick={() => {
          fetch(`/login`, {
            method: "POST",
            body: "",
            credentials: "include",
          });
        }}
      >
        Login
      </button>
    </>
  );
}

export default WhoAmI;
