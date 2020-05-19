export interface Answer {
  text: string;
  points: number;
}

export interface FilteredAnswer {
  text: string;
}

export interface TriviaQuestionAttributes {
  id: string;
  text: string;
  answers: Answer[];
  seconds: number;
}

export interface TriviaQuestion {
  id: string;
  text: string;
  answers: Answer[];
  endsAt: number;
}

export interface ConnectedMessage {
  event: 'connected';
  time: string;
}

export interface QuestionMessage {
  event: 'question';
  question: {
    id: string;
    text: string;
    answers: FilteredAnswer[];
    secondsLeft: number;
  };
}

export type WebsocketMessage = ConnectedMessage | QuestionMessage;

export const filterAnswer = ({ text }: Answer): FilteredAnswer => ({ text });

export const questionToMessage = ({ id, text, answers, endsAt }: TriviaQuestion): QuestionMessage => ({
  event: 'question',
  question: {
    id,
    text,
    answers: answers.map(filterAnswer),
    secondsLeft: (endsAt - Date.now()) / 1000.0,
  },
});
