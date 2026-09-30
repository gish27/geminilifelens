import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  FileText,
  Lightbulb,
  MessageCircle,
  Brain,
  Download,
  Menu,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { type Interaction, type ReflectionMode, type JournalMessage, type LocationData } from '../types';
import { LocationPicker } from './LocationPicker';
import { NotificationModal } from './NotificationModal';
import { Bell } from 'lucide-react';

interface ReflectionCanvasProps {
  interaction: Interaction;
  onSendMessage: (content: string, mode: ReflectionMode) => Promise<void>;
  onUpdateTitle: (title: string) => void;
  onChangeMode: (mode: ReflectionMode) => void;
  onGenerateSummary: () => Promise<void>;
  onUpdateLocation: (location: LocationData | undefined) => void;
  isLoading: boolean;
  onToggleSidebar: () => void;
  isSaving: boolean;
  saveError: string | null;
  onRetrySave?: () => void;
}

const STARTER_PROMPTS = [
  {
    icon: Sparkles,
    label: 'Daily Debrief',
    prompt: 'I want to debrief my day. Here is what happened, how it made me feel, and what felt challenging: ',
  },
  {
    icon: Brain,
    label: 'Unpack a Decision',
    prompt: "I'm facing an important decision and feeling uncertain. The dilemma is: ",
  },
  {
    icon: Lightbulb,
    label: 'Brainstorm Ideas',
    prompt: 'Help me brainstorm creative solutions and unconventional angles for: ',
  },
  {
    icon: FileText,
    label: 'Mindset Reflection',
    prompt: 'I noticed a recurring thought pattern or reaction today that I want to explore: ',
  },
];

