import React, { FunctionComponent } from "react";
import { useForm } from "react-hook-form";
import useWebSocket from "react-use-websocket";

import { WEBSOCKET_HOST } from "../../urls";

interface Props {
  adminId: string;
}

const AdminApp: FunctionComponent<Props> = (_props) => {
  const { lastJsonMessage, sendMessage } = useWebSocket(
    `${WEBSOCKET_HOST}/ws/admin`,
    {
      shouldReconnect: () => true,
    }
  );
  const { register, handleSubmit } = useForm<FormData>();

  const onSubmit = handleSubmit((data) => {
    const message = { event: "new-question", body: data };
    sendMessage(JSON.stringify(message));
  });

  return (
    <form onSubmit={onSubmit}>
      <label>
        Question
        <input type="text" ref={register()} name="question" />
      </label>
      <br />

      <label>
        Answer 1
        <input type="text" ref={register()} name="answer1" />
      </label>
      <br />
      <label>
        Answer 2
        <input type="text" ref={register()} name="answer2" />
      </label>
      <br />
      <label>
        Answer 3
        <input type="text" ref={register()} name="answer3" />
      </label>
      <br />
      <label>
        Answer 4
        <input type="text" ref={register()} name="answer4" />
      </label>
      <br />

      <label>Correct Answer</label>
      <br />

      <label>
        Answer 1
        <input
          type="radio"
          name="correctAnswer"
          value="answer1"
          ref={register()}
        />
      </label>
      <br />
      <label>
        Answer 2
        <input
          type="radio"
          name="correctAnswer"
          value="answer2"
          ref={register()}
        />
      </label>
      <br />
      <label>
        Answer 3
        <input
          type="radio"
          name="correctAnswer"
          value="answer3"
          ref={register()}
        />
      </label>
      <br />
      <label>
        Answer 4
        <input
          type="radio"
          name="correctAnswer"
          value="answer4"
          ref={register()}
        />
      </label>
      <br />

      <label>
        Seconds to answer
        <input
          type="number"
          defaultValue={60}
          ref={register()}
          name="seconds"
        />
      </label>
      <br />

      <button type="submit">Start new question!</button>
    </form>
  );
};

export default AdminApp;
