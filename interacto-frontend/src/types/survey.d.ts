export type QuestionType = 'short_text' | 'long_text' | 'multiple_choice' | 'rating';

export interface SurveyQuestion {
  _id?: string;
  text: string;
  type: QuestionType;
  options: string[];
  required: boolean;
}

export interface SurveyResponse {
  answers: string[];
  submittedAt: string;
}

export interface Survey {
  _id: string;
  title: string;
  audience: string;
  goal: string;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  createdAt: string;
  updatedAt: string;
}
