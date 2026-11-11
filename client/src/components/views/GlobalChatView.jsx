import React from 'react';
import ChatMessageContent from '../chat/ChatMessageContent.jsx';
import ImageLightbox from '../common/ImageLightbox.jsx';
import Toast from '../common/Toast.jsx';
import { getChatDayLabel, shouldShowDateSeparator } from '../../utils/dateUtils.js';

export const GlobalChatView = ({
  currentChat = 'general',
  guestName = '',
  setGuestName,
  showToast,
  onCopyChatShareLink,
  setIsCreateRoomModalOpen,
  onReturnToDashboard,
  chatOnlineCount = 1,
  chatMessages = [],
  isDraggingOverChat,
  handlePasteEvent,
  handleChatScroll,
  handleChatDragOver,
  handleChatDragLeave,
  handleChatDrop,
  showScrollDown,
  scrollToBottom,
  unreadWhileScrolled = 0,
  typingUsers = [],
  replyingTo,
  setReplyingTo,
  chatAttachment,
  setChatAttachment,
  chatFileInputRef,
  handleImageSelect,
  chatInputText,
  handleChatInputChange,
  handleSendChatMessage,
  chatMessagesEndRef,
  handleReplyChatMessage,
  handleCopyMessageText,
  handleDeleteChatMessage,
  activeImageLightbox,
  setActiveImageLightbox,
  toastMessage,
  // Create / Switch room modal props
  isCreateRoomModalOpen,
  handleCreateNewRoom,
  newRoomInputCode,
  setNewRoomInputCode,
}) => {
  return (
    <div className="global-chat-page-wrapper">
      <header className="global-chat-header">
        <div className="global-chat-header-inner">
          <div className="brand-group">
            <span className="brand-logo-badge">PCS</span>
            <div>
              <div className="chat-title-row">
                <h2 className="brand-title">Global Work Chat</h2>
                <span className="chat-room-badge">#{currentChat}</span>
              </div>
              <span className="chat-sub-hint">Instant text, link, and screenshot collaboration</span>
            </div>
          </div>

          <div className="global-chat-header-actions">
            <div className="chat-identity-pill">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
              <span>{guestName.trim() || 'Colleague'}</span>
              <button
                type="button"
                className="btn-edit-identity"
                title="Change your display name"
                onClick={() => {
                  const next = prompt('Enter your display name:', guestName || 'Colleague');
                  if (next && next.trim()) {
                    setGuestName(next.trim());
                    sessionStorage.setItem('pcs_guest_name', next.trim());
                    showToast(`Display name set to ${next.trim()}`);
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
              </button>
            </div>

            <button
              type="button"
              className="btn-chat-copy-link"
              onClick={() => onCopyChatShareLink(currentChat)}
              title="Copy shareable link for this room"
            >
              <span className="material-symbols-outlined">share</span>
              <span className="btn-text-desktop">Share Room</span>
            </button>

            <button
              type="button"
              className="btn-chat-switch-room"
              onClick={() => setIsCreateRoomModalOpen(true)}
              title="Create or join another room"
            >
              <span className="material-symbols-outlined">swap_horiz</span>
              <span className="btn-text-desktop">Switch Room</span>
            </button>

            <button
              type="button"
              className="btn-switch-workspace"
              onClick={onReturnToDashboard}
              title="Return to Workspace Dashboard"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="btn-text-desktop">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="global-chat-stage">
        <div className="global-chat-card">
          {/* Room Welcome Header */}
          <div className="global-chat-banner">
            <div className="banner-info">
              <span className="material-symbols-outlined banner-icon">lock_open</span>
              <div>
                <strong>Room #{currentChat}</strong>
                <p>Open work stream. Anyone with the room code or link can join and share instantly from any device.</p>
              </div>
            </div>
            <div className="banner-stats">
              <div className="chat-online-indicator">
                <span className="pulse-green-dot"></span>
                <span className="online-count-label">
                  {chatOnlineCount} {chatOnlineCount === 1 ? 'member online' : 'members online'}
                </span>
              </div>
              <span className="message-count-badge">{chatMessages.length} messages</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            className={`global-chat-messages-container ${isDraggingOverChat ? 'is-drag-over' : ''}`}
            onPaste={handlePasteEvent}
            onScroll={handleChatScroll}
            onDragOver={handleChatDragOver}
            onDragLeave={handleChatDragLeave}
            onDrop={handleChatDrop}
          >
            {isDraggingOverChat && (
              <div className="chat-dropzone-overlay">
                <span className="material-symbols-outlined drop-icon">cloud_upload</span>
                <p>Drop image or screenshot here to share instantly</p>
              </div>
            )}

            {chatMessages.length === 0 ? (
              <div className="global-chat-empty-state">
                <span className="material-symbols-outlined empty-icon">forum</span>
                <h3>Welcome to #{currentChat}</h3>
                <p>No messages yet. Send a quick update, paste a screenshot, or share a link to start collaborating.</p>
                <div className="empty-state-tips">
                  <span className="tip-item">
                    <span className="material-symbols-outlined">link</span>
                    Links are automatically converted into clickable buttons
                  </span>
                  <span className="tip-item">
                    <span className="material-symbols-outlined">image</span>
                    Paste or upload screenshots with high-res Lightbox viewing
                  </span>
                </div>
              </div>
            ) : (
              <div className="global-chat-messages-list">
                {chatMessages.map((msg, idx) => {
                  const isSelf =
                    (guestName && msg.sender_name === guestName) ||
                    msg.sender_id === (sessionStorage.getItem('pcs_guest_office_id') || sessionStorage.getItem('pcs_user_id'));
                  const initial = (msg.sender_name || 'U').charAt(0).toUpperCase();
                  const domId = `chat-msg-${msg.id || msg.client_msg_id || idx}`;
                  const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
                  const showDateSep = shouldShowDateSeparator(msg.created_at, prevMsg?.created_at);
                  const dateLabel = showDateSep ? getChatDayLabel(msg.created_at) : null;

                  return (
                    <React.Fragment key={msg.id || msg.client_msg_id || idx}>
                      {dateLabel && (
                        <div className="chat-date-separator">
                          <span className="date-chip">{dateLabel}</span>
                        </div>
                      )}
                      <div
                        id={domId}
                        className={`global-chat-msg-row ${isSelf ? 'msg-outgoing' : 'msg-incoming'} ${msg.is_deleted ? 'msg-is-deleted' : ''}`}
                      >
                        {!isSelf && (
                          <div className="chat-avatar-bubble" title={msg.sender_name}>
                            {initial}
                          </div>
                        )}
                        <div className="chat-bubble-content">
                          <div className="chat-bubble-meta">
                            <span className="chat-sender-name">{msg.sender_name || 'Colleague'}</span>
                            <div className="chat-meta-right">
                              <span className="chat-time-tag">
                                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                              {isSelf && !msg.is_deleted && (
                                <span className="chat-read-receipt" title="Delivered">
                                  <span className="material-symbols-outlined receipt-icon">done_all</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <ChatMessageContent msg={msg} onImageClick={setActiveImageLightbox} />
                          {!msg.is_deleted && (
                            <div className="chat-bubble-actions">
                              <button
                                type="button"
                                className="btn-bubble-action"
                                onClick={() => handleReplyChatMessage(msg)}
                                title="Reply to message"
                              >
                                <span className="material-symbols-outlined">reply</span>
                              </button>
                              {msg.content && (
                                <button
                                  type="button"
                                  className="btn-bubble-action"
                                  onClick={() => handleCopyMessageText(msg)}
                                  title="Copy message text"
                                >
                                  <span className="material-symbols-outlined">content_copy</span>
                                </button>
                              )}
                              {isSelf && (
                                <button
                                  type="button"
                                  className="btn-bubble-action btn-bubble-action-delete"
                                  onClick={() => handleDeleteChatMessage(msg.id)}
                                  title="Delete for everyone"
                                >
                                  <span className="material-symbols-outlined">delete</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        {isSelf && (
                          <div className="chat-avatar-bubble self" title="You">
                            {initial}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={chatMessagesEndRef} />
              </div>
            )}

            {showScrollDown && (
              <button
                type="button"
                className="btn-scroll-bottom"
                onClick={() => scrollToBottom(true)}
                title="Scroll to latest messages"
              >
                <span className="material-symbols-outlined">arrow_downward</span>
                {unreadWhileScrolled > 0 && (
                  <span className="scroll-unread-badge">{unreadWhileScrolled}</span>
                )}
              </button>
            )}
          </div>

          {/* Typing Indicator Bar */}
          {typingUsers.length > 0 && (
            <div className="chat-typing-indicator-bar">
              <div className="typing-bubble">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
              <span className="typing-text">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.slice(0, 2).join(', ')} are typing...`}
              </span>
            </div>
          )}

          {/* Quoted Reply Preview Bar */}
          {replyingTo && (
            <div className="chat-reply-preview-bar">
              <div className="reply-preview-content">
                <div className="reply-preview-sender">
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>reply</span>
                  <span>Replying to <strong>{replyingTo.sender}</strong></span>
                </div>
                <div className="reply-preview-text">{replyingTo.content}</div>
              </div>
              <button
                type="button"
                className="btn-cancel-reply"
                onClick={() => setReplyingTo(null)}
                title="Cancel reply (Esc)"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            </div>
          )}

          {/* Attachment preview if pending */}
          {chatAttachment && (
            <div className="chat-pending-attachment-bar">
              <div className="pending-thumb-wrapper">
                <img src={chatAttachment.url} alt="Pending upload preview" />
                <span className="pending-name">{chatAttachment.name}</span>
              </div>
              <button
                type="button"
                className="btn-remove-attachment"
                onClick={() => setChatAttachment(null)}
                title="Remove image"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

          {/* Global Chat Composer */}
          <div className="global-chat-composer-bar">
            <input
              type="file"
              ref={chatFileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn-attach-image"
              onClick={() => chatFileInputRef.current?.click()}
              title="Attach Screenshot or Image"
            >
              <span className="material-symbols-outlined">attach_file</span>
            </button>

            <div className="composer-input-wrap">
              <input
                type="text"
                placeholder="Type message, share link, or paste image... (Press Enter to send)"
                value={chatInputText}
                onChange={(e) => handleChatInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChatMessage();
                  }
                }}
                onPaste={handlePasteEvent}
                autoFocus
              />
            </div>

            <button
              type="button"
              className="btn-chat-send-action"
              onClick={() => handleSendChatMessage()}
              disabled={!chatInputText.trim() && !chatAttachment}
              title="Send message"
            >
              <span className="material-symbols-outlined">send</span>
              <span className="btn-send-label">Send</span>
            </button>
          </div>
        </div>
      </main>

      {/* Create or Switch Global Work Room Modal */}
      {isCreateRoomModalOpen && (
        <div className="create-room-modal-overlay">
          <div className="create-room-modal-card">
            <div className="create-room-modal-header">
              <div className="modal-title-with-icon">
                <span className="material-symbols-outlined modal-header-icon">forum</span>
                <div>
                  <h3>Global Online Work Chat</h3>
                  <p>Create or join a room from any device. Share links, images, and chat instantly.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsCreateRoomModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="create-room-modal-body">
              <div className="create-room-quick-section">
                <h4>Option 1: Quick Create New Room</h4>
                <p>Generates a dedicated collaboration room code that you can share with colleagues.</p>
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
                <p>Have a room code from a teammate? Enter it here to open the room on this device.</p>
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
                      placeholder="e.g. design-review, work-842..."
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
      )}

      {/* Image Lightbox Viewer */}
      <ImageLightbox
        src={activeImageLightbox}
        onClose={() => setActiveImageLightbox(null)}
      />

      {/* Global Toast Notification */}
      <Toast message={toastMessage} />
    </div>
  );
};

export default GlobalChatView;
