import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, Eye, EyeOff, Loader2, Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DEMO_ACCOUNT } from '../lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { signIn } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = (location.state as { registered?: boolean } | null)?.registered;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [shakeKey, setShakeKey] = useState(0);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);

    if (result.ok) {
      push('Welcome back to the EFIF command center.');
      navigate('/', { replace: true });
    } else {
      setError(result.error ?? 'Sign in failed.');
      setShakeKey((k) => k + 1);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setFieldErrors({});
    setError(null);
  };

  const inputClass = (hasError: boolean) =>
    `glass-input flex w-full items-center gap-2.5 rounded-xl px-3.5 py-3 ${hasError ? '!border-red-400/50' : ''}`;

  return (
    <AuthShell>
      <motion.div
        key={shakeKey}
        animate={error ? { x: [0, -9, 9, -6, 6, -2, 0] } : {}}
        transition={{ duration: 0.42 }}
        className="glass-strong rounded-2xl p-6 sm:p-8"
      >
        <AnimatePresence>
          {registered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-3 text-[12.5px] text-emerald-200">
                <CircleCheck className="h-4 w-4 shrink-0" />
                Account created. Sign in with your new credentials.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="font-display text-[22px] font-semibold text-white">Sign in to EFIF</h2>
        <p className="mt-1 text-[13px] text-slate-400">Environmental Forensic Intelligence Framework</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
              Email
            </label>
            <div className={inputClass(Boolean(fieldErrors.email))}>
              <Mail className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((f) => ({ ...f, email: undefined }));
                }}
                placeholder="you@agency.gov"
                className="w-full min-w-0 bg-transparent text-[13.5px] text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
            {fieldErrors.email && <p className="mt-1.5 text-[11.5px] text-red-300">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
              Password
            </label>
            <div className={inputClass(Boolean(fieldErrors.password))}>
              <Lock className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((f) => ({ ...f, password: undefined }));
                }}
                placeholder="••••••••"
                className="w-full min-w-0 bg-transparent text-[13.5px] text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="shrink-0 text-slate-500 transition-colors hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1.5 text-[11.5px] text-red-300">{fieldErrors.password}</p>}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 px-3.5 py-3 text-[12.5px] text-red-200"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-slate-400">
              <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded border-white/20 bg-night-900 accent-emerald-500" />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => push('Password reset arrives with the full platform.', 'info')}
              className="text-[12px] font-medium text-emerald-300 transition-colors hover:text-emerald-200"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Demo account hint */}
        <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            <p className="text-[11px] font-bold tracking-[0.08em] text-emerald-300 uppercase">Demo account</p>
          </div>
          <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed text-slate-300">
            demo@efif.com <span className="text-slate-500">/</span> demo123
          </p>
          <button
            type="button"
            onClick={fillDemo}
            className="mt-2 text-[11.5px] font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Fill demo credentials →
          </button>
        </div>

        <p className="mt-6 text-center text-[13px] text-slate-400">
          New to EFIF?{' '}
          <Link to="/register" className="font-semibold text-emerald-300 transition-colors hover:text-emerald-200">
            Create an account
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
