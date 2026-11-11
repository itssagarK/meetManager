import React from 'react';
import FloatingChatDock from '../chat/FloatingChatDock.jsx';
import ImageLightbox from '../common/ImageLightbox.jsx';
import Toast from '../common/Toast.jsx';

export const PublicPortalView = ({
  currentTime,
  onOpenGeneralChat,
  onOpenDashboard,
  publicDirectRoomInput,
  setPublicDirectRoomInput,
  onDirectRoomSubmit,
  publicMeetings = [],
  isPublicLoading,
  onDirectJoinMeeting,
  // Floating chat props
  isRoomChatOpen,
  setIsRoomChatOpen,
  currentRoom,
  chatMessages = [],
  guestName,
  onCopyRoomShareLink,
  chatInputText,
  setChatInputText,
  chatAttachment,
  setChatAttachment,
  chatFileInputRef,
  handleImageSelect,
  handlePasteEvent,
  handleSendChatMessage,
  chatMessagesEndRef,
  replyingTo,
  setReplyingTo,
  handleReplyChatMessage,
  handleCopyMessageText,
  handleDeleteChatMessage,
  activeImageLightbox,
  setActiveImageLightbox,
  toastMessage,
}) => {
  return (
    <div className="public-portal-wrapper">
      <header className="public-portal-header">
        <div className="public-header-inner">
          <div className="brand-group">
            <span className="brand-logo-badge">PCS</span>
            <div>
              <h2 className="brand-title">Executive Meeting Portal</h2>
              <span className="portal-sub">Public Live Directory & Direct Admission</span>
            </div>
          </div>
          <div className="portal-header-actions">
            <span className="portal-clock">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              type="button"
              className="btn-switch-workspace"
              onClick={onOpenGeneralChat}
              title="Open Global Online Work Chat"
            >
              <span className="material-symbols-outlined">forum</span>
              <span>Work Chat</span>
            </button>
            <button
              type="button"
              className="btn-switch-workspace"
              onClick={onOpenDashboard}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span>Workspace Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="public-portal-stage">
        <div className="public-portal-hero">
          <div className="portal-hero-title-row">
            <span className="material-symbols-outlined portal-hero-icon">live_tv</span>
            <div>
              <h1>Live Meeting Directory</h1>
              <p>Verify live host status and join directly with your Full Name and Office ID.</p>
            </div>
          </div>

          <div className="public-room-code-form">
            <div className="room-input-group">
              <span className="material-symbols-outlined">key</span>
              <input
                type="text"
                placeholder="Enter Room Code (e.g. general, standup, pcs-alpha)..."
                value={publicDirectRoomInput}
                onChange={(e) => setPublicDirectRoomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onDirectRoomSubmit(e);
                  }
                }}
              />
            </div>
            <div className="public-portal-buttons">
              <button
                type="button"
                className="btn-direct-join"
                onClick={onDirectRoomSubmit}
                disabled={!publicDirectRoomInput.trim()}
                title="Direct Instant Video Call (No Wait)"
              >
                <span className="material-symbols-outlined">videocam</span>
                <span>Join Call</span>
              </button>
              <button
                type="button"
                className="btn-direct-chat-join"
                onClick={() => {
                  const clean = publicDirectRoomInput.trim().replace(/^\?chat=/, '').replace(/^\?room=/, '');
                  if (clean) onOpenGeneralChat(clean);
                }}
                disabled={!publicDirectRoomInput.trim()}
                title="Direct Real-Time Chat & Sharing"
              >
                <span className="material-symbols-outlined">forum</span>
                <span>Join Chat</span>
              </button>
            </div>
          </div>
        </div>

        <div className="public-meetings-grid">
          <div className="public-grid-header">
            <h3>Today's Meetings</h3>
            <span className="public-grid-counter">{publicMeetings.length} Scheduled</span>
          </div>

          {isPublicLoading && publicMeetings.length === 0 ? (
            <div className="portal-empty-state">
              <span className="material-symbols-outlined spin">refresh</span>
              <p>Loading live meeting schedule...</p>
            </div>
          ) : publicMeetings.length === 0 ? (
            <div className="portal-empty-state">
              <span className="material-symbols-outlined">event_available</span>
              <p>No public meetings scheduled for today.</p>
              <button
                type="button"
                className="btn-create-instant-public"
                onClick={() => {
                  const newRoom = `pcs-${Math.random().toString(36).substring(2, 9)}`;
                  onDirectJoinMeeting(newRoom);
                }}
              >
                <span className="material-symbols-outlined">add</span>
                <span>Start a New Instant Meeting</span>
              </button>
            </div>
          ) : (
            <div className="public-cards-list">
              {publicMeetings.map((m) => (
                <div key={m.id} className={`public-meeting-card ${m.isLive ? 'is-live-card' : ''}`}>
                  <div className="public-card-meta">
                    {m.isLive ? (
                      <div className="meeting-live-badge is-on">
                        <span className="live-pulse-dot"></span>
                        <span>MEETING IS ON</span>
                      </div>
                    ) : (
                      <div className="meeting-live-badge scheduled">
                        <span className="scheduled-dot"></span>
                        <span>SCHEDULED</span>
                      </div>
                    )}
                    <span className="public-meeting-time">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                      <span>{m.time}</span>
                    </span>
                  </div>

                  <h4 className="public-meeting-title">{m.title}</h4>

                  <div className="public-card-footer">
                    <span className="public-room-code">Room: {m.roomId}</span>
                    <button
                      type="button"
                      className={`btn-join-public-meeting ${m.isLive ? 'primary' : ''}`}
                      onClick={() => onDirectJoinMeeting(m.roomId)}
                    >
                      <span className="material-symbols-outlined">videocam</span>
                      <span>Join Directly</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Room Chat Dock */}
      <FloatingChatDock
        isOpen={isRoomChatOpen}
        room={currentRoom}
        messages={chatMessages}
        guestName={guestName}
        onClose={() => setIsRoomChatOpen(false)}
        onCopyRoomLink={onCopyRoomShareLink}
        chatInputText={chatInputText}
        setChatInputText={setChatInputText}
        chatAttachment={chatAttachment}
        setChatAttachment={setChatAttachment}
        chatFileInputRef={chatFileInputRef}
        handleImageSelect={handleImageSelect}
        handlePasteEvent={handlePasteEvent}
        handleSendChatMessage={handleSendChatMessage}
        chatMessagesEndRef={chatMessagesEndRef}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        handleReplyChatMessage={handleReplyChatMessage}
        handleCopyMessageText={handleCopyMessageText}
        handleDeleteChatMessage={handleDeleteChatMessage}
        onImageClick={setActiveImageLightbox}
      />

      {/* Image Lightbox Viewer */}
      <ImageLightbox
        src={activeImageLightbox}
        onClose={() => setActiveImageLightbox(null)}
      />

      {/* Toast Notice */}
      <Toast message={toastMessage} />
    </div>
  );
};

export default PublicPortalView;
