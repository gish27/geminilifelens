import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Brain,
  FileText,
  Lock,
  ArrowRight,
  Database,
  Cpu,
  ExternalLink,
} from 'lucide-react';

interface LandingViewProps {
  onSignIn: () => void;
  onTryDemo: () => void;
  isLoading: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onSignIn,
  onTryDemo,
  isLoading,
}) => {
  return (
    <div id="landing-page" className="min-h-[calc(100vh-65px)] bg-[#0a0a0a] text-neutral-300 flex flex-col justify-between">
      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-16 text-center flex-1 flex flex-col items-center justify-center">
        {/* Pill Tag */}
        <div
          id="landing-pill-tag"
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Powered by Gemini 3.6 Flash & Cloud Firestore</span>
        </div>

        {/* Main Headline */}
        <h2
          id="landing-heading"
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.15] mb-6 max-w-2xl"
        >
          A quiet space to think, write, and converse with AI.
        </h2>

        {/* Subtitle */}
        <p
          id="landing-subtitle"
          className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-xl mb-10 font-normal"
        >
          Explore multi-turn reflections, generate deep insights, and brainstorm
          creative breakthroughs. All your journal interactions remain strictly
          isolated and encrypted in your personal cloud store.
        </p>

        {/* Authentication Call-to-Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-12">
          <button
            id="landing-google-signin-btn"
            type="button"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-neutral-200 active:scale-[0.99] text-black rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Authenticating...' : 'Sign In with Google'}</span>
          </button>

          <button
            id="landing-try-demo-btn"
            type="button"
            onClick={onTryDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#121212] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <span>Explore Sandbox</span>
            <ArrowRight className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Iframe Preview Helper Hint */}
        {typeof window !== 'undefined' && window.self !== window.top && (
          <div
            id="iframe-popup-hint"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-400 mb-8"
          >
            <span>Running in preview frame. If pop-ups are blocked:</span>
            <button
              id="landing-open-tab-btn"
              type="button"
              onClick={() =>
                window.open(window.location.href, '_blank', 'noopener,noreferrer')
              }
              className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer underline"
            >
              Open in new tab
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Feature Grid */}
        <div
          id="landing-features-grid"
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left w-full max-w-4xl"
        >
          <div
            id="feature-card-multi-turn"
            className="bg-[#121212] p-6 rounded-2xl border border-neutral-800 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-950/40 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base mb-1">
                Multi-Turn Reflections
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Converse naturally with Gemini to probe thoughts, unpack complex
                feelings, and explore perspectives step-by-step.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[11px] font-medium text-indigo-400">
              Modes: Reflection, Summary, Brainstorm
            </div>
          </div>

          <div
            id="feature-card-isolation"
            className="bg-[#121212] p-6 rounded-2xl border border-neutral-800 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base mb-1">
                Strict User Data Isolation
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Your entries are partitioned under your personal UID in Cloud
                Firestore. Zero cross-user leaks or unauthorized access.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[11px] font-medium text-emerald-400">
              Verified Firebase Security Rules
            </div>
          </div>

          <div
            id="feature-card-resilience"
            className="bg-[#121212] p-6 rounded-2xl border border-neutral-800 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-950/40 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base mb-1">
                Resilient AI Architecture
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Equipped with an automatic fallback ladder across Gemini models
                for seamless availability and zero downtime.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 text-[11px] font-medium text-blue-400">
              Gemini 3.6 Flash + Fallback Ladder
            </div>
          </div>
        </div>

        {/* Security / Privacy Banner */}
        <div
          id="landing-security-footer"
          className="mt-12 inline-flex items-center gap-2 text-xs text-neutral-400 bg-[#121212] border border-neutral-800 px-4 py-2 rounded-full"
        >
          <Lock className="w-3.5 h-3.5 text-neutral-400" />
          <span>
            Federated Google Authentication: No passwords stored. API keys
            strictly server-side.
          </span>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-600">
        Google AI Studio Build &bull; Cloud Run &bull; Cloud Firestore &bull; Gemini 3.6 Flash
      </footer>
    </div>
  );
};
