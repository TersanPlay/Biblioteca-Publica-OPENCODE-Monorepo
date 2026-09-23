import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidCpf } from '@library/shared';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { useReaderSession } from '../../features/readers/reader-session';
import { useToast } from '../../features/toast/toast-provider';
import { apiErrorMessage } from '../../lib/errors';

const schema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo'),
  cpf: z.string().trim().refine(isValidCpf, 'CPF inválido'),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a senha'),
}).refine((v) => v.password === v.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: doRegister } = useReaderSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', cpf: '', birthDate: '', phone: '', email: '', password: '', confirmPassword: '' },
  });

  const submit = async (v: FormValues) => {
    setError(null);
    setBusy(true);
    try {
      const { confirmPassword: _omit, ...payload } = v;
      const reader = await doRegister({
        ...payload,
        birthDate: payload.birthDate || undefined,
        phone: payload.phone || undefined,
      });
      toast('success', `Conta criada! Bem-vindo(a), ${reader.name.split(' ')[0]}!`);
      navigate('/minha-conta');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(700px 300px at 50% -5%, rgba(8,127,140,.12), transparent 60%)',
        }}
      />
      <div className="shell w-full max-w-lg">
        <div className="hairline rounded-[15px] bg-surface p-7 sm:p-8">
          <Link to="/" className="mb-6 flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-control bg-primary text-white shadow-card">
              <BookOpen className="size-5" />
            </span>
            <span>
              <span className="block text-[15px] font-extrabold tracking-tight text-ink">
                Biblioteca Pública
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Cadastro de leitor
              </span>
            </span>
          </Link>

          <h1 className="text-xl font-extrabold tracking-tight text-ink">Criar minha conta</h1>
          <p className="mt-1 text-[13px] text-muted">
            Cadastre-se para reservar livros e acompanhar seus empréstimos. Sem burocracia, sem precisar ir ao balcão.
          </p>

          <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Nome completo *</Label>
              <Input id="name" placeholder="Seu nome" autoComplete="name" error={errors.name?.message} {...register('name')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" placeholder="000.000.000-00" inputMode="numeric" error={errors.cpf?.message} {...register('cpf')} />
              </div>
              <div>
                <Label htmlFor="birthDate">Nascimento</Label>
                <Input id="birthDate" type="date" error={errors.birthDate?.message} {...register('birthDate')} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" placeholder="voce@email.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(11) 99999-9999" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input id="password" type="password" placeholder="Mínimo 6 caracteres" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                <Input id="confirmPassword" type="password" placeholder="Repita a senha" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
              </div>
            </div>
            {error && (
              <div className="rounded-card bg-destructive-soft px-4 py-3 text-[13px] font-semibold text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" loading={busy} className="w-full" size="lg">
              <UserPlus className="size-4" />
              Criar conta
            </Button>
          </form>

          <p className="mt-6 text-center text-[12.5px] text-muted">
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary-dark">
              Entrar
            </Link>
            {' · '}
            <Link to="/" className="font-semibold text-primary transition-colors hover:text-primary-dark">
              Voltar ao catálogo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
