import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  ShieldCheck, 
  HelpCircle,
  FileDown,
  Sparkles
} from 'lucide-react';
import { resetAllData } from '../services/db';

interface SettingsViewProps {
  onDataReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataReset }) => {
  const [apiStatus, setApiStatus] = useState<{ checked: boolean; ok: boolean; hasKey: boolean; message: string }>({
    checked: false,
    ok: false,
    hasKey: false,
    message: 'Kontrol ediliyor...',
  });

  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setApiStatus({
          checked: true,
          ok: data.status === 'ok',
          hasKey: data.hasApiKey,
          message: data.hasApiKey
            ? 'Gemini 3.8 Flash API bağlantısı aktif ve hazır.'
            : 'GEMINI_API_KEY ortam değişkeni ayarlanmadı. Lütfen AI Studio Secrets panelinden kontrol ediniz.',
        });
      })
      .catch((err) => {
        setApiStatus({
          checked: true,
          ok: false,
          hasKey: false,
          message: 'API sunucusuna erişilemedi: ' + err.message,
        });
      });
  }, []);

  const handleReset = async () => {
    if (window.confirm('Tüm sınavlar ve öğrenci kayıtları sıfırlanıp varsayılan örnek veriler yüklenecektir. Onaylıyor musunuz?')) {
      await resetAllData();
      setResetMessage('Veriler başarıyla sıfırlandı ve 6/F Matematik örnek sınavı yüklendi.');
      onDataReset();
      setTimeout(() => setResetMessage(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sistem Ayarları</h1>
        <p className="text-xs text-slate-500 mt-1">
          Yazılımatik servis durumu, veri tabanı ve yapay zekâ entegrasyon ayarları.
        </p>
      </div>

      {resetMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Core Principle Notice Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          Temel Çalışma Prensibi
        </div>
        <h2 className="text-lg font-bold text-white leading-snug">
          Yazılımatik Bir Cevap Değerlendirme Sistemi Değildir
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Bu uygulama öğrencilerin sınav kâğıdındaki cevaplarını okumaz, doğruluğunu kontrol etmez ve cevap anahtarı kullanmaz.
          Öğretmenin kırmızı kalemle yazılı kâğıdına verdiği soru puanlarını optik yapay zekâ ile tanıyarak toplar, onaylatır ve resmi e-Okul / Excel formatında tablolara dönüştürür.
        </p>
      </div>

      {/* Gemini AI Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Gemini Yapay Zekâ Durumu</h3>
          </div>

          {apiStatus.checked && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                apiStatus.ok && apiStatus.hasKey
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {apiStatus.ok && apiStatus.hasKey ? 'Çalışıyor' : 'Kontrol Gerekli'}
            </span>
          )}
        </div>

        <div className="text-xs space-y-2 text-slate-600">
          <p>
            <strong>Kullanılan Model:</strong>{' '}
            <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono text-[11px]">
              gemini-3.8-flash
            </code>{' '}
            (Yüksek hızlı görsel analiz ve kırmızı mürekkep tanıma)
          </p>
          <p>
            <strong>Bağlantı Notu:</strong> {apiStatus.message}
          </p>
        </div>
      </div>

      {/* Local Persistence & Reset Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Yerel Veri Tabanı (IndexedDB)</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Tüm sınavlarınız, öğrenci notlarınız ve taranan kâğıt önizlemeleri tarayıcınızın güvenli yerel IndexedDB deposunda saklanır. İnternet kesilse bile verileriniz kaybolmaz.
        </p>

        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Örnek verileri sıfırlamak veya sistemi baştan başlatmak için:
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Örnek Verileri Sıfırla</span>
          </button>
        </div>
      </div>

    </div>
  );
};
