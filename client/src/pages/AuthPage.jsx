import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await (isRegister ? register(form) : login({ email: form.email, password: form.password }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const field =
    'w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-soft/60';

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* The product's core moment, shown instead of described */}
      <section className="flex flex-col justify-center gap-10 px-6 py-12 sm:px-12 lg:px-16">
        <div>
          <p className="font-serif text-3xl font-semibold">
            <span className="bg-mark/70 px-1">DocMind</span>
          </p>
          <h1 className="mt-6 max-w-md font-serif text-4xl leading-tight font-semibold sm:text-5xl">
            Ask your documents. Get answers you can check.
          </h1>
        </div>

        <figure className="max-w-lg rounded-lg border border-line bg-surface p-5">
          <p className="text-sm text-ink-soft">How long do I have to return an item?</p>
          <p className="mt-3 font-serif text-lg leading-relaxed">
            You can return it within 30 days of delivery, as long as it is unused
            <span className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-mark px-1 font-sans text-[11px] font-semibold">1</span>
          </p>
          <blockquote className="mt-4 border-l-4 border-mark bg-mark/25 px-3 py-2 font-serif text-[15px] leading-relaxed">
            Items may be returned within 30 days of delivery if they are unused and in original packaging.
          </blockquote>
          <figcaption className="mt-2 text-sm text-ink-soft">returns-policy.pdf, page 2</figcaption>
        </figure>
      </section>

      <section className="flex items-center justify-center bg-surface px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <h2 className="font-serif text-2xl font-semibold">{isRegister ? 'Create your account' : 'Sign in'}</h2>

          <div className="mt-6 space-y-4">
            {isRegister && (
              <label className="block text-sm font-medium">
                Name
                <input className={`${field} mt-1.5`} value={form.name} onChange={set('name')} autoComplete="name" required />
              </label>
            )}
            <label className="block text-sm font-medium">
              Email
              <input type="email" className={`${field} mt-1.5`} value={form.email} onChange={set('email')} autoComplete="email" required />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                type="password"
                className={`${field} mt-1.5`}
                value={form.password}
                onChange={set('password')}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 8 : undefined}
                required
              />
              {isRegister && <span className="mt-1 block text-xs font-normal text-ink-soft">Use at least 8 characters.</span>}
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-md bg-ink px-4 py-2.5 font-medium text-white hover:bg-ink/90 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>

          <p className="mt-5 text-sm text-ink-soft">
            {isRegister ? 'Already have an account?' : 'New to DocMind?'}{' '}
            <button
              type="button"
              className="font-medium text-brand underline underline-offset-2"
              onClick={() => {
                setMode(isRegister ? 'login' : 'register');
                setError('');
              }}
            >
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
