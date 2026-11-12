import { PDFDocument } from 'pdf-lib';
import { Exam, BatchStudentAnalysis } from '../types';
import { getSampleStudentExam } from './samplePaperGenerator';

export interface BatchProcessingProgress {
  currentChunk: number;
  totalChunks: number;
  totalPages: number;
  percent: number;
  statusText: string;
  foundStudents: BatchStudentAnalysis[];
}

/**
 * Creates a sample multi-page PDF containing 3 students' front and back exam papers
 * (6 pages in total: İhsan Şahin 688, Ayşe Yılmaz 681, Mehmet Demir 682)
 * for testing the batch PDF feature immediately.
 */
export async function createSampleBatchExamPdf(): Promise<{ bytes: Uint8Array; base64: string }> {
  const pdfDoc = await PDFDocument.create();

  // Helper to add image page
  const addImagePage = async (dataUrl: string) => {
    const base64Data = dataUrl.split(';base64,')[1];
    const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const jpgImage = await pdfDoc.embedJpg(imgBytes);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    page.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: 595.28,
      height: 841.89,
    });
  };

  // Student 1: İhsan Şahin (Front & Back)
  await addImagePage(getSampleStudentExam('ihsan', 'front'));
  await addImagePage(getSampleStudentExam('ihsan', 'back'));

  // Student 2: Ayşe Yılmaz (Front)
  await addImagePage(getSampleStudentExam('ayse', 'front'));

  // Student 3: Mehmet Demir (Front)
  await addImagePage(getSampleStudentExam('mehmet', 'front'));

  const pdfBytes = await pdfDoc.save();
  const base64 = await pdfDoc.saveAsBase64({ dataUri: true });

  return { bytes: pdfBytes, base64 };
}

/**
 * High-speed single-pass batch exam PDF analyzer.
 * Reads file efficiently without freezing the browser thread and receives
 * all extracted students in seconds.
 */
export async function processBatchExamPdf(
  file: File,
  exam: Exam,
  onProgress?: (progress: BatchProcessingProgress) => void
): Promise<BatchStudentAnalysis[]> {
  onProgress?.({
    currentChunk: 1,
    totalChunks: 1,
    totalPages: 1,
    percent: 20,
    statusText: 'PDF yükleniyor ve hazırlanıyor...',
    foundStudents: [],
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const p = Math.round((ev.loaded / ev.total) * 40);
        onProgress?.({
          currentChunk: 1,
          totalChunks: 1,
          totalPages: 1,
          percent: p,
          statusText: 'PDF okunuyor...',
          foundStudents: [],
        });
      }
    };

    reader.onload = async () => {
      try {
        const fullBase64 = reader.result as string;

        onProgress?.({
          currentChunk: 1,
          totalChunks: 1,
          totalPages: 1,
          percent: 60,
          statusText: 'Öğrenci kâğıtları ve kırmızı kalem puanları taranıyor...',
          foundStudents: [],
        });

        // Fast fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch('/api/analyze-pdf-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            pdfBase64: fullBase64,
            questionsConfig: exam.questions,
            examInfo: {
              courseName: exam.courseName,
              gradeClass: exam.gradeClass,
              section: exam.section,
            },
            pageRangeInfo: 'Tüm Sayfalar',
          }),
        });

        clearTimeout(timeoutId);

        const resData = await response.json();

        if (response.ok && resData.success && Array.isArray(resData.data)) {
          onProgress?.({
            currentChunk: 1,
            totalChunks: 1,
            totalPages: resData.data.length,
            percent: 100,
            statusText: `${resData.data.length} öğrenci başarıyla ayrıştırıldı!`,
            foundStudents: resData.data,
          });
          resolve(resData.data);
        } else {
          throw new Error(resData.error || 'PDF analizi tamamlanamadı.');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          reject(new Error('İşlem zaman aşımına uğradı. Lütfen dosya boyutunu kontrol ediniz.'));
        } else {
          reject(err);
        }
      }
    };

    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}
