import * as XLSX from 'xlsx';
import { Exam, StudentResult } from '../types';

// Helper to sanitize filename
function getCleanFileName(exam: Exam, suffix: string): string {
  const base = `${exam.gradeClass}-${exam.section}_${exam.courseName}_${exam.examName}`
    .replace(/[^a-zA-Z0-9_\-ığüşöçİĞÜŞÖÇ]/g, '_')
    .replace(/_+/g, '_');
  return `${base}_${suffix}.xlsx`;
}

// Option A: Soru Bazında Puan Listesi (e-Okul Uyumlu)
export function exportQuestionScoresExcel(exam: Exam, results: StudentResult[]) {
  // Sort numerically
  const sorted = [...results].sort((a, b) => {
    return (parseInt(a.studentNumber.replace(/\D/g, ''), 10) || 0) - (parseInt(b.studentNumber.replace(/\D/g, ''), 10) || 0);
  });

  const headerRow1 = [
    'T.C. MİLLİ EĞİTİM BAKANLIĞI',
    '',
    `${exam.gradeClass}/${exam.section} Sınıfı ${exam.courseName} Dersi ${exam.term} ${exam.examName} Soru Bazlı Puan Çizelgesi`,
  ];
  const headerRow2 = [
    'Sınav Tarihi:',
    exam.examDate,
    `Toplam Soru: ${exam.questions.length}`,
    `Maksimum Puan: ${exam.totalMaxScore}`,
  ];

  // Column headers
  const colHeaders: string[] = ['Sıra', 'Sınıf', 'Okul No', 'Adı Soyadı'];
  exam.questions.forEach((q) => {
    colHeaders.push(`Soru ${q.questionNumber} (M:${q.maxScore})`);
  });
  colHeaders.push('Toplam Puan', "100'lük Not", 'Durum');

  const rows: any[][] = [
    headerRow1,
    headerRow2,
    [], // empty row
    colHeaders,
  ];

  sorted.forEach((student, index) => {
    const row: any[] = [
      index + 1,
      `${exam.gradeClass}/${exam.section}`,
      student.studentNumber,
      student.studentName,
    ];

    exam.questions.forEach((q) => {
      const match = student.scores.find((s) => s.questionNumber === q.questionNumber);
      row.push(match && match.score !== null ? match.score : '-');
    });

    row.push(student.totalScore);
    row.push(student.scaledGrade);
    row.push(student.hasMissingScores ? 'Eksik Puan Var' : 'Onaylandı');
    rows.push(row);
  });

  // Summary Row (Average per question)
  if (sorted.length > 0) {
    const avgRow: any[] = ['', '', '', 'SORU ORTALAMALARI'];
    exam.questions.forEach((q) => {
      const scores = sorted
        .map((s) => s.scores.find((sc) => sc.questionNumber === q.questionNumber)?.score)
        .filter((sc): sc is number => typeof sc === 'number');
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
      avgRow.push(avg);
    });

    const totalAvg = (sorted.reduce((a, b) => a + b.totalScore, 0) / sorted.length).toFixed(1);
    const scaledAvg = (sorted.reduce((a, b) => a + b.scaledGrade, 0) / sorted.length).toFixed(1);
    avgRow.push(totalAvg, scaledAvg, `${sorted.length} Öğrenci`);
    rows.push([]);
    rows.push(avgRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  const cols = [
    { wch: 6 },  // Sıra
    { wch: 8 },  // Sınıf
    { wch: 10 }, // Okul No
    { wch: 22 }, // Ad Soyad
  ];
  exam.questions.forEach(() => cols.push({ wch: 14 }));
  cols.push({ wch: 14 }, { wch: 12 }, { wch: 16 });
  ws['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Soru Bazlı Puanlar');

  const filename = getCleanFileName(exam, 'Soru_Bazli_Puanlar');
  XLSX.writeFile(wb, filename);
}

// Option B: Toplam Puan Listesi (Özet Not Çizelgesi)
export function exportTotalScoresSummary(exam: Exam, results: StudentResult[]) {
  const sorted = [...results].sort((a, b) => {
    return (parseInt(a.studentNumber.replace(/\D/g, ''), 10) || 0) - (parseInt(b.studentNumber.replace(/\D/g, ''), 10) || 0);
  });

  const rows: any[][] = [
    [`${exam.gradeClass}/${exam.section} Sınıfı - ${exam.courseName} - ${exam.examName}`],
    [`Tarih: ${exam.examDate} | Toplam Öğrenci: ${sorted.length}`],
    [],
    ['Sıra', 'Sınıf/Şube', 'Okul No', 'Adı Soyadı', 'Yazılı Notu (Toplam)', "100'lük Not"],
  ];

  sorted.forEach((student, idx) => {
    rows.push([
      idx + 1,
      `${exam.gradeClass}/${exam.section}`,
      student.studentNumber,
      student.studentName,
      student.totalScore,
      student.scaledGrade,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 12 },
    { wch: 26 },
    { wch: 20 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Toplam Notlar');
  const filename = getCleanFileName(exam, 'Ozet_Not_Listesi');
  XLSX.writeFile(wb, filename);
}

// Option C: Bütün Verilerin Bulunduğu Ayrıntılı Excel (Kapsamlı Rapor + İstatistikler)
export function exportFullDetailedExcel(exam: Exam, results: StudentResult[]) {
  const sorted = [...results].sort((a, b) => {
    return (parseInt(a.studentNumber.replace(/\D/g, ''), 10) || 0) - (parseInt(b.studentNumber.replace(/\D/g, ''), 10) || 0);
  });

  const wb = XLSX.utils.book_new();

  // Sheet 1: Ana Liste
  const sheet1Rows: any[][] = [
    ['YAZILIMATİK - KAPSAMLI SINAV DEĞERLENDİRME RAPORU'],
    ['Ders:', exam.courseName, 'Sınıf/Şube:', `${exam.gradeClass}/${exam.section}`],
    ['Sınav:', exam.examName, 'Dönem:', exam.term],
    ['Sınav Tarihi:', exam.examDate, 'Maks. Puan:', exam.totalMaxScore],
    [],
    ['No', 'Sınıf', 'Öğrenci No', 'Adı Soyadı', ...exam.questions.map((q) => `S${q.questionNumber} (/${q.maxScore})`), 'Toplam Puan', "100'lük Not", 'Tarama Zamanı'],
  ];

  sorted.forEach((st, idx) => {
    const scores = exam.questions.map((q) => {
      const match = st.scores.find((s) => s.questionNumber === q.questionNumber);
      return match && match.score !== null ? match.score : '-';
    });
    sheet1Rows.push([
      idx + 1,
      st.className || `${exam.gradeClass}/${exam.section}`,
      st.studentNumber,
      st.studentName,
      ...scores,
      st.totalScore,
      st.scaledGrade,
      st.scannedAt ? new Date(st.scannedAt).toLocaleDateString('tr-TR') : '-',
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Öğrenci Puanları');

  // Sheet 2: Soru Analizi & İstatistikler
  const statsRows: any[][] = [
    ['SORU VE BAŞARI ANALİZİ'],
    [],
    ['Soru No', 'Maksimum Puan', 'Soru Ortalaması', 'Başarı Yüzdesi (%)', 'En Yüksek Alınan', 'En Düşük Alınan', 'Tam Puan Alan Öğrenci'],
  ];

  exam.questions.forEach((q) => {
    const scList = sorted
      .map((s) => s.scores.find((sc) => sc.questionNumber === q.questionNumber)?.score)
      .filter((s): s is number => typeof s === 'number');

    const count = scList.length || 1;
    const sum = scList.reduce((a, b) => a + b, 0);
    const avg = scList.length ? (sum / count).toFixed(1) : '0';
    const maxTaken = scList.length ? Math.max(...scList) : 0;
    const minTaken = scList.length ? Math.min(...scList) : 0;
    const perfectCount = scList.filter((s) => s >= q.maxScore).length;
    const successRate = q.maxScore > 0 ? ((Number(avg) / q.maxScore) * 100).toFixed(1) : '0';

    statsRows.push([
      `Soru ${q.questionNumber}`,
      q.maxScore,
      Number(avg),
      `%${successRate}`,
      maxTaken,
      minTaken,
      perfectCount,
    ]);
  });

  statsRows.push([]);
  statsRows.push(['GENEL SINAV İSTATİSTİKLERİ']);
  const allGrades = sorted.map((s) => s.scaledGrade);
  const examAvg = allGrades.length ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(1) : '0';
  const highestGrade = allGrades.length ? Math.max(...allGrades) : 0;
  const lowestGrade = allGrades.length ? Math.min(...allGrades) : 0;
  const passCount = allGrades.filter((g) => g >= 50).length;

  statsRows.push(['Toplam Öğrenci Sayısı:', sorted.length]);
  statsRows.push(['Sınıf Not Ortalaması:', Number(examAvg)]);
  statsRows.push(['En Yüksek Not:', highestGrade]);
  statsRows.push(['En Düşük Not:', lowestGrade]);
  statsRows.push(['50 ve Üzeri Alan Öğrenci Sayısı:', passCount]);
  statsRows.push(['Genel Başarı Oranı:', sorted.length ? `%${((passCount / sorted.length) * 100).toFixed(1)}` : '%0']);

  const ws2 = XLSX.utils.aoa_to_sheet(statsRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Soru ve Sınav Analizi');

  const filename = getCleanFileName(exam, 'Ayrintili_Rapor');
  XLSX.writeFile(wb, filename);
}

// Option D: Seçilen Sınıfın Boş Değerlendirme Şablonu
export function exportBlankClassTemplate(exam: Exam, results: StudentResult[]) {
  const sorted = [...results].sort((a, b) => {
    return (parseInt(a.studentNumber.replace(/\D/g, ''), 10) || 0) - (parseInt(b.studentNumber.replace(/\D/g, ''), 10) || 0);
  });

  const rows: any[][] = [
    [`${exam.gradeClass}/${exam.section} SINIFI - ${exam.courseName} BOŞ PUAN ÇİZELGESİ`],
    ['Öğretmen: ........................................ Tarih: ' + exam.examDate],
    [],
    ['Sıra', 'Okul No', 'Adı Soyadı', ...exam.questions.map((q) => `S${q.questionNumber} (/${q.maxScore})`), 'Toplam'],
  ];

  if (sorted.length > 0) {
    sorted.forEach((st, idx) => {
      rows.push([
        idx + 1,
        st.studentNumber,
        st.studentName,
        ...exam.questions.map(() => ''),
        '',
      ]);
    });
  } else {
    // 25 empty rows as template
    for (let i = 1; i <= 25; i++) {
      rows.push([i, '', '', ...exam.questions.map(() => ''), '']);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Boş Şablon');
  const filename = getCleanFileName(exam, 'Sinif_Bos_Sablon');
  XLSX.writeFile(wb, filename);
}
