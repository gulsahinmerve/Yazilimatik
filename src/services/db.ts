import { Exam, StudentResult } from '../types';

const DB_NAME = 'YazilikmatikDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains('exams')) {
        db.createObjectStore('exams', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('results')) {
        const resultStore = db.createObjectStore('results', { keyPath: 'id' });
        resultStore.createIndex('examId', 'examId', { unique: false });
        resultStore.createIndex('studentNumber', 'studentNumber', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event: any) => {
      dbInstance = event.target.result as IDBDatabase;
      resolve(dbInstance);
    };

    request.onerror = (event: any) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Default Seed Data
const DEFAULT_EXAM: Exam = {
  id: 'exam-sample-6f-mat',
  courseName: 'Matematik',
  gradeClass: '6',
  section: 'F',
  term: '1. Dönem',
  examName: '2. Yazılı Yoklama',
  examDate: new Date().toISOString().split('T')[0],
  questions: [
    { questionNumber: 1, maxScore: 15 },
    { questionNumber: 2, maxScore: 15 },
    { questionNumber: 3, maxScore: 20 },
    { questionNumber: 4, maxScore: 10 },
    { questionNumber: 5, maxScore: 10 },
    { questionNumber: 6, maxScore: 10 },
    { questionNumber: 7, maxScore: 10 },
    { questionNumber: 8, maxScore: 10 },
  ],
  totalMaxScore: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  description: '6/F Şubesi 1. Dönem 2. Matematik Yazılı Değerlendirmesi',
};

const DEFAULT_RESULTS: StudentResult[] = [
  {
    id: 'res-681',
    examId: 'exam-sample-6f-mat',
    studentNumber: '681',
    studentName: 'Ayşe Yılmaz',
    className: '6/F',
    scores: [
      { questionNumber: 1, score: 12, maxScore: 15, confidence: 0.99 },
      { questionNumber: 2, score: 10, maxScore: 15, confidence: 0.98 },
      { questionNumber: 3, score: 15, maxScore: 20, confidence: 0.97 },
      { questionNumber: 4, score: 8, maxScore: 10, confidence: 0.99 },
      { questionNumber: 5, score: 10, maxScore: 10, confidence: 1.0 },
      { questionNumber: 6, score: 8, maxScore: 10, confidence: 0.96 },
      { questionNumber: 7, score: 9, maxScore: 10, confidence: 0.98 },
      { questionNumber: 8, score: 8, maxScore: 10, confidence: 0.99 },
    ],
    totalScore: 80,
    scaledGrade: 80,
    hasMissingScores: false,
    scannedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'res-682',
    examId: 'exam-sample-6f-mat',
    studentNumber: '682',
    studentName: 'Mehmet Demir',
    className: '6/F',
    scores: [
      { questionNumber: 1, score: 10, maxScore: 15, confidence: 0.98 },
      { questionNumber: 2, score: 12, maxScore: 15, confidence: 0.97 },
      { questionNumber: 3, score: 18, maxScore: 20, confidence: 0.99 },
      { questionNumber: 4, score: 10, maxScore: 10, confidence: 1.0 },
      { questionNumber: 5, score: 8, maxScore: 10, confidence: 0.95 },
      { questionNumber: 6, score: 9, maxScore: 10, confidence: 0.98 },
      { questionNumber: 7, score: 10, maxScore: 10, confidence: 0.99 },
      { questionNumber: 8, score: 9, maxScore: 10, confidence: 0.97 },
    ],
    totalScore: 86,
    scaledGrade: 86,
    hasMissingScores: false,
    scannedAt: new Date(Date.now() - 3600000).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'res-688',
    examId: 'exam-sample-6f-mat',
    studentNumber: '688',
    studentName: 'İhsan Şahin',
    className: '6/F',
    scores: [
      { questionNumber: 1, score: 5, maxScore: 15, confidence: 0.98 },
      { questionNumber: 2, score: 0, maxScore: 15, confidence: 0.99 },
      { questionNumber: 3, score: 20, maxScore: 20, confidence: 0.97 },
      { questionNumber: 4, score: 10, maxScore: 10, confidence: 0.99 },
      { questionNumber: 5, score: 8, maxScore: 10, confidence: 0.96 },
      { questionNumber: 6, score: 7, maxScore: 10, confidence: 0.95 },
      { questionNumber: 7, score: 6, maxScore: 10, confidence: 0.96 },
      { questionNumber: 8, score: 8, maxScore: 10, confidence: 0.97 },
    ],
    totalScore: 64,
    scaledGrade: 64,
    hasMissingScores: false,
    scannedAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
  },
];

// Initialize and seed if empty
export async function initStorage(): Promise<void> {
  const db = await getDB();
  const exams = await getAllExams();
  if (exams.length === 0) {
    await saveExam(DEFAULT_EXAM);
    for (const res of DEFAULT_RESULTS) {
      await saveResult(res);
    }
  }
}

// Exams operations
export async function getAllExams(): Promise<Exam[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('exams', 'readonly');
    const store = transaction.objectStore('exams');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getExamById(id: string): Promise<Exam | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('exams', 'readonly');
    const store = transaction.objectStore('exams');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveExam(exam: Exam): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('exams', 'readwrite');
    const store = transaction.objectStore('exams');
    const request = store.put(exam);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteExam(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['exams', 'results'], 'readwrite');
    const examStore = transaction.objectStore('exams');
    const resultStore = transaction.objectStore('results');

    examStore.delete(id);

    // Also delete associated results
    const index = resultStore.index('examId');
    const req = index.getAllKeys(id);
    req.onsuccess = () => {
      const keys = req.result;
      for (const key of keys) {
        resultStore.delete(key);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

// Student Results operations
export async function getResultsByExamId(examId: string): Promise<StudentResult[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('results', 'readonly');
    const store = transaction.objectStore('results');
    const index = store.index('examId');
    const request = index.getAll(examId);

    request.onsuccess = () => {
      const list: StudentResult[] = request.result || [];
      // Sort automatically by studentNumber ascending (numerical sort)
      list.sort((a, b) => {
        const numA = parseInt(a.studentNumber.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.studentNumber.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveResult(result: StudentResult): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('results', 'readwrite');
    const store = transaction.objectStore('results');
    const request = store.put(result);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteResult(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('results', 'readwrite');
    const store = transaction.objectStore('results');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function resetAllData(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['exams', 'results'], 'readwrite');
    transaction.objectStore('exams').clear();
    transaction.objectStore('results').clear();
    transaction.oncomplete = async () => {
      await saveExam(DEFAULT_EXAM);
      for (const res of DEFAULT_RESULTS) {
        await saveResult(res);
      }
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}
