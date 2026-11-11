import React from 'react';

export const CreateRoomModal = ({
  isOpen,
  onClose,
  handleCreateNewRoom,
  newRoomInputCode,
  setNewRoomInputCode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="create-room-modal-overlay" onClick={onClose}>
      <div className="create-room-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="create-room-modal-header">
          <div className="modal-title-with-icon">
            <span className="material-symbols-outlined modal-header-icon">forum</span>
            <div>
              <h3>Global Online Collaboration Room</h3>
              <p>Create or join a room from any device. Share links, images, and chat instantly.</p>
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
          <div className="create-room-quick-section">
            <h4>Option 1: Quick Create New Room</h4>
            <p>Generates an instant secure collaboration room code that you can share.</p>
            <button
              type="button"
              className="btn-primary-create-room"
              onClick={() => handleCreateNewRoom()}
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span>Create New Room</span>
            </button>
          </div>

          <div className="create-room-divider">
            <span>OR</span>
          </div>

          <div className="join-room-code-section">
            <h4>Option 2: Enter Room Code to Join</h4>
            <p>Have a code from a colleague? Enter it here to open the room on this device.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateNewRoom(newRoomInputCode);
              }}
              className="join-room-form"
            >
              <div className="join-input-wrap">
                <span className="material-symbols-outlined">key</span>
                <input
                  type="text"
                  placeholder="e.g. marketing-sync, work-784..."
                  value={newRoomInputCode}
                  onChange={(e) => setNewRoomInputCode(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-join-room-submit">
                <span>Join Room</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>
          </div>

          <div className="create-room-divider">
            <span>OR</span>
          </div>

          <div className="quick-general-section">
            <button
              type="button"
              className="btn-quick-general-room"
              onClick={() => handleCreateNewRoom('general')}
            >
              <span className="material-symbols-outlined">tag</span>
              <span>Open General Team Chat (#general)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
