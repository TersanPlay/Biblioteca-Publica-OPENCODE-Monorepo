# Módulos

## API — routers (`apps/api/src/modules/<dominio>/`)

| Módulo | Arquivo | Prefixo | Auth no módulo |
|---|---|---|---|
| Auth | `auth/auth.routes.ts` | `/api/auth` | login público; me/logout exigem auth |
| Users | `user/user.routes.ts` | `/api/users` | ADMIN (módulo inteiro) |
| Books | `book/book.routes.ts` | `/api/books` | leitura pública; escrita com auth |
| Authors | `author/author.routes.ts` | `/api/authors` | auth |
| Categories | `category/category.routes.ts` | `/api/categories` | leitura pública; escrita ADMIN |
| Readers | `reader/reader.routes.ts` | `/api/readers` | auth (DELETE: ADMIN) |
| Loans | `loan/loan.routes.ts` | `/api/loans` | auth |
| Reservations | `reservation/reservation.routes.ts` | `/api/reservations` | auth |
| Reports | `report/report.routes.ts` | `/api/reports` | ADMIN |
| Audit | `audit/audit.routes.ts` | `/api/audit` | ADMIN |
| Settings | `settings/settings.routes.ts` | `/api/settings` | GET público; PUT ADMIN |
| Dashboard | `dashboard/dashboard.routes.ts` | `/api/dashboard` | auth |
| Backup | `backup/backup.routes.ts` | `/api/backups` | ADMIN (módulo inteiro) |

### Helpers de domínio

- `loan/loan.routes.ts` — `assertBookEligible` (validação de livro para empréstimo, reutilizada no empréstimo individual e no lote), `ensureNumber` (gera `EMP-000123`), `buildLoanSnapshots` (snapshots de dados do leitor/livro/usuário no momento do empréstimo).
- `book/book.routes.ts` — `resolveAuthorNames`, `resolveCategoryNames` (find-or-create dentro da transação), `findDuplicateBook`/`duplicateConflict` (ISBN duplicado).
- `reader/reader.routes.ts` — `DELETE /:id` com anonimização LGPD (substitui dados pessoais, cancela reservas pendentes, bloqueia exclusão se houver empréstimos ativos).
- `lib/overdue.ts` — `refreshOverdue`, `expireReservations`, `computeDueDate`, `addDays`.
- `lib/settings.ts` — `getSettings()` (regras + dados institucionais; defaults estruturais sem dados de demonstração).
- `lib/cover.ts` — `resolveAmazonCover` (scrap da Amazon por ISBN), `isbn13To10`.
- `lib/audit.ts` — `writeAudit`.
- `backup/backup.routes.ts` — `createBackup` (VACUUM INTO), `rotateBackups` (mantém 5), `startBackupCrons` (18:30 e 23:45), download e upload via multer.

## Web — rotas (`apps/web/src/app/router/routes.tsx`)

### Públicas (layout `PublicLayout`, sem login)

| Rota | Página |
|---|---|
| `/` | Home |
| `/catalogo` | Catálogo de livros (busca, categoria, disponibilidade) |
| `/livros/:id` | Detalhe do livro público |
| `/arquitetura` | Arquitetura do sistema (visão geral, stack, estrutura, fluxo de dados) |

### Autenticadas (guarda `RequireAuth` + `AdminLayout`)

| Rota | Página | Guarda extra |
|---|---|---|
| `/admin` | Dashboard (métricas, empréstimos recentes, devoluções, atrasados, top livros) | — |
| `/admin/livros` | Lista de livros | — |
| `/admin/livros/novo` | Formulário de livro (com capa por ISBN, autores e categorias por vírgula) | — |
| `/admin/livros/:id/editar` | Formulário de livro (edição) | — |
| `/admin/emprestimos` | Lista de empréstimos | — |
| `/admin/emprestimos/novo` | Novo empréstimo (1 ou vários livros) | — |
| `/admin/devolucoes` | Devolução (busca rápida por número/leitor/livro) | — |
| `/admin/reservas` | Reservas (cancelar/atender) | — |
| `/admin/leitores` | Lista de leitores (criação/edição via dialog `ReaderFormDialog`) | — |
| `/admin/leitores/:id` | Detalhe do leitor (editar, bloquear/desbloquear, excluir, histórico) | — |
| `/admin/blocklist` | Lista de leitores bloqueados (busca, desbloqueio em lote) | — |
| `/admin/autores` | Autores | `RequireAdmin` |
| `/admin/categorias` | Categorias | `RequireAdmin` |
| `/admin/relatorios` | Relatórios (9 tipos + exportar CSV) | `RequireAdmin` |
| `/admin/usuarios` | Usuários do sistema | `RequireAdmin` |
| `/admin/configuracoes` | Configurações (limites + dados institucionais) | `RequireAdmin` |
| `/admin/auditoria` | Trilha de auditoria | `RequireAdmin` |
| `/admin/backup` | Backup & Restauração (download, upload, criar, restaurar, excluir) | `RequireAdmin` |

