import { useSearchParams } from 'react-router-dom';
import { Search, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { EmptyState } from '../../../components/ui/empty-state';
import { PageHeader } from '../../../components/ui/page-header';
import { Pagination } from '../../../components/ui/pagination';
import { Skeleton } from '../../../components/ui/skeleton';
import { LoanStatusBadge } from '../../../components/ui/status-badge';
import { Select } from '../../../components/ui/select';
import { TD, TH, TBody, THead, TR, Table } from '../../../components/ui/table';
import { loansApi } from '../../api';
import { SignatureField, type SignatureFieldHandle } from '../components/signature-field';
import { useAsyncData } from '../../hooks/use-async-data';
import { useDebounce } from '../../hooks/use-debounce';
import { useApiToast } from '../../toast/toast-provider';
import { apiErrorMessage } from '../../../lib/errors';
import { formatDate } from '../../../lib/format';
import type { Loan } from '../../../types/api';

export function ReturnsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1');
  const [input, setInput] = useState(q);
  const debounced = useDebounce(input, 350);
  const [returning, setReturning] = useState<Loan | null>(null);
  const [returnCondition, setReturnCondition] = useState<string>('');
  const [returnObservations, setReturnObservations] = useState('');
  const [busy, setBusy] = useState(false);
  const returnSigFieldRef = useRef<SignatureFieldHandle>(null);
  const [returnSigValid, setReturnSigValid] = useState(false);
  const { toast } = useApiToast();

  const resetReturnForm = () => {
    setReturning(null);
    setReturnCondition('');
    setReturnObservations('');
    returnSigFieldRef.current?.reset();
    setReturnSigValid(false);
  };

  useEffect(() => {
    if (returning) {
      setReturnCondition('');
      setReturnObservations('');
      returnSigFieldRef.current?.reset();
    }
  }, [returning?.id]);

  const fetcher = () =>
    loansApi.list({ search: debounced || undefined, status: 'active', page, pageSize: 12 });
  const { data, error, loading, refetch } = useAsyncData(fetcher, [debounced, page]);

  const confirmReturn = async () => {
    if (!returning) return;
    const sig = returnSigFieldRef.current?.resolve();
    if (!sig) return;
    setBusy(true);
    try {
      await loansApi.return(returning.id, {
        condition: returnCondition || undefined,
        observations: returnObservations || undefined,
        ...sig,
      });
      toast.success('Devolução registrada', `${returning.book?.title} devolvido`);
      resetReturnForm();
      refetch();
    } catch (err) {
      toast.error('Não foi possível registrar', apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Devoluções"
        description={`${data?.total ?? 0} empréstimos abertos aguardando devolução`}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Buscar por leitor ou livro..."
            className="h-10 w-full rounded-control bg-surface pl-10 pr-3 text-sm text-ink shadow-[inset_0_0_0_1px_rgba(23,26,26,.1)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#087F8C]"
          />
        </div>
      </div>

      {error ? (
        <Card variant="soft" className="py-12 text-center">
          <p className="text-sm font-semibold text-destructive">{error}</p>
        </Card>
      ) : loading ? (
        <Card className="p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-12" />
          ))}
        </Card>
      ) : data && data.items.length === 0 ? (
        <Card variant="soft">
          <EmptyState
            title="Nenhuma devolução pendente"
            description="Todos os livros emprestados estão em dia."
          />
        </Card>
      ) : (
        data && (
          <>
            <Card className="overflow-hidden p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>#</TH>
                    <TH>Leitor</TH>
                    <TH>Livro</TH>
                    <TH>Saída</TH>
                    <TH>Vencimento</TH>
                    <TH>Dias de atraso</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Ações</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.items.map((l) => {
                    const overdue = l.status === 'OVERDUE';
                    const lateDays = overdue
                      ? Math.max(0, Math.floor((new Date().getTime() - new Date(l.dueDate).getTime()) / 86400000))
                      : 0;
                    return (
                      <TR key={l.id} className={overdue ? 'bg-destructive-soft/30' : undefined}>
                        <TD className="font-mono text-[12px] text-muted">
                          {l.number ?? `#${l.id}`}
                        </TD>
                        <TD className="max-w-44 truncate font-semibold text-ink">{l.reader?.name}</TD>
                        <TD className="max-w-60">
                          <span className="block line-clamp-1 font-medium text-ink/85">{l.book?.title}</span>
                        </TD>
                        <TD className="text-muted">{formatDate(l.loanDate)}</TD>
                        <TD className="text-muted">{formatDate(l.dueDate)}</TD>
                        <TD>
                          {overdue ? (
                            <span className="font-bold text-destructive">{lateDays}d</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TD>
                        <TD><LoanStatusBadge status={l.status} /></TD>
                        <TD className="text-right">
                          <Button size="sm" onClick={() => {
                            setReturning(l);
                          }}>
                            <Undo2 className="size-3.5" /> Receber devolução
                          </Button>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </Card>
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={(p) => {
                const next = new URLSearchParams(params);
                if (p > 1) next.set('page', String(p));
                else next.delete('page');
                setParams(next);
              }}
            />
          </>
        )
      )}

      <ConfirmDialog
        open={!!returning}
        onOpenChange={(o) => {
          if (!o) resetReturnForm();
        }}
        title="Registrar devolução"
        description={
          returning
            ? `${returning.book?.title} — leitor ${returning.reader?.name}.`
            : undefined
        }
        confirmLabel="Receber devolução"
        loading={busy}
        confirmDisabled={!returnSigValid}
        onConfirm={confirmReturn}
      >
        <div className="space-y-3">
          {returning && (
            <div className="rounded-card bg-surfaceBlue2 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Pré-visualização do Termo de Devolução
              </p>
              <div className="mt-2 grid gap-2 text-[13px] text-ink sm:grid-cols-2">
                <p><span className="text-muted">Empréstimo: </span><span className="font-mono">{returning.number ?? `#${returning.id}`}</span></p>
                <p><span className="text-muted">Situação: </span><span className="font-semibold">{returning.status === 'OVERDUE' ? 'Devolvido com atraso' : 'Devolvido no prazo'}</span></p>
                <p><span className="text-muted">Saída: </span>{formatDate(returning.loanDate)}</p>
                <p><span className="text-muted">Vencimento: </span>{formatDate(returning.dueDate)}</p>
                <p><span className="text-muted">Devolução: </span>{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Condição do livro</label>
            <Select
              value={returnCondition || 'NONE'}
              onValueChange={(v) => setReturnCondition(v === 'NONE' ? '' : v)}
              options={[
                { value: 'NONE', label: 'Não informado' },
                { value: 'BOM', label: 'Bom estado' },
                { value: 'REGULAR', label: 'Regular' },
                { value: 'DANIFICADO', label: 'Danificado' },
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Observações</label>
            <textarea
              value={returnObservations}
              onChange={(e) => setReturnObservations(e.target.value)}
              placeholder="Ex.: capa com amassado, páginas marcadas..."
              rows={2}
              maxLength={500}
              className="w-full rounded-control bg-surface px-2 py-1.5 text-sm text-ink shadow-[inset_0_0_0_1px_rgba(23,26,26,.1)] focus:outline-none focus:shadow-[inset_0_0_0_2px_#087F8C]"
            />
          </div>
          <SignatureField
            ref={returnSigFieldRef}
            savedSignature={returning?.reader?.signature}
            onValidityChange={setReturnSigValid}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}