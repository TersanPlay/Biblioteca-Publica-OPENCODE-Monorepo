import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/async-handler';

export const knowledgeAreaRouter = Router();

knowledgeAreaRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.knowledgeArea.findMany({ orderBy: { name: 'asc' } });
    res.json({ items, total: items.length, page: 1, pageSize: items.length, totalPages: 1 });
  }),
);
