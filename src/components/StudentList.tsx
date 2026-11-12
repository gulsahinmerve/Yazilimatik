import React, { useState } from 'react';
import { Exam, StudentResult } from '../types';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  Eye, 
  UserCheck, 
  AlertCircle, 
  FileSpreadsheet, 
  ArrowUpDown,
  CheckCircle2,
  X
} from 'lucide-react';

interface StudentListProps {
  exam: Exam;
  results: StudentResult[];
  onDeleteResult: (id: string) => void;
  onEditResult: (result: StudentResult) => void;
  onOpenExcelExport: () => void;
  onOpenScanner: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  exam,
  results,
  onDeleteResult,
  onEditResult,
  onOpenExcelExport,
  onOpenScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Filter
  const filtered = results.filter((st) => {
    const q = searchTerm.toLowerCase();
    return (
      st.studentName.toLowerCase().includes(q) ||
      st.studentNumber.toLowerCase().includes(q) ||
      st.className.toLowerCase().includes(q)
    );
  });

  // Calculate quick summary metrics
  const totalStudents = results.length;
  const averageGrade =
    totalStudents > 0
      ? (results.reduce((acc, curr) => acc + curr.scaledGrade, 0) / totalStudents).toFixed(1)
      : '0';
  const highestGrade = totalStudents > 0 ? Math.max(...results.map((r) => r.scaledGrade)) : 0;
  const lowestGrade = totalStudents > 0 ? Math.min(...results.map((r) => r.scaledGrade)) : 0;
  const passingStudents = results.filter((r) => r.scaledGrade >= 50).length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <span>{exam.gradeClass}/{exam.section} Sınıfı Not Çizelgesi</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Öğrenci Puan Listesi ({exam.courseName})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Öğrenci numarasına göre küçükten büyüğe otomatik sıralanmış e-Okul soru puan matrisi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenExcelExport}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel'e Aktar (.xlsx)</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <span>Yeni Kâğıt Tara</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Kayıtlı Öğrenci</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {totalStudents}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Sınıf Ortalaması</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">
            {averageGrade} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">En Yüksek / En Düşük</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            <span className="text-emerald-600">{highestGrade}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="text-slate-600">{lowestGrade}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Başarı Oranı (≥50)</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {totalStudents ? `%${Math.round((passingStudents / totalStudents) * 100)}` : '%0'}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Öğrenci adı veya numarası ile ara..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5 self-end sm:self-center">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>Sıralama: <strong>Okul No (Küçükten Büyüğe)</strong></span>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold divide-x divide-slate-800">
                <th className="px-3 py-3 w-12 text-center">Sıra</th>
                <th className="px-3 py-3 w-20 text-center">Okul No</th>
                <th className="px-4 py-3 min-w-[150px]">Adı Soyadı</th>
                <th className="px-2 py-3 w-16 text-center">Sınıf</th>
                
                {/* Dynamic Question Headers */}
                {exam.questions.map((q) => (
                  <th key={q.questionNumber} className="px-2 py-3 w-16 text-center">
                    <div>S{q.questionNumber}</div>
                    <div className="text-[10px] text-slate-400 font-normal">({q.maxScore}P)</div>
                  </th>
                ))}

                <th className="px-3 py-3 w-20 text-center bg-slate-800">Toplam</th>
                <th className="px-3 py-3 w-20 text-center bg-emerald-900/60 text-emerald-300">100'lük</th>
                <th className="px-3 py-3 w-24 text-center">Kâğıt</th>
                <th className="px-3 py-3 w-24 text-center">İşlemler</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8 + exam.questions.length}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Kayıtlı öğrenci bulunamadı.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Kamera ile sınav kâğıdı tarayarak listenizi hemen oluşturabilirsiniz.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 transition-colors divide-x divide-slate-100"
                  >
                    <td className="px-3 py-3 text-center text-slate-400 font-mono tabular-nums">
                      {idx + 1}
                    </td>

                    <td className="px-3 py-3 text-center font-bold text-slate-900 font-mono tabular-nums">
                      {student.studentNumber}
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {student.studentName}
                    </td>

                    <td className="px-2 py-3 text-center text-slate-500">
                      {student.className}
                    </td>

                    {/* Question Scores */}
                    {exam.questions.map((q) => {
                      const match = student.scores.find((s) => s.questionNumber === q.questionNumber);
                      const scoreVal = match && match.score !== null ? match.score : null;

                      return (
                        <td
                          key={q.questionNumber}
                          className="px-2 py-3 text-center font-mono tabular-nums"
                        >
                          {scoreVal !== null ? (
                            <span
                              className={`font-semibold ${
                                scoreVal === 0
                                  ? 'text-slate-400'
                                  : scoreVal === q.maxScore
                                  ? 'text-emerald-700 font-bold'
                                  : 'text-slate-800'
                              }`}
                            >
                              {scoreVal}
                            </span>
                          ) : (
                            <span className="text-amber-500 font-bold">?</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total & Scaled Grade */}
                    <td className="px-3 py-3 text-center font-bold text-slate-900 font-mono tabular-nums bg-slate-50">
                      {student.totalScore}
                      <span className="text-[10px] text-slate-400 font-normal block">
                        /{exam.totalMaxScore}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center font-bold font-mono tabular-nums bg-emerald-50 text-emerald-800 text-sm">
                      {student.scaledGrade}
                    </td>

                    {/* Paper Preview Button */}
                    <td className="px-3 py-3 text-center">
                      {student.frontImage ? (
                        <button
                          onClick={() => setSelectedPreviewImage(student.frontImage || null)}
                          className="p-1 rounded text-slate-600 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                          title="Sınav Kâğıdını Gör"
                        >
                          <Eye className="w-4 h-4 mx-auto" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300">-</span>
                      )}
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditResult(student)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Puanları Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`${student.studentName} (${student.studentNumber}) kaydını silmek istediğinize emin misiniz?`)) {
                              onDeleteResult(student.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Öğrenciyi Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Fullscreen Preview Modal */}
      {selectedPreviewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPreviewImage}
              alt="Sınav Kâğıdı"
              className="max-h-[85vh] object-contain rounded"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

    </div>
  );
};
