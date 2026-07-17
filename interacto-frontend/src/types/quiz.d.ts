export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  _id: string;
  title: string;
  audience: string;
  goal: string;
  difficulty: QuizDifficulty;
  questions: QuizQuestion[];
  roomCode: string;
  createdAt: string;
  updatedAt: string;
}

export type QuizRoomStatus = 'lobby' | 'active' | 'finished';

export interface QuizParticipant {
  participantId: string;
  name: string;
  connected: boolean;
  score: number;
  answeredCount: number;
  answeredCurrent: boolean;
}

export interface QuizRoomState {
  code: string;
  status: QuizRoomStatus;
  currentQuestionIndex: number;
  questionEndsAt: string | null;
  participants: QuizParticipant[];
}

export interface QuizQuestionBroadcast {
  index: number;
  total: number;
  text: string;
  options: string[];
  endsAt: string;
}
