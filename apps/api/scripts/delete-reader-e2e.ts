import 'dotenv/config';
import { createServer } from 'http';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';
import { app } from '../src/app';
import type { Server } from 'http';

let passed = 0;
let failed = 0;
function ok(label: string) {
  passed++;
  console.log(`  PASS  ${label}`);
}
function fail(label: string, detail?: unknown) {
  failed++;
  console.log(`  FAIL  ${label}${detail !== undefined ? ` — ${JSON.stringify(detail).slice(0, 300)}` : ''}`);
}
function assert(cond: boolean, label: string, detail?: unknown) {
  if (cond) ok(label);
  else fail(label, detail);
}

function randomValidCpf(): string {
  const base = String(Math.floor(100000000 + Math.random() * 899999999));
  const digits = base.split('').map(Number);
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += digits[i] * (t + 1 - i);
    const rest = ((sum * 10) % 11) % 10;
    if (digits.length <= t) digits.push(rest);
    else digits[t] = rest;
  }
  return digits.join('');
}

let server: Server | null = null;
let base = '';
let token = '';

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}

async function main() {
  server = createServer(app);
  await new Promise<void>((resolve) => server!.listen(0, resolve));
  const addr = server.address();
  if (typeof addr !== 'object' || !addr) throw new Error('no address');
  base = `http://127.0.0.1:${addr.port}`;

  const adminEmail = `admin-e2e-${Date.now()}@test.local`;
  const admin = await prisma.user.create({
    data: {
      name: 'Admin E2E',
      email: adminEmail,
      passwordHash: bcrypt.hashSync('SenhaE2E1', 10),
      role: 'ADMIN',
    },
  });
  const login = await api('POST', '/auth/login', { email: adminEmail, password: 'SenhaE2E1' });
  assert(login.status === 200 && !!login.json?.token, 'Login admin');
  if (login.status !== 200) throw new Error('login falhou');
  token = login.json.token;

  const stamp = Date.now();
  const cpf = randomValidCpf();
  const created = await api('POST', '/readers', {
    name: 'João Teste Exclusão',
    cpf,
    email: `joao.delete.${stamp}@test.local`,
  });
  assert(created.status === 201, 'Cadastrar leitor João', created);
  const readerId = created.json.id as number;

  const author = await prisma.author.create({ data: { name: `AUTOR-TESTE-${stamp}` } });
  const book = await prisma.book.create({
    data: { title: `LIVRO-TESTE-${stamp}`, authors: { create: [{ authorId: author.id }] } },
  });

  let allLoansOk = true;
  for (let i = 0; i < 5; i++) {
    const l = await api('POST', '/loans', { readerId, bookId: book.id });
    if (l.status !== 201) {
      allLoansOk = false;
      fail(`Empréstimo ${i + 1}`, l);
      break;
    }
    const ret = await api('POST', `/loans/${l.json.id}/return`, {});
    if (ret.status !== 200) {
      allLoansOk = false;
      fail(`Devolução ${i + 1}`, ret);
      break;
    }
  }
  if (allLoansOk) ok('5 empréstimos criados e devolvidos');

  const activeLoan = await api('POST', '/loans', { readerId, bookId: book.id });
  if (activeLoan.status === 201) {
    const delBlocked = await api('DELETE', `/readers/${readerId}`, {});
    assert(delBlocked.status === 409, 'Exclusão bloqueada com empréstimo ativo (409)', delBlocked);
    await api('POST', `/loans/${activeLoan.json.id}/return`, {});
  } else {
    fail('Preparar empréstimo ativo para teste de bloqueio', activeLoan);
  }

  const resv = await api('POST', '/reservations', { readerId, bookId: book.id });
  assert(resv.status === 201, 'Reserva criada', resv);

  const del = await api('DELETE', `/readers/${readerId}`, { reason: 'teste aceito' });
  assert(del.status === 200, 'Admin exclui leitor (sem pendências)', del);

  const list = await api('GET', `/readers?search=${encodeURIComponent(cpf)}`);
  assert(list.status === 200 && list.json.items.length === 0, 'Leitor não aparece na listagem');

  const loanAgain = await api('POST', '/loans', { readerId, bookId: book.id });
  assert(loanAgain.status === 400, 'Novo empréstimo negado para excluído');

  const resvAgain = await api('POST', '/reservations', { readerId, bookId: book.id });
  assert(resvAgain.status === 400, 'Nova reserva negada para excluído');

  const delAgain = await api('DELETE', `/readers/${readerId}`, {});
  assert(delAgain.status === 409, 'Reexclusão negada (409)');

  const history = await api('GET', `/loans?readerId=${readerId}&pageSize=50`);
  const histCount = history.json?.items?.length ?? 0;
  assert(history.status === 200 && histCount >= 6, `Histórico preservado (${histCount} empréstimos)`);

  const dbReader = await prisma.reader.findUnique({ where: { id: readerId } });
  assert(
    !!dbReader &&
      dbReader!.deletedAt !== null &&
      dbReader!.name === 'Leitor excluído' &&
      dbReader!.cpf.startsWith('EXCLUIDO-') &&
      dbReader!.email === null,
    'Cadastro anonimizado no banco (LGPD)',
  );

  const cancelledResv = await prisma.reservation.count({ where: { readerId, status: 'CANCELLED' } });
  assert(cancelledResv >= 1, 'Reserva ativa cancelada pela exclusão');

  const audit = await prisma.auditLog.findFirst({
    where: { action: 'READER_DELETED', entityId: String(readerId) },
  });
  assert(
    !!audit && !!audit!.metadata && audit!.metadata.includes('LTR-') && audit!.metadata.includes('teste aceito'),
    'Auditoria READER_DELETED com referência e motivo',
  );

  const report = await api('GET', `/reports?type=loans-period`);
  const rowsHasHistory =
    report.json?.rows?.some((r: unknown[]) => r.includes(`LIVRO-TESTE-${stamp}`)) ?? false;
  assert(report.status === 200 && rowsHasHistory, 'Relatório histórico mantém os registros');

  // Limpeza best-effort dos fixtures TEST
  const loans = await prisma.loan.findMany({ where: { readerId }, select: { id: true } });
  await prisma.loan.deleteMany({ where: { id: { in: loans.map((l) => l.id) } } });
  await prisma.reservation.deleteMany({ where: { readerId } });
  await prisma.reader.delete({ where: { id: readerId } }).catch(() => undefined);
  await prisma.bookAuthor.deleteMany({ where: { bookId: book.id } });
  await prisma.book.delete({ where: { id: book.id } }).catch(() => undefined);
  await prisma.author.delete({ where: { id: author.id } }).catch(() => undefined);
  await prisma.auditLog.deleteMany({ where: { entityId: String(readerId), entity: 'Reader' } });
  await prisma.user.delete({ where: { id: admin.id } }).catch(() => undefined);
  console.log('  LIMP  fixtures TEST removidos');
}

main()
  .catch((err) => {
    fail('Erro fatal', err instanceof Error ? err.message : err);
  })
  .finally(async () => {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    await prisma.$disconnect();
    console.log(`\n${passed} passaram, ${failed} falharam`);
    process.exit(failed > 0 ? 1 : 0);
  });
