import PDFDocument from 'pdfkit';

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

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function drawBookIcon(doc: typeof PDFDocument, x: number, y: number, size: number) {
  const s = size;
  doc.save();
  doc.fill('#087F8C').roundedRect(x, y, s, s, 3).fill();
  doc.fillColor('white').strokeColor('white').lineWidth(1.2);
  const cx = x + s / 2;
  const cy = y + s / 2;
  const bw = s * 0.42;
  const bh = s * 0.52;
  doc.roundedRect(cx - bw / 2, cy - bh / 2, bw, bh, 1).stroke();
  doc.moveTo(cx, cy - bh / 2 + 2).lineTo(cx, cy + bh / 2 - 2).lineWidth(0.8).stroke();
  doc.restore();
}

function drawHeader(doc: typeof PDFDocument, settings: LibrarySettings) {
  const name = settings.libraryName || 'Biblioteca Pública';
  drawBookIcon(doc, 50, 40, 36);
  doc.fontSize(15).font('Helvetica-Bold').fillColor('#1a1a1a').text(name, 90, 44, { width: 400 });
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  const contactParts: string[] = [];
  if (settings.libraryAddress) contactParts.push(settings.libraryAddress);
  if (settings.libraryPhone) contactParts.push(`Tel: ${settings.libraryPhone}`);
  if (settings.libraryEmail) contactParts.push(settings.libraryEmail);
  if (contactParts.length > 0) {
    doc.text(contactParts.join(' | '), 90, doc.y + 2, { width: 400 });
  }
  doc.fillColor('#1a1a1a');
  doc.moveTo(50, doc.y + 8).lineTo(545, doc.y + 8).lineWidth(0.5).stroke('#087F8C');
  return doc.y + 16;
}

export function generateLoanTermPDF(loan: LoanTermData, settings: LibrarySettings): typeof PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  const y0 = drawHeader(doc, settings);
  doc.y = y0 + 4;
  doc.x = 50;
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#087F8C').text('TERMO DE EMPRÉSTIMO', { align: 'center' });
  doc.fillColor('#1a1a1a');
  doc.moveDown(0.8);

  doc.fontSize(11).font('Helvetica-Bold').text(`Empréstimo nº: ${loan.number || `EMP-${String(loan.id).padStart(6, '0')}`}`);
  doc.font('Helvetica').text(`Data/Hora: ${formatDateTime(loan.createdAt)}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').text('LEITOR');
  doc.font('Helvetica').text(`Nome: ${loan.readerNameSnapshot || 'N/A'}`);
  doc.text(`Código: LTR-${String(loan.readerId).padStart(6, '0')}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').text('LIVRO');
  doc.font('Helvetica').text(`Título: ${loan.bookTitleSnapshot || 'N/A'}`);
  doc.text(`Autor: ${loan.bookAuthorSnapshot || 'N/A'}`);
  doc.text(`ISBN: ${loan.bookIsbnSnapshot || 'N/A'}`);
  doc.text(`Código/Tombo: #${loan.bookNumberSnapshot || String(loan.bookId)}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').text('DATA DO EMPRÉSTIMO');
  doc.font('Helvetica').text(`Data do empréstimo: ${formatDate(loan.loanDate)}`);
  doc.text(`Previsão de devolução: ${formatDate(loan.dueDate)}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').text(`Responsável: ${loan.createdByNameSnapshot || 'N/A'}`);
  doc.moveDown(2.5);

  doc.font('Helvetica').fillColor('#1a1a1a').text('________________________________');
  doc.text('Assinatura do Leitor');
  doc.moveDown(2.5);
  doc.text('________________________________');
  doc.text('Responsável pelo atendimento');

  return doc;
}

export function generateReturnTermPDF(loan: LoanTermData, settings: LibrarySettings): typeof PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  const loanDays = loan.returnedAt
    ? Math.ceil((new Date(loan.returnedAt).getTime() - new Date(loan.loanDate).getTime()) / 86400000)
    : 0;
  const isOverdue = loan.returnedAt && new Date(loan.returnedAt) > new Date(loan.dueDate);
  const lateDays = isOverdue
    ? Math.ceil((new Date(loan.returnedAt!).getTime() - new Date(loan.dueDate).getTime()) / 86400000)
    : 0;

  const y0 = drawHeader(doc, settings);
  doc.y = y0 + 4;
  doc.x = 50;
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#087F8C').text('TERMO DE DEVOLUÇÃO', { align: 'center' });
  doc.fillColor('#1a1a1a');
  doc.moveDown(0.8);

  doc.fontSize(11).font('Helvetica-Bold').text(`Empréstimo nº: ${loan.number || `EMP-${String(loan.id).padStart(6, '0')}`}`);
  doc.font('Helvetica').text(`Devolução nº: DEV-${String(loan.id).padStart(6, '0')}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').text('LEITOR');
  doc.font('Helvetica').text(`Nome: ${loan.readerNameSnapshot || 'N/A'}`);
  doc.text(`Código: LTR-${String(loan.readerId).padStart(6, '0')}`);
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').text('LIVRO');
  doc.font('Helvetica').text(`Título: ${loan.bookTitleSnapshot || 'N/A'}`);
  doc.text(`Autor: ${loan.bookAuthorSnapshot || 'N/A'}`);
  doc.text(`ISBN: ${loan.bookIsbnSnapshot || 'N/A'}`);
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').text('DATAS');
  doc.font('Helvetica').text(`Empréstimo: ${formatDate(loan.loanDate)}`);
  doc.text(`Previsão de devolução: ${formatDate(loan.dueDate)}`);
  doc.text(`Devolução efetiva: ${formatDate(loan.returnedAt!)}`);
  doc.text(`Dias de empréstimo: ${loanDays}`);
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').text('SITUAÇÃO');
  doc.font('Helvetica').text(isOverdue ? `Atrasado (${lateDays} dia(s))` : 'Devolvido dentro do prazo');
  doc.text(`Condição do livro: ${loan.returnCondition || 'Não informado'}`);
  if (loan.returnObservations) {
    doc.text(`Observações: ${loan.returnObservations}`);
  }
  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').text(`Responsável pelo recebimento: ${loan.receivedByNameSnapshot || 'N/A'}`);
  doc.moveDown(2.5);

  doc.font('Helvetica').fillColor('#1a1a1a').text('________________________________');
  doc.text('Assinatura do Leitor');
  doc.moveDown(2.5);
  doc.text('________________________________');
  doc.text('Responsável pelo recebimento');

  return doc;
}
