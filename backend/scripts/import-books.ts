import fs from 'fs';
import type { Prisma } from '@prisma/client';
import prisma from '../src/lib/prisma';

interface ImportRow {
  title: string;
  subtitle: string | null;
  authors: string[];
  publisher: string | null;
  publicationYear: number | null;
  edition: number | null;
  volume: string | null;
  isbn10: string | null;
  isbn13: string | null;
  pages: number | null;
  categories: string[];
  subjects: string[];
  knowledgeAreas: string[];
  language: string | null;
  cdd: string | null;
  cutter: string | null;
  physicalLocation: string | null;
  availableCopies: number | null;
  acquisitionType: string | null;
  archived: boolean;
}

function normalizeIsbn(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

function cleanNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

type NameMap = Map<string, number>;

async function resolveInto(
  tx: Prisma.TransactionClient,
  map: NameMap,
  model: 'author' | 'category' | 'knowledgeArea',
  names: string[],
): Promise<number[]> {
  const ids: number[] = [];
  const client = tx[model] as unknown as {
    create: (args: { data: { name: string } }) => Promise<{ id: number }>;
  };
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    let id = map.get(key);
    if (id === undefined) {
      const created = await client.create({ data: { name } });
      map.set(key, created.id);
      id = created.id;
    }
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

async function main() {
  const dataPath =
    process.argv[2] ?? 'C:\\Users\\Play\\AppData\\Local\\Temp\\opencode\\import-books.json';
  const rows: ImportRow[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Linhas lidas: ${rows.length}`);

  const [authors, categories, knowledgeAreas] = await Promise.all([
    prisma.author.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.knowledgeArea.findMany({ select: { id: true, name: true } }),
  ]);
  const authorMap: NameMap = new Map(authors.map((a) => [a.name.toLowerCase(), a.id]));
  const categoryMap: NameMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
  const knowledgeAreaMap: NameMap = new Map(knowledgeAreas.map((k) => [k.name.toLowerCase(), k.id]));

  const seen = new Set<string>();
  let imported = 0;
  let skippedSheetDup = 0;
  let skippedDbDup = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const n10 = row.isbn10 ? normalizeIsbn(row.isbn10) : null;
      const n13 = row.isbn13 ? normalizeIsbn(row.isbn13) : null;
      const keys = [n10, n13].filter((v): v is string => !!v);

      if (keys.some((k) => seen.has(k))) {
        skippedSheetDup++;
        continue;
      }

      if (keys.length > 0) {
        const duplicate = await tx.book.findFirst({
          where: { OR: [{ isbn10: { in: keys } }, { isbn13: { in: keys } }] },
          select: { id: true },
        });
        if (duplicate) {
          skippedDbDup++;
          continue;
        }
      }

      const book = await tx.book.create({
        data: {
          title: row.title,
          subtitle: cleanNull(row.subtitle),
          publisher: cleanNull(row.publisher),
          edition: row.edition,
          publicationYear: row.publicationYear,
          language: cleanNull(row.language),
          pages: row.pages,
          coverUrl: null,
          format: null,
          volume: cleanNull(row.volume),
          cdd: cleanNull(row.cdd),
          cutter: cleanNull(row.cutter),
          physicalLocation: cleanNull(row.physicalLocation),
          availableCopies: row.availableCopies,
          acquisitionType: row.acquisitionType,
          isArchived: row.archived,
          ...(n10 ? { isbn10: n10 } : {}),
          ...(n13 ? { isbn13: n13 } : {}),
        },
      });

      const authorIds = await resolveInto(tx, authorMap, 'author', row.authors);
      if (authorIds.length > 0) {
        await tx.bookAuthor.createMany({
          data: authorIds.map((authorId) => ({ bookId: book.id, authorId })),
        });
      }
      const categoryIds = await resolveInto(tx, categoryMap, 'category', row.categories);
      if (categoryIds.length > 0) {
        await tx.bookCategory.createMany({
          data: categoryIds.map((categoryId) => ({ bookId: book.id, categoryId })),
        });
      }
      const knowledgeAreaIds = await resolveInto(tx, knowledgeAreaMap, 'knowledgeArea', row.knowledgeAreas);
      if (knowledgeAreaIds.length > 0) {
        await tx.bookKnowledgeArea.createMany({
          data: knowledgeAreaIds.map((knowledgeAreaId) => ({ bookId: book.id, knowledgeAreaId })),
        });
      }

      for (const k of keys) seen.add(k);
      imported++;
    }
  }, { timeout: 900_000, maxWait: 30_000 });

  console.log(`Importados: ${imported}`);
  console.log(`Pulados (ISBN duplicado na planilha): ${skippedSheetDup}`);
  console.log(`Pulados (já existem no acervo): ${skippedDbDup}`);
}

main()
  .catch((err) => {
    console.error('Falha na importação:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
