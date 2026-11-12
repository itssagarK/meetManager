import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom Hook: useWhiteboard
 * Powers the In-Call Collaborative Whiteboard & Stage Annotator.
 * Manages normalized coordinate rendering, drawing primitives, sticky notes,
 * ephemeral laser pointers, undo/redo stacks, and WebSocket synchronization.
 */
export function useWhiteboard({
  localPeerId,
  localName,
  onBroadcastDraw,
  onBroadcastClear,
  onBroadcastSticky,
  onBroadcastLaser,
}) {
  const [elements, setElements] = useState([]);
  const [stickies, setStickies] = useState([]);
  const [laserPointers, setLaserPointers] = useState({});

  const [activeTool, setActiveTool] = useState('pen'); // 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'laser'
  const [strokeColor, setStrokeColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isShapeFilled, setIsShapeFilled] = useState(false);

  // Drawing state refs
  const isDrawingRef = useRef(false);
  const currentElementRef = useRef(null);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  // Broadcast callback refs to prevent stale closures
  const onBroadcastDrawRef = useRef(onBroadcastDraw);
  const onBroadcastClearRef = useRef(onBroadcastClear);
  const onBroadcastStickyRef = useRef(onBroadcastSticky);
  const onBroadcastLaserRef = useRef(onBroadcastLaser);

  useEffect(() => {
    onBroadcastDrawRef.current = onBroadcastDraw;
    onBroadcastClearRef.current = onBroadcastClear;
    onBroadcastStickyRef.current = onBroadcastSticky;
    onBroadcastLaserRef.current = onBroadcastLaser;
  }, [onBroadcastDraw, onBroadcastClear, onBroadcastSticky, onBroadcastLaser]);

  // Clean expired laser pointers every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLaserPointers((prev) => {
        let hasChanges = false;
        const next = { ...prev };
        for (const [peerId, laser] of Object.entries(next)) {
          if (now - laser.timestamp > 1400) {
            delete next[peerId];
            hasChanges = true;
          }
        }
        return hasChanges ? next : prev;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  /**
   * Start a new drawing stroke or shape
   */
  const startDrawing = useCallback(
    (normPoint) => {
      if (activeTool === 'laser') {
        if (onBroadcastLaserRef.current) {
          onBroadcastLaserRef.current(normPoint);
        }
        return;
      }

      isDrawingRef.current = true;
      const elementId = `elem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (activeTool === 'pen' || activeTool === 'highlighter') {
        currentElementRef.current = {
          id: elementId,
          type: 'stroke',
          tool: activeTool,
          color: strokeColor,
          width: strokeWidth,
          points: [normPoint],
          senderPeerId: localPeerId,
        };
      } else if (['line', 'arrow', 'rect', 'circle'].includes(activeTool)) {
        currentElementRef.current = {
          id: elementId,
          type: activeTool,
          tool: activeTool,
          color: strokeColor,
          width: strokeWidth,
          fill: isShapeFilled,
          start: normPoint,
          end: normPoint,
          senderPeerId: localPeerId,
        };
      } else if (activeTool === 'eraser') {
        // Point eraser: remove elements near click point
        eraseNearPoint(normPoint);
      }
    },
    [activeTool, strokeColor, strokeWidth, isShapeFilled, localPeerId]
  );

  /**
   * Continue drawing stroke or dragging shape preview
   */
  const draw = useCallback(
    (normPoint) => {
      if (activeTool === 'laser') {
        if (onBroadcastLaserRef.current) {
          onBroadcastLaserRef.current(normPoint);
        }
        return;
      }

      if (!isDrawingRef.current || !currentElementRef.current) return;

      if (currentElementRef.current.type === 'stroke') {
        currentElementRef.current.points.push(normPoint);
      } else if (['line', 'arrow', 'rect', 'circle'].includes(currentElementRef.current.type)) {
        currentElementRef.current.end = normPoint;
      } else if (activeTool === 'eraser') {
        eraseNearPoint(normPoint);
      }
    },
    [activeTool]
  );

  /**
   * Helper to erase elements touching or close to normalized point
   */
  const eraseNearPoint = (normPoint) => {
    const threshold = 0.035; // 3.5% proportional hit-box
    setElements((prev) => {
      const remaining = prev.filter((el) => {
        if (el.type === 'stroke') {
          return !el.points.some(
            (p) => Math.hypot(p.x - normPoint.x, p.y - normPoint.y) < threshold
          );
        }
        if (el.start && el.end) {
          const midX = (el.start.x + el.end.x) / 2;
          const midY = (el.start.y + el.end.y) / 2;
          return Math.hypot(midX - normPoint.x, midY - normPoint.y) >= threshold;
        }
        return true;
      });
      return remaining;
    });
  };

  /**
   * Finish drawing stroke and broadcast to room
   */
  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentElementRef.current) {
      const finalElement = { ...currentElementRef.current };
      currentElementRef.current = null;

      // Only add strokes that have at least 2 points
      if (finalElement.type === 'stroke' && finalElement.points.length < 2) {
        return;
      }

      setElements((prev) => [...prev, finalElement]);
      undoStackRef.current.push(finalElement.id);
      redoStackRef.current = []; // Clear redo stack on new action

      if (onBroadcastDrawRef.current) {
        onBroadcastDrawRef.current(finalElement);
      }
    }
  }, []);

  /**
   * Undo last drawn element by local user
   */
  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const lastId = undoStackRef.current.pop();

    setElements((prev) => {
      const target = prev.find((el) => el.id === lastId);
      if (target) {
        redoStackRef.current.push(target);
      }
      return prev.filter((el) => el.id !== lastId);
    });
  }, []);

  /**
   * Redo previously undone element
   */
  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const element = redoStackRef.current.pop();
    if (!element) return;

    setElements((prev) => [...prev, element]);
    undoStackRef.current.push(element.id);

    if (onBroadcastDrawRef.current) {
      onBroadcastDrawRef.current(element);
    }
  }, []);

  /**
   * Clear the entire whiteboard canvas
   */
  const clearCanvas = useCallback(() => {
    setElements([]);
    setStickies([]);
    undoStackRef.current = [];
    redoStackRef.current = [];

    if (onBroadcastClearRef.current) {
      onBroadcastClearRef.current();
    }
  }, []);

  /**
   * Sticky Notes Management
   */
  const addSticky = useCallback(
    (text = 'New Note', normPoint = { x: 0.35, y: 0.35 }, color = 'yellow') => {
      const newSticky = {
        id: `sticky_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        text,
        x: normPoint.x,
        y: normPoint.y,
        color, // 'yellow' | 'blue' | 'green' | 'pink'
        author: localName || 'You',
        senderPeerId: localPeerId,
      };

      setStickies((prev) => [...prev, newSticky]);

      if (onBroadcastStickyRef.current) {
        onBroadcastStickyRef.current('upsert', newSticky);
      }
    },
    [localName, localPeerId]
  );

  const updateSticky = useCallback((id, updates) => {
    setStickies((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      const target = updated.find((s) => s.id === id);
      if (target && onBroadcastStickyRef.current) {
        onBroadcastStickyRef.current('upsert', target);
      }
      return updated;
    });
  }, []);

  const deleteSticky = useCallback((id) => {
    setStickies((prev) => prev.filter((s) => s.id !== id));
    if (onBroadcastStickyRef.current) {
      onBroadcastStickyRef.current('delete', null, id);
    }
  }, []);

  /**
   * Handle incoming remote broadcast messages
   */
  const handleRemoteDraw = useCallback((element) => {
    if (!element || !element.id) return;
    setElements((prev) => {
      if (prev.some((e) => e.id === element.id)) return prev;
      return [...prev, element];
    });
  }, []);

  const handleRemoteClear = useCallback(() => {
    setElements([]);
    setStickies([]);
    undoStackRef.current = [];
    redoStackRef.current = [];
  }, []);

  const handleRemoteSticky = useCallback((action, sticky, stickyId) => {
    if (action === 'upsert' && sticky) {
      setStickies((prev) => {
        const idx = prev.findIndex((s) => s.id === sticky.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = sticky;
          return next;
        }
        return [...prev, sticky];
      });
    } else if (action === 'delete' && stickyId) {
      setStickies((prev) => prev.filter((s) => s.id !== stickyId));
    }
  }, []);

  const handleRemoteLaser = useCallback((point, senderPeerId, senderName) => {
    if (!point || !senderPeerId) return;
    setLaserPointers((prev) => ({
      ...prev,
      [senderPeerId]: {
        ...point,
        name: senderName || 'Peer',
        timestamp: Date.now(),
      },
    }));
  }, []);

  const handleRemoteSync = useCallback((syncedElements, syncedStickies) => {
    if (Array.isArray(syncedElements)) {
      setElements(syncedElements);
    }
    if (Array.isArray(syncedStickies)) {
      setStickies(syncedStickies);
    }
  }, []);

  /**
   * Export the whiteboard to a high-res PNG Data URL
   */
  const exportToPng = useCallback(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 1920;
    offscreen.height = 1080;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    // Background fill
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, 1920, 1080);

    // Subtle grid pattern
    ctx.strokeStyle = '#2c2d35';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1920; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1080);
      ctx.stroke();
    }
    for (let y = 0; y < 1080; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1920, y);
      ctx.stroke();
    }

    // Render elements
    elements.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = (el.width || 4) * 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = (el.width || 8) * 3;
      }

      if (el.type === 'stroke' && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x * 1920, el.points[0].y * 1080);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x * 1920, el.points[i].y * 1080);
        }
        ctx.stroke();
      } else if (el.type === 'line' && el.start && el.end) {
        ctx.beginPath();
        ctx.moveTo(el.start.x * 1920, el.start.y * 1080);
        ctx.lineTo(el.end.x * 1920, el.end.y * 1080);
        ctx.stroke();
      } else if (el.type === 'arrow' && el.start && el.end) {
        const fromX = el.start.x * 1920;
        const fromY = el.start.y * 1080;
        const toX = el.end.x * 1920;
        const toY = el.end.y * 1080;
        const headlen = 20;
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
        const x = Math.min(el.start.x, el.end.x) * 1920;
        const y = Math.min(el.start.y, el.end.y) * 1080;
        const w = Math.abs(el.end.x - el.start.x) * 1920;
        const h = Math.abs(el.end.y - el.start.y) * 1080;
        if (el.fill) {
          ctx.globalAlpha = 0.2;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = 1.0;
        }
        ctx.strokeRect(x, y, w, h);
      } else if (el.type === 'circle' && el.start && el.end) {
        const cx = ((el.start.x + el.end.x) / 2) * 1920;
        const cy = ((el.start.y + el.end.y) / 2) * 1080;
        const rx = (Math.abs(el.end.x - el.start.x) / 2) * 1920;
        const ry = (Math.abs(el.end.y - el.start.y) / 2) * 1080;
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
    });

    // Render stickies on image
    stickies.forEach((s) => {
      const sx = s.x * 1920;
      const sy = s.y * 1080;
      const sw = 220;
      const sh = 160;

      ctx.save();
      const stickyColors = {
        yellow: '#fef08a',
        blue: '#bae6fd',
        green: '#bbf7d0',
        pink: '#fbcfe8',
      };
      ctx.fillStyle = stickyColors[s.color] || '#fef08a';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 12;
      ctx.fillRect(sx, sy, sw, sh);

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(s.author || 'Author', sx + 12, sy + 24);

      ctx.font = '13px sans-serif';
      const words = (s.text || '').split(' ');
      let line = '';
      let lineY = sy + 48;
      for (const w of words) {
        const test = `${line}${w} `;
        if (ctx.measureText(test).width > sw - 24) {
          ctx.fillText(line, sx + 12, lineY);
          line = `${w} `;
          lineY += 18;
          if (lineY > sy + sh - 10) break;
        } else {
          line = test;
        }
      }
      ctx.fillText(line, sx + 12, lineY);
      ctx.restore();
    });

    const dataUrl = offscreen.toDataURL('image/png');
    return dataUrl;
  }, [elements, stickies]);

  return {
    elements,
    stickies,
    laserPointers,
    currentDrawingElement: currentElementRef.current,
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
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    clearCanvas,
    addSticky,
    updateSticky,
    deleteSticky,
    handleRemoteDraw,
    handleRemoteClear,
    handleRemoteSticky,
    handleRemoteLaser,
    handleRemoteSync,
    exportToPng,
  };
}

export default useWhiteboard;
