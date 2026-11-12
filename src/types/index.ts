export interface QuestionConfig {
  questionNumber: number;
  maxScore: number;
}

export interface Exam {
  id: string;
  courseName: string;      // e.g. Matematik
  gradeClass: string;      // e.g. 6
  section: string;         // e.g. F
  term: string;            // e.g. 1. Dönem
  examName: string;        // e.g. 2. Yazılı Yoklama
  examDate: string;        // e.g. 2026-11-12
  questions: QuestionConfig[];
  totalMaxScore: number;   // usually 100
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface ScoredQuestion {
  questionNumber: number;
  score: number | null;
  maxScore: number;
  confidence: number;
  isOverridden?: boolean;
  teacherNote?: string;
}

export interface StudentResult {
  id: string;
  examId: string;
  studentNumber: string;
  studentName: string;
  className: string;
  scores: ScoredQuestion[];
  totalScore: number;
  scaledGrade: number;     // out of 100
  hasMissingScores: boolean;
  frontImage?: string;     // base64 preview
  backImage?: string;      // base64 preview
  notes?: string;
  scannedAt: string;
  verifiedAt?: string;
}

export interface GeminiAnalysisResponse {
  studentName: string;
  className: string;
  studentNumber: string;
  notes?: string;
  scores: {
    questionNumber: number;
    score: number | null;
    confidence: number;
    teacherNote?: string;
  }[];
}

export interface BatchStudentAnalysis {
  studentName: string;
  className: string;
  studentNumber: string;
  pagesDetected?: string;
  notes?: string;
  scores: {
    questionNumber: number;
    score: number | null;
    confidence: number;
    teacherNote?: string;
  }[];
}

export type ActiveTab = 
  | 'create-exam'
  | 'scan-paper'
  | 'batch-pdf'
  | 'student-list'
  | 'exam-results'
  | 'excel-reports'
  | 'exam-archive'
  | 'settings';
