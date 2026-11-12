import React, { useRef, useEffect, useState, useCallback } from 'react';

const PRESET_COLORS = [
  '#ffffff',
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#0f172a',
];

const STROKE_WIDTHS = [
  { label: 'S', width: 2 },
  { label: 'M', width: 4 },
  { label: 'L', width: 8 },
  { label: 'XL', width: 14 },
];

export const WhiteboardOverlay = ({
  whiteboardState,
  connectedPeersCount = 0,
  onClose,
  onSaveToMeetingNotes,
  showToast,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [stickyColorPicker, setStickyColorPicker] = useState('yellow');
  const [activeDraggingStickyId, setActiveDraggingStickyId] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const {
    elements,
    stickies,
    laserPointers,
    currentDrawingElement,
    activeTool,
    setActiveTool,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    isShapeFilled,
    setIsShapeFilled,
    startDrawing,
    draw,
    stopDrawing,
    undo,
    redo,
    canUndo,
    canRedo,
    clearCanvas,
    addSticky,
    updateSticky,
    deleteSticky,
    exportToPng,
  } = whiteboardState;

  /**
   * Normalize pointer event coordinates to 0..1 relative to canvas bounding box
   */
  const getNormalizedPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  }, []);

  /**
   * Continuous canvas render loop
   */
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear frame
    ctx.clearRect(0, 0, width, height);

    // Draw subtle grid pattern
    ctx.save();
    ctx.fillStyle = '#262830';
    for (let x = 20; x < width; x += 40) {
      for (let y = 20; y < height; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Helper to render an element (stroke, line, arrow, rect, circle)
    const drawElement = (el) => {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.width || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = (el.width || 8) * 3.5;
      }

      if (el.type === 'stroke' && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x * width, el.points[0].y * height);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x * width, el.points[i].y * height);
        }
        ctx.stroke();
      } else if (el.type === 'line' && el.start && el.end) {
        ctx.beginPath();
        ctx.moveTo(el.start.x * width, el.start.y * height);
        ctx.lineTo(el.end.x * width, el.end.y * height);
        ctx.stroke();
      } else if (el.type === 'arrow' && el.start && el.end) {
        const fromX = el.start.x * width;
        const fromY = el.start.y * height;
        const toX = el.end.x * width;
        const toY = el.end.y * height;
        const headlen = 16;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (el.type === 'rect' && el.start && el.end) {
        const x = Math.min(el.start.x, el.end.x) * width;
        const y = Math.min(el.start.y, el.end.y) * height;
        const w = Math.abs(el.end.x - el.start.x) * width;
        const h = Math.abs(el.end.y - el.start.y) * height;
        if (el.fill) {
          ctx.globalAlpha = 0.2;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = 1.0;
        }
        ctx.strokeRect(x, y, w, h);
      } else if (el.type === 'circle' && el.start && el.end) {
        const cx = ((el.start.x + el.end.x) / 2) * width;
        const cy = ((el.start.y + el.end.y) / 2) * height;
        const rx = (Math.abs(el.end.x - el.start.x) / 2) * width;
        const ry = (Math.abs(el.end.y - el.start.y) / 2) * height;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, 2 * Math.PI);
        if (el.fill) {
          ctx.globalAlpha = 0.2;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    // 1. Draw confirmed history elements
    elements.forEach(drawElement);

    // 2. Draw currently active preview stroke/shape
    if (currentDrawingElement) {
      drawElement(currentDrawingElement);
    }

    // 3. Draw active remote laser pointers
    for (const laser of Object.values(laserPointers)) {
      const lx = laser.x * width;
      const ly = laser.y * height;
      ctx.save();
      // Outer glow
      const grad = ctx.createRadialGradient(lx, ly, 2, lx, ly, 18);
      grad.addColorStop(0, '#ef4444');
      grad.addColorStop(0.4, 'rgba(239, 68, 68, 0.45)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, 18, 0, Math.PI * 2);
      ctx.fill();

      // Center bright core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fill();

      // User name label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect(lx + 10, ly - 10, ctx.measureText(laser.name || 'Peer').width + 12, 18, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText(laser.name || 'Peer', lx + 16, ly + 3);
      ctx.restore();
    }
  }, [elements, currentDrawingElement, laserPointers]);

  // Sync canvas dimensions with parent container size
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // Re-render when elements or laser pointers change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer event handlers
  const handlePointerDown = (e) => {
    if (e.target !== canvasRef.current) return;
    const pt = getNormalizedPoint(e);
    startDrawing(pt);
  };

  const handlePointerMove = (e) => {
    const pt = getNormalizedPoint(e);
    draw(pt);
    renderCanvas();
  };

  const handlePointerUp = () => {
    stopDrawing();
  };

  // Sticky Dragging
  const handleStickyMouseDown = (e, sticky) => {
    e.stopPropagation();
    setActiveDraggingStickyId(sticky.id);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    dragOffsetRef.current = {
      x: (e.clientX - rect.left) / rect.width - sticky.x,
      y: (e.clientY - rect.top) / rect.height - sticky.y,
    };
  };

  const handleContainerMouseMove = (e) => {
    if (!activeDraggingStickyId) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const newX = Math.max(0.02, Math.min(0.85, (e.clientX - rect.left) / rect.width - dragOffsetRef.current.x));
    const newY = Math.max(0.02, Math.min(0.85, (e.clientY - rect.top) / rect.height - dragOffsetRef.current.y));
    updateSticky(activeDraggingStickyId, { x: newX, y: newY });
  };

  const handleContainerMouseUp = () => {
    if (activeDraggingStickyId) {
      setActiveDraggingStickyId(null);
    }
  };

  const handleExportPngClick = () => {
    const dataUrl = exportToPng();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `pcs-whiteboard-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (showToast) showToast('Whiteboard exported as PNG');
  };

  const handleSaveToNotesClick = () => {
    const dataUrl = exportToPng();
    if (!dataUrl) return;
    if (onSaveToMeetingNotes) {
      onSaveToMeetingNotes(dataUrl);
    }
  };

  return (
    <div
      ref={containerRef}
      className="meet-whiteboard-overlay-stage"
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
    >
      {/* Top Controls Header */}
      <div className="whiteboard-top-header">
        <div className="whiteboard-title-group">
          <span className="material-symbols-outlined header-icon">draw</span>
          <div>
            <h3>Collaborative Whiteboard Stage</h3>
            <span className="sync-badge">
              <span className="sync-pulse-dot" />
              {connectedPeersCount > 0 ? `Syncing with ${connectedPeersCount} peer(s)` : 'Live Canvas'}
            </span>
          </div>
        </div>

        <div className="whiteboard-header-actions">
          <button
            type="button"
            className="btn-wb-action"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <span className="material-symbols-outlined">undo</span>
          </button>
          <button
            type="button"
            className="btn-wb-action"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <span className="material-symbols-outlined">redo</span>
          </button>
          <button
            type="button"
            className="btn-wb-action btn-clear"
            onClick={() => setShowClearConfirm(true)}
            title="Clear canvas"
          >
            <span className="material-symbols-outlined">delete_sweep</span>
          </button>
          <button
            type="button"
            className="btn-wb-action"
            onClick={handleExportPngClick}
            title="Download PNG snapshot"
          >
            <span className="material-symbols-outlined">download</span>
            <span>Export</span>
          </button>
          {onSaveToMeetingNotes && (
            <button
              type="button"
              className="btn-wb-action btn-save-notes"
              onClick={handleSaveToNotesClick}
              title="Save snapshot to meeting notes"
            >
              <span className="material-symbols-outlined">note_add</span>
              <span>Save to Notes</span>
            </button>
          )}
          <button
            type="button"
            className="btn-wb-action btn-close-wb"
            onClick={onClose}
            title="Close whiteboard stage"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="wb-confirm-modal-backdrop">
          <div className="wb-confirm-card">
            <h4>Clear Whiteboard?</h4>
            <p>This will erase all drawings and sticky notes for all participants in this meeting.</p>
            <div className="wb-confirm-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-delete"
                onClick={() => {
                  clearCanvas();
                  setShowClearConfirm(false);
                }}
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The Drawing Canvas */}
      <canvas
        ref={canvasRef}
        className={`whiteboard-canvas tool-${activeTool}`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      {/* Draggable Sticky Notes Layer */}
      {stickies.map((sticky) => (
        <div
          key={sticky.id}
          className={`wb-sticky-card color-${sticky.color}`}
          style={{
            left: `${sticky.x * 100}%`,
            top: `${sticky.y * 100}%`,
          }}
        >
          <div
            className="sticky-hdr"
            onMouseDown={(e) => handleStickyMouseDown(e, sticky)}
          >
            <span className="material-symbols-outlined drag-icon">drag_indicator</span>
            <span className="sticky-author">{sticky.author}</span>
            <button
              type="button"
              className="btn-sticky-del"
              onClick={() => deleteSticky(sticky.id)}
              title="Delete sticky note"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <textarea
            className="sticky-textarea"
            value={sticky.text}
            placeholder="Type note..."
            onChange={(e) => updateSticky(sticky.id, { text: e.target.value })}
          />
        </div>
      ))}

      {/* Floating Bottom Toolbar */}
      <div className="whiteboard-floating-toolbar">
        {/* Drawing Tools */}
        <div className="wb-tool-group">
          <button
            type="button"
            className={`wb-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
            onClick={() => setActiveTool('pen')}
            title="Pen (Freehand)"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button
            type="button"
            className={`wb-tool-btn ${activeTool === 'highlighter' ? 'active' : ''}`}
            onClick={() => setActiveTool('highlighter')}
            title="Highlighter (Semi-transparent)"
          >
            <span className="material-symbols-outlined">brush</span>
          </button>
          <button
            type="button"
            className={`wb-tool-btn ${activeTool === 'laser' ? 'active' : ''}`}
            onClick={() => setActiveTool('laser')}
            title="Laser Pointer (Real-time beacon)"
          >
            <span className="material-symbols-outlined">flare</span>
          </button>
          <button
            type="button"
            className={`wb-tool-btn ${activeTool === 'line' ? 'active' : ''}`}
            onClick={() => setActiveTool('line')}
            title="Straight Line"
          >
            <span className="material-symbols-outlined">horizontal_rule</span>
          </button>
          <button
            type="button"
            className={`wb-tool-btn ${activeTool === 'arrow' ? 'active' : ''}`}
            onClick={() => setActiveTool('arrow')}
            title="Arrow"
          >
            <span className="material-symbols-outlined">arrow_right_alt</span>
          </button>
          <button
            type="button"
            className={`wb-tool-btn ${activeTool === 'rect' ? 'active' : ''}`}
            onClick={() => setActiveTool('rect')}
            title="Rectangle"
          >
            <span className="material-symbols-outlined">crop_square</span>
          </button>
          <button
            type="button"
            className={`wb-tool-btn ${activeTool === 'circle' ? 'active' : ''}`}
            onClick={() => setActiveTool('circle')}
            title="Circle / Ellipse"
          >
            <span className="material-symbols-outlined">radio_button_unchecked</span>
          </button>
          <button
            type="button"
            className={`wb-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
            onClick={() => setActiveTool('eraser')}
            title="Eraser"
          >
            <span className="material-symbols-outlined">ink_eraser</span>
          </button>
        </div>

        <div className="wb-toolbar-divider" />

        {/* Color Palette */}
        <div className="wb-color-group">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`wb-color-dot ${strokeColor === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setStrokeColor(c)}
              title={c}
            />
          ))}
        </div>

        <div className="wb-toolbar-divider" />

        {/* Stroke Sizes */}
        <div className="wb-size-group">
          {STROKE_WIDTHS.map((s) => (
            <button
              key={s.width}
              type="button"
              className={`wb-size-btn ${strokeWidth === s.width ? 'active' : ''}`}
              onClick={() => setStrokeWidth(s.width)}
              title={`Size ${s.label}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="wb-toolbar-divider" />

        {/* Shape Fill Toggle */}
        {['rect', 'circle'].includes(activeTool) && (
          <button
            type="button"
            className={`wb-tool-btn ${isShapeFilled ? 'active' : ''}`}
            onClick={() => setIsShapeFilled((prev) => !prev)}
            title="Toggle Shape Fill"
          >
            <span className="material-symbols-outlined">format_color_fill</span>
          </button>
        )}

        {/* Add Sticky Note */}
        <div className="wb-sticky-trigger-group">
          <button
            type="button"
            className="wb-add-sticky-btn"
            onClick={() => {
              addSticky('Brainstorm note...', { x: 0.35 + Math.random() * 0.1, y: 0.3 + Math.random() * 0.1 }, stickyColorPicker);
            }}
            title="Drop Sticky Note"
          >
            <span className="material-symbols-outlined">sticky_note_2</span>
            <span>+ Sticky</span>
          </button>
          <select
            className="wb-sticky-color-select"
            value={stickyColorPicker}
            onChange={(e) => setStickyColorPicker(e.target.value)}
          >
            <option value="yellow">Yellow</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="pink">Pink</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default WhiteboardOverlay;
