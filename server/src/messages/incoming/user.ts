export interface AnswerQuestionMessage {
  event: 'answer-question';
  questionId: string;
  answer: string;
}

export type IncomingUserMessage = AnswerQuestionMessage;
