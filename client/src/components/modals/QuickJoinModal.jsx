import React from 'react';

export const QuickJoinModal = ({
  isOpen,
  onClose,
  quickJoinCode,
  setQuickJoinCode,
  handleQuickJoinCall,
  handleQuickJoinChat,
  handleStartInstantCall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="create-room-modal-overlay" onClick={onClose}>
      <div className="create-room-modal-card quick-join-card" onClick={(e) => e.stopPropagation()}>
        <div className="create-room-modal-header">
          <div className="modal-title-with-icon">
            <span className="material-symbols-outlined modal-header-icon" style={{ background: '#fef08a', color: '#854d0e' }}>bolt</span>
            <div>
              <h3>Direct Quick Join</h3>
              <p>Join an Instant Call or Work Chat directly using a room code with zero boundaries.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="create-room-modal-body">
          <div className="join-room-code-section" style={{ border: 'none', padding: 0 }}>
            <h4>Enter Room Code</h4>
            <p>Paste a room link or type the code (e.g. general, standup, alpha-7) to jump right in.</p>
            <div className="join-room-form">
              <div className="join-input-wrap">
                <span className="material-symbols-outlined">tag</span>
                <input
                  type="text"
                  placeholder="e.g. general, team-sync, pcs-alpha"
                  value={quickJoinCode}
                  onChange={(e) => setQuickJoinCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickJoinCall();
                    }
                  }}
                  autoFocus
                />
                {quickJoinCode && (
                  <button
                    type="button"
                    className="btn-clear-inline"
                    onClick={() => setQuickJoinCode('')}
                    title="Clear input"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
              <div className="quick-join-dual-buttons">
                <button
                  type="button"
                  className="btn-modal-quick-call"
                  onClick={handleQuickJoinCall}
                  disabled={!quickJoinCode.trim()}
                  title="Join video/audio call with this code directly"
                >
                  <span className="material-symbols-outlined">videocam</span>
                  <span>Join Call Directly</span>
                </button>
                <button
                  type="button"
                  className="btn-modal-quick-chat"
                  onClick={handleQuickJoinChat}
                  disabled={!quickJoinCode.trim()}
                  title="Join text/image chat with this code"
                >
                  <span className="material-symbols-outlined">forum</span>
                  <span>Join Work Chat</span>
                </button>
              </div>
            </div>
          </div>

          <div className="create-room-divider">
            <span>OR START A FRESH INSTANT ROOM</span>
          </div>

          <div className="quick-general-section">
            <button
              type="button"
              className="btn-primary-create-room"
              onClick={() => {
                onClose();
                handleStartInstantCall();
              }}
            >
              <span className="material-symbols-outlined">videocam</span>
              <span>Start New Instant Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickJoinModal;
