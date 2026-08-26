import PDFDocument from 'pdfkit';
import { createHash } from 'crypto';

interface LoanTermData {
  id: number;
  number: string | null;
  readerId: number;
  bookId: number;
  loanDate: Date;
  dueDate: Date;
  createdAt: Date;
  readerNameSnapshot: string | null;
  bookTitleSnapshot: string | null;
  bookAuthorSnapshot: string | null;
  bookIsbnSnapshot: string | null;
  bookNumberSnapshot: string | null;
  createdByNameSnapshot: string | null;
  returnedAt: Date | null;
  returnCondition: string | null;
  returnObservations: string | null;
  receivedByNameSnapshot: string | null;
}

interface LibrarySettings {
  libraryName: string;
  libraryAddress: string | null;
  libraryPhone: string | null;
  libraryEmail: string | null;
}

const COLORS = {
  primary: '#087F8C',
  primaryLight: '#E8F5F6',
  ink: '#1A1A1A',
  gray: '#6B7280',
  grayLight: '#E5E7EB',
  grayBg: '#F9FAFB',
  white: '#FFFFFF',
  black: '#18181B',
};

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function generateVerificationCode(prefix: string, id: number, date: Date): string {
  const raw = `${prefix}-${id}-${date.getTime()}`;
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 6).toUpperCase();
  return `${prefix}-${date.getFullYear()}-${String(id).padStart(6, '0')}-${hash}`;
}

function drawBookIcon(doc: typeof PDFDocument, x: number, y: number, size: number) {
  const s = size;
  const sx = s / 24;
  const sy = s / 24;

  doc.save();
  doc.fill(COLORS.primary).roundedRect(x, y, s, s, 3).fill();
  doc.strokeColor(COLORS.white).lineWidth(1.4).lineCap('round').lineJoin('round').fillColor('none');

  doc.moveTo(x + 12 * sx, y + 7 * sy).lineTo(x + 12 * sx, y + 21 * sy).stroke();

  doc.moveTo(x + 2 * sx, y + 4 * sy)
    .lineTo(x + 2 * sx, y + 17 * sy)
    .lineTo(x + 4 * sx, y + 19 * sy)
    .lineTo(x + 9 * sx, y + 21 * sy)
    .lineTo(x + 12 * sx, y + 7 * sy)
    .lineTo(x + 15 * sx, y + 21 * sy)
    .lineTo(x + 20 * sx, y + 19 * sy)
    .lineTo(x + 22 * sx, y + 17 * sy)
    .lineTo(x + 22 * sx, y + 4 * sy)
    .lineTo(x + 20 * sx, y + 3 * sy)
    .lineTo(x + 16 * sx, y + 3 * sy)
    .lineTo(x + 12 * sx, y + 7 * sy)
    .lineTo(x + 8 * sx, y + 3 * sy)
    .lineTo(x + 4 * sx, y + 3 * sy)
    .closePath()
    .stroke();

  doc.restore();
}

function drawHeader(doc: typeof PDFDocument, settings: LibrarySettings, _title: string): number {
  const name = settings.libraryName || 'Biblioteca Pública';

  drawBookIcon(doc, 50, 35, 32);

  doc.fontSize(13).font('Helvetica-Bold').fillColor(COLORS.ink).text(name, 90, 38, { width: 320 });

  doc.fontSize(7.5).font('Helvetica').fillColor(COLORS.gray);
  const contactParts: string[] = [];
  if (settings.libraryAddress) contactParts.push(settings.libraryAddress);
  if (settings.libraryPhone) contactParts.push(`Tel: ${settings.libraryPhone}`);
  if (settings.libraryEmail) contactParts.push(settings.libraryEmail);
  if (contactParts.length > 0) {
    doc.text(contactParts.join('  |  '), 90, doc.y + 1, { width: 400 });
  }

  const lineY = Math.max(doc.y + 6, 80);
  doc.save().moveTo(50, lineY).lineTo(545, lineY).lineWidth(1).strokeColor(COLORS.primary).stroke().restore();

  return lineY + 10;
}

