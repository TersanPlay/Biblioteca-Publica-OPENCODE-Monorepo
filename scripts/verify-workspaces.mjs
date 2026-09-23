// scripts/verify-workspaces.mjs
// Checagem rápida do monorepo: workspaces resolvem e contratos básicos existem.
// Uso: node scripts/verify-workspaces.mjs (a partir da raiz)
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const checks = [
  ['apps/api/package.json', 'app da API'],
  ['apps/web/package.json', 'app web'],
  ['packages/shared/package.json', 'pacote shared'],
  ['packages/shared/dist/index.js', 'build do shared (@library/shared)'],
  ['packages/shared/dist/index.d.ts', 'tipos do shared'],
  ['packages/ui/package.json', 'pacote ui'],
  ['packages/config/eslint.config.js', 'config eslint'],
  ['apps/api/prisma/schema.prisma', 'schema Prisma'],
  ['pnpm-workspace.yaml', 'workspaces pnpm'],
  ['tsconfig.base.json', 'tsconfig base'],
];

let failed = 0;
for (const [file, label] of checks) {
  const ok = existsSync(new URL(`../${file}`, import.meta.url));
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label} (${file})`);
  if (!ok) failed++;
}

for (const name of ['@library/shared', '@library/ui']) {
  try {
    require.resolve(name, { paths: [path.join(root, 'apps', 'web')] });
    console.log(`ok   resolve ${name} a partir de apps/web`);
  } catch {
    console.log(`FAIL resolve ${name} a partir de apps/web`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} verificação(ões) falharam.`);
  process.exit(1);
}
console.log('\nMonorepo íntegro.');
