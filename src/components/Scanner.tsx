import React, { useState, useRef, useEffect } from 'react';
import { Exam, GeminiAnalysisResponse } from '../types';
import { 
  Camera, 
  Upload, 
  RotateCw, 
  RotateCcw, 
  Sun, 
  Contrast, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  RefreshCw, 
  FlipHorizontal,
  Layers,
  ArrowRight
} from 'lucide-react';
import { rotateImageDataUrl, enhanceImage, checkImageBlur, optimizeImageForUpload } from '../utils/imageUtils';
import { getSampleStudentExam } from '../services/samplePaperGenerator';

interface ScannerProps {
  currentExam: Exam | null;
  onAnalysisSuccess: (analysis: GeminiAnalysisResponse, frontImage: string, backImage?: string) => void;
  onNavigateToCreateExam: () => void;
  onNavigateToBatchPdf?: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({
  currentExam,
  onAnalysisSuccess,
  onNavigateToCreateExam,
  onNavigateToBatchPdf,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Image enhancement sliders
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(10);
  const [blurWarning, setBlurWarning] = useState<boolean>(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  // Start / Stop Camera
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.log('Autoplay error:', e));
      }
    } catch (err: any) {
      console.warn('Camera facingMode error, fallback to standard video:', err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.log('Autoplay error:', e));
        }
      } catch (fallbackErr: any) {
        setCameraError('Kamera erişimine izin verilmedi veya tarayıcı iframe izin kısıtı var. Lütfen aşağıdaki "Cihaz Kamerası ile Çek" butonunu kullanarak doğrudan telefonunuzun kendi kamera uygulamasını açınız.');
        setIsCameraActive(false);
      }
    }
  };

  // Sync stream to video whenever isCameraActive changes
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((err) => console.log('Video play error:', err));
    }
  }, [isCameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture photo from video
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Ensure video dimensions are ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      await new Promise((r) => setTimeout(r, 150));
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Stop camera after capture
    stopCamera();
    await applyCapturedImage(dataUrl);
  };

  // Switch camera (front/back)
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Apply new captured or uploaded image with auto-downscaling for speed
  const applyCapturedImage = async (dataUrl: string) => {
    // Quickly optimize to max 1600px so upload is ultra fast
    const optimized = await optimizeImageForUpload(dataUrl, 1600);
    const blur = await checkImageBlur(optimized);
    setBlurWarning(blur.isBlurry);

    if (activeSide === 'front') {
      setFrontImage(optimized);
    } else {
      setBackImage(optimized);
    }
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await applyCapturedImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Rotate Active Image
  const handleRotate = async (degrees: number) => {
    const target = activeSide === 'front' ? frontImage : backImage;
    if (!target) return;
    const rotated = await rotateImageDataUrl(target, degrees);
    if (activeSide === 'front') {
      setFrontImage(rotated);
    } else {
      setBackImage(rotated);
    }
  };

  // Enhance Active Image
  const handleEnhance = async (b: number, c: number) => {
    setBrightness(b);
    setContrast(c);
    const target = activeSide === 'front' ? frontImage : backImage;
    if (!target) return;
    const enhanced = await enhanceImage(target, b, c);
    if (activeSide === 'front') {
      setFrontImage(enhanced);
    } else {
      setBackImage(enhanced);
    }
  };

  // Load Prepared Sample Paper
  const loadSamplePaper = (type: 'ihsan' | 'ayse' | 'mehmet') => {
    const front = getSampleStudentExam(type, 'front');
    setFrontImage(front);
    if (type === 'ihsan') {
      const back = getSampleStudentExam(type, 'back');
      setBackImage(back);
    } else {
      setBackImage(null);
    }
    setActiveSide('front');
    setBlurWarning(false);
    setAnalysisError(null);
  };

  // Send to Gemini Multimodal Analysis API
  const handleAnalyze = async () => {
    if (!frontImage) {
      setAnalysisError('Lütfen önce sınav kâğıdının ön yüzünü tarayın veya yükleyin.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontImage,
          backImage: backImage || undefined,
          questionsConfig: currentExam?.questions || [],
          examInfo: currentExam ? {
            courseName: currentExam.courseName,
            gradeClass: currentExam.gradeClass,
            section: currentExam.section,
          } : undefined,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Gemini analiz servisi yanıt veremedi.');
      }

      onAnalysisSuccess(resData.data, frontImage, backImage || undefined);
    } catch (err: any) {
      console.error('Gemini error:', err);
      setAnalysisError(
        err.message || 'Sınav kâğıdı yapay zekâ tarafından okunurken bir hata oluştu. Lütfen görselin netliğini kontrol edip tekrar deneyiniz.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentDisplayImage = activeSide === 'front' ? frontImage : backImage;

  if (!currentExam) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Henüz Aktif Bir Sınav Seçilmedi</h2>
        <p className="text-sm text-slate-600 mb-6">
          Kâğıt taraması yapabilmek için önce bir ders sınavı oluşturmalı veya arşivden var olan bir sınavı seçmelisiniz.
        </p>
        <button
          onClick={onNavigateToCreateExam}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Yeni Sınav Oluştur</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Banner with Exam Info */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Taranan Sınav
          </div>
          <h1 className="text-xl font-bold text-white">
            {currentExam.gradeClass}/{currentExam.section} Sınıfı - {currentExam.courseName}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {currentExam.term} · {currentExam.examName} · {currentExam.questions.length} Soru ({currentExam.totalMaxScore} Puan)
          </p>
        </div>

        {/* Quick Sample Exam Paper loader */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Hızlı Test İçin:</span>
          <button
            onClick={() => loadSamplePaper('ihsan')}
            className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="İhsan Şahin (6/F, 688) örnek kâğıdını yükle"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>İhsan Şahin (688) Örneği</span>
          </button>
          <button
            onClick={() => loadSamplePaper('ayse')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Ayşe Yılmaz (681)
          </button>
        </div>
      </div>

      {/* Batch PDF Callout Banner */}
      {onNavigateToBatchPdf && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Tüm sınıfı tek PDF dosyasında mı taradınız?</strong> Fotokopi makinesinden taranan çok sayfalı (örneğin 37 öğrencinin önlü-arkalı) sınav kâğıtlarını tek tıkla analiz edebilirsiniz.
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToBatchPdf}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <span>Toplu PDF Yükle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Camera Viewport / Image Preview */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Side Tabs (Front / Back Page) */}
          <div className="flex items-center justify-between bg-white border border-slate-200 p-1.5 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveSide('front')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeSide === 'front'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Ön Yüz (1. Sayfa)</span>
                {frontImage && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveSide('back')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeSide === 'back'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Arka Yüz (2. Sayfa)</span>
                {backImage && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {!backImage && <span className="text-[10px] text-slate-400 font-normal">(İsteğe bağlı)</span>}
              </button>
            </div>

            <div className="text-xs text-slate-500 hidden sm:block pr-2">
              {frontImage && backImage
                ? 'İki yüz de hazır'
                : frontImage
                ? 'Ön yüz hazır'
                : 'Kâğıt bekleniyor'}
            </div>
          </div>

          {/* Viewport Area */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/11] border border-slate-800 shadow-sm flex items-center justify-center">
            
            {/* Live Camera Feed */}
            {isCameraActive && (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && streamRef.current && el.srcObject !== streamRef.current) {
                      el.srcObject = streamRef.current;
                      el.play().catch((e) => console.log('Autoplay error:', e));
                    }
                  }}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-contain"
                />

                {/* Viewfinder Alignment Overlay */}
                <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-4">
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></span>
                    <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></span>
                  </div>
                  <div className="text-center text-xs text-emerald-300 font-medium bg-slate-950/70 px-3 py-1 rounded-full self-center backdrop-blur-xs">
                    Sınav kâğıdını çerçeveye denk getiriniz
                  </div>
                  <div className="flex justify-between">
                    <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></span>
                    <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></span>
                  </div>
                </div>

                {/* Live Controls Bar */}
                <div className="absolute bottom-4 inset-x-4 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors cursor-pointer"
                    title="Kamerayı Değiştir"
                  >
                    <FlipHorizontal className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 border-4 border-white shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                    title="Fotoğraf Çek"
                  >
                    <Camera className="w-8 h-8 text-slate-950" />
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 rounded-xl bg-slate-900/80 text-white hover:bg-slate-900 text-xs font-medium cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            )}

            {/* Static Image Preview */}
            {!isCameraActive && currentDisplayImage && (
              <div className="relative w-full h-full flex items-center justify-center p-3 bg-slate-900">
                <img
                  src={currentDisplayImage}
                  alt="Sınav Kâğıdı Önizleme"
                  className="max-h-full max-w-full object-contain rounded shadow-lg"
                  referrerPolicy="no-referrer"
                />

                {/* Active side indicator pill */}
                <div className="absolute top-4 left-4 bg-slate-900/90 text-white text-xs px-3 py-1 rounded-md border border-slate-700 font-medium">
                  {activeSide === 'front' ? 'Ön Yüz (1. Sayfa)' : 'Arka Yüz (2. Sayfa)'}
                </div>

                {/* Blur warning pill if detected */}
                {blurWarning && (
                  <div className="absolute top-4 right-4 bg-amber-500/90 text-slate-950 text-xs px-3 py-1 rounded-md font-semibold flex items-center gap-1.5 shadow-md">
                    <AlertCircle className="w-4 h-4" />
                    <span>Düşük Netlik / Bulanık Uyarısı</span>
                  </div>
                )}
              </div>
            )}

            {/* Empty State / Welcome to scan */}
            {!isCameraActive && !currentDisplayImage && (
              <div className="text-center p-6 text-slate-400 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">
                  {activeSide === 'front' ? 'Ön Yüz Fotoğrafı Bekleniyor' : 'Arka Yüz Fotoğrafı (İsteğe Bağlı)'}
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Telefon kamerasıyla kâğıdı fotoğraflayabilir, galeriden yükleyebilir veya üstteki hızlı örnek kâğıdı deneyebilirsiniz.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => startCamera('environment')}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Canlı Kamera Aç</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Telefonun kendi kamera uygulamasını açar"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Cihaz Kamerası ile Çek</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Galeriden Seç</span>
                  </button>
                </div>
              </div>
            )}

            {/* Hidden file input for gallery */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Hidden file input for native device camera */}
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Image Tuning Toolbar (Rotate, Brightness, Contrast) */}
          {currentDisplayImage && !isCameraActive && (
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                
                {/* Rotate & Reset buttons */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Döndür:</span>
                  <button
                    type="button"
                    onClick={() => handleRotate(270)}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                    title="Sola 90° Döndür"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotate(90)}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                    title="Sağa 90° Döndür"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Retake / Change buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startCamera('environment')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
                  >
                    Yeniden Çek
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
                  >
                    Farklı Fotoğraf
                  </button>
                </div>

              </div>

              {/* Quick Contrast Enhancer for Red Pen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-20 text-slate-500 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5" /> Parlaklık
                  </span>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={brightness}
                    onChange={(e) => handleEnhance(Number(e.target.value), contrast)}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="tabular-nums font-mono text-slate-600 w-8 text-right">{brightness}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-20 text-slate-500 flex items-center gap-1">
                    <Contrast className="w-3.5 h-3.5" /> Kontrast
                  </span>
                  <input
                    type="range"
                    min="-20"
                    max="50"
                    value={contrast}
                    onChange={(e) => handleEnhance(brightness, Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="tabular-nums font-mono text-slate-600 w-8 text-right">+{contrast}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Scan Workflow & Analysis Trigger */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card: Paper Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Kâğıt Durumu
            </h2>

            {/* Front & Back Indicators */}
            <div className="space-y-3">
              <div
                onClick={() => setActiveSide('front')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  activeSide === 'front'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    frontImage ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}>
                    1
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Ön Yüz (1. Sayfa)</div>
                    <div className="text-[11px] text-slate-500">
                      {frontImage ? 'Görsel yüklendi' : 'Fotoğraf gerekli (Zorunlu)'}
                    </div>
                  </div>
                </div>

                {frontImage ? (
                  <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Tamam
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Bekleniyor</span>
                )}
              </div>

              <div
                onClick={() => setActiveSide('back')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  activeSide === 'back'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    backImage ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    2
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Arka Yüz (2. Sayfa)</div>
                    <div className="text-[11px] text-slate-500">
                      {backImage ? 'Görsel yüklendi' : 'Tek yaprak ise boş bırakılabilir'}
                    </div>
                  </div>
                </div>

                {backImage ? (
                  <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Tamam
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs">Opsiyonel</span>
                )}
              </div>
            </div>

            {/* AI Rules & Guidance Reminder */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Kırmızı Kalem Tanıma Kuralları:
              </div>
              <p>• Öğrencinin yazdığı cevaplar okunmaz, sadece öğretmenin kırmızı puanı tespit edilir.</p>
              <p>• Kırmızı tikler (✓) ve çarpılar (✗) puan sayılmaz.</p>
              <p>• Puanlar sonraki Onay Ekranı'nda öğretmen tarafından kontrol edilir ve değiştirilebilir.</p>
            </div>

            {/* Error Message */}
            {analysisError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{analysisError}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={!frontImage || isAnalyzing}
              onClick={handleAnalyze}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                !frontImage
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : isAnalyzing
                  ? 'bg-slate-800 text-white cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white hover:shadow'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Gemini Kırmızı Puanları Okuyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Yapay Zekâ ile Kâğıdı Oku</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

          </div>

          {/* Continuous Scanning Tip */}
          <div className="bg-slate-100/80 rounded-xl p-3.5 border border-slate-200/80 text-xs text-slate-600">
            <span className="font-semibold text-slate-900 block mb-1">💡 Seri Tarama İpucu:</span>
            Onay ekranından hemen sonra <strong className="text-slate-800">"Sıradaki Kâğıdı Tara"</strong> tuşuna basarak 30 kişilik bir sınıfın tüm kâğıtlarını 3-4 dakika içinde arka arkaya tarayabilirsiniz.
          </div>

        </div>

      </div>
    </div>
  );
};
