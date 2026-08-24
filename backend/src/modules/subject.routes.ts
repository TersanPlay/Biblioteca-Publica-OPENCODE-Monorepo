import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async-handler';

export const subjectRouter = Router();

subjectRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
    res.json({ items, total: items.length, page: 1, pageSize: items.length, totalPages: 1 });
  }),
);
