import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { type User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  logOut,
  saveInteraction,
  deleteInteraction,
  subscribeToUserInteractions,
  parseAuthError,
} from './lib/firebase';
import {
  type Interaction,
  type ReflectionMode,
  type JournalMessage,
  type LocationData,
} from './types';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { HistorySidebar } from './components/HistorySidebar';
import { ReflectionCanvas } from './components/ReflectionCanvas';
import { ErrorBanner } from './components/ErrorBanner';
import { PopupBlockedModal } from './components/PopupBlockedModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';

function createNewDraft(userId: string, mode: ReflectionMode = 'reflection'): Interaction {
  const id = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  return {
    id,
    userId,
    title: 'New Reflection',
    mode,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [currentDraft, setCurrentDraft] = useState<Interaction | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [popupBlockedModalOpen, setPopupBlockedModalOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setIsDemoMode(false);
        setPopupBlockedModalOpen(false);
        setAuthError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user's isolated Firestore interactions when authenticated
  useEffect(() => {
    if (!user) {
      setInteractions([]);
      return;
    }

    const unsubscribe = subscribeToUserInteractions(
      user.uid,
      (items) => {
        setInteractions(items);
      },
      (err) => {
        console.error('Failed to subscribe to interactions:', err);
        setSaveError('Permission error or unable to read Firestore collection.');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Determine active interaction
  const activeInteraction = useMemo<Interaction | null>(() => {
    if (activeInteractionId) {
      const found = interactions.find((i) => i.id === activeInteractionId);
      if (found) return found;
    }
    if (currentDraft) {
      return currentDraft;
    }
    if (interactions.length > 0) {
      return interactions[0];
    }
    // Default draft
    const draftUserId = user?.uid || 'demo_user';
    return createNewDraft(draftUserId);
  }, [activeInteractionId, interactions, currentDraft, user]);

  const handleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      setPopupBlockedModalOpen(false);
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errorDetail = parseAuthError(err);
      if (errorDetail.isPopupBlocked) {
        setPopupBlockedModalOpen(true);
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(errorDetail.message);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setActiveInteractionId(null);
      setCurrentDraft(null);
      setIsDemoMode(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleNewEntry = useCallback(() => {
    const draftUserId = user?.uid || 'demo_user';
    const draft = createNewDraft(draftUserId);
    setCurrentDraft(draft);
    setActiveInteractionId(draft.id);
  }, [user]);

  const handleSelectInteraction = (item: Interaction) => {
    setActiveInteractionId(item.id);
    setCurrentDraft(null);
    setSaveError(null);
  };

  const handleDeleteInteraction = async (id: string) => {
    if (!user) {
      // Local demo delete
      setInteractions((prev) => prev.filter((i) => i.id !== id));
      if (activeInteractionId === id) {
        handleNewEntry();
      }
      return;
    }

    try {
      await deleteInteraction(user.uid, id);
      if (activeInteractionId === id) {
        setActiveInteractionId(null);
        setCurrentDraft(null);
      }
    } catch (err: any) {
      console.error('Failed to delete interaction:', err);
      setSaveError('Failed to delete entry from Firestore.');
    }
  };

  const handleUpdateTitle = async (newTitle: string) => {
    if (!activeInteraction) return;
    const updated: Interaction = {
      ...activeInteraction,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    };

    if (currentDraft && currentDraft.id === activeInteraction.id) {
      setCurrentDraft(updated);
    }

    if (user && activeInteraction.messages.length > 0) {
      try {
        await saveInteraction(user.uid, updated);
      } catch (err: any) {
        console.error('Failed to save title update:', err);
      }
    }
  };

  const handleChangeMode = (mode: ReflectionMode) => {
    if (!activeInteraction) return;
    const updated: Interaction = {
      ...activeInteraction,
      mode,
      updatedAt: new Date().toISOString(),
    };

    if (currentDraft && currentDraft.id === activeInteraction.id) {
      setCurrentDraft(updated);
    }

    if (user && activeInteraction.messages.length > 0) {
      saveInteraction(user.uid, updated).catch(console.error);
    }
  };

  const handleUpdateLocation = async (location: LocationData | undefined) => {
    if (!activeInteraction) return;
    const updated: Interaction = {
      ...activeInteraction,
      location,
      updatedAt: new Date().toISOString(),
    };

    if (currentDraft && currentDraft.id === activeInteraction.id) {
      setCurrentDraft(updated);
    }

    if (user && activeInteraction.messages.length > 0) {
      try {
        await saveInteraction(user.uid, updated);
      } catch (err) {
        console.error('Failed to update location:', err);
      }
    } else {
      setInteractions((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
    }
  };

  // Guaranteed Transaction Verification (Input-to-Save Completeness)
  const handleSendMessage = async (promptText: string, mode: ReflectionMode) => {
    if (!activeInteraction) return;
    setIsAILoading(true);
    setSaveError(null);

    const now = new Date().toISOString();
    const userMsg: JournalMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: now,
    };

    const isNew = activeInteraction.messages.length === 0;
    const updatedMessages = [...activeInteraction.messages, userMsg];

    // Build history for backend
    const historyPayload = activeInteraction.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          history: historyPayload,
          mode,
          isNewSession: isNew,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `Server responded with status ${response.status}`
        );
      }

      const data = await response.json();
      const modelMsg: JournalMessage = {
        id: `msg_m_${Date.now()}`,
        role: 'model',
        content: data.text,
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed,
      };

      const finalMessages = [...updatedMessages, modelMsg];
      const finalTitle =
        isNew && data.titleSuggestion
          ? data.titleSuggestion
          : activeInteraction.title === 'New Reflection'
          ? promptText.slice(0, 30) + '...'
          : activeInteraction.title;

      const completedInteraction: Interaction = {
        ...activeInteraction,
        title: finalTitle,
        mode,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };

      // Persist to Cloud Firestore if signed in
      if (user) {
        setIsSaving(true);
        try {
          await saveInteraction(user.uid, completedInteraction);
          setCurrentDraft(null);
          setActiveInteractionId(completedInteraction.id);
        } catch (dbErr: any) {
          console.error('Firestore save failed:', dbErr);
          setSaveError(
            'Interaction generated, but failed to save to Cloud Firestore. Click Retry Save to persist.'
          );
          // Keep in local draft state so user data is not lost
          setCurrentDraft(completedInteraction);
        } finally {
          setIsSaving(false);
        }
      } else {
        // In demo mode: save in local memory
        setInteractions((prev) => [
          completedInteraction,
          ...prev.filter((i) => i.id !== completedInteraction.id),
        ]);
        setCurrentDraft(null);
        setActiveInteractionId(completedInteraction.id);
      }
    } catch (apiErr: any) {
      console.error('Gemini reflection error:', apiErr);
      setSaveError(apiErr.message || 'Gemini API call failed. Please retry.');
      // Keep user message staged in draft
      const draftWithUserMsg: Interaction = {
        ...activeInteraction,
        messages: updatedMessages,
      };
      setCurrentDraft(draftWithUserMsg);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!activeInteraction || activeInteraction.messages.length === 0) return;
    setSaveError(null);

    const convoText = activeInteraction.messages
      .map(
        (m) => `${m.role === 'user' ? 'Reflector' : 'Gemini'}: ${m.content}`
      )
      .join('\n\n');

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationText: convoText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to synthesize summary.');
      }

      const data = await response.json();
      const updated: Interaction = {
        ...activeInteraction,
        summary: data.summary,
        updatedAt: new Date().toISOString(),
      };

      if (user) {
        await saveInteraction(user.uid, updated);
      } else {
        setInteractions((prev) =>
          prev.map((i) => (i.id === updated.id ? updated : i))
        );
      }
    } catch (err: any) {
      console.error('Summarize error:', err);
      setSaveError(err.message || 'Failed to generate summary.');
    }
  };

  const handleRetrySave = async () => {
    if (!user || !activeInteraction) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveInteraction(user.uid, activeInteraction);
    } catch (err: any) {
      setSaveError('Retry save failed. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  // Auth checking loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-neutral-800 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-neutral-400">
            Initializing secure reflection session...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated Landing Screen
  if (!user && !isDemoMode) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-neutral-300 flex flex-col font-sans">
        <Navbar
          user={null}
          onNewEntry={() => {}}
          onSignOut={() => {}}
          onSignIn={handleSignIn}
          activeCount={0}
        />
        {authError && (
          <div className="max-w-md mx-auto mt-4 px-4 w-full">
            <ErrorBanner
              message={authError}
              onRetry={handleSignIn}
              onDismiss={() => setAuthError(null)}
            />
          </div>
        )}
        <LandingView
          onSignIn={handleSignIn}
          onTryDemo={() => {
            setIsDemoMode(true);
            handleNewEntry();
          }}
          isLoading={authLoading || isSigningIn}
        />
        <PopupBlockedModal
          isOpen={popupBlockedModalOpen}
          onClose={() => setPopupBlockedModalOpen(false)}
          onRetry={handleSignIn}
          onTryDemo={() => {
            setPopupBlockedModalOpen(false);
            setIsDemoMode(true);
            handleNewEntry();
          }}
          isRetrying={isSigningIn}
        />
      </div>
    );
  }

  // Authenticated (or Demo) Private Dashboard
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-300 flex flex-col font-sans">
      <Navbar
        user={user}
        onNewEntry={handleNewEntry}
        onSignOut={handleSignOut}
        onSignIn={handleSignIn}
        activeCount={interactions.length}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      <PopupBlockedModal
        isOpen={popupBlockedModalOpen}
        onClose={() => setPopupBlockedModalOpen(false)}
        onRetry={handleSignIn}
        isRetrying={isSigningIn}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUserEmail={user?.email}
      />

      {/* Demo Sandbox Alert (if trying without login) */}
      {!user && isDemoMode && (
        <div className="bg-amber-950/50 border-b border-amber-800/50 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-3">
          <span>
            <strong>Sandbox Mode:</strong> Reflections are stored in memory. Sign
            in with Google to persist securely in your personal Cloud Firestore.
          </span>
          <button
            type="button"
            onClick={handleSignIn}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Sign In with Google
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Past Entries */}
        <HistorySidebar
          interactions={interactions}
          activeId={activeInteraction?.id || null}
          onSelect={handleSelectInteraction}
          onNew={handleNewEntry}
          onDelete={handleDeleteInteraction}
          isOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Backdrop for mobile sidebar */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-10 lg:hidden backdrop-blur-xs"
          />
        )}

        {/* Main Canvas: Multi-turn Reflection Dialogue */}
        {activeInteraction ? (
          <ReflectionCanvas
            interaction={activeInteraction}
            onSendMessage={handleSendMessage}
            onUpdateTitle={handleUpdateTitle}
            onChangeMode={handleChangeMode}
            onGenerateSummary={handleGenerateSummary}
            onUpdateLocation={handleUpdateLocation}
            isLoading={isAILoading}
            onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
            isSaving={isSaving}
            saveError={saveError}
            onRetrySave={handleRetrySave}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-neutral-500">
            No reflection active. Click &quot;New Reflection&quot; to begin.
          </div>
        )}
      </div>
    </div>
  );
}
