import React from 'react';

export const ImageLightbox = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <div className="image-lightbox-overlay" onClick={onClose}>
      <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-header">
          <span>Shared Work Image</span>
          <div className="lightbox-actions">
            <a
              href={src}
              download="shared-work-image.png"
              className="lightbox-download-btn"
              title="Download Image"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              <span>Save</span>
            </a>
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={onClose}
              title="Close Viewer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div className="lightbox-img-frame">
          <img src={src} alt="Full resolution shared work asset" />
        </div>
      </div>
    </div>
  );
};

export default ImageLightbox;
