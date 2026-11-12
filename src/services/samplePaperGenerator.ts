/**
 * Generates high-resolution realistic exam papers with student answers in blue/black
 * and teacher's handwritten score annotations in vibrant RED PEN,
 * exactly matching the user prompt's example (İhsan Şahin, 6/F, 688).
 */

export interface SamplePaperConfig {
  studentName: string;
  className: string;
  studentNumber: string;
  courseName: string;
  term: string;
  examName: string;
  scores: {
    questionNumber: number;
    score: number;
    maxScore: number;
    teacherNote?: string;
  }[];
  side: 'front' | 'back';
}

export function generateSampleExamPaperDataUrl(config: SamplePaperConfig): string {
  const canvas = document.createElement('canvas');
  // High quality A4 ratio (1200 x 1700)
  canvas.width = 1200;
  canvas.height = 1700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - Off-white paper with subtle paper texture
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper grain/grid
  ctx.strokeStyle = '#f1ece1';
  ctx.lineWidth = 1;
  for (let y = 50; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(canvas.width - 50, y);
    ctx.stroke();
  }

  // Margin guide line
  ctx.strokeStyle = '#fcd5ce';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(110, 50);
  ctx.lineTo(110, canvas.height - 50);
  ctx.stroke();

  // Draw Header Box (only on front page)
  if (config.side === 'front') {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(120, 60, canvas.width - 180, 160);

    // School & Exam Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MEHMET AKİF ERSOY ORTAOKULU', canvas.width / 2, 100);

    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`2026-2027 EĞİTİM ÖĞRETİM YILI ${config.courseName.toUpperCase()} DERSİ`, canvas.width / 2, 135);
    ctx.fillText(`${config.term.toUpperCase()} ${config.examName.toUpperCase()}`, canvas.width / 2, 165);

    // Student identity table
    ctx.lineWidth = 1.5;
    ctx.strokeRect(120, 230, canvas.width - 180, 90);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 50, 230);
    ctx.lineTo(canvas.width / 2 - 50, 320);
    ctx.moveTo(canvas.width - 280, 230);
    ctx.lineTo(canvas.width - 280, 320);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Adı Soyadı:', 140, 260);
    ctx.fillText('Sınıfı / Şubesi:', 140, 300);
    ctx.fillText('Öğrenci No:', canvas.width / 2 - 30, 260);
    ctx.fillText('Aldığı Puan:', canvas.width - 260, 260);

    // Student handwritten credentials (in blue ink)
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 24px "Segoe Script", "Caveat", "Comic Sans MS", cursive, sans-serif';
    ctx.fillText(config.studentName, 250, 260);
    ctx.fillText(config.className, 250, 300);
    ctx.fillText(config.studentNumber, canvas.width / 2 + 70, 260);

    // Teacher's Total Score in RED PEN in top box!
    const totalScore = config.scores.reduce((a, b) => a + b.score, 0);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 44px "Caveat", "Comic Sans MS", cursive, sans-serif';
    ctx.fillText(`${totalScore}`, canvas.width - 210, 300);
  } else {
    // Back page header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${config.studentName} (${config.studentNumber}) - ${config.className} - Sayfa 2 (Arka Yüz)`, canvas.width / 2, 80);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 100);
    ctx.lineTo(canvas.width - 60, 100);
    ctx.stroke();
  }

  // Questions
  let startY = config.side === 'front' ? 360 : 130;
  const questionsToShow = config.scores;

  questionsToShow.forEach((q, idx) => {
    const qY = startY + idx * 280;
    if (qY > canvas.height - 200) return;

    // Printed Question Text (Black/Dark slate)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Soru ${q.questionNumber})`, 130, qY);

    ctx.font = 'normal 18px sans-serif';
    let sampleQuestion = `Bir manav kilogramı 24 TL olan elmalardan 3.5 kg, kilogramı 40 TL olan muzlardan 2 kg satmıştır.`;
    if (q.questionNumber === 2) {
      sampleQuestion = `Bir kenar uzunluğu 16 cm olan karenin çevresi ile aynı çevreye sahip bir eşkenar üçgenin bir kenarı kaç cm'dir?`;
    } else if (q.questionNumber === 3) {
      sampleQuestion = `Aşağıdaki kesir işlemlerini yapınız: (3/4 + 1/2) : (5/8 - 1/4) = ?`;
    } else if (q.questionNumber === 4) {
      sampleQuestion = `Bir otomobil 450 km'lik yolu saatte 90 km hızla gitmiştir. Dönüşte hızını saatte 15 km artırırsa dönüş kaç saat sürer?`;
    } else if (q.questionNumber >= 5) {
      sampleQuestion = `Aşağıdaki cebirsel ifadelerin değerini x = 4 için hesaplayınız: 3x² - 5x + 12`;
    }

    ctx.fillText(sampleQuestion, 230, qY);

    // Max score printed badge
    ctx.font = 'italic 16px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`(${q.maxScore} Puan)`, canvas.width - 200, qY);

    // Student handwritten answer (blue pen)
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'italic 20px "Segoe Script", "Caveat", "Comic Sans MS", cursive, sans-serif';
    if (q.score === 0) {
      ctx.fillText('Çözüm: 16 x 16 = 256 cm² buldum. Üçgen = 256 / 3 (yanlış işlem)', 150, qY + 60);
    } else if (q.score === q.maxScore) {
      ctx.fillText('Çözüm: 3/4 + 2/4 = 5/4  |  5/8 - 2/8 = 3/8  |  (5/4) x (8/3) = 40/12 = 10/3', 150, qY + 60);
      ctx.fillText('Cevap: 10/3 = 3 tam 1/3', 150, qY + 95);
    } else {
      ctx.fillText('Çözüm: 24 x 3.5 = 84 TL elma. 40 x 2 = 80 TL muz. Toplam = 164 TL', 150, qY + 60);
    }

    // TEACHER'S RED PEN GRADING & SCORE (CRITICAL!)
    // Drawn prominently in bright teacher red with slight handwritten angle
    ctx.save();
    ctx.translate(canvas.width - 170, qY + 45);
    ctx.rotate(-0.06); // slight organic teacher tilt

    // Red pen circle or underline around score
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(35, 15, 45, 30, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Red score text
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 36px "Segoe Script", "Caveat", "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${q.score}`, 35, 27);

    // Red checkmark or cross near score
    if (q.score === q.maxScore) {
      // Red checkmark (✓)
      ctx.beginPath();
      ctx.lineWidth = 3.5;
      ctx.moveTo(-25, 20);
      ctx.lineTo(-15, 35);
      ctx.lineTo(0, -5);
      ctx.stroke();
    } else if (q.score === 0) {
      // Red cross (✗)
      ctx.beginPath();
      ctx.lineWidth = 3.5;
      ctx.moveTo(-20, 5);
      ctx.lineTo(-5, 25);
      ctx.moveTo(-5, 5);
      ctx.lineTo(-20, 25);
      ctx.stroke();
    } else {
      // Red note
      ctx.font = 'bold 18px "Caveat", cursive, sans-serif';
      ctx.fillText('kısmi puan', 35, 62);
    }

    ctx.restore();

    // Dotted separator line between questions
    ctx.strokeStyle = '#e2e8f0';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(120, qY + 150);
    ctx.lineTo(canvas.width - 60, qY + 150);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  return canvas.toDataURL('image/jpeg', 0.92);
}

// Pre-packaged ready sample exams
export function getSampleStudentExam(type: 'ihsan' | 'ayse' | 'mehmet' = 'ihsan', side: 'front' | 'back' = 'front') {
  if (type === 'ihsan') {
    if (side === 'front') {
      return generateSampleExamPaperDataUrl({
        studentName: 'İhsan Şahin',
        className: '6/F',
        studentNumber: '688',
        courseName: 'Matematik',
        term: '1. Dönem',
        examName: '2. Yazılı Yoklama',
        side: 'front',
        scores: [
          { questionNumber: 1, score: 5, maxScore: 15 },
          { questionNumber: 2, score: 0, maxScore: 15 },
          { questionNumber: 3, score: 20, maxScore: 20 },
          { questionNumber: 4, score: 10, maxScore: 10 },
        ],
      });
    } else {
      return generateSampleExamPaperDataUrl({
        studentName: 'İhsan Şahin',
        className: '6/F',
        studentNumber: '688',
        courseName: 'Matematik',
        term: '1. Dönem',
        examName: '2. Yazılı Yoklama',
        side: 'back',
        scores: [
          { questionNumber: 5, score: 8, maxScore: 10 },
          { questionNumber: 6, score: 7, maxScore: 10 },
          { questionNumber: 7, score: 6, maxScore: 10 },
          { questionNumber: 8, score: 8, maxScore: 10 },
        ],
      });
    }
  }

  if (type === 'ayse') {
    return generateSampleExamPaperDataUrl({
      studentName: 'Ayşe Yılmaz',
      className: '6/F',
      studentNumber: '681',
      courseName: 'Matematik',
      term: '1. Dönem',
      examName: '2. Yazılı Yoklama',
      side: 'front',
      scores: [
        { questionNumber: 1, score: 12, maxScore: 15 },
        { questionNumber: 2, score: 10, maxScore: 15 },
        { questionNumber: 3, score: 15, maxScore: 20 },
        { questionNumber: 4, score: 8, maxScore: 10 },
      ],
    });
  }

  return generateSampleExamPaperDataUrl({
    studentName: 'Mehmet Demir',
    className: '6/F',
    studentNumber: '682',
    courseName: 'Matematik',
    term: '1. Dönem',
    examName: '2. Yazılı Yoklama',
    side: 'front',
    scores: [
      { questionNumber: 1, score: 10, maxScore: 15 },
      { questionNumber: 2, score: 12, maxScore: 15 },
      { questionNumber: 3, score: 18, maxScore: 20 },
      { questionNumber: 4, score: 10, maxScore: 10 },
    ],
  });
}
