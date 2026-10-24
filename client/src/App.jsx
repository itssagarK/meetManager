import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = '/api/meetings';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const initialFormData = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  time: '10:00 AM',
  priority: 'High',
  status: 'Pending',
  notes: '',
  link: '',
  attendees: '',
  sendEmailInvites: true,
};

const priorityOrder = { High: 1, Medium: 2, Low: 3 };

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

  // WebRTC Video Calling ("Instant PCS Meet Room")
  const [activeCallRoom, setActiveCallRoom] = useState(null);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [callStatusText, setCallStatusText] = useState('');
  const [iceServersList, setIceServersList] = useState(RTC_CONFIG.iceServers);
  const [callQuality, setCallQuality] = useState('connecting'); // 'connecting' | 'stable' | 'relayed' | 'reconnecting' | 'failed'
  const [publicBaseUrl, setPublicBaseUrl] = useState('');
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
  const chatMessagesEndRef = useRef(null);
  const chatFileInputRef = useRef(null);
  const chatWsRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const wsSignalingRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const statsIntervalRef = useRef(null);

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
  const apiFetch = (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      'X-Workspace-Id': workspaceId,
    };
    return fetch(url, { ...options, headers });
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
      const base = publicBaseUrl || window.location.origin;
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

  // WebRTC Video Calling ("Instant PCS Meet Room") Lifecycle
  const createPeerConnection = (roomId) => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {}
    }

    const pc = new RTCPeerConnection({ iceServers: iceServersList });
    peerConnectionRef.current = pc;
    setCallQuality('connecting');

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsCallConnected(true);
        setCallStatusText('Connected with peer');
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN) {
        wsSignalingRef.current.send(
          JSON.stringify({
            type: 'signal',
            roomId,
            payload: { candidate: event.candidate },
          })
        );
      }
    };

    // Automatic ICE Restart and Connection Health Detection
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        setCallQuality('stable');
        setIsCallConnected(true);
        setCallStatusText('Connected with peer');
      } else if (state === 'disconnected') {
        setCallQuality('reconnecting');
        setCallStatusText('Network fluctuation. Reconnecting...');
      } else if (state === 'failed') {
        setCallQuality('reconnecting');
        setCallStatusText('Connection interrupted. Attempting ICE restart...');
        if (typeof pc.restartIce === 'function') {
          pc.restartIce();
        }
      } else if (state === 'closed') {
        setCallQuality('failed');
        setIsCallConnected(false);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsCallConnected(false);
        setCallQuality('reconnecting');
        setCallStatusText('Peer disconnected. Waiting for reconnection...');
      } else if (pc.connectionState === 'connected') {
        setIsCallConnected(true);
        setCallQuality('stable');
        setCallStatusText('Connected with peer');
      }
    };

    // Monitor WebRTC stream stats every 3 seconds for relay/direct health
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    statsIntervalRef.current = setInterval(async () => {
      if (!pc || pc.connectionState !== 'connected') return;
      try {
        const stats = await pc.getStats();
        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            const localCandidate = stats.get(report.localCandidateId);
            if (localCandidate && localCandidate.candidateType === 'relay') {
              setCallQuality('relayed');
            } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
              setCallQuality('stable');
            }
          }
        });
      } catch (e) {}
    }, 3000);

    return pc;
  };

  const handleStartInstantCall = (customRoomId = null) => {
    const roomId = customRoomId || `pcs-${Math.random().toString(36).substring(2, 9)}`;
    handleJoinCallRoom(roomId, true);
  };

  const handleJoinCallRoom = async (roomId, isHost = false) => {
    try {
      setActiveCallRoom(roomId);
      setIsCallConnected(false);
      setIsCallMinimized(false);
      setIsHostInCall(isHost);
      setCallStatusText(isHost ? 'Room created! Waiting for guest to join...' : 'Joining room and connecting...');

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
      }

      // Connect to WebSocket signaling server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsSignalingRef.current = ws;

      ws.onopen = () => {
        if (isHost) {
          ws.send(JSON.stringify({ type: 'host-join', roomId }));
          showToast(`Host started PCS Room: ${roomId}`);
        } else {
          ws.send(JSON.stringify({ type: 'join-room', roomId }));
          showToast(`Entered PCS Room: ${roomId}`);
        }
      };

      ws.onmessage = async (msgEvent) => {
        try {
          const data = JSON.parse(msgEvent.data);

          if (data.type === 'guest-knock-request') {
            const knockingGuest = data.guest;
            setPendingKnocks((prev) => {
              if (prev.some((k) => k.id === knockingGuest.id)) return prev;
              return [...prev, { ...knockingGuest, roomId: data.roomId || roomId }];
            });
            showToast(`Guest ${knockingGuest.name} (${knockingGuest.officeId}) is knocking`);
          } else if (data.type === 'guest-knock-cancelled') {
            setPendingKnocks((prev) => prev.filter((k) => k.id !== data.guestId));
          } else if (data.type === 'host-ready') {
            if (data.waitingGuests && data.waitingGuests.length > 0) {
              setPendingKnocks(data.waitingGuests.map((g) => ({ ...g, roomId })));
            }
          } else if (data.type === 'guest-admitted-ack') {
            setPendingKnocks((prev) => prev.filter((k) => k.id !== data.guestId));
          } else if (data.type === 'peer-joined') {
            showToast('Guest joined the call. Establishing connection...');
            setCallStatusText('Peer joined! Connecting WebRTC...');
            const pc = createPeerConnection(roomId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(
              JSON.stringify({
                type: 'signal',
                roomId,
                payload: { offer },
              })
            );
          } else if (data.type === 'signal') {
            const { payload } = data;
            if (!payload) return;

            if (payload.offer) {
              const pc = peerConnectionRef.current || createPeerConnection(roomId);
              await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));

              while (iceCandidatesQueue.current.length > 0) {
                const candidate = iceCandidatesQueue.current.shift();
                await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
              }

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(
                JSON.stringify({
                  type: 'signal',
                  roomId,
                  payload: { answer },
                })
              );
              setCallStatusText('Connecting to host...');
            } else if (payload.answer) {
              if (peerConnectionRef.current) {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
                setIsCallConnected(true);
                setCallStatusText('Connected with peer');

                while (iceCandidatesQueue.current.length > 0) {
                  const candidate = iceCandidatesQueue.current.shift();
                  await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
                }
              }
            } else if (payload.candidate) {
              if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(console.warn);
              } else {
                iceCandidatesQueue.current.push(payload.candidate);
              }
            }
          } else if (data.type === 'peer-left') {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
            setIsCallConnected(false);
            setCallStatusText('Guest disconnected from room.');
            showToast('Guest disconnected');
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
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      if (peerConnectionRef.current && cameraTrack) {
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
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

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

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
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (wsSignalingRef.current) {
      wsSignalingRef.current.close();
      wsSignalingRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    iceCandidatesQueue.current = [];
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

    if (window.location.search.includes('room=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    showToast('PCS Meet Call ended');
  };

  const handleCopyGuestLink = () => {
    if (!activeCallRoom) return;
    const origin = publicBaseUrl || window.location.origin;
    const guestUrl = `${origin}?room=${activeCallRoom}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(guestUrl);
      showToast('Guest invite link copied to clipboard');
    } else {
      prompt('Copy guest call link:', guestUrl);
    }
  };

  const handleGuestKnock = async (roomId) => {
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

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsSignalingRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'guest-knock',
          roomId,
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
          showToast('Admitted by host! Connecting video call...');
          setGuestKnockStatus('admitted');
          setActiveCallRoom(roomId);
          setCallStatusText('Host admitted you. Activating camera & connecting...');

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
          }
        } else if (data.type === 'guest-denied') {
          setGuestKnockStatus('denied');
          setGuestDeniedReason(data.reason || 'The meeting host declined admission for this session.');
          showToast('Admission declined by host');
        } else if (data.type === 'peer-joined') {
          setCallStatusText('Connecting WebRTC...');
          const pc = createPeerConnection(roomId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(
            JSON.stringify({
              type: 'signal',
              roomId,
              payload: { offer },
            })
          );
        } else if (data.type === 'signal') {
          const { payload } = data;
          if (!payload) return;

          if (payload.offer) {
            const pc = peerConnectionRef.current || createPeerConnection(roomId);
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));

            while (iceCandidatesQueue.current.length > 0) {
              const candidate = iceCandidatesQueue.current.shift();
              await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(
              JSON.stringify({
                type: 'signal',
                roomId,
                payload: { answer },
              })
            );
            setCallStatusText('Connecting to host...');
          } else if (payload.answer) {
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
              setIsCallConnected(true);
              setCallStatusText('Connected with host');

              while (iceCandidatesQueue.current.length > 0) {
                const candidate = iceCandidatesQueue.current.shift();
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
              }
            }
          } else if (payload.candidate) {
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(console.warn);
            } else {
              iceCandidatesQueue.current.push(payload.candidate);
            }
          }
        } else if (data.type === 'peer-left' || data.type === 'host-left') {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          setIsCallConnected(false);
          setCallStatusText('Host left or ended the meeting.');
          showToast('Host disconnected from call');
        } else if (data.type === 'chat-message') {
          if (data.message) {
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
          }
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

  const handleCopyPublicPortalLink = () => {
    const origin = publicBaseUrl || window.location.origin;
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
    fetch(`/api/public/room-status?room=${roomId}`)
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
    fetch('/api/public/live-meetings')
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
    const interval = setInterval(fetchPublicMeetings, 5000);
    return () => clearInterval(interval);
  }, [isPublicPortal]);

  // Global Online Work Chat & Image Sharing Handlers
  const handleLoadRoomMessages = (roomId) => {
    if (!roomId) return;
    fetch(`/api/rooms/${roomId}/messages`)
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

    const msgPayload = {
      senderName: sender,
      senderId: (typeof window !== 'undefined' && (sessionStorage.getItem('pcs_guest_office_id') || sessionStorage.getItem('pcs_user_id'))) || 'user',
      content: chatInputText.trim(),
      attachmentUrl: chatAttachment ? chatAttachment.url : null,
      attachmentType,
    };

    // Optimistic UI update: immediately display in message list
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const optimisticMsg = {
      id: tempId,
      room_id: targetRoom,
      sender_name: sender,
      sender_id: msgPayload.senderId,
      content: msgPayload.content,
      attachment_url: msgPayload.attachmentUrl,
      attachment_type: msgPayload.attachmentType,
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);

    // Guaranteed persistence via REST endpoint
    fetch(`/api/rooms/${encodeURIComponent(targetRoom)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msgPayload),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((saved) => {
        if (saved) {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === saved.id)) {
              return prev.filter((m) => m.id !== tempId);
            }
            const idx = prev.findIndex((m) => m.id === tempId);
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = saved;
              return next;
            }
            return [...prev, saved];
          });
        }
      })
      .catch((err) => console.warn('REST message post warning:', err));

    // Real-time broadcast via WebSocket
    if (chatWsRef.current && chatWsRef.current.readyState === WebSocket.OPEN) {
      chatWsRef.current.send(
        JSON.stringify({
          type: 'chat-message',
          roomId: targetRoom,
          message: msgPayload,
        })
      );
    } else if (wsSignalingRef.current && wsSignalingRef.current.readyState === WebSocket.OPEN) {
      wsSignalingRef.current.send(
        JSON.stringify({
          type: 'chat-message',
          roomId: targetRoom,
          message: msgPayload,
        })
      );
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      chatWsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'chat-join', roomId: targetRoom }));
        ws.send(JSON.stringify({ type: 'chat-message', roomId: targetRoom, message: msgPayload }));
      };
      ws.onmessage = (msgEvent) => {
        try {
          const data = JSON.parse(msgEvent.data);
          if (data.type === 'chat-message' && data.message) {
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) {
                return prev.filter((m) => m.id !== tempId);
              }
              const idx = prev.findIndex(
                (m) => m.id === tempId || (String(m.id).startsWith('temp-') && m.content === data.message.content)
              );
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = data.message;
                return next;
              }
              return [...prev, data.message];
            });
          }
        } catch (e) {}
      };
    }

    setChatInputText('');
    setChatAttachment(null);
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

  const renderMessageContent = (msg) => {
    const text = msg.content || '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
      <div className="message-content-wrapper">
        {text && (
          <p className="message-text">
            {parts.map((part, i) => {
              if (part.match(urlRegex)) {
                return (
                  <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chat-link"
                  >
                    {part}
                  </a>
                );
              }
              return part;
            })}
          </p>
        )}

        {msg.attachment_url && (
          <div className="chat-image-attachment">
            <img
              src={msg.attachment_url}
              alt="Shared work asset"
              onClick={() => setActiveImageLightbox(msg.attachment_url)}
              loading="lazy"
            />
            <span className="attachment-click-hint">Click to enlarge</span>
          </div>
        )}
      </div>
    );
  };

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
    const origin = publicBaseUrl || window.location.origin;
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
    const origin = publicBaseUrl || window.location.origin;
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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
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
          if (data.type === 'chat-message' && data.message) {
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              const idx = prev.findIndex(
                (m) => String(m.id).startsWith('temp-') && m.content === data.message.content
              );
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = data.message;
                return next;
              }
              return [...prev, data.message];
            });
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
      fetch(`/api/rooms/${encodeURIComponent(currentRoom)}/messages`)
        .then((res) => (res.ok ? res.json() : []))
        .then((latest) => {
          if (Array.isArray(latest) && latest.length > 0) {
            setChatMessages((prev) => {
              if (prev.length === latest.length && prev.length > 0 && prev[prev.length - 1].id === latest[latest.length - 1].id) {
                return prev;
              }
              const pendingTemps = prev.filter((m) => String(m.id).startsWith('temp-') && !latest.some((lm) => lm.content === m.content));
              return [...latest, ...pendingTemps];
            });
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(syncInterval);
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

  // Sync local stream with local video element when room or minimized state changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [activeCallRoom, isCallMinimized]);

  // Fetch production ICE configuration (STUN + TURN relay + Public URL) from backend
  useEffect(() => {
    fetch('/api/webrtc/ice-config')
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
      setActiveCallRoom(roomParam);
      fetch(`/api/public/room-status?room=${roomParam}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setIsHostOnlineInRoom(Boolean(data.isLive));
        })
        .catch(() => {});
    }
  }, []);

  // Poll room status while in guest lobby
  useEffect(() => {
    if (!isGuestMode || guestKnockStatus === 'admitted' || !activeCallRoom) return;
    const interval = setInterval(() => {
      fetch(`/api/public/room-status?room=${activeCallRoom}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setIsHostOnlineInRoom(Boolean(data.isLive));
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
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
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
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
    return (
      <div className="public-portal-wrapper">
        <header className="public-portal-header">
          <div className="public-header-inner">
            <div className="brand-group">
              <span className="brand-logo-badge">PCS</span>
              <div>
                <h2 className="brand-title">Executive Meeting Portal</h2>
                <span className="portal-sub">Public Live Directory & Direct Admission</span>
              </div>
            </div>
            <div className="portal-header-actions">
              <span className="portal-clock">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                type="button"
                className="btn-switch-workspace"
                onClick={() => {
                  setIsPublicPortal(false);
                  handleConnectGlobalChat('general');
                }}
                title="Open Global Online Work Chat"
              >
                <span className="material-symbols-outlined">forum</span>
                <span>Work Chat</span>
              </button>
              <button
                type="button"
                className="btn-switch-workspace"
                onClick={() => {
                  setIsPublicPortal(false);
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span>Workspace Dashboard</span>
              </button>
            </div>
          </div>
        </header>

        <main className="public-portal-stage">
          <div className="public-portal-hero">
            <div className="portal-hero-title-row">
              <span className="material-symbols-outlined portal-hero-icon">live_tv</span>
              <div>
                <h1>Live Meeting Directory</h1>
                <p>Verify live host status and join directly with your Full Name and Office ID.</p>
              </div>
            </div>

            <form className="public-room-code-form" onSubmit={handleDirectRoomCodeSubmit}>
              <div className="room-input-group">
                <span className="material-symbols-outlined">key</span>
                <input
                  type="text"
                  placeholder="Enter Room Code (e.g. pcs-room-101)..."
                  value={publicDirectRoomInput}
                  onChange={(e) => setPublicDirectRoomInput(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-direct-join">
                <span>Join Directly</span>
                <span className="material-symbols-outlined">login</span>
              </button>
            </form>
          </div>

          <div className="public-meetings-grid">
            <div className="public-grid-header">
              <h3>Today's Meetings</h3>
              <span className="public-grid-counter">{publicMeetings.length} Scheduled</span>
            </div>

            {isPublicLoading && publicMeetings.length === 0 ? (
              <div className="portal-empty-state">
                <span className="material-symbols-outlined spin">refresh</span>
                <p>Loading live meeting schedule...</p>
              </div>
            ) : publicMeetings.length === 0 ? (
              <div className="portal-empty-state">
                <span className="material-symbols-outlined">event_available</span>
                <p>No public meetings scheduled for today.</p>
                <button
                  type="button"
                  className="btn-create-instant-public"
                  onClick={() => {
                    const newRoom = `pcs-${Math.random().toString(36).substring(2, 9)}`;
                    handleDirectJoinFromPortal(newRoom);
                  }}
                >
                  <span className="material-symbols-outlined">add</span>
                  <span>Start a New Instant Meeting</span>
                </button>
              </div>
            ) : (
              <div className="public-cards-list">
                {publicMeetings.map((m) => (
                  <div key={m.id} className={`public-meeting-card ${m.isLive ? 'is-live-card' : ''}`}>
                    <div className="public-card-meta">
                      {m.isLive ? (
                        <div className="meeting-live-badge is-on">
                          <span className="live-pulse-dot"></span>
                          <span>MEETING IS ON</span>
                        </div>
                      ) : (
                        <div className="meeting-live-badge scheduled">
                          <span className="scheduled-dot"></span>
                          <span>SCHEDULED</span>
                        </div>
                      )}
                      <span className="public-meeting-time">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                        <span>{m.time}</span>
                      </span>
                    </div>

                    <h4 className="public-meeting-title">{m.title}</h4>

                    <div className="public-card-footer">
                      <span className="public-room-code">Room: {m.roomId}</span>
                      <button
                        type="button"
                        className={`btn-join-public-meeting ${m.isLive ? 'primary' : ''}`}
                        onClick={() => handleDirectJoinFromPortal(m.roomId)}
                      >
                        <span className="material-symbols-outlined">videocam</span>
                        <span>Join Directly</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Floating Room Chat in Guest View */}
        {isRoomChatOpen && currentRoom && (
          <div className="room-chat-floating-dock guest-chat-dock">
            <div className="room-chat-header">
              <div className="room-chat-title-group">
                <span className="live-chat-dot"></span>
                <span className="room-chat-name">Room: <strong>{currentRoom}</strong></span>
                <span className="room-chat-count">{chatMessages.length} msgs</span>
              </div>
              <div className="room-chat-header-actions">
                <button
                  type="button"
                  className="chat-hdr-btn"
                  onClick={() => handleCopyRoomShareLink(currentRoom)}
                  title="Copy Room Link"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>link</span>
                  <span>Copy Link</span>
                </button>
                <button
                  type="button"
                  className="chat-hdr-btn close-chat-btn"
                  onClick={() => setIsRoomChatOpen(false)}
                  title="Close Chat"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>
            </div>

            <div className="room-chat-messages-scroll">
              {chatMessages.length === 0 ? (
                <div className="chat-empty-slate">
                  <span className="material-symbols-outlined chat-empty-icon">forum</span>
                  <p>Welcome to <strong>{currentRoom}</strong></p>
                  <span>Start the conversation. Share notes, links, or drop images from your device.</span>
                  <button
                    type="button"
                    className="btn-copy-room-first"
                    onClick={() => handleCopyRoomShareLink(currentRoom)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span>
                    <span>Copy Room Code</span>
                  </button>
                </div>
              ) : (
                chatMessages.map((m) => {
                  const isSelf = m.sender_name === (guestName.trim() || 'Colleague');
                  const timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={m.id || Math.random()} className={`chat-bubble-row ${isSelf ? 'self' : 'peer'}`}>
                      <div className="chat-bubble">
                        <div className="chat-bubble-meta">
                          <span className="chat-sender-name">{m.sender_name}</span>
                          <span className="chat-timestamp">{timeStr}</span>
                        </div>
                        <div className="chat-bubble-content">
                          {renderMessageContent(m)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            <div className="room-chat-composer">
              {chatAttachment && (
                <div className="chat-attachment-preview">
                  <img src={chatAttachment.url} alt="Attachment Preview" className="preview-thumb" />
                  <span className="preview-filename">{chatAttachment.name}</span>
                  <button
                    type="button"
                    className="btn-remove-attachment"
                    onClick={() => setChatAttachment(null)}
                    title="Remove attachment"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </div>
              )}

              <div className="chat-composer-input-row">
                <input
                  type="file"
                  ref={chatFileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  className="btn-attach-image"
                  onClick={() => chatFileInputRef.current?.click()}
                  title="Attach photo or image"
                >
                  <span className="material-symbols-outlined">image</span>
                </button>
                <textarea
                  className="chat-text-input"
                  placeholder="Type message, paste image, or drop work link..."
                  rows="1"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  onPaste={handlePasteEvent}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-chat-send"
                  onClick={handleSendChatMessage}
                  disabled={!chatInputText.trim() && !chatAttachment}
                  title="Send Message"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox Fullscreen Viewer for Guest View */}
        {activeImageLightbox && (
          <div className="image-lightbox-overlay" onClick={() => setActiveImageLightbox(null)}>
            <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <div className="lightbox-header">
                <span>Shared Work Image</span>
                <div className="lightbox-actions">
                  <a
                    href={activeImageLightbox}
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
                    onClick={() => setActiveImageLightbox(null)}
                    title="Close Viewer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              <div className="lightbox-img-frame">
                <img src={activeImageLightbox} alt="Full resolution shared work asset" />
              </div>
            </div>
          </div>
        )}

        {toastMessage && (
          <div className="toast-notice">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Dedicated Global Online Work Chat Room (?chat=roomCode or switched via UI)
  if (isGlobalChatMode) {
    const currentChat = activeChatRoom || 'general';
    return (
      <div className="global-chat-page-wrapper">
        <header className="global-chat-header">
          <div className="global-chat-header-inner">
            <div className="brand-group">
              <span className="brand-logo-badge">PCS</span>
              <div>
                <div className="chat-title-row">
                  <h2 className="brand-title">Global Work Chat</h2>
                  <span className="chat-room-badge">#{currentChat}</span>
                </div>
                <span className="chat-sub-hint">Instant text, link, and screenshot collaboration</span>
              </div>
            </div>

            <div className="global-chat-header-actions">
              <div className="chat-identity-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                <span>{guestName.trim() || 'Colleague'}</span>
                <button
                  type="button"
                  className="btn-edit-identity"
                  title="Change your display name"
                  onClick={() => {
                    const next = prompt('Enter your display name:', guestName || 'Colleague');
                    if (next && next.trim()) {
                      setGuestName(next.trim());
                      sessionStorage.setItem('pcs_guest_name', next.trim());
                      showToast(`Display name set to ${next.trim()}`);
                    }
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                </button>
              </div>

              <button
                type="button"
                className="btn-chat-copy-link"
                onClick={() => handleCopyChatShareLink(currentChat)}
                title="Copy shareable link for this room"
              >
                <span className="material-symbols-outlined">share</span>
                <span className="btn-text-desktop">Share Room</span>
              </button>

              <button
                type="button"
                className="btn-chat-switch-room"
                onClick={() => setIsCreateRoomModalOpen(true)}
                title="Create or join another room"
              >
                <span className="material-symbols-outlined">swap_horiz</span>
                <span className="btn-text-desktop">Switch Room</span>
              </button>

              <button
                type="button"
                className="btn-switch-workspace"
                onClick={() => {
                  setIsGlobalChatMode(false);
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                title="Return to Workspace Dashboard"
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span className="btn-text-desktop">Dashboard</span>
              </button>
            </div>
          </div>
        </header>

        <main className="global-chat-stage">
          <div className="global-chat-card">
            {/* Room Welcome Header */}
            <div className="global-chat-banner">
              <div className="banner-info">
                <span className="material-symbols-outlined banner-icon">lock_open</span>
                <div>
                  <strong>Room #{currentChat}</strong>
                  <p>Open work stream. Anyone with the room code or link can join and share instantly from any device.</p>
                </div>
              </div>
              <div className="banner-stats">
                <span className="message-count-badge">{chatMessages.length} messages</span>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="global-chat-messages-container" onPaste={handlePasteEvent}>
              {chatMessages.length === 0 ? (
                <div className="global-chat-empty-state">
                  <span className="material-symbols-outlined empty-icon">forum</span>
                  <h3>Welcome to #{currentChat}</h3>
                  <p>No messages yet. Send a quick update, paste a screenshot, or share a link to start collaborating.</p>
                  <div className="empty-state-tips">
                    <span className="tip-item">
                      <span className="material-symbols-outlined">link</span>
                      Links are automatically converted into clickable buttons
                    </span>
                    <span className="tip-item">
                      <span className="material-symbols-outlined">image</span>
                      Paste or upload screenshots with high-res Lightbox viewing
                    </span>
                  </div>
                </div>
              ) : (
                <div className="global-chat-messages-list">
                  {chatMessages.map((msg, idx) => {
                    const isSelf =
                      (guestName && msg.sender_name === guestName) ||
                      msg.sender_id === (sessionStorage.getItem('pcs_guest_office_id') || sessionStorage.getItem('pcs_user_id'));
                    const initial = (msg.sender_name || 'U').charAt(0).toUpperCase();
                    return (
                      <div
                        key={msg.id || idx}
                        className={`global-chat-msg-row ${isSelf ? 'msg-outgoing' : 'msg-incoming'}`}
                      >
                        {!isSelf && (
                          <div className="chat-avatar-bubble" title={msg.sender_name}>
                            {initial}
                          </div>
                        )}
                        <div className="chat-bubble-content">
                          <div className="chat-bubble-meta">
                            <span className="chat-sender-name">{msg.sender_name || 'Colleague'}</span>
                            <span className="chat-time-tag">
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          {renderMessageContent(msg)}
                        </div>
                        {isSelf && (
                          <div className="chat-avatar-bubble self" title="You">
                            {initial}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>
              )}
            </div>

            {/* Attachment preview if pending */}
            {chatAttachment && (
              <div className="chat-pending-attachment-bar">
                <div className="pending-thumb-wrapper">
                  <img src={chatAttachment.url} alt="Pending upload preview" />
                  <span className="pending-name">{chatAttachment.name}</span>
                </div>
                <button
                  type="button"
                  className="btn-remove-attachment"
                  onClick={() => setChatAttachment(null)}
                  title="Remove image"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}

            {/* Global Chat Composer */}
            <div className="global-chat-composer-bar">
              <input
                type="file"
                ref={chatFileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-attach-image"
                onClick={() => chatFileInputRef.current?.click()}
                title="Attach Screenshot or Image"
              >
                <span className="material-symbols-outlined">attach_file</span>
              </button>

              <div className="composer-input-wrap">
                <input
                  type="text"
                  placeholder="Type message, share link, or paste image... (Press Enter to send)"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  onPaste={handlePasteEvent}
                  autoFocus
                />
              </div>

              <button
                type="button"
                className="btn-chat-send-action"
                onClick={() => handleSendChatMessage()}
                disabled={!chatInputText.trim() && !chatAttachment}
                title="Send message"
              >
                <span className="material-symbols-outlined">send</span>
                <span className="btn-send-label">Send</span>
              </button>
            </div>
          </div>
        </main>

        {/* Create or Switch Global Work Room Modal */}
        {isCreateRoomModalOpen && (
          <div className="create-room-modal-overlay">
            <div className="create-room-modal-card">
              <div className="create-room-modal-header">
                <div className="modal-title-with-icon">
                  <span className="material-symbols-outlined modal-header-icon">forum</span>
                  <div>
                    <h3>Global Online Work Chat</h3>
                    <p>Create or join a room from any device. Share links, images, and chat instantly.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setIsCreateRoomModalOpen(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="create-room-modal-body">
                <div className="create-room-quick-section">
                  <h4>Option 1: Quick Create New Room</h4>
                  <p>Generates a dedicated collaboration room code that you can share with colleagues.</p>
                  <button
                    type="button"
                    className="btn-primary-create-room"
                    onClick={() => handleCreateNewRoom()}
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    <span>Create New Room</span>
                  </button>
                </div>

                <div className="create-room-divider">
                  <span>OR</span>
                </div>

                <div className="join-room-code-section">
                  <h4>Option 2: Enter Room Code to Join</h4>
                  <p>Have a room code from a teammate? Enter it here to open the room on this device.</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateNewRoom(newRoomInputCode);
                    }}
                    className="join-room-form"
                  >
                    <div className="join-input-wrap">
                      <span className="material-symbols-outlined">key</span>
                      <input
                        type="text"
                        placeholder="e.g. design-review, work-842..."
                        value={newRoomInputCode}
                        onChange={(e) => setNewRoomInputCode(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="btn-join-room-submit">
                      <span>Join Room</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </form>
                </div>

                <div className="create-room-divider">
                  <span>OR</span>
                </div>

                <div className="quick-general-section">
                  <button
                    type="button"
                    className="btn-quick-general-room"
                    onClick={() => handleCreateNewRoom('general')}
                  >
                    <span className="material-symbols-outlined">tag</span>
                    <span>Open General Team Chat (#general)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox Fullscreen Viewer */}
        {activeImageLightbox && (
          <div className="image-lightbox-overlay" onClick={() => setActiveImageLightbox(null)}>
            <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <div className="lightbox-header">
                <span>Shared Work Asset</span>
                <div className="lightbox-actions">
                  <a
                    href={activeImageLightbox}
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
                    onClick={() => setActiveImageLightbox(null)}
                    title="Close Viewer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              <div className="lightbox-img-frame">
                <img src={activeImageLightbox} alt="Full resolution shared work asset" />
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="toast-notice">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // Dedicated Guest Video Room (When external user joins via ?room=...)
  if (isGuestMode) {
    const currentRoom = activeCallRoom || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('room') : '');
    return (
      <div className="guest-screen-wrapper">
        <header className="guest-header">
          <div className="guest-header-inner">
            <div className="brand-group">
              <span className="brand-logo-badge">PCS</span>
              <h2 className="brand-title">Executive Meeting Room</h2>
            </div>
            <div className="guest-header-meta">
              <span className="guest-room-pill">
                Room: <strong>{currentRoom}</strong>
              </span>
              <button
                type="button"
                className={`guest-header-chat-btn ${isRoomChatOpen ? 'active' : ''}`}
                onClick={() => {
                  setIsRoomChatOpen(!isRoomChatOpen);
                  if (currentRoom) handleLoadRoomMessages(currentRoom);
                }}
                title="Toggle Work Chat, Links & Images"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>forum</span>
                <span>Chat ({chatMessages.length})</span>
              </button>
              <div className={`call-quality-pill ${callQuality}`}>
                <span className="quality-dot"></span>
                <span className="quality-text">
                  {callQuality === 'stable' && 'P2P Direct'}
                  {callQuality === 'relayed' && 'TURN Relay'}
                  {callQuality === 'connecting' && 'Connecting...'}
                  {callQuality === 'reconnecting' && 'Reconnecting...'}
                  {callQuality === 'failed' && 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="guest-stage">
          {guestKnockStatus !== 'admitted' ? (
            <div className="guest-lobby-container">
              <div className="guest-lobby-card">
                <div className="guest-lobby-status-banner">
                  {isHostOnlineInRoom ? (
                    <div className="meeting-live-badge is-on large">
                      <span className="live-pulse-dot"></span>
                      <span>MEETING IS ON — Host is in the Room</span>
                    </div>
                  ) : (
                    <div className="meeting-live-badge scheduled large">
                      <span className="scheduled-dot"></span>
                      <span>Waiting for Host to Start Meeting</span>
                    </div>
                  )}
                </div>

                {guestKnockStatus === 'idle' && (
                  <div className="guest-checkin-flow">
                    <div className="guest-checkin-header">
                      <span className="material-symbols-outlined guest-badge-icon">badge</span>
                      <div>
                        <h3>Direct Meeting Check-In</h3>
                        <p>Provide your credentials. The host will verify your name and Office ID before admitting you.</p>
                      </div>
                    </div>

                    <div className="guest-form-group">
                      <label htmlFor="guest-full-name">Full Name <span className="required">*</span></label>
                      <input
                        id="guest-full-name"
                        type="text"
                        placeholder="e.g. Sarah Connor"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="guest-form-group">
                      <label htmlFor="guest-office-id">Office ID / Employee ID <span className="required">*</span></label>
                      <input
                        id="guest-office-id"
                        type="text"
                        placeholder="e.g. PCS-ENG-402"
                        value={guestOfficeId}
                        onChange={(e) => setGuestOfficeId(e.target.value)}
                      />
                    </div>

                    <div className="guest-checkin-actions">
                      <button
                        type="button"
                        className="btn-knock-join"
                        onClick={() => handleGuestKnock(currentRoom)}
                      >
                        <span className="material-symbols-outlined">meeting_room</span>
                        <span>Knock & Join Directly</span>
                      </button>
                    </div>
                  </div>
                )}

                {guestKnockStatus === 'knocking' && (
                  <div className="guest-knocking-flow">
                    <div className="radar-spinner"></div>
                    <h3>Knock Request Sent to Host</h3>
                    <p>The meeting host is verifying your Office ID and name.</p>

                    <div className="guest-credential-summary">
                      <div className="summary-field">
                        <span className="summary-label">Name:</span>
                        <strong className="summary-val">{guestName}</strong>
                      </div>
                      <div className="summary-field">
                        <span className="summary-label">Office ID:</span>
                        <strong className="summary-val monospace">{guestOfficeId}</strong>
                      </div>
                      <div className="summary-field">
                        <span className="summary-label">Room:</span>
                        <strong className="summary-val monospace">{currentRoom}</strong>
                      </div>
                    </div>

                    <div className="knocking-status-note">
                      {isHostOnlineInRoom ? (
                        <span>Host is currently in the room and reviewing join requests.</span>
                      ) : (
                        <span>Host has not joined yet. You will be prompted as soon as they enter.</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn-cancel-knock"
                      onClick={handleCancelKnock}
                    >
                      <span className="material-symbols-outlined">close</span>
                      <span>Cancel Join Request</span>
                    </button>
                  </div>
                )}

                {guestKnockStatus === 'denied' && (
                  <div className="guest-denied-flow">
                    <span className="material-symbols-outlined denied-icon">gpp_bad</span>
                    <h3>Admission Declined</h3>
                    <p>{guestDeniedReason || 'The host declined entry for this meeting session.'}</p>
                    <button
                      type="button"
                      className="btn-retry-knock"
                      onClick={() => setGuestKnockStatus('idle')}
                    >
                      <span className="material-symbols-outlined">replay</span>
                      <span>Try Again with Different Details</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : activeCallRoom ? (
            <div className="guest-video-grid">
              {/* Remote Video Container */}
              <div className="guest-video-box remote">
                <video ref={remoteVideoRef} autoPlay playsInline className="guest-video-element" />
                {!isCallConnected && (
                  <div className="guest-waiting-hud">
                    <span className="material-symbols-outlined waiting-icon">video_camera_front</span>
                    <h3>{callStatusText || 'Waiting for host to connect...'}</h3>
                    <p>Share this link with attendees or wait for the host to enter.</p>
                    <button type="button" className="btn-copy-invite" onClick={handleCopyGuestLink}>
                      <span className="material-symbols-outlined">content_copy</span>
                      <span>Copy Meeting Link</span>
                    </button>
                  </div>
                )}
                <div className="video-participant-badge">
                  Host / Peer {isCallConnected ? '(Live)' : ''}
                </div>
              </div>

              {/* Local Video Container */}
              <div className="guest-video-box local">
                {isVideoOff ? (
                  <div className="guest-camera-off-slate">
                    <span className="material-symbols-outlined">videocam_off</span>
                    <span>Camera Off</span>
                  </div>
                ) : (
                  <video ref={localVideoRef} autoPlay playsInline muted className="guest-video-element local-mirror" />
                )}
                <div className="video-participant-badge">
                  You {isAudioMuted ? '(Muted)' : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="guest-rejoin-card">
              <h2>You have left the meeting</h2>
              <p>You can rejoin this room or switch to the main workspace.</p>
              <div className="guest-rejoin-actions">
                <button
                  type="button"
                  className="btn-green"
                  style={{ height: '38px', padding: '0 18px', fontSize: '13px' }}
                  onClick={() => {
                    const r = new URLSearchParams(window.location.search).get('room');
                    if (r) handleJoinCallRoom(r, false);
                  }}
                >
                  <span className="material-symbols-outlined">videocam</span>
                  <span>Rejoin Meeting</span>
                </button>
                <button
                  type="button"
                  className="btn-blue"
                  style={{ height: '38px', padding: '0 18px', fontSize: '13px' }}
                  onClick={() => setIsGuestMode(false)}
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  <span>Open Workspace Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {activeCallRoom && guestKnockStatus === 'admitted' && (
          <footer className="guest-controls-bar">
            <button
              type="button"
              className={`guest-ctl-btn ${isAudioMuted ? 'active-mute' : ''}`}
              onClick={handleToggleAudio}
              title={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              <span className="material-symbols-outlined">{isAudioMuted ? 'mic_off' : 'mic'}</span>
              <span>{isAudioMuted ? 'Unmute' : 'Mute'}</span>
            </button>
            <button
              type="button"
              className={`guest-ctl-btn ${isVideoOff ? 'active-mute' : ''}`}
              onClick={handleToggleVideo}
              title={isVideoOff ? 'Start Video' : 'Stop Video'}
            >
              <span className="material-symbols-outlined">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
              <span>{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
            </button>
            <button
              type="button"
              className={`guest-ctl-btn ${isScreenSharing ? 'active-share' : ''}`}
              onClick={handleToggleScreenShare}
              title={isScreenSharing ? 'Stop Share' : 'Share Screen'}
            >
              <span className="material-symbols-outlined">{isScreenSharing ? 'stop_screen_share' : 'screen_share'}</span>
              <span>{isScreenSharing ? 'Stop Share' : 'Share'}</span>
            </button>
            <button
              type="button"
              className={`guest-ctl-btn ${isRoomChatOpen ? 'active-chat' : ''}`}
              onClick={() => {
                setIsRoomChatOpen(!isRoomChatOpen);
                if (currentRoom) handleLoadRoomMessages(currentRoom);
              }}
              title="Toggle Room Chat, Links & Images"
            >
              <span className="material-symbols-outlined">{isRoomChatOpen ? 'speaker_notes_off' : 'forum'}</span>
              <span>Chat ({chatMessages.length})</span>
            </button>
            <button
              type="button"
              className="guest-ctl-btn"
              onClick={handleCopyGuestLink}
              title="Copy Meeting Link"
            >
              <span className="material-symbols-outlined">link</span>
              <span>Copy Link</span>
            </button>
            <button
              type="button"
              className="guest-ctl-btn end-call-btn"
              onClick={handleEndCall}
              title="Leave Call"
            >
              <span className="material-symbols-outlined">call_end</span>
              <span>Leave</span>
            </button>
          </footer>
        )}

        {/* Floating Host Admission Dialog for Knocking Guests (if host is in guest view) */}
        {pendingKnocks.length > 0 && (
          <div className="host-knock-modal-overlay">
            <div className="host-knock-card">
              <div className="host-knock-header">
                <span className="material-symbols-outlined knock-bell-icon">badge</span>
                <div>
                  <h3>Guest Requesting Admission ({pendingKnocks.length})</h3>
                  <p>Verify Office ID and Full Name before admitting</p>
                </div>
              </div>
              <div className="host-knock-body">
                {pendingKnocks.map((k) => (
                  <div key={k.id} className="knock-item-row">
                    <div className="knock-guest-info">
                      <div className="knock-guest-name-row">
                        <span className="knock-guest-name">{k.name}</span>
                        <span className="knock-office-badge">ID: {k.officeId}</span>
                      </div>
                      <span className="knock-room-tag">Room: {k.roomId}</span>
                    </div>
                    <div className="knock-actions">
                      <button
                        type="button"
                        className="btn-admit-guest"
                        onClick={() => handleAdmitGuest(k.id, k.roomId)}
                        title="Admit guest into meeting"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>how_to_reg</span>
                        <span>Admit</span>
                      </button>
                      <button
                        type="button"
                        className="btn-deny-guest"
                        onClick={() => handleDenyGuest(k.id, k.roomId)}
                        title="Decline guest admission"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>block</span>
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating Room Chat in Guest View */}
        {isRoomChatOpen && currentRoom && (
          <div className="room-chat-floating-dock guest-chat-dock">
            <div className="room-chat-header">
              <div className="room-chat-title-group">
                <span className="live-chat-dot"></span>
                <span className="room-chat-name">Room: <strong>{currentRoom}</strong></span>
                <span className="room-chat-count">{chatMessages.length} msgs</span>
              </div>
              <div className="room-chat-header-actions">
                <button
                  type="button"
                  className="chat-hdr-btn"
                  onClick={() => handleCopyRoomShareLink(currentRoom)}
                  title="Copy Room Link"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>link</span>
                  <span>Copy Link</span>
                </button>
                <button
                  type="button"
                  className="chat-hdr-btn close-chat-btn"
                  onClick={() => setIsRoomChatOpen(false)}
                  title="Close Chat"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              </div>
            </div>

            <div className="room-chat-messages-scroll">
              {chatMessages.length === 0 ? (
                <div className="chat-empty-slate">
                  <span className="material-symbols-outlined chat-empty-icon">forum</span>
                  <p>Welcome to <strong>{currentRoom}</strong></p>
                  <span>Start the conversation. Share notes, links, or drop images from your device.</span>
                  <button
                    type="button"
                    className="btn-copy-room-first"
                    onClick={() => handleCopyRoomShareLink(currentRoom)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span>
                    <span>Copy Room Code</span>
                  </button>
                </div>
              ) : (
                chatMessages.map((m) => {
                  const isSelf = m.sender_name === (guestName.trim() || 'Colleague');
                  const timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={m.id || Math.random()} className={`chat-bubble-row ${isSelf ? 'self' : 'peer'}`}>
                      <div className="chat-bubble">
                        <div className="chat-bubble-meta">
                          <span className="chat-sender-name">{m.sender_name}</span>
                          <span className="chat-timestamp">{timeStr}</span>
                        </div>
                        <div className="chat-bubble-content">
                          {renderMessageContent(m)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            <div className="room-chat-composer">
              {chatAttachment && (
                <div className="chat-attachment-preview">
                  <img src={chatAttachment.url} alt="Attachment Preview" className="preview-thumb" />
                  <span className="preview-filename">{chatAttachment.name}</span>
                  <button
                    type="button"
                    className="btn-remove-attachment"
                    onClick={() => setChatAttachment(null)}
                    title="Remove attachment"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </div>
              )}

              <div className="chat-composer-input-row">
                <input
                  type="file"
                  ref={chatFileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  className="btn-attach-image"
                  onClick={() => chatFileInputRef.current?.click()}
                  title="Attach photo or image"
                >
                  <span className="material-symbols-outlined">image</span>
                </button>
                <textarea
                  className="chat-text-input"
                  placeholder="Type message, paste image, or drop work link..."
                  rows="1"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  onPaste={handlePasteEvent}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-chat-send"
                  onClick={handleSendChatMessage}
                  disabled={!chatInputText.trim() && !chatAttachment}
                  title="Send Message"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox Fullscreen Viewer for Guest View */}
        {activeImageLightbox && (
          <div className="image-lightbox-overlay" onClick={() => setActiveImageLightbox(null)}>
            <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <div className="lightbox-header">
                <span>Shared Work Image</span>
                <div className="lightbox-actions">
                  <a
                    href={activeImageLightbox}
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
                    onClick={() => setActiveImageLightbox(null)}
                    title="Close Viewer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              <div className="lightbox-img-frame">
                <img src={activeImageLightbox} alt="Full resolution shared work asset" />
              </div>
            </div>
          </div>
        )}

        {toastMessage && (
          <div className="toast-notice">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
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
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div className="calendar-card">
                {/* Executive Calendar Top Bar */}
                <div className="calendar-top">
                  <div className="cal-header-left">
                    <h2>{monthNames[calMonth]} {calYear}</h2>
                    <div className="cal-load-chip">
                      <span>{monthTasksCount} Tasks</span>
                      <span className="chip-dot">•</span>
                      <span>{monthMeetingsCount} Meetings</span>
                    </div>
                  </div>

                  <div className="cal-header-actions">
                    <div className="cal-nav-group">
                      <button type="button" className="cal-nav-btn" onClick={handlePrevPeriod} title="Previous Period">
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <button
                        type="button"
                        className="cal-nav-btn"
                        onClick={() => {
                          setCurrentCalendarDate(new Date());
                          setSelectedDate(todayStr);
                        }}
                      >
                        Today
                      </button>
                      <button type="button" className="cal-nav-btn" onClick={handleNextPeriod} title="Next Period">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>

                    {/* Sub-View Switcher: Month vs. Week */}
                    <div className="cal-view-segmented">
                      <button
                        type="button"
                        className={`cal-view-btn ${calSubView === 'month' ? 'active' : ''}`}
                        onClick={() => setCalSubView('month')}
                      >
                        Month
                      </button>
                      <button
                        type="button"
                        className={`cal-view-btn ${calSubView === 'week' ? 'active' : ''}`}
                        onClick={() => setCalSubView('week')}
                      >
                        Week
                      </button>
                    </div>
                  </div>
                </div>

                {/* Month Grid View */}
                {calSubView === 'month' && (
                  <>
                    <div className="calendar-weekdays-grid">
                      <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>

                    <div className="calendar-matrix">
                      {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="cal-matrix-day empty"></div>
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const formattedDay = String(dayNum).padStart(2, '0');
                        const formattedMonth = String(calMonth + 1).padStart(2, '0');
                        const dateStr = `${calYear}-${formattedMonth}-${formattedDay}`;
                        const dayItems = (itemsByDate[dateStr] || []).sort(
                          (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
                        );
                        const isSelected = selectedDate === dateStr;
                        const isToday = todayStr === dateStr;
                        const hasTask = dayItems.some((it) => !isMeeting(it));
                        const hasMeeting = dayItems.some(isMeeting);
                        const hasUrgent = dayItems.some((it) => it.priority === 'High');

                        return (
                          <div
                            key={dateStr}
                            className={`cal-matrix-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                            onClick={() => setSelectedDate(dateStr)}
                          >
                            <div className="cal-day-header">
                              <div className="cal-day-header-left">
                                <span className="day-header-number">{dayNum}</span>
                                {/* Density Meter Dots */}
                                <div className="cal-density-dots">
                                  {hasTask && <span className="density-dot task"></span>}
                                  {hasMeeting && <span className="density-dot meeting"></span>}
                                  {hasUrgent && <span className="density-dot urgent"></span>}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="cal-day-add-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDate(dateStr);
                                  handleOpenCreateTask(dateStr);
                                }}
                                title={`Add task on ${dateStr}`}
                              >
                                +
                              </button>
                            </div>

                            <div className="cal-day-badges-stack">
                              {dayItems.slice(0, 2).map((it) => {
                                const itMeeting = isMeeting(it);
                                const isUrgent = it.priority === 'High';
                                return (
                                  <span
                                    key={it.id}
                                    className={`cal-badge ${isUrgent ? 'urgent' : itMeeting ? 'meeting' : 'task'}`}
                                    title={`${it.time} - ${it.title}`}
                                  >
                                    {itMeeting ? '[M] ' : ''}{it.title}
                                  </span>
                                );
                              })}
                              {dayItems.length > 2 && (
                                <span className="cal-badge-more">
                                  +{dayItems.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* 7-Day Executive Week Sprint Board */}
                {calSubView === 'week' && (
                  <div className="cal-week-board">
                    {activeWeekDates.map((dateStr) => {
                      const dObj = new Date(dateStr + 'T00:00:00');
                      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dObj.getDay()];
                      const dayNum = dObj.getDate();
                      const isSelected = selectedDate === dateStr;
                      const isToday = todayStr === dateStr;
                      const dayItems = (itemsByDate[dateStr] || []).sort(
                        (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
                      );

                      return (
                        <div
                          key={dateStr}
                          className={`cal-week-column ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                          onClick={() => setSelectedDate(dateStr)}
                        >
                          <div className="cal-week-col-header">
                            <span className="cal-week-day-name">{dayName}</span>
                            <span className="cal-week-day-num">{dayNum}</span>
                            <span className="cal-week-count">{dayItems.length}</span>
                          </div>

                          <div className="cal-week-col-items">
                            {dayItems.length === 0 ? (
                              <div className="cal-week-empty">No items</div>
                            ) : (
                              dayItems.map((it) => (
                                <div
                                  key={it.id}
                                  className={`cal-week-item-card ${isMeeting(it) ? 'meeting-card' : 'task-card'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(it);
                                  }}
                                  title="Click to view/edit details"
                                >
                                  <span className="cal-week-item-time">{it.time}</span>
                                  <strong className="cal-week-item-title">{it.title}</strong>
                                </div>
                              ))
                            )}
                          </div>

                          <button
                            type="button"
                            className="cal-week-add-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(dateStr);
                              handleOpenCreateTask(dateStr);
                            }}
                            title={`Add item on ${dayName}, ${dateStr}`}
                          >
                            + Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Executive Calendar Footer Strip */}
                <div className="calendar-footer-strip">
                  <div className="cal-legend-group">
                    <span className="cal-legend-item"><span className="legend-dot task"></span> Task</span>
                    <span className="cal-legend-item"><span className="legend-dot meeting"></span> Meeting</span>
                    <span className="cal-legend-item"><span className="legend-dot urgent"></span> High Priority</span>
                    <span className="cal-legend-item"><span className="legend-box today"></span> Today</span>
                  </div>

                  <div className="cal-progress-group">
                    <span className="cal-progress-text">
                      {monthCompletionPercent}% completed ({monthCompletedCount}/{monthItems.length})
                    </span>
                    <div className="cal-progress-bar">
                      <div className="cal-progress-fill" style={{ width: `${monthCompletionPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="master-table-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>All Tasks &amp; Meetings Table</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-blue" onClick={() => handleOpenCreateTask(selectedDate)}>
                      + Add Task
                    </button>
                    <button className="btn-green" onClick={() => handleOpenCreateMeeting(selectedDate)}>
                      + Schedule Meeting
                    </button>
                  </div>
                </div>

                <table className="master-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Date &amp; Time</th>
                      <th>Attendees / Link</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '32px', fontWeight: '600' }}>
                          No scheduled items found.
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedItems.map((it) => {
                        const itMeeting = isMeeting(it);
                        return (
                          <tr key={it.id}>
                            <td style={{ fontWeight: '700' }}>{it.title}</td>
                            <td>
                              <span className={`type-chip ${itMeeting ? 'meeting' : 'task'}`}>
                                {itMeeting ? 'Meeting' : 'Task'}
                              </span>
                            </td>
                            <td>
                              <span className={`priority-chip ${(it.priority || 'medium').toLowerCase()}`}>
                                {it.priority || 'Medium'}
                              </span>
                            </td>
                            <td>
                              <strong>{it.date}</strong>
                              <div><small>{it.time}</small></div>
                            </td>
                            <td>
                              {it.link ? (
                                <a href={it.link.startsWith('http') ? it.link : `https://${it.link}`} target="_blank" rel="noreferrer" className="item-link-btn">
                                  Join Link
                                </a>
                              ) : it.attendees ? (
                                <small>{it.attendees}</small>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <span style={{ fontWeight: '700', color: it.status === 'Completed' ? 'var(--color-green)' : 'var(--color-black)' }}>
                                {it.status === 'Completed' ? 'Completed' : 'Pending'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="table-actions-cell">
                                <button className="item-btn green compact" onClick={() => handleToggleStatus(it)}>
                                  {it.status === 'Completed' ? 'Undo' : 'Done'}
                                </button>
                                {!itMeeting ? (
                                  <button className="item-btn primary compact" onClick={() => handleMoveToTomorrow(it)}>
                                    → Tomorrow
                                  </button>
                                ) : (
                                  <button className="item-btn white compact" onClick={() => handleAddToGoogleCalendar(it)} title="Add to Google Calendar">
                                    + GCal
                                  </button>
                                )}
                                <button className="item-btn white compact" onClick={() => handleOpenEdit(it)}>
                                  Edit
                                </button>
                                <button className="item-btn danger compact" onClick={() => handleDelete(it.id)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="cards-view-grid">
                {filteredAndSortedItems.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', border: '1.5px solid var(--border-black)', borderRadius: '8px' }}>
                    No items found matching the selected filters.
                  </div>
                ) : (
                  filteredAndSortedItems.map((it) => {
                    const itMeeting = isMeeting(it);
                    return (
                      <div key={it.id} className={`schedule-item ${itMeeting ? 'meeting-border' : 'task-border'}`}>
                        <div className="item-tags-row">
                          <span className={`type-chip ${itMeeting ? 'meeting' : 'task'}`}>
                            {itMeeting ? 'Meeting' : 'Task'}
                          </span>
                          <span className={`priority-chip ${(it.priority || 'medium').toLowerCase()}`}>
                            {it.priority || 'Medium'} Priority
                          </span>
                        </div>

                        <h3 className="item-title">{it.title}</h3>
                        {it.notes && <p className="item-desc">{it.notes}</p>}

                        {it.attendees && (
                          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                            <strong>Attendees:</strong> {it.attendees}
                          </div>
                        )}

                        <div className="item-footer">
                          <div className="item-footer-meta">
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
                            <span>{it.date} at {it.time}</span>
                          </div>
                          <div className="item-footer-actions">
                            <div className="actions-primary">
                              <button className="item-btn green" onClick={() => handleToggleStatus(it)}>
                                {it.status === 'Completed' ? 'Undo' : 'Done'}
                              </button>
                              {itMeeting && it.link && (
                                <a
                                  href={it.link.startsWith('http') ? it.link : `https://${it.link}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="item-btn green join-link"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>videocam</span>
                                  <span>Join</span>
                                </a>
                              )}
                              {!itMeeting && (
                                <button className="item-btn primary" onClick={() => handleMoveToTomorrow(it)}>
                                  → Tomorrow
                                </button>
                              )}
                            </div>
                            <div className="actions-utility">
                              {itMeeting && (
                                <>
                                  <button className="item-btn white compact" onClick={() => handleAddToGoogleCalendar(it)} title="Add to Google Calendar">
                                    + GCal
                                  </button>
                                  <button className="item-btn white compact" onClick={() => handleCopyMeetingInvite(it)} title="Copy Invite">
                                    Copy
                                  </button>
                                  {it.notes && (
                                    <button
                                      className="item-btn white compact"
                                      onClick={() => handleConvertNotesToTasks(it)}
                                      title="Extract notes into tasks for tomorrow"
                                    >
                                      Notes → Tasks
                                    </button>
                                  )}
                                </>
                              )}
                              <button className="item-btn white compact" onClick={() => handleOpenEdit(it)}>
                                Edit
                              </button>
                              <button className="item-btn danger compact" onClick={() => handleDelete(it.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Analytics View */}
            {viewMode === 'analytics' && (
              <div className="analytics-card">
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px' }}>Productivity &amp; Meeting Analytics</h2>
                <p style={{ fontSize: '13px', margin: 0, fontWeight: '600' }}>
                  Performance breakdown for scheduled tasks and executive meetings.
                </p>

                <div className="analytics-grid">
                  <div className="analytics-metric-box">
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Task Completion Rate</span>
                    <div className="analytics-val" style={{ color: 'var(--color-blue)' }}>{completionRate}%</div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${completionRate}%`, background: 'var(--color-blue)' }}></div>
                    </div>
                  </div>

                  <div className="analytics-metric-box">
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Scheduled Meetings</span>
                    <div className="analytics-val" style={{ color: 'var(--color-green)' }}>{meetingCount} sessions</div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${totalCount > 0 ? (meetingCount / totalCount) * 100 : 0}%`, background: 'var(--color-green)' }}
                      ></div>
                    </div>
                  </div>

                  <div className="analytics-metric-box">
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>High Priority Items</span>
                    <div className="analytics-val" style={{ color: 'var(--color-red)' }}>{highPriorityCount} urgent</div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${totalCount > 0 ? (highPriorityCount / totalCount) * 100 : 0}%`, background: 'var(--color-red)' }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* 90-Day Activity Heatmap Card */}
                <div className="heatmap-section">
                  <div className="heatmap-header">
                    <div>
                      <h3 className="heatmap-title">90-Day Consistency Heatmap</h3>
                      <p className="heatmap-subtitle">Completed tasks and scheduled meetings over the last 3 months</p>
                    </div>
                    <div className="heatmap-stats">
                      <div className="heatmap-stat-chip">
                        <span className="stat-label">Current Streak</span>
                        <span className="stat-val">{activeStreak} Days</span>
                      </div>
                      <div className="heatmap-stat-chip">
                        <span className="stat-label">90-Day Output</span>
                        <span className="stat-val">{heatmapTotalActions} Actions</span>
                      </div>
                    </div>
                  </div>

                  <div className="heatmap-grid">
                    {heatmapDays.map((d) => {
                      let levelClass = 'level-0';
                      if (d.score === 1) levelClass = 'level-1';
                      else if (d.score === 2) levelClass = 'level-2';
                      else if (d.score === 3) levelClass = 'level-3';
                      else if (d.score >= 4) levelClass = 'level-4';

                      return (
                        <div
                          key={d.date}
                          className={`heatmap-cell ${levelClass} ${selectedDate === d.date ? 'selected' : ''}`}
                          title={`${d.date}: ${d.completedCount} completed, ${d.meetingsCount} meetings`}
                          onClick={() => {
                            setSelectedDate(d.date);
                            showToast(`Selected date: ${d.date}`);
                          }}
                        ></div>
                      );
                    })}
                  </div>

                  <div className="heatmap-footer">
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>
                      Click any cell to inspect schedule for that day
                    </span>
                    <div className="heatmap-legend">
                      <span>Less</span>
                      <div className="legend-cell level-0"></div>
                      <div className="legend-cell level-1"></div>
                      <div className="legend-cell level-2"></div>
                      <div className="legend-cell level-3"></div>
                      <div className="legend-cell level-4"></div>
                      <span>More</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Day Schedule Sidebar) */}
          <div>
            <div className="schedule-card">
              <div className="schedule-card-header">
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Schedule for:</span>
                  <h3 className="schedule-date-title">{selectedDate}</h3>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="cal-nav-btn" onClick={() => handleOpenCreateTask(selectedDate)} title="Add Task">
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-blue)' }}>add</span>
                  </button>
                  <button className="cal-nav-btn" onClick={() => handleOpenCreateMeeting(selectedDate)} title="Schedule Meeting">
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>event</span>
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
                {dayScheduleItems.length} item(s) scheduled
              </div>

              {dayScheduleItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '8px' }}>
                    event_busy
                  </span>
                  <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: '700' }}>Nothing scheduled for this date.</p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="btn-blue" onClick={() => handleOpenCreateTask(selectedDate)}>
                      + Task
                    </button>
                    <button className="btn-green" onClick={() => handleOpenCreateMeeting(selectedDate)}>
                      + Meeting
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {dayScheduleItems.map((it) => {
                    const itMeeting = isMeeting(it);
                    return (
                      <div key={it.id} className={`schedule-item ${itMeeting ? 'meeting-border' : 'task-border'}`}>
                        <div className="item-tags-row">
                          <span className={`type-chip ${itMeeting ? 'meeting' : 'task'}`}>
                            {itMeeting ? 'Meeting' : 'Task'}
                          </span>
                          <span className={`priority-chip ${(it.priority || 'medium').toLowerCase()}`}>
                            {it.priority || 'Medium'} Priority
                          </span>
                        </div>

                        <h4 className="item-title">{it.title}</h4>
                        {it.notes && <p className="item-desc">{it.notes}</p>}

                        {it.attendees && (
                          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
                            {it.attendees}
                          </div>
                        )}

                        <div className="item-footer">
                          <div className="item-footer-meta">
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
                            <span>{it.time}</span>
                          </div>
                          <div className="item-footer-actions">
                            <div className="actions-primary">
                              <button className="item-btn green" onClick={() => handleToggleStatus(it)}>
                                {it.status === 'Completed' ? 'Undo' : 'Done'}
                              </button>
                              {itMeeting && it.link && (
                                <a
                                  href={it.link.startsWith('http') ? it.link : `https://${it.link}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="item-btn green join-link"
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>videocam</span>
                                  <span>Join</span>
                                </a>
                              )}
                              {!itMeeting && (
                                <button className="item-btn primary" onClick={() => handleMoveToTomorrow(it)}>
                                  → Tomorrow
                                </button>
                              )}
                            </div>
                            <div className="actions-utility">
                              {itMeeting && (
                                <>
                                  <button className="item-btn white compact" onClick={() => handleAddToGoogleCalendar(it)} title="Add to Google Calendar">
                                    + GCal
                                  </button>
                                  <button className="item-btn white compact" onClick={() => handleCopyMeetingInvite(it)} title="Copy Invite">
                                    Copy
                                  </button>
                                  {it.notes && (
                                    <button
                                      className="item-btn white compact"
                                      onClick={() => handleConvertNotesToTasks(it)}
                                      title="Extract notes into tasks for tomorrow"
                                    >
                                      Notes → Tasks
                                    </button>
                                  )}
                                </>
                              )}
                              <button className="item-btn white compact" onClick={() => handleOpenEdit(it)}>
                                Edit
                              </button>
                              <button className="item-btn danger compact" onClick={() => handleDelete(it.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Slide-out Side Drawer (Coming from right) */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={handleCloseDrawer}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>
                {editingId
                  ? drawerType === 'meeting' ? 'Edit Meeting Details' : 'Edit Task Details'
                  : drawerType === 'meeting' ? 'Schedule Meeting' : 'Add New Task'}
              </h3>
              <button className="close-drawer-btn" onClick={handleCloseDrawer}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>{drawerType === 'meeting' ? 'Meeting Subject *' : 'Task Title *'}</label>
                <input
                  type="text"
                  required
                  placeholder={drawerType === 'meeting' ? 'e.g., Executive Strategy Alignment' : 'e.g., Complete Budget Analysis'}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>{drawerType === 'meeting' ? 'Time Slot *' : 'Due Time *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 10:00 AM, 02:00 PM - 03:30 PM"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="High">High Priority (Red)</option>
                    <option value="Medium">Medium Priority (Blue)</option>
                    <option value="Low">Low Priority (Black)</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {drawerType === 'meeting' && (
                <>
                  <div className="form-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Meeting Link (Google Meet / Zoom)</label>
                      <button
                        type="button"
                        className="btn-link-detect"
                        onClick={handleAutoDetectCallLink}
                        title="Grab meeting URL from active browser tab or clipboard"
                      >
                        Grab Active Tab / Link
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="https://meet.google.com/..."
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    />
                  </div>

                  <div className="form-field">
                    <label>Attendees</label>
                    <input
                      type="text"
                      placeholder="e.g. dev@company.com, client@partner.org"
                      value={formData.attendees}
                      onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    />
                    <div className="form-field-hint">
                      Enter email addresses separated by commas to send auto-notifications
                    </div>
                  </div>

                  <div className="form-field email-invite-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.sendEmailInvites !== false}
                        onChange={(e) => setFormData({ ...formData, sendEmailInvites: e.target.checked })}
                      />
                      <span>Send automated email invitations & .ics calendar invites</span>
                    </label>
                  </div>
                </>
              )}

              <div className="form-field">
                <label>{drawerType === 'meeting' ? 'Agenda & Notes' : 'Description / Notes'}</label>
                <textarea
                  rows="4"
                  placeholder="Add details, steps, or discussion agenda..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="drawer-footer">
                <button type="button" className="btn-cancel" onClick={handleCloseDrawer}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={drawerType === 'meeting' ? 'btn-green' : 'btn-blue'}
                >
                  {editingId
                    ? 'Save Changes'
                    : drawerType === 'meeting'
                    ? 'Schedule Meeting'
                    : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Command Palette Modal */}
      {isPaletteOpen && (
        <div className="palette-overlay" onClick={() => setIsPaletteOpen(false)}>
          <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
            <div className="palette-search-row">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                autoFocus
                className="palette-input"
                placeholder="Type a command or search items... (Esc to close)"
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
              />
              <span className="kbd-hint">Esc</span>
            </div>

            <div className="palette-results">
              {filteredCommands.length > 0 && (
                <div className="palette-section">
                  <div className="palette-section-title">COMMANDS</div>
                  {filteredCommands.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="palette-row"
                      onClick={cmd.action}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{cmd.icon}</span>
                        <span style={{ fontWeight: '700' }}>{cmd.title}</span>
                      </div>
                      <span className="palette-jump-hint">Execute</span>
                    </div>
                  ))}
                </div>
              )}

              {matchingPaletteItems.length > 0 && (
                <div className="palette-section">
                  <div className="palette-section-title">MATCHING ITEMS</div>
                  {matchingPaletteItems.map((it) => {
                    const itMeeting = isMeeting(it);
                    return (
                      <div
                        key={it.id}
                        className="palette-row"
                        onClick={() => {
                          setSelectedDate(it.date);
                          handleOpenEdit(it);
                          setIsPaletteOpen(false);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`type-chip ${itMeeting ? 'meeting' : 'task'}`}>
                            {itMeeting ? 'Meeting' : 'Task'}
                          </span>
                          <span style={{ fontWeight: '700' }}>{it.title}</span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                          {it.date} at {it.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredCommands.length === 0 && matchingPaletteItems.length === 0 && (
                <div className="palette-empty">No commands or items found matching &quot;{paletteQuery}&quot;</div>
              )}
            </div>

            <div className="palette-footer">
              <span>Use <strong>Ctrl+K</strong> anywhere to toggle</span>
              <span>PCS Meet Manager Command Center</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating WebRTC Video Call Dock Panel */}
      {activeCallRoom && (
        <div className={`call-dock-panel ${isCallMinimized ? 'minimized' : ''}`}>
          <div className="call-dock-header">
            <div className="call-dock-title">
              <span className="live-call-indicator"></span>
              <span className="room-label">Room: <strong>{activeCallRoom}</strong></span>
              <span className={`call-quality-pill ${callQuality}`} title={`WebRTC Status: ${callQuality}`}>
                <span className="quality-dot"></span>
                <span className="quality-text">
                  {callQuality === 'stable' && 'P2P Direct'}
                  {callQuality === 'relayed' && 'TURN Relay'}
                  {callQuality === 'reconnecting' && 'Reconnecting'}
                  {callQuality === 'connecting' && 'Connecting'}
                  {callQuality === 'failed' && 'Offline'}
                </span>
              </span>
            </div>
            <div className="call-dock-actions">
              <button
                type="button"
                className={`call-dock-btn ${isRoomChatOpen ? 'active-chat' : ''}`}
                onClick={() => setIsRoomChatOpen(!isRoomChatOpen)}
                title="Toggle Room Chat, Links & Images"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>forum</span>
                <span>Chat ({chatMessages.length})</span>
              </button>
              <button
                type="button"
                className="call-dock-btn"
                onClick={handleCopyGuestLink}
                title="Copy guest invite link"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>content_copy</span>
                <span>Copy Link</span>
              </button>
              <button
                type="button"
                className="call-dock-btn"
                onClick={() => setIsCallMinimized(!isCallMinimized)}
                title={isCallMinimized ? 'Maximize Call Window' : 'Minimize Call Window'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {isCallMinimized ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              <button
                type="button"
                className="call-dock-btn close-call-btn"
                onClick={handleEndCall}
                title="End Video Call"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            </div>
          </div>

          {!isCallMinimized && (
            <div className="call-dock-body">
              <div className="call-video-grid">
                {/* Remote Participant Video Card */}
                <div className="video-card remote-video-card">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="video-stream remote-stream"
                  />
                  {!isCallConnected && (
                    <div className="video-waiting-overlay">
                      <span className="material-symbols-outlined waiting-icon">hourglass_top</span>
                      <div className="waiting-title">Waiting for peer...</div>
                      <div className="waiting-subtitle">{callStatusText}</div>
                      <button
                        type="button"
                        className="btn-copy-invite"
                        onClick={handleCopyGuestLink}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>link</span>
                        <span>Copy Guest Link</span>
                      </button>
                    </div>
                  )}
                  <div className="video-participant-badge">Remote Guest</div>
                </div>

                {/* Local Self Video Card */}
                <div className="video-card local-video-card">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="video-stream local-stream"
                  />
                  {isVideoOff && (
                    <div className="video-off-overlay">
                      <span className="material-symbols-outlined">videocam_off</span>
                      <span>Camera Off</span>
                    </div>
                  )}
                  <div className="video-participant-badge">
                    You {isAudioMuted ? '(Muted)' : ''}
                  </div>
                </div>
              </div>

              {/* Call Controls Bar */}
              <div className="call-dock-controls">
                <button
                  type="button"
                  className={`call-ctl-btn ${isAudioMuted ? 'active-mute' : ''}`}
                  onClick={handleToggleAudio}
                  title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  <span className="material-symbols-outlined">
                    {isAudioMuted ? 'mic_off' : 'mic'}
                  </span>
                  <span>{isAudioMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                <button
                  type="button"
                  className={`call-ctl-btn ${isVideoOff ? 'active-mute' : ''}`}
                  onClick={handleToggleVideo}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  <span className="material-symbols-outlined">
                    {isVideoOff ? 'videocam_off' : 'videocam'}
                  </span>
                  <span>{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
                </button>
                <button
                  type="button"
                  className={`call-ctl-btn ${isScreenSharing ? 'active-share' : ''}`}
                  onClick={handleToggleScreenShare}
                  title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
                >
                  <span className="material-symbols-outlined">
                    {isScreenSharing ? 'stop_screen_share' : 'screen_share'}
                  </span>
                  <span>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
                </button>
                <button
                  type="button"
                  className="call-ctl-btn end-call-btn"
                  onClick={handleEndCall}
                  title="Leave Call"
                >
                  <span className="material-symbols-outlined">call_end</span>
                  <span>End</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
      {isRoomChatOpen && (
        <div className="room-chat-floating-dock">
          {(() => {
            const currentDockRoom = (activeCallRoom || activeChatRoom || 'general').trim().toLowerCase();
            return (
              <>
                <div className="room-chat-header">
                  <div className="room-chat-title-group">
                    <span className="live-chat-dot"></span>
                    <span className="room-chat-name">Room: <strong>#{currentDockRoom}</strong></span>
                    <span className="room-chat-count">{chatMessages.length} msgs</span>
                  </div>
                  <div className="room-chat-header-actions">
                    <button
                      type="button"
                      className="chat-hdr-btn"
                      onClick={() => handleCopyChatShareLink(currentDockRoom)}
                      title="Copy Shareable Chat Room Link"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>share</span>
                      <span>Share</span>
                    </button>
                    <button
                      type="button"
                      className="chat-hdr-btn highlight-video"
                      onClick={() => handleConnectGlobalChat(currentDockRoom)}
                      title="Open Dedicated Full-Screen Chat"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>open_in_full</span>
                      <span>Full View</span>
                    </button>
                    <button
                      type="button"
                      className="chat-hdr-btn close-chat-btn"
                      onClick={() => setIsRoomChatOpen(false)}
                      title="Close Chat"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                    </button>
                  </div>
                </div>

                <div className="room-chat-messages-scroll">
                  {chatMessages.length === 0 ? (
                    <div className="chat-empty-slate">
                      <span className="material-symbols-outlined chat-empty-icon">forum</span>
                      <p>Welcome to <strong>#{currentDockRoom}</strong></p>
                      <span>Anyone with this room code can join from any device. Start by sending a message, sharing a link, or dropping an image.</span>
                      <button
                        type="button"
                        className="btn-copy-room-first"
                        onClick={() => handleCopyChatShareLink(currentDockRoom)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span>
                        <span>Copy Room Link to Invite Team</span>
                      </button>
                    </div>
                  ) : (
                    chatMessages.map((m) => {
                      const isSelf =
                        m.sender_name === (guestName.trim() || 'Colleague') ||
                        m.sender_id === (sessionStorage.getItem('pcs_guest_office_id') || sessionStorage.getItem('pcs_user_id'));
                      const timeStr = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                      return (
                        <div key={m.id || Math.random()} className={`chat-bubble-row ${isSelf ? 'self' : 'peer'}`}>
                          <div className="chat-bubble">
                            <div className="chat-bubble-meta">
                              <span className="chat-sender-name">{m.sender_name}</span>
                              <span className="chat-timestamp">{timeStr}</span>
                            </div>
                            <div className="chat-bubble-content">
                              {renderMessageContent(m)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                <div className="room-chat-composer">
                  {chatAttachment && (
                    <div className="chat-attachment-preview">
                      <img src={chatAttachment.url} alt="Attachment Preview" className="preview-thumb" />
                      <span className="preview-filename">{chatAttachment.name}</span>
                      <button
                        type="button"
                        className="btn-remove-attachment"
                        onClick={() => setChatAttachment(null)}
                        title="Remove image attachment"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                      </button>
                    </div>
                  )}

                  <div className="chat-composer-input-row">
                    <input
                      type="file"
                      ref={chatFileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageSelect}
                    />
                    <button
                      type="button"
                      className="btn-attach-image"
                      onClick={() => chatFileInputRef.current?.click()}
                      title="Attach photo or image"
                    >
                      <span className="material-symbols-outlined">image</span>
                    </button>
                    <textarea
                      className="chat-text-input"
                      placeholder="Type a message, paste image, or drop work link..."
                      rows="1"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      onPaste={handlePasteEvent}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatMessage(currentDockRoom);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-chat-send"
                      onClick={() => handleSendChatMessage(currentDockRoom)}
                      disabled={!chatInputText.trim() && !chatAttachment}
                      title="Send Message"
                    >
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Create or Join Global Work Room Modal */}
      {isCreateRoomModalOpen && (
        <div className="create-room-modal-overlay">
          <div className="create-room-modal-card">
            <div className="create-room-modal-header">
              <div className="modal-title-with-icon">
                <span className="material-symbols-outlined modal-header-icon">forum</span>
                <div>
                  <h3>Global Online Collaboration Room</h3>
                  <p>Create or join a room from any device. Share links, images, and chat instantly.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setIsCreateRoomModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="create-room-modal-body">
              <div className="create-room-quick-section">
                <h4>Option 1: Quick Create New Room</h4>
                <p>Generates an instant secure collaboration room code that you can share.</p>
                <button
                  type="button"
                  className="btn-primary-create-room"
                  onClick={() => handleCreateNewRoom()}
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  <span>Create New Room</span>
                </button>
              </div>

              <div className="create-room-divider">
                <span>OR</span>
              </div>

              <div className="join-room-code-section">
                <h4>Option 2: Enter Room Code to Join</h4>
                <p>Have a code from a colleague? Enter it here to open the room on this device.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateNewRoom(newRoomInputCode);
                  }}
                  className="join-room-form"
                >
                  <div className="join-input-wrap">
                    <span className="material-symbols-outlined">key</span>
                    <input
                      type="text"
                      placeholder="e.g. marketing-sync, work-784..."
                      value={newRoomInputCode}
                      onChange={(e) => setNewRoomInputCode(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="btn-join-room-submit">
                    <span>Join Room</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </form>
              </div>

              <div className="create-room-divider">
                <span>OR</span>
              </div>

              <div className="quick-general-section">
                <button
                  type="button"
                  className="btn-quick-general-room"
                  onClick={() => handleCreateNewRoom('general')}
                >
                  <span className="material-symbols-outlined">tag</span>
                  <span>Open General Team Chat (#general)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Fullscreen Viewer */}
      {activeImageLightbox && (
        <div className="image-lightbox-overlay" onClick={() => setActiveImageLightbox(null)}>
          <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <span>Shared Work Image</span>
              <div className="lightbox-actions">
                <a
                  href={activeImageLightbox}
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
                  onClick={() => setActiveImageLightbox(null)}
                  title="Close Viewer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className="lightbox-img-frame">
              <img src={activeImageLightbox} alt="Full resolution shared work asset" />
            </div>
          </div>
        </div>
      )}

      {/* Floating Host Admission Dialog for Knocking Guests */}
      {pendingKnocks.length > 0 && (
        <div className="host-knock-modal-overlay">
          <div className="host-knock-card">
            <div className="host-knock-header">
              <span className="material-symbols-outlined knock-bell-icon">badge</span>
              <div>
                <h3>Guest Requesting Admission ({pendingKnocks.length})</h3>
                <p>Verify Office ID and Full Name before admitting</p>
              </div>
            </div>
            <div className="host-knock-body">
              {pendingKnocks.map((k) => (
                <div key={k.id} className="knock-item-row">
                  <div className="knock-guest-info">
                    <div className="knock-guest-name-row">
                      <span className="knock-guest-name">{k.name}</span>
                      <span className="knock-office-badge">ID: {k.officeId}</span>
                    </div>
                    <span className="knock-room-tag">Room: {k.roomId}</span>
                  </div>
                  <div className="knock-actions">
                    <button
                      type="button"
                      className="btn-admit-guest"
                      onClick={() => handleAdmitGuest(k.id, k.roomId)}
                      title="Admit guest into meeting"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>how_to_reg</span>
                      <span>Admit</span>
                    </button>
                    <button
                      type="button"
                      className="btn-deny-guest"
                      onClick={() => handleDenyGuest(k.id, k.roomId)}
                      title="Decline guest admission"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>block</span>
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="toast-notice">
          <span className="material-symbols-outlined" style={{ color: 'var(--color-green)' }}>check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