function drawSection(doc: typeof PDFDocument, y: number, title: string, contentFn: (doc: typeof PDFDocument) => void): number {
  doc.save();
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.primary).text(title.toUpperCase(), 55, y + 8);
  doc.restore();

  const contentY = y + 22;
  doc.y = contentY;
  doc.x = 55;
  contentFn(doc);
  const contentEndY = doc.y + 8;

  doc.save()
    .lineWidth(0.5)
    .strokeColor(COLORS.grayLight)
    .roundedRect(50, y, 495, contentEndY - y, 4)
    .stroke()
    .restore();

  return contentEndY + 6;
}

function drawField(doc: typeof PDFDocument, label: string, value: string, x: number, y: number, w: number) {
  doc.save();
  doc.fontSize(7).font('Helvetica').fillColor(COLORS.gray).text(label, x, y, { width: w });
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.ink).text(value || '—', x, doc.y + 1, { width: w });
  doc.restore();
}

function drawFooter(doc: typeof PDFDocument, verificationCode: string, generatedAt: Date, loanNumber: string | null, recordedBy: string | null) {
  const footerY = 760;

  doc.save().moveTo(50, footerY).lineTo(545, footerY).lineWidth(0.5).strokeColor(COLORS.grayLight).stroke().restore();

  doc.save();
  doc.fontSize(7).font('Helvetica').fillColor(COLORS.gray);

  doc.text(`Código de verificação: ${verificationCode}`, 50, footerY + 6, { width: 300 });
  doc.text(`Documento gerado eletronicamente pelo Sistema de Gestão da Biblioteca.`, 50, footerY + 16, { width: 300 });

  const rightText = `Emitido em ${formatDateTime(generatedAt)}`;
  doc.text(rightText, 350, footerY + 6, { width: 195, align: 'right' });

  if (loanNumber) {
    doc.text(`Empréstimo: ${loanNumber}`, 350, footerY + 16, { width: 195, align: 'right' });
  }
  if (recordedBy) {
    doc.text(`Registrado por: ${recordedBy}`, 350, footerY + 26, { width: 195, align: 'right' });
  }

  doc.restore();
}

function drawPageNumber(doc: typeof PDFDocument, _currentPage: number, _totalPages: number) {
  doc.save();
  doc.fontSize(7).font('Helvetica').fillColor(COLORS.gray);
  doc.text(`Página 1 de 1`, 50, 790, { width: 495, align: 'center' });
  doc.restore();
}

