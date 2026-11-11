import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom Hook: useMeetingRecorder
 * 
 * Provides robust in-call meeting recording:
 * - Mixed Audio (Local Microphone + Remote Peers + System/Tab Audio)
 * - Display / Tab / Screen Capture or Direct Stream Capture
 * - Pause, Resume, Stop, and Instant Preview
 * - Universal WebM / MP4 Export & Download
 */
export function useMeetingRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [recordingSize, setRecordingSize] = useState(0);
  const [recordingMimeType, setRecordingMimeType] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const [recordingRoom, setRecordingRoom] = useState('');

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const mixedStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const displayStreamRef = useRef(null);

  // Clear timer interval
  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Cleanup all active tracks and audio contexts
  const cleanupStreams = useCallback(() => {
    clearTimer();

    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch {}
      });
      displayStreamRef.current = null;
    }

    if (mixedStreamRef.current) {
      mixedStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch {}
      });
      mixedStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  }, [clearTimer]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupStreams();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [cleanupStreams, recordedUrl]);

  /**
   * Determine best supported MIME type
   */
  const getSupportedMimeType = useCallback(() => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
    ];
    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return '';
  }, []);

  /**
   * Start Meeting Recording
   * @param {Object} options
   * @param {'screen'|'direct'} options.mode - 'screen' for full tab/screen, 'direct' for local/remote video
   * @param {MediaStream} options.localStream - Current user's camera/mic stream
   * @param {MediaStream} options.screenStream - Current user's screen share stream (if any)
   * @param {Map<string, MediaStream>} options.remoteStreams - Map of peerId -> remote MediaStream
   * @param {string} options.room - Current meeting room code
   */
  const startRecording = useCallback(
    async ({
      mode = 'screen',
      localStream = null,
      screenStream = null,
      remoteStreams = null,
      room = 'general',
    } = {}) => {
      try {
        setRecordingError(null);
        recordedChunksRef.current = [];
        setRecordingRoom(room);

        // Revoke previous URL if any
        if (recordedUrl) {
          URL.revokeObjectURL(recordedUrl);
          setRecordedUrl(null);
        }
        setRecordedBlob(null);
        setRecordingSize(0);
        setRecordingDuration(0);

        // 1. Initialize AudioContext for mixed audio
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const destination = audioCtx.createMediaStreamDestination();
        let hasAudio = false;

        // 2. Obtain video track
        let videoTrack = null;
        let displayStream = null;

        if (mode === 'screen' && navigator.mediaDevices?.getDisplayMedia) {
          try {
            // Request display media with current tab preference
            displayStream = await navigator.mediaDevices.getDisplayMedia({
              video: {
                displaySurface: 'browser',
                frameRate: { ideal: 30, max: 60 },
              },
              audio: true,
              preferCurrentTab: true,
            });
            displayStreamRef.current = displayStream;

            const vTracks = displayStream.getVideoTracks();
            if (vTracks.length > 0) {
              videoTrack = vTracks[0];
            }

            // Capture system/tab audio from display media if available
            const dAudioTracks = displayStream.getAudioTracks();
            if (dAudioTracks.length > 0) {
              const displayAudioSource = audioCtx.createMediaStreamSource(
                new MediaStream([dAudioTracks[0]])
              );
              displayAudioSource.connect(destination);
              hasAudio = true;
            }

            // When user clicks "Stop Sharing" on the browser native banner, gracefully stop recording
            if (videoTrack) {
              videoTrack.onended = () => {
                stopRecording();
              };
            }
          } catch (displayErr) {
            // If user canceled the screen picker, don't crash, report or fallback
            if (displayErr.name === 'NotAllowedError') {
              console.log('[Recorder] Screen share picker dismissed by user.');
              cleanupStreams();
              return false;
            }
            console.warn('[Recorder] getDisplayMedia failed, falling back to direct video stream:', displayErr);
          }
        }

        // Fallback or direct mode: use screenStream or localStream video
        if (!videoTrack) {
          if (screenStream && screenStream.getVideoTracks().length > 0) {
            videoTrack = screenStream.getVideoTracks()[0];
          } else if (localStream && localStream.getVideoTracks().length > 0) {
            videoTrack = localStream.getVideoTracks()[0];
          }
        }

        // 3. Connect Local Microphone to Audio Destination
        if (localStream && localStream.getAudioTracks().length > 0) {
          try {
            const micTrack = localStream.getAudioTracks()[0];
            const micSource = audioCtx.createMediaStreamSource(new MediaStream([micTrack]));
            micSource.connect(destination);
            hasAudio = true;
          } catch (e) {
            console.warn('[Recorder] Failed to connect local mic to recorder:', e);
          }
        }

        // 4. Connect Remote Peers Audio to Audio Destination
        if (remoteStreams && remoteStreams instanceof Map) {
          remoteStreams.forEach((rStream) => {
            if (rStream && rStream.getAudioTracks().length > 0) {
              try {
                const rAudioSource = audioCtx.createMediaStreamSource(rStream);
                rAudioSource.connect(destination);
                hasAudio = true;
              } catch (e) {
                console.warn('[Recorder] Failed to connect remote audio to recorder:', e);
              }
            }
          });
        }

        // 5. Construct Combined MediaStream
        const tracksToRecord = [];
        if (videoTrack) {
          tracksToRecord.push(videoTrack);
        }
        if (hasAudio) {
          const mixedAudioTrack = destination.stream.getAudioTracks()[0];
          if (mixedAudioTrack) {
            tracksToRecord.push(mixedAudioTrack);
          }
        }

        if (tracksToRecord.length === 0) {
          throw new Error('No active video or audio tracks available to record.');
        }

        const combinedStream = new MediaStream(tracksToRecord);
        mixedStreamRef.current = combinedStream;

        // 6. Setup MediaRecorder
        const mimeType = getSupportedMimeType();
        setRecordingMimeType(mimeType);

        const recorderOptions = mimeType ? { mimeType } : undefined;
        const recorder = new MediaRecorder(combinedStream, recorderOptions);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const finalMime = mimeType || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type: finalMime });
          const url = URL.createObjectURL(blob);

          setRecordedBlob(blob);
          setRecordedUrl(url);
          setRecordingSize(blob.size);
          setIsRecording(false);
          setIsRecordingPaused(false);
          setIsPreviewOpen(true);
          cleanupStreams();
        };

        recorder.onerror = (errEvent) => {
          console.error('[Recorder] MediaRecorder error:', errEvent);
          setRecordingError('Recording error encountered.');
          cleanupStreams();
        };

        // Start recording with 1-second chunks for resilience
        recorder.start(1000);
        setIsRecording(true);
        setIsRecordingPaused(false);

        // Start duration timer
        clearTimer();
        timerIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);

        return true;
      } catch (err) {
        console.error('[Recorder] Failed to start recording:', err);
        setRecordingError(err.message || 'Failed to start recording');
        cleanupStreams();
        return false;
      }
    },
    [clearTimer, cleanupStreams, getSupportedMimeType, recordedUrl]
  );

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
        setIsRecordingPaused(true);
        clearTimer();
      } catch (e) {
        console.warn('[Recorder] Failed to pause recorder:', e);
      }
    }
  }, [clearTimer]);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
        setIsRecordingPaused(false);
        clearTimer();
        timerIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      } catch (e) {
        console.warn('[Recorder] Failed to resume recorder:', e);
      }
    }
  }, [clearTimer]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    clearTimer();
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('[Recorder] Failed to stop recorder gracefully:', e);
        cleanupStreams();
      }
    } else {
      cleanupStreams();
    }
  }, [clearTimer, cleanupStreams]);

  /**
   * Discard current recorded session
   */
  const discardRecording = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setRecordedBlob(null);
    setRecordingSize(0);
    setRecordingDuration(0);
    setIsPreviewOpen(false);
    setRecordingError(null);
  }, [recordedUrl]);

  /**
   * Download recording to local disk
   */
  const downloadRecording = useCallback(
    (customFilename = '', format = 'webm') => {
      if (!recordedUrl && !recordedBlob) return;

      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const roomTag = recordingRoom ? `${recordingRoom}-` : '';
      const ext = format === 'mp4' ? 'mp4' : 'webm';
      const filename = customFilename || `PCS-Meeting-${roomTag}${dateStr}.${ext}`;

      const link = document.createElement('a');
      link.href = recordedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [recordedBlob, recordedUrl, recordingRoom]
  );

  return {
    isRecording,
    isRecordingPaused,
    recordingDuration,
    recordedBlob,
    recordedUrl,
    recordingSize,
    recordingMimeType,
    isPreviewOpen,
    setIsPreviewOpen,
    recordingError,
    recordingRoom,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    downloadRecording,
  };
}

export default useMeetingRecorder;
