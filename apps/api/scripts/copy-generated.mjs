// Copia o Prisma Client gerado (JS runtime) para dentro de dist/ após `tsc`,
// pois o `tsc` emite apenas arquivos compilados de .ts e não copia .js.
// Uso: node scripts/copy-generated.mjs (a partir de apps/api)
import { cpSync } from 'node:fs';

const src = new URL('../src/generated', import.meta.url);
const dest = new URL('../dist/src/generated', import.meta.url);
cpSync(src, dest, { recursive: true });
console.log('Prisma Client copiado para dist/src/generated');
