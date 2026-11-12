import React, { useState, useRef } from 'react';

/**
 * Helper to humanize byte sizes into clean B / KB / MB / GB strings
 */
function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Helper to retrieve iconography and theme color for file formats
 */
function getFileVisualInfo(fileName, mimeType) {
  const ext = (fileName || '').split('.').pop().toLowerCase();

  if (ext === 'pdf' || mimeType?.includes('pdf')) {
    return { icon: 'picture_as_pdf', color: '#ef4444', label: 'PDF Document' };
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) || mimeType?.startsWith('image/')) {
    return { icon: 'image', color: '#8b5cf6', label: 'Image Asset' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType?.includes('zip') || mimeType?.includes('compressed')) {
    return { icon: 'folder_zip', color: '#f59e0b', label: 'Archive' };
  }
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'sql', 'sh'].includes(ext)) {
    return { icon: 'code', color: '#10b981', label: 'Code File' };
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return { icon: 'table_view', color: '#059669', label: 'Spreadsheet' };
  }
  if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) {
    return { icon: 'description', color: '#3b82f6', label: 'Text Document' };
  }
  if (['mp4', 'webm', 'mov', 'mkv'].includes(ext) || mimeType?.startsWith('video/')) {
    return { icon: 'movie', color: '#06b6d4', label: 'Video File' };
  }
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext) || mimeType?.startsWith('audio/')) {
    return { icon: 'audiotrack', color: '#ec4899', label: 'Audio File' };
  }
  return { icon: 'draft', color: '#64748b', label: 'Document' };
}

export const FileTransferPanel = ({
  fileTransferState,
  connectedPeersCount,
  onPreviewImage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const {
    files,
    connectedPeersWithDataChannels,
    sendFilesToPeers,
    cancelTransfer,
    clearAllTransfers,
  } = fileTransferState;

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setErrorMessage('');

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      try {
        await sendFilesToPeers(Array.from(e.dataTransfer.files));
      } catch (err) {
        setErrorMessage(err.message || 'Failed to stream files to peers.');
      }
    }
  };

  const handleFileInputChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setErrorMessage('');
      try {
        await sendFilesToPeers(Array.from(e.target.files));
      } catch (err) {
        setErrorMessage(err.message || 'Failed to stream files to peers.');
      }
      e.target.value = ''; // reset so same file can be re-selected if needed
    }
  };

  return (
    <div className="meet-file-panel-wrap">
      {/* P2P Header & Security Notice */}
      <div className="meet-file-panel-header">
        <div className="meet-file-stats-row">
          <div className="p2p-badge" title="End-to-End Encrypted WebRTC DataChannel">
            <span className="material-symbols-outlined p2p-badge-icon">lock</span>
            <span>100% P2P Encrypted • Zero Cloud Storage</span>
          </div>
          <span className="p2p-peers-tag">
            {connectedPeersWithDataChannels > 0
              ? `${connectedPeersWithDataChannels} peer(s) ready`
              : `${connectedPeersCount} peer(s) in call`}
          </span>
        </div>
        <p className="meet-file-desc">
          Stream files directly to participants in this meeting. Files are transferred peer-to-peer and never touch a remote server or database.
        </p>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="meet-file-error-alert">
          <span className="material-symbols-outlined">error</span>
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Drag & Drop File Zone */}
      <div
        className={`meet-file-dropzone ${isDragOver ? 'drag-over' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        <div className="dropzone-icon-circle">
          <span className="material-symbols-outlined dropzone-icon">
            {isDragOver ? 'file_download' : 'cloud_upload'}
          </span>
        </div>
        <div className="dropzone-text-group">
          <strong>{isDragOver ? 'Drop files to transfer now' : 'Drag & drop files here'}</strong>
          <span>or click to browse from device</span>
        </div>
        <div className="dropzone-chips">
          <span className="format-chip">PDF</span>
          <span className="format-chip">Images</span>
          <span className="format-chip">Archives</span>
          <span className="format-chip">Docs & Code</span>
        </div>
      </div>

      {/* Active & Transferred Files Section */}
      <div className="meet-file-list-section">
        <div className="meet-file-list-header">
          <h4>Shared In Call ({files.length})</h4>
          {files.length > 0 && (
            <button
              type="button"
              className="meet-file-clear-btn"
              onClick={clearAllTransfers}
              title="Clear all completed transfer logs"
            >
              Clear All
            </button>
          )}
        </div>

        {files.length === 0 ? (
          <div className="meet-file-empty-state">
            <span className="material-symbols-outlined empty-icon">folder_shared</span>
            <p className="empty-title">No files shared yet</p>
            <p className="empty-sub">
              Drag and drop any document, image, or code archive above to share it with everyone in this call.
            </p>
          </div>
        ) : (
          <div className="meet-file-card-list">
            {files.map((file) => {
              const visual = getFileVisualInfo(file.name, file.mimeType);
              const isImage = file.mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].some(ext => file.name.toLowerCase().endsWith(ext));

              return (
                <div key={file.id} className={`meet-file-card ${file.status}`}>
                  <div className="file-card-main">
                    <div
                      className="file-visual-box"
                      style={{ backgroundColor: `${visual.color}15`, color: visual.color }}
                    >
                      <span className="material-symbols-outlined">{visual.icon}</span>
                    </div>

                    <div className="file-info-col">
                      <div className="file-name-row">
                        <span className="file-name" title={file.name}>
                          {file.name}
                        </span>
                        <span className={`file-status-pill ${file.status}`}>
                          {file.status === 'sending' && `Sending ${file.progress}%`}
                          {file.status === 'receiving' && `Receiving ${file.progress}%`}
                          {file.status === 'completed' && 'Available'}
                          {file.status === 'cancelled' && 'Cancelled'}
                        </span>
                      </div>

                      <div className="file-sub-row">
                        <span className="file-size">{formatFileSize(file.size)}</span>
                        <span className="file-dot">•</span>
                        <span className="file-sender">
                          {file.isMe ? 'You' : file.senderName}
                        </span>
                        {file.status === 'receiving' && (
                          <>
                            <span className="file-dot">•</span>
                            <span className="file-received-stat">
                              {formatFileSize(file.transferredBytes)} transferred
                            </span>
                          </>
                        )}
                      </div>

                      {/* Animated Progress Bar during active transfer */}
                      {(file.status === 'sending' || file.status === 'receiving') && (
                        <div className="file-progress-track">
                          <div
                            className={`file-progress-bar ${file.status}`}
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="file-card-actions">
                    {file.status === 'completed' && file.downloadUrl && (
                      <>
                        {isImage && onPreviewImage && (
                          <button
                            type="button"
                            className="file-btn preview"
                            onClick={() => onPreviewImage(file.downloadUrl)}
                            title="Preview image in lightbox"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                            <span>Preview</span>
                          </button>
                        )}
                        <a
                          href={file.downloadUrl}
                          download={file.name}
                          className="file-btn download"
                          title={`Download ${file.name}`}
                        >
                          <span className="material-symbols-outlined">download</span>
                          <span>Download</span>
                        </a>
                      </>
                    )}

                    {file.status === 'sending' && (
                      <button
                        type="button"
                        className="file-btn cancel"
                        onClick={() => cancelTransfer(file.id)}
                        title="Cancel transfer"
                      >
                        <span className="material-symbols-outlined">close</span>
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
