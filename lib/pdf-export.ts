import jsPDF from 'jspdf';

export interface FinancialPdfOptions {
  clientName: string;
  periodLabel: string;
  basis?: string;
  revenue: number;
  netIncome: number;
  cash: number;
  grossMargin?: number | null;
  netMargin?: number | null;
  currentRatio?: number | null;
  quickRatio?: number | null;
  dso?: number | null;
  filename?: string;
}

export function generateFinancialSummaryPdf(options: FinancialPdfOptions): void {
  const {
    clientName = 'Client',
    periodLabel = 'Last 3 Months',
    basis = 'Cash',
    revenue = 0,
    netIncome = 0,
    cash = 0,
    grossMargin,
    netMargin,
    currentRatio,
    quickRatio,
    dso,
    filename,
  } = options;

  // Standard A4 dimensions in points: 595.28 x 841.89 pt
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  let currentY = 55;

  // 1. BRAND LOGO ("PrimeCFO.ai")
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 118, 110); // Emerald/Teal #0f766e
  doc.text('Prime', marginX, currentY);

  const primeWidth = doc.getTextWidth('Prime');
  doc.setTextColor(15, 23, 42); // Slate-900 #0f172a
  doc.text('CFO.ai', marginX + primeWidth, currentY);

  currentY += 24;

  // 2. DOCUMENT TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  const displayClient = clientName || 'Organization';
  doc.text(`${displayClient} — Financial Summary`, marginX, currentY);

  currentY += 16;

  // 3. SUBTITLE / METADATA
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500 #64748b
  doc.text(`${periodLabel} · ${basis} basis · Generated ${dateFormatted}, ${timeFormatted}`, marginX, currentY);

  currentY += 18;

  // 4. HORIZONTAL DIVIDER
  doc.setDrawColor(226, 232, 240); // Slate-200 #e2e8f0
  doc.setLineWidth(1);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  currentY += 34;

  // 5. SECTION HEADER ("Key metrics")
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Key metrics', marginX, currentY);

  currentY += 16;

  // 6. METRIC CARDS GRID (2 rows x 4 columns)
  const contentWidth = pageWidth - marginX * 2;
  const colGap = 10;
  const rowGap = 12;
  const cardWidth = (contentWidth - 3 * colGap) / 4;
  const cardHeight = 52;

  const fmtCurrency = (n: number) => {
    if (n === 0) return '$0';
    if (n < 0) return `($${Math.abs(Math.round(n)).toLocaleString('en-US')})`;
    return `$${Math.round(n).toLocaleString('en-US')}`;
  };

  const fmtPercent = (val?: number | null) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    return `${val.toFixed(1)}%`;
  };

  const fmtRatio = (val?: number | null, suffix = '') => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    return `${val}${suffix}`;
  };

  const cardsData = [
    // Row 1
    { label: 'Revenue', value: fmtCurrency(revenue) },
    { label: 'Net income', value: fmtCurrency(netIncome) },
    { label: 'Cash', value: fmtCurrency(cash) },
    { label: 'Gross margin', value: grossMargin != null ? fmtPercent(grossMargin) : '—' },
    // Row 2
    { label: 'Net margin', value: netMargin != null ? fmtPercent(netMargin) : '—' },
    { label: 'Current ratio', value: currentRatio != null ? fmtRatio(currentRatio, 'x') : '—' },
    { label: 'Quick ratio', value: quickRatio != null ? fmtRatio(quickRatio, 'x') : '—' },
    { label: 'DSO', value: dso != null ? fmtRatio(dso, 'd') : '—' },
  ];

  for (let i = 0; i < cardsData.length; i++) {
    const colIndex = i % 4;
    const rowIndex = Math.floor(i / 4);

    const cardX = marginX + colIndex * (cardWidth + colGap);
    const cardY = currentY + rowIndex * (cardHeight + rowGap);

    // Card background box
    doc.setFillColor(248, 250, 252); // Slate-50 #f8fafc
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 5, 5, 'F');

    // Metric Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(cardsData[i].label, cardX + 10, cardY + 18);

    // Metric Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(cardsData[i].value, cardX + 10, cardY + 38);
  }

  // 7. FOOTER NOTE (bottom of page)
  const footerY = pageHeight - 35;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400 #94a3b8
  doc.text(
    'Numbers tie to synced QuickBooks reports. Prepared by PrimeCFO.ai for advisory use — not a formal audit opinion.',
    marginX,
    footerY
  );

  // 8. TRIGGER PDF DOWNLOAD
  const cleanFilename =
    filename ||
    `PrimeCFO-Financial-Summary-${displayClient.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;

  doc.save(cleanFilename);
}
