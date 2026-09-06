import React, { useState } from 'react';
import { Bell, Send, Check, AlertCircle, X, ExternalLink } from 'lucide-react';
import { type Interaction } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: Interaction;
  onNotificationDispatched?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  interaction,
  onNotificationDispatched,
}) => {
  const [channel, setChannel] = useState<'slack' | 'discord' | 'email'>('slack');
  const [eventType, setEventType] = useState<'milestone' | 'goal' | 'critical_reflection'>('milestone');
  const [isSending, setIsSending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);
    setResultMessage(null);

    try {
      const res = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: interaction.title,
          summary: interaction.summary || (interaction.messages[0]?.content.slice(0, 150) ?? ''),
          eventType,
          channel,
          location: interaction.location,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Notification failed to dispatch');
      }

      setResultMessage(data.message || 'Notification processed successfully');
      if (onNotificationDispatched) {
        onNotificationDispatched();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      id="notification-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">External Notification Dispatcher</h2>
              <p className="text-[11px] text-neutral-400">Secure server-side webhook proxy</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleDispatch} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1 font-medium">Notification Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {(['slack', 'discord', 'email'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`py-2 px-3 rounded-lg border font-medium capitalize transition-colors ${
                    channel === ch
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1 font-medium">Trigger Event Classification</label>
            <select
              value={eventType}
              onChange={(e: any) => setEventType(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            >
              <option value="milestone">Milestone / Breakthrough Reflection</option>
              <option value="goal">Action Item / Goal Completion</option>
              <option value="critical_reflection">Critical Mindset Shift</option>
            </select>
          </div>

          <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
              Entry Payload Preview
            </span>
            <p className="font-semibold text-white truncate">{interaction.title}</p>
            {interaction.location && (
              <p className="text-[11px] text-emerald-400 font-mono truncate">
                📍 {interaction.location.name || interaction.location.address}
              </p>
            )}
            <p className="text-[11px] text-neutral-400 line-clamp-2">
              {interaction.summary || interaction.messages[0]?.content || 'Empty entry'}
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-red-950/30 border border-red-900/50 rounded-lg text-red-300 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resultMessage && (
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-emerald-300 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>{isSending ? 'Dispatching...' : 'Dispatch Alert'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
