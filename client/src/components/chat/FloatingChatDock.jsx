import React from 'react';
import ChatMessageContent from './ChatMessageContent.jsx';
import { shouldShowDateSeparator, getChatDayLabel } from '../../utils/dateUtils.js';

export const FloatingChatDock = ({
  isOpen,
  room,
  messages = [],
  guestName = '',
  onlineCount = 0,
  onClose,
  onCopyRoomLink,
  onFullScreen,
  extraClassName = '',
  chatInputText = '',
  setChatInputText,
  handleChatInputChange,
  chatAttachment = null,
  setChatAttachment,
  chatFileInputRef,
  handleImageSelect,
  handlePasteEvent,
  handleSendChatMessage,
  chatMessagesEndRef,
  replyingTo = null,
  setReplyingTo,
  handleReplyChatMessage,
  handleCopyMessageText,
  handleDeleteChatMessage,
  onImageClick,
  typingUsers = [],
  isDraggingOverChat = false,
  handleChatScroll,
  handleChatDragOver,
  handleChatDragLeave,
  handleChatDrop,
  showScrollDown = false,
  unreadWhileScrolled = 0,
  scrollToBottom,
}) => {
  if (!isOpen || !room) return null;

  const currentRoom = room.trim().toLowerCase();

  return (
    <div className={`room-chat-floating-dock ${extraClassName}`.trim()}>
      <div className="room-chat-header">
        <div className="room-chat-title-group">
          <span className="live-chat-dot"></span>
          <span className="room-chat-name">Room: <strong>#{currentRoom}</strong></span>
          {onlineCount > 0 && (
            <span className="room-chat-online-pill">{onlineCount} online</span>
          )}
          <span className="room-chat-count">{messages.length} msgs</span>
        </div>
        <div className="room-chat-header-actions">
          {onCopyRoomLink && (
            <button
              type="button"
              className="chat-hdr-btn"
              onClick={() => onCopyRoomLink(currentRoom)}
              title="Copy Shareable Chat Room Link"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>share</span>
              <span>Share</span>
            </button>
          )}
          {onFullScreen && (
            <button
              type="button"
              className="chat-hdr-btn highlight-video"
              onClick={() => onFullScreen(currentRoom)}
              title="Open Dedicated Full-Screen Chat"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>open_in_full</span>
              <span>Full View</span>
            </button>
          )}
          <button
            type="button"
            className="chat-hdr-btn close-chat-btn"
            onClick={onClose}
            title="Close Chat"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
          </button>
        </div>
      </div>

      <div
        className={`room-chat-messages-scroll ${isDraggingOverChat ? 'is-drag-over' : ''}`}
        onScroll={handleChatScroll}
        onDragOver={handleChatDragOver}
        onDragLeave={handleChatDragLeave}
        onDrop={handleChatDrop}
      >
        {isDraggingOverChat && (
          <div className="chat-dropzone-overlay">
            <span className="material-symbols-outlined drop-icon">cloud_upload</span>
            <p>Drop image here to share</p>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="chat-empty-slate">
            <span className="material-symbols-outlined chat-empty-icon">forum</span>
            <p>Welcome to <strong>#{currentRoom}</strong></p>
            <span>Anyone with this room code can join from any device. Start by sending a message, sharing a link, or dropping an image.</span>
            {onCopyRoomLink && (
              <button
                type="button"
                className="btn-copy-room-first"
                onClick={() => onCopyRoomLink(currentRoom)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span>
                <span>Copy Room Link to Invite Team</span>
              </button>
            )}
          </div>
        ) : (
          messages.map((m, idx) => {
            const isSelf =
              m.sender_name === (guestName.trim() || 'Colleague') ||
              m.sender_id === (typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('pcs_guest_office_id') || sessionStorage.getItem('pcs_user_id')) : null);
            const timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const domId = `chat-msg-${m.id || m.client_msg_id || idx}`;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showDateSep = shouldShowDateSeparator(m.created_at, prevMsg?.created_at);
            const dateLabel = showDateSep ? getChatDayLabel(m.created_at) : null;

            return (
              <React.Fragment key={m.id || m.client_msg_id || idx}>
                {dateLabel && (
                  <div className="chat-date-separator">
                    <span className="date-chip">{dateLabel}</span>
                  </div>
                )}
                <div
                  id={domId}
                  className={`chat-bubble-row ${isSelf ? 'self' : 'peer'} ${m.is_deleted ? 'msg-is-deleted' : ''}`}
                >
                  <div className="chat-bubble">
                    <div className="chat-bubble-meta">
                      <span className="chat-sender-name">{m.sender_name}</span>
                      <div className="chat-meta-right">
                        <span className="chat-timestamp">{timeStr}</span>
                        {isSelf && !m.is_deleted && (
                          <span className="chat-read-receipt" title="Delivered">
                            <span className="material-symbols-outlined receipt-icon">done_all</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="chat-bubble-content">
                      <ChatMessageContent msg={m} onImageClick={onImageClick} />
                    </div>
                    {!m.is_deleted && (
                      <div className="chat-bubble-actions">
                        <button
                          type="button"
                          className="btn-bubble-action"
                          onClick={() => handleReplyChatMessage && handleReplyChatMessage(m)}
                          title="Reply to message"
                        >
                          <span className="material-symbols-outlined">reply</span>
                        </button>
                        {m.content && (
                          <button
                            type="button"
                            className="btn-bubble-action"
                            onClick={() => handleCopyMessageText && handleCopyMessageText(m)}
                            title="Copy message text"
                          >
                            <span className="material-symbols-outlined">content_copy</span>
                          </button>
                        )}
                        {isSelf && (
                          <button
                            type="button"
                            className="btn-bubble-action btn-bubble-action-delete"
                            onClick={() => handleDeleteChatMessage && handleDeleteChatMessage(m.id)}
                            title="Delete for everyone"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={chatMessagesEndRef} />

        {showScrollDown && (
          <button
            type="button"
            className="btn-scroll-bottom dock-scroll-bottom"
            onClick={() => scrollToBottom && scrollToBottom(true)}
            title="Scroll to latest messages"
          >
            <span className="material-symbols-outlined">arrow_downward</span>
            {unreadWhileScrolled > 0 && (
              <span className="scroll-unread-badge">{unreadWhileScrolled}</span>
            )}
          </button>
        )}
      </div>

      <div className="room-chat-composer">
        {typingUsers && typingUsers.length > 0 && (
          <div className="chat-typing-indicator-bar mini-typing-bar">
            <div className="typing-bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
            <span className="typing-text">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.slice(0, 2).join(', ')} typing...`}
            </span>
          </div>
        )}

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
              onClick={() => setReplyingTo && setReplyingTo(null)}
              title="Cancel reply"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </div>
        )}

        {chatAttachment && (
          <div className="chat-attachment-preview">
            <img src={chatAttachment.url} alt="Attachment Preview" className="preview-thumb" />
            <span className="preview-filename">{chatAttachment.name}</span>
            <button
              type="button"
              className="btn-remove-attachment"
              onClick={() => setChatAttachment && setChatAttachment(null)}
              title="Remove image attachment"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
            </button>
          </div>
        )}

        <div className="chat-composer-input-row">
          <input
            type="file"
            ref={chatFileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <button
            type="button"
            className="btn-attach-image"
            onClick={() => chatFileInputRef.current?.click()}
            title="Attach photo or image"
          >
            <span className="material-symbols-outlined">image</span>
          </button>
          <textarea
            className="chat-text-input"
            placeholder="Type a message, paste image, or drop work link..."
            rows="1"
            value={chatInputText}
            onChange={(e) => {
              if (handleChatInputChange) {
                handleChatInputChange(e.target.value);
              } else if (setChatInputText) {
                setChatInputText(e.target.value);
              }
            }}
            onPaste={handlePasteEvent}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (handleSendChatMessage) {
                  handleSendChatMessage(currentRoom);
                }
              }
            }}
          />
          <button
            type="button"
            className="btn-chat-send"
            onClick={() => {
              if (handleSendChatMessage) {
                handleSendChatMessage(currentRoom);
              }
            }}
            disabled={!chatInputText.trim() && !chatAttachment}
            title="Send Message"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingChatDock;
