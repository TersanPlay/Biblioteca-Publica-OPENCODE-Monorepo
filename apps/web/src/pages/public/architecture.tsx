import type { ReactNode } from 'react';
import {
  Atom,
  Boxes,
  ClipboardList,
  Clock,
  Cpu,
  Database,
  FileCheck,
  FileText,
  Gauge,
  Globe,
  Layers,
  Palette,
  PenLine,
  Route,
  Send,
  Server,
  ShieldCheck,
  Upload,
  Wrench,
  Zap,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';

const SECTIONS = [
  { id: 'visao-geral', label: 'Visão geral' },
  { id: 'stack', label: 'Stack' },
];

const BACKEND_STACK = [
  ['Runtime', 'Node.js + TypeScript (tsx watch)', Cpu, 'text-sky-600'],
  ['HTTP', 'Express 4', Globe, 'text-emerald-600'],
  ['ORM', 'Prisma 5 (@prisma/client)', Database, 'text-indigo-500'],
  ['Banco', 'SQLite (apps/api/prisma/dev.db)', Server, 'text-orange-500'],
  ['Validação', 'Zod 3 (packages/shared + src/validation.ts)', FileCheck, 'text-rose-500'],
  ['Autenticação', 'JWT (jsonwebtoken) + bcryptjs', ShieldCheck, 'text-green-600'],
  ['PDF', 'pdfkit (termos + assinaturas)', FileText, 'text-red-500'],
  ['Upload', 'multer (restauração de backup)', Upload, 'text-violet-500'],
  ['Rate limit', 'express-rate-limit', Gauge, 'text-amber-500'],
  ['Cron', 'node-cron (backups automáticos)', Clock, 'text-stone-500'],
] as const;

const FRONTEND_STACK = [
  ['Framework', 'React 18 + TypeScript', Atom, 'text-cyan-600'],
  ['Build', 'Vite 5 (proxy /api → 3333)', Zap, 'text-yellow-500'],
  ['Estilo', 'Tailwind CSS 3 + Radix UI + Lucide', Palette, 'text-fuchsia-500'],
  ['Formulários', 'React Hook Form + Zod resolvers', ClipboardList, 'text-lime-600'],
  ['Rotas', 'React Router 6', Route, 'text-pink-500'],
  ['HTTP', 'Axios (api-client + interceptor JWT)', Send, 'text-blue-600'],
  ['Assinatura', 'signature_pad (mouse, touch, caneta)', PenLine, 'text-teal-600'],
  ['Utilidades', 'clsx + tailwind-merge', Wrench, 'text-purple-500'],
] as const;

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: typeof Layers;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
          <Icon className="size-[18px]" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card bg-surface p-5 shadow-card hairline">{children}</div>
  );
}

function LayerBox({
  title,
  sub,
  primary,
}: {
  title: string;
  sub: string;
  primary?: boolean;
}) {
  return (
    <div
      className={`flex min-h-28 flex-col justify-center rounded-card p-4 text-center shadow-card ${
        primary ? 'bg-primary text-white' : 'bg-surface text-ink hairline'
      }`}
    >
      <span className="text-[14px] font-extrabold leading-tight">{title}</span>
      <span className={`mt-1 text-[12px] ${primary ? 'text-white/80' : 'text-muted'}`}>{sub}</span>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 md:flex-col md:justify-center md:gap-1.5 md:py-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className="flex items-center gap-1 md:hidden" aria-hidden="true">
        <svg viewBox="0 0 10 34" className="h-8 w-2.5" fill="none">
          <line x1="3" y1="1" x2="3" y2="33" stroke="#087F8C" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" className="anim-flow" />
          <circle r="2.2" fill="#087F8C">
            <animateMotion dur="1.4s" repeatCount="indefinite" path="M3,1 V33" />
          </circle>
          <line x1="7" y1="1" x2="7" y2="33" stroke="#D97706" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" className="anim-flow-rev" />
          <circle r="2.2" fill="#D97706">
            <animateMotion dur="1.4s" repeatCount="indefinite" path="M7,33 V1" />
          </circle>
        </svg>
        <svg
          viewBox="0 0 24 24"
          className="size-5 rotate-90 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </span>
      <span className="hidden items-center md:flex" aria-hidden="true">
        <svg viewBox="0 0 36 14" className="h-3.5 w-9" fill="none">
          <line x1="2" y1="3.5" x2="34" y2="3.5" stroke="#087F8C" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 4" className="anim-flow" />
          <circle r="2.5" fill="#087F8C">
            <animateMotion dur="1.4s" repeatCount="indefinite" path="M2,3.5 H34" />
          </circle>
          <line x1="2" y1="10.5" x2="34" y2="10.5" stroke="#D97706" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 4" className="anim-flow-rev" />
          <circle r="2.5" fill="#D97706">
            <animateMotion dur="1.4s" repeatCount="indefinite" path="M34,10.5 H2" />
          </circle>
        </svg>
        <svg
          viewBox="0 0 24 24"
          className="-ml-1 size-5 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </span>
    </div>
  );
}

export function ArchitecturePage() {
  return (
    <div className="bg-canvasWarm">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <header className="reveal in max-w-3xl">
          <Badge variant="primary" className="mb-4">
            <Boxes className="size-3.5" />
            Documentação técnica
          </Badge>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-ink">
            Arquitetura <span className="block text-primary">do projeto</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-muted">
            Como a biblioteca digital é construída: camadas, tecnologias, estrutura e fluxo de
            dados.
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)]">
          <nav aria-label="Seções" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {SECTIONS.map((s) => (
                <li key={s.id} className="shrink-0 lg:shrink">
                  <a
                    href={`#${s.id}`}
                    className="block whitespace-nowrap rounded-control px-3 py-2 text-[13px] font-bold text-muted transition-colors duration-150 hover:bg-surface hover:text-ink lg:whitespace-normal"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-12">
            <Section id="visao-geral" icon={Layers} title="Visão geral">
              <Card>
                <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
                  <LayerBox title="Frontend" sub="React + Vite · porta 5173" />
                  <FlowArrow label="HTTP/JSON + JWT Bearer" />
                  <LayerBox primary title="Backend" sub="Express API · porta 3333 /api" />
                  <FlowArrow label="Prisma ORM" />
                  <LayerBox title="SQLite" sub="apps/api/prisma/dev.db" />
                </div>
              </Card>
            </Section>

            <Section id="stack" icon={Boxes} title="Stack">
              <div className="grid gap-3 md:grid-cols-2">
                <Card>
                  <h3 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-primary-dark">
                    Backend
                  </h3>
                  <dl className="space-y-2.5">
                    {BACKEND_STACK.map(([k, v, Icon, color]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <dt className="flex min-w-0 items-center gap-2 text-[12.5px] font-bold uppercase tracking-wide text-muted">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-surfaceWarm">
                            <Icon className={`size-4 ${color}`} />
                          </span>
                          <span className="truncate">{k}</span>
                        </dt>
                        <dd className="text-right text-[13px] font-semibold text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
                <Card>
                  <h3 className="mb-3 text-[13px] font-extrabold uppercase tracking-wide text-primary-dark">
                    Frontend
                  </h3>
                  <dl className="space-y-2.5">
                    {FRONTEND_STACK.map(([k, v, Icon, color]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <dt className="flex min-w-0 items-center gap-2 text-[12.5px] font-bold uppercase tracking-wide text-muted">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-surfaceWarm">
                            <Icon className={`size-4 ${color}`} />
                          </span>
                          <span className="truncate">{k}</span>
                        </dt>
                        <dd className="text-right text-[13px] font-semibold text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
