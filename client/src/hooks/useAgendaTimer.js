import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom Hook: useAgendaTimer
 * 
 * Manages in-call meeting agenda topics, timebox countdowns, overtime tracking,
 * and synchronized state across multi-peer meetings.
 */
export function useAgendaTimer({ initialAgenda = [], onBroadcastAgenda = null } = {}) {
  const [agendaItems, setAgendaItems] = useState(() => {
    if (Array.isArray(initialAgenda) && initialAgenda.length > 0) {
      return initialAgenda;
    }
    return [
      { id: 'topic-1', title: 'Welcome & Roll Call', durationMinutes: 5, isCompleted: false },
      { id: 'topic-2', title: 'Sprint Review & Demo', durationMinutes: 15, isCompleted: false },
      { id: 'topic-3', title: 'Blockers & Technical Discussions', durationMinutes: 10, isCompleted: false },
      { id: 'topic-4', title: 'Action Items & Next Steps', durationMinutes: 5, isCompleted: false },
    ];
  });

  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [topicSecondsRemaining, setTopicSecondsRemaining] = useState(() => {
    const firstDuration = (agendaItems[0]?.durationMinutes || 5) * 60;
    return firstDuration;
  });
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);

  const timerRef = useRef(null);
  const isBroadcastingRef = useRef(false);

  // Audio chime for timebox expiration
  const playTimeboxAlertChime = useCallback((isWarning = false) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (isWarning) {
        // 1-minute warning chime (medium tone)
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      } else {
        // Overtime expired chime (double beep)
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25); // A4
      }

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  // Broadcast helper
  const broadcastCurrentAgenda = useCallback(
    (customState = {}) => {
      if (onBroadcastAgenda && !isBroadcastingRef.current) {
        isBroadcastingRef.current = true;
        const stateToBroadcast = {
          items: customState.items || agendaItems,
          activeIndex: customState.activeIndex !== undefined ? customState.activeIndex : activeTopicIndex,
          secondsRemaining: customState.secondsRemaining !== undefined ? customState.secondsRemaining : topicSecondsRemaining,
          isTimerActive: customState.isTimerActive !== undefined ? customState.isTimerActive : isTimerActive,
          isOvertime: customState.isOvertime !== undefined ? customState.isOvertime : isOvertime,
          overtimeSeconds: customState.overtimeSeconds !== undefined ? customState.overtimeSeconds : overtimeSeconds,
          timestamp: Date.now(),
        };
        try {
          onBroadcastAgenda(stateToBroadcast);
        } catch {}
        setTimeout(() => {
          isBroadcastingRef.current = false;
        }, 100);
      }
    },
    [agendaItems, activeTopicIndex, topicSecondsRemaining, isTimerActive, isOvertime, overtimeSeconds, onBroadcastAgenda]
  );

  // Main countdown timer interval
  useEffect(() => {
    if (!isTimerActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTopicSecondsRemaining((prev) => {
        if (prev > 1) {
          // Warning chime when exactly 60 seconds remain
          if (prev === 61) {
            playTimeboxAlertChime(true);
          }
          return prev - 1;
        } else if (prev === 1) {
          // Timebox expired: transition into overtime mode
          playTimeboxAlertChime(false);
          setIsOvertime(true);
          setOvertimeSeconds(1);
          return 0;
        } else {
          // In overtime: count up overtime seconds
          setOvertimeSeconds((ot) => ot + 1);
          return 0;
        }
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerActive, playTimeboxAlertChime]);

  // Start timer
  const startTimer = useCallback(() => {
    setIsTimerActive(true);
    broadcastCurrentAgenda({ isTimerActive: true });
  }, [broadcastCurrentAgenda]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    setIsTimerActive(false);
    broadcastCurrentAgenda({ isTimerActive: false });
  }, [broadcastCurrentAgenda]);

  // Reset topic timer
  const resetTopicTimer = useCallback(
    (index = activeTopicIndex) => {
      const topic = agendaItems[index];
      const initialSecs = (topic?.durationMinutes || 5) * 60;
      setTopicSecondsRemaining(initialSecs);
      setIsOvertime(false);
      setOvertimeSeconds(0);
      broadcastCurrentAgenda({
        secondsRemaining: initialSecs,
        isOvertime: false,
        overtimeSeconds: 0,
      });
    },
    [activeTopicIndex, agendaItems, broadcastCurrentAgenda]
  );

  // Jump to specific topic
  const selectTopic = useCallback(
    (index) => {
      if (index < 0 || index >= agendaItems.length) return;
      setActiveTopicIndex(index);
      const targetDuration = (agendaItems[index]?.durationMinutes || 5) * 60;
      setTopicSecondsRemaining(targetDuration);
      setIsOvertime(false);
      setOvertimeSeconds(0);
      broadcastCurrentAgenda({
        activeIndex: index,
        secondsRemaining: targetDuration,
        isOvertime: false,
        overtimeSeconds: 0,
      });
    },
    [agendaItems, broadcastCurrentAgenda]
  );

  // Advance to next topic
  const nextTopic = useCallback(() => {
    if (activeTopicIndex < agendaItems.length - 1) {
      // Mark current as completed
      const updated = agendaItems.map((item, idx) =>
        idx === activeTopicIndex ? { ...item, isCompleted: true } : item
      );
      setAgendaItems(updated);
      const nextIndex = activeTopicIndex + 1;
      setActiveTopicIndex(nextIndex);
      const targetDuration = (updated[nextIndex]?.durationMinutes || 5) * 60;
      setTopicSecondsRemaining(targetDuration);
      setIsOvertime(false);
      setOvertimeSeconds(0);
      broadcastCurrentAgenda({
        items: updated,
        activeIndex: nextIndex,
        secondsRemaining: targetDuration,
        isOvertime: false,
        overtimeSeconds: 0,
      });
    }
  }, [activeTopicIndex, agendaItems, broadcastCurrentAgenda]);

  // Step back to previous topic
  const prevTopic = useCallback(() => {
    if (activeTopicIndex > 0) {
      const prevIndex = activeTopicIndex - 1;
      setActiveTopicIndex(prevIndex);
      const targetDuration = (agendaItems[prevIndex]?.durationMinutes || 5) * 60;
      setTopicSecondsRemaining(targetDuration);
      setIsOvertime(false);
      setOvertimeSeconds(0);
      broadcastCurrentAgenda({
        activeIndex: prevIndex,
        secondsRemaining: targetDuration,
        isOvertime: false,
        overtimeSeconds: 0,
      });
    }
  }, [activeTopicIndex, agendaItems, broadcastCurrentAgenda]);

  // Toggle item completion
  const toggleTopicCompleted = useCallback(
    (id) => {
      const updated = agendaItems.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      );
      setAgendaItems(updated);
      broadcastCurrentAgenda({ items: updated });
    },
    [agendaItems, broadcastCurrentAgenda]
  );

  // Add new topic
  const addTopic = useCallback(
    (title, durationMinutes = 5) => {
      if (!title || !title.trim()) return;
      const newItem = {
        id: `topic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: title.trim(),
        durationMinutes: Math.max(1, parseInt(durationMinutes, 10) || 5),
        isCompleted: false,
      };
      const updated = [...agendaItems, newItem];
      setAgendaItems(updated);
      broadcastCurrentAgenda({ items: updated });
    },
    [agendaItems, broadcastCurrentAgenda]
  );

  // Remove topic
  const removeTopic = useCallback(
    (id) => {
      if (agendaItems.length <= 1) return; // Keep at least one topic
      const updated = agendaItems.filter((i) => i.id !== id);
      const newActive = Math.min(activeTopicIndex, updated.length - 1);
      setAgendaItems(updated);
      setActiveTopicIndex(newActive);
      broadcastCurrentAgenda({ items: updated, activeIndex: newActive });
    },
    [agendaItems, activeTopicIndex, broadcastCurrentAgenda]
  );

  // Apply incoming remote synchronization from WebSockets
  const applyRemoteSync = useCallback((remoteState) => {
    if (!remoteState) return;
    if (Array.isArray(remoteState.items)) {
      setAgendaItems(remoteState.items);
    }
    if (typeof remoteState.activeIndex === 'number') {
      setActiveTopicIndex(remoteState.activeIndex);
    }
    if (typeof remoteState.secondsRemaining === 'number') {
      setTopicSecondsRemaining(remoteState.secondsRemaining);
    }
    if (typeof remoteState.isTimerActive === 'boolean') {
      setIsTimerActive(remoteState.isTimerActive);
    }
    if (typeof remoteState.isOvertime === 'boolean') {
      setIsOvertime(remoteState.isOvertime);
    }
    if (typeof remoteState.overtimeSeconds === 'number') {
      setOvertimeSeconds(remoteState.overtimeSeconds);
    }
  }, []);

  // Format time display
  const formatTimeRemaining = () => {
    if (isOvertime) {
      const mins = Math.floor(overtimeSeconds / 60);
      const secs = overtimeSeconds % 60;
      return `+${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    const mins = Math.floor(topicSecondsRemaining / 60);
    const secs = topicSecondsRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeTopic = agendaItems[activeTopicIndex] || null;
  const totalAllocatedMinutes = agendaItems.reduce((acc, i) => acc + (i.durationMinutes || 0), 0);
  const completedCount = agendaItems.filter((i) => i.isCompleted).length;
  const progressPercent = activeTopic
    ? Math.max(0, Math.min(100, Math.round(((activeTopic.durationMinutes * 60 - topicSecondsRemaining) / (activeTopic.durationMinutes * 60)) * 100)))
    : 0;

  return {
    agendaItems,
    activeTopicIndex,
    activeTopic,
    topicSecondsRemaining,
    isTimerActive,
    isOvertime,
    overtimeSeconds,
    progressPercent,
    totalAllocatedMinutes,
    completedCount,
    formatTimeRemaining,
    startTimer,
    pauseTimer,
    resetTopicTimer,
    selectTopic,
    nextTopic,
    prevTopic,
    toggleTopicCompleted,
    addTopic,
    removeTopic,
    applyRemoteSync,
    broadcastCurrentAgenda,
  };
}

export default useAgendaTimer;
