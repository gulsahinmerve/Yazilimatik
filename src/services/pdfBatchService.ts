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
 * Analyzes a multi-student exam PDF file:
 * - Reads page count
 * - If under 8 pages: sends in 1 request for maximum speed
 * - If larger (e.g. 37 students, 74 pages): splits into 4-page chunks using pdf-lib,
 *   streaming real-time results and progress to the caller.
 */
export async function processBatchExamPdf(
  file: File,
  exam: Exam,
  onProgress?: (progress: BatchProcessingProgress) => void
): Promise<BatchStudentAnalysis[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);

  const mainPdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = mainPdfDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('Yüklenen PDF dosyasında hiçbir sayfa bulunamadı.');
  }

  // Determine chunk size (e.g. 4 pages per chunk = ~2 students per chunk)
  const PAGES_PER_CHUNK = 4;
  const totalChunks = Math.ceil(totalPages / PAGES_PER_CHUNK);
  const allFoundStudents: BatchStudentAnalysis[] = [];

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startPage = chunkIndex * PAGES_PER_CHUNK;
    const endPage = Math.min(startPage + PAGES_PER_CHUNK, totalPages);
    const pageIndices = [];
    for (let p = startPage; p < endPage; p++) {
      pageIndices.push(p);
    }

    const chunkDoc = await PDFDocument.create();
    const copiedPages = await chunkDoc.copyPages(mainPdfDoc, pageIndices);
    copiedPages.forEach((p) => chunkDoc.addPage(p));

    const chunkBase64 = await chunkDoc.saveAsBase64({ dataUri: true });

    const statusText = `Sayfa ${startPage + 1} - ${endPage} / ${totalPages} taranıyor...`;
    const percent = Math.round(((chunkIndex + 0.3) / totalChunks) * 100);

    onProgress?.({
      currentChunk: chunkIndex + 1,
      totalChunks,
      totalPages,
      percent,
      statusText,
      foundStudents: [...allFoundStudents],
    });

    try {
      const response = await fetch('/api/analyze-pdf-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: chunkBase64,
          questionsConfig: exam.questions,
          examInfo: {
            courseName: exam.courseName,
            gradeClass: exam.gradeClass,
            section: exam.section,
          },
          pageRangeInfo: `Sayfa ${startPage + 1}-${endPage}`,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success && Array.isArray(resData.data)) {
        const chunkStudents: BatchStudentAnalysis[] = resData.data.map((st: any) => ({
          ...st,
          pagesDetected: st.pagesDetected || `Sayfa ${startPage + 1}-${endPage}`,
        }));

        allFoundStudents.push(...chunkStudents);
      } else {
        console.warn(`Chunk ${chunkIndex + 1} analysis warning:`, resData.error);
      }
    } catch (chunkErr) {
      console.error(`Chunk ${chunkIndex + 1} error:`, chunkErr);
    }

    const completedPercent = Math.round(((chunkIndex + 1) / totalChunks) * 100);
    onProgress?.({
      currentChunk: chunkIndex + 1,
      totalChunks,
      totalPages,
      percent: completedPercent,
      statusText: `${allFoundStudents.length} öğrenci tespit edildi (${completedPercent}%)`,
      foundStudents: [...allFoundStudents],
    });
  }

  return allFoundStudents;
}
