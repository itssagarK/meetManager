import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../../config/constants.js';

export const CommandPalette = ({
  isOpen,
  onClose,
  paletteQuery,
  setPaletteQuery,
  filteredCommands = [],
  matchingPaletteItems = [],
  isMeeting,
  setSelectedDate,
  handleOpenEdit,
  handleOpenChatRoom,
  workspaceId = 'default',
}) => {
  const [activeScope, setActiveScope] = useState('all'); // 'all' | 'meetings' | 'messages' | 'commands'
  const [ftsResults, setFtsResults] = useState({ meetings: [], messages: [], totalMatches: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setFtsResults({ meetings: [], messages: [], totalMatches: 0 });
      setIsSearching(false);
      return;
    }

    const query = (paletteQuery || '').trim();
    if (!query) {
      setFtsResults({ meetings: [], messages: [], totalMatches: 0 });
      setIsSearching(false);
      return;
    }

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const headers = workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
        const url = getApiUrl(
          `/api/search?q=${encodeURIComponent(query)}&scope=${activeScope}&limit=12`
        );
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setFtsResults(data);
        }
      } catch (err) {
        console.warn('FTS search fetch error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 140);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [paletteQuery, activeScope, isOpen, workspaceId]);

  if (!isOpen) return null;

  const hasFtsMeetings = ftsResults.meetings && ftsResults.meetings.length > 0;
  const hasFtsMessages = ftsResults.messages && ftsResults.messages.length > 0;
  const hasCommands = filteredCommands && filteredCommands.length > 0;

  // Fallback to in-memory items if server query hasn't returned yet
  const displayMeetings = hasFtsMeetings ? ftsResults.meetings : matchingPaletteItems;

  const showCommandsSection =
    (activeScope === 'all' || activeScope === 'commands') && hasCommands;
  const showMeetingsSection =
    (activeScope === 'all' || activeScope === 'meetings') && displayMeetings.length > 0;
  const showMessagesSection =
    (activeScope === 'all' || activeScope === 'messages') && hasFtsMessages;

  const totalHits =
    (showCommandsSection ? filteredCommands.length : 0) +
    (showMeetingsSection ? displayMeetings.length : 0) +
    (showMessagesSection ? ftsResults.messages.length : 0);

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-modal fts-enhanced-palette" onClick={(e) => e.stopPropagation()}>
        {/* Top Search Input Row */}
        <div className="palette-search-row">
          <span className="material-symbols-outlined search-icon-badge">search</span>
          <input
            type="text"
            autoFocus
            className="palette-input"
            placeholder="Search meetings, notes, chat messages, or commands... (Esc to close)"
            value={paletteQuery}
            onChange={(e) => setPaletteQuery(e.target.value)}
          />
          {isSearching && (
            <span className="material-symbols-outlined spinning" style={{ fontSize: '18px', color: '#64748b' }}>
              sync
            </span>
          )}
          <span className="kbd-hint">Esc</span>
        </div>

        {/* Scope Tabs Selector */}
        <div className="palette-scope-bar">
          <button
            type="button"
            className={`scope-pill ${activeScope === 'all' ? 'active' : ''}`}
            onClick={() => setActiveScope('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`scope-pill ${activeScope === 'meetings' ? 'active' : ''}`}
            onClick={() => setActiveScope('meetings')}
          >
            Agendas &amp; Tasks
            {hasFtsMeetings && <span className="pill-count">{ftsResults.meetings.length}</span>}
          </button>
          <button
            type="button"
            className={`scope-pill ${activeScope === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveScope('messages')}
          >
            Chat History
            {hasFtsMessages && <span className="pill-count">{ftsResults.messages.length}</span>}
          </button>
          <button
            type="button"
            className={`scope-pill ${activeScope === 'commands' ? 'active' : ''}`}
            onClick={() => setActiveScope('commands')}
          >
            Commands
            {hasCommands && <span className="pill-count">{filteredCommands.length}</span>}
          </button>
          <div className="fts-engine-chip" title="SQLite FTS5 full-text inverted index with BM25 ranking">
            ⚡ SQLite FTS5
          </div>
        </div>

        <div className="palette-results">
          {/* Section 1: Matching Meetings & Action Items */}
          {showMeetingsSection && (
            <div className="palette-section">
              <div className="palette-section-title">
                <span>MEETINGS &amp; TASKS</span>
                {hasFtsMeetings && <span className="fts-bm25-badge">BM25 Ranked</span>}
              </div>
              {displayMeetings.map((it) => {
                const itMeeting = isMeeting ? isMeeting(it) : it.type === 'meeting';
                return (
                  <div
                    key={`meeting-${it.id}`}
                    className="palette-row fts-result-row"
                    onClick={() => {
                      if (setSelectedDate) setSelectedDate(it.date);
                      if (handleOpenEdit) handleOpenEdit(it);
                      onClose();
                    }}
                  >
                    <div className="fts-row-main">
                      <div className="fts-row-header">
                        <span className={`type-chip ${itMeeting ? 'meeting' : 'task'}`}>
                          {itMeeting ? 'Meeting' : 'Task'}
                        </span>
                        {it.match_title ? (
                          <span
                            className="fts-item-title"
                            dangerouslySetInnerHTML={{ __html: it.match_title }}
                          />
                        ) : (
                          <span className="fts-item-title">{it.title}</span>
                        )}
                        <span className={`fts-priority-badge priority-${(it.priority || 'Medium').toLowerCase()}`}>
                          {it.priority}
                        </span>
                      </div>

                      {/* Highlighted Notes Snippet */}
                      {it.match_notes && (
                        <div
                          className="fts-snippet notes-snippet"
                          dangerouslySetInnerHTML={{ __html: it.match_notes }}
                        />
                      )}

                      {/* Highlighted Attendees Snippet */}
                      {it.match_attendees && (
                        <div className="fts-snippet attendees-snippet">
                          <span className="snippet-prefix">Attendees:</span>
                          <span dangerouslySetInnerHTML={{ __html: it.match_attendees }} />
                        </div>
                      )}
                    </div>

                    <div className="fts-row-meta">
                      <span className="fts-date-badge">
                        {it.date} {it.time && `at ${it.time}`}
                      </span>
                      <span className="palette-jump-hint">Open ➜</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 2: Matching Chat Messages */}
          {showMessagesSection && (
            <div className="palette-section">
              <div className="palette-section-title">
                <span>CHAT ARCHIVE &amp; IN-CALL LOGS</span>
                <span className="fts-bm25-badge">BM25 Ranked</span>
              </div>
              {ftsResults.messages.map((msg) => (
                <div
                  key={`msg-${msg.id}`}
                  className="palette-row fts-result-row chat-result-row"
                  onClick={() => {
                    if (handleOpenChatRoom) {
                      handleOpenChatRoom(msg.room_id);
                    }
                    onClose();
                  }}
                >
                  <div className="fts-row-main">
                    <div className="fts-row-header">
                      <span className="fts-room-chip">#{msg.room_id}</span>
                      <span className="fts-sender-name">{msg.sender_name}</span>
                      <span className="fts-msg-time">
                        {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className="fts-snippet chat-snippet"
                      dangerouslySetInnerHTML={{ __html: msg.match_content || msg.content }}
                    />
                  </div>
                  <div className="fts-row-meta">
                    <span className="palette-jump-hint">Jump to #{msg.room_id} ➜</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section 3: Built-In Commands */}
          {showCommandsSection && (
            <div className="palette-section">
              <div className="palette-section-title">COMMANDS</div>
              {filteredCommands.map((cmd) => (
                <div key={cmd.id} className="palette-row" onClick={cmd.action}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {cmd.icon}
                    </span>
                    <span style={{ fontWeight: '700' }}>{cmd.title}</span>
                  </div>
                  <span className="palette-jump-hint">Execute</span>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {totalHits === 0 && !isSearching && (
            <div className="palette-empty">
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#94a3b8', display: 'block', margin: '0 auto 8px' }}>
                search_off
              </span>
              No results found in SQLite FTS5 index matching &quot;{paletteQuery}&quot;
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                Try searching for words in meeting titles, markdown notes, attendees, or chat logs.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="palette-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>
              Use <strong>Ctrl+K</strong> or <strong>/</strong> to search
            </span>
            <span className="palette-footer-dot">•</span>
            <span>
              Esc to dismiss
            </span>
          </div>
          <span style={{ color: '#64748b', fontWeight: '700' }}>
            SQLite FTS5 Full-Text Search
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;