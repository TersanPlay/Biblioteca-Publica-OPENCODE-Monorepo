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

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function drawLine(doc: typeof PDFDocument, y: number) {
  doc.moveTo(50, y).lineTo(545, y).stroke();
}

export function generateLoanTermPDF(loan: LoanTermData, libraryName: string): typeof PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.fontSize(16).font('Helvetica-Bold').text(libraryName || 'BIBLIOTECA PÚBLICA', { align: 'center' });
  doc.moveDown(0.3);
  drawLine(doc, doc.y);
  doc.moveDown(0.5);
  doc.fontSize(14).text('TERMO DE EMPRÉSTIMO', { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(11).font('Helvetica-Bold').text(`Empréstimo nº: ${loan.number || `EMP-${String(loan.id).padStart(6, '0')}`}`);
  doc.font('Helvetica').text(`Data/Hora: ${formatDateTime(loan.createdAt)}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').text('LEITOR');
  doc.font('Helvetica').text(`Nome: ${loan.readerNameSnapshot || 'N/A'}`);
  doc.text(`Código: LTR-${String(loan.readerId).padStart(6, '0')}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').text('LIVRO');
  doc.font('Helvetica').text(`Título: ${loan.bookTitleSnapshot || 'N/A'}`);
  doc.text(`Autor: ${loan.bookAuthorSnapshot || 'N/A'}`);
  doc.text(`ISBN: ${loan.bookIsbnSnapshot || 'N/A'}`);
  doc.text(`Código/Tombo: #${loan.bookNumberSnapshot || String(loan.bookId)}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').text('DATA DO EMPRÉSTIMO');
  doc.font('Helvetica').text(`Data do empréstimo: ${formatDate(loan.loanDate)}`);
  doc.text(`Previsão de devolução: ${formatDate(loan.dueDate)}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').text(`Responsável: ${loan.createdByNameSnapshot || 'N/A'}`);
  doc.moveDown(2);

  doc.font('Helvetica').text('________________________________');
  doc.text('Assinatura do Leitor');
  doc.moveDown(2);
  doc.text('________________________________');
  doc.text('Responsável pelo atendimento');

  return doc;
}

export function generateReturnTermPDF(loan: LoanTermData, libraryName: string): typeof PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  const loanDays = loan.returnedAt
    ? Math.ceil((new Date(loan.returnedAt).getTime() - new Date(loan.loanDate).getTime()) / 86400000)
    : 0;
  const isOverdue = loan.returnedAt && new Date(loan.returnedAt) > new Date(loan.dueDate);
  const lateDays = isOverdue
    ? Math.ceil((new Date(loan.returnedAt!).getTime() - new Date(loan.dueDate).getTime()) / 86400000)
    : 0;

  doc.fontSize(16).font('Helvetica-Bold').text(libraryName || 'BIBLIOTECA PÚBLICA', { align: 'center' });
  doc.moveDown(0.3);
  drawLine(doc, doc.y);
  doc.moveDown(0.5);
  doc.fontSize(14).text('TERMO DE DEVOLUÇÃO', { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(11).font('Helvetica-Bold').text(`Empréstimo nº: ${loan.number || `EMP-${String(loan.id).padStart(6, '0')}`}`);
  doc.font('Helvetica').text(`Devolução nº: DEV-${String(loan.id).padStart(6, '0')}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').text('LEITOR');
  doc.font('Helvetica').text(`Nome: ${loan.readerNameSnapshot || 'N/A'}`);
  doc.text(`Código: LTR-${String(loan.readerId).padStart(6, '0')}`);
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').text('LIVRO');
  doc.font('Helvetica').text(`Título: ${loan.bookTitleSnapshot || 'N/A'}`);
  doc.text(`Autor: ${loan.bookAuthorSnapshot || 'N/A'}`);
  doc.text(`ISBN: ${loan.bookIsbnSnapshot || 'N/A'}`);
  doc.moveDown(1);

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
  doc.moveDown(1);

  doc.font('Helvetica-Bold').text(`Responsável pelo recebimento: ${loan.receivedByNameSnapshot || 'N/A'}`);
  doc.moveDown(2);

  doc.font('Helvetica').text('________________________________');
  doc.text('Assinatura do Leitor');
  doc.moveDown(2);
  doc.text('________________________________');
  doc.text('Responsável pelo recebimento');

  return doc;
}
