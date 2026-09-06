import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Calendar,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Filter,
  MapPin,
} from 'lucide-react';
import { type Interaction, type ReflectionMode } from '../types';

interface HistorySidebarProps {
  interactions: Interaction[];
  activeId: string | null;
  onSelect: (interaction: Interaction) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  interactions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter interactions based on search and mode
  const filteredInteractions = useMemo(() => {
    return interactions.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.messages.some((m) =>
          m.content.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesMode =
        modeFilter === 'all' || item.mode === modeFilter;

      return matchesSearch && matchesMode;
    });
  }, [interactions, searchQuery, modeFilter]);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  const getModeBadge = (mode: ReflectionMode) => {
    switch (mode) {
      case 'summary':
        return { label: 'Summary', bg: 'bg-purple-950/50 text-purple-300 border-purple-800/50' };
      case 'brainstorm':
        return { label: 'Brainstorm', bg: 'bg-blue-950/50 text-blue-300 border-blue-800/50' };
      case 'chat':
        return { label: 'Chat', bg: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50' };
      default:
        return { label: 'Reflection', bg: 'bg-indigo-950/50 text-indigo-300 border-indigo-800/50' };
    }
  };

  return (
    <aside
      id="history-sidebar"
      className={`fixed inset-y-0 left-0 z-20 w-80 bg-[#121212] border-r border-neutral-800 flex flex-col pt-16 lg:pt-0 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-neutral-800 bg-[#121212]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span
              id="sidebar-title-count"
              className="font-bold text-xs text-neutral-500 uppercase tracking-widest"
            >
              Past Reflections ({interactions.length})
            </span>
          </div>

          <button
            id="sidebar-new-btn"
            type="button"
            onClick={() => {
              onNew();
              onCloseMobile?.();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder="Search entries & reflections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          {['all', 'reflection', 'summary', 'brainstorm', 'chat'].map((m) => (
            <button
              key={m}
              id={`filter-pill-${m}`}
              type="button"
              onClick={() => setModeFilter(m)}
              className={`px-2 py-0.5 rounded-md font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                modeFilter === m
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Interaction List */}
      <div id="history-items-container" className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredInteractions.length === 0 ? (
          <div
            id="history-empty-state"
            className="text-center py-12 px-4 text-neutral-500"
          >
            <Sparkles className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-neutral-300 mb-1">
              {searchQuery ? 'No matching reflections found' : 'No reflections yet'}
            </p>
            <p className="text-[11px] text-neutral-500 max-w-[200px] mx-auto mb-4">
              {searchQuery
                ? 'Try a different search keyword.'
                : 'Write your thoughts or ask Gemini for a reflection to begin.'}
            </p>
            {!searchQuery && (
              <button
                id="empty-state-start-btn"
                type="button"
                onClick={onNew}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start First Entry</span>
              </button>
            )}
          </div>
        ) : (
          filteredInteractions.map((item) => {
            const isActive = item.id === activeId;
            const badge = getModeBadge(item.mode);
            const isDeleting = deleteConfirmId === item.id;
            const lastMessage = item.messages[item.messages.length - 1];

            return (
              <div
                key={item.id}
                id={`history-entry-card-${item.id}`}
                onClick={() => {
                  if (!isDeleting) {
                    onSelect(item);
                    onCloseMobile?.();
                  }
                }}
                className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-800/60 border-neutral-700 shadow-xs ring-1 ring-indigo-500/40'
                    : 'bg-[#0e0e0e] hover:bg-neutral-800/40 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4
                    id={`history-entry-title-${item.id}`}
                    className="font-medium text-xs text-white line-clamp-1 flex-1 leading-snug"
                  >
                    {item.title || 'Untitled Reflection'}
                  </h4>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-sm border font-medium shrink-0 ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Preview Snippet & Location */}
                {item.location && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mb-1 truncate">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{item.location.name || item.location.address}</span>
                  </div>
                )}
                <p className="text-[11px] text-neutral-400 line-clamp-2 mb-2 leading-relaxed">
                  {lastMessage?.content || 'Empty entry'}
                </p>

                {/* Footer stats & delete */}
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span>{formatDate(item.createdAt)}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="w-3 h-3" />
                      {item.messages.length}
                    </span>
                  </div>

                  {/* Delete or Confirm Delete */}
                  <div
                    className="opacity-80 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-red-950/60 p-1 rounded-md border border-red-800/60">
                        <button
                          id={`confirm-delete-btn-${item.id}`}
                          type="button"
                          onClick={() => {
                            onDelete(item.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1 text-neutral-400 hover:text-white text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`trash-btn-${item.id}`}
                        type="button"
                        onClick={() => setDeleteConfirmId(item.id)}
                        title="Delete entry"
                        aria-label="Delete entry"
                        className="p-1 text-neutral-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
