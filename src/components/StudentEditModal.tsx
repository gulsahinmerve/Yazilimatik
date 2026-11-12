import React, { useState } from 'react';
import { Exam, StudentResult, ScoredQuestion } from '../types';
import { X, CheckCircle2, UserCheck } from 'lucide-react';

interface StudentEditModalProps {
  exam: Exam;
  student: StudentResult;
  onSave: (updated: StudentResult) => void;
  onClose: () => void;
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({
  exam,
  student,
  onSave,
  onClose,
}) => {
  const [studentName, setStudentName] = useState(student.studentName);
  const [studentNumber, setStudentNumber] = useState(student.studentNumber);
  const [className, setClassName] = useState(student.className);
  const [scores, setScores] = useState<ScoredQuestion[]>(student.scores);

  const handleScoreChange = (qNum: number, valStr: string) => {
    setScores((prev) =>
      prev.map((q) => {
        if (q.questionNumber === qNum) {
          if (valStr === '') return { ...q, score: null, isOverridden: true };
          const parsed = parseFloat(valStr);
          return {
            ...q,
            score: isNaN(parsed) ? null : Math.min(q.maxScore, Math.max(0, parsed)),
            isOverridden: true,
          };
        }
        return q;
      })
    );
  };

  const totalScore = scores.reduce((sum, q) => sum + (typeof q.score === 'number' ? q.score : 0), 0);
  const totalExamMax = exam.totalMaxScore || 100;
  const scaledGrade = totalExamMax > 0 ? Math.round((totalScore / totalExamMax) * 100) : totalScore;
  const hasMissing = scores.some((q) => q.score === null || isNaN(q.score));

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StudentResult = {
      ...student,
      studentName: studentName.trim(),
      studentNumber: studentNumber.trim(),
      className: className.trim(),
      scores,
      totalScore,
      scaledGrade,
      hasMissingScores: hasMissing,
      verifiedAt: new Date().toISOString(),
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Öğrenci Puanlarını Düzenle</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          {/* Student Info */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Öğrenci No</label>
              <input
                type="text"
                required
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Adı Soyadı</label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Scores Table */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Soru Puanları
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto p-1">
              {scores.map((q) => (
                <div
                  key={q.questionNumber}
                  className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between"
                >
                  <span className="font-bold text-xs text-slate-800">S{q.questionNumber}:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max={q.maxScore}
                      step="0.5"
                      value={q.score !== null ? q.score : ''}
                      placeholder="0"
                      onChange={(e) => handleScoreChange(q.questionNumber, e.target.value)}
                      className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center text-xs font-bold bg-white outline-none focus:ring-1 focus:ring-emerald-500 font-mono tabular-nums"
                    />
                    <span className="text-[10px] text-slate-400">/{q.maxScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Bar */}
          <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Toplam Puan: </span>
              <strong className="text-emerald-400 text-base font-mono tabular-nums">{totalScore}</strong> / {totalExamMax}
            </div>
            <div>
              <span className="text-slate-400">100'lük Not: </span>
              <strong className="text-emerald-400 text-base font-mono tabular-nums">{scaledGrade}</strong>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
