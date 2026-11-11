import React, { useState } from 'react';
import { formatMeetingDuration } from '../../utils/dateUtils.js';

export const RecordingModal = ({
  isOpen,
  onClose,
  recordedUrl,
  recordingDuration = 0,
  recordingSize = 0,
  recordingMimeType = '',
  recordingRoom = 'general',
  downloadRecording,
  discardRecording,
  onAttachToMeeting,
  activeMeeting = null,
}) => {
  const [attachedStatus, setAttachedStatus] = useState(false);

  if (!isOpen || !recordedUrl) return null;

  // Format file size nicely
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (fmt) => {
    if (downloadRecording) {
      downloadRecording('', fmt);
    }
  };

  const handleAttach = () => {
    if (onAttachToMeeting && activeMeeting) {
      const summaryText = `[Meeting Recording] Room #${recordingRoom} - Duration: ${formatMeetingDuration(recordingDuration)} - Size: ${formatSize(recordingSize)}`;
      onAttachToMeeting(activeMeeting.id, summaryText);
      setAttachedStatus(true);
      setTimeout(() => setAttachedStatus(false), 2500);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this meeting recording? It cannot be recovered.')) {
      if (discardRecording) {
        discardRecording();
      }
    }
  };

  return (
    <div className="recording-modal-overlay" onClick={onClose}>
      <div className="recording-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="recording-modal-header">
          <div className="recording-header-title-group">
            <div className="recording-icon-badge">
              <span className="material-symbols-outlined">videocam</span>
            </div>
            <div>
              <h3>Meeting Recording</h3>
              <p>Room: <strong>#{recordingRoom}</strong> • Captured via client-side high-fidelity stream mixer</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            title="Close preview"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Video Player Container */}
        <div className="recording-player-container">
          <video
            src={recordedUrl}
            controls
            playsInline
            className="recording-video-element"
          />
        </div>

        {/* Metadata Chips Bar */}
        <div className="recording-metadata-bar">
          <div className="rec-meta-chip">
            <span className="material-symbols-outlined">timer</span>
            <span>Duration: <strong>{formatMeetingDuration(recordingDuration)}</strong></span>
          </div>
          <div className="rec-meta-chip">
            <span className="material-symbols-outlined">storage</span>
            <span>File Size: <strong>{formatSize(recordingSize)}</strong></span>
          </div>
          <div className="rec-meta-chip">
            <span className="material-symbols-outlined">high_quality</span>
            <span>Format: <strong>{recordingMimeType.includes('mp4') ? 'MP4 / H.264' : 'WebM / VP9'}</strong></span>
          </div>
          <div className="rec-meta-chip rec-chip-status">
            <span className="status-dot-green"></span>
            <span>Ready to Export</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="recording-modal-footer">
          <div className="rec-footer-left">
            <button
              type="button"
              className="btn-discard-recording"
              onClick={handleDiscard}
              title="Delete this recording"
            >
              <span className="material-symbols-outlined">delete</span>
              <span>Discard</span>
            </button>
          </div>

          <div className="rec-footer-right">
            {activeMeeting && onAttachToMeeting && (
              <button
                type="button"
                className={`btn-attach-meeting ${attachedStatus ? 'is-attached' : ''}`}
                onClick={handleAttach}
                title="Attach recording note to selected workspace meeting"
              >
                <span className="material-symbols-outlined">
                  {attachedStatus ? 'check_circle' : 'note_add'}
                </span>
                <span>{attachedStatus ? 'Attached to Meeting' : 'Attach Note to Meeting'}</span>
              </button>
            )}

            <button
              type="button"
              className="btn-download-rec btn-download-webm"
              onClick={() => handleDownload('webm')}
              title="Download standard high-performance WebM video"
            >
              <span className="material-symbols-outlined">download</span>
              <span>Download .webm</span>
            </button>

            <button
              type="button"
              className="btn-download-rec btn-download-mp4"
              onClick={() => handleDownload('mp4')}
              title="Download MP4 video container"
            >
              <span className="material-symbols-outlined">movie</span>
              <span>Download .mp4</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingModal;
