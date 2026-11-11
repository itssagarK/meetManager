import React from 'react';
import RemoteParticipantTile from '../common/RemoteParticipantTile.jsx';
import { formatMeetingDuration } from '../../utils/dateUtils.js';

export const ConferenceOverlay = ({
  activeCallRoom,
  isCallMinimized,
  setIsCallMinimized,
  meetingDrawerTab,
  setMeetingDrawerTab,
  callDuration = 0,
  connectedPeers = [],
  speakingPeers = new Set(),
  handleEndCall,
  isVideoOff,
  guestName = '',
  isHostInCall,
  localVideoRef,
  screenStreamRef,
  localStreamRef,
  isScreenSharing,
  isAudioMuted,
  handleToggleAudio,
  handleToggleVideo,
  handleToggleScreenShare,
  callQuality = 'connecting',
  meetingLayout = 'grid',
  setMeetingLayout,
  pinnedParticipant,
  setPinnedParticipant,
  handleToggleFullscreen,
  isCallFullscreen,
  isLocalSpeaking,
  isHandRaised,
  handleToggleRaiseHand,
  callStatusText,
  handleCopyGuestLink,
  pendingKnocks = [],
  handleAdmitKnockGuest,
  handleDenyKnockGuest,
  chatMessages = [],
  handleLoadRoomMessages,
  setActiveImageLightbox,
  chatMessagesEndRef,
  replyingTo,
  setReplyingTo,
  chatFileInputRef,
  handleImageSelect,
  chatInputText,
  setChatInputText,
  chatAttachment,
  handleSendChatMessage,
  publicBaseUrl,
  getPublicWebOrigin,
  showToast,
  isRecording = false,
  isRecordingPaused = false,
  recordingDuration = 0,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
}) => {
  if (!activeCallRoom) return null;

  return (
    <div className={`google-meet-stage ${isCallMinimized ? 'meet-pip-mode' : 'meet-stage-fullscreen'} ${meetingDrawerTab ? 'with-drawer' : ''}`}>
      {isCallMinimized ? (
        /* Minimized Picture-in-Picture Mode (Multitask in Dashboard) */
        <div className="meet-pip-container">
          <div className="meet-pip-header">
            <div className="meet-pip-title">
              <span className="live-call-indicator"></span>
              <span className="meet-pip-room">#{activeCallRoom}</span>
              <span className="meet-pip-timer">{formatMeetingDuration(callDuration)}</span>
              {isRecording && (
                <span className={`meet-pip-rec-pill ${isRecordingPaused ? 'is-paused' : 'is-recording'}`} title={isRecordingPaused ? 'Recording Paused' : 'Recording Live'}>
                  <span className="rec-mini-dot"></span>
                  <span>REC</span>
                </span>
              )}
              <span className="meet-pip-participants-badge">{connectedPeers.length + 1}</span>
            </div>
            <div className="meet-pip-actions">
              <button
                type="button"
                className="meet-pip-btn"
                onClick={() => setIsCallMinimized(false)}
                title="Expand to Full Google Meet Stage"
              >
                <span className="material-symbols-outlined">open_in_full</span>
              </button>
              <button
                type="button"
                className="meet-pip-btn pip-close-btn"
                onClick={handleEndCall}
                title="End Call"
              >
                <span className="material-symbols-outlined">call_end</span>
              </button>
            </div>
          </div>
          <div className="meet-pip-video-wrap">
            {(() => {
              const activePipPeer = connectedPeers.find((p) => speakingPeers.has(p.peerId)) || connectedPeers[0];
              if (activePipPeer) {
                if (activePipPeer.isVideoOff || !activePipPeer.stream) {
                  return (
                    <div className="meet-pip-avatar">
                      <span>{(activePipPeer.name || 'P').charAt(0).toUpperCase()}</span>
                    </div>
                  );
                }
                return (
                  <video
                    ref={(el) => {
                      if (el && activePipPeer.stream && el.srcObject !== activePipPeer.stream) {
                        el.srcObject = activePipPeer.stream;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    className="meet-pip-video"
                  />
                );
              }
              if (isVideoOff) {
                return (
                  <div className="meet-pip-avatar">
                    <span>{guestName ? guestName.charAt(0).toUpperCase() : 'Y'}</span>
                  </div>
                );
              }
              return (
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
                  className={`meet-pip-video ${isScreenSharing ? '' : 'local-mirror'}`}
                />
              );
            })()}
            {connectedPeers.length > 0 && (
              <div className="meet-pip-thumb">
                {isVideoOff ? (
                  <div className="meet-pip-thumb-avatar">Y</div>
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
                    className={`meet-pip-thumb-video ${isScreenSharing ? '' : 'local-mirror'}`}
                  />
                )}
              </div>
            )}
          </div>
          <div className="meet-pip-controls">
            <button
              type="button"
              className={`meet-pip-ctl-btn ${isAudioMuted ? 'muted' : ''}`}
              onClick={handleToggleAudio}
              title={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              <span className="material-symbols-outlined">{isAudioMuted ? 'mic_off' : 'mic'}</span>
            </button>
            <button
              type="button"
              className={`meet-pip-ctl-btn ${isVideoOff ? 'muted' : ''}`}
              onClick={handleToggleVideo}
              title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
            >
              <span className="material-symbols-outlined">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
            </button>
            <button
              type="button"
              className="meet-pip-ctl-btn expand-btn"
              onClick={() => setIsCallMinimized(false)}
              title="Expand to Full Google Meet Stage"
            >
              <span className="material-symbols-outlined">fullscreen</span>
            </button>
            <button
              type="button"
              className="meet-pip-ctl-btn end-btn"
              onClick={handleEndCall}
              title="Leave Call"
            >
              <span className="material-symbols-outlined">call_end</span>
            </button>
          </div>
        </div>
      ) : (
        /* Full Immersive Google Meet Stage */
        <div className="meet-stage-inner">
          {/* Top Header Bar */}
          <header className="meet-top-bar">
            <div className="meet-top-left">
              <div className="meet-brand-chip">
                <span className="material-symbols-outlined brand-meet-icon">video_camera_front</span>
                <span className="meet-room-code-tag">#{activeCallRoom}</span>
              </div>
              <div className="meet-clock-chip">
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
                <span>{formatMeetingDuration(callDuration)}</span>
              </div>
              {isRecording && (
                <div
                  className={`meet-rec-badge ${isRecordingPaused ? 'is-paused' : 'is-recording'}`}
                  title={isRecordingPaused ? 'Meeting Recording Paused' : 'Meeting Recording Active'}
                >
                  <span className="rec-dot"></span>
                  <span>{isRecordingPaused ? 'PAUSED' : 'REC'} {formatMeetingDuration(recordingDuration)}</span>
                </div>
              )}
              <div className={`meet-quality-badge ${callQuality}`} title={`Network Status: ${callQuality}`}>
                <span className="quality-dot"></span>
                <span>{callQuality === 'stable' ? 'P2P Direct' : callQuality === 'relayed' ? 'Relay' : 'Connecting'}</span>
              </div>
              <div className="meet-e2e-badge" title="WebRTC End-to-End Direct Connection">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
                <span>Direct P2P</span>
              </div>
            </div>

            <div className="meet-top-right">
              <button
                type="button"
                className={`meet-top-btn ${meetingLayout === 'spotlight' ? 'active' : ''}`}
                onClick={() => {
                  setMeetingLayout((prev) => (prev === 'grid' ? 'spotlight' : 'grid'));
                  if (meetingLayout === 'grid') {
                    setPinnedParticipant(connectedPeers.length > 0 ? connectedPeers[0].peerId : 'local');
                  } else {
                    setPinnedParticipant(null);
                  }
                }}
                title={meetingLayout === 'grid' ? 'Switch to Spotlight View' : 'Switch to Grid View'}
              >
                <span className="material-symbols-outlined">
                  {meetingLayout === 'grid' ? 'featured_video' : 'grid_view'}
                </span>
                <span>{meetingLayout === 'grid' ? 'Spotlight' : 'Grid'}</span>
              </button>
              <button
                type="button"
                className="meet-top-btn"
                onClick={() => setIsCallMinimized(true)}
                title="Minimize to Picture-in-Picture (Continue in Dashboard)"
              >
                <span className="material-symbols-outlined">picture_in_picture_alt</span>
                <span>Minimize</span>
              </button>
              <button
                type="button"
                className="meet-top-btn icon-only"
                onClick={handleToggleFullscreen}
                title={isCallFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                <span className="material-symbols-outlined">
                  {isCallFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </span>
              </button>
            </div>
          </header>

          {/* Center Stage Body */}
          <div className="meet-stage-body">
            {(() => {
              const totalCallCount = connectedPeers.length + 1;
              const gridCountClass = totalCallCount === 1
                ? 'grid-count-1'
                : totalCallCount === 2
                ? 'grid-count-2'
                : totalCallCount <= 4
                ? 'grid-count-4'
                : totalCallCount <= 6
                ? 'grid-count-6'
                : totalCallCount <= 9
                ? 'grid-count-9'
                : 'grid-count-many';

              const renderLocalTile = (isSpotHero = false) => (
                <div
                  key="local-user-tile"
                  className={`meet-video-tile local-tile ${isLocalSpeaking ? 'speaking' : ''} ${isSpotHero ? 'is-pinned-hero' : ''}`}
                >
                  {isVideoOff ? (
                    <div className="meet-avatar-placeholder">
                      <div className={`meet-avatar-circle local-avatar-circle ${isLocalSpeaking ? 'pulse-speaking' : ''}`}>
                        <span>{guestName ? guestName.charAt(0).toUpperCase() : (isHostInCall ? 'H' : 'Y')}</span>
                      </div>
                      <div className="meet-avatar-label">Camera is off</div>
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
                      className={`meet-video-element ${isScreenSharing ? '' : 'local-mirror'}`}
                    />
                  )}
                  <div className="meet-name-pill">
                    <span className={`mic-badge ${isAudioMuted ? 'muted' : ''}`}>
                      <span className="material-symbols-outlined">
                        {isAudioMuted ? 'mic_off' : 'mic'}
                      </span>
                    </span>
                    <span className="participant-title">
                      You {isHostInCall ? '(Host)' : ''}
                    </span>
                    {isHandRaised && (
                      <span className="raised-hand-badge">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>front_hand</span>
                        <span>You raised hand</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="meet-tile-pin-btn"
                    onClick={() => {
                      if (pinnedParticipant === 'local') {
                        setPinnedParticipant(null);
                        setMeetingLayout('grid');
                      } else {
                        setPinnedParticipant('local');
                        setMeetingLayout('spotlight');
                      }
                    }}
                    title={pinnedParticipant === 'local' ? 'Unpin' : 'Pin to spotlight'}
                  >
                    <span className="material-symbols-outlined">
                      {pinnedParticipant === 'local' ? 'keep_off' : 'push_pin'}
                    </span>
                  </button>
                </div>
              );

              if (meetingLayout === 'spotlight') {
                const pinnedPeer = pinnedParticipant === 'local' ? null : (connectedPeers.find((p) => p.peerId === pinnedParticipant) || connectedPeers[0]);
                const isLocalHero = pinnedParticipant === 'local' || (!pinnedPeer && connectedPeers.length === 0);

                return (
                  <div className="meet-video-canvas spotlight-layout">
                    <div className="meet-spotlight-hero">
                      {isLocalHero ? (
                        renderLocalTile(true)
                      ) : (
                        <RemoteParticipantTile
                          peer={pinnedPeer}
                          isSpeaking={speakingPeers.has(pinnedPeer.peerId)}
                          isPinned={true}
                          onPin={() => {
                            setPinnedParticipant(null);
                            setMeetingLayout('grid');
                          }}
                        />
                      )}
                    </div>
                    <div className="meet-filmstrip">
                      {!isLocalHero && (
                        <div className="filmstrip-tile">
                          {renderLocalTile(false)}
                        </div>
                      )}
                      {connectedPeers
                        .filter((p) => isLocalHero || p.peerId !== pinnedPeer?.peerId)
                        .map((p) => (
                          <div key={p.peerId} className="filmstrip-tile">
                            <RemoteParticipantTile
                              peer={p}
                              isSpeaking={speakingPeers.has(p.peerId)}
                              isPinned={false}
                              onPin={() => {
                                setPinnedParticipant(p.peerId);
                                setMeetingLayout('spotlight');
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                );
              }

              return (
                <div className={`meet-video-canvas grid-mode ${gridCountClass}`}>
                  {renderLocalTile(false)}
                  {connectedPeers.map((peer) => (
                    <RemoteParticipantTile
                      key={peer.peerId}
                      peer={peer}
                      isSpeaking={speakingPeers.has(peer.peerId)}
                      isPinned={false}
                      onPin={() => {
                        setPinnedParticipant(peer.peerId);
                        setMeetingLayout('spotlight');
                      }}
                    />
                  ))}
                  {connectedPeers.length === 0 && (
                    <div className="meet-video-tile meet-waiting-tile">
                      <div className="meet-waiting-hud">
                        <div className="meet-waiting-pulse-avatar">
                          <span className="material-symbols-outlined">group_add</span>
                        </div>
                        <h3 className="meet-waiting-title">Ready for your meeting</h3>
                        <p className="meet-waiting-desc">
                          {callStatusText || 'Waiting for other participants to join the call...'}
                        </p>
                        <div className="meet-waiting-actions">
                          <button
                            type="button"
                            className="meet-waiting-copy-btn"
                            onClick={handleCopyGuestLink}
                          >
                            <span className="material-symbols-outlined">content_copy</span>
                            <span>Copy Joining Link</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Pending Knock Banner for Host */}
            {pendingKnocks.length > 0 && isHostInCall && (
              <div className="meet-knocking-alert-strip">
                <span className="material-symbols-outlined alert-icon">doorbell</span>
                <div className="knocking-text">
                  <strong>{pendingKnocks[0].name}</strong> ({pendingKnocks[0].officeId})
                  {pendingKnocks.length > 1 ? ` and ${pendingKnocks.length - 1} other${pendingKnocks.length > 2 ? 's' : ''}` : ''} wants to join this meeting.
                </div>
                <div className="knocking-btns">
                  <button
                    type="button"
                    className="btn-admit"
                    onClick={() => handleAdmitKnockGuest(pendingKnocks[0].id)}
                  >
                    Admit
                  </button>
                  {pendingKnocks.length > 1 && (
                    <button
                      type="button"
                      className="btn-admit-all"
                      onClick={() => {
                        pendingKnocks.forEach((k) => handleAdmitKnockGuest(k.id));
                      }}
                    >
                      Admit All ({pendingKnocks.length})
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-deny"
                    onClick={() => handleDenyKnockGuest(pendingKnocks[0].id)}
                  >
                    Deny
                  </button>
                </div>
              </div>
            )}

            {/* Google Meet Floating Bottom Pill Bar */}
            <footer className="meet-bottom-pill-dock">
              {/* Audio Toggle */}
              <button
                type="button"
                className={`meet-dock-btn ${isAudioMuted ? 'btn-danger' : ''}`}
                onClick={handleToggleAudio}
                title={isAudioMuted ? 'Turn on microphone (Ctrl+D)' : 'Turn off microphone (Ctrl+D)'}
              >
                <span className="material-symbols-outlined">
                  {isAudioMuted ? 'mic_off' : 'mic'}
                </span>
              </button>

              {/* Video Toggle */}
              <button
                type="button"
                className={`meet-dock-btn ${isVideoOff ? 'btn-danger' : ''}`}
                onClick={handleToggleVideo}
                title={isVideoOff ? 'Turn on camera (Ctrl+E)' : 'Turn off camera (Ctrl+E)'}
              >
                <span className="material-symbols-outlined">
                  {isVideoOff ? 'videocam_off' : 'videocam'}
                </span>
              </button>

              {/* Screen Share */}
              <button
                type="button"
                className={`meet-dock-btn ${isScreenSharing ? 'btn-active-blue' : ''}`}
                onClick={handleToggleScreenShare}
                title={isScreenSharing ? 'Stop presenting' : 'Present now / Share screen'}
              >
                <span className="material-symbols-outlined">
                  {isScreenSharing ? 'stop_screen_share' : 'present_to_all'}
                </span>
              </button>

              {/* Raise Hand */}
              <button
                type="button"
                className={`meet-dock-btn ${isHandRaised ? 'btn-active-amber' : ''}`}
                onClick={handleToggleRaiseHand}
                title={isHandRaised ? 'Lower hand' : 'Raise hand'}
              >
                <span className="material-symbols-outlined">front_hand</span>
              </button>

              {/* Meeting Recording Controls */}
              {!isRecording ? (
                <button
                  type="button"
                  className="meet-dock-btn btn-start-record"
                  onClick={onStartRecording}
                  title="Record Meeting (Capture Video + Mixed Audio)"
                >
                  <span className="material-symbols-outlined rec-icon-red">radio_button_checked</span>
                </button>
              ) : (
                <div className="meet-dock-rec-group">
                  <button
                    type="button"
                    className={`meet-dock-btn btn-recording ${isRecordingPaused ? 'btn-rec-paused' : ''}`}
                    onClick={isRecordingPaused ? onResumeRecording : onPauseRecording}
                    title={isRecordingPaused ? 'Resume Recording' : 'Pause Recording'}
                  >
                    <span className="material-symbols-outlined">
                      {isRecordingPaused ? 'play_arrow' : 'pause'}
                    </span>
                    <span className="dock-rec-dot-indicator"></span>
                  </button>
                  <button
                    type="button"
                    className="meet-dock-btn btn-rec-stop"
                    onClick={onStopRecording}
                    title="Stop Recording & Review"
                  >
                    <span className="material-symbols-outlined">stop</span>
                  </button>
                </div>
              )}

              {/* In-Call Chat */}
              <button
                type="button"
                className={`meet-dock-btn ${meetingDrawerTab === 'chat' ? 'btn-active-blue' : ''}`}
                onClick={() => {
                  setMeetingDrawerTab((prev) => (prev === 'chat' ? null : 'chat'));
                  if (handleLoadRoomMessages) handleLoadRoomMessages(activeCallRoom);
                }}
                title="In-call messages"
              >
                <span className="material-symbols-outlined">chat</span>
                {chatMessages.length > 0 && (
                  <span className="dock-badge">{chatMessages.length}</span>
                )}
              </button>

              {/* People */}
              <button
                type="button"
                className={`meet-dock-btn ${meetingDrawerTab === 'people' ? 'btn-active-blue' : ''}`}
                onClick={() => setMeetingDrawerTab((prev) => (prev === 'people' ? null : 'people'))}
                title="People"
              >
                <span className="material-symbols-outlined">group</span>
                <span className="dock-badge">{connectedPeers.length + 1}</span>
              </button>

              {/* Meeting Info */}
              <button
                type="button"
                className={`meet-dock-btn ${meetingDrawerTab === 'info' ? 'btn-active-blue' : ''}`}
                onClick={() => setMeetingDrawerTab((prev) => (prev === 'info' ? null : 'info'))}
                title="Meeting details"
              >
                <span className="material-symbols-outlined">info</span>
              </button>

              {/* End / Leave Call */}
              <button
                type="button"
                className="meet-dock-btn meet-end-btn"
                onClick={handleEndCall}
                title="Leave call"
              >
                <span className="material-symbols-outlined">call_end</span>
              </button>
            </footer>

            {/* Right Slide-Out Side Drawer */}
            {meetingDrawerTab && (
              <aside className="meet-side-drawer">
                <div className="meet-drawer-header">
                  <h3 className="meet-drawer-title">
                    {meetingDrawerTab === 'chat' && 'In-call messages'}
                    {meetingDrawerTab === 'people' && `People (${connectedPeers.length + 1})`}
                    {meetingDrawerTab === 'info' && 'Meeting details'}
                  </h3>
                  <div className="meet-drawer-hdr-actions">
                    <div className="meet-drawer-tab-switch">
                      <button
                        type="button"
                        className={`drawer-tab-btn ${meetingDrawerTab === 'chat' ? 'active' : ''}`}
                        onClick={() => setMeetingDrawerTab('chat')}
                        title="Messages"
                      >
                        <span className="material-symbols-outlined">chat</span>
                      </button>
                      <button
                        type="button"
                        className={`drawer-tab-btn ${meetingDrawerTab === 'people' ? 'active' : ''}`}
                        onClick={() => setMeetingDrawerTab('people')}
                        title="People"
                      >
                        <span className="material-symbols-outlined">group</span>
                      </button>
                      <button
                        type="button"
                        className={`drawer-tab-btn ${meetingDrawerTab === 'info' ? 'active' : ''}`}
                        onClick={() => setMeetingDrawerTab('info')}
                        title="Details"
                      >
                        <span className="material-symbols-outlined">info</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      className="meet-drawer-close-btn"
                      onClick={() => setMeetingDrawerTab(null)}
                      title="Close side panel"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>

                {/* Drawer Content */}
                <div className="meet-drawer-body">
                  {/* Chat Tab */}
                  {meetingDrawerTab === 'chat' && (
                    <div className="meet-drawer-chat-wrap">
                      <div className="meet-chat-disclaimer">
                        <span className="material-symbols-outlined">info</span>
                        <span>Messages can be seen by participants in this call and are saved for this room.</span>
                      </div>

                      <div className="meet-drawer-chat-scroll">
                        {chatMessages.length === 0 ? (
                          <div className="meet-chat-empty">
                            <span className="material-symbols-outlined empty-icon">forum</span>
                            <p>No messages yet. Send a message to start chatting in the meeting!</p>
                          </div>
                        ) : (
                          chatMessages.map((msg, idx) => {
                            const isMe = msg.sender_name === (guestName.trim() || 'Colleague') || msg.sender_name === 'Host';
                            return (
                              <div key={msg.id || idx} className={`meet-chat-msg-row ${isMe ? 'mine' : 'theirs'}`}>
                                <div className="meet-chat-msg-avatar">
                                  {(msg.sender_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="meet-chat-msg-bubble">
                                  <div className="meet-chat-msg-meta">
                                    <span className="sender">{msg.sender_name || 'User'}</span>
                                    <span className="time">
                                      {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                  </div>
                                  {msg.reply_to_content && (
                                    <div className="meet-chat-reply-quote">
                                      <strong>{msg.reply_to_sender || 'Replying to'}:</strong> {msg.reply_to_content}
                                    </div>
                                  )}
                                  <div className="meet-chat-msg-text">{msg.content}</div>
                                  {msg.attachment_url && (
                                    <div className="meet-chat-msg-attachment">
                                      <img
                                        src={msg.attachment_url}
                                        alt={msg.attachment_name || 'Attachment'}
                                        onClick={() => setActiveImageLightbox && setActiveImageLightbox(msg.attachment_url)}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatMessagesEndRef} />
                      </div>

                      {/* Chat Input */}
                      <div className="meet-drawer-chat-input-box">
                        {replyingTo && (
                          <div className="meet-reply-banner">
                            <div className="reply-info">
                              <span>Replying to <strong>{replyingTo.sender}</strong></span>
                              <p>{replyingTo.content}</p>
                            </div>
                            <button type="button" onClick={() => setReplyingTo(null)}>
                              <span className="material-symbols-outlined">close</span>
                            </button>
                          </div>
                        )}
                        <div className="meet-input-row">
                          <input
                            type="file"
                            ref={chatFileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                          <button
                            type="button"
                            className="meet-input-action-btn"
                            onClick={() => chatFileInputRef.current && chatFileInputRef.current.click()}
                            title="Attach Image"
                          >
                            <span className="material-symbols-outlined">attach_file</span>
                          </button>
                          <input
                            type="text"
                            className="meet-chat-text-input"
                            placeholder="Send a message to everyone..."
                            value={chatInputText}
                            onChange={(e) => setChatInputText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChatMessage(activeCallRoom);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="meet-input-send-btn"
                            disabled={!chatInputText.trim() && !chatAttachment}
                            onClick={() => handleSendChatMessage(activeCallRoom)}
                            title="Send message"
                          >
                            <span className="material-symbols-outlined">send</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* People Tab */}
                  {meetingDrawerTab === 'people' && (
                    <div className="meet-drawer-people-wrap">
                      <button
                        type="button"
                        className="meet-drawer-add-people-btn"
                        onClick={handleCopyGuestLink}
                      >
                        <span className="material-symbols-outlined">person_add</span>
                        <span>Add people / Copy Invite Link</span>
                      </button>

                      {/* Waiting Knock Requests */}
                      {pendingKnocks.length > 0 && (
                        <div className="meet-people-section">
                          <div className="meet-people-section-hdr" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Waiting Lobby ({pendingKnocks.length})</span>
                            {pendingKnocks.length > 1 && isHostInCall && (
                              <button
                                type="button"
                                className="btn-admit-all"
                                style={{ fontSize: '11px', padding: '3px 10px' }}
                                onClick={() => {
                                  pendingKnocks.forEach((k) => handleAdmitKnockGuest(k.id));
                                }}
                              >
                                Admit All
                              </button>
                            )}
                          </div>
                          {pendingKnocks.map((k) => (
                            <div key={k.id} className="meet-person-knock-card">
                              <div className="knock-avatar">{k.name.charAt(0).toUpperCase()}</div>
                              <div className="knock-details">
                                <span className="name">{k.name}</span>
                                <span className="office">{k.officeId}</span>
                              </div>
                              <div className="knock-actions">
                                <button
                                  type="button"
                                  className="knock-btn admit"
                                  onClick={() => handleAdmitKnockGuest(k.id)}
                                >
                                  Admit
                                </button>
                                <button
                                  type="button"
                                  className="knock-btn deny"
                                  onClick={() => handleDenyKnockGuest(k.id)}
                                >
                                  Deny
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* In-Call Participants */}
                      <div className="meet-people-section">
                        <div className="meet-people-section-hdr">
                          In call ({connectedPeers.length + 1})
                        </div>
                        <div className="meet-person-card">
                          <div className="person-avatar local-avatar">
                            {guestName ? guestName.charAt(0).toUpperCase() : (isHostInCall ? 'H' : 'Y')}
                          </div>
                          <div className="person-info">
                            <span className="person-name">You {isHostInCall ? '(Meeting Host)' : ''}</span>
                            <span className="person-role">{isHostInCall ? 'Host' : 'Participant'}</span>
                          </div>
                          <div className="person-badges">
                            {isHandRaised && (
                              <span className="hand-icon material-symbols-outlined" title="Hand raised">
                                front_hand
                              </span>
                            )}
                            <span
                              className={`mic-icon material-symbols-outlined ${isAudioMuted ? 'muted' : ''}`}
                              title={isAudioMuted ? 'Muted' : 'Microphone on'}
                            >
                              {isAudioMuted ? 'mic_off' : 'mic'}
                            </span>
                          </div>
                        </div>

                        {connectedPeers.map((peer) => {
                          const pInit = (peer.name || 'P').charAt(0).toUpperCase();
                          return (
                            <div key={peer.peerId} className="meet-person-card">
                              <div className="person-avatar remote-avatar">{pInit}</div>
                              <div className="person-info">
                                <span className="person-name">
                                  {peer.name || 'Participant'} {peer.officeId ? `(${peer.officeId})` : ''}
                                </span>
                                <span className="person-role">{peer.isHost ? 'Meeting Host' : 'Participant'}</span>
                              </div>
                              <div className="person-badges">
                                {peer.isHandRaised && (
                                  <span className="hand-icon material-symbols-outlined" title="Hand raised">
                                    front_hand
                                  </span>
                                )}
                                <span
                                  className={`mic-icon material-symbols-outlined ${peer.isAudioMuted ? 'muted' : ''}`}
                                  title={peer.isAudioMuted ? 'Muted' : 'Microphone on'}
                                >
                                  {peer.isAudioMuted ? 'mic_off' : 'mic'}
                                </span>
                                <button
                                  type="button"
                                  className="person-action-btn"
                                  onClick={() => {
                                    if (pinnedParticipant === peer.peerId) {
                                      setPinnedParticipant(null);
                                      setMeetingLayout('grid');
                                    } else {
                                      setPinnedParticipant(peer.peerId);
                                      setMeetingLayout('spotlight');
                                    }
                                  }}
                                  title={pinnedParticipant === peer.peerId ? 'Unpin' : 'Spotlight participant'}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                    {pinnedParticipant === peer.peerId ? 'keep_off' : 'push_pin'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Meeting Details Tab */}
                  {meetingDrawerTab === 'info' && (
                    <div className="meet-drawer-info-wrap">
                      <div className="meet-info-block">
                        <h4>Joining info</h4>
                        <p className="meet-info-desc">
                          Share this meeting code or direct link with colleagues to join instantly with no boundaries.
                        </p>
                        <div className="meet-code-card">
                          <span className="meet-code-label">Room Code</span>
                          <div className="meet-code-value">#{activeCallRoom}</div>
                          <button
                            type="button"
                            className="meet-info-copy-btn"
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(activeCallRoom);
                                if (showToast) showToast('Room code copied');
                              }
                            }}
                          >
                            <span className="material-symbols-outlined">content_copy</span>
                            <span>Copy code</span>
                          </button>
                        </div>

                        <div className="meet-link-card">
                          <span className="meet-code-label">Direct Meeting Link</span>
                          <div className="meet-link-url">
                            {`${publicBaseUrl || (getPublicWebOrigin ? getPublicWebOrigin() : window.location.origin)}?room=${activeCallRoom}`}
                          </div>
                          <button
                            type="button"
                            className="meet-info-copy-btn"
                            onClick={handleCopyGuestLink}
                          >
                            <span className="material-symbols-outlined">link</span>
                            <span>Copy joining link</span>
                          </button>
                        </div>
                      </div>

                      <div className="meet-info-block">
                        <h4>Security &amp; Encryption</h4>
                        <div className="meet-security-item">
                          <span className="material-symbols-outlined ok-icon">verified_user</span>
                          <div>
                            <strong>Peer-to-Peer Encrypted</strong>
                            <p>WebRTC DTLS-SRTP audio &amp; video streams are transmitted directly between peers.</p>
                          </div>
                        </div>
                        <div className="meet-security-item">
                          <span className="material-symbols-outlined ok-icon">bolt</span>
                          <div>
                            <strong>Zero Boundaries Quick Join</strong>
                            <p>External attendees can join directly via browser without installing software.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConferenceOverlay;
