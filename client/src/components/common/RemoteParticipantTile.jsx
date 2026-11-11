import React, { useEffect, useRef } from 'react';

// Individual Remote Participant Video Tile for Multi-User WebRTC Meetings
export const RemoteParticipantTile = React.memo(({
  peer,
  isSpeaking,
  isPinned,
  onPin,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (peer.stream) {
        if (videoRef.current.srcObject !== peer.stream) {
          videoRef.current.srcObject = peer.stream;
        }
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [peer.stream]);

  const initials = (peer.name || 'P').charAt(0).toUpperCase();

  return (
    <div
      className={`meet-video-tile remote-tile ${isSpeaking ? 'speaking' : ''} ${isPinned ? 'is-pinned-hero' : ''}`}
    >
      {peer.isVideoOff || !peer.stream ? (
        <div className="meet-avatar-placeholder">
          <div className={`meet-avatar-circle remote-avatar-circle ${isSpeaking ? 'pulse-speaking' : ''}`}>
            <span>{initials}</span>
          </div>
          <div className="meet-avatar-label">
            {peer.isVideoOff ? 'Camera is off' : 'Connecting stream...'}
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="meet-video-element remote-stream"
        />
      )}

      {/* Participant Bottom Pill */}
      <div className="meet-name-pill">
        <span className={`mic-badge ${peer.isAudioMuted ? 'muted' : ''}`}>
          <span className="material-symbols-outlined">
            {peer.isAudioMuted ? 'mic_off' : 'mic'}
          </span>
        </span>
        <span className="participant-title">
          {peer.name || 'Participant'} {peer.isHost ? '(Host)' : ''}
        </span>
        {peer.isHandRaised && (
          <span className="raised-hand-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>front_hand</span>
            <span>Hand raised</span>
          </span>
        )}
      </div>

      {/* Pin button */}
      <button
        type="button"
        className="meet-tile-pin-btn"
        onClick={onPin}
        title={isPinned ? 'Unpin' : 'Pin to main view'}
      >
        <span className="material-symbols-outlined">
          {isPinned ? 'keep_off' : 'push_pin'}
        </span>
      </button>
    </div>
  );
});

export default RemoteParticipantTile;
