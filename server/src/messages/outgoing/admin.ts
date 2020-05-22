export interface AdminQuestionStatsMessage {
  event: 'question-stat';
  users: number;
  answers: number;
  timeLeft: number;
}

export type OutgoingAdminMessage = AdminQuestionStatsMessage;
