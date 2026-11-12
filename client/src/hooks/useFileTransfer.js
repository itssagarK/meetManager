import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom Hook: useFileTransfer
 * Manages zero-cloud, peer-to-peer file and document sharing across WebRTC DataChannels.
 * Slices files into 48KB binary chunks (yielding ~64KB Base64 packets) with WebRTC
 * buffer flow control, progress tracking, and automatic download blob assembly.
 */
export function useFileTransfer({ localPeerId, localName, onFileReceivedNotification }) {
  const [files, setFiles] = useState([]);
  const [unreadFilesCount, setUnreadFilesCount] = useState(0);

  // References to active WebRTC DataChannels mapped by peerId
  const dataChannelsRef = useRef(new Map());

  // Incoming transfer buffers: fileId -> { meta, chunks: [], receivedChunksCount, totalChunks }
  const incomingBuffersRef = useRef(new Map());

  // Active outgoing transfer cancellation flags: fileId -> boolean
  const outgoingTransfersRef = useRef(new Map());

  // Keep latest callback refs to prevent stale closures
  const onFileReceivedNotificationRef = useRef(onFileReceivedNotification);
  useEffect(() => {
    onFileReceivedNotificationRef.current = onFileReceivedNotification;
  }, [onFileReceivedNotification]);

  // Subtle synthesized audio chime when a file transfer completes
  const playFileCompletedChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.09); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc1.stop(ctx.currentTime + 0.1);
      osc2.start(ctx.currentTime + 0.09);
      osc2.stop(ctx.currentTime + 0.32);
    } catch (_) {}
  }, []);

  /**
   * Helper to decode Base64 string into a Uint8Array
   */
  const base64ToUint8Array = (base64) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  /**
   * Helper to encode ArrayBuffer/Uint8Array to Base64 string
   */
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  /**
   * Process incoming DataChannel messages
   */
  const handleIncomingMessage = useCallback(
    (rawMessage, fromPeerId) => {
      try {
        let msg;
        if (typeof rawMessage === 'string') {
          msg = JSON.parse(rawMessage);
        } else {
          return;
        }

        if (!msg || !msg.type) return;

        // 1. File Metadata Offer
        if (msg.type === 'file-meta') {
          const { fileId, name, size, mimeType, senderName, totalChunks } = msg;

          incomingBuffersRef.current.set(fileId, {
            meta: msg,
            chunks: Array.from({ length: totalChunks }),
            receivedChunksCount: 0,
            receivedBytes: 0,
            totalChunks,
          });

          setFiles((prev) => {
            // Check if already in list
            if (prev.some((f) => f.id === fileId)) return prev;
            return [
              {
                id: fileId,
                name,
                size,
                mimeType,
                senderPeerId: fromPeerId,
                senderName: senderName || 'Peer',
                isMe: false,
                status: 'receiving',
                progress: 0,
                transferredBytes: 0,
                totalChunks,
                downloadUrl: null,
                timestamp: Date.now(),
              },
              ...prev,
            ];
          });

          setUnreadFilesCount((prev) => prev + 1);

          if (onFileReceivedNotificationRef.current) {
            onFileReceivedNotificationRef.current({
              name,
              senderName: senderName || 'A participant',
              size,
            });
          }
        }

        // 2. File Binary Chunk
        else if (msg.type === 'file-chunk') {
          const { fileId, chunkIndex, data } = msg;
          const incoming = incomingBuffersRef.current.get(fileId);
          if (!incoming) return;

          const chunkBytes = base64ToUint8Array(data);
          incoming.chunks[chunkIndex] = chunkBytes;
          incoming.receivedChunksCount += 1;
          incoming.receivedBytes += chunkBytes.byteLength;

          const progress = Math.min(
            99,
            Math.round((incoming.receivedChunksCount / incoming.totalChunks) * 100)
          );

          // Throttle progress updates to UI every 5 chunks or at completion
          if (incoming.receivedChunksCount % 5 === 0 || incoming.receivedChunksCount === incoming.totalChunks) {
            setFiles((prev) =>
              prev.map((f) => {
                if (f.id === fileId) {
                  return {
                    ...f,
                    progress,
                    transferredBytes: incoming.receivedBytes,
                  };
                }
                return f;
              })
            );
          }

          // If all chunks received, assemble Blob and create download link
          if (incoming.receivedChunksCount === incoming.totalChunks) {
            const blob = new Blob(incoming.chunks, {
              type: incoming.meta.mimeType || 'application/octet-stream',
            });
            const downloadUrl = URL.createObjectURL(blob);

            incomingBuffersRef.current.delete(fileId);

            setFiles((prev) =>
              prev.map((f) => {
                if (f.id === fileId) {
                  return {
                    ...f,
                    status: 'completed',
                    progress: 100,
                    transferredBytes: f.size,
                    downloadUrl,
                  };
                }
                return f;
              })
            );

            playFileCompletedChime();
          }
        }

        // 3. File Transfer Cancelled
        else if (msg.type === 'file-cancel') {
          const { fileId } = msg;
          incomingBuffersRef.current.delete(fileId);
          setFiles((prev) =>
            prev.map((f) => {
              if (f.id === fileId) {
                return {
                  ...f,
                  status: 'cancelled',
                  error: 'Transfer cancelled by sender',
                };
              }
              return f;
            })
          );
        }
      } catch (err) {
        console.warn('[P2P DataChannel] Error parsing message:', err);
      }
    },
    [playFileCompletedChime]
  );

  /**
   * Attach event handlers to an RTCDataChannel
   */
  const setupDataChannel = useCallback(
    (remotePeerId, dataChannel) => {
      if (!dataChannel) return;

      dataChannel.binaryType = 'arraybuffer';

      dataChannel.onopen = () => {
        console.log(`[P2P DataChannel] Channel '${dataChannel.label}' open with ${remotePeerId}`);
        dataChannelsRef.current.set(remotePeerId, dataChannel);
      };

      dataChannel.onclose = () => {
        console.log(`[P2P DataChannel] Channel '${dataChannel.label}' closed with ${remotePeerId}`);
        dataChannelsRef.current.delete(remotePeerId);
      };

      dataChannel.onerror = (err) => {
        console.warn(`[P2P DataChannel] Channel error with ${remotePeerId}:`, err);
      };

      dataChannel.onmessage = (event) => {
        handleIncomingMessage(event.data, remotePeerId);
      };

      if (dataChannel.readyState === 'open') {
        dataChannelsRef.current.set(remotePeerId, dataChannel);
      }
    },
    [handleIncomingMessage]
  );

  /**
   * Called by connection initiator to create data channel
   */
  const createDataChannelForPeer = useCallback(
    (pc, remotePeerId) => {
      try {
        const dc = pc.createDataChannel('pcs-p2p-files', { ordered: true });
        setupDataChannel(remotePeerId, dc);
        return dc;
      } catch (err) {
        console.warn(`Failed to create DataChannel for ${remotePeerId}:`, err);
        return null;
      }
    },
    [setupDataChannel]
  );

  /**
   * Called by peer connection receiver when remote creates data channel
   */
  const handleDataChannelEvent = useCallback(
    (remotePeerId, dataChannel) => {
      setupDataChannel(remotePeerId, dataChannel);
    },
    [setupDataChannel]
  );

  /**
   * Clean up data channel when a peer departs
   */
  const closeDataChannelForPeer = useCallback((remotePeerId) => {
    if (dataChannelsRef.current.has(remotePeerId)) {
      try {
        dataChannelsRef.current.get(remotePeerId).close();
      } catch (_) {}
      dataChannelsRef.current.delete(remotePeerId);
    }
  }, []);

  /**
   * Send one or multiple files to all connected peers
   */
  const sendFilesToPeers = useCallback(
    async (fileList) => {
      if (!fileList || fileList.length === 0) return;

      const activeChannels = Array.from(dataChannelsRef.current.values()).filter(
        (dc) => dc.readyState === 'open'
      );

      if (activeChannels.length === 0) {
        throw new Error('No peer data channels are open yet. Wait for participants to connect.');
      }

      for (let f = 0; f < fileList.length; f++) {
        const file = fileList[f];
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const CHUNK_SIZE = 48 * 1024; // 48KB chunk -> ~64KB base64 packet
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE) || 1;

        outgoingTransfersRef.current.set(fileId, true);

        // Pre-create local blob URL for instant preview/download by sender
        const senderBlobUrl = URL.createObjectURL(file);

        // Add to local state
        const newFileItem = {
          id: fileId,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          senderPeerId: localPeerId,
          senderName: localName || 'You',
          isMe: true,
          status: 'sending',
          progress: 0,
          transferredBytes: 0,
          totalChunks,
          downloadUrl: senderBlobUrl,
          timestamp: Date.now(),
        };

        setFiles((prev) => [newFileItem, ...prev]);

        // 1. Broadcast file metadata
        const metaPacket = JSON.stringify({
          type: 'file-meta',
          fileId,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          senderName: localName || 'You',
          totalChunks,
          chunkSize: CHUNK_SIZE,
        });

        for (const dc of activeChannels) {
          try {
            dc.send(metaPacket);
          } catch (e) {
            console.warn('Failed to send file-meta to channel:', e);
          }
        }

        // 2. Stream binary slices with flow control
        let offset = 0;
        let chunkIndex = 0;

        while (offset < file.size) {
          if (!outgoingTransfersRef.current.get(fileId)) {
            // Cancelled
            const cancelPacket = JSON.stringify({ type: 'file-cancel', fileId });
            for (const dc of activeChannels) {
              try { dc.send(cancelPacket); } catch (_) {}
            }
            break;
          }

          const slice = file.slice(offset, offset + CHUNK_SIZE);
          const buffer = await slice.arrayBuffer();
          const base64Data = arrayBufferToBase64(buffer);

          const chunkPacket = JSON.stringify({
            type: 'file-chunk',
            fileId,
            chunkIndex,
            totalChunks,
            data: base64Data,
          });

          // Flow control: check bufferedAmount across channels
          for (const dc of activeChannels) {
            if (dc.readyState === 'open') {
              if (dc.bufferedAmount > 256 * 1024) {
                await new Promise((resolve) => {
                  const onLow = () => {
                    dc.removeEventListener('bufferedamountlow', onLow);
                    resolve();
                  };
                  dc.bufferedAmountLowThreshold = 64 * 1024;
                  dc.addEventListener('bufferedamountlow', onLow);
                  setTimeout(resolve, 60); // safety fallback
                });
              }
              try {
                dc.send(chunkPacket);
              } catch (e) {
                console.warn('Error sending chunk:', e);
              }
            }
          }

          offset += CHUNK_SIZE;
          chunkIndex += 1;

          const progress = Math.min(99, Math.round((chunkIndex / totalChunks) * 100));

          if (chunkIndex % 5 === 0 || chunkIndex === totalChunks) {
            setFiles((prev) =>
              prev.map((item) => {
                if (item.id === fileId) {
                  return {
                    ...item,
                    progress,
                    transferredBytes: Math.min(offset, file.size),
                  };
                }
                return item;
              })
            );
          }

          // Small yield to allow UI rendering and browser thread scheduling
          if (chunkIndex % 10 === 0) {
            await new Promise((r) => setTimeout(r, 10));
          }
        }

        // Mark local transfer as completed
        setFiles((prev) =>
          prev.map((item) => {
            if (item.id === fileId) {
              return {
                ...item,
                status: 'completed',
                progress: 100,
                transferredBytes: file.size,
              };
            }
            return item;
          })
        );
      }
    },
    [localPeerId, localName]
  );

  /**
   * Cancel an in-progress transfer
   */
  const cancelTransfer = useCallback((fileId) => {
    outgoingTransfersRef.current.set(fileId, false);
    incomingBuffersRef.current.delete(fileId);
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          return { ...f, status: 'cancelled', error: 'Transfer cancelled' };
        }
        return f;
      })
    );
  }, []);

  /**
   * Clear all file records and revoke created blob URLs
   */
  const clearAllTransfers = useCallback(() => {
    files.forEach((f) => {
      if (f.downloadUrl && f.downloadUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(f.downloadUrl);
        } catch (_) {}
      }
    });
    setFiles([]);
    setUnreadFilesCount(0);
    incomingBuffersRef.current.clear();
    outgoingTransfersRef.current.clear();
  }, [files]);

  /**
   * Mark all unread files as read when drawer is opened
   */
  const markFilesAsRead = useCallback(() => {
    setUnreadFilesCount(0);
  }, []);

  return {
    files,
    unreadFilesCount,
    connectedPeersWithDataChannels: dataChannelsRef.current.size,
    sendFilesToPeers,
    cancelTransfer,
    clearAllTransfers,
    markFilesAsRead,
    createDataChannelForPeer,
    handleDataChannelEvent,
    closeDataChannelForPeer,
  };
}

export default useFileTransfer;
