import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div
      id="error-banner"
      role="alert"
      className="bg-red-950/60 border border-red-800/60 text-red-200 px-4 py-3 rounded-xl shadow-xs flex items-center justify-between gap-3 text-sm animate-fade-in"
    >
      <div className="flex items-center gap-2 flex-1">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <span className="font-medium text-red-200">{message}</span>
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            id="error-retry-button"
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            id="error-dismiss-button"
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="text-red-400 hover:text-red-200 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
