import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Page } from './components/ui/Page';
import { useAuth } from './context/AuthContext';
import { placeholderModules } from './data/mock';
import { Icon } from './components/ui/Icon';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Placeholder from './pages/Placeholder';
import Register from './pages/Register';

function AuthSplash() {
  return (
    <div className="flex h-screen items-center justify-center bg-night-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-3"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-950/60">
          <Icon name="leaf" className="h-7 w-7 text-white" />
        </span>
        <p className="font-display text-sm font-bold tracking-[0.14em] text-slate-300">EFIF</p>
      </motion.div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  if (initializing) return <AuthSplash />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Page><Login /></Page>} />
        <Route path="/register" element={<Page><Register /></Page>} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Page><Dashboard /></Page>
            </RequireAuth>
          }
        />

        {placeholderModules.map((mod) => (
          <Route
            key={mod.path}
            path={mod.path}
            element={
              <RequireAuth>
                <Page><Placeholder moduleKey={mod.key} /></Page>
              </RequireAuth>
            }
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return <AnimatedRoutes />;
}
