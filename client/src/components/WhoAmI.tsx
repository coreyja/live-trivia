import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import AdminApp from "./admin/App";
import QuizPlayer from "./QuizPlayer";

type LoginFormData = {
  userName: string;
};

function WhoAmI() {
  const [adminId, setAdminId] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const { register, handleSubmit } = useForm<LoginFormData>();

  const onSubmit = handleSubmit(async (data) => {
    const resp = await fetch("/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await resp.json();
    if (json.userName) {
      setUserName(json.userName);
    }
  });

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
      <form onSubmit={onSubmit}>
        <input type="text" ref={register()} name="userName" />

        <button type="submit">Login</button>
      </form>
    </>
  );
}

export default WhoAmI;
