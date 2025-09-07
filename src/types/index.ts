// Question data structure
export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false';
  text: string;
  correctAnswer: string;
  options?: {
    [key: string]: string;
  };
  explanation?: string;
}

// Persistent quiz data structure
export interface QuizData {
  failedQuestions: Question[];
  answeredQuestions: Question[];
  markedQuestions: Question[];
}

// True/False question specific structure (for tools)
export interface TrueFalseQuestion {
  id: string;
  type: 'true-false';
  text: string;
  correctAnswer: 'O' | 'X';
  explanation?: string;
}

// Multiple choice question specific structure (for tools)
export interface MultipleChoiceQuestion {
  id: string;
  type: 'multiple-choice';
  text: string;
  correctAnswer: string;
  options: {
    [key: string]: string;
  };
}

// Color constants for terminal output
export const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  bright: '\x1b[1m'
} as const;