export function generateLoanTermPDF(loan: LoanTermData, settings: LibrarySettings): typeof PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const termNumber = loan.number || `EMP-${String(loan.id).padStart(6, '0')}`;
  const verificationCode = generateVerificationCode('EMP', loan.id, loan.createdAt);

  const headerY = drawHeader(doc, settings, 'TERMO DE EMPRÉSTIMO');

  doc.y = headerY + 2;
  doc.x = 50;
  doc.fontSize(16).font('Helvetica-Bold').fillColor(COLORS.ink).text('TERMO DE EMPRÉSTIMO', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.primary).text(termNumber, { align: 'center' });
  doc.moveDown(0.5);

  let y = doc.y + 4;

  y = drawSection(doc, y, '1. Dados do Empréstimo', (doc) => {
    drawField(doc, 'Número do empréstimo:', termNumber, 60, doc.y, 200);
    drawField(doc, 'Data e hora:', formatDateTime(loan.createdAt), 280, doc.y - 14, 200);
    doc.y = doc.y + 10;
    drawField(doc, 'Previsão de devolução:', formatDate(loan.dueDate), 60, doc.y, 200);
  });

  y = drawSection(doc, y, '2. Dados do Leitor', (doc) => {
    drawField(doc, 'Nome completo:', loan.readerNameSnapshot || '—', 60, doc.y, 300);
    doc.y = doc.y + 10;
    drawField(doc, 'Código do leitor:', `LTR-${String(loan.readerId).padStart(6, '0')}`, 60, doc.y, 200);
  });

  y = drawSection(doc, y, '3. Dados do Material Bibliográfico', (doc) => {
    drawField(doc, 'Título:', loan.bookTitleSnapshot || '—', 60, doc.y, 300);
    doc.y = doc.y + 10;
    drawField(doc, 'Autor(es):', loan.bookAuthorSnapshot || '—', 60, doc.y, 300);
    doc.y = doc.y + 10;
    drawField(doc, 'ISBN:', loan.bookIsbnSnapshot || '—', 60, doc.y, 150);
    drawField(doc, 'Código/Tombo:', `#${loan.bookNumberSnapshot || String(loan.bookId)}`, 280, doc.y - 14, 150);
  });

  y = drawSection(doc, y, '4. Registro do Atendimento', (doc) => {
    drawField(doc, 'Servidor/Responsável:', loan.createdByNameSnapshot || '—', 60, doc.y, 300);
    doc.y = doc.y + 10;
    drawField(doc, 'Data do empréstimo:', formatDate(loan.loanDate), 60, doc.y, 200);
    doc.y = doc.y + 10;
    doc.save();
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.gray);
    doc.text('Declaro que o material acima foi recebido pelo leitor na data indicada, comprometendo-se à devolução no prazo estabelecido.', 60, doc.y, { width: 430, lineGap: 2 });
    doc.restore();
  });

  y = drawSection(doc, y, '5. Assinaturas', (doc) => {
    doc.save();
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.ink);

    doc.text('________________________________', 60, doc.y + 8);
    doc.fontSize(7).fillColor(COLORS.gray);
    doc.text('Assinatura do Leitor', 60, doc.y + 2);
    doc.text(loan.readerNameSnapshot || '—', 60, doc.y + 10);

    doc.fontSize(8).fillColor(COLORS.ink);
    doc.text('________________________________', 300, y + 18);
    doc.fontSize(7).fillColor(COLORS.gray);
    doc.text('Responsável pelo atendimento', 300, y + 32);
    doc.text(loan.createdByNameSnapshot || '—', 300, y + 42);

    doc.restore();
    doc.y = y + 58;
  });

  drawFooter(doc, verificationCode, loan.createdAt, termNumber, loan.createdByNameSnapshot);
  drawPageNumber(doc, 1, 1);

  return doc;
}

