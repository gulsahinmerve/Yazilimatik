import React, { useState, useEffect } from 'react';
import { ActiveTab, Exam, StudentResult, GeminiAnalysisResponse } from './types';
import { 
  initStorage, 
  getAllExams, 
  getResultsByExamId, 
  saveExam, 
  saveResult, 
  deleteExam, 
  deleteResult 
} from './services/db';
import { Navbar } from './components/Navbar';
import { ExamCreator } from './components/ExamCreator';
import { Scanner } from './components/Scanner';
import { VerificationModal } from './components/VerificationModal';
import { StudentList } from './components/StudentList';
import { ExamResults } from './components/ExamResults';
import { ExcelReports } from './components/ExcelReports';
import { ExamArchive } from './components/ExamArchive';
import { SettingsView } from './components/SettingsView';
import { StudentEditModal } from './components/StudentEditModal';
import { BatchPdfUploader } from './components/BatchPdfUploader';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scan-paper');
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Pending Verification Modal state
  const [pendingVerification, setPendingVerification] = useState<{
    analysis: GeminiAnalysisResponse;
    frontImage: string;
    backImage?: string;
  } | null>(null);

  // Editing student modal state
  const [editingStudent, setEditingStudent] = useState<StudentResult | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Load from IndexedDB
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await initStorage();
      const allExams = await getAllExams();
      setExams(allExams);

      if (allExams.length > 0) {
        const defaultId = allExams[0].id;
        setSelectedExamId(defaultId);
        const resList = await getResultsByExamId(defaultId);
        setResults(resList);
      }
    } catch (err) {
      console.error('Failed to initialize storage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // When selected exam changes, load its results
  const handleSelectExam = async (examId: string) => {
    setSelectedExamId(examId);
    try {
      const resList = await getResultsByExamId(examId);
      setResults(resList);
    } catch (err) {
      console.error('Failed to load exam results:', err);
    }
  };

  // Reload results for current exam
  const reloadCurrentResults = async () => {
    if (!selectedExamId) return;
    const resList = await getResultsByExamId(selectedExamId);
    setResults(resList);
  };

  // Create new exam handler
  const handleExamCreated = async (newExam: Exam) => {
    await saveExam(newExam);
    const updated = await getAllExams();
    setExams(updated);
    setSelectedExamId(newExam.id);
    setResults([]);
    setActiveTab('scan-paper');
    showToast(`"${newExam.courseName} - ${newExam.gradeClass}/${newExam.section}" sınavı oluşturuldu. Kâğıt taramaya başlayabilirsiniz.`);
  };

  // Delete Exam handler
  const handleDeleteExam = async (examId: string) => {
    await deleteExam(examId);
    const updated = await getAllExams();
    setExams(updated);
    if (updated.length > 0) {
      handleSelectExam(updated[0].id);
    } else {
      setSelectedExamId('');
      setResults([]);
    }
    showToast('Sınav ve kayıtlı tüm öğrenci sonuçları silindi.');
  };

  // Delete single student result
  const handleDeleteResult = async (id: string) => {
    await deleteResult(id);
    await reloadCurrentResults();
    showToast('Öğrenci kaydı silindi.');
  };

  // Gemini Analysis Result Callback
  const handleAnalysisSuccess = (
    analysis: GeminiAnalysisResponse,
    frontImage: string,
    backImage?: string
  ) => {
    setPendingVerification({
      analysis,
      frontImage,
      backImage,
    });
  };

  // Teacher Confirmed Result in Verification Modal
  const handleConfirmVerification = async (result: StudentResult, scanNext: boolean) => {
    await saveResult(result);
    await reloadCurrentResults();
    setPendingVerification(null);

    showToast(`${result.studentName} (${result.studentNumber}) puanları başarıyla kaydedildi! Toplam: ${result.totalScore}`);

    if (scanNext) {
      // Stay in scan-paper view so user can take next paper immediately
      setActiveTab('scan-paper');
    } else {
      // Show student list
      setActiveTab('student-list');
    }
  };

  // Save edited student
  const handleSaveEditedStudent = async (updated: StudentResult) => {
    await saveResult(updated);
    await reloadCurrentResults();
    setEditingStudent(null);
    showToast(`${updated.studentName} puanları güncellendi.`);
  };

  // Bulk Students Imported from PDF
  const handleBulkStudentsImported = async (newResults: StudentResult[]) => {
    for (const res of newResults) {
      await saveResult(res);
    }
    await reloadCurrentResults();
    setActiveTab('student-list');
    showToast(`Tebrikler! Toplu PDF'ten ${newResults.length} öğrencinin sınav puanları başarıyla sınıf listesine aktarıldı.`);
  };

  const currentExam = exams.find((e) => e.id === selectedExamId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        exams={exams}
        selectedExamId={selectedExamId}
        onSelectExam={handleSelectExam}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1">
        {isLoading ? (
          <div className="max-w-md mx-auto py-24 text-center">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-700">Yazılımatik Yükleniyor...</p>
          </div>
        ) : (
          <>
            {activeTab === 'create-exam' && (
              <ExamCreator
                onExamCreated={handleExamCreated}
                existingExamsCount={exams.length}
              />
            )}

            {activeTab === 'scan-paper' && (
              <Scanner
                currentExam={currentExam}
                onAnalysisSuccess={handleAnalysisSuccess}
                onNavigateToCreateExam={() => setActiveTab('create-exam')}
                onNavigateToBatchPdf={() => setActiveTab('batch-pdf')}
              />
            )}

            {activeTab === 'batch-pdf' && (
              <BatchPdfUploader
                currentExam={currentExam}
                onBulkStudentsImported={handleBulkStudentsImported}
                onNavigateToCreateExam={() => setActiveTab('create-exam')}
                onOpenExcelExport={() => setActiveTab('excel-reports')}
              />
            )}

            {activeTab === 'student-list' && currentExam && (
              <StudentList
                exam={currentExam}
                results={results}
                onDeleteResult={handleDeleteResult}
                onEditResult={(st) => setEditingStudent(st)}
                onOpenExcelExport={() => setActiveTab('excel-reports')}
                onOpenScanner={() => setActiveTab('scan-paper')}
              />
            )}

            {activeTab === 'student-list' && !currentExam && (
              <div className="max-w-md mx-auto py-16 text-center">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Aktif Sınav Bulunamadı</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Lütfen önce bir sınav oluşturun.</p>
                <button
                  onClick={() => setActiveTab('create-exam')}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
                >
                  Sınav Oluştur
                </button>
              </div>
            )}

            {activeTab === 'exam-results' && currentExam && (
              <ExamResults
                exam={currentExam}
                results={results}
                onOpenExcelExport={() => setActiveTab('excel-reports')}
              />
            )}

            {activeTab === 'exam-results' && !currentExam && (
              <div className="max-w-md mx-auto py-16 text-center">
                <p className="text-sm text-slate-500">Lütfen bir sınav seçiniz.</p>
              </div>
            )}

            {activeTab === 'excel-reports' && currentExam && (
              <ExcelReports
                exam={currentExam}
                results={results}
              />
            )}

            {activeTab === 'excel-reports' && !currentExam && (
              <div className="max-w-md mx-auto py-16 text-center">
                <p className="text-sm text-slate-500">Lütfen önce bir sınav oluşturun.</p>
              </div>
            )}

            {activeTab === 'exam-archive' && (
              <ExamArchive
                exams={exams}
                selectedExamId={selectedExamId}
                onSelectExam={handleSelectExam}
                onDeleteExam={handleDeleteExam}
                onNavigateToCreate={() => setActiveTab('create-exam')}
                onOpenScanner={() => setActiveTab('scan-paper')}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                onDataReset={loadInitialData}
              />
            )}
          </>
        )}
      </main>

      {/* Verification Modal (Dual-Pane Teacher Approval) */}
      {pendingVerification && currentExam && (
        <VerificationModal
          exam={currentExam}
          analysis={pendingVerification.analysis}
          frontImage={pendingVerification.frontImage}
          backImage={pendingVerification.backImage}
          existingResults={results}
          onConfirm={handleConfirmVerification}
          onCancel={() => setPendingVerification(null)}
        />
      )}

      {/* Edit Student Modal */}
      {editingStudent && currentExam && (
        <StudentEditModal
          exam={currentExam}
          student={editingStudent}
          onSave={handleSaveEditedStudent}
          onClose={() => setEditingStudent(null)}
        />
      )}

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>YAZILIMATİK</strong> · Yapay Zekâ Destekli Yazılı Puanlama ve Excel Aktarım Sistemi
          </div>
          <div className="text-slate-400 text-[11px]">
            MEB e-Okul soru puanı uyumlu · Gemini 3.8 Flash Multimodal Engine
          </div>
        </div>
      </footer>

    </div>
  );
}
