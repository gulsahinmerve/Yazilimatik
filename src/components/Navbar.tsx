import React from 'react';
import { ActiveTab, Exam } from '../types';
import { 
  FileSpreadsheet, 
  Camera, 
  Users, 
  BarChart3, 
  Download, 
  Archive, 
  PlusCircle, 
  Settings,
  BookOpen
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  exams: Exam[];
  selectedExamId: string;
  onSelectExam: (examId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  exams,
  selectedExamId,
  onSelectExam,
}) => {
  const currentExam = exams.find((e) => e.id === selectedExamId);

  const navItems = [
    { id: 'create-exam' as ActiveTab, label: 'Yeni Sınav', icon: PlusCircle },
    { id: 'scan-paper' as ActiveTab, label: 'Kâğıt Tara', icon: Camera },
    { id: 'batch-pdf' as ActiveTab, label: 'Toplu PDF', icon: BookOpen },
    { id: 'student-list' as ActiveTab, label: 'Öğrenci Listesi', icon: Users },
    { id: 'exam-results' as ActiveTab, label: 'Sınav Sonuçları', icon: BarChart3 },
    { id: 'excel-reports' as ActiveTab, label: 'Excel Raporları', icon: Download },
    { id: 'exam-archive' as ActiveTab, label: 'Sınav Arşivi', icon: Archive },
    { id: 'settings' as ActiveTab, label: 'Ayarlar', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setActiveTab('scan-paper')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
                Y
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap block leading-tight">
                  YAZILIMATİK
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide block">
                  Kırmızı Kalem Puan & Excel Sistemi
                </span>
              </div>
            </button>
          </div>

          {/* Active Exam Selector Badge (middle or inline) */}
          {exams.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Aktif Sınav:</span>
              <select
                value={selectedExamId}
                onChange={(e) => onSelectExam(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1 truncate max-w-[220px]"
              >
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id} className="bg-slate-900 text-white">
                    {exam.gradeClass}/{exam.section} - {exam.courseName} ({exam.examName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Primary Quick CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('scan-paper')}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold text-xs rounded-lg shadow transition-all whitespace-nowrap cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Kâğıt Tara</span>
              <span className="sm:hidden">Tara</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-slate-800/80 gap-1 no-scrollbar text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-emerald-400 bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