export function generateReturnTermPDF(loan: LoanTermData, settings: LibrarySettings): typeof PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

  const loanNumber = loan.number || `EMP-${String(loan.id).padStart(6, '0')}`;
  const returnNumber = `DEV-${String(loan.id).padStart(6, '0')}`;
  const verificationCode = generateVerificationCode('DEV', loan.id, loan.returnedAt || new Date());

  const loanDays = loan.returnedAt
    ? Math.ceil((new Date(loan.returnedAt).getTime() - new Date(loan.loanDate).getTime()) / 86400000)
    : 0;
  const isOverdue = loan.returnedAt && new Date(loan.returnedAt) > new Date(loan.dueDate);
  const lateDays = isOverdue
    ? Math.ceil((new Date(loan.returnedAt!).getTime() - new Date(loan.dueDate).getTime()) / 86400000)
    : 0;

  const returnStatus = isOverdue ? `DEVOLVIDO COM ATRASO (${lateDays} dia(s))` : 'DEVOLVIDO NO PRAZO';
  const returnStatusColor = isOverdue ? '#DC2626' : '#16A34A';

  const conditionMap: Record<string, string> = {
    'BOM': 'Bom estado',
    'REGULAR': 'Regular',
    'DANIFICADO': 'Danificado',
  };
  const conditionLabel = loan.returnCondition ? (conditionMap[loan.returnCondition] || loan.returnCondition) : 'Não informado';

  const headerY = drawHeader(doc, settings, 'TERMO DE DEVOLUÇÃO');

  doc.y = headerY + 2;
  doc.x = 50;
  doc.fontSize(16).font('Helvetica-Bold').fillColor(COLORS.ink).text('TERMO DE DEVOLUÇÃO', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.primary).text(returnNumber, { align: 'center' });
  doc.moveDown(0.5);

  let y = doc.y + 4;

  y = drawSection(doc, y, '1. Situação e Condição', (doc) => {
    doc.save();
    doc.fontSize(10).font('Helvetica-Bold').fillColor(returnStatusColor).text(returnStatus, 60, doc.y, { width: 430 });
    doc.restore();
    doc.y = doc.y + 10;
    drawField(doc, 'Condição do material:', conditionLabel, 60, doc.y, 300);
    if (loan.returnObservations) {
      doc.y = doc.y + 12;
      doc.save();
      doc.fontSize(7).font('Helvetica').fillColor(COLORS.gray).text('OCORRÊNCIAS:', 60, doc.y);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.ink).text(loan.returnObservations, 60, doc.y + 2, { width: 430, lineGap: 1 });
      doc.restore();
    }
  });

  y = drawSection(doc, y, '2. Dados do Empréstimo', (doc) => {
    const col1 = 60;
    const col2 = 215;
    const col3 = 370;
    const colW = 145;

    drawField(doc, 'Empréstimo:', loanNumber, col1, doc.y, colW);
    drawField(doc, 'Devolução:', returnNumber, col2, doc.y, colW);
    drawField(doc, 'Dias de empréstimo:', `${loanDays} dia(s)`, col3, doc.y, colW);

    doc.y = doc.y + 18;

    drawField(doc, 'Data do empréstimo:', formatDate(loan.loanDate), col1, doc.y, colW);
    drawField(doc, 'Previsão devolução:', formatDate(loan.dueDate), col2, doc.y, colW);
    drawField(doc, 'Devolução efetiva:', loan.returnedAt ? formatDateTime(loan.returnedAt) : '—', col3, doc.y, colW);
  });

  y = drawSection(doc, y, '3. Dados do Leitor', (doc) => {
    drawField(doc, 'Nome completo:', loan.readerNameSnapshot || '—', 60, doc.y, 300);
    doc.y = doc.y + 10;
    drawField(doc, 'Código do leitor:', `LTR-${String(loan.readerId).padStart(6, '0')}`, 60, doc.y, 200);
  });

  y = drawSection(doc, y, '4. Dados do Material Bibliográfico', (doc) => {
    drawField(doc, 'Título:', loan.bookTitleSnapshot || '—', 60, doc.y, 300);
    doc.y = doc.y + 10;
    drawField(doc, 'Autor(es):', loan.bookAuthorSnapshot || '—', 60, doc.y, 300);
    doc.y = doc.y + 10;
    drawField(doc, 'ISBN:', loan.bookIsbnSnapshot || '—', 60, doc.y, 150);
    drawField(doc, 'Código/Tombo:', `#${loan.bookNumberSnapshot || String(loan.bookId)}`, 280, doc.y - 14, 150);
  });

  y = drawSection(doc, y, '5. Registro da Devolução', (doc) => {
    doc.save();
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.ink);
    doc.text(
      'Declaro, para os devidos fins, que o material bibliográfico identificado neste documento foi recebido pela biblioteca na data e horário registrados neste termo, ficando encerrada a operação de empréstimo correspondente, ressalvadas eventuais pendências ou ocorrências expressamente registradas neste documento.',
      60, doc.y, { width: 430, lineGap: 2 }
    );
    doc.restore();
  });

  y = drawSection(doc, y, '6. Responsável pelo Recebimento', (doc) => {
    drawField(doc, 'Servidor/Responsável:', loan.receivedByNameSnapshot || '—', 60, doc.y, 300);
    doc.y = doc.y + 10;
    drawField(doc, 'Data e hora do registro:', loan.returnedAt ? formatDateTime(loan.returnedAt) : '—', 60, doc.y, 300);
  });

  y = drawSection(doc, y, '7. Assinaturas', (doc) => {
    doc.save();
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.ink);

    doc.text('________________________________', 60, doc.y + 8);
    doc.fontSize(7).fillColor(COLORS.gray);
    doc.text('Leitor / Responsável', 60, doc.y + 2);
    doc.text(loan.readerNameSnapshot || '—', 60, doc.y + 10);

    doc.fontSize(8).fillColor(COLORS.ink);
    doc.text('________________________________', 300, y + 18);
    doc.fontSize(7).fillColor(COLORS.gray);
    doc.text('Servidor responsável pelo recebimento', 300, y + 32);
    doc.text(loan.receivedByNameSnapshot || '—', 300, y + 42);

    doc.restore();
    doc.y = y + 58;
  });

  drawFooter(doc, verificationCode, loan.returnedAt || new Date(), loanNumber, loan.receivedByNameSnapshot);
  drawPageNumber(doc, 1, 1);

  return doc;
}
