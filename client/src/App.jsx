import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  isChromeExtension,
  getApiUrl,
  getWsUrl,
  getPublicWebOrigin,
  API_URL,
  RTC_CONFIG,
  initialFormData,
  priorityOrder,
} from './config/constants.js';
import ImageLightbox from './components/common/ImageLightbox.jsx';
import Toast from './components/common/Toast.jsx';
import FloatingChatDock from './components/chat/FloatingChatDock.jsx';
import PublicPortalView from './components/views/PublicPortalView.jsx';
import GlobalChatView from './components/views/GlobalChatView.jsx';
import GuestLobbyView from './components/views/GuestLobbyView.jsx';
import CalendarView from './components/views/CalendarView.jsx';
import TableView from './components/views/TableView.jsx';
import CardsView from './components/views/CardsView.jsx';
import AnalyticsView from './components/views/AnalyticsView.jsx';
import DayScheduleSidebar from './components/views/DayScheduleSidebar.jsx';
import CommandPalette from './components/modals/CommandPalette.jsx';
import ItemDrawer from './components/modals/ItemDrawer.jsx';
import QuickJoinModal from './components/modals/QuickJoinModal.jsx';
import CreateRoomModal from './components/modals/CreateRoomModal.jsx';
import HostKnockModal from './components/modals/HostKnockModal.jsx';
import RecordingModal from './components/modals/RecordingModal.jsx';
import ConferenceOverlay from './components/conference/ConferenceOverlay.jsx';
import useMeetingRecorder from './hooks/useMeetingRecorder.js';
import useAgendaTimer from './hooks/useAgendaTimer.js';
import useSpeakerQueue from './hooks/useSpeakerQueue.js';

