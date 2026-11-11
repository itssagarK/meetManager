import React from 'react';

export const ChatMessageContent = ({ msg, onImageClick }) => {
  if (msg.is_deleted) {
    return (
      <div className="message-content-wrapper is-deleted">
        <p className="message-deleted-text">
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>block</span>
          <span>This message was deleted</span>
        </p>
      </div>
    );
  }

  const text = msg.content || '';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <div className="message-content-wrapper">
      {msg.reply_to_content && (
        <div
          className="chat-reply-quote"
          onClick={() => {
            if (msg.reply_to_id) {
              const el = document.getElementById('chat-msg-' + msg.reply_to_id);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('highlight-flash');
                setTimeout(() => el.classList.remove('highlight-flash'), 1600);
              }
            }
          }}
          title="Click to jump to quoted message"
        >
          <div className="quote-sender">{msg.reply_to_sender || 'Colleague'}</div>
          <div className="quote-text">{msg.reply_to_content}</div>
        </div>
      )}

      {text && (
        <p className="message-text">
          {parts.map((part, i) => {
            if (part.match(urlRegex)) {
              return (
                <a
                  key={i}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-link"
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
        </p>
      )}

      {msg.attachment_url && (
        <div className="chat-image-attachment">
          <img
            src={msg.attachment_url}
            alt="Shared work asset"
            onClick={() => onImageClick && onImageClick(msg.attachment_url)}
            loading="lazy"
          />
          <span className="attachment-click-hint">Click to enlarge</span>
        </div>
      )}
    </div>
  );
};

export default ChatMessageContent;
