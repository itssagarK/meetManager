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
};

const priorityOrder = { High: 1, Medium: 2, Low: 3 };

function App() {
  const [items, setItems] = useState(() => {
    const cached = localStorage.getItem('mm_cached_items');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'tasks' | 'meetings'
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table' | 'cards' | 'analytics'
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

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const wsSignalingRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

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

  const fetchItems = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setItems(data);
      localStorage.setItem('mm_cached_items', JSON.stringify(data));
      setServerOnline(true);
    } catch (err) {
      console.warn('Backend unavailable, using local cache:', err);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

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
      localStorage.setItem('mm_cached_items', JSON.stringify(updated));
    } else {
      const newLocalItem = { ...payload, id: Date.now() };
      const updated = [...items, newLocalItem];
      setItems(updated);
      localStorage.setItem('mm_cached_items', JSON.stringify(updated));
    }

    handleCloseDrawer();
    showToast(editingId ? 'Changes saved' : drawerType === 'meeting' ? 'Meeting scheduled' : 'Task added');

    // 2. Sync with backend
    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PUT' : 'POST';

      let res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok && editingId && res.status === 404) {
        res = await fetch(API_URL, {
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
    localStorage.setItem('mm_cached_items', JSON.stringify(updated));
    showToast('Item deleted');

    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete sync deferred:', err);
    }
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    const updated = items.map((it) => (it.id === item.id ? { ...it, status: nextStatus } : it));
    setItems(updated);
    localStorage.setItem('mm_cached_items', JSON.stringify(updated));
    showToast(nextStatus === 'Completed' ? 'Marked complete' : 'Marked pending');

    try {
      await fetch(`${API_URL}/${item.id}`, {
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
    localStorage.setItem('mm_cached_items', JSON.stringify(updated));
    showToast(`Moved "${item.title}" to tomorrow (${tomorrowStr})`);

    try {
      await fetch(`${API_URL}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      });
    } catch (err) {
      console.warn('Backend move sync deferred:', err);
    }
  };

  const handleCopyMeetingInvite = (item) => {
    const inviteText = [
      `Meeting: ${item.title}`,
      `Date & Time: ${item.date} at ${item.time}`,
      item.attendees ? `Attendees: ${item.attendees}` : null,
      item.link ? `Join Link: ${item.link}` : null,
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

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

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

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsCallConnected(false);
        setCallStatusText('Peer disconnected. Waiting for reconnection...');
      } else if (pc.connectionState === 'connected') {
        setIsCallConnected(true);
        setCallStatusText('Connected with peer');
      }
    };

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
        ws.send(JSON.stringify({ type: 'join-room', roomId }));
        showToast(`Entered PCS Room: ${roomId}`);
      };

      ws.onmessage = async (msgEvent) => {
        try {
          const data = JSON.parse(msgEvent.data);

          if (data.type === 'peer-joined') {
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
    setIsAudioMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setIsCallMinimized(false);
    setCallStatusText('');

    if (window.location.search.includes('room=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    showToast('PCS Meet Call ended');
  };

  const handleCopyGuestLink = () => {
    if (!activeCallRoom) return;
    const origin = window.location.origin;
    const guestUrl = `${origin}?room=${activeCallRoom}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(guestUrl);
      showToast('Guest invite link copied to clipboard');
    } else {
      prompt('Copy guest call link:', guestUrl);
    }
  };

  // Sync local stream with local video element when room or minimized state changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [activeCallRoom, isCallMinimized]);

  // Auto-detect ?room= URL parameter for incoming guest joins
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && !activeCallRoom) {
      handleJoinCallRoom(roomParam, false);
    }
  }, []);

  // Cleanup WebRTC resources on unmount
  useEffect(() => {
    return () => {
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
    localStorage.setItem('mm_cached_items', JSON.stringify(updatedItems));
    showToast(`Moved ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} to today`);

    try {
      await Promise.all(
        overdueTasks.map((t) =>
          fetch(`${API_URL}/${t.id}`, {
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
    localStorage.setItem('mm_cached_items', JSON.stringify(updatedItems));
    showToast(`Created ${newTasks.length} task${newTasks.length > 1 ? 's' : ''} for tomorrow from notes`);

    // Background sync to SQLite
    try {
      await Promise.all(
        newTasks.map((t) =>
          fetch(API_URL, {
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

  return (
    <div>
      {/* Top Header - Clean, no nav links */}
      <header className="modern-header">
        <div className="header-inner">
          <h2 className="brand-title">PCS Meet Manager</h2>

          <div className="header-right">
            <div className="search-box">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                id="global-search-input"
                type="text"
                placeholder="Search tasks, meetings... [/]"
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
              className="btn-pcs-call"
              onClick={() => handleStartInstantCall()}
              title="Start Instant WebRTC Video Meeting"
            >
              <span className="material-symbols-outlined">videocam</span>
              <span>Instant Call</span>
            </button>
            <button className="btn-blue" onClick={() => handleOpenCreateTask(selectedDate)}>
              <span className="material-symbols-outlined">add</span>
              <span>+ New Task</span>
              <span className="kbd-hint">T</span>
            </button>
            <button className="btn-green" onClick={() => handleOpenCreateMeeting(selectedDate)}>
              <span className="material-symbols-outlined">event</span>
              <span>+ Schedule Meeting</span>
              <span className="kbd-hint">M</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="workspace-container">
        {/* Workspace Title & Live Status */}
        <div className="workspace-header">
          <div>
            <h1 className="workspace-title">Executive Workspace Overview</h1>
            <p className="workspace-subtitle">Manage tasks and schedule meetings with clear priorities</p>
          </div>
          <div className="workspace-header-badges">
            <button
              type="button"
              className="standup-btn-pill"
              onClick={handleCopyDailyStandup}
              title="Copy formatted daily standup update for Slack/Teams"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>content_paste</span>
              <span>Copy Standup</span>
            </button>
            <button
              type="button"
              className={`alert-toggle-pill ${notificationsEnabled ? 'active' : ''}`}
              onClick={handleRequestNotificationPermission}
              title={notificationsEnabled ? 'Desktop alerts enabled (2-min warning)' : 'Click to enable desktop meeting notifications'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                {notificationsEnabled ? 'notifications_active' : 'notifications_none'}
              </span>
              <span>{notificationsEnabled ? 'Alerts Active (2m)' : 'Enable Alerts'}</span>
            </button>
            <div className="live-sync-pill">
              <span className="pulse-dot"></span>
              <span>{serverOnline ? 'Backend Connected' : 'Local Offline Mode'}</span>
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
                <div className="calendar-top">
                  <h2>{monthNames[calMonth]} {calYear}</h2>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="cal-nav-btn" onClick={handlePrevMonth} title="Previous Month">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="cal-nav-btn" onClick={() => setCurrentCalendarDate(new Date())}>
                      Today
                    </button>
                    <button className="cal-nav-btn" onClick={handleNextMonth} title="Next Month">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>

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
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;

                    return (
                      <div
                        key={dateStr}
                        className={`cal-matrix-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                        onClick={() => setSelectedDate(dateStr)}
                      >
                        <div className="day-header-number">{dayNum}</div>
                        <div>
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
                            <span className="cal-badge" style={{ color: 'var(--color-black)', background: '#ffffff' }}>
                              +{dayItems.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                      placeholder="e.g., Sagar (Host), Priya Sharma, Dev Team"
                      value={formData.attendees}
                      onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    />
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
            </div>
            <div className="call-dock-actions">
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
