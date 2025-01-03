// src/types/exam.ts
export type ExamLevel = 'undergraduate' | 'graduate' | 'phd' | 'professional';
export type GradingHarshness = 'lenient' | 'moderate' | 'strict' | 'very-strict';

export interface Question {
  id: string;
  question: string;
  exampleAnswer: string;
  markingSchema: string;
}

export interface Exam {
  id: string;
  title: string;
  date: string;
  subject?: string;
  level?: ExamLevel;
  harshness?: GradingHarshness;
  questions: Question[];
}

export interface GradingCriterion {
  criterion: string;
  points_awarded: number;
  points_possible: number;
  deduction_reason?: string;
}

export interface GradingFeedback {
  detailed_comments: string;
  criteria_met: string[];
  criteria_unmet: string[];
  improvements: string[];
}

export interface GradingResult {
  matched_question: {
    question: string;
    confidence: number;
  };
  grading: {
    final_score: number;
    total_points_possible: number;
    confidence: number;
    schema_criteria: Array<{
      criterion: string;
      points_awarded: number;
      points_possible: number;
      deduction_reason: string;
    }>;
  };
  feedback: {
    detailed_comments: string;
    criteria_met: string[];
    criteria_unmet: string[];
    improvements: string[];
  };
}