### Outras

| Rota | Página |
|---|---|
| `/login` | Login |
| `*` | 404 |

### Guardas (`apps/web/src/app/router/guards.tsx`)

- `RequireAuth` — redireciona a `/login` sem sessão; mostra spinner enquanto carrega.
- `RequireAdmin` — exige `role === 'ADMIN'`; redireciona atendente para `/admin`.

## Web — camadas (`apps/web/src/`)

### `services/api-client.ts`
Instância axios com `baseURL` = `VITE_API_URL || '/api'`; injeta token do `localStorage` (`livraria_token`) e, em resposta `401` (fora do login), limpa o token e emite `auth:unauthorized` para desconectar a sessão. (`services/axios.ts` reexporta este módulo por compatibilidade.)

### `features/<dominio>/`
Código real organizado por domínio: `api.ts` (clientes HTTP) + `pages/` (páginas). Domínios: `books`, `authors`, `categories`, `readers`, `loans`, `reservations`, `reports`, `users`, `audit`, `settings`, `dashboard`, `backups` — além de `auth/` (sessão), `hooks/` (`use-async-data`, `use-debounce`), `toast/` e `http.ts` (`Params` + `cleanPayload`).
- `features/api.ts` — barrel que reexporta todos os clientes: `booksApi`, `authorsApi`, `categoriesApi`, `readersApi` (inclui `block`, `unblock`, `unblockBatch`, `setStatus`, `remove`, `blocked`), `loansApi` (inclui `createBatch`), `reservationsApi`, `reportsApi`, `usersApi`, `auditApi`, `settingsApi`, `dashboardApi`, `backupsApi` (inclui `download`, `restoreUpload`). Payloads limpos (campos vazios removidos); livro converte `BookFormValues` → `{ authorIds, authorNames, categoryIds, categoryNames }`.
- `auth/auth-provider.tsx` — estado de sessão (login/logout, persistência do token).
- `hooks/use-async-data.ts` — hook genérico para carregamento de dados com loading/error/refetch.

### `components/`
- `layout/` — `admin-layout`, `public-layout`, `book-cover`, `catalog-book-card`.
- `ui/` — shims que reexportam `@library/ui`; o código real do Design System (botões, badges de status, dialogs com `ConfirmDialog`, selects, tabs, switch, skeleton, tabela, paginação) vive em `packages/ui/src/`.

### `pages/`
- `public/`, `auth/`, `not-found` — páginas públicas, login e 404.
- `admin/*` — shims que reexportam `features/<dominio>/pages/` (o router importa daqui e não mudou).
- Páginas em destaque: `readers/pages/reader-form-dialog.tsx` (dialog compartilhado de criação/edição de leitores), `readers/pages/reader-details.tsx` (histórico + botões de PDF via blob autenticado), `loans/pages/returns.tsx` (modal de devolução com condição BOM/REGULAR/DANIFICADO e observações), `readers/pages/blocklist.tsx` (busca e desbloqueio em lote).

### `types/api.ts`
Reexporta `@library/shared`. Os tipos canônicos (`Book`, `Loan`, `Reader`, `ReaderDetail`, `BlockedReader`, `Reservation`, `User`, `Category`, `Author`, `AuditLog`, `ReportResult`, `LibrarySettings`, `DashboardData`, `Backup`, `Paginated<T>` etc.) vivem em `packages/shared/src/` junto dos schemas Zod.

## Mapa no monorepo (apps/api, apps/web, packages)

- Backend por domínio: `apps/api/src/modules/<dominio>/<dominio>.routes.ts` (mesmas rotas e regras; imports ajustados para a nova profundidade).
- Centralização backend: `apps/api/src/config/env.ts` (env + JWT), `apps/api/src/infrastructure/` (prisma, http, pdf, covers, audit, loans, settings — reexportam `lib/`/`middleware/`).
- Contratos: `packages/shared` (schemas Zod + tipos + constantes); `apps/api/src/validation.ts` expõe `parse()` e reexporta o shared; frontend usa `@library/shared` (tipos, ISBN/CPF) e `features/<dominio>/api.ts`.
- Design System: `packages/ui` (Radix); `apps/web/src/components/ui/*` são shims de compatibilidade.
- Páginas admin: código real em `apps/web/src/features/<dominio>/pages/`; `apps/web/src/pages/admin/*` reexportam (o router não mudou).
- Prisma Client gerado em `apps/api/src/generated/prisma` (`output` explícito no schema; `pnpm build` copia o runtime para `dist/`).
