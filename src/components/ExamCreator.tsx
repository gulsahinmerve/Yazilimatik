import React, { useState } from 'react';
import { Exam, QuestionConfig } from '../types';
import { Plus, Trash2, CheckCircle2, AlertTriangle, Sparkles, BookOpen } from 'lucide-react';

interface ExamCreatorProps {
  onExamCreated: (exam: Exam) => void;
  existingExamsCount: number;
}

export const ExamCreator: React.FC<ExamCreatorProps> = ({ onExamCreated, existingExamsCount }) => {
  const [courseName, setCourseName] = useState('Matematik');
  const [gradeClass, setGradeClass] = useState('6');
  const [section, setSection] = useState('F');
  const [term, setTerm] = useState('1. Dönem');
  const [examName, setExamName] = useState('2. Yazılı Yoklama');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Initial questions matching user prompt example (15, 15, 20, 10, 10, 10, 10, 10 = 100)
  const [questions, setQuestions] = useState<QuestionConfig[]>([
    { questionNumber: 1, maxScore: 15 },
    { questionNumber: 2, maxScore: 15 },
    { questionNumber: 3, maxScore: 20 },
    { questionNumber: 4, maxScore: 10 },
    { questionNumber: 5, maxScore: 10 },
    { questionNumber: 6, maxScore: 10 },
    { questionNumber: 7, maxScore: 10 },
    { questionNumber: 8, maxScore: 10 },
  ]);

  const totalMaxScore = questions.reduce((sum, q) => sum + (Number(q.maxScore) || 0), 0);

  const handleScoreChange = (qNum: number, scoreVal: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.questionNumber === qNum ? { ...q, maxScore: Math.max(1, scoreVal) } : q))
    );
  };

  const addQuestion = () => {
    const nextNum = questions.length + 1;
    // suggest remainder to reach 100
    const remainder = Math.max(5, 100 - totalMaxScore);
    setQuestions([...questions, { questionNumber: nextNum, maxScore: remainder }]);
  };

  const removeQuestion = (qNum: number) => {
    if (questions.length <= 1) return;
    const filtered = questions.filter((q) => q.questionNumber !== qNum);
    // re-index
    const reindexed = filtered.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    setQuestions(reindexed);
  };

  // Quick Presets
  const applyPreset = (presetType: '8q-user' | '10q' | '5q' | '4q') => {
    if (presetType === '8q-user') {
      setQuestions([
        { questionNumber: 1, maxScore: 15 },
        { questionNumber: 2, maxScore: 15 },
        { questionNumber: 3, maxScore: 20 },
        { questionNumber: 4, maxScore: 10 },
        { questionNumber: 5, maxScore: 10 },
        { questionNumber: 6, maxScore: 10 },
        { questionNumber: 7, maxScore: 10 },
        { questionNumber: 8, maxScore: 10 },
      ]);
    } else if (presetType === '10q') {
      setQuestions(Array.from({ length: 10 }, (_, i) => ({ questionNumber: i + 1, maxScore: 10 })));
    } else if (presetType === '5q') {
      setQuestions(Array.from({ length: 5 }, (_, i) => ({ questionNumber: i + 1, maxScore: 20 })));
    } else if (presetType === '4q') {
      setQuestions(Array.from({ length: 4 }, (_, i) => ({ questionNumber: i + 1, maxScore: 25 })));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      courseName: courseName.trim(),
      gradeClass: gradeClass.trim(),
      section: section.trim().toUpperCase(),
      term,
      examName: examName.trim(),
      examDate,
      questions,
      totalMaxScore,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: description.trim() || `${gradeClass}/${section.toUpperCase()} ${courseName} ${term} ${examName}`,
    };

    onExamCreated(newExam);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Yeni Sınav Oluştur</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ders, sınıf ve soru puan dağılımını belirleyerek optik/kırmızı kalem taramasına hazır hale getirin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Exam General Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Sınav Künyesi ve Sınıf Bilgileri
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ders Adı *</label>
              <input
                type="text"
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Örn: Matematik, Fen Bilimleri..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sınıf Seviyesi *</label>
              <select
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
                  <option key={g} value={g}>
                    {g}. Sınıf
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Şube *</label>
              <input
                type="text"
                required
                maxLength={4}
                value={section}
                onChange={(e) => setSection(e.target.value.toUpperCase())}
                placeholder="Örn: F veya A"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none uppercase font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Dönem *</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="1. Dönem">1. Dönem</option>
                <option value="2. Dönem">2. Dönem</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sınav Adı *</label>
              <input
                type="text"
                required
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Örn: 2. Yazılı Yoklama"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sınav Tarihi</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Question Points Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Soru Sayısı ve Puan Dağılımı</h2>
              <p className="text-xs text-slate-500">
                Her sorunun maksimum puanını giriniz. Gemini yapay zekâ bu dağılıma göre kırmızı kalem puanlarını doğrulayacaktır.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium mr-1">Şablonlar:</span>
              <button
                type="button"
                onClick={() => applyPreset('8q-user')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md font-medium text-slate-700 transition-colors"
              >
                8 Soru (15,15,20,10...)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('10q')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md font-medium text-slate-700 transition-colors"
              >
                10x10 Puan
              </button>
              <button
                type="button"
                onClick={() => applyPreset('5q')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md font-medium text-slate-700 transition-colors"
              >
                5x20 Puan
              </button>
            </div>
          </div>

          {/* Question List Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
            {questions.map((q) => (
              <div
                key={q.questionNumber}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-md bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    S{q.questionNumber}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 leading-none">Maks. Puan</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={q.maxScore}
                      onChange={(e) => handleScoreChange(q.questionNumber, parseInt(e.target.value, 10) || 0)}
                      className="w-16 px-1.5 py-0.5 mt-0.5 border border-slate-300 rounded font-semibold text-sm text-slate-800 bg-white focus:ring-1 focus:ring-emerald-500 outline-none tabular-nums"
                    />
                  </div>
                </div>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.questionNumber)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                    title="Soruyu Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {/* Add Question Button */}
            <button
              type="button"
              onClick={addQuestion}
              className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 text-slate-600 hover:text-emerald-700 transition-all cursor-pointer min-h-[64px]"
            >
              <Plus className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-medium">Soru Ekle</span>
            </button>
          </div>

          {/* Total & 100-Score Status Banner */}
          <div className="pt-2">
            <div
              className={`flex items-center justify-between p-4 rounded-xl border ${
                totalMaxScore === 100
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {totalMaxScore === 100 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-semibold">
                    Toplam Puan: <span className="tabular-nums font-bold text-base">{totalMaxScore}</span> / 100 Puan
                  </div>
                  <div className="text-xs text-slate-600">
                    {totalMaxScore === 100
                      ? 'Puan toplamı ideal 100 tam puana eşit. e-Okul ve not dönüşümleri sorunsuz çalışacaktır.'
                      : `Soru puanları toplamı ${totalMaxScore} puan. 100 puan olması tavsiye edilir, ancak orantılı 100'lük not yine de hesaplanacaktır.`}
                  </div>
                </div>
              </div>

              {totalMaxScore !== 100 && (
                <button
                  type="button"
                  onClick={() => {
                    const diff = 100 - totalMaxScore;
                    if (questions.length > 0) {
                      const lastQ = questions[questions.length - 1];
                      handleScoreChange(lastQ.questionNumber, Math.max(1, lastQ.maxScore + diff));
                    }
                  }}
                  className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shrink-0 transition-colors cursor-pointer"
                >
                  100'e Tamamla
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Sınavı Kaydet ve Kâğıt Taramaya Başla</span>
          </button>
        </div>
      </form>
    </div>
  );
};
