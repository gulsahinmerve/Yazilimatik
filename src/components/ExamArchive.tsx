import React, { useState } from 'react';
import { Exam } from '../types';
import { 
  Archive, 
  BookOpen, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  FileSpreadsheet, 
  Plus, 
  Search,
  ArrowRight
} from 'lucide-react';

interface ExamArchiveProps {
  exams: Exam[];
  selectedExamId: string;
  onSelectExam: (examId: string) => void;
  onDeleteExam: (examId: string) => void;
  onNavigateToCreate: () => void;
  onOpenScanner: () => void;
}

export const ExamArchive: React.FC<ExamArchiveProps> = ({
  exams,
  selectedExamId,
  onSelectExam,
  onDeleteExam,
  onNavigateToCreate,
  onOpenScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const filteredExams = exams.filter((exam) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      exam.courseName.toLowerCase().includes(q) ||
      exam.examName.toLowerCase().includes(q) ||
      `${exam.gradeClass}/${exam.section}`.toLowerCase().includes(q);

    const matchGrade = gradeFilter === 'ALL' || exam.gradeClass === gradeFilter;

    return matchSearch && matchGrade;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <span>Geçmiş ve Aktif Sınavlar</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sınav Arşivi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Önceki sınavlarınızı açabilir, öğrenci puanlarını güncelleyebilir veya yeniden Excel raporu alabilirsiniz.
          </p>
        </div>

        <button
          onClick={onNavigateToCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Sınav Oluştur</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ders, sınav adı veya şube ara..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <span className="text-xs text-slate-500">Sınıf Filtresi:</span>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="ALL">Tüm Sınıflar</option>
            {['5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
              <option key={g} value={g}>
                {g}. Sınıf
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExams.map((exam) => {
          const isSelected = exam.id === selectedExamId;

          return (
            <div
              key={exam.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-emerald-500 bg-white shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {exam.gradeClass}/{exam.section}
                  </span>

                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aktif Seçili
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {exam.term}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {exam.courseName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    {exam.examName}
                  </p>
                </div>

                <div className="pt-1 text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tarih: {exam.examDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.questions.length} Soru · Toplam {exam.totalMaxScore} Puan</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`"${exam.courseName} - ${exam.gradeClass}/${exam.section}" sınavını ve tüm öğrenci notlarını silmek istediğinize emin misiniz?`)) {
                      onDeleteExam(exam.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sınavı Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {isSelected ? (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Taramaya Devam Et</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectExam(exam.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Bu Sınavı Aç</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
