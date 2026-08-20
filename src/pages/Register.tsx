import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Building2, Check, Eye, EyeOff, Loader2, Lock, Mail, ShieldAlert, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { authRoles } from '../data/mock';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    role: authRoles[0],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [key]: '' }));
    setError(null);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match.';
    if (!form.organization.trim()) errs.organization = 'Organization is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await signUp({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      organization: form.organization,
      role: form.role,
    });
    setLoading(false);
    if (result.ok) {
      setSuccess(true);
      window.setTimeout(() => navigate('/login', { replace: true, state: { registered: true } }), 1600);
    } else {
      setError(result.error ?? 'Could not create the account.');
    }
  };

  const inputClass = (hasError: boolean) =>
    `glass-input flex w-full items-center gap-2.5 rounded-xl px-3.5 py-3 ${hasError ? '!border-red-400/50' : ''}`;

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong rounded-2xl p-6 sm:p-8"
      >
        {success ? (
          <div className="py-6 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-950/60"
            >
              <Check className="h-8 w-8 text-white" strokeWidth={3} />
            </motion.div>
            <h2 className="font-display mt-4 text-[20px] font-semibold text-white">Account created</h2>
            <p className="mt-1.5 text-[13px] text-slate-400">
              Welcome to EFIF, {form.fullName.split(' ')[0]}. Redirecting you to sign in…
            </p>
            <div className="mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
              />
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-display text-[22px] font-semibold text-white">Create your account</h2>
            <p className="mt-1 text-[13px] text-slate-400">Join the environmental intelligence network.</p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5" noValidate>
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
                  Full Name
                </label>
                <div className={inputClass(Boolean(fieldErrors.fullName))}>
                  <User className="h-4 w-4 shrink-0 text-slate-500" />
                  <input
                    id="fullName"
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder="e.g. Priya Sharma"
                    className="w-full min-w-0 bg-transparent text-[13.5px] text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>
                {fieldErrors.fullName && <p className="mt-1.5 text-[11.5px] text-red-300">{fieldErrors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="reg-email" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
                  Email
                </label>
                <div className={inputClass(Boolean(fieldErrors.email))}>
                  <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                  <input
                    id="reg-email"
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="you@agency.gov"
                    className="w-full min-w-0 bg-transparent text-[13.5px] text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>
                {fieldErrors.email && <p className="mt-1.5 text-[11.5px] text-red-300">{fieldErrors.email}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="reg-password" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
                    Password
                  </label>
                  <div className={inputClass(Boolean(fieldErrors.password))}>
                    <Lock className="h-4 w-4 shrink-0 text-slate-500" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Min. 6 characters"
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

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
                    Confirm Password
                  </label>
                  <div className={inputClass(Boolean(fieldErrors.confirmPassword))}>
                    <Lock className="h-4 w-4 shrink-0 text-slate-500" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      placeholder="Repeat password"
                      className="w-full min-w-0 bg-transparent text-[13.5px] text-slate-100 outline-none placeholder:text-slate-500"
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1.5 text-[11.5px] text-red-300">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="organization" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
                  Organization
                </label>
                <div className={inputClass(Boolean(fieldErrors.organization))}>
                  <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
                  <input
                    id="organization"
                    value={form.organization}
                    onChange={set('organization')}
                    placeholder="e.g. State Pollution Control Board"
                    className="w-full min-w-0 bg-transparent text-[13.5px] text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>
                {fieldErrors.organization && (
                  <p className="mt-1.5 text-[11.5px] text-red-300">{fieldErrors.organization}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
                  Role
                </label>
                <select
                  id="role"
                  value={form.role}
                  onChange={set('role')}
                  className="glass-input w-full rounded-xl px-3.5 py-3 text-[13.5px] text-slate-100 outline-none [&>option]:bg-night-900"
                >
                  {authRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
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

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <p className="mt-5 text-center text-[13px] text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-emerald-300 transition-colors hover:text-emerald-200">
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" /> Sign in
                </span>
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}