export const ReflectionCanvas: React.FC<ReflectionCanvasProps> = ({
  interaction,
  onSendMessage,
  onUpdateTitle,
  onChangeMode,
  onGenerateSummary,
  onUpdateLocation,
  isLoading,
  onToggleSidebar,
  isSaving,
  saveError,
  onRetrySave,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(interaction.title);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setTempTitle(interaction.title);
  }, [interaction.title]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interaction.messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    // Retain buffer until parent acknowledges submission
    await onSendMessage(trimmed, interaction.mode);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && tempTitle !== interaction.title) {
      onUpdateTitle(tempTitle.trim());
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    }
  };

  const handleSummaryAction = async () => {
    setIsSummarizing(true);
    try {
      await onGenerateSummary();
    } finally {
      setIsSummarizing(false);
    }
  };

  const exportAsMarkdown = () => {
    let md = `# ${interaction.title || 'Journal Reflection'}\n\n`;
    md += `*Mode:* ${interaction.mode}  \n`;
    md += `*Date:* ${new Date(interaction.createdAt).toLocaleString()}  \n\n`;

    if (interaction.summary) {
      md += `## AI Executive Summary\n${interaction.summary}\n\n---\n\n`;
    }

    md += `## Reflection Dialogue\n\n`;
    for (const msg of interaction.messages) {
      const author = msg.role === 'user' ? 'Me' : 'Gemini AI';
      md += `### ${author} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n${msg.content}\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(interaction.title || 'reflection')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="reflection-canvas" className="flex-1 flex flex-col h-[calc(100vh-65px)] bg-[#0a0a0a] text-neutral-300 overflow-hidden">
      {/* Top Session Toolbar */}
      <div
        id="canvas-toolbar"
        className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-6 py-3 shrink-0"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Mobile Toggle & Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              id="canvas-toggle-sidebar-btn"
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 text-neutral-400 hover:bg-neutral-800 rounded-lg shrink-0 cursor-pointer"
              aria-label="Toggle past reflections sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {isEditingTitle ? (
              <input
                id="canvas-title-input"
                type="text"
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="font-light text-white text-lg sm:text-xl bg-[#121212] border border-neutral-700 rounded-lg px-2 py-0.5 w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <h2
                id="canvas-title-display"
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title"
                className="font-light text-white text-lg sm:text-xl truncate cursor-pointer hover:underline decoration-neutral-600 decoration-dashed underline-offset-4"
              >
                {interaction.title || 'Untitled Reflection'}
              </h2>
            )}

            {isSaving && (
              <span
                id="canvas-saving-indicator"
                className="text-[11px] text-neutral-500 font-medium shrink-0 animate-pulse"
              >
                Saving to Firestore...
              </span>
            )}
          </div>

          {/* Right: Mode Selector Tabs & Actions */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {/* Modes */}
            <div
              id="canvas-mode-selector"
              className="inline-flex p-0.5 bg-neutral-900 rounded-xl text-xs font-medium border border-neutral-800"
            >
              {(
                [
                  { id: 'reflection', label: 'Reflection', icon: Brain },
                  { id: 'summary', label: 'Summary', icon: FileText },
                  { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb },
                  { id: 'chat', label: 'Dialogue', icon: MessageCircle },
                ] as const
              ).map((mode) => {
                const Icon = mode.icon;
                const isSelected = interaction.mode === mode.id;
                return (
                  <button
                    key={mode.id}
                    id={`mode-tab-${mode.id}`}
                    type="button"
                    onClick={() => onChangeMode(mode.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800 text-white shadow-xs font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{mode.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <button
              id="canvas-generate-summary-btn"
              type="button"
              onClick={handleSummaryAction}
              disabled={interaction.messages.length < 2 || isSummarizing}
              title="Generate a structured executive synthesis of this journal entry"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Synthesize</span>
            </button>

            <button
              id="canvas-notify-btn"
              type="button"
              onClick={() => setIsNotificationModalOpen(true)}
              disabled={interaction.messages.length === 0}
              title="Dispatch external notification (Slack / Discord / Webhook)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notify</span>
            </button>

            <button
              id="canvas-export-btn"
              type="button"
              onClick={exportAsMarkdown}
              title="Export entry as Markdown"
              className="inline-flex items-center gap-1 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Export Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Save Error Alert Banner */}
      {saveError && (
        <div
          id="canvas-save-error-bar"
          className="bg-amber-950/50 border-b border-amber-800/50 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{saveError}</span>
          </div>
          {onRetrySave && (
            <button
              id="canvas-save-retry-btn"
              type="button"
              onClick={onRetrySave}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Save
            </button>
          )}
        </div>
      )}

      {/* Message Stream */}
      <div id="canvas-message-stream" className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Executive Summary Card (if generated) */}
          {interaction.summary && (
            <div
              id="canvas-summary-card"
              className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-5 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Gemini Executive Synthesis</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(interaction.summary || '', 9999)}
                  className="text-indigo-400 hover:text-indigo-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedIndex === 9999 ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-indigo-100/90 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {interaction.summary}
              </div>
            </div>
          )}

          {/* Messages */}
          {interaction.messages.length === 0 ? (
            <div id="canvas-blank-slate" className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/50 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="font-light text-white text-xl mb-2">
                Begin your reflection
              </h3>
              <p className="text-neutral-400 text-sm max-w-md mx-auto mb-8">
                Write freely about what is on your mind. Gemini will listen,
                reflect back deeper patterns, and help you find clarity.
              </p>

              {/* Starter Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
                {STARTER_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      id={`starter-chip-${idx}`}
                      type="button"
                      onClick={() => setInputText(item.prompt)}
                      className="p-3.5 bg-[#121212] hover:bg-neutral-800/60 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all shadow-xs group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1 text-white font-medium text-xs">
                        <Icon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            interaction.messages.map((msg: JournalMessage, index: number) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || index}
                  id={`chat-message-${index}`}
                  className={`flex gap-3 sm:gap-4 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-xs ${
                      isUser
                        ? 'bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-tr-none'
                        : 'bg-indigo-950/20 border border-indigo-500/20 text-indigo-50/90 rounded-tl-none'
                    }`}
                  >
                    {/* Header with author & model pill */}
                    <div className="flex items-center justify-between gap-3 mb-2 text-[11px]">
                      <span
                        className={`font-semibold ${
                          isUser ? 'text-white' : 'text-indigo-400'
                        }`}
                      >
                        {isUser ? 'You' : 'Gemini AI'}
                      </span>

                      <div className="flex items-center gap-2">
                        {!isUser && msg.modelUsed && (
                          <span className="bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-md text-[10px] font-mono">
                            {msg.modelUsed}
                          </span>
                        )}
                        <span
                          className={`${
                            isUser ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.content, index)}
                            className="text-neutral-500 hover:text-neutral-300 cursor-pointer"
                            title="Copy response"
                          >
                            {copiedIndex === index ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Message content */}
                    <div
                      className={`text-sm leading-relaxed whitespace-pre-wrap font-sans ${
                        isUser ? 'text-neutral-200' : 'text-indigo-50/90'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center shrink-0 shadow-xs mt-1">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* AI Thinking Animation */}
          {isLoading && (
            <div
              id="ai-loading-indicator"
              className="flex items-start gap-3 sm:gap-4 animate-fade-in"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-xs mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl rounded-tl-none p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Gemini is reflecting on your entry...</span>
                </div>
                <div className="flex gap-1.5 mt-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer Section */}
      <div
        id="canvas-composer-container"
        className="bg-[#0a0a0a] border-t border-neutral-800 p-4 sm:p-5 shrink-0"
      >
        <div className="max-w-3xl mx-auto">
          {/* Location & Metadata Bar */}
          <div className="flex items-center justify-between pb-2">
            <LocationPicker
              location={interaction.location}
              onSelectLocation={onUpdateLocation}
            />
            {interaction.location && (
              <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
                {interaction.location.latitude}, {interaction.location.longitude}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <textarea
              id="canvas-prompt-textarea"
              ref={textareaRef}
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                interaction.mode === 'summary'
                  ? 'Paste your journal entry or thoughts to generate a structured summary...'
                  : interaction.mode === 'brainstorm'
                  ? 'Describe your project or goal to brainstorm creative ideas...'
                  : 'Write your thoughts or journal reflection (Press Cmd/Ctrl + Enter to send)...'
              }
              className="w-full bg-[#121212] border border-neutral-800 rounded-2xl p-3.5 pr-24 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-[#151515] transition-all resize-none leading-relaxed"
            />

            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <span className="hidden sm:inline-block text-[11px] text-neutral-600">
                ⌘ + ↵
              </span>
              <button
                id="canvas-send-btn"
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                aria-label="Send reflection to Gemini"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between text-[11px] text-neutral-600 mt-2 px-1">
            <span>
              All reflections saved strictly to your isolated Firestore account
            </span>
            <span className="hidden sm:inline">
              Active Mode: <strong className="capitalize text-neutral-400">{interaction.mode}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* External Notification Dispatcher Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        interaction={interaction}
      />
    </div>
  );
};