function App() {
  // Multi-Tenant Workspace State
  const [workspaceId, setWorkspaceId] = useState(() => {
    const saved = localStorage.getItem('mm_workspace_id');
    if (saved) return saved;
    const newId = `ws-${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('mm_workspace_id', newId);
    return newId;
  });

  const [items, setItems] = useState(() => {
    const savedWs = localStorage.getItem('mm_workspace_id');
    const cached = savedWs ? localStorage.getItem(`mm_cached_items_${savedWs}`) : localStorage.getItem('mm_cached_items');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'tasks' | 'meetings'
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table' | 'cards' | 'analytics'
  const [calSubView, setCalSubView] = useState('month'); // 'month' | 'week'
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [toastMessage, setToastMessage] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dismissTriage, setDismissTriage] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof Notification !== 'undefined') {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const alertedMeetingsRef = useRef(new Set());

  // WebRTC Video Calling ("Instant PCS Meet Room" - Multi-User Google Meet Experience)
  const [myPeerId] = useState(() => 'peer_' + Math.random().toString(36).substring(2, 9));
  const [activeCallRoom, setActiveCallRoom] = useState(null);
  const [connectedPeers, setConnectedPeers] = useState([]); // Array of { peerId, name, isHost, stream, isAudioMuted, isVideoOff, isHandRaised, quality }
  const [speakingPeers, setSpeakingPeers] = useState(new Set()); // Set of peerIds currently speaking
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [callStatusText, setCallStatusText] = useState('');
  const [iceServersList, setIceServersList] = useState(RTC_CONFIG.iceServers);
  const [callQuality, setCallQuality] = useState('connecting'); // 'connecting' | 'stable' | 'relayed' | 'reconnecting' | 'failed'
  const [publicBaseUrl, setPublicBaseUrl] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [meetingDrawerTab, setMeetingDrawerTab] = useState(null); // null | 'chat' | 'people' | 'info'
  const [meetingLayout, setMeetingLayout] = useState('grid'); // 'grid' | 'spotlight'
  const [pinnedParticipant, setPinnedParticipant] = useState(null); // null | 'local' | peerId
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isCallFullscreen, setIsCallFullscreen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('room'));
    }
    return false;
  });

  // Public Meeting Portal State (?public=1 or ?portal=1)
  const [isPublicPortal, setIsPublicPortal] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('public')) || Boolean(params.get('portal'));
    }
    return false;
  });
  const [publicMeetings, setPublicMeetings] = useState([]);
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  const [publicDirectRoomInput, setPublicDirectRoomInput] = useState('');

  // Guest Waiting Room & Knocking State
  const [guestName, setGuestName] = useState(() => {
    return (typeof window !== 'undefined' && sessionStorage.getItem('pcs_guest_name')) || '';
  });
  const [guestOfficeId, setGuestOfficeId] = useState(() => {
    return (typeof window !== 'undefined' && sessionStorage.getItem('pcs_guest_office_id')) || '';
  });
  const [guestKnockStatus, setGuestKnockStatus] = useState('idle'); // 'idle' | 'knocking' | 'admitted' | 'denied'
  const [guestDeniedReason, setGuestDeniedReason] = useState('');
  const [isHostOnlineInRoom, setIsHostOnlineInRoom] = useState(false);

  // Host Admission & Knocking Queue State
  const [pendingKnocks, setPendingKnocks] = useState([]);
  const [isHostInCall, setIsHostInCall] = useState(false);

  // Global Online Chat & Collaboration Room State
  const [isGlobalChatMode, setIsGlobalChatMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('chat'));
    }
    return false;
  });
  const [activeChatRoom, setActiveChatRoom] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('chat') || 'general';
    }
    return 'general';
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatAttachment, setChatAttachment] = useState(null); // { url, type, name }
  const [isRoomChatOpen, setIsRoomChatOpen] = useState(false);
  const [activeImageLightbox, setActiveImageLightbox] = useState(null);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [newRoomInputCode, setNewRoomInputCode] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { id, sender, content }
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [isQuickJoinModalOpen, setIsQuickJoinModalOpen] = useState(false);
  const [chatOnlineCount, setChatOnlineCount] = useState(1);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isDraggingOverChat, setIsDraggingOverChat] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [unreadWhileScrolled, setUnreadWhileScrolled] = useState(0);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const chatMessagesEndRef = useRef(null);
  const chatFileInputRef = useRef(null);
  const restoreFileInputRef = useRef(null);
  const chatWsRef = useRef(null);

  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // peerId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map()); // peerId -> MediaStream
  const peerIceQueuesRef = useRef(new Map()); // peerId -> RTCIceCandidate[]
  const peerAudioAnalysersRef = useRef(new Map()); // peerId -> AnalyserNode
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const wsSignalingRef = useRef(null);
  const statsIntervalRef = useRef(null);

  // In-Call Meeting Recording Engine
  const {
    isRecording,
    isRecordingPaused,
    recordingDuration,
    recordedUrl,
    recordingSize,
    recordingMimeType,
    isPreviewOpen,
    setIsPreviewOpen,
    recordingRoom,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    downloadRecording,
  } = useMeetingRecorder();

  // Agenda Timer & Speaker Turn-Taking Engine
  const broadcastAgendaToRoom = useCallback((state) => {
    if (wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN && activeCallRoom) {
      wsSignalingRef.current.send(
        JSON.stringify({
          type: 'agenda-sync',
          roomId: activeCallRoom,
          agenda: state,
        })
      );
    }
  }, [activeCallRoom]);

  const broadcastSpeakerQueueToRoom = useCallback((state) => {
    if (wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN && activeCallRoom) {
      wsSignalingRef.current.send(
        JSON.stringify({
          type: 'speaker-queue-sync',
          roomId: activeCallRoom,
          speakerQueue: state.speakerQueue,
          activeSpeaker: state.activeSpeaker,
        })
      );
    }
  }, [activeCallRoom]);

  const agendaState = useAgendaTimer({
    onBroadcastAgenda: broadcastAgendaToRoom,
  });

  const speakerState = useSpeakerQueue({
    onBroadcastSpeakerQueue: broadcastSpeakerQueueToRoom,
  });

  const handleStartCallRecording = async () => {
    showToast('Select meeting tab or screen to record with mixed audio...');
    const ok = await startRecording({
      mode: 'screen',
      localStream: localStreamRef.current,
      screenStream: screenStreamRef.current,
      remoteStreams: remoteStreamsRef.current,
      room: activeCallRoom || 'general',
    });
    if (ok) {
      showToast('Meeting recording active');
    }
  };

  const handleAttachRecordingToMeeting = async (meetingId, noteText) => {
    const targetItem = items.find((i) => i.id === meetingId);
    if (!targetItem) return;
    const updatedNotes = targetItem.notes ? `${targetItem.notes}\n\n${noteText}` : noteText;
    const updated = { ...targetItem, notes: updatedNotes };
    setItems((prev) => prev.map((i) => (i.id === meetingId ? updated : i)));
    try {
      await fetchWithWorkspace(`${API_URL}/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      showToast('Recording note attached to meeting');
    } catch {
      showToast('Saved locally');
    }
  };

  // Focus Sprint (Pomodoro Buffer Timer)
  const [focusSprintSeconds, setFocusSprintSeconds] = useState(0);
  const [isSprintActive, setIsSprintActive] = useState(false);

  useEffect(() => {
    if (!isSprintActive || focusSprintSeconds <= 0) return;
    const timer = setInterval(() => {
      setFocusSprintSeconds((prev) => {
        if (prev <= 1) {
          setIsSprintActive(false);
          clearInterval(timer);
          showToast('Focus Sprint Completed! Take a quick break.');
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('Focus Sprint Finished', {
              body: '25-minute deep-work sprint completed! Ready for your next call.',
              icon: '/favicon.svg',
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSprintActive, focusSprintSeconds]);

  useEffect(() => {
    const ticker = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(ticker);
  }, []);

  // Slide-out Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('task'); // 'task' | 'meeting'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Scoped API Fetch Helper ensuring workspace isolation
  const apiFetch = async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      'X-Workspace-Id': workspaceId,
    };
    const res = await fetch(getApiUrl(url), { ...options, headers });
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const waitMsg = retryAfter ? ` Please retry in ${retryAfter}s.` : ' Please wait a moment.';
      console.warn(`API Rate Limit reached (429).${waitMsg}`);
      showToast(`Rate limit reached.${waitMsg}`);
    }
    return res;
  };

  const fetchItems = async (wsId = workspaceId) => {
    try {
      const res = await apiFetch(API_URL, { headers: { 'X-Workspace-Id': wsId } });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setItems(data);
      localStorage.setItem(`mm_cached_items_${wsId}`, JSON.stringify(data));
      setServerOnline(true);
    } catch (err) {
      console.warn('Backend unavailable, using local cache:', err);
      const cached = localStorage.getItem(`mm_cached_items_${wsId}`);
      if (cached) {
        setItems(JSON.parse(cached));
      }
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(workspaceId);
  }, [workspaceId]);

  // Chrome Extension Superpowers: Ingest pending clips, handle open room, and sync badge
  useEffect(() => {
    if (!isChromeExtension || typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      return;
    }

    const checkExtensionStorage = async () => {
      try {
        const { pcs_pending_clips = [], pcs_open_room = '' } = await chrome.storage.local.get([
          'pcs_pending_clips',
          'pcs_open_room',
        ]);

        // 1. Omnibox / Context menu requested opening a specific room
        if (pcs_open_room && typeof pcs_open_room === 'string' && pcs_open_room.trim() !== '') {
          const roomToOpen = pcs_open_room.trim();
          await chrome.storage.local.remove('pcs_open_room');
          handleStartInstantCall(roomToOpen);
          showToast(`Opening meeting room: ${roomToOpen}`);
        }

        // 2. Ingest clipped tasks from right-click or shortcut (Alt+Shift+C)
        if (Array.isArray(pcs_pending_clips) && pcs_pending_clips.length > 0) {
          const clipsToIngest = [...pcs_pending_clips];
          await chrome.storage.local.remove('pcs_pending_clips');

          for (const clip of clipsToIngest) {
            try {
              const res = await apiFetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Workspace-Id': workspaceId },
                body: JSON.stringify({ ...clip, workspace_id: workspaceId }),
              });
              if (res.ok) {
                const saved = await res.json();
                setItems((prev) => [...prev, saved]);
              } else {
                setItems((prev) => [...prev, clip]);
              }
            } catch (e) {
              setItems((prev) => [...prev, clip]);
            }
          }
          showToast(`Imported ${clipsToIngest.length} clipped task(s) from Chrome!`);
        }
      } catch (err) {
        console.warn('Chrome extension storage check error:', err);
      }
    };

    checkExtensionStorage();

    // Listen for storage changes from background.js
    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'local' && (changes.pcs_pending_clips || changes.pcs_open_room)) {
        checkExtensionStorage();
      }
    };

    if (chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [isChromeExtension, workspaceId]);

  // Update Chrome Extension Badge Counter based on today's pending items
  useEffect(() => {
    if (isChromeExtension && typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
      const todayPending = (items || []).filter(
        (m) => m.date === todayStr && m.status === 'Pending'
      ).length;

      chrome.action.setBadgeText({ text: todayPending > 0 ? String(todayPending) : '' });

      // Check if there is an urgent meeting starting within 15 minutes
      const nowMs = Date.now();
      const hasUrgentMeeting = (items || []).some((m) => {
        if (m.date === todayStr && m.time && m.status === 'Pending' && (m.type === 'meeting' || m.link)) {
          const mTime = new Date(`${m.date}T${m.time}`).getTime();
          const diffMin = (mTime - nowMs) / 60000;
          return diffMin >= 0 && diffMin <= 15;
        }
        return false;
      });

      chrome.action.setBadgeBackgroundColor({ color: hasUrgentMeeting ? '#ef4444' : '#1d4ed8' });
    }
  }, [items, todayStr, isChromeExtension]);

  const handleSwitchWorkspace = () => {
    const entered = prompt(
      `Your current workspace ID is: ${workspaceId}\n\nEnter a Workspace ID to join, or click OK to copy current:`,
      workspaceId
    );
    if (entered && entered.trim() && entered.trim().toLowerCase() !== workspaceId) {
      const cleanId = entered.trim().toLowerCase();
      localStorage.setItem('mm_workspace_id', cleanId);
      setWorkspaceId(cleanId);
      showToast(`Switched to workspace: ${cleanId}`);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(workspaceId);
      showToast('Workspace ID copied to clipboard');
    }
  };

  const isMeeting = (item) => Boolean(item.type === 'meeting' || item.link || (item.attendees && item.attendees.trim() !== ''));

  const handleOpenCreateTask = (date = null) => {
    setEditingId(null);
    setDrawerType('task');
    setFormData({
      ...initialFormData,
      title: '',
      date: date || selectedDate || initialFormData.date,
      time: '10:00 AM',
      priority: 'High',
      link: '',
      attendees: '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenCreateMeeting = (date = null) => {
    setEditingId(null);
    setDrawerType('meeting');
    setFormData({
      ...initialFormData,
      title: '',
      date: date || selectedDate || initialFormData.date,
      time: '02:00 PM',
      priority: 'Medium',
      link: 'https://meet.google.com/new',
      attendees: 'Sagar (Host), Team',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (item) => {
    const meetingType = isMeeting(item);
    setEditingId(item.id);
    setDrawerType(meetingType ? 'meeting' : 'task');
    setFormData({
      title: item.title,
      date: item.date,
      time: item.time,
      priority: item.priority || 'Medium',
      status: item.status === 'Completed' ? 'Completed' : 'Pending',
      notes: item.notes || '',
      link: item.link || '',
      attendees: item.attendees || '',
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingId(null);
  };

  const handleAutoDetectCallLink = async () => {
    // 1. Chrome Extension context: Query the active tab
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs && tabs[0];
        if (activeTab && activeTab.url) {
          const url = activeTab.url;
          if (
            url.includes('meet.google.com') ||
            url.includes('zoom.us') ||
            url.includes('teams.microsoft.com') ||
            url.startsWith('http')
          ) {
            setFormData((prev) => ({
              ...prev,
              link: url,
              title: prev.title || activeTab.title?.replace(/ - Google Meet| \| Zoom| - Microsoft Teams/i, '') || '',
            }));
            showToast('Captured active meeting tab link');
            return;
          }
        }
        showToast('Active tab is not a recognized video call URL');
      });
      return;
    }

    // 2. Standalone web fallback: Read from clipboard
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (
          text.includes('meet.google.com') ||
          text.includes('zoom.us') ||
          text.includes('teams.microsoft.com') ||
          text.startsWith('http')
        ) {
          setFormData((prev) => ({ ...prev, link: text.trim() }));
          showToast('Pasted link from clipboard');
          return;
        }
      } catch (err) {
        // Fallback if clipboard permission not granted
      }
    }
    showToast('Paste the meeting link into the field');
  };

  const handleClipCurrentTab = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url) {
          const rawTitle = activeTab.title || 'Webpage Reference';
          const cleanTitle = `Review: ${rawTitle.length > 80 ? rawTitle.substring(0, 77) + '...' : rawTitle}`;
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          const time = now.toTimeString().substring(0, 5);

          const clippedItem = {
            title: cleanTitle,
            date: today,
            time: time,
            link: activeTab.url,
            attendees: '',
            notes: `Clipped from Chrome Tab:\n${rawTitle}\nURL: ${activeTab.url}`,
            priority: 'Medium',
            status: 'Pending',
            type: 'task',
            workspace_id: workspaceId,
          };

          try {
            const res = await apiFetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Workspace-Id': workspaceId },
              body: JSON.stringify(clippedItem),
            });
            if (res.ok) {
              const saved = await res.json();
              setItems((prev) => [...prev, saved]);
              showToast('Clipped active tab to tasks queue!');
              return;
            }
          } catch (e) {}

          // Optimistic local state fallback
          const localItem = { ...clippedItem, id: Date.now() };
          setItems((prev) => [...prev, localItem]);
          showToast('Clipped active tab (saved locally)');
          return;
        }
      } catch (err) {
        console.warn('Clip tab error:', err);
      }
    }
    showToast('Open in Chrome to clip browser tabs');
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        setPaletteQuery('');
        return;
      }

      if (e.key === 'Escape') {
        if (isPaletteOpen) {
          setIsPaletteOpen(false);
          return;
        }
        handleCloseDrawer();
        return;
      }

      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleOpenCreateTask(selectedDate);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleOpenCreateMeeting(selectedDate);
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      } else if (e.key === '1') {
        setViewMode('calendar');
      } else if (e.key === '2') {
        setViewMode('table');
      } else if (e.key === '3') {
        setViewMode('cards');
      } else if (e.key === '4') {
        setViewMode('analytics');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, isPaletteOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      type: drawerType,
    };

    // 1. Instant local update (0ms lag)
    if (editingId) {
      const updated = items.map((it) => (it.id === editingId ? { ...payload, id: editingId } : it));
      setItems(updated);
      localStorage.setItem(`mm_cached_items_${workspaceId}`, JSON.stringify(updated));
    } else {
      const newLocalItem = { ...payload, id: Date.now() };
      const updated = [...items, newLocalItem];
      setItems(updated);
      localStorage.setItem(`mm_cached_items_${workspaceId}`, JSON.stringify(updated));
    }

    handleCloseDrawer();
    const hasAttendeeEmails = Boolean(formData.attendees && /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/.test(formData.attendees));
    let successToast = editingId ? 'Changes saved' : drawerType === 'meeting' ? 'Meeting scheduled' : 'Task added';
    if (!editingId && drawerType === 'meeting' && hasAttendeeEmails && formData.sendEmailInvites !== false) {
      successToast = 'Meeting scheduled & email invites dispatched';
    }
    showToast(successToast);

    // 2. Sync with backend
    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PUT' : 'POST';

      let res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok && editingId && res.status === 404) {
        res = await apiFetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        await fetchItems();
      }
    } catch (err) {
      console.warn('Backend sync deferred:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    localStorage.setItem(`mm_cached_items_${workspaceId}`, JSON.stringify(updated));
    showToast('Item deleted');

    try {
      await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete sync deferred:', err);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    const updated = items.map((it) => (it.id === item.id ? { ...it, status: nextStatus } : it));
    setItems(updated);
    localStorage.setItem(`mm_cached_items_${workspaceId}`, JSON.stringify(updated));
    showToast(nextStatus === 'Completed' ? 'Marked complete' : 'Marked pending');

    try {
      await apiFetch(`${API_URL}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, status: nextStatus }),
      });
    } catch (err) {
      console.warn('Backend toggle sync deferred:', err);
    }
  };

  const handleMoveToTomorrow = async (item) => {
    const currentDate = new Date(item.date || selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const tomorrowStr = currentDate.toISOString().split('T')[0];
    const updatedPayload = { ...item, date: tomorrowStr };

    const updated = items.map((it) => (it.id === item.id ? updatedPayload : it));
    setItems(updated);
    localStorage.setItem(`mm_cached_items_${workspaceId}`, JSON.stringify(updated));
    showToast(`Moved "${item.title}" to tomorrow (${tomorrowStr})`);

    try {
      await apiFetch(`${API_URL}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });
    } catch (err) {
      console.warn('Backend move sync deferred:', err);
    }
  };

  const handleCopyMeetingInvite = (item) => {
    let resolvedLink = item.link;
    if (resolvedLink && !resolvedLink.startsWith('http://') && !resolvedLink.startsWith('https://')) {
      const base = publicBaseUrl || getPublicWebOrigin();
      const query = resolvedLink.startsWith('?') ? resolvedLink : (resolvedLink.startsWith('room=') ? `?${resolvedLink}` : `?room=${resolvedLink}`);
      resolvedLink = `${base}${query}`;
    }

    const inviteText = [
      `Meeting: ${item.title}`,
      `Date & Time: ${item.date} at ${item.time}`,
      item.attendees ? `Attendees: ${item.attendees}` : null,
      resolvedLink ? `Join Link: ${resolvedLink}` : null,
      item.notes ? `Agenda / Notes: ${item.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteText);
      showToast('Meeting invite copied to clipboard');
    } else {
      prompt('Copy meeting invite:', inviteText);
    }
  };

  // Parse meeting time strings (e.g. "02:30 PM", "10:00 AM") into Date objects
  const parseTimeToDate = (timeStr, dateStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3] ? match[3].toUpperCase() : null;
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const d = new Date(dateStr ? dateStr + 'T00:00:00' : new Date());
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  // Up Next Meeting calculation
  const todayMeetings = items
    .filter((item) => isMeeting(item) && item.date === todayStr)
    .sort((a, b) => {
      const da = parseTimeToDate(a.time, a.date) || 0;
      const db = parseTimeToDate(b.time, b.date) || 0;
      return da - db;
    });

  const upNextMeeting = todayMeetings.find((m) => {
    const mDate = parseTimeToDate(m.time, m.date);
    if (!mDate) return false;
    return (mDate.getTime() + 45 * 60000) > currentTime.getTime();
  });

  const getCountdownText = (meeting) => {
    if (!meeting) return '';
    const mDate = parseTimeToDate(meeting.time, meeting.date);
    if (!mDate) return meeting.time;
    const diffMins = Math.round((mDate.getTime() - currentTime.getTime()) / 60000);
    if (diffMins > 0) return `Starts in ${diffMins} min${diffMins === 1 ? '' : 's'}`;
    if (diffMins >= -45) return 'In Progress Now';
    return 'Concluded';
  };

  // Pre-Meeting Desktop Notifications (Chrome Alarms & Web Notification fallback)
  const scheduleExtensionAlarms = (meetingsList) => {
    if (typeof chrome !== 'undefined' && chrome.alarms && chrome.alarms.create) {
      chrome.alarms.getAll((alarms) => {
        alarms.forEach((al) => {
          if (al.name.startsWith('meet-alert:')) {
            chrome.alarms.clear(al.name);
          }
        });
        const now = Date.now();
        meetingsList.forEach((m) => {
          if (m.date === todayStr && m.status !== 'Completed') {
            const mDate = parseTimeToDate(m.time, m.date);
            if (mDate) {
              const triggerTime = mDate.getTime() - 2 * 60000;
              if (triggerTime > now) {
                chrome.alarms.create(`meet-alert:${m.title}`, {
                  when: triggerTime,
                });
              }
            }
          }
        });
      });
    }
  };

  useEffect(() => {
    scheduleExtensionAlarms(items);
  }, [items]);

  useEffect(() => {
    if (!notificationsEnabled || typeof Notification === 'undefined') return;
    const now = currentTime.getTime();
    todayMeetings.forEach((m) => {
      if (m.status === 'Completed') return;
      const mDate = parseTimeToDate(m.time, m.date);
      if (!mDate) return;
      const diffMs = mDate.getTime() - now;
      if (diffMs > 0 && diffMs <= 2.5 * 60000) {
        const alertKey = `${m.id || m.title}-${m.date}-${m.time}`;
        if (!alertedMeetingsRef.current.has(alertKey)) {
          alertedMeetingsRef.current.add(alertKey);
          new Notification('Upcoming Meeting - PCS Meet Manager', {
            body: `"${m.title}" starts in 2 minutes.`,
            icon: '/favicon.svg',
          });
        }
      }
    });
  }, [currentTime, todayMeetings, notificationsEnabled]);

  const handleRequestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Notifications are not supported in this environment');
      return;
    }
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      showToast('Desktop alerts already active (2-min warning)');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotificationsEnabled(true);
      showToast('Desktop alerts enabled (2-min warning)');
    } else {
      setNotificationsEnabled(false);
      showToast('Notification permission was denied');
    }
  };

  // Focus Sprint Helpers
  const handleStartFocusSprint = (minutes = 25) => {
    setFocusSprintSeconds(minutes * 60);
    setIsSprintActive(true);
    showToast(`Started ${minutes}-minute Focus Sprint`);
  };

  const handleStopFocusSprint = () => {
    setIsSprintActive(false);
    setFocusSprintSeconds(0);
    showToast('Focus Sprint stopped');
  };

  const formatSprintTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleRaiseHand = () => {
    const nextRaised = !isHandRaised;
    setIsHandRaised(nextRaised);
    const myName = guestName.trim() || (isHostInCall ? 'Host' : 'Participant');
    if (nextRaised) {
      speakerState.joinQueue({ peerId: myPeerId, name: myName, officeId: guestOfficeId });
    } else {
      speakerState.leaveQueue(myPeerId);
    }
    if (wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN) {
      wsSignalingRef.current.send(
        JSON.stringify({
          type: 'raise-hand',
          roomId: activeCallRoom,
          peerId: myPeerId,
          isRaised: nextRaised,
          senderName: myName,
        })
      );
      wsSignalingRef.current.send(
        JSON.stringify({
          type: 'peer-status',
          roomId: activeCallRoom,
          peerId: myPeerId,
          isAudioMuted,
          isVideoOff,
          isHandRaised: nextRaised,
        })
      );
    }
    showToast(nextRaised ? 'Hand raised & added to speaker queue' : 'Hand lowered');
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsCallFullscreen(true))
        .catch((err) => console.warn('Fullscreen request failed:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsCallFullscreen(false))
        .catch((err) => console.warn('Exit fullscreen failed:', err));
    }
  };

  // WebRTC Video Calling ("Instant PCS Meet Room" - Multi-Peer Mesh Engine)
  const createPeerConnection = (remotePeerId, remotePeerName, isInitiator, targetRoom) => {
    const cleanRoom = (targetRoom || activeCallRoom || '').trim().toLowerCase();

    // Close any previous connection to this specific peer
    if (peerConnectionsRef.current.has(remotePeerId)) {
      try {
        peerConnectionsRef.current.get(remotePeerId).close();
      } catch (e) {}
      peerConnectionsRef.current.delete(remotePeerId);
    }

    const pc = new RTCPeerConnection({ iceServers: iceServersList });
    peerConnectionsRef.current.set(remotePeerId, pc);

    if (!peerIceQueuesRef.current.has(remotePeerId)) {
      peerIceQueuesRef.current.set(remotePeerId, []);
    }

    // Attach local media stream (camera or screen share)
    const currentStream = screenStreamRef.current || localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, currentStream);
        } catch (e) {
          console.warn('Track addition error:', e);
        }
      });
    }

    // Add audio/video transceivers for robust dual-direction stream negotiation
    try {
      const transceivers = pc.getTransceivers();
      const hasAudio = transceivers.some(t => t.receiver && t.receiver.track && t.receiver.track.kind === 'audio');
      const hasVideo = transceivers.some(t => t.receiver && t.receiver.track && t.receiver.track.kind === 'video');
      if (!hasAudio) pc.addTransceiver('audio', { direction: 'sendrecv' });
      if (!hasVideo) pc.addTransceiver('video', { direction: 'sendrecv' });
    } catch (e) {}

    // On remote track arrival from this specific peer
    pc.ontrack = (event) => {
      console.log(`[WebRTC Mesh] ontrack from ${remotePeerId}:`, event.track.kind);
      let stream = event.streams && event.streams[0];
      if (!stream) {
        if (!remoteStreamsRef.current.has(remotePeerId)) {
          remoteStreamsRef.current.set(remotePeerId, new MediaStream());
        }
        const s = remoteStreamsRef.current.get(remotePeerId);
        s.addTrack(event.track);
        stream = s;
      } else {
        remoteStreamsRef.current.set(remotePeerId, stream);
      }

      setConnectedPeers((prev) => {
        const idx = prev.findIndex((p) => p.peerId === remotePeerId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], stream };
          return updated;
        } else {
          return [
            ...prev,
            {
              peerId: remotePeerId,
              name: remotePeerName || 'Participant',
              stream,
              isHost: false,
              isAudioMuted: false,
              isVideoOff: false,
              isHandRaised: false,
              quality: 'stable',
            },
          ];
        }
      });
      setIsCallConnected(true);
      setCallStatusText('Connected in meeting');
    };

    // ICE Candidate handler for this peer
    pc.onicecandidate = (event) => {
      if (event.candidate && wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN) {
        wsSignalingRef.current.send(
          JSON.stringify({
            type: 'signal',
            roomId: cleanRoom,
            toPeerId: remotePeerId,
            fromPeerId: myPeerId,
            payload: { candidate: event.candidate },
          })
        );
      }
    };

    // Connection health monitoring
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`[WebRTC] ICE with ${remotePeerId}:`, state);
      if (state === 'connected' || state === 'completed') {
        setCallQuality('stable');
        setIsCallConnected(true);
        setCallStatusText('Connected in meeting');
      } else if (state === 'failed') {
        if (typeof pc.restartIce === 'function') {
          pc.restartIce();
        }
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsCallConnected(true);
        setCallQuality('stable');
        setCallStatusText('Connected in meeting');
      }
    };

    // If designated as initiator for this peer, create and send the offer
    if (isInitiator) {
      setTimeout(async () => {
        try {
          if (pc.signalingState !== 'closed') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN) {
              wsSignalingRef.current.send(
                JSON.stringify({
                  type: 'signal',
                  roomId: cleanRoom,
                  toPeerId: remotePeerId,
                  fromPeerId: myPeerId,
                  payload: { offer },
                })
              );
            }
          }
        } catch (err) {
          console.warn(`Offer creation error for ${remotePeerId}:`, err);
        }
      }, 50);
    }

    return pc;
  };

  const handleStartInstantCall = (customRoomId = null) => {
    const roomId = (customRoomId || `pcs-${Math.random().toString(36).substring(2, 9)}`).trim().toLowerCase();
    window.history.pushState({}, document.title, `?room=${roomId}`);
    handleJoinCallRoom(roomId, true);
  };

  const handleQuickJoinCall = (customCode = null) => {
    const raw = (customCode || quickJoinCode || '').trim().toLowerCase();
    const clean = raw.replace(/^https?:\/\/[^\/]+\/?/, '').replace(/^\?room=/, '').replace(/^\?chat=/, '').replace(/^#/, '');
    if (!clean) {
      showToast('Please enter a room code');
      return;
    }
    setIsQuickJoinModalOpen(false);
    setIsGuestMode(false);
    window.history.pushState({}, document.title, `?room=${clean}`);
    showToast(`Joining Instant Call: #${clean}`);
    handleJoinCallRoom(clean, false);
  };

  const handleQuickJoinChat = (customCode = null) => {
    const raw = (customCode || quickJoinCode || '').trim().toLowerCase();
    const clean = raw.replace(/^https?:\/\/[^\/]+\/?/, '').replace(/^\?chat=/, '').replace(/^\?room=/, '').replace(/^#/, '');
    if (!clean) {
      showToast('Please enter a room code');
      return;
    }
    setIsQuickJoinModalOpen(false);
    handleConnectGlobalChat(clean);
  };

  const handleGuestDirectQuickJoin = (roomId) => {
    const targetRoom = (roomId || activeCallRoom || '').trim().toLowerCase();
    if (!targetRoom) {
      showToast('No room code specified');
      return;
    }
    if (guestName.trim()) {
      sessionStorage.setItem('pcs_guest_name', guestName.trim());
    }
    if (guestOfficeId.trim()) {
      sessionStorage.setItem('pcs_guest_office_id', guestOfficeId.trim());
    }
    setIsGuestMode(false);
    window.history.pushState({}, document.title, `?room=${targetRoom}`);
    showToast(`Joining Call: #${targetRoom}`);
    handleJoinCallRoom(targetRoom, false);
  };

  const handleJoinCallRoom = async (roomId, isHost = false) => {
    const cleanRoom = (roomId || '').trim().toLowerCase();
    if (!cleanRoom) {
      showToast('Invalid room code');
      return;
    }

    try {
      setActiveCallRoom(cleanRoom);
      setIsGuestMode(false);
      setIsCallConnected(false);
      setIsCallMinimized(false);
      setIsHostInCall(isHost);
      setConnectedPeers([]);
      setCallStatusText(isHost ? 'Room created! Waiting for others to join...' : 'Joining room and connecting...');

      // Close any previous peer connections
      peerConnectionsRef.current.forEach((pc) => {
        try { pc.close(); } catch (e) {}
      });
      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();
      peerIceQueuesRef.current.clear();

      // Check if scheduled meeting has defined agenda items or notes
      const matchedMeeting = items.find(
        (i) => i.type === 'meeting' && (i.room_id === cleanRoom || i.title?.toLowerCase().includes(cleanRoom))
      );
      if (matchedMeeting?.agenda) {
        try {
          const parsed = JSON.parse(matchedMeeting.agenda);
          if (Array.isArray(parsed) && parsed.length > 0) {
            agendaState.broadcastCurrentAgenda({ items: parsed });
          }
        } catch {
          const lines = matchedMeeting.agenda.split('\n').filter((l) => l.trim());
          if (lines.length > 0) {
            const generatedTopics = lines.map((line, idx) => ({
              id: `topic-${idx}-${Date.now()}`,
              title: line.replace(/^[-*•\d.)\s]+/, '').trim() || `Topic ${idx + 1}`,
              durationMinutes: 10,
              isCompleted: false,
            }));
            agendaState.broadcastCurrentAgenda({ items: generatedTopics });
          }
        }
      }

      // Acquire camera & microphone
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (mediaErr) {
        console.warn('Camera/Mic permission failed or denied, trying audio only:', mediaErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (audioErr) {
          console.warn('Audio only also failed:', audioErr);
          stream = new MediaStream();
        }
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Connect to WebSocket signaling server
      if (wsSignalingRef.current) {
        try { wsSignalingRef.current.close(); } catch (e) {}
      }
      const wsUrl = getWsUrl('/ws');
      const ws = new WebSocket(wsUrl);
      wsSignalingRef.current = ws;

      const myDisplayName = (guestName.trim() || (isHost ? 'Host' : 'Participant'));

      ws.onopen = () => {
        const joinPayload = {
          type: isHost ? 'host-join' : 'join-room',
          roomId: cleanRoom,
          peerId: myPeerId,
          name: myDisplayName,
          officeId: guestOfficeId.trim() || '',
        };
        ws.send(JSON.stringify(joinPayload));
        showToast(isHost ? `Started Meeting: #${cleanRoom}` : `Joined Meeting: #${cleanRoom}`);
      };

      ws.onmessage = async (msgEvent) => {
        try {
          const data = JSON.parse(msgEvent.data);

          if (data.type === 'guest-knock-request') {
            const knockingGuest = data.guest;
            setPendingKnocks((prev) => {
              if (prev.some((k) => k.id === knockingGuest.id)) return prev;
              return [...prev, { ...knockingGuest, roomId: data.roomId || cleanRoom }];
            });
            showToast(`Guest ${knockingGuest.name} (${knockingGuest.officeId}) is knocking`);
          } else if (data.type === 'guest-knock-cancelled') {
            setPendingKnocks((prev) => prev.filter((k) => k.id !== data.guestId));
          } else if (data.type === 'host-ready') {
            if (data.waitingGuests && data.waitingGuests.length > 0) {
              setPendingKnocks(data.waitingGuests.map((g) => ({ ...g, roomId: cleanRoom })));
            }
          } else if (data.type === 'guest-admitted-ack') {
            setPendingKnocks((prev) => prev.filter((k) => k.id !== data.guestId));
          } else if (data.type === 'room-users') {
            // Newly joined peer receives list of all existing participants in the room
            const existing = (data.peers || []).filter((p) => p.peerId !== myPeerId);
            setConnectedPeers(
              existing.map((p) => ({
                peerId: p.peerId,
                name: p.name || 'Participant',
                isHost: Boolean(p.isHost),
                stream: null,
                isAudioMuted: Boolean(p.isAudioMuted),
                isVideoOff: Boolean(p.isVideoOff),
                isHandRaised: Boolean(p.isHandRaised),
                quality: 'connecting',
              }))
            );
            if (existing.length > 0) {
              setCallStatusText('Connecting to participants...');
              // As the new joiner, initiate offer to each existing participant
              existing.forEach((p) => {
                createPeerConnection(p.peerId, p.name, true, cleanRoom);
              });
            } else {
              setCallStatusText(isHost ? 'Waiting for others to join...' : 'Waiting for host and participants...');
            }
          } else if (data.type === 'peer-joined') {
            // Another peer joined the room
            const newPeer = data.peer;
            if (newPeer && newPeer.peerId !== myPeerId) {
              setConnectedPeers((prev) => {
                if (prev.some((p) => p.peerId === newPeer.peerId)) return prev;
                return [
                  ...prev,
                  {
                    peerId: newPeer.peerId,
                    name: newPeer.name || 'Participant',
                    isHost: Boolean(newPeer.isHost),
                    stream: null,
                    isAudioMuted: Boolean(newPeer.isAudioMuted),
                    isVideoOff: Boolean(newPeer.isVideoOff),
                    isHandRaised: Boolean(newPeer.isHandRaised),
                    quality: 'connecting',
                  },
                ];
              });
              showToast(`${newPeer.name || 'Participant'} joined the meeting`);
              setCallStatusText('Participant joined! Connecting...');
              // The new peer will create the offer; we will receive it via 'signal'
            }
          } else if (data.type === 'signal') {
            const { fromPeerId, payload } = data;
            if (!fromPeerId || !payload) return;

            if (payload.offer) {
              console.log(`[WebRTC Mesh] Received offer from ${fromPeerId}`);
              let pc = peerConnectionsRef.current.get(fromPeerId);
              if (!pc || pc.signalingState === 'closed') {
                const peerObj = connectedPeers.find((p) => p.peerId === fromPeerId);
                pc = createPeerConnection(fromPeerId, peerObj ? peerObj.name : 'Participant', false, cleanRoom);
              }
              await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));

              // Drain any queued ICE candidates for this peer
              const queue = peerIceQueuesRef.current.get(fromPeerId) || [];
              while (queue.length > 0) {
                const c = queue.shift();
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch (e) {
                  console.warn('ICE drain error:', e);
                }
              }

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: 'signal',
                    roomId: cleanRoom,
                    toPeerId: fromPeerId,
                    fromPeerId: myPeerId,
                    payload: { answer },
                  })
                );
              }
            } else if (payload.answer) {
              console.log(`[WebRTC Mesh] Received answer from ${fromPeerId}`);
              const pc = peerConnectionsRef.current.get(fromPeerId);
              if (pc && pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
                setIsCallConnected(true);
                setCallStatusText('Connected in meeting');

                const queue = peerIceQueuesRef.current.get(fromPeerId) || [];
                while (queue.length > 0) {
                  const c = queue.shift();
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                  } catch (e) {
                    console.warn('ICE drain error:', e);
                  }
                }
              }
            } else if (payload.candidate) {
              const pc = peerConnectionsRef.current.get(fromPeerId);
              if (pc && pc.remoteDescription) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } catch (e) {
                  console.warn('addIceCandidate error:', e);
                }
              } else {
                if (!peerIceQueuesRef.current.has(fromPeerId)) {
                  peerIceQueuesRef.current.set(fromPeerId, []);
                }
                peerIceQueuesRef.current.get(fromPeerId).push(payload.candidate);
              }
            }
          } else if (data.type === 'peer-left' || data.type === 'host-left') {
            const leavingPeerId = data.peerId;
            if (leavingPeerId) {
              if (peerConnectionsRef.current.has(leavingPeerId)) {
                try {
                  peerConnectionsRef.current.get(leavingPeerId).close();
                } catch (e) {}
                peerConnectionsRef.current.delete(leavingPeerId);
              }
              remoteStreamsRef.current.delete(leavingPeerId);
              peerIceQueuesRef.current.delete(leavingPeerId);

              setConnectedPeers((prev) => {
                const leaving = prev.find((p) => p.peerId === leavingPeerId);
                if (leaving) {
                  showToast(`${leaving.name || 'Participant'} left the meeting`);
                }
                const updated = prev.filter((p) => p.peerId !== leavingPeerId);
                if (updated.length === 0) {
                  setIsCallConnected(false);
                  setCallStatusText('Waiting for others to join...');
                }
                return updated;
              });
              if (pinnedParticipant === leavingPeerId) {
                setPinnedParticipant(null);
                setMeetingLayout('grid');
              }
              speakerState.leaveQueue(leavingPeerId);
              if (speakerState.activeSpeaker?.peerId === leavingPeerId) {
                speakerState.clearFloor();
              }
            }
          } else if (data.type === 'peer-status-update') {
            const { peerId: targetId, isAudioMuted: m, isVideoOff: v, isHandRaised: h } = data;
            setConnectedPeers((prev) =>
              prev.map((p) => {
                if (p.peerId === targetId) {
                  return {
                    ...p,
                    isAudioMuted: typeof m === 'boolean' ? m : p.isAudioMuted,
                    isVideoOff: typeof v === 'boolean' ? v : p.isVideoOff,
                    isHandRaised: typeof h === 'boolean' ? h : p.isHandRaised,
                  };
                }
                return p;
              })
            );
          } else if (data.type === 'raise-hand') {
            const { peerId: targetId, isRaised, senderName } = data;
            setConnectedPeers((prev) =>
              prev.map((p) => {
                if (p.peerId === targetId) {
                  return { ...p, isHandRaised: Boolean(isRaised) };
                }
                return p;
              })
            );
            if (isRaised) {
              speakerState.joinQueue({ peerId: targetId, name: senderName });
              showToast(`${senderName || 'Participant'} raised hand`);
            } else {
              speakerState.leaveQueue(targetId);
            }
          } else if (data.type === 'agenda-sync') {
            if (data.agenda) {
              agendaState.applyRemoteSync(data.agenda);
            }
          } else if (data.type === 'speaker-queue-sync') {
            speakerState.applyRemoteSync({
              speakerQueue: data.speakerQueue,
              activeSpeaker: data.activeSpeaker,
            });
          } else if (data.type === 'chat-message') {
            if (data.message) {
              setChatMessages((prev) => {
                if (prev.some((m) => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
            }
          }
        } catch (err) {
          console.error('Signaling message handling error:', err);
        }
      };

      ws.onerror = (wsErr) => {
        console.warn('Signaling WebSocket error:', wsErr);
        setCallStatusText('Signaling server unavailable.');
      };
    } catch (err) {
      console.error('Call initialization failed:', err);
      showToast('Could not initialize video call');
    }
  };

  const handleToggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const willBeMuted = !isAudioMuted;
      audioTracks.forEach((track) => {
        track.enabled = !willBeMuted;
      });
      setIsAudioMuted(willBeMuted);
      showToast(willBeMuted ? 'Microphone muted' : 'Microphone unmuted');
      if (wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN) {
        wsSignalingRef.current.send(
          JSON.stringify({
            type: 'peer-status',
            roomId: activeCallRoom,
            peerId: myPeerId,
            isAudioMuted: willBeMuted,
            isVideoOff,
            isHandRaised,
          })
        );
      }
    }
  };

  const handleToggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const willBeOff = !isVideoOff;
      videoTracks.forEach((track) => {
        track.enabled = !willBeOff;
      });
      setIsVideoOff(willBeOff);
      showToast(willBeOff ? 'Camera turned off' : 'Camera turned on');
      if (wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN) {
        wsSignalingRef.current.send(
          JSON.stringify({
            type: 'peer-status',
            roomId: activeCallRoom,
            peerId: myPeerId,
            isAudioMuted,
            isVideoOff: willBeOff,
            isHandRaised,
          })
        );
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      if (cameraTrack) {
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack).catch(console.warn);
          }
        });
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    setIsScreenSharing(false);
    showToast('Screen sharing stopped');
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender && screenTrack) {
            sender.replaceTrack(screenTrack).catch(console.warn);
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
        showToast('Screen sharing started');
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const handleEndCall = () => {
    if (isRecording) {
      stopRecording();
      showToast('Meeting recording saved and ready for review');
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    peerConnectionsRef.current.forEach((pc) => {
      try { pc.close(); } catch (e) {}
    });
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    peerIceQueuesRef.current.clear();
    peerAudioAnalysersRef.current.clear();

    if (wsSignalingRef.current) {
      wsSignalingRef.current.close();
      wsSignalingRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    setConnectedPeers([]);
    setActiveCallRoom(null);
    setIsCallConnected(false);
    setCallQuality('connecting');
    setIsAudioMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setIsCallMinimized(false);
    setCallStatusText('');
    setPendingKnocks([]);
    setIsHostInCall(false);
    setGuestKnockStatus('idle');
    setCallDuration(0);
    setIsHandRaised(false);
    setMeetingDrawerTab(null);
    setMeetingLayout('grid');
    setPinnedParticipant(null);
    setIsLocalSpeaking(false);
    setIsCallFullscreen(false);

    if (window.location.search.includes('room=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    showToast('PCS Meet Call ended');
  };

  const handleCopyGuestLink = () => {
    if (!activeCallRoom) return;
    const origin = publicBaseUrl || getPublicWebOrigin();
    const guestUrl = `${origin}?room=${activeCallRoom}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(guestUrl);
      showToast('Guest invite link copied to clipboard');
    } else {
      prompt('Copy guest call link:', guestUrl);
    }
  };

  const handleGuestKnock = async (roomId) => {
    const cleanRoom = (roomId || '').trim().toLowerCase();
    if (!cleanRoom) {
      showToast('No room code provided');
      return;
    }
    if (!guestName.trim()) {
      showToast('Please enter your full name');
      return;
    }
    if (!guestOfficeId.trim()) {
      showToast('Please enter your office ID');
      return;
    }

    sessionStorage.setItem('pcs_guest_name', guestName.trim());
    sessionStorage.setItem('pcs_guest_office_id', guestOfficeId.trim());

    setGuestKnockStatus('knocking');
    setGuestDeniedReason('');
    setCallStatusText('Knocking on room... Waiting for host admission');

    const wsUrl = getWsUrl('/ws');
    const ws = new WebSocket(wsUrl);
    wsSignalingRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'guest-knock',
          roomId: cleanRoom,
          guest: {
            name: guestName.trim(),
            officeId: guestOfficeId.trim(),
          },
        })
      );
    };

    ws.onmessage = async (msgEvent) => {
      try {
        const data = JSON.parse(msgEvent.data);

        if (data.type === 'knock-status') {
          setIsHostOnlineInRoom(Boolean(data.isHostOnline));
        } else if (data.type === 'guest-admitted') {
          showToast('Admitted by host! Connecting to meeting...');
          setGuestKnockStatus('admitted');
          setIsGuestMode(false);
          try { ws.close(); } catch (e) {}
          handleJoinCallRoom(cleanRoom, false);
        } else if (data.type === 'guest-denied') {
          setGuestKnockStatus('denied');
          setGuestDeniedReason(data.reason || 'The meeting host declined admission for this session.');
          showToast('Admission declined by host');
        }
      } catch (err) {
        console.error('Guest signaling error:', err);
      }
    };

    ws.onerror = () => {
      showToast('Signaling connection interrupted');
      setGuestKnockStatus('idle');
    };
  };

  const handleCancelKnock = () => {
    if (wsSignalingRef.current) {
      try {
        wsSignalingRef.current.close();
      } catch (e) {}
    }
    setGuestKnockStatus('idle');
    showToast('Knock cancelled');
  };

  const handleAdmitGuest = (guestId, knockRoomId) => {
    if (wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN) {
      wsSignalingRef.current.send(
        JSON.stringify({
          type: 'admit-guest',
          roomId: knockRoomId || activeCallRoom,
          guestId,
        })
      );
      setPendingKnocks((prev) => prev.filter((k) => k.id !== guestId));
      showToast('Guest admitted to meeting');
    }
  };

  const handleDenyGuest = (guestId, knockRoomId) => {
    if (wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN) {
      wsSignalingRef.current.send(
        JSON.stringify({
          type: 'deny-guest',
          roomId: knockRoomId || activeCallRoom,
          guestId,
        })
      );
      setPendingKnocks((prev) => prev.filter((k) => k.id !== guestId));
      showToast('Guest denied entry');
    }
  };

  const handleAdmitKnockGuest = handleAdmitGuest;
  const handleDenyKnockGuest = handleDenyGuest;

  const handleCopyPublicPortalLink = () => {
    const origin = publicBaseUrl || getPublicWebOrigin();
    const publicUrl = `${origin}?public=1`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      showToast('Public Live Meeting portal link copied to clipboard');
    } else {
      prompt('Public Live Meeting Link:', publicUrl);
    }
  };

  const handleDirectJoinFromPortal = (roomId) => {
    setIsPublicPortal(false);
    setIsGuestMode(true);
    setActiveCallRoom(roomId);
    window.history.pushState({}, document.title, `?room=${roomId}`);
    fetch(getApiUrl(`/api/public/room-status?room=${roomId}`))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setIsHostOnlineInRoom(Boolean(data.isLive));
      })
      .catch(() => {});
  };

  const handleDirectRoomCodeSubmit = (e) => {
    e.preventDefault();
    const cleanRoom = publicDirectRoomInput.trim().replace(/^\?room=/, '');
    if (!cleanRoom) {
      showToast('Please enter a room code');
      return;
    }
    handleDirectJoinFromPortal(cleanRoom);
  };

  // Load public meetings when public portal is active
  const fetchPublicMeetings = () => {
    setIsPublicLoading(true);
    fetch(getApiUrl('/api/public/live-meetings'))
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setPublicMeetings(data || []);
        setIsPublicLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load public meetings:', err);
        setIsPublicLoading(false);
      });
  };

  useEffect(() => {
    if (!isPublicPortal) return;
    fetchPublicMeetings();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchPublicMeetings();
    }, 20000);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchPublicMeetings();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [isPublicPortal]);

  // Global Online Work Chat & Image Sharing Handlers
  const handleLoadRoomMessages = (roomId) => {
    if (!roomId) return;
    fetch(getApiUrl(`/api/rooms/${encodeURIComponent(roomId)}/messages`))
      .then((res) => (res.ok ? res.json() : []))
      .then((msgs) => setChatMessages(msgs || []))
      .catch((err) => console.warn('Could not load messages:', err));
  };

  const handleSendChatMessage = (overrideRoom) => {
    if (!chatInputText.trim() && !chatAttachment) return;
    const targetRoom = (
      overrideRoom ||
      (isGlobalChatMode ? activeChatRoom : (activeCallRoom || activeChatRoom || 'general'))
    ).trim().toLowerCase();

    if (!targetRoom) {
      showToast('Join or create a room first to chat');
      return;
    }

    const sender = guestName.trim() || (typeof window !== 'undefined' && (sessionStorage.getItem('pcs_guest_name') || sessionStorage.getItem('pcs_user_name'))) || 'Colleague';
    const hasLink = /https?:\/\/[^\s]+/.test(chatInputText);
    const attachmentType = chatAttachment ? 'image' : (hasLink ? 'link' : 'text');
    const clientMsgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

    const msgPayload = {
      clientMsgId,
      senderName: sender,
      senderId: (typeof window !== 'undefined' && (sessionStorage.getItem('pcs_guest_office_id') || sessionStorage.getItem('pcs_user_id'))) || 'user',
      content: chatInputText.trim(),
      attachmentUrl: chatAttachment ? chatAttachment.url : null,
      attachmentType,
      replyToId: replyingTo ? replyingTo.id : null,
      replyToSender: replyingTo ? replyingTo.sender : null,
      replyToContent: replyingTo ? replyingTo.content : null,
    };

    // Optimistic UI update: immediately display in message list
    const optimisticMsg = {
      id: clientMsgId,
      client_msg_id: clientMsgId,
      room_id: targetRoom,
      sender_name: sender,
      sender_id: msgPayload.senderId,
      content: msgPayload.content,
      attachment_url: msgPayload.attachmentUrl,
      attachment_type: msgPayload.attachmentType,
      reply_to_id: msgPayload.replyToId,
      reply_to_sender: msgPayload.replyToSender,
      reply_to_content: msgPayload.replyToContent,
      is_deleted: 0,
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);
    setReplyingTo(null);
    setChatInputText('');
    setChatAttachment(null);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) {
      chatWsRef.current.send(
        JSON.stringify({
          type: 'chat-typing',
          roomId: targetRoom,
          senderName: sender,
          isTyping: false,
        })
      );
    }
    setTimeout(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // Send via WebSocket if connected, otherwise fallback to REST (never both simultaneously)
    if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) {
      chatWsRef.current.send(
        JSON.stringify({
          type: 'chat-message',
          roomId: targetRoom,
          message: msgPayload,
        })
      );
    } else {
      fetch(getApiUrl(`/api/rooms/${encodeURIComponent(targetRoom)}/messages`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgPayload),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((saved) => {
          if (saved) {
            setChatMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === clientMsgId || m.client_msg_id === clientMsgId);
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              if (prev.some((m) => m.id === saved.id)) return prev;
              return [...prev, saved];
            });
          }
        })
        .catch((err) => console.warn('REST message post warning:', err));
    }
  };

  const handleReplyChatMessage = (msg) => {
    if (!msg || msg.is_deleted) return;
    setReplyingTo({
      id: msg.id,
      sender: msg.sender_name || 'Colleague',
      content: msg.content || (msg.attachment_url ? 'Attachment (Image)' : ''),
    });
    showToast(`Replying to ${msg.sender_name || 'Colleague'}`);
  };

  const handleDeleteChatMessage = (messageId) => {
    if (!messageId) return;
    if (!window.confirm('Delete this message for everyone in this room?')) return;
    const targetRoom = (isGlobalChatMode ? activeChatRoom : (activeCallRoom || activeChatRoom || 'general')).trim().toLowerCase();

    // Optimistic local update
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, is_deleted: 1, content: 'This message was deleted', attachment_url: null }
          : m
      )
    );

    // Broadcast delete event over WebSocket
    if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) {
      chatWsRef.current.send(
        JSON.stringify({
          type: 'chat-delete',
          roomId: targetRoom,
          messageId,
        })
      );
    }

    // Call REST delete endpoint
    fetch(getApiUrl(`/api/rooms/${encodeURIComponent(targetRoom)}/messages/${messageId}`), {
      method: 'DELETE',
    }).catch((err) => console.warn('Delete error:', err));
  };

  const handleCopyMessageText = (msg) => {
    const text = msg.content || '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Message copied to clipboard');
    } else {
      prompt('Copy message text:', text);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size exceeds 10MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setChatAttachment({
        url: reader.result,
        type: 'image',
        name: file.name,
      });
      showToast(`Image attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePasteEvent = (e) => {
    const items = (e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData))?.items;
    if (!items) return;
    for (let index in items) {
      const item = items[index];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          setChatAttachment({
            url: event.target.result,
            type: 'image',
            name: 'Pasted Screenshot',
          });
          showToast('Pasted image attached');
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  };

  const playChatNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {}
  };

  const handleChatInputChange = (val) => {
    setChatInputText(val);
    const targetRoom = (isGlobalChatMode ? activeChatRoom : (activeCallRoom || activeChatRoom || 'general')).trim().toLowerCase();
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now;
      if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) {
        chatWsRef.current.send(JSON.stringify({
          type: 'chat-typing',
          roomId: targetRoom,
          senderName: guestName.trim() || 'Colleague',
          isTyping: true,
        }));
      }
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) {
        chatWsRef.current.send(JSON.stringify({
          type: 'chat-typing',
          roomId: targetRoom,
          senderName: guestName.trim() || 'Colleague',
          isTyping: false,
        }));
      }
    }, 2200);
  };

  const handleChatDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverChat(true);
  };

  const handleChatDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverChat(false);
  };

  const handleChatDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverChat(false);
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size exceeds 10MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setChatAttachment({
        url: reader.result,
        type: 'image',
        name: file.name,
      });
      showToast(`Image attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleChatScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 90;
    setShowScrollDown(isScrolledUp);
    if (!isScrolledUp) {
      setUnreadWhileScrolled(0);
    }
  };

  const scrollToBottom = (smooth = true) => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setShowScrollDown(false);
    setUnreadWhileScrolled(0);
  };

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        if (replyingTo) {
          setReplyingTo(null);
        }
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [replyingTo]);

  const handleOpenGlobalChat = () => {
    const room = activeCallRoom || activeChatRoom || 'general';
    setIsRoomChatOpen((prev) => !prev);
    handleLoadRoomMessages(room);
  };

  const handleConnectGlobalChat = (roomCode) => {
    const code = (roomCode || activeChatRoom || 'general').trim().toLowerCase();
    setActiveChatRoom(code);
    setIsGlobalChatMode(true);
    window.history.pushState({}, document.title, `?chat=${code}`);

    handleLoadRoomMessages(code);

    if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) {
      chatWsRef.current.send(JSON.stringify({
        type: 'chat-join',
        roomId: code,
        senderName: guestName.trim() || 'Colleague',
      }));
    }
    showToast(`Connected to Work Chat: #${code}`);
  };

  const handleCreateNewRoom = (customCode = null) => {
    const code = (customCode || newRoomInputCode || `work-${Math.random().toString(36).substring(2, 8)}`).trim().toLowerCase();
    if (!code) {
      showToast('Please enter a room code');
      return;
    }
    setIsCreateRoomModalOpen(false);
    setNewRoomInputCode('');
    handleConnectGlobalChat(code);
  };

  const handleCopyChatShareLink = (roomCode) => {
    const code = roomCode || activeChatRoom || 'general';
    const origin = publicBaseUrl || getPublicWebOrigin();
    const shareUrl = `${origin}?chat=${code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Chat room link copied to clipboard');
    } else {
      prompt('Copy Chat Room Share Link:', shareUrl);
    }
  };

  const handleCopyRoomShareLink = (roomId) => {
    const code = roomId || activeCallRoom;
    if (!code) return;
    const origin = publicBaseUrl || getPublicWebOrigin();
    const shareUrl = `${origin}?room=${code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Room link copied to clipboard');
    } else {
      prompt('Copy Room Share Link:', shareUrl);
    }
  };

  // Persistent Global Chat WebSocket Connection for Real-Time Sync across all devices
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let isMounted = true;

    const setupChatWs = () => {
      if (!isMounted) return;
      const wsUrl = getWsUrl('/ws');
      ws = new WebSocket(wsUrl);
      chatWsRef.current = ws;

      const currentRoom = (isGlobalChatMode ? activeChatRoom : (activeCallRoom || activeChatRoom || 'general')).trim().toLowerCase();

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'chat-join',
          roomId: currentRoom,
          senderName: guestName.trim() || 'Colleague',
        }));
      };

      ws.onmessage = (msgEvent) => {
        try {
          const data = JSON.parse(msgEvent.data);
          if (data.type === 'chat-presence') {
            if (data.onlineCount) {
              setChatOnlineCount(data.onlineCount);
            }
          } else if (data.type === 'chat-typing') {
            const typingSender = data.senderName;
            if (typingSender && typingSender !== (guestName.trim() || 'Colleague')) {
              if (data.isTyping) {
                setTypingUsers((prev) => (prev.includes(typingSender) ? prev : [...prev, typingSender]));
              } else {
                setTypingUsers((prev) => prev.filter((u) => u !== typingSender));
              }
            }
          } else if (data.type === 'chat-message' && data.message) {
            const isPeer = data.message.sender_name && data.message.sender_name !== (guestName.trim() || 'Colleague');
            if (isPeer) {
              playChatNotificationSound();
              setTypingUsers((prev) => prev.filter((u) => u !== data.message.sender_name));
            }
            setChatMessages((prev) => {
              const existingIdx = prev.findIndex(
                (m) =>
                  m.id === data.message.id ||
                  (data.message.client_msg_id && m.client_msg_id === data.message.client_msg_id) ||
                  (String(m.id).startsWith('temp-') && m.client_msg_id && m.client_msg_id === data.message.client_msg_id) ||
                  (String(m.id).startsWith('temp-') && m.content === data.message.content)
              );
              if (existingIdx !== -1) {
                const next = [...prev];
                next[existingIdx] = data.message;
                return next;
              }
              return [...prev, data.message];
            });
          } else if (data.type === 'chat-delete' && data.messageId) {
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === data.messageId || m.client_msg_id === data.messageId
                  ? { ...m, is_deleted: 1, content: 'This message was deleted', attachment_url: null }
                  : m
              )
            );
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        if (isMounted) {
          reconnectTimer = setTimeout(setupChatWs, 2000);
        }
      };

      ws.onerror = () => {
        if (ws) ws.close();
      };
    };

    setupChatWs();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Sync room subscription & initial message fetch whenever room or chat mode changes
  useEffect(() => {
    const currentRoom = (isGlobalChatMode ? activeChatRoom : (activeCallRoom || activeChatRoom || 'general')).trim().toLowerCase();
    handleLoadRoomMessages(currentRoom);

    if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) {
      chatWsRef.current.send(JSON.stringify({
        type: 'chat-join',
        roomId: currentRoom,
        senderName: guestName.trim() || 'Colleague',
      }));
    }
  }, [isGlobalChatMode, activeChatRoom, activeCallRoom]);

  // Periodic polling fallback for 100% reliable global synchronization across mobile networks
  useEffect(() => {
    const currentRoom = (isGlobalChatMode ? activeChatRoom : (activeCallRoom || activeChatRoom || 'general')).trim().toLowerCase();
    const syncInterval = setInterval(() => {
      // Skip polling if tab is hidden in background
      if (typeof document !== 'undefined' && document.hidden) return;
      // Skip REST polling if real-time WebSocket is actively connected
      if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) return;

      fetch(getApiUrl(`/api/rooms/${encodeURIComponent(currentRoom)}/messages`))
        .then((res) => (res.ok ? res.json() : []))
        .then((latest) => {
          if (Array.isArray(latest)) {
            setChatMessages((prev) => {
              const pendingTemps = prev.filter(
                (m) =>
                  String(m.id).startsWith('temp-') &&
                  !latest.some(
                    (lm) =>
                      (lm.client_msg_id && lm.client_msg_id === m.client_msg_id) ||
                      lm.content === m.content
                  )
              );
              if (
                prev.length === latest.length &&
                pendingTemps.length === 0 &&
                prev.every((m, i) => latest[i] && m.id === latest[i].id && m.is_deleted === latest[i].is_deleted)
              ) {
                return prev;
              }
              return [...latest, ...pendingTemps];
            });
          }
        })
        .catch(() => {});
    }, 10000);

    // Trigger immediate message sync when user returns to visible tab
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        handleLoadRoomMessages(currentRoom);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      clearInterval(syncInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [isGlobalChatMode, activeChatRoom, activeCallRoom]);

  // Load chat messages whenever activeCallRoom changes
  useEffect(() => {
    if (activeCallRoom) {
      handleLoadRoomMessages(activeCallRoom);
    }
  }, [activeCallRoom]);

  // Scroll chat messages to bottom on update
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isRoomChatOpen]);

  // Sync local and remote streams with video elements on state/layout change
  useEffect(() => {
    if (localVideoRef.current && (screenStreamRef.current || localStreamRef.current)) {
      localVideoRef.current.srcObject = screenStreamRef.current || localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [activeCallRoom, isCallMinimized, meetingLayout, pinnedParticipant]);

  // Google Meet In-Call Duration Clock
  useEffect(() => {
    let timer = null;
    if (activeCallRoom) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCallRoom]);

  // Google Meet Real-Time Audio Speaking Halo Detection (Web Audio API)
  useEffect(() => {
    if (!activeCallRoom) {
      setIsLocalSpeaking(false);
      setSpeakingPeers(new Set());
      return;
    }
    let audioCtx = null;
    let animId = null;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();

      let localAnalyser = null;
      if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
        try {
          const src = audioCtx.createMediaStreamSource(localStreamRef.current);
          localAnalyser = audioCtx.createAnalyser();
          localAnalyser.fftSize = 256;
          src.connect(localAnalyser);
        } catch (e) {}
      }

      // Analysers for all active remote mesh peers
      const remoteAnalysers = new Map();
      remoteStreamsRef.current.forEach((stream, peerId) => {
        if (stream && stream.getAudioTracks().length > 0) {
          try {
            const src = audioCtx.createMediaStreamSource(stream);
            const a = audioCtx.createAnalyser();
            a.fftSize = 256;
            src.connect(a);
            remoteAnalysers.set(peerId, a);
          } catch (e) {}
        }
      });

      const checkVolume = () => {
        if (localAnalyser && !isAudioMuted) {
          const arr = new Uint8Array(localAnalyser.frequencyBinCount);
          localAnalyser.getByteFrequencyData(arr);
          const avg = arr.reduce((acc, v) => acc + v, 0) / arr.length;
          setIsLocalSpeaking(avg > 18);
        } else {
          setIsLocalSpeaking(false);
        }

        const activeSpeaking = new Set();
        remoteAnalysers.forEach((analyser, peerId) => {
          const arr = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(arr);
          const avg = arr.reduce((acc, v) => acc + v, 0) / arr.length;
          if (avg > 18) {
            activeSpeaking.add(peerId);
          }
        });
        setSpeakingPeers((prev) => {
          if (prev.size !== activeSpeaking.size) return activeSpeaking;
          for (const id of activeSpeaking) {
            if (!prev.has(id)) return activeSpeaking;
          }
          return prev;
        });

        animId = requestAnimationFrame(checkVolume);
      };

      animId = requestAnimationFrame(checkVolume);
    } catch (err) {
      console.warn('Audio detection not available:', err);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch (e) {}
      }
    };
  }, [activeCallRoom, isAudioMuted, connectedPeers]);

  // Google Meet Keyboard Shortcuts: Ctrl+D for Mic, Ctrl+E for Camera
  useEffect(() => {
    if (!activeCallRoom) return;
    const handleKeyDown = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handleToggleAudio();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        handleToggleVideo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCallRoom, isAudioMuted, isVideoOff]);

  // Fetch production ICE configuration (STUN + TURN relay + Public URL) from backend
  useEffect(() => {
    fetch(getApiUrl('/api/webrtc/ice-config'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.iceServers && data.iceServers.length > 0) {
            setIceServersList(data.iceServers);
          }
          if (data.publicUrl) {
            setPublicBaseUrl(data.publicUrl);
          }
        }
      })
      .catch((err) => console.warn('Using default STUN servers:', err));
  }, []);

  // Auto-detect ?room= URL parameter for incoming guest joins
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      const clean = roomParam.trim().toLowerCase();
      fetch(getApiUrl(`/api/public/room-status?room=${clean}`))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setIsHostOnlineInRoom(Boolean(data.isLive));
        })
        .catch(() => {});
    }
  }, []);

  // Poll room status while in guest lobby
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = (urlParams.get('room') || activeCallRoom || '').trim().toLowerCase();
    if (!isGuestMode || guestKnockStatus === 'admitted' || !roomParam) return;

    const checkStatus = () => {
      fetch(getApiUrl(`/api/public/room-status?room=${encodeURIComponent(roomParam)}`))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setIsHostOnlineInRoom(Boolean(data.isLive));
        })
        .catch(() => {});
    };

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      checkStatus();
    }, 10000);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        checkStatus();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [isGuestMode, guestKnockStatus, activeCallRoom]);

  // Cleanup WebRTC resources on unmount
  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionsRef.current) {
        peerConnectionsRef.current.forEach((pc) => {
          try { pc.close(); } catch (e) {}
        });
        peerConnectionsRef.current.clear();
      }
      if (wsSignalingRef.current) {
        wsSignalingRef.current.close();
      }
    };
  }, []);

  // 1-Click Daily Standup Generator (Formatted for Slack/Teams)
  const handleCopyDailyStandup = () => {
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yesterdayStr = yDate.toISOString().split('T')[0];

    const yesterdayDone = items.filter(
      (it) => it.date === yesterdayStr && it.status === 'Completed'
    );
    const todayItems = items.filter((it) => it.date === todayStr);
    const todayPendingTasks = todayItems.filter((it) => !isMeeting(it) && it.status !== 'Completed');
    const todayMeetingsList = todayItems.filter(isMeeting);

    const lines = [
      `DAILY STANDUP - ${todayStr}`,
      '',
      'YESTERDAY:',
      yesterdayDone.length > 0
        ? yesterdayDone.map((t) => `- Completed: ${t.title}`).join('\n')
        : '- Wrapped up scheduled tasks',
      '',
      'TODAY:',
      todayMeetingsList.length > 0
        ? todayMeetingsList.map((m) => `- ${m.time}: ${m.title} (Meeting)`).join('\n')
        : '- No external meetings scheduled',
      todayPendingTasks.length > 0
        ? todayPendingTasks.map((t) => `- Focus: ${t.title} [${t.priority} Priority]`).join('\n')
        : '- Task queue clear',
      '',
      'BLOCKERS:',
      '- None',
    ];

    const text = lines.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Daily standup copied to clipboard');
    } else {
      prompt('Copy your standup:', text);
    }
  };

  // 1-Click Database Backup Export
  const handleDownloadBackup = async (exportAll = false) => {
    try {
      showToast('Generating database backup...');
      const url = getApiUrl(`/api/backup${exportAll ? '?all=true' : ''}`);
      const res = await apiFetch(url, { headers: { 'X-Workspace-Id': workspaceId } });
      if (!res.ok) throw new Error('Backup request failed');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `pcs-meet-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast('Database backup downloaded successfully!');
    } catch (err) {
      console.error('Backup error:', err);
      showToast('Failed to download database backup');
    }
  };

  // 1-Click Database Restore
  const handleRestoreBackup = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const confirmed = window.confirm(
      `Are you sure you want to restore from "${file.name}"?\n\nThis will merge meetings, tasks, and chat messages into your database.`
    );
    if (!confirmed) {
      e.target.value = '';
      return;
    }

    try {
      showToast('Restoring database from backup...');
      const fileText = await file.text();
      const backupData = JSON.parse(fileText);

      const res = await apiFetch(getApiUrl('/api/restore?mode=merge'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      });

      if (!res.ok) throw new Error('Restore request failed');
      const result = await res.json();

      await fetchItems(workspaceId);
      const currentRoom = (isGlobalChatMode ? activeChatRoom : (activeCallRoom || activeChatRoom || 'general')).trim().toLowerCase();
      handleLoadRoomMessages(currentRoom);

      showToast(`Restored ${result.meetingsRestored || 0} items & ${result.messagesRestored || 0} messages!`);
    } catch (err) {
      console.error('Restore error:', err);
      showToast(`Restore failed: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  // Overdue Task Rollover Logic (0ms Optimistic UI)
  const overdueTasks = items.filter(
    (item) => !isMeeting(item) && item.status !== 'Completed' && item.date < todayStr
  );

  const handleRolloverAllOverdue = async () => {
    if (overdueTasks.length === 0) return;
    const overdueIds = new Set(overdueTasks.map((t) => t.id));
    const updatedItems = items.map((t) =>
      overdueIds.has(t.id) ? { ...t, date: todayStr } : t
    );
    setItems(updatedItems);
    localStorage.setItem(`mm_cached_items_${workspaceId}`, JSON.stringify(updatedItems));
    showToast(`Moved ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} to today`);

    try {
      await Promise.all(
        overdueTasks.map((t) =>
          apiFetch(`${API_URL}/${t.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...t, date: todayStr }),
          })
        )
      );
    } catch (err) {
      console.warn('Background sync failed for batch rollover:', err);
    }
  };

  // Google Calendar Web Link Generator
  const getGoogleCalendarUrl = (item) => {
    const startDate = parseTimeToDate(item.time, item.date) || new Date();
    const endDate = new Date(startDate.getTime() + 45 * 60000); // 45-min duration

    const formatGCalDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const startStr = formatGCalDate(startDate);
    const endStr = formatGCalDate(endDate);

    const details = [
      item.notes ? `Agenda / Notes:\n${item.notes}` : '',
      item.attendees ? `Attendees: ${item.attendees}` : '',
      item.link ? `Join Link: ${item.link}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: item.title,
      dates: `${startStr}/${endStr}`,
      details: details,
      location: item.link || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const handleAddToGoogleCalendar = (item) => {
    const url = getGoogleCalendarUrl(item);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Meeting Notes to Standalone Tasks Converter
  const handleConvertNotesToTasks = async (meeting) => {
    if (!meeting.notes || !meeting.notes.trim()) {
      showToast('Meeting has no notes to convert');
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Parse lines and strip bullets
    const rawLines = meeting.notes
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const taskTitles = rawLines
      .map((line) => line.replace(/^[-*•\d+.)]\s*/, '').trim())
      .filter((title) => title.length > 0);

    if (taskTitles.length === 0) {
      showToast('No action items found in notes');
      return;
    }

    const newTasks = taskTitles.map((title, idx) => ({
      id: Date.now() + idx,
      title: title,
      date: tomorrowStr,
      time: '10:00 AM',
      priority: 'Medium',
      status: 'Pending',
      type: 'task',
      link: '',
      attendees: meeting.attendees || '',
      notes: `Action item from meeting: ${meeting.title}`,
    }));

    // Optimistic UI update (0ms lag)
    const updatedItems = [...items, ...newTasks];
    setItems(updatedItems);
    localStorage.setItem(`mm_cached_items_${workspaceId}`, JSON.stringify(updatedItems));
    showToast(`Created ${newTasks.length} task${newTasks.length > 1 ? 's' : ''} for tomorrow from notes`);

    // Background sync to SQLite
    try {
      await Promise.all(
        newTasks.map((t) =>
          apiFetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          })
        )
      );
    } catch (err) {
      console.warn('Backend sync deferred for converted tasks:', err);
    }
  };

  // Calendar calculations
  const calYear = currentCalendarDate.getFullYear();
  const calMonth = currentCalendarDate.getMonth();
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => setCurrentCalendarDate(new Date(calYear, calMonth - 1, 1));
  const handleNextMonth = () => setCurrentCalendarDate(new Date(calYear, calMonth + 1, 1));

  // Current Week dates calculation
  const getWeekDates = (baseDateStr) => {
    const base = new Date((baseDateStr || todayStr) + 'T00:00:00');
    const dayOfWeek = base.getDay();
    const sunday = new Date(base);
    sunday.setDate(base.getDate() - dayOfWeek);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      week.push(d.toISOString().split('T')[0]);
    }
    return week;
  };
  const activeWeekDates = getWeekDates(selectedDate);

  // Monthly Workload & Completion Stats
  const currentMonthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
  const monthItems = items.filter((it) => it.date && it.date.startsWith(currentMonthPrefix));
  const monthMeetingsCount = monthItems.filter(isMeeting).length;
  const monthTasksCount = monthItems.length - monthMeetingsCount;
  const monthCompletedCount = monthItems.filter((it) => it.status === 'Completed').length;
  const monthCompletionPercent = monthItems.length > 0 ? Math.round((monthCompletedCount / monthItems.length) * 100) : 0;

  const handlePrevPeriod = () => {
    if (calSubView === 'week') {
      const d = new Date((selectedDate || todayStr) + 'T00:00:00');
      d.setDate(d.getDate() - 7);
      const newDateStr = d.toISOString().split('T')[0];
      setSelectedDate(newDateStr);
      setCurrentCalendarDate(d);
    } else {
      handlePrevMonth();
    }
  };

  const handleNextPeriod = () => {
    if (calSubView === 'week') {
      const d = new Date((selectedDate || todayStr) + 'T00:00:00');
      d.setDate(d.getDate() + 7);
      const newDateStr = d.toISOString().split('T')[0];
      setSelectedDate(newDateStr);
      setCurrentCalendarDate(d);
    } else {
      handleNextMonth();
    }
  };

  // Map items by date
  const itemsByDate = items.reduce((acc, it) => {
    if (!acc[it.date]) acc[it.date] = [];
    acc[it.date].push(it);
    return acc;
  }, {});

  // Filtered & sorted items
  const filteredAndSortedItems = items
    .filter((it) => {
      const itMeeting = isMeeting(it);
      const matchesSearch =
        it.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (it.notes && it.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (it.attendees && it.attendees.toLowerCase().includes(searchTerm.toLowerCase()));

      const isCompleted = it.status === 'Completed';
      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Completed'
          ? isCompleted
          : !isCompleted;

      const matchesType =
        typeFilter === 'All'
          ? true
          : typeFilter === 'meetings'
          ? itMeeting
          : !itMeeting;

      const matchesDate = viewMode === 'calendar' && selectedDate ? it.date === selectedDate : true;
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    })
    .sort((a, b) => {
      const pA = priorityOrder[a.priority] || 2;
      const pB = priorityOrder[b.priority] || 2;
      if (pA !== pB) return pA - pB;
      return (a.time || '').localeCompare(b.time || '');
    });

  // Metrics
  const totalCount = items.length;
  const highPriorityCount = items.filter((it) => it.priority === 'High' && it.status !== 'Completed').length;
  const meetingCount = items.filter(isMeeting).length;
  const pendingCount = items.filter((it) => it.status !== 'Completed').length;
  const completedCount = items.filter((it) => it.status === 'Completed').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Selected Day items (synchronized with search & filters)
  const dayScheduleItems = (itemsByDate[selectedDate] || [])
    .filter((it) => {
      const itMeeting = isMeeting(it);
      const matchesSearch =
        !searchTerm ||
        it.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (it.notes && it.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (it.attendees && it.attendees.toLowerCase().includes(searchTerm.toLowerCase()));
      const isCompleted = it.status === 'Completed';
      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Completed'
          ? isCompleted
          : !isCompleted;
      const matchesType =
        typeFilter === 'All'
          ? true
          : typeFilter === 'meetings'
          ? itMeeting
          : !itMeeting;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      const pA = priorityOrder[a.priority] || 2;
      const pB = priorityOrder[b.priority] || 2;
      if (pA !== pB) return pA - pB;
      return (a.time || '').localeCompare(b.time || '');
    });

  // Command Palette Built-in Commands
  const builtInCommands = [
    { id: 'cmd-task', title: '+ New Task', icon: 'add', action: () => { handleOpenCreateTask(selectedDate); setIsPaletteOpen(false); } },
    { id: 'cmd-meeting', title: '+ Schedule Meeting', icon: 'event', action: () => { handleOpenCreateMeeting(selectedDate); setIsPaletteOpen(false); } },
    { id: 'cmd-today', title: 'Jump to Today', icon: 'today', action: () => { setSelectedDate(todayStr); setCurrentCalendarDate(new Date()); setIsPaletteOpen(false); showToast('Switched to today'); } },
    { id: 'cmd-triage', title: 'Move All Overdue to Today', icon: 'low_priority', action: () => { handleRolloverAllOverdue(); setIsPaletteOpen(false); } },
    { id: 'cmd-cal', title: 'Switch to Calendar View', icon: 'calendar_month', action: () => { setViewMode('calendar'); setIsPaletteOpen(false); } },
    { id: 'cmd-tbl', title: 'Switch to Table View', icon: 'table_rows', action: () => { setViewMode('table'); setIsPaletteOpen(false); } },
    { id: 'cmd-crd', title: 'Switch to Cards View', icon: 'view_kanban', action: () => { setViewMode('cards'); setIsPaletteOpen(false); } },
    { id: 'cmd-anl', title: 'Switch to Analytics View', icon: 'analytics', action: () => { setViewMode('analytics'); setIsPaletteOpen(false); } },
    { id: 'cmd-standup', title: 'Copy Daily Standup (Slack/Teams)', icon: 'content_paste', action: () => { handleCopyDailyStandup(); setIsPaletteOpen(false); } },
    { id: 'cmd-sprint', title: isSprintActive ? 'Stop Focus Sprint' : 'Start Focus Sprint (25m)', icon: 'timer', action: () => { if (isSprintActive) handleStopFocusSprint(); else handleStartFocusSprint(25); setIsPaletteOpen(false); } },
    { id: 'cmd-call', title: 'Start Instant PCS Meet Call (WebRTC)', icon: 'videocam', action: () => { handleStartInstantCall(); setIsPaletteOpen(false); } },
    { id: 'cmd-backup', title: 'Export Database Backup (JSON)', icon: 'cloud_download', action: () => { handleDownloadBackup(); setIsPaletteOpen(false); } },
    { id: 'cmd-restore', title: 'Restore Database from Backup (JSON)', icon: 'cloud_upload', action: () => { restoreFileInputRef.current?.click(); setIsPaletteOpen(false); } },
    { id: 'cmd-workspace', title: 'Switch / Share Workspace ID', icon: 'folder_shared', action: () => { handleSwitchWorkspace(); setIsPaletteOpen(false); } },
  ];

  const filteredCommands = builtInCommands.filter((c) =>
    c.title.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  const matchingPaletteItems = items
    .filter((it) =>
      it.title.toLowerCase().includes(paletteQuery.toLowerCase()) ||
      (it.notes && it.notes.toLowerCase().includes(paletteQuery.toLowerCase()))
    )
    .slice(0, 6);

  // 90-Day Activity Heatmap Data & Streak Calculation
  const heatmapDays = (() => {
    const days = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayItems = items.filter((it) => it.date === dateStr);
      const dayCompletedCount = dayItems.filter((it) => it.status === 'Completed').length;
      const dayMeetingsCount = dayItems.filter(isMeeting).length;
      const score = dayCompletedCount + dayMeetingsCount;
      days.push({
        date: dateStr,
        completedCount: dayCompletedCount,
        meetingsCount: dayMeetingsCount,
        score,
      });
    }
    return days;
  })();

  const heatmapTotalActions = heatmapDays.reduce((acc, d) => acc + d.score, 0);

  const activeStreak = (() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasActivity = items.some(
        (it) => it.date === dateStr && (it.status === 'Completed' || isMeeting(it))
      );
      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  })();

  // Public Meeting Portal View (?public=1 or ?portal=1)
  if (isPublicPortal) {
    const portalRoom = (activeCallRoom || activeChatRoom || 'general').trim().toLowerCase();
    return (
      <PublicPortalView
        currentTime={currentTime}
        onOpenGeneralChat={(room = 'general') => {
          setIsPublicPortal(false);
          handleConnectGlobalChat(room);
        }}
        onOpenDashboard={() => {
          setIsPublicPortal(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
        publicDirectRoomInput={publicDirectRoomInput}
        setPublicDirectRoomInput={setPublicDirectRoomInput}
        onDirectRoomSubmit={handleDirectRoomCodeSubmit}
        publicMeetings={publicMeetings}
        isPublicLoading={isPublicLoading}
        onDirectJoinMeeting={handleDirectJoinFromPortal}
        isRoomChatOpen={isRoomChatOpen}
        setIsRoomChatOpen={setIsRoomChatOpen}
        currentRoom={portalRoom}
        chatMessages={chatMessages}
        guestName={guestName}
        onCopyRoomShareLink={handleCopyRoomShareLink}
        chatInputText={chatInputText}
        setChatInputText={setChatInputText}
        chatAttachment={chatAttachment}
        setChatAttachment={setChatAttachment}
        chatFileInputRef={chatFileInputRef}
        handleImageSelect={handleImageSelect}
        handlePasteEvent={handlePasteEvent}
        handleSendChatMessage={handleSendChatMessage}
        chatMessagesEndRef={chatMessagesEndRef}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        handleReplyChatMessage={handleReplyChatMessage}
        handleCopyMessageText={handleCopyMessageText}
        handleDeleteChatMessage={handleDeleteChatMessage}
        activeImageLightbox={activeImageLightbox}
        setActiveImageLightbox={setActiveImageLightbox}
        toastMessage={toastMessage}
      />
    );
  }

  // Dedicated Global Online Work Chat Room (?chat=roomCode or switched via UI)
  if (isGlobalChatMode) {
    const currentChat = activeChatRoom || 'general';
    return (
      <GlobalChatView
        currentChat={currentChat}
        guestName={guestName}
        setGuestName={setGuestName}
        showToast={showToast}
        onCopyChatShareLink={handleCopyChatShareLink}
        setIsCreateRoomModalOpen={setIsCreateRoomModalOpen}
        onReturnToDashboard={() => {
          setIsGlobalChatMode(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
        chatOnlineCount={chatOnlineCount}
        chatMessages={chatMessages}
        isDraggingOverChat={isDraggingOverChat}
        handlePasteEvent={handlePasteEvent}
        handleChatScroll={handleChatScroll}
        handleChatDragOver={handleChatDragOver}
        handleChatDragLeave={handleChatDragLeave}
        handleChatDrop={handleChatDrop}
        showScrollDown={showScrollDown}
        scrollToBottom={scrollToBottom}
        unreadWhileScrolled={unreadWhileScrolled}
        typingUsers={typingUsers}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        chatAttachment={chatAttachment}
        setChatAttachment={setChatAttachment}
        chatFileInputRef={chatFileInputRef}
        handleImageSelect={handleImageSelect}
        chatInputText={chatInputText}
        handleChatInputChange={handleChatInputChange}
        handleSendChatMessage={handleSendChatMessage}
        chatMessagesEndRef={chatMessagesEndRef}
        handleReplyChatMessage={handleReplyChatMessage}
        handleCopyMessageText={handleCopyMessageText}
        handleDeleteChatMessage={handleDeleteChatMessage}
        activeImageLightbox={activeImageLightbox}
        setActiveImageLightbox={setActiveImageLightbox}
        toastMessage={toastMessage}
        isCreateRoomModalOpen={isCreateRoomModalOpen}
        handleCreateNewRoom={handleCreateNewRoom}
        newRoomInputCode={newRoomInputCode}
        setNewRoomInputCode={setNewRoomInputCode}
      />
    );
  }

  // Dedicated Guest Video Room (When external user joins via ?room=... and not yet in call)
  if (isGuestMode && !activeCallRoom) {
    const currentRoom = activeCallRoom || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('room') : '');
    return (
      <GuestLobbyView
        currentRoom={currentRoom}
        isRoomChatOpen={isRoomChatOpen}
        setIsRoomChatOpen={setIsRoomChatOpen}
        handleLoadRoomMessages={handleLoadRoomMessages}
        chatMessages={chatMessages}
        callQuality={callQuality}
        guestKnockStatus={guestKnockStatus}
        setGuestKnockStatus={setGuestKnockStatus}
        guestDeniedReason={guestDeniedReason}
        isHostOnlineInRoom={isHostOnlineInRoom}
        guestName={guestName}
        setGuestName={setGuestName}
        guestOfficeId={guestOfficeId}
        setGuestOfficeId={setGuestOfficeId}
        handleGuestDirectQuickJoin={handleGuestDirectQuickJoin}
        handleGuestKnock={handleGuestKnock}
        handleCancelKnock={handleCancelKnock}
        activeCallRoom={activeCallRoom}
        isCallConnected={isCallConnected}
        callStatusText={callStatusText}
        handleCopyGuestLink={handleCopyGuestLink}
        remoteVideoRef={remoteVideoRef}
        remoteStreamRef={remoteStreamRef}
        localVideoRef={localVideoRef}
        localStreamRef={localStreamRef}
        screenStreamRef={screenStreamRef}
        isVideoOff={isVideoOff}
        isAudioMuted={isAudioMuted}
        handleJoinCallRoom={handleJoinCallRoom}
        setIsGuestMode={setIsGuestMode}
        handleToggleAudio={handleToggleAudio}
        handleToggleVideo={handleToggleVideo}
        handleToggleScreenShare={handleToggleScreenShare}
        isScreenSharing={isScreenSharing}
        handleEndCall={handleEndCall}
        pendingKnocks={pendingKnocks}
        handleAdmitGuest={handleAdmitGuest}
        handleDenyGuest={handleDenyGuest}
        onCopyRoomShareLink={handleCopyRoomShareLink}
        chatInputText={chatInputText}
        setChatInputText={setChatInputText}
        chatAttachment={chatAttachment}
        setChatAttachment={setChatAttachment}
        chatFileInputRef={chatFileInputRef}
        handleImageSelect={handleImageSelect}
        handlePasteEvent={handlePasteEvent}
        handleSendChatMessage={handleSendChatMessage}
        chatMessagesEndRef={chatMessagesEndRef}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        handleReplyChatMessage={handleReplyChatMessage}
        handleCopyMessageText={handleCopyMessageText}
        handleDeleteChatMessage={handleDeleteChatMessage}
        activeImageLightbox={activeImageLightbox}
        setActiveImageLightbox={setActiveImageLightbox}
        toastMessage={toastMessage}
      />
    );
  }

  return (
    <div>
      {/* Top Header - Executive branding & unified controls */}
      <header className="modern-header">
        <div className="header-inner">
          <div className="brand-group">
            <span className="brand-logo-badge">PCS</span>
            <h2 className="brand-title">Meet Manager</h2>
          </div>

          <div className="header-right">
            <div className="search-box">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                id="global-search-input"
                type="text"
                placeholder="Search items... [/]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm ? (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="palette-open-trigger"
                  onClick={() => setIsPaletteOpen(true)}
                  title="Open Command Palette (Ctrl+K)"
                >
                  Ctrl+K
                </button>
              )}
            </div>
            {isChromeExtension && (
              <button
                type="button"
                className="btn-clip-tab"
                onClick={handleClipCurrentTab}
                title="Clip active Chrome tab as task (Alt+Shift+C)"
              >
                <span className="material-symbols-outlined">bookmark_add</span>
                <span>Clip Tab</span>
                <span className="kbd-hint">Alt+C</span>
              </button>
            )}
            <button
              type="button"
              className="btn-quick-join-header"
              onClick={() => setIsQuickJoinModalOpen(true)}
              title="Quick Join with Room Code (Call or Chat with zero boundaries)"
            >
              <span className="material-symbols-outlined">bolt</span>
              <span>Quick Join</span>
            </button>
            <button
              type="button"
              className="btn-global-chat"
              onClick={handleOpenGlobalChat}
              title="Create or Join Global Online Work Chat Room"
            >
              <span className="material-symbols-outlined">forum</span>
              <span>Work Chat</span>
            </button>
            <button
              type="button"
              className="btn-pcs-call"
              onClick={() => handleStartInstantCall()}
              title="Start Instant WebRTC Video Meeting"
            >
              <span className="material-symbols-outlined">videocam</span>
              <span>Instant Call</span>
            </button>
            <button className="btn-blue" onClick={() => handleOpenCreateTask(selectedDate)}>
              <span className="material-symbols-outlined">add</span>
              <span>New Task</span>
              <span className="kbd-hint">T</span>
            </button>
            <button className="btn-green" onClick={() => handleOpenCreateMeeting(selectedDate)}>
              <span className="material-symbols-outlined">event</span>
              <span>Schedule</span>
              <span className="kbd-hint">M</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="workspace-container">
        {/* Quick Direct Join Hero Strip: Join Call or Chat from Room Code with Zero Boundaries */}
        <div className="quick-join-hero-strip">
          <div className="quick-join-hero-left">
            <span className="material-symbols-outlined bolt-icon">bolt</span>
            <div className="quick-join-text">
              <span className="quick-join-title">Quick Direct Join</span>
              <span className="quick-join-desc">Direct access to live calls and chat rooms by room code. No barriers or waiting.</span>
            </div>
          </div>
          <div className="quick-join-hero-controls">
            <div className="quick-join-input-wrap">
              <span className="material-symbols-outlined input-prefix">tag</span>
              <input
                type="text"
                placeholder="Enter room code (e.g. general, standup, alpha)..."
                value={quickJoinCode}
                onChange={(e) => setQuickJoinCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickJoinCall();
                  }
                }}
              />
              {quickJoinCode && (
                <button
                  type="button"
                  className="btn-clear-code"
                  onClick={() => setQuickJoinCode('')}
                  title="Clear room code"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn-quick-call-action"
              onClick={() => handleQuickJoinCall()}
              disabled={!quickJoinCode.trim()}
              title="Join Instant Call directly with this code (No waiting room)"
            >
              <span className="material-symbols-outlined">videocam</span>
              <span>Join Call</span>
            </button>
            <button
              type="button"
              className="btn-quick-chat-action"
              onClick={() => handleQuickJoinChat()}
              disabled={!quickJoinCode.trim()}
              title="Join Work Chat directly with this code"
            >
              <span className="material-symbols-outlined">forum</span>
              <span>Join Chat</span>
            </button>
          </div>
        </div>

        {/* Workspace Title & Executive Utility Strip */}
        <div className="workspace-header">
          <div>
            <h1 className="workspace-title">Executive Workspace Overview</h1>
            <p className="workspace-subtitle">Manage tasks and schedule meetings with clear priorities</p>
          </div>
          <div className="executive-utility-strip">
            <button
              type="button"
              className="utility-strip-btn"
              onClick={handleCopyDailyStandup}
              title="Copy formatted daily standup update for Slack/Teams"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>content_paste</span>
              <span>Standup</span>
            </button>
            <div className="strip-divider"></div>
            <button
              type="button"
              className="utility-strip-btn"
              onClick={handleCopyPublicPortalLink}
              title="Copy public live meeting portal link to share with guests and team"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>public</span>
              <span>Public Link</span>
            </button>
            <div className="strip-divider"></div>
            <button
              type="button"
              className={`utility-strip-btn ${notificationsEnabled ? 'active' : ''}`}
              onClick={handleRequestNotificationPermission}
              title={notificationsEnabled ? 'Desktop alerts enabled (2-min warning)' : 'Click to enable desktop meeting notifications'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                {notificationsEnabled ? 'notifications_active' : 'notifications_none'}
              </span>
              <span>{notificationsEnabled ? 'Alerts On' : 'Alerts'}</span>
            </button>
            <div className="strip-divider"></div>
            <button
              type="button"
              className="utility-strip-btn"
              onClick={handleSwitchWorkspace}
              title="Click to copy your private workspace key or switch workspaces"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>folder_shared</span>
              <span>{workspaceId}</span>
            </button>
            <div className="strip-divider"></div>
            <button
              type="button"
              className="utility-strip-btn"
              onClick={() => handleDownloadBackup(false)}
              title="Export complete SQLite database backup (Meetings, Tasks & Messages)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>cloud_download</span>
              <span>Backup</span>
            </button>
            <div className="strip-divider"></div>
            <button
              type="button"
              className="utility-strip-btn"
              onClick={() => restoreFileInputRef.current?.click()}
              title="Restore database from an exported backup JSON file"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>cloud_upload</span>
              <span>Restore</span>
            </button>
            <input
              type="file"
              ref={restoreFileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleRestoreBackup}
            />
            <div className="strip-divider"></div>
            <div className="utility-strip-status" title={serverOnline ? 'Connected to local backend' : 'Operating in local offline cache mode'}>
              <span className="pulse-dot"></span>
              <span>{serverOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Morning Overdue Triage Bar */}
        {overdueTasks.length > 0 && !dismissTriage && (
          <div className="overdue-triage-bar">
            <div className="triage-left">
              <span className="material-symbols-outlined triage-icon">warning</span>
              <div>
                <strong>Overdue Backlog:</strong> {overdueTasks.length} incomplete task{overdueTasks.length > 1 ? 's' : ''} from past dates.
              </div>
            </div>
            <div className="triage-actions">
              <button className="triage-btn-primary" onClick={handleRolloverAllOverdue}>
                Move All to Today ({todayStr})
              </button>
              <button className="triage-btn-secondary" onClick={() => setDismissTriage(true)}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Up Next Focus Hero Banner */}
        <div className="up-next-banner">
          <div className="up-next-badge">UP NEXT</div>
          {upNextMeeting ? (
            <div className="up-next-content">
              <div className="up-next-info">
                <div className="up-next-title-row">
                  <h3 className="up-next-title">{upNextMeeting.title}</h3>
                  <span className="countdown-pill">{getCountdownText(upNextMeeting)}</span>
                  <span className="time-pill">{upNextMeeting.time}</span>
                </div>
                {upNextMeeting.attendees && (
                  <div className="up-next-attendees">Attendees: {upNextMeeting.attendees}</div>
                )}
                {upNextMeeting.notes && (
                  <div className="up-next-notes">{upNextMeeting.notes}</div>
                )}
              </div>
              <div className="up-next-actions">
                {upNextMeeting.link && (
                  <a
                    href={upNextMeeting.link}
                    target="_blank"
                    rel="noreferrer"
                    className="up-next-join-btn"
                  >
                    <span className="material-symbols-outlined">videocam</span>
                    <span>Join Call</span>
                  </a>
                )}
                <button
                  className="up-next-copy-btn"
                  onClick={() => handleAddToGoogleCalendar(upNextMeeting)}
                  title="Add to Google Calendar"
                >
                  + GCal
                </button>
                <button
                  className="up-next-copy-btn"
                  onClick={() => handleCopyMeetingInvite(upNextMeeting)}
                >
                  Copy Invite
                </button>
                {upNextMeeting.notes && (
                  <button
                    className="up-next-copy-btn"
                    onClick={() => handleConvertNotesToTasks(upNextMeeting)}
                    title="Extract notes into standalone tasks for tomorrow"
                  >
                    Notes → Tasks
                  </button>
                )}
                {isSprintActive ? (
                  <button
                    type="button"
                    className="up-next-sprint-btn active"
                    onClick={handleStopFocusSprint}
                    title="Stop active focus sprint"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>timer</span>
                    <span>Sprint: {formatSprintTimer(focusSprintSeconds)} (Stop)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="up-next-sprint-btn"
                    onClick={() => handleStartFocusSprint(25)}
                    title="Start 25-minute deep-work focus sprint"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>timer</span>
                    <span>Focus Sprint (25m)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="up-next-empty">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>check_circle</span>
                <span>Schedule Clear: All meetings concluded for today</span>
              </div>
              <div>
                {isSprintActive ? (
                  <button
                    type="button"
                    className="up-next-sprint-btn active"
                    onClick={handleStopFocusSprint}
                    title="Stop active focus sprint"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>timer</span>
                    <span>Sprint: {formatSprintTimer(focusSprintSeconds)} (Stop)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="up-next-sprint-btn"
                    onClick={() => handleStartFocusSprint(25)}
                    title="Start 25-minute deep-work focus sprint"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>timer</span>
                    <span>Focus Sprint (25m)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bento Metric Cards (Solid Black Borders, 3 colors) */}
        <div className="bento-grid">
          <div className="bento-card blue">
            <div className="bento-top">
              <span className="bento-label">Total Scheduled</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-blue)' }}>calendar_month</span>
            </div>
            <div className="bento-value-row">
              <span className="bento-value">{totalCount}</span>
            </div>
          </div>

          <div className="bento-card red">
            <div className="bento-top">
              <span className="bento-label">High Priority</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-red)' }}>priority_high</span>
            </div>
            <div className="bento-value-row">
              <span className="bento-value" style={{ color: 'var(--color-red)' }}>{highPriorityCount}</span>
            </div>
          </div>

          <div className="bento-card green">
            <div className="bento-top">
              <span className="bento-label">Meetings</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>groups</span>
            </div>
            <div className="bento-value-row">
              <span className="bento-value" style={{ color: 'var(--color-green)' }}>{meetingCount}</span>
            </div>
          </div>

          <div className="bento-card black">
            <div className="bento-top">
              <span className="bento-label">Pending</span>
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <div className="bento-value-row">
              <span className="bento-value">{pendingCount}</span>
            </div>
          </div>
        </div>

        {/* View Switchers & Filters Bar */}
        <div className="view-filter-bar">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={`tab-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar &amp; Day View
            </button>
            <button
              className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button
              className={`tab-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              Cards View
            </button>
            <button
              className={`tab-btn ${viewMode === 'analytics' ? 'active' : ''}`}
              onClick={() => setViewMode('analytics')}
            >
              Analytics View
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={`filter-pill ${typeFilter === 'All' && statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => { setTypeFilter('All'); setStatusFilter('All'); }}
            >
              All Items
            </button>
            <button
              className={`filter-pill ${statusFilter === 'Pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}
            >
              Pending
            </button>
            <button
              className={`filter-pill ${statusFilter === 'Completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'Completed' ? 'All' : 'Completed')}
            >
              Completed
            </button>
            <button
              className={`filter-pill ${typeFilter === 'tasks' ? 'active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === 'tasks' ? 'All' : 'tasks')}
            >
              Tasks Only
            </button>
            <button
              className={`filter-pill ${typeFilter === 'meetings' ? 'active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === 'meetings' ? 'All' : 'meetings')}
            >
              Meetings Only
            </button>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="content-grid">
          {/* Left Main View (Calendar, Table, Cards, Analytics) */}
          <div>
            {viewMode === 'calendar' && (
              <CalendarView
                calMonth={calMonth}
                calYear={calYear}
                monthNames={monthNames}
                monthTasksCount={monthTasksCount}
                monthMeetingsCount={monthMeetingsCount}
                handlePrevPeriod={handlePrevPeriod}
                handleNextPeriod={handleNextPeriod}
                setCurrentCalendarDate={setCurrentCalendarDate}
                setSelectedDate={setSelectedDate}
                todayStr={todayStr}
                calSubView={calSubView}
                setCalSubView={setCalSubView}
                firstDayIndex={firstDayIndex}
                daysInMonth={daysInMonth}
                itemsByDate={itemsByDate}
                priorityOrder={priorityOrder}
                selectedDate={selectedDate}
                isMeeting={isMeeting}
                handleOpenCreateTask={handleOpenCreateTask}
                activeWeekDates={activeWeekDates}
                handleOpenEdit={handleOpenEdit}
                monthCompletionPercent={monthCompletionPercent}
                monthCompletedCount={monthCompletedCount}
                monthItems={monthItems}
              />
            )}

            {viewMode === 'table' && (
              <TableView
                filteredAndSortedItems={filteredAndSortedItems}
                selectedDate={selectedDate}
                handleOpenCreateTask={handleOpenCreateTask}
                handleOpenCreateMeeting={handleOpenCreateMeeting}
                handleOpenEdit={handleOpenEdit}
                handleToggleStatus={handleToggleStatus}
                handleMoveToTomorrow={handleMoveToTomorrow}
                handleAddToGoogleCalendar={handleAddToGoogleCalendar}
                handleDelete={handleDelete}
                isMeeting={isMeeting}
              />
            )}

            {viewMode === 'cards' && (
              <CardsView
                filteredAndSortedItems={filteredAndSortedItems}
                handleOpenEdit={handleOpenEdit}
                handleToggleStatus={handleToggleStatus}
                handleMoveToTomorrow={handleMoveToTomorrow}
                handleAddToGoogleCalendar={handleAddToGoogleCalendar}
                handleCopyMeetingInvite={handleCopyMeetingInvite}
                handleConvertNotesToTasks={handleConvertNotesToTasks}
                handleDelete={handleDelete}
                isMeeting={isMeeting}
              />
            )}

            {viewMode === 'analytics' && (
              <AnalyticsView
                completionRate={completionRate}
                meetingCount={meetingCount}
                totalCount={totalCount}
                highPriorityCount={highPriorityCount}
                activeStreak={activeStreak}
                heatmapTotalActions={heatmapTotalActions}
                heatmapDays={heatmapDays}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                showToast={showToast}
              />
            )}
          </div>

          {/* Right Column (Day Schedule Sidebar) */}
          <div>
            <DayScheduleSidebar
              selectedDate={selectedDate}
              handleOpenCreateTask={handleOpenCreateTask}
              handleOpenCreateMeeting={handleOpenCreateMeeting}
              dayScheduleItems={dayScheduleItems}
              isMeeting={isMeeting}
              handleToggleStatus={handleToggleStatus}
              handleMoveToTomorrow={handleMoveToTomorrow}
              handleAddToGoogleCalendar={handleAddToGoogleCalendar}
              handleCopyMeetingInvite={handleCopyMeetingInvite}
              handleConvertNotesToTasks={handleConvertNotesToTasks}
              handleOpenEdit={handleOpenEdit}
              handleDelete={handleDelete}
            />
          </div>
        </div>
      </main>

      {/* Slide-out Side Drawer */}
      <ItemDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        drawerType={drawerType}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onAutoDetectCallLink={handleAutoDetectCallLink}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        paletteQuery={paletteQuery}
        setPaletteQuery={setPaletteQuery}
        filteredCommands={filteredCommands}
        matchingPaletteItems={matchingPaletteItems}
        isMeeting={isMeeting}
        setSelectedDate={setSelectedDate}
        handleOpenEdit={handleOpenEdit}
      />

      {/* Google Meet Professional Calling Stage & Floating Controls */}
      <ConferenceOverlay
        activeCallRoom={activeCallRoom}
        isCallMinimized={isCallMinimized}
        setIsCallMinimized={setIsCallMinimized}
        meetingDrawerTab={meetingDrawerTab}
        setMeetingDrawerTab={setMeetingDrawerTab}
        callDuration={callDuration}
        connectedPeers={connectedPeers}
        speakingPeers={speakingPeers}
        handleEndCall={handleEndCall}
        isVideoOff={isVideoOff}
        guestName={guestName}
        isHostInCall={isHostInCall}
        localVideoRef={localVideoRef}
        screenStreamRef={screenStreamRef}
        localStreamRef={localStreamRef}
        isScreenSharing={isScreenSharing}
        isAudioMuted={isAudioMuted}
        handleToggleAudio={handleToggleAudio}
        handleToggleVideo={handleToggleVideo}
        handleToggleScreenShare={handleToggleScreenShare}
        callQuality={callQuality}
        meetingLayout={meetingLayout}
        setMeetingLayout={setMeetingLayout}
        pinnedParticipant={pinnedParticipant}
        setPinnedParticipant={setPinnedParticipant}
        handleToggleFullscreen={handleToggleFullscreen}
        isCallFullscreen={isCallFullscreen}
        isLocalSpeaking={isLocalSpeaking}
        isHandRaised={isHandRaised}
        handleToggleRaiseHand={handleToggleRaiseHand}
        callStatusText={callStatusText}
        handleCopyGuestLink={handleCopyGuestLink}
        pendingKnocks={pendingKnocks}
        handleAdmitKnockGuest={handleAdmitKnockGuest}
        handleDenyKnockGuest={handleDenyKnockGuest}
        chatMessages={chatMessages}
        handleLoadRoomMessages={handleLoadRoomMessages}
        setActiveImageLightbox={setActiveImageLightbox}
        chatMessagesEndRef={chatMessagesEndRef}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        chatFileInputRef={chatFileInputRef}
        handleImageSelect={handleImageSelect}
        chatInputText={chatInputText}
        setChatInputText={setChatInputText}
        chatAttachment={chatAttachment}
        handleSendChatMessage={handleSendChatMessage}
        publicBaseUrl={publicBaseUrl}
        getPublicWebOrigin={getPublicWebOrigin}
        showToast={showToast}
        isRecording={isRecording}
        isRecordingPaused={isRecordingPaused}
        recordingDuration={recordingDuration}
        onStartRecording={handleStartCallRecording}
        onPauseRecording={pauseRecording}
        onResumeRecording={resumeRecording}
        onStopRecording={stopRecording}
        agendaState={agendaState}
        speakerState={speakerState}
        localPeerId={myPeerId}
      />

      {/* Mobile Sticky Quick-Action Dock (Direct 1-tap mobile access) */}
      <nav className="mobile-action-bar">
        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => handleOpenCreateTask(selectedDate)}
          title="Create New Task"
        >
          <span className="material-symbols-outlined">add_task</span>
          <span>+ Task</span>
        </button>
        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => handleOpenCreateMeeting(selectedDate)}
          title="Schedule Meeting"
        >
          <span className="material-symbols-outlined">calendar_add_on</span>
          <span>+ Meet</span>
        </button>
        <button
          type="button"
          className="mobile-nav-item highlight-call"
          onClick={() => handleStartInstantCall()}
          title="Start Instant WebRTC Call"
        >
          <span className="material-symbols-outlined">videocam</span>
          <span>Call</span>
        </button>
        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => setIsQuickJoinModalOpen(true)}
          title="Quick Join with Room Code"
        >
          <span className="material-symbols-outlined">bolt</span>
          <span>Join</span>
        </button>
        <button
          type="button"
          className="mobile-nav-item"
          onClick={handleOpenGlobalChat}
          title="Global Online Chat & Work Room"
        >
          <span className="material-symbols-outlined">forum</span>
          <span>Chat</span>
        </button>
        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => setIsPaletteOpen(true)}
          title="Search / Command Palette"
        >
          <span className="material-symbols-outlined">search</span>
          <span>Search</span>
        </button>
        <button
          type="button"
          className="mobile-nav-item"
          onClick={handleCopyDailyStandup}
          title="Copy Daily Standup"
        >
          <span className="material-symbols-outlined">content_paste</span>
          <span>Standup</span>
        </button>
      </nav>

      {/* Floating / Docked Global Online Work Chat & Image Sharing Room */}
      <FloatingChatDock
        isOpen={isRoomChatOpen}
        room={(activeCallRoom || activeChatRoom || 'general').trim().toLowerCase()}
        messages={chatMessages}
        guestName={guestName}
        onlineCount={chatOnlineCount}
        onClose={() => setIsRoomChatOpen(false)}
        onCopyRoomLink={handleCopyChatShareLink}
        onFullScreen={handleConnectGlobalChat}
        chatInputText={chatInputText}
        handleChatInputChange={handleChatInputChange}
        chatAttachment={chatAttachment}
        setChatAttachment={setChatAttachment}
        chatFileInputRef={chatFileInputRef}
        handleImageSelect={handleImageSelect}
        handlePasteEvent={handlePasteEvent}
        handleSendChatMessage={handleSendChatMessage}
        chatMessagesEndRef={chatMessagesEndRef}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        handleReplyChatMessage={handleReplyChatMessage}
        handleCopyMessageText={handleCopyMessageText}
        handleDeleteChatMessage={handleDeleteChatMessage}
        onImageClick={setActiveImageLightbox}
        typingUsers={typingUsers}
        isDraggingOverChat={isDraggingOverChat}
        handleChatScroll={handleChatScroll}
        handleChatDragOver={handleChatDragOver}
        handleChatDragLeave={handleChatDragLeave}
        handleChatDrop={handleChatDrop}
        showScrollDown={showScrollDown}
        unreadWhileScrolled={unreadWhileScrolled}
        scrollToBottom={scrollToBottom}
      />

      {/* Direct Quick Join Modal - Instant Call & Chat with Zero Boundaries */}
      <QuickJoinModal
        isOpen={isQuickJoinModalOpen}
        onClose={() => setIsQuickJoinModalOpen(false)}
        quickJoinCode={quickJoinCode}
        setQuickJoinCode={setQuickJoinCode}
        handleQuickJoinCall={handleQuickJoinCall}
        handleQuickJoinChat={handleQuickJoinChat}
        handleStartInstantCall={handleStartInstantCall}
      />

      {/* Create or Join Global Work Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        handleCreateNewRoom={handleCreateNewRoom}
        newRoomInputCode={newRoomInputCode}
        setNewRoomInputCode={setNewRoomInputCode}
      />

      {/* Image Lightbox Fullscreen Viewer */}
      <ImageLightbox
        src={activeImageLightbox}
        onClose={() => setActiveImageLightbox(null)}
      />

      {/* Floating Host Admission Dialog for Knocking Guests */}
      <HostKnockModal
        pendingKnocks={pendingKnocks}
        handleAdmitGuest={handleAdmitGuest}
        handleDenyGuest={handleDenyGuest}
      />

      {/* Meeting Recording Review & Export Modal */}
      <RecordingModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        recordedUrl={recordedUrl}
        recordingDuration={recordingDuration}
        recordingSize={recordingSize}
        recordingMimeType={recordingMimeType}
        recordingRoom={recordingRoom || activeCallRoom || 'general'}
        downloadRecording={downloadRecording}
        discardRecording={discardRecording}
        onAttachToMeeting={handleAttachRecordingToMeeting}
        activeMeeting={items.find(
          (item) => item.type === 'meeting' && (item.room_id === (activeCallRoom || recordingRoom) || item.title?.toLowerCase().includes((activeCallRoom || recordingRoom || '').toLowerCase()))
        )}
      />

      {/* Toast Alert */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;
