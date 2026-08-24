import { Router } from 'express';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/auth';
import { writeAudit } from '../lib/audit';
import { cleanNull, dateOrNull, parse, paginationSchema, readerQuerySchema, readerSchema, readerStatusSchema, readerUpdateSchema } from '../validation';
import { refreshOverdue } from '../lib/overdue';

export const readerRouter = Router();

readerRouter.use(requireAuth);

function mapReader(r: any, activeLoans = 0) {
  return { ...r, activeLoans };
}

readerRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parse(readerQuerySchema, req.query);
    const where = {
      ...(q.search
        ? { OR: [{ name: { contains: q.search } }, { cpf: { contains: q.search } }, { email: { contains: q.search } }] }
        : {}),
      ...(q.status !== 'ALL' ? { status: q.status } : {}),
    };
    const total = await prisma.reader.count({ where });
    const items = await prisma.reader.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    });
    const ids = items.map((i) => i.id);
    const activeByReader: Record<number, number> = {};
    if (ids.length > 0) {
      const rows = await prisma.loan.groupBy({
        by: ['readerId'],
        where: { readerId: { in: ids }, status: { in: ['ACTIVE', 'OVERDUE'] } },
        _count: { _all: true },
      });
      for (const row of rows) activeByReader[row.readerId] = row._count._all;
    }
    res.json({
      items: items.map((i) => mapReader(i, activeByReader[i.id] ?? 0)),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    });
  }),
);

readerRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = parse(readerSchema, req.body);
    const clash = await prisma.reader.findUnique({ where: { cpf: data.cpf } });
    if (clash) throw new HttpError(409, 'CPF já cadastrado');
    if (data.email) {
      const emailClash = await prisma.reader.findFirst({ where: { email: data.email } });
      if (emailClash) throw new HttpError(409, 'E-mail já cadastrado');
    }
    const reader = await prisma.reader.create({
      data: {
        name: data.name,
        cpf: data.cpf,
        birthDate: dateOrNull(data.birthDate) ?? null,
        phone: cleanNull(data.phone),
        email: cleanNull(data.email),
        cep: cleanNull(data.cep),
        address: cleanNull(data.address),
        number: cleanNull(data.number),
        neighborhood: cleanNull(data.neighborhood),
        city: cleanNull(data.city),
        state: cleanNull(data.state),
      },
    });
    await writeAudit(req.user?.id, 'READER_CREATED', 'Reader', reader.id, { name: reader.name }, req.ip);
    res.status(201).json(reader);
  }),
);

readerRouter.get(
  '/blocked',
  asyncHandler(async (req, res) => {
    const q = parse(paginationSchema, req.query);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const where = {
      status: 'BLOCKED' as const,
      ...(search
        ? { OR: [{ name: { contains: search } }, { cpf: { contains: search } }] }
        : {}),
    };
    const total = await prisma.reader.count({ where });
    const items = await prisma.reader.findMany({
      where,
      orderBy: { blockedAt: 'desc' },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    });
    const ids = items.map((i) => i.id);
    const activeByReader: Record<number, number> = {};
    if (ids.length > 0) {
      const rows = await prisma.loan.groupBy({
        by: ['readerId'],
        where: { readerId: { in: ids }, status: { in: ['ACTIVE', 'OVERDUE'] } },
        _count: { _all: true },
      });
      for (const row of rows) activeByReader[row.readerId] = row._count._all;
    }
    const blockedByNameMap: Record<number, string> = {};
    const userIds = items.filter((i) => i.blockedBy).map((i) => i.blockedBy!);
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: [...new Set(userIds)] } },
        select: { id: true, name: true },
      });
      for (const u of users) blockedByNameMap[u.id] = u.name;
    }
    res.json({
      items: items.map((r) => ({
        ...r,
        activeLoans: activeByReader[r.id] ?? 0,
        blockedByName: r.blockedBy ? blockedByNameMap[r.blockedBy] ?? null : null,
      })),
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    });
  }),
);

readerRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const reader = await prisma.reader.findUnique({ where: { id } });
    if (!reader) throw new HttpError(404, 'Leitor não encontrado');
    await refreshOverdue(id);
    const [loans, reservations] = await Promise.all([
      prisma.loan.findMany({
        where: { readerId: id },
        include: { book: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.reservation.findMany({
        where: { readerId: id },
        include: { book: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    const activeLoans = loans.filter((l) => l.status !== 'RETURNED');
    const overdueCount = loans.filter((l) => l.status === 'OVERDUE').length;
    res.json({ reader, loans, activeLoans, overdueCount, reservations });
  }),
);

readerRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = parse(readerUpdateSchema, req.body);
    const existing = await prisma.reader.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Leitor não encontrado');
    if (data.cpf && data.cpf !== existing.cpf) {
      const clash = await prisma.reader.findUnique({ where: { cpf: data.cpf } });
      if (clash) throw new HttpError(409, 'CPF já cadastrado');
    }
    if (data.email && data.email !== existing.email) {
      const emailClash = await prisma.reader.findFirst({ where: { email: data.email, NOT: { id } } });
      if (emailClash) throw new HttpError(409, 'E-mail já cadastrado');
    }
    const reader = await prisma.reader.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        cpf: data.cpf ?? existing.cpf,
        birthDate: data.birthDate !== undefined ? (dateOrNull(data.birthDate) ?? null) : existing.birthDate,
        phone: data.phone !== undefined ? cleanNull(data.phone) : existing.phone,
        email: data.email !== undefined ? cleanNull(data.email) : existing.email,
        cep: data.cep !== undefined ? cleanNull(data.cep) : existing.cep,
        address: data.address !== undefined ? cleanNull(data.address) : existing.address,
        number: data.number !== undefined ? cleanNull(data.number) : existing.number,
        neighborhood: data.neighborhood !== undefined ? cleanNull(data.neighborhood) : existing.neighborhood,
        city: data.city !== undefined ? cleanNull(data.city) : existing.city,
        state: data.state !== undefined ? cleanNull(data.state) : existing.state,
      },
    });
    await writeAudit(req.user?.id, 'READER_UPDATED', 'Reader', id, { name: reader.name }, req.ip);
    res.json(reader);
  }),
);

readerRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { status, reason, category } = parse(readerStatusSchema, req.body);
    const existing = await prisma.reader.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Leitor não encontrado');
    const data: Record<string, unknown> = { status };
    if (status === 'BLOCKED') {
      data.blockReason = reason ?? null;
      data.blockCategory = category ?? null;
      data.blockedAt = new Date();
      data.blockedBy = req.user!.id;
    } else if (status === 'ACTIVE') {
      data.blockReason = null;
      data.blockCategory = null;
      data.blockedAt = null;
      data.blockedBy = null;
    }
    const reader = await prisma.reader.update({ where: { id }, data });
    await writeAudit(req.user?.id, 'READER_STATUS_CHANGED', 'Reader', id, {
      status,
      reason: reason ?? null,
      category: category ?? null,
    }, req.ip);
    res.json(reader);
  }),
);