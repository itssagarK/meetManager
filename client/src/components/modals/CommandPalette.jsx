import React from 'react';

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
}) => {
  if (!isOpen) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="palette-search-row">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            autoFocus
            className="palette-input"
            placeholder="Type a command or search items... (Esc to close)"
            value={paletteQuery}
            onChange={(e) => setPaletteQuery(e.target.value)}
          />
          <span className="kbd-hint">Esc</span>
        </div>

        <div className="palette-results">
          {filteredCommands.length > 0 && (
            <div className="palette-section">
              <div className="palette-section-title">COMMANDS</div>
              {filteredCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="palette-row"
                  onClick={cmd.action}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{cmd.icon}</span>
                    <span style={{ fontWeight: '700' }}>{cmd.title}</span>
                  </div>
                  <span className="palette-jump-hint">Execute</span>
                </div>
              ))}
            </div>
          )}

          {matchingPaletteItems.length > 0 && (
            <div className="palette-section">
              <div className="palette-section-title">MATCHING ITEMS</div>
              {matchingPaletteItems.map((it) => {
                const itMeeting = isMeeting ? isMeeting(it) : it.type === 'meeting';
                return (
                  <div
                    key={it.id}
                    className="palette-row"
                    onClick={() => {
                      if (setSelectedDate) setSelectedDate(it.date);
                      if (handleOpenEdit) handleOpenEdit(it);
                      onClose();
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`type-chip ${itMeeting ? 'meeting' : 'task'}`}>
                        {itMeeting ? 'Meeting' : 'Task'}
                      </span>
                      <span style={{ fontWeight: '700' }}>{it.title}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                      {it.date} at {it.time}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {filteredCommands.length === 0 && matchingPaletteItems.length === 0 && (
            <div className="palette-empty">No commands or items found matching &quot;{paletteQuery}&quot;</div>
          )}
        </div>

        <div className="palette-footer">
          <span>Use <strong>Ctrl+K</strong> anywhere to toggle</span>
          <span>PCS Meet Manager Command Center</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
