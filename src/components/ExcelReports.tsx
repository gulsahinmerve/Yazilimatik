import React, { useState } from 'react';
import { Exam, StudentResult } from '../types';
import { 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  FileText, 
  Layers, 
  BarChart, 
  Info,
  Calendar
} from 'lucide-react';
import { 
  exportQuestionScoresExcel, 
  exportTotalScoresSummary, 
  exportFullDetailedExcel, 
  exportBlankClassTemplate 
} from '../services/excelService';

interface ExcelReportsProps {
  exam: Exam;
  results: StudentResult[];
}

export const ExcelReports: React.FC<ExcelReportsProps> = ({ exam, results }) => {
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const handleExport = (type: 'A' | 'B' | 'C' | 'D') => {
    try {
      if (type === 'A') {
        exportQuestionScoresExcel(exam, results);
        setDownloadSuccessMessage('Soru Bazında Puan Listesi (.xlsx) başarıyla indirildi.');
      } else if (type === 'B') {
        exportTotalScoresSummary(exam, results);
        setDownloadSuccessMessage('Özet Toplam Not Listesi (.xlsx) başarıyla indirildi.');
      } else if (type === 'C') {
        exportFullDetailedExcel(exam, results);
        setDownloadSuccessMessage('Ayrıntılı Sınav Karnesi ve İstatistik Exceli (.xlsx) başarıyla indirildi.');
      } else if (type === 'D') {
        exportBlankClassTemplate(exam, results);
        setDownloadSuccessMessage('Sınıf Boş Değerlendirme Çizelgesi (.xlsx) başarıyla indirildi.');
      }

      setTimeout(() => {
        setDownloadSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Excel dosyası oluşturulurken bir hata oluştu: ' + (err.message || ''));
    }
  };

  const exportOptions = [
    {
      id: 'A' as const,
      tag: 'A ŞIKKI',
      title: 'Soru Bazında Puan Listesi (e-Okul Uyumlu)',
      badge: 'En Çok Tercih Edilen',
      description:
        'Her sorunun ayrı sütunlarda listelendiği, MEB e-Okul soru puanı aktarımı ve sınav analizleri için resmi standart format.',
      columns: ['Sıra', 'Sınıf', 'Okul No', 'Adı Soyadı', ...exam.questions.map((q) => `S${q.questionNumber}`), 'Toplam', "100'lük Not"],
      icon: Layers,
    },
    {
      id: 'B' as const,
      tag: 'B ŞIKKI',
      title: 'Toplam Puan Listesi',
      badge: 'Özet Liste',
      description:
        'Soru detaylarına girmeden yalnızca öğrenci kimliği ve sınavdan aldığı nihai toplam puan ile 100’lük notu içeren sade liste.',
      columns: ['Sıra', 'Sınıf/Şube', 'Okul No', 'Adı Soyadı', 'Toplam Not', "100'lük Not"],
      icon: FileText,
    },
    {
      id: 'C' as const,
      tag: 'C ŞIKKI',
      title: 'Bütün Verilerin Bulunduğu Ayrıntılı Excel',
      badge: 'Çok Sayfalı Rapor',
      description:
        'Öğrenci puan matrisine ek olarak her sorunun başarı yüzdesi, soru ortalamaları, sınıfın en yüksek/düşük notları ve başarı grafik verilerini içeren 2 sayfalı zengin karne.',
      columns: ['Öğrenci Puanları Sayfası', 'Soru Başarı Analizleri Sayfası', 'Sınıf İstatistik Tabloları'],
      icon: BarChart,
    },
    {
      id: 'D' as const,
      tag: 'D ŞIKKI',
      title: 'Seçilen Sınıfın Boş Not Çizelgesi Şablonu',
      badge: 'Yazıcı / El Çizelgesi',
      description:
        'Öğrenci isim ve numaralarının hazır dizili olduğu, soru kutucuklarının el yazısıyla not almak üzere boş bırakıldığı sınıf şablonu.',
      columns: ['Sıra', 'Okul No', 'Adı Soyadı', ...exam.questions.map((q) => `S${q.questionNumber} (Boş)`), 'Toplam'],
      icon: Calendar,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
          <span>{exam.gradeClass}/{exam.section} Sınıfı · {exam.courseName}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Excel Aktarım ve Raporlama Modülü
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Taranan sınav sonuçlarını gerçek .xlsx formatında tek tıkla bilgisayarınıza veya telefonunuza indirin.
          Tüm listelerde öğrenciler numaralarına göre küçükten büyüğe sıralıdır.
        </p>
      </div>

      {/* Success Notification */}
      {downloadSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exportOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 tracking-wider">
                    {opt.tag}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {opt.badge}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {opt.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>

                {/* Columns Preview Pill List */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                    İçerdiği Sütunlar:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {opt.columns.slice(0, 8).map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/80"
                      >
                        {c}
                      </span>
                    ))}
                    {opt.columns.length > 8 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{opt.columns.length - 8} daha
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {results.length} öğrenci kaydı aktarılacak
                </span>

                <button
                  type="button"
                  onClick={() => handleExport(opt.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>.XLSX İndir</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card on e-Okul format */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">
            e-Okul İthalat Formatı Hakkında Bilgi
          </div>
          <p>
            Milli Eğitim Bakanlığı e-Okul Yazılı Sınav Giriş ekranı her soru için ayrı puan girişi gerektirmektedir.
            <strong> Soru Bazında Puan Listesi</strong> seçeneğini indirerek Excel'deki sütunları doğrudan e-Okul'a kopyalayabilir veya arşiv amaçlı resmi sınav analiz dosyanız olarak kullanabilirsiniz.
          </p>
        </div>
      </div>

    </div>
  );
};
