import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { PenLine, History } from 'lucide-react';
import { SignaturePad, type SignaturePadHandle } from './signature-pad';

export interface SignatureFieldHandle {
  /** Retorna payload pronto ou null (com erro visível) quando inválido. */
  resolve: () => { signature?: string; useSavedSignature?: boolean } | null;
  reset: () => void;
}

interface SignatureFieldProps {
  savedSignature?: string | null;
  onValidityChange?: (valid: boolean) => void;
}

/**
 * Escolha explícita: usar assinatura salva do leitor ou assinar novamente
 * (a nova vira a salva). Sem salva, exige desenho no pad.
 */
export const SignatureField = forwardRef<SignatureFieldHandle, SignatureFieldProps>(function SignatureField(
  { savedSignature, onValidityChange },
  ref,
) {
  const [mode, setMode] = useState<'saved' | 'new'>(savedSignature ? 'saved' : 'new');
  const [padEmpty, setPadEmpty] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const padRef = useRef<SignaturePadHandle>(null);
  const validityRef = useRef(onValidityChange);
  validityRef.current = onValidityChange;

  const valid = mode === 'saved' ? !!savedSignature : !padEmpty;

  useEffect(() => {
    validityRef.current?.(valid);
  }, [valid]);

  useEffect(() => {
    if (!savedSignature && mode === 'saved') setMode('new');
  }, [savedSignature, mode]);

  useImperativeHandle(ref, () => ({
    resolve: () => {
      if (mode === 'saved' && savedSignature) return { useSavedSignature: true };
      const drawn = padRef.current?.toDataURL();
      if (!drawn) {
        setError('Assinatura obrigatória para concluir.');
        return null;
      }
      setError(null);
      return { signature: drawn };
    },
    reset: () => {
      padRef.current?.clear();
      setPadEmpty(true);
      setError(null);
      setMode(savedSignature ? 'saved' : 'new');
    },
  }));

  return (
    <div className="space-y-3">
      {savedSignature && (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => { setMode('saved'); setError(null); }}
            className={`rounded-card p-3 text-left hairline transition-colors ${
              mode === 'saved' ? 'bg-primary-soft ring-1 ring-primary' : 'bg-surface'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
              <History className="size-3.5 text-primary" /> Usar assinatura salva
            </span>
            <img src={savedSignature} alt="Assinatura salva do leitor" className="mt-2 h-14 w-full rounded-small border border-black/10 bg-white object-contain" />
          </button>
          <button
            type="button"
            onClick={() => { setMode('new'); setError(null); }}
            className={`rounded-card p-3 text-left hairline transition-colors ${
              mode === 'new' ? 'bg-primary-soft ring-1 ring-primary' : 'bg-surface'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
              <PenLine className="size-3.5 text-primary" /> Assinar novamente
            </span>
            <span className="mt-2 block text-[12px] text-muted">Desenhe abaixo — vira a nova salva.</span>
          </button>
        </div>
      )}
      {(mode === 'new' || !savedSignature) && (
        <SignaturePad
          ref={padRef}
          error={error}
          onChange={(e) => {
            setPadEmpty(e);
            if (!e) setError(null);
          }}
        />
      )}
    </div>
  );
});
