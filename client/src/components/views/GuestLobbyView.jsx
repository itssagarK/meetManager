import React from 'react';
import FloatingChatDock from '../chat/FloatingChatDock.jsx';
import ImageLightbox from '../common/ImageLightbox.jsx';
import Toast from '../common/Toast.jsx';

export const GuestLobbyView = ({
  currentRoom = '',
  isRoomChatOpen,
  setIsRoomChatOpen,
  handleLoadRoomMessages,
  chatMessages = [],
  callQuality = 'connecting',
  guestKnockStatus = 'idle',
  setGuestKnockStatus,
  guestDeniedReason,
  isHostOnlineInRoom,
  guestName,
  setGuestName,
  guestOfficeId,
  setGuestOfficeId,
  handleGuestDirectQuickJoin,
  handleGuestKnock,
  handleCancelKnock,
  activeCallRoom,
  isCallConnected,
  callStatusText,
  handleCopyGuestLink,
  remoteVideoRef,
  remoteStreamRef,
  localVideoRef,
  localStreamRef,
  screenStreamRef,
  isVideoOff,
  isAudioMuted,
  handleJoinCallRoom,
  setIsGuestMode,
  handleToggleAudio,
  handleToggleVideo,
  handleToggleScreenShare,
  isScreenSharing,
  handleEndCall,
  pendingKnocks = [],
  handleAdmitGuest,
  handleDenyGuest,
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
    <div className="guest-screen-wrapper">
      <header className="guest-header">
        <div className="guest-header-inner">
          <div className="brand-group">
            <span className="brand-logo-badge">PCS</span>
            <h2 className="brand-title">Executive Meeting Room</h2>
          </div>
          <div className="guest-header-meta">
            <span className="guest-room-pill">
              Room: <strong>{currentRoom}</strong>
            </span>
            <button
              type="button"
              className={`guest-header-chat-btn ${isRoomChatOpen ? 'active' : ''}`}
              onClick={() => {
                setIsRoomChatOpen(!isRoomChatOpen);
                if (currentRoom) handleLoadRoomMessages(currentRoom);
              }}
              title="Toggle Work Chat, Links & Images"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>forum</span>
              <span>Chat ({chatMessages.length})</span>
            </button>
            <div className={`call-quality-pill ${callQuality}`}>
              <span className="quality-dot"></span>
              <span className="quality-text">
                {callQuality === 'stable' && 'P2P Direct'}
                {callQuality === 'relayed' && 'TURN Relay'}
                {callQuality === 'connecting' && 'Connecting...'}
                {callQuality === 'reconnecting' && 'Reconnecting...'}
                {callQuality === 'failed' && 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="guest-stage">
        {guestKnockStatus !== 'admitted' ? (
          <div className="guest-lobby-container">
            <div className="guest-lobby-card">
              <div className="guest-lobby-status-banner">
                {isHostOnlineInRoom ? (
                  <div className="meeting-live-badge is-on large">
                    <span className="live-pulse-dot"></span>
                    <span>MEETING IS ON — Host is in the Room</span>
                  </div>
                ) : (
                  <div className="meeting-live-badge scheduled large">
                    <span className="scheduled-dot"></span>
                    <span>Waiting for Host to Start Meeting</span>
                  </div>
                )}
              </div>

              {guestKnockStatus === 'idle' && (
                <div className="guest-checkin-flow">
                  <div className="guest-checkin-header">
                    <span className="material-symbols-outlined guest-badge-icon">videocam</span>
                    <div>
                      <h3>Join Executive Meeting: #{currentRoom}</h3>
                      <p>Join this video call from any phone, laptop, or desktop with one click.</p>
                    </div>
                  </div>

                  <div className="guest-form-group">
                    <label htmlFor="guest-full-name">Your Name (Optional)</label>
                    <input
                      id="guest-full-name"
                      type="text"
                      placeholder="e.g. Sarah Connor (or Guest)"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGuestDirectQuickJoin(currentRoom);
                        }
                      }}
                      autoFocus
                    />
                  </div>

                  <div className="guest-form-group">
                    <label htmlFor="guest-office-id">Office ID / Note (Optional)</label>
                    <input
                      id="guest-office-id"
                      type="text"
                      placeholder="e.g. Mobile User / Remote"
                      value={guestOfficeId}
                      onChange={(e) => setGuestOfficeId(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGuestDirectQuickJoin(currentRoom);
                        }
                      }}
                    />
                  </div>

                  <div className="guest-checkin-actions" style={{ flexDirection: 'column', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-quick-direct-join"
                      style={{ width: '100%', padding: '14px 20px', fontSize: '15px', fontWeight: 'bold' }}
                      onClick={() => handleGuestDirectQuickJoin(currentRoom)}
                      title="Direct instant video call with zero boundaries"
                    >
                      <span className="material-symbols-outlined">videocam</span>
                      <span>Join Video Call Now (Instant)</span>
                    </button>
                    <button
                      type="button"
                      className="btn-knock-join"
                      style={{ width: '100%', padding: '10px 16px', fontSize: '13px' }}
                      onClick={() => handleGuestKnock(currentRoom)}
                      title="Send knock request for host verification"
                    >
                      <span className="material-symbols-outlined">meeting_room</span>
                      <span>Knock & Request Host Admission</span>
                    </button>
                  </div>
                </div>
              )}

              {guestKnockStatus === 'knocking' && (
                <div className="guest-knocking-flow">
                  <div className="radar-spinner"></div>
                  <h3>Knock Request Sent to Host</h3>
                  <p>The meeting host is verifying your Office ID and name.</p>

                  <div className="guest-credential-summary">
                    <div className="summary-field">
                      <span className="summary-label">Name:</span>
                      <strong className="summary-val">{guestName}</strong>
                    </div>
                    <div className="summary-field">
                      <span className="summary-label">Office ID:</span>
                      <strong className="summary-val monospace">{guestOfficeId}</strong>
                    </div>
                    <div className="summary-field">
                      <span className="summary-label">Room:</span>
                      <strong className="summary-val monospace">{currentRoom}</strong>
                    </div>
                  </div>

                  <div className="knocking-status-note">
                    {isHostOnlineInRoom ? (
                      <span>Host is currently in the room and reviewing join requests.</span>
                    ) : (
                      <span>Host has not joined yet. You will be prompted as soon as they enter.</span>
                    )}
                  </div>

                  <div className="knocking-flow-actions">
                    <button
                      type="button"
                      className="btn-bypass-knock"
                      onClick={() => handleGuestDirectQuickJoin(currentRoom)}
                      title="Bypass waiting and connect to call immediately"
                    >
                      <span className="material-symbols-outlined">bolt</span>
                      <span>Direct Quick Join Now (No Wait)</span>
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-knock"
                      onClick={handleCancelKnock}
                    >
                      <span className="material-symbols-outlined">close</span>
                      <span>Cancel Request</span>
                    </button>
                  </div>
                </div>
              )}

              {guestKnockStatus === 'denied' && (
                <div className="guest-denied-flow">
                  <span className="material-symbols-outlined denied-icon">gpp_bad</span>
                  <h3>Admission Declined</h3>
                  <p>{guestDeniedReason || 'The host declined entry for this meeting session.'}</p>
                  <button
                    type="button"
                    className="btn-retry-knock"
                    onClick={() => setGuestKnockStatus('idle')}
                  >
                    <span className="material-symbols-outlined">replay</span>
                    <span>Try Again with Different Details</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeCallRoom ? (
          <div className="guest-video-grid">
            {/* Remote Video Box */}
            <div className="guest-video-box remote">
              <video
                ref={(el) => {
                  if (remoteVideoRef) {
                    remoteVideoRef.current = el;
                    if (el && remoteStreamRef && remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
                      el.srcObject = remoteStreamRef.current;
                      el.play().catch(() => {});
                    }
                  }
                }}
                autoPlay
                playsInline
                className="guest-video-element"
              />
              {!isCallConnected && (
                <div className="guest-waiting-hud">
                  <span className="material-symbols-outlined waiting-icon">video_camera_front</span>
                  <h3>{callStatusText || 'Waiting for host to connect...'}</h3>
                  <p>Share this link with attendees or wait for the host to enter.</p>
                  <button type="button" className="btn-copy-invite" onClick={handleCopyGuestLink}>
                    <span className="material-symbols-outlined">content_copy</span>
                    <span>Copy Meeting Link</span>
                  </button>
                </div>
              )}
              <div className="video-participant-badge">
                Host / Peer {isCallConnected ? '(Live)' : ''}
              </div>
            </div>

            {/* Local Video Box */}
            <div className="guest-video-box local">
              {isVideoOff ? (
                <div className="guest-camera-off-slate">
                  <span className="material-symbols-outlined">videocam_off</span>
                  <span>Camera Off</span>
                </div>
              ) : (
                <video
                  ref={(el) => {
                    if (localVideoRef) {
                      localVideoRef.current = el;
                      const s = (screenStreamRef && screenStreamRef.current) || (localStreamRef && localStreamRef.current);
                      if (el && s && el.srcObject !== s) {
                        el.srcObject = s;
                      }
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="guest-video-element local-mirror"
                />
              )}
              <div className="video-participant-badge">
                You {isAudioMuted ? '(Muted)' : ''}
              </div>
            </div>
          </div>
        ) : (
          <div className="guest-rejoin-card">
            <h2>You have left the meeting</h2>
            <p>You can rejoin this room or switch to the main workspace.</p>
            <div className="guest-rejoin-actions">
              <button
                type="button"
                className="btn-green"
                style={{ height: '38px', padding: '0 18px', fontSize: '13px' }}
                onClick={() => {
                  const r = new URLSearchParams(window.location.search).get('room');
                  if (r) handleJoinCallRoom(r, false);
                }}
              >
                <span className="material-symbols-outlined">videocam</span>
                <span>Rejoin Meeting</span>
              </button>
              <button
                type="button"
                className="btn-blue"
                style={{ height: '38px', padding: '0 18px', fontSize: '13px' }}
                onClick={() => setIsGuestMode(false)}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span>Open Workspace Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {activeCallRoom && guestKnockStatus === 'admitted' && (
        <footer className="guest-controls-bar">
          <button
            type="button"
            className={`guest-ctl-btn ${isAudioMuted ? 'active-mute' : ''}`}
            onClick={handleToggleAudio}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            <span className="material-symbols-outlined">{isAudioMuted ? 'mic_off' : 'mic'}</span>
            <span>{isAudioMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button
            type="button"
            className={`guest-ctl-btn ${isVideoOff ? 'active-mute' : ''}`}
            onClick={handleToggleVideo}
            title={isVideoOff ? 'Start Video' : 'Stop Video'}
          >
            <span className="material-symbols-outlined">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
            <span>{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
          </button>
          <button
            type="button"
            className={`guest-ctl-btn ${isScreenSharing ? 'active-share' : ''}`}
            onClick={handleToggleScreenShare}
            title={isScreenSharing ? 'Stop Share' : 'Share Screen'}
          >
            <span className="material-symbols-outlined">{isScreenSharing ? 'stop_screen_share' : 'screen_share'}</span>
            <span>{isScreenSharing ? 'Stop Share' : 'Share'}</span>
          </button>
          <button
            type="button"
            className={`guest-ctl-btn ${isRoomChatOpen ? 'active-chat' : ''}`}
            onClick={() => {
              setIsRoomChatOpen(!isRoomChatOpen);
              if (currentRoom) handleLoadRoomMessages(currentRoom);
            }}
            title="Toggle Room Chat, Links & Images"
          >
            <span className="material-symbols-outlined">{isRoomChatOpen ? 'speaker_notes_off' : 'forum'}</span>
            <span>Chat ({chatMessages.length})</span>
          </button>
          <button
            type="button"
            className="guest-ctl-btn"
            onClick={handleCopyGuestLink}
            title="Copy Meeting Link"
          >
            <span className="material-symbols-outlined">link</span>
            <span>Copy Link</span>
          </button>
          <button
            type="button"
            className="guest-ctl-btn end-call-btn"
            onClick={handleEndCall}
            title="Leave Call"
          >
            <span className="material-symbols-outlined">call_end</span>
            <span>Leave</span>
          </button>
        </footer>
      )}

      {/* Floating Host Admission Dialog for Knocking Guests */}
      {pendingKnocks.length > 0 && (
        <div className="host-knock-modal-overlay">
          <div className="host-knock-card">
            <div className="host-knock-header">
              <span className="material-symbols-outlined knock-bell-icon">badge</span>
              <div>
                <h3>Guest Requesting Admission ({pendingKnocks.length})</h3>
                <p>Verify Office ID and Full Name before admitting</p>
              </div>
            </div>
            <div className="host-knock-body">
              {pendingKnocks.map((k) => (
                <div key={k.id} className="knock-item-row">
                  <div className="knock-guest-info">
                    <div className="knock-guest-name-row">
                      <span className="knock-guest-name">{k.name}</span>
                      <span className="knock-office-badge">ID: {k.officeId}</span>
                    </div>
                    <span className="knock-room-tag">Room: {k.roomId}</span>
                  </div>
                  <div className="knock-actions">
                    <button
                      type="button"
                      className="btn-admit-guest"
                      onClick={() => handleAdmitGuest(k.id, k.roomId)}
                      title="Admit guest into meeting"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>how_to_reg</span>
                      <span>Admit</span>
                    </button>
                    <button
                      type="button"
                      className="btn-deny-guest"
                      onClick={() => handleDenyGuest(k.id, k.roomId)}
                      title="Decline guest admission"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>block</span>
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Image Lightbox Fullscreen Viewer */}
      <ImageLightbox
        src={activeImageLightbox}
        onClose={() => setActiveImageLightbox(null)}
      />

      {/* Toast Notice */}
      <Toast message={toastMessage} />
    </div>
  );
};

export default GuestLobbyView;
