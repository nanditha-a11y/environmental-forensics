import React from 'react';
import { Loader2, AlertCircle, RefreshCw, WifiOff, Inbox } from 'lucide-react';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void; // <--- Add this property
  children: React.ReactNode;
}

export const QueryState: React.FC<QueryStateProps> = ({
  isLoading,
  isError,
  error,
  isEmpty = false,
  emptyMessage = 'No data available',
  onRetry,
  children,
}) => {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (isLoading) {
    return (
      <div className="glass flex min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-2xl p-6 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
        <span className="text-xs font-mono tracking-wide text-slate-300">Loading data...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-red-500/30 bg-red-950/20 p-6 text-red-300">
        {isOffline ? <WifiOff className="h-5 w-5 text-amber-400" /> : <AlertCircle className="h-5 w-5 text-red-400" />}
        <span className="text-xs font-semibold">
          {isOffline ? 'You are currently offline' : 'API Connection Failure'}
        </span>
        <span className="text-[11px] text-red-400/80">{error?.message || 'Server did not respond'}</span>
        {onRetry && (
          <button
            onClick={() => onRetry()}
            className="mt-2 flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-200 transition-colors hover:bg-red-500/20"
          >
            <RefreshCw className="h-3 w-3" /> Retry Connection
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="glass flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-2xl p-6 text-slate-400">
        <Inbox className="h-6 w-6 text-slate-500" />
        <span className="text-xs font-medium text-slate-300">{emptyMessage}</span>
      </div>
    );
  }

  return <>{children}</>;
};