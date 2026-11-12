import React from 'react';
import { Exam, StudentResult } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  FileSpreadsheet 
} from 'lucide-react';

interface ExamResultsProps {
  exam: Exam;
  results: StudentResult[];
  onOpenExcelExport: () => void;
}

export const ExamResults: React.FC<ExamResultsProps> = ({
  exam,
  results,
  onOpenExcelExport,
}) => {
  const totalStudents = results.length;

  if (totalStudents === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Henüz Sınav Sonucu Bulunmuyor</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Öğrenci sınav kâğıtlarını tarayıp onayladıkça, sınıf ve soru başarı analizleri burada anlık olarak hesaplanacaktır.
        </p>
      </div>
    );
  }

  // Calculate question metrics
  const questionStats = exam.questions.map((q) => {
    const scores = results
      .map((r) => r.scores.find((s) => s.questionNumber === q.questionNumber)?.score)
      .filter((s): s is number => typeof s === 'number');

    const count = scores.length || 1;
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = count > 0 ? sum / count : 0;
    const rate = q.maxScore > 0 ? (avg / q.maxScore) * 100 : 0;

    return {
      questionNumber: q.questionNumber,
      maxScore: q.maxScore,
      averageScore: avg,
      successRate: Math.round(rate),
      count,
    };
  });

  // Grade distributions
  const d0_49 = results.filter((r) => r.scaledGrade < 50).length;
  const d50_69 = results.filter((r) => r.scaledGrade >= 50 && r.scaledGrade < 70).length;
  const d70_84 = results.filter((r) => r.scaledGrade >= 70 && r.scaledGrade < 85).length;
  const d85_100 = results.filter((r) => r.scaledGrade >= 85).length;

  const allGrades = results.map((r) => r.scaledGrade);
  const classAvg = (allGrades.reduce((a, b) => a + b, 0) / totalStudents).toFixed(1);
  const maxGrade = Math.max(...allGrades);
  const minGrade = Math.min(...allGrades);

  // Hardest & Easiest Question
  const sortedByRate = [...questionStats].sort((a, b) => a.successRate - b.successRate);
  const hardestQ = sortedByRate[0];
  const easiestQ = sortedByRate[sortedByRate.length - 1];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <span>Sınav Değerlendirme & Başarı Raporu</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {exam.gradeClass}/{exam.section} - {exam.courseName} Sınav Sonuçları
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Öğretmenin kırmızı kalemle verdiği puanların otomatik istatistiksel dökümü.
          </p>
        </div>

        <button
          onClick={onOpenExcelExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel Raporu İndir</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Sınıf Genel Ortalaması</div>
          <div className="text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            {classAvg}
            <span className="text-xs text-slate-400 font-normal ml-1">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {Number(classAvg) >= 70 ? 'Başarılı sınıf düzeyi' : 'Geliştirilmeye açık düzey'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">En Yüksek Not</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2 font-mono tabular-nums">
            {maxGrade}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {results.find((r) => r.scaledGrade === maxGrade)?.studentName || '-'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">En Düşük Not</div>
          <div className="text-3xl font-bold text-slate-700 mt-2 font-mono tabular-nums">
            {minGrade}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {results.find((r) => r.scaledGrade === minGrade)?.studentName || '-'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Geçme Oranı (≥50)</div>
          <div className="text-3xl font-bold text-slate-900 mt-2 font-mono tabular-nums">
            %{Math.round(((totalStudents - d0_49) / totalStudents) * 100)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalStudents - d0_49} / {totalStudents} öğrenci başarılı
          </div>
        </div>
      </div>

      {/* Question By Question Analysis */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Soru Bazlı Başarı Analizi</h2>
            <p className="text-xs text-slate-500">
              Her soruda sınıfın ortalama aldığı kırmızı kalem puanı ve başarı yüzdesi.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-600">
              En Kolay Soru: <strong className="text-emerald-700">Soru {easiestQ.questionNumber} (%{easiestQ.successRate})</strong>
            </span>
            <span>·</span>
            <span className="text-slate-600">
              En Çok Zorlanılan: <strong className="text-amber-700">Soru {hardestQ.questionNumber} (%{hardestQ.successRate})</strong>
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {questionStats.map((q) => (
            <div key={q.questionNumber} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center">
                    S{q.questionNumber}
                  </span>
                  <span className="font-semibold text-slate-800">
                    Soru {q.questionNumber} ({q.maxScore} Puan)
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono tabular-nums">
                  <span className="text-slate-500">
                    Ort: <strong>{q.averageScore.toFixed(1)}</strong> / {q.maxScore}
                  </span>
                  <span
                    className={`font-bold ${
                      q.successRate >= 70
                        ? 'text-emerald-600'
                        : q.successRate >= 50
                        ? 'text-blue-600'
                        : 'text-amber-600'
                    }`}
                  >
                    %{q.successRate}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, Math.max(2, q.successRate))}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    q.successRate >= 70
                      ? 'bg-emerald-500'
                      : q.successRate >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grade Range Distribution */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Not Dağılımı ve Başarı Dilimleri
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">85 - 100 (Çok İyi)</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">
              {d85_100} <span className="text-xs text-slate-400 font-normal">öğrenci</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              %{Math.round((d85_100 / totalStudents) * 100)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">70 - 84 (İyi)</div>
            <div className="text-2xl font-bold text-blue-600 mt-1 font-mono tabular-nums">
              {d70_84} <span className="text-xs text-slate-400 font-normal">öğrenci</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              %{Math.round((d70_84 / totalStudents) * 100)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">50 - 69 (Orta)</div>
            <div className="text-2xl font-bold text-slate-700 mt-1 font-mono tabular-nums">
              {d50_69} <span className="text-xs text-slate-400 font-normal">öğrenci</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              %{Math.round((d50_69 / totalStudents) * 100)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">0 - 49 (Geliştirilmeli)</div>
            <div className="text-2xl font-bold text-red-600 mt-1 font-mono tabular-nums">
              {d0_49} <span className="text-xs text-slate-400 font-normal">öğrenci</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              %{Math.round((d0_49 / totalStudents) * 100)}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
