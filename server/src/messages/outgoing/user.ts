import { FilteredAnswer, TriviaQuestion, filterAnswer } from '../../models';

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

export interface AckAnswerMessage {
  event: 'ack-answer';
  answer: string;
  question: {
    id: string;
    text: string;
    answers: FilteredAnswer[];
    secondsLeft: number;
  };
}

export interface QuestionScoreMessage {
  event: 'question-score';
  questionId: string;
  answer?: string;
  points: number;
  currentScore: number;
  place: number;
}

export type WebsocketMessage = ConnectedMessage | QuestionMessage | AckAnswerMessage | QuestionScoreMessage;
