import React from 'react';
import {
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  X,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface PopupBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onTryDemo?: () => void;
  isRetrying?: boolean;
}

export const PopupBlockedModal: React.FC<PopupBlockedModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onTryDemo,
  isRetrying = false,
}) => {
  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      id="popup-blocked-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-modal-title"
    >
      <div
        id="popup-blocked-modal-content"
        className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-neutral-200 relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          id="popup-modal-close-btn"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div
            id="popup-modal-icon-badge"
            className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0"
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="popup-modal-title"
              className="text-lg font-semibold text-white tracking-tight"
            >
              Google Sign-In Pop-up Blocked
            </h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Your browser automatically blocked the authentication window
              because Gemini LifeLens is running inside a preview iframe.
            </p>
          </div>
        </div>

        {/* Instructions Box */}
        <div
          id="popup-instructions-box"
          className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 mb-5 space-y-3"
        >
          <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>How to unblock in 3 steps:</span>
          </div>

          <ol className="space-y-2.5 text-xs text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-bold shrink-0 mt-0.5">
                1
              </span>
              <span>
                Look at your browser&apos;s <strong>address bar</strong> (top
                right of your browser window).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-bold shrink-0 mt-0.5">
                2
              </span>
              <span>
                Click the <strong>Pop-up blocked</strong> icon (marked with a
                small red &times; or lock) and choose{' '}
                <strong className="text-amber-300">
                  &ldquo;Always allow pop-ups and redirects&rdquo;
                </strong>
                .
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-bold shrink-0 mt-0.5">
                3
              </span>
              <span>
                Click <strong>&ldquo;Retry Sign-In&rdquo;</strong> below to
                complete authentication.
              </span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            id="popup-modal-retry-btn"
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
            />
            <span>{isRetrying ? 'Connecting...' : 'Retry Google Sign-In'}</span>
          </button>

          <button
            id="popup-modal-newtab-btn"
            type="button"
            onClick={handleOpenInNewTab}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:scale-[0.99] text-neutral-200 border border-neutral-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Tab</span>
          </button>
        </div>

        {/* Demo Mode Option */}
        {onTryDemo && (
          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <span>Want to start writing right away?</span>
            <button
              id="popup-modal-demo-btn"
              type="button"
              onClick={() => {
                onClose();
                onTryDemo();
              }}
              className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
            >
              Continue in Demo Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
