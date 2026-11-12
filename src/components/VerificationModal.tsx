import React, { useState, useEffect } from 'react';
import { Exam, GeminiAnalysisResponse, StudentResult, ScoredQuestion } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Save, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  UserCheck,
  X
} from 'lucide-react';

interface VerificationModalProps {
  exam: Exam;
  analysis: GeminiAnalysisResponse;
  frontImage: string;
  backImage?: string;
  existingResults: StudentResult[];
  onConfirm: (result: StudentResult, scanNext: boolean) => void;
  onCancel: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  exam,
  analysis,
  frontImage,
  backImage,
  existingResults,
  onConfirm,
  onCancel,
}) => {
  // Student Editable Credentials
  const [studentName, setStudentName] = useState(analysis.studentName || '');
  const [className, setClassName] = useState(analysis.className || `${exam.gradeClass}/${exam.section}`);
  const [studentNumber, setStudentNumber] = useState(analysis.studentNumber || '');
  const [notes, setNotes] = useState(analysis.notes || '');

  // Active view image (front / back)
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Scores state mapped to exam questions
  const [scores, setScores] = useState<ScoredQuestion[]>([]);

  // Initialize scores by matching analysis with exam question config
  useEffect(() => {
    const mapped: ScoredQuestion[] = exam.questions.map((q) => {
      const match = analysis.scores.find((s) => s.questionNumber === q.questionNumber);
      if (match) {
        return {
          questionNumber: q.questionNumber,
          score: match.score !== undefined ? match.score : null,
          maxScore: q.maxScore,
          confidence: match.confidence ?? 0.9,
          teacherNote: match.teacherNote,
          isOverridden: false,
        };
      } else {
        return {
          questionNumber: q.questionNumber,
          score: null,
          maxScore: q.maxScore,
          confidence: 0,
          isOverridden: false,
        };
      }
    });

    setScores(mapped);
  }, [exam, analysis]);

  // Check if student already exists in this exam
  const duplicateRecord = existingResults.find(
    (r) => r.studentNumber.trim() === studentNumber.trim() && studentNumber.trim() !== ''
  );

  // Calculate Totals
  const totalScore = scores.reduce((sum, q) => sum + (typeof q.score === 'number' ? q.score : 0), 0);
  const totalExamMax = exam.totalMaxScore || 100;
  const scaledGrade = totalExamMax > 0 ? Math.round((totalScore / totalExamMax) * 100) : totalScore;
  const hasMissingScores = scores.some((q) => q.score === null || isNaN(q.score));

  // Handle score change
  const handleScoreChange = (questionNumber: number, valueStr: string) => {
    setScores((prev) =>
      prev.map((q) => {
        if (q.questionNumber === questionNumber) {
          if (valueStr === '') {
            return { ...q, score: null, isOverridden: true };
          }
          const num = parseFloat(valueStr);
          return {
            ...q,
            score: isNaN(num) ? null : Math.min(q.maxScore, Math.max(0, num)),
            isOverridden: true,
            confidence: 1.0, // manually validated
          };
        }
        return q;
      })
    );
  };

  const handleSave = (scanNext: boolean) => {
    const finalResult: StudentResult = {
      id: duplicateRecord ? duplicateRecord.id : `res-${Date.now()}-${studentNumber}`,
      examId: exam.id,
      studentName: studentName.trim() || 'İsimsiz Öğrenci',
      className: className.trim() || `${exam.gradeClass}/${exam.section}`,
      studentNumber: studentNumber.trim() || '000',
      scores,
      totalScore,
      scaledGrade,
      hasMissingScores,
      frontImage,
      backImage,
      notes: notes.trim(),
      scannedAt: duplicateRecord ? duplicateRecord.scannedAt : new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    };

    onConfirm(finalResult, scanNext);
  };

  const currentImg = activeSide === 'front' ? frontImage : backImage || frontImage;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Öğretmen Onay ve Kontrol Ekranı
              </h2>
              <p className="text-xs text-slate-400">
                Gemini tarafından okunan kırmızı kalem puanlarını inceleyiniz ve gerekirse düzeltiniz.
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Dual Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left Pane: Paper Visual Preview */}
          <div className="lg:col-span-6 bg-slate-950 flex flex-col overflow-hidden">
            {/* Image Toolbar */}
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              {/* Tabs */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSide('front')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeSide === 'front'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Ön Yüz
                </button>
                {backImage && (
                  <button
                    onClick={() => setActiveSide('back')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      activeSide === 'back'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Arka Yüz
                  </button>
                )}
              </div>

              {/* Zoom & Rotate */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300"
                  title="Uzaklaştır"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="tabular-nums font-mono text-[11px] w-8 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300"
                  title="Yakınlaştır"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300"
                  title="90° Döndür"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas / Image Container */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px] lg:min-h-[500px]">
              <div
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                <img
                  src={currentImg}
                  alt="Taranan Kâğıt Görseli"
                  className="max-h-[70vh] object-contain rounded shadow-xl border border-slate-800"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Hint */}
            <div className="p-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 text-center">
              Kırmızı kalemle yazılmış puanları soldaki kâğıt üzerinden doğrudan teyit edebilirsiniz.
            </div>
          </div>

          {/* Right Pane: Student & Score Approval */}
          <div className="lg:col-span-6 bg-white flex flex-col overflow-y-auto p-5 sm:p-6 space-y-5">
            
            {/* Duplicate Record Warning */}
            {duplicateRecord && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Mükerrer Öğrenci Kaydı Bulundu!</div>
                  <div className="text-slate-600">
                    <strong>{studentNumber}</strong> numaralı ({duplicateRecord.studentName}) bu sınavda zaten kayıtlı.
                    Onayladığınızda eski notlar bu yeni tarama ile güncellenecektir.
                  </div>
                </div>
              </div>
            )}

            {/* Student Identity Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Öğrenci Kimlik Bilgileri (Yapay Zekâ ile Okundu)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Adı Soyadı
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Okul Numarası
                  </label>
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Sınıfı / Şubesi
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Score Breakdown Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Kırmızı Kalem Soru Puanları
                </h3>
                <span className="text-[11px] text-slate-500">
                  Sarı işaretli kutular şüpheli veya okunamayan puanlardır.
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-100 px-4 py-2 text-slate-600 text-xs font-semibold grid grid-cols-12 gap-2">
                  <div className="col-span-3">Soru No</div>
                  <div className="col-span-4">Okunan Puan</div>
                  <div className="col-span-3">Maksimum</div>
                  <div className="col-span-2 text-right">Güven</div>
                </div>

                <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-100">
                  {scores.map((item) => {
                    const isLowConfidence = item.confidence < 0.85 || item.score === null;
                    const isMissing = item.score === null || isNaN(item.score);

                    return (
                      <div
                        key={item.questionNumber}
                        className={`px-4 py-2 text-sm grid grid-cols-12 gap-2 items-center transition-colors ${
                          isLowConfidence ? 'bg-amber-50/60' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="col-span-3 font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-md bg-slate-800 text-white text-xs flex items-center justify-center font-bold">
                            S{item.questionNumber}
                          </span>
                        </div>

                        {/* Editable Score Input */}
                        <div className="col-span-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max={item.maxScore}
                              step="0.5"
                              value={item.score !== null ? item.score : ''}
                              placeholder="?"
                              onChange={(e) => handleScoreChange(item.questionNumber, e.target.value)}
                              className={`w-20 px-2 py-1 text-sm font-bold text-center rounded-lg border outline-none font-mono tabular-nums ${
                                isMissing
                                  ? 'border-amber-400 bg-amber-100/60 text-amber-900 placeholder:text-amber-500 focus:ring-2 focus:ring-amber-500'
                                  : isLowConfidence
                                  ? 'border-amber-300 bg-amber-50 text-slate-900 focus:ring-2 focus:ring-amber-400'
                                  : 'border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'
                              }`}
                            />
                            <span className="text-xs text-slate-400">Puan</span>
                          </div>
                        </div>

                        <div className="col-span-3 text-xs text-slate-500 font-medium tabular-nums">
                          / {item.maxScore} Puan
                        </div>

                        <div className="col-span-2 text-right">
                          {isMissing ? (
                            <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                              Eksik
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-mono tabular-nums font-semibold ${
                                item.confidence >= 0.95
                                  ? 'text-emerald-700'
                                  : item.confidence >= 0.85
                                  ? 'text-blue-700'
                                  : 'text-amber-700 font-bold'
                              }`}
                            >
                              %{Math.round(item.confidence * 100)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Missing Score Alert */}
            {hasMissingScores && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Bazı soruların puanları net okunamadı veya boş bırakılmış. Lütfen soru kutucuklarını kontrol ediniz.
                </span>
              </div>
            )}

            {/* Total Score Summary Box */}
            <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium">Toplam Sınav Puanı</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-white flex items-baseline gap-1 mt-0.5">
                  <span className="text-emerald-400">{totalScore}</span>
                  <span className="text-slate-400 text-sm font-normal">/ {totalExamMax}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">100'lük Sistem Notu</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                  {scaledGrade}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                İptal Et
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Onayla ve Listeye Kaydet</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Onayla ve Sıradaki Kâğıdı Tara</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
