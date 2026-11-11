import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom Hook: useSpeakerQueue
 * 
 * Manages in-call speaker turn-taking, FIFO hand-raise queue, active floor speaker,
 * and synchronized speaker turn timers across WebRTC participants.
 */
export function useSpeakerQueue({ onBroadcastSpeakerQueue = null } = {}) {
  const [speakerQueue, setSpeakerQueue] = useState([]); // Array<{ peerId, name, officeId, raisedAt }>
  const [activeSpeaker, setActiveSpeaker] = useState(null); // { peerId, name, officeId, startedAt, turnDurationSecs } | null
  const [speakerSecondsRemaining, setSpeakerSecondsRemaining] = useState(120); // Default 2-minute speaker timebox
  const [isSpeakerTimerRunning, setIsSpeakerTimerRunning] = useState(false);

  const speakerTimerRef = useRef(null);
  const isBroadcastingRef = useRef(false);

  // Chime when speaker turn transitions or expires
  const playFloorChime = useCallback((isWarning = false) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (isWarning) {
        // 15-second wrap-up warning chime
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      } else {
        // Floor transition chime
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2); // A5
      }

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, []);

  // Broadcast helper
  const broadcastState = useCallback(
    (customQueue, customSpeaker) => {
      if (onBroadcastSpeakerQueue && !isBroadcastingRef.current) {
        isBroadcastingRef.current = true;
        const q = customQueue !== undefined ? customQueue : speakerQueue;
        const s = customSpeaker !== undefined ? customSpeaker : activeSpeaker;
        try {
          onBroadcastSpeakerQueue({
            speakerQueue: q,
            activeSpeaker: s,
            timestamp: Date.now(),
          });
        } catch {}
        setTimeout(() => {
          isBroadcastingRef.current = false;
        }, 100);
      }
    },
    [speakerQueue, activeSpeaker, onBroadcastSpeakerQueue]
  );

  // Speaker turn timer interval
  useEffect(() => {
    if (!isSpeakerTimerRunning || !activeSpeaker) {
      if (speakerTimerRef.current) {
        clearInterval(speakerTimerRef.current);
        speakerTimerRef.current = null;
      }
      return;
    }

    speakerTimerRef.current = setInterval(() => {
      setSpeakerSecondsRemaining((prev) => {
        if (prev > 1) {
          if (prev === 16) {
            playFloorChime(true);
          }
          return prev - 1;
        } else {
          // Time expired
          playFloorChime(false);
          setIsSpeakerTimerRunning(false);
          return 0;
        }
      });
    }, 1000);

    return () => {
      if (speakerTimerRef.current) {
        clearInterval(speakerTimerRef.current);
        speakerTimerRef.current = null;
      }
    };
  }, [isSpeakerTimerRunning, activeSpeaker, playFloorChime]);

  // Join speaker queue (raise hand)
  const joinQueue = useCallback(
    ({ peerId, name, officeId = '' }) => {
      if (!peerId) return;
      setSpeakerQueue((prev) => {
        if (prev.some((p) => p.peerId === peerId)) return prev;
        const updated = [
          ...prev,
          {
            peerId,
            name: name || 'Participant',
            officeId,
            raisedAt: Date.now(),
          },
        ];
        broadcastState(updated, activeSpeaker);
        return updated;
      });
    },
    [activeSpeaker, broadcastState]
  );

  // Leave speaker queue (lower hand)
  const leaveQueue = useCallback(
    (peerId) => {
      setSpeakerQueue((prev) => {
        const updated = prev.filter((p) => p.peerId !== peerId);
        broadcastState(updated, activeSpeaker);
        return updated;
      });
    },
    [activeSpeaker, broadcastState]
  );

  // Hand the floor to a specific peer
  const giveFloor = useCallback(
    (peer, turnMinutes = 2) => {
      if (!peer) return;
      const turnDurationSecs = Math.max(30, turnMinutes * 60);
      const newActive = {
        peerId: peer.peerId,
        name: peer.name || 'Participant',
        officeId: peer.officeId || '',
        startedAt: Date.now(),
        turnDurationSecs,
      };

      // Remove this peer from the waiting queue if present
      const updatedQueue = speakerQueue.filter((p) => p.peerId !== peer.peerId);
      setSpeakerQueue(updatedQueue);
      setActiveSpeaker(newActive);
      setSpeakerSecondsRemaining(turnDurationSecs);
      setIsSpeakerTimerRunning(true);
      playFloorChime(false);

      broadcastState(updatedQueue, newActive);
    },
    [speakerQueue, broadcastState, playFloorChime]
  );

  // Pass floor to next waiting peer in queue
  const passToNextSpeaker = useCallback(
    (turnMinutes = 2) => {
      if (speakerQueue.length === 0) {
        // No one waiting, clear the floor
        setActiveSpeaker(null);
        setIsSpeakerTimerRunning(false);
        broadcastState(speakerQueue, null);
        return;
      }

      const nextPeer = speakerQueue[0];
      const remainingQueue = speakerQueue.slice(1);
      const turnDurationSecs = Math.max(30, turnMinutes * 60);
      const newActive = {
        peerId: nextPeer.peerId,
        name: nextPeer.name,
        officeId: nextPeer.officeId,
        startedAt: Date.now(),
        turnDurationSecs,
      };

      setSpeakerQueue(remainingQueue);
      setActiveSpeaker(newActive);
      setSpeakerSecondsRemaining(turnDurationSecs);
      setIsSpeakerTimerRunning(true);
      playFloorChime(false);

      broadcastState(remainingQueue, newActive);
    },
    [speakerQueue, broadcastState, playFloorChime]
  );

  // Clear / release the floor
  const clearFloor = useCallback(() => {
    setActiveSpeaker(null);
    setIsSpeakerTimerRunning(false);
    broadcastState(speakerQueue, null);
  }, [speakerQueue, broadcastState]);

  // Apply remote state from WebSocket broadcast
  const applyRemoteSync = useCallback(({ speakerQueue: remoteQueue, activeSpeaker: remoteSpeaker }) => {
    if (Array.isArray(remoteQueue)) {
      setSpeakerQueue(remoteQueue);
    }
    if (remoteSpeaker !== undefined) {
      setActiveSpeaker(remoteSpeaker);
      if (remoteSpeaker) {
        const elapsed = Math.floor((Date.now() - remoteSpeaker.startedAt) / 1000);
        const rem = Math.max(0, (remoteSpeaker.turnDurationSecs || 120) - elapsed);
        setSpeakerSecondsRemaining(rem);
        setIsSpeakerTimerRunning(rem > 0);
      } else {
        setIsSpeakerTimerRunning(false);
      }
    }
  }, []);

  // Format turn timer display
  const formatSpeakerRemaining = () => {
    const mins = Math.floor(speakerSecondsRemaining / 60);
    const secs = speakerSecondsRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return {
    speakerQueue,
    activeSpeaker,
    speakerSecondsRemaining,
    isSpeakerTimerRunning,
    formatSpeakerRemaining,
    joinQueue,
    leaveQueue,
    giveFloor,
    passToNextSpeaker,
    clearFloor,
    applyRemoteSync,
  };
}

export default useSpeakerQueue;
