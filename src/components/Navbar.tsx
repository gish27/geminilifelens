import React from 'react';
import { type User } from 'firebase/auth';
import { BookOpen, LogOut, Plus, ShieldCheck, Sparkles, ExternalLink, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onNewEntry: () => void;
  onSignOut: () => void;
  onSignIn: () => void;
  activeCount: number;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNewEntry,
  onSignOut,
  onSignIn,
  activeCount,
  onOpenAdmin,
}) => {
  return (
    <header
      id="app-navbar"
      className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-30 px-4 sm:px-6 py-3"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            id="brand-logo-badge"
            className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs"
          >
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                id="brand-title"
                className="font-semibold text-white text-lg sm:text-xl tracking-tight leading-tight"
              >
                Gemini LifeLens
              </h1>
              <span
                id="security-badge"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full"
                title="Cloud Firestore Isolated User Storage"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Isolated Storage
              </span>
              <span
                id="cloudrun-label-badge"
                className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full"
                title="Service Label: dev-tutorial=cloud-run-ai-challenge"
              >
                dev-tutorial=cloud-run-ai-challenge
              </span>
            </div>
            <p className="text-xs text-neutral-500 hidden sm:block">
              Private journal & multi-turn reflections with Gemini AI
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {onOpenAdmin && (
                <button
                  id="nav-admin-button"
                  type="button"
                  onClick={onOpenAdmin}
                  title="Admin Security & Metrics Portal (RBAC)"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-indigo-900/60 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin RBAC</span>
                </button>
              )}

              <button
                id="nav-new-entry-button"
                type="button"
                onClick={onNewEntry}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Reflection</span>
              </button>

              <div
                id="user-profile-widget"
                className="flex items-center gap-2 pl-2 border-l border-neutral-800"
              >
                {user.photoURL ? (
                  <img
                    id="user-avatar-image"
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-neutral-700 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    id="user-avatar-fallback"
                    className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center border border-neutral-700"
                  >
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div className="hidden md:block text-left">
                  <div
                    id="user-name-label"
                    className="text-xs font-medium text-white max-w-[120px] truncate"
                  >
                    {user.displayName || 'Reflector'}
                  </div>
                  <div
                    id="user-email-label"
                    className="text-[11px] text-neutral-500 max-w-[120px] truncate"
                  >
                    {user.email}
                  </div>
                </div>

                <button
                  id="nav-sign-out-button"
                  type="button"
                  onClick={onSignOut}
                  title="Sign out of journal"
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {typeof window !== 'undefined' && window.self !== window.top && (
                <button
                  id="nav-open-newtab-button"
                  type="button"
                  onClick={() =>
                    window.open(window.location.href, '_blank', 'noopener,noreferrer')
                  }
                  title="Open app in a new browser tab"
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  aria-label="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
              <button
                id="nav-sign-in-button"
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Sign In with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
