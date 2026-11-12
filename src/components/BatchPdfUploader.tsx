import React, { useState, useRef } from 'react';
import { Exam, StudentResult, BatchStudentAnalysis } from '../types';
import { 
  FileUp, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  ArrowRight, 
  Download,
  Users,
  Edit2,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { processBatchExamPdf, createSampleBatchExamPdf, BatchProcessingProgress } from '../services/pdfBatchService';

interface BatchPdfUploaderProps {
  currentExam: Exam | null;
  onBulkStudentsImported: (results: StudentResult[]) => void;
  onNavigateToCreateExam: () => void;
  onOpenExcelExport: () => void;
}

export const BatchPdfUploader: React.FC<BatchPdfUploaderProps> = ({
  currentExam,
  onBulkStudentsImported,
  onNavigateToCreateExam,
  onOpenExcelExport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; sizeMb: string } | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<BatchProcessingProgress | null>(null);
  const [discoveredStudents, setDiscoveredStudents] = useState<BatchStudentAnalysis[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local PDF upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Lütfen geçerli bir .pdf dosyası seçiniz.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setFileDetails({
      name: file.name,
      sizeMb: (file.size / (1024 * 1024)).toFixed(2),
    });
    setDiscoveredStudents([]);
    setIsCompleted(false);
  };

  // Generate Sample Multi-Student PDF for 1-click test
  const handleLoadSamplePdf = async () => {
    try {
      setErrorMessage(null);
      setIsProcessing(true);
      const { bytes } = await createSampleBatchExamPdf();
      const sampleBlob = new Blob([bytes as any], { type: 'application/pdf' });
      const sampleFile = new File([sampleBlob], '6-F_Matematik_Toplu_Sinav_Kagitlari.pdf', {
        type: 'application/pdf',
      });

      setSelectedFile(sampleFile);
      setFileDetails({
        name: sampleFile.name,
        sizeMb: (sampleFile.size / (1024 * 1024)).toFixed(2),
      });
      setDiscoveredStudents([]);
      setIsCompleted(false);
    } catch (err: any) {
      setErrorMessage('Örnek PDF oluşturulamadı: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start Gemini Batch Processing
  const handleStartAnalysis = async () => {
    if (!selectedFile || !currentExam) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setDiscoveredStudents([]);
    setIsCompleted(false);

    try {
      const results = await processBatchExamPdf(selectedFile, currentExam, (prog) => {
        setProgress(prog);
        setDiscoveredStudents(prog.foundStudents);
      });

      setDiscoveredStudents(results);
      setIsCompleted(true);
    } catch (err: any) {
      console.error('Batch PDF processing error:', err);
      setErrorMessage(
        err.message || 'Toplu PDF işlenirken bir hata oluştu. Lütfen dosyanın taranabilir olduğunu kontrol ediniz.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Final Confirmation: Save All Discovered Students to Database
  const handleSaveAllToGradebook = () => {
    if (!currentExam || discoveredStudents.length === 0) return;

    const studentResults: StudentResult[] = discoveredStudents.map((st, idx) => {
      // Map scores to exam questions
      const mappedScores = currentExam.questions.map((q) => {
        const found = st.scores?.find((sc) => sc.questionNumber === q.questionNumber);
        return {
          questionNumber: q.questionNumber,
          score: found && found.score !== undefined ? found.score : null,
          maxScore: q.maxScore,
          confidence: found?.confidence ?? 0.9,
          teacherNote: found?.teacherNote,
          isOverridden: false,
        };
      });

      const totalScore = mappedScores.reduce(
        (sum, q) => sum + (typeof q.score === 'number' ? q.score : 0),
        0
      );
      const totalExamMax = currentExam.totalMaxScore || 100;
      const scaledGrade =
        totalExamMax > 0 ? Math.round((totalScore / totalExamMax) * 100) : totalScore;
      const hasMissing = mappedScores.some((q) => q.score === null || isNaN(q.score));

      return {
        id: `batch-${Date.now()}-${idx}-${st.studentNumber || idx}`,
        examId: currentExam.id,
        studentNumber: st.studentNumber ? String(st.studentNumber).trim() : `${idx + 1}`,
        studentName: st.studentName ? String(st.studentName).trim() : `Öğrenci ${idx + 1}`,
        className: st.className || `${currentExam.gradeClass}/${currentExam.section}`,
        scores: mappedScores,
        totalScore,
        scaledGrade,
        hasMissingScores: hasMissing,
        notes: st.notes || (st.pagesDetected ? `Kaynak: ${st.pagesDetected}` : undefined),
        scannedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
      };
    });

    onBulkStudentsImported(studentResults);
  };

  // Remove a student row before import if needed
  const handleRemoveStudent = (indexToRemove: number) => {
    setDiscoveredStudents((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  if (!currentExam) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Aktif Bir Sınav Seçilmedi</h2>
        <p className="text-xs text-slate-600 mb-6">
          Toplu PDF aktarımı yapabilmek için önce bir ders sınavı oluşturmalı veya seçmelisiniz.
        </p>
        <button
          onClick={onNavigateToCreateExam}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
        >
          Yeni Sınav Oluştur
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-emerald-400" />
            Toplu Sınav Kâğıdı Analizi
          </div>
          <h1 className="text-xl font-bold text-white">
            Çok Sayfalı PDF ile Otomatik Sınıf Okuma
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Örn: Fotokopiden taranmış 37 öğrencinin önlü-arkalı tek bir PDF'ini yükleyin; Gemini yapay zekâ her öğrenciyi ayrıştırıp puanlarını çıkarsın.
          </p>
        </div>

        {/* Quick Sample Batch PDF Loader */}
        <button
          type="button"
          onClick={handleLoadSamplePdf}
          disabled={isProcessing}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Örnek Toplu PDF ile Test Et</span>
        </button>
      </div>

      {/* Upload & Config Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dropzone */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
              selectedFile
                ? 'border-emerald-500 bg-emerald-50/20'
                : 'border-slate-300 bg-white hover:border-emerald-500 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
              selectedFile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <FileUp className="w-7 h-7" />
            </div>

            {selectedFile && fileDetails ? (
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-900 block truncate max-w-sm">
                  {fileDetails.name}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {fileDetails.sizeMb} MB · PDF Dokümanı
                </span>
                <span className="text-xs text-emerald-700 font-semibold block pt-1">
                  ✓ Dosya Yüklendi. Analizi Başlatabilirsiniz.
                </span>
              </div>
            ) : (
              <div>
                <span className="text-sm font-bold text-slate-800 block">
                  Toplu Sınav PDF Dosyasını Buraya Sürükleyin veya Seçin
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Tek bir PDF dosyasında 1-100 sayfa arası tüm sınıf kâğıtları bulunabilir
                </span>
              </div>
            )}
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: Execution & Instructions */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Toplu Okuma Kuralları
            </h3>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>1. Otomatik Sayfa Eşleştirme:</strong> Gemini yapay zekâ her öğrencinin adını ve numarasını okur; arka yüzdeki soruları otomatik olarak aynı öğrenciye bağlar.
              </p>
              <p>
                <strong>2. Kesintisiz Parçalı Tarama:</strong> 74 sayfalık büyük PDF'ler tarayıcıda sayfa bloklarına bölünerek işlenir ve ilerleme çubuğuyla anlık gösterilir.
              </p>
              <p>
                <strong>3. Kontrol Edilebilir Liste:</strong> Tarama tamamlandıktan sonra tespit edilen tüm öğrenciler tek bir butonla not çizelgesine kaydedilir ve Excel indirilebilir.
              </p>
            </div>
          </div>

          {/* Start Action Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!selectedFile || isProcessing}
              onClick={handleStartAnalysis}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                !selectedFile
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : isProcessing
                  ? 'bg-slate-900 text-white cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>PDF İnceleniyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Toplu PDF'i Yapay Zekâ ile Çözümle</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Progress Bar Display */}
      {isProcessing && progress && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              <span className="font-semibold text-slate-800">{progress.statusText}</span>
            </div>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              %{progress.percent}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.max(5, progress.percent))}%` }}
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            />
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>İşlenen Blok: {progress.currentChunk} / {progress.totalChunks}</span>
            <span>Tespit Edilen Öğrenci Sayısı: <strong className="text-slate-900">{discoveredStudents.length}</strong></span>
          </div>
        </div>
      )}

      {/* Discovered Students Table */}
      {discoveredStudents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Tespit Edilen Öğrenci Sınav Kâğıtları ({discoveredStudents.length} Öğrenci)
              </h2>
              <p className="text-xs text-slate-500">
                PDF içerisinden okunan kırmızı kalem puanları ve öğrenci bilgileri aşağıdadır.
              </p>
            </div>

            {/* Bulk Save CTA */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAllToGradebook}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Tümünü Sınıf Listesine Aktar ve Kaydet</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold divide-x divide-slate-800">
                  <th className="px-3 py-2.5 w-12 text-center">No</th>
                  <th className="px-3 py-2.5 w-20 text-center">Okul No</th>
                  <th className="px-4 py-2.5 min-w-[150px]">Adı Soyadı</th>
                  <th className="px-2 py-2.5 w-16 text-center">Sınıf</th>
                  <th className="px-3 py-2.5 w-24 text-center">Sayfa</th>
                  
                  {/* Exam Questions */}
                  {currentExam.questions.map((q) => (
                    <th key={q.questionNumber} className="px-2 py-2.5 w-14 text-center">
                      S{q.questionNumber}
                    </th>
                  ))}

                  <th className="px-3 py-2.5 w-20 text-center bg-slate-800">Toplam</th>
                  <th className="px-2 py-2.5 w-12 text-center">Sil</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-slate-700">
                {discoveredStudents.map((st, idx) => {
                  const scoresSum = st.scores?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 divide-x divide-slate-100">
                      <td className="px-3 py-2 text-center text-slate-400 font-mono tabular-nums">
                        {idx + 1}
                      </td>

                      <td className="px-3 py-2 text-center font-bold text-slate-900 font-mono tabular-nums">
                        {st.studentNumber || '-'}
                      </td>

                      <td className="px-4 py-2 font-semibold text-slate-900">
                        {st.studentName || 'İsimsiz'}
                      </td>

                      <td className="px-2 py-2 text-center text-slate-500">
                        {st.className || `${currentExam.gradeClass}/${currentExam.section}`}
                      </td>

                      <td className="px-3 py-2 text-center text-[11px] text-slate-500 font-mono">
                        {st.pagesDetected || '-'}
                      </td>

                      {/* Question Scores */}
                      {currentExam.questions.map((q) => {
                        const match = st.scores?.find((s) => s.questionNumber === q.questionNumber);
                        const sc = match?.score;

                        return (
                          <td
                            key={q.questionNumber}
                            className="px-2 py-2 text-center font-mono tabular-nums font-semibold"
                          >
                            {sc !== undefined && sc !== null ? (
                              <span className={sc === 0 ? 'text-slate-400' : 'text-slate-900'}>
                                {sc}
                              </span>
                            ) : (
                              <span className="text-amber-500">?</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="px-3 py-2 text-center font-bold text-slate-900 font-mono tabular-nums bg-slate-50">
                        {scoresSum}
                      </td>

                      {/* Remove single row */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Öğrenciyi Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Bu öğrencileri aktardıktan sonra Öğrenci Listesi'nden inceleyebilir veya doğrudan Excel formatında indirebilirsiniz.
            </span>

            <button
              type="button"
              onClick={handleSaveAllToGradebook}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{discoveredStudents.length} Öğrenciyi Sınıfa Kaydet</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
