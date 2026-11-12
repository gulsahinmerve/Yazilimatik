import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser with 50MB limit for high-resolution exam paper images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY bulunamadı. Lütfen Ayarlar > Secrets bölümünden API anahtarını kontrol ediniz.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: Health check & configuration
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    service: 'Yazılımatik API',
    version: '1.0.0',
  });
});

// API: Analyze Exam Paper using Gemini Multimodal
app.post('/api/analyze-paper', async (req, res) => {
  try {
    const { frontImage, backImage, questionsConfig, examInfo } = req.body;

    if (!frontImage) {
      return res.status(400).json({
        success: false,
        error: 'Sınav kâğıdı görseli gönderilmedi.',
      });
    }

    const ai = getAIClient();

    // Prepare contents
    const contents: any[] = [];

    // Helper to format base64
    const formatImagePart = (dataUrl: string) => {
      let mimeType = 'image/jpeg';
      let base64Data = dataUrl;

      if (dataUrl.includes(';base64,')) {
        const parts = dataUrl.split(';base64,');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1];
        base64Data = parts[1];
      }

      return {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };
    };

    contents.push(formatImagePart(frontImage));

    if (backImage) {
      contents.push(formatImagePart(backImage));
    }

    // Context from exam config if provided
    let examContextPrompt = '';
    if (questionsConfig && Array.isArray(questionsConfig)) {
      examContextPrompt = `\nBU SINAVDA BEKLENEN SORULAR VE MAKSİMUM PUANLARI:\n` +
        questionsConfig.map((q: any) => `- Soru ${q.questionNumber}: Maksimum ${q.maxScore} puan`).join('\n');
    }

    if (examInfo) {
      examContextPrompt += `\nBEKLENEN SINAV BİLGİSİ: Ders: ${examInfo.courseName || ''}, Sınıf: ${examInfo.gradeClass || ''}, Şube: ${examInfo.section || ''}`;
    }

    const systemInstruction = `Sen "YAZILIMATİK" isimli profesyonel yazılı kâğıdı puan tanıma yapay zekasısın.
GÖREVİN VE ÇOK KATI KURALLAR:
1. Sen ASLA öğrencinin yazdığı cevapları okumayacak, değerlendirmeyecek ve cevap anahtarı kullanmayacaksın. Bu bir cevap okuma veya değerlendirme sistemi DEĞİLDİR!
2. YALNIZCA sınav kâğıdı üzerine öğretmenin KIRMIZI KALEMLE (tükenmez, keçeli veya kurşun kırmızı) yazdığı PUANLARI tespit edeceksin.
3. Öğrencinin mavi veya kurşun kalemle yazdığı cevaplarındaki rakamları kesinlikle puan olarak algılama.
4. Kırmızı tikler (✓), çarpılar (✗), alt çizgiler ve öğretmenin soru yanındaki işaretlerini PUAN OLARAK ALGILAMA; yalnızca öğretmenin soru yanına veya puan kutucuğuna yazdığı sayısal puanı oku.
5. Öğrencinin kimlik bilgilerini kâğıdın başlık/öğrenci bilgi alanından oku:
   - studentName: Öğrencinin Adı ve Soyadı (Örn: "İhsan Şahin")
   - className: Sınıf ve Şube (Örn: "6/F" veya "6-F" veya "6F")
   - studentNumber: Öğrenci Okul Numarası (Örn: "688")
6. Soru puanları:
   - Soru numarasını (questionNumber) doğru belirle (1, 2, 3...).
   - Öğretmenin kırmızı kalemle yazdığı puanı (score) sayı olarak al.
   - Eğer öğretmen "0" yazdıysa score: 0 olmalıdır.
   - Eğer bir soru için kırmızı puan net okunamıyorsa veya şüpheliyse kesinlikle UYDURMA, score değerini null olarak belirle ve confidence değerini düşük (örneğin 0.3) ver.
   - Confidence (0.00 - 1.00 arası): Puanın ve soru eşleşmesinin netliğine göre bir güven skoru ver.
   - Eğer hem ön yüz hem arka yüz fotoğrafı verildiyse, arka yüzdeki soruları da sırasına uygun ekle.
7. ${examContextPrompt}
8. Çıktıyı MUTLAKA istenen JSON şemasına birebir uygun döndür.`;

    const promptText = `Lütfen yüklenen sınav kâğıdı görselini (ön yüz ${backImage ? 've arka yüz' : ''}) dikkatlice incele.
Öğretmenin kırmızı kalemle yazdığı soru puanlarını ve öğrencinin kimlik bilgilerini (Ad Soyad, Sınıf/Şube, Numara) çıkar.
Unutma: Sadece öğretmenin kırmızı kalemle yazdığı sayısal puanları oku!`;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: {
              type: Type.STRING,
              description: 'Öğrencinin adı ve soyadı',
            },
            className: {
              type: Type.STRING,
              description: 'Öğrencinin sınıf ve şubesi (örn: 6/F)',
            },
            studentNumber: {
              type: Type.STRING,
              description: 'Öğrencinin okul numarası (örn: 688)',
            },
            notes: {
              type: Type.STRING,
              description: 'Varsa öğretmen veya kâğıtla ilgili ek not/uyarı',
            },
            scores: {
              type: Type.ARRAY,
              description: 'Her soru için öğretmenin verdiği kırmızı puanlar listesi',
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: {
                    type: Type.INTEGER,
                    description: 'Soru numarası (1, 2, 3...)',
                  },
                  score: {
                    type: Type.NUMBER,
                    description: 'Öğretmenin yazdığı puan. Okunamıyorsa null olabilir.',
                  },
                  confidence: {
                    type: Type.NUMBER,
                    description: 'Okuma güven düzeyi (0.0 ile 1.0 arası)',
                  },
                  teacherNote: {
                    type: Type.STRING,
                    description: 'Soru yanındaki kırmızı not varsa (örn: +2 kanaat, yarım puan vb.)',
                  },
                },
                required: ['questionNumber', 'confidence'],
              },
            },
          },
          required: ['studentName', 'className', 'studentNumber', 'scores'],
        },
      },
    });

    const rawText = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', rawText);
      return res.status(500).json({
        success: false,
        error: 'Yapay zekâ yanıtı geçerli JSON formatında ayrıştırılamadı.',
        rawText,
      });
    }

    return res.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error('Gemini paper analysis error:', error);
    const errorMessage = error?.message || 'Sınav kâğıdı incelenirken bir hata oluştu.';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// API: Analyze Batch PDF containing multiple students' exam papers
