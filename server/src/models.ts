import { QuestionMessage } from './messages/outgoing/user';

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

export const filterAnswer = ({ text }: Answer): FilteredAnswer => ({ text });
