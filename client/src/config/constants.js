export const isChromeExtension = typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:';
export const DEFAULT_BACKEND_ORIGIN = isChromeExtension ? 'http://localhost:5000' : '';

export const getApiUrl = (endpoint) => {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${DEFAULT_BACKEND_ORIGIN}${cleanEndpoint}`;
};

export const getWsUrl = (path = '/ws') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (isChromeExtension) {
    return `ws://localhost:5000${cleanPath}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${cleanPath}`;
};

export const getPublicWebOrigin = () => {
  if (isChromeExtension) {
    return 'http://localhost:5000';
  }
  return window.location.origin;
};

export const API_URL = getApiUrl('/api/meetings');

export const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
  ],
};

export const initialFormData = {
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

export const priorityOrder = { High: 1, Medium: 2, Low: 3 };