app.post('/api/analyze-pdf-batch', async (req, res) => {
  try {
    const { pdfBase64, questionsConfig, examInfo, pageRangeInfo } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({
        success: false,
        error: 'Toplu sınav PDF dosyası gönderilmedi.',
      });
    }

    const ai = getAIClient();

    let cleanBase64 = pdfBase64;
    if (pdfBase64.includes(';base64,')) {
      cleanBase64 = pdfBase64.split(';base64,')[1];
    }

    const pdfPart = {
      inlineData: {
        mimeType: 'application/pdf',
        data: cleanBase64,
      },
    };

    let examContextPrompt = '';
    if (questionsConfig && Array.isArray(questionsConfig)) {
      examContextPrompt = `\nBU SINAVDA BEKLENEN SORULAR VE MAKSİMUM PUANLARI:\n` +
        questionsConfig.map((q: any) => `- Soru ${q.questionNumber}: Maksimum ${q.maxScore} puan`).join('\n');
    }

    if (examInfo) {
      examContextPrompt += `\nBEKLENEN SINAV: Ders: ${examInfo.courseName || ''}, Sınıf: ${examInfo.gradeClass || ''}, Şube: ${examInfo.section || ''}`;
    }

    const systemInstruction = `Sen "YAZILIMATİK TOPLU PDF PUANLAYICI" sistemisin.
GÖREVİN VE ÇOK KATI KURALLAR:
1. Bu PDF dosyasında bir veya birden fazla öğrencinin yazılı sınav kâğıtları bulunmaktadır (kâğıtlar tek sayfa veya önlü-arkalı 2 sayfa olabilir).
2. Kesinlikle öğrencinin yazdığı cevapları DEĞERLENDİRME! Yalnızca öğretmenin kırmızı kalemle yazdığı sayısal soru puanlarını tespit et.
3. Kırmızı tikler, çarpılar ve alt çizgiler puan değildir. Sadece sayı olan kırmızı puanları oku.
4. PDF içindeki HER BİR ÖĞRENCİ İÇİN ayrı bir kayıt oluştur:
   - studentName: Öğrencinin Adı Soyadı
   - className: Sınıf ve Şubesi (Örn: "6/F")
   - studentNumber: Öğrenci Numarası (Örn: "688")
   - pagesDetected: Öğrencinin bulunduğu sayfalar (örn: "Sayfa 1-2")
   - scores: Her soru için öğretmenin verdiği kırmızı kalem puanları
5. Eğer bir sorunun kırmızı puanı net değilse uydurma, score değerini null yap ve confidence değerini 0.4 ver. Öğretmen "0" yazdıysa score: 0 yap.
6. Bir öğrencinin ön yüzü ve arka yüzü varsa soruları birleştir (örn: ön yüzde Soru 1-4, arka yüzde Soru 5-8).
7. ${examContextPrompt}
8. Çıktıyı JSON şemasına uygun DİZİ (Array) olarak döndür.`;

    const promptText = `Lütfen ekteki PDF dosyasını incele. İçinde yer alan tüm öğrencilerin kimlik bilgilerini ve öğretmenin kırmızı kalemle verdiği soru puanlarını çıkar. Her öğrenciyi dizide ayrı bir eleman olarak döndür.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [pdfPart, { text: promptText }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'PDF içindeki her bir öğrencinin sınav analizi listesi',
          items: {
            type: Type.OBJECT,
            properties: {
              studentName: {
                type: Type.STRING,
                description: 'Öğrencinin adı ve soyadı',
              },
              className: {
                type: Type.STRING,
                description: 'Öğrencinin sınıf ve şubesi (örn: 6/F)',
              },
              studentNumber: {
                type: Type.STRING,
                description: 'Öğrenci okul numarası',
              },
              pagesDetected: {
                type: Type.STRING,
                description: 'Tespit edilen sayfa veya sayfa aralığı (örn: "1-2")',
              },
              notes: {
                type: Type.STRING,
                description: 'Varsa öğretmen notu veya uyarı',
              },
              scores: {
                type: Type.ARRAY,
                description: 'Öğretmenin kırmızı kalemle verdiği soru puanları',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionNumber: {
                      type: Type.INTEGER,
                      description: 'Soru numarası',
                    },
                    score: {
                      type: Type.NUMBER,
                      description: 'Kırmızı kalemle verilen puan. Okunamıyorsa null.',
                    },
                    confidence: {
                      type: Type.NUMBER,
                      description: 'Puan okuma güveni (0.0 - 1.0)',
                    },
                    teacherNote: {
                      type: Type.STRING,
                      description: 'Kırmızı soru notu',
                    },
                  },
                  required: ['questionNumber', 'confidence'],
                },
              },
            },
            required: ['studentName', 'className', 'studentNumber', 'scores'],
          },
        },
      },
    });

    const rawText = response.text || '[]';
    let parsedStudents: any[] = [];
    try {
      parsedStudents = JSON.parse(rawText);
      if (!Array.isArray(parsedStudents)) {
        parsedStudents = [parsedStudents];
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini batch PDF JSON output:', rawText);
      return res.status(500).json({
        success: false,
        error: 'Toplu PDF analizi JSON çıktısı ayrıştırılamadı.',
        rawText,
      });
    }

    return res.json({
      success: true,
      data: parsedStudents,
      count: parsedStudents.length,
      pageRangeInfo: pageRangeInfo || undefined,
    });
  } catch (error: any) {
    console.error('Gemini batch PDF analysis error:', error);
    const errorMessage = error?.message || 'Toplu PDF incelenirken bir hata oluştu.';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

// Mount Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[YAZILIMATİK] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
