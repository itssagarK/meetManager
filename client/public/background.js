// PCS Meet Manager - Background Service Worker (Manifest V3 - Version 2.0.0)

// Helper: Append a captured task/clip to chrome.storage.local
async function savePendingClip(clip) {
  try {
    const { pcs_pending_clips = [] } = await chrome.storage.local.get('pcs_pending_clips');
    pcs_pending_clips.push(clip);
    await chrome.storage.local.set({ pcs_pending_clips });

    // Update badge to signal captured item
    const count = pcs_pending_clips.length;
    await chrome.action.setBadgeText({ text: String(count) });
    await chrome.action.setBadgeBackgroundColor({ color: '#16a34a' }); // Emerald green

    // Rule 9: Always show user feedback after action
    await chrome.notifications.create(`clip-notify-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icon-128.png',
      title: 'Captured to PCS Meet Manager',
      message: `"${clip.title.substring(0, 80)}" added to your queue.`,
      priority: 1,
    });
  } catch (err) {
    console.error('Failed to save pending clip:', err);
  }
}

// 1. Lifecycle: Initialize side panel, context menus, and badges on installation
chrome.runtime.onInstalled.addListener(async () => {
  // A. Configure Side Panel behavior
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    try {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    } catch (err) {
      console.warn('Could not set sidePanel action behavior:', err);
    }
  }

  // B. Set initial badge styling
  try {
    await chrome.action.setBadgeBackgroundColor({ color: '#1d4ed8' });
  } catch (e) {}

  // C. Create Context Menu items
  if (chrome.contextMenus) {
    try {
      chrome.contextMenus.removeAll(() => {
        // Menu item 1: Right-click selected text on any webpage to make it a task
        chrome.contextMenus.create({
          id: 'pcs-clip-selection',
          title: "Add '%s' as task in PCS Meet Manager",
          contexts: ['selection'],
        });

        // Menu item 2: Right-click page background to clip the entire page
        chrome.contextMenus.create({
          id: 'pcs-clip-page',
          title: 'Clip active webpage to PCS Meet Manager',
          contexts: ['page'],
        });

        // Menu item 3: Right-click any link to open in meeting manager
        chrome.contextMenus.create({
          id: 'pcs-open-link',
          title: 'Open link in PCS Meet Manager',
          contexts: ['link'],
        });
      });
    } catch (err) {
      console.warn('Context menus setup error:', err);
    }
  }
});

// 2. Context Menu Click Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().substring(0, 5);

  if (info.menuItemId === 'pcs-clip-selection' && info.selectionText) {
    const rawText = info.selectionText.trim();
    const cleanTitle = rawText.length > 90 ? rawText.substring(0, 87) + '...' : rawText;

    await savePendingClip({
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: cleanTitle,
      date: todayStr,
      time: timeStr,
      link: tab?.url || '',
      notes: `Clipped from: ${tab?.title || 'Webpage'}\nSource URL: ${tab?.url || ''}\n\nSelected text:\n"${rawText}"`,
      priority: 'Medium',
      status: 'Pending',
      type: 'task',
      created_at: now.toISOString(),
    });
  } else if (info.menuItemId === 'pcs-clip-page') {
    const pageTitle = tab?.title || 'Webpage Reference';
    await savePendingClip({
      id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `Review: ${pageTitle.substring(0, 80)}`,
      date: todayStr,
      time: timeStr,
      link: tab?.url || '',
      notes: `Bookmarked webpage: ${pageTitle}\nSource URL: ${tab?.url || ''}`,
      priority: 'Medium',
      status: 'Pending',
      type: 'task',
      created_at: now.toISOString(),
    });
  } else if (info.menuItemId === 'pcs-open-link' && info.linkUrl) {
    const targetUrl = info.linkUrl;
    let roomMatch = targetUrl.match(/room=([a-zA-Z0-9_-]+)/);
    const roomCode = roomMatch ? roomMatch[1] : '';

    if (roomCode) {
      await chrome.storage.local.set({ pcs_open_room: roomCode });
    }

    // Open side panel
    if (chrome.sidePanel && chrome.sidePanel.open) {
      const currentWin = await chrome.windows.getCurrent();
      if (currentWin && currentWin.id) {
        await chrome.sidePanel.open({ windowId: currentWin.id });
      }
    }
  }
});

// 3. Omnibox Integration (Type "pcs <keyword>" in Chrome address bar)
if (chrome.omnibox) {
  chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    const clean = text.trim();
    suggest([
      {
        content: `call ${clean || 'standup'}`,
        description: `Join or start PCS Video Room: <match>${clean || 'standup'}</match>`,
      },
      {
        content: `task ${clean || 'Follow up with team'}`,
        description: `Quick-add Task: <match>${clean || 'Follow up with team'}</match>`,
      },
      {
        content: 'today',
        description: "Open PCS Side Panel to view today's agenda and meetings",
      },
    ]);
  });

  chrome.omnibox.onInputEntered.addListener(async (text) => {
    const clean = text.trim();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);

    if (clean.startsWith('task ')) {
      const taskTitle = clean.replace('task ', '').trim();
      await savePendingClip({
        id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: taskTitle || 'Quick Task from Omnibox',
        date: todayStr,
        time: timeStr,
        link: '',
        notes: 'Created directly via Chrome Omnibox (pcs keyword).',
        priority: 'Medium',
        status: 'Pending',
        type: 'task',
        created_at: now.toISOString(),
      });
    } else if (clean.startsWith('call ') || clean.startsWith('room ')) {
      const roomCode = clean.replace(/^(call|room)\s+/, '').trim() || 'standup';
      await chrome.storage.local.set({ pcs_open_room: roomCode });
    }

    // Open side panel
    if (chrome.sidePanel && chrome.sidePanel.open) {
      const currentWin = await chrome.windows.getCurrent();
      if (currentWin && currentWin.id) {
        await chrome.sidePanel.open({ windowId: currentWin.id });
      }
    }
  });
}

// 4. Keyboard Commands Listener (Alt+Shift+C: Clip active tab)
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'clip-active-tab') {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.url) {
        const now = new Date();
        const pageTitle = activeTab.title || 'Webpage Reference';
        await savePendingClip({
          id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: `Review: ${pageTitle.substring(0, 80)}`,
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().substring(0, 5),
          link: activeTab.url,
          notes: `Clipped via shortcut (Alt+Shift+C)\nTitle: ${pageTitle}\nURL: ${activeTab.url}`,
          priority: 'Medium',
          status: 'Pending',
          type: 'task',
          created_at: now.toISOString(),
        });
      }
    }
  });
}

// 5. Pre-Meeting Desktop Alarm Listener (triggers 2 minutes before scheduled calls)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('meet-alert:')) {
    const meetingTitle = alarm.name.replace('meet-alert:', '');

    // Flash urgent red badge
    try {
      await chrome.action.setBadgeText({ text: 'SOON' });
      await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' }); // Crimson red
    } catch (e) {}

    await chrome.notifications.create(`alarm-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icon-128.png',
      title: 'Upcoming Meeting - PCS Meet Manager',
      message: `"${meetingTitle}" starts in 2 minutes. Click to join call.`,
      priority: 2,
    });
  }
});

// 6. Open side panel when desktop notification is clicked
chrome.notifications.onClicked.addListener(async () => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    const win = await chrome.windows.getCurrent();
    if (win && win.id) {
      await chrome.sidePanel.open({ windowId: win.id });
    }
  }
});

// 7. Message Bridge with React Side Panel App
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE') {
    (async () => {
      try {
        const text = message.count > 0 ? String(message.count) : '';
        await chrome.action.setBadgeText({ text });
        if (message.isUrgent) {
          await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
        } else {
          await chrome.action.setBadgeBackgroundColor({ color: '#1d4ed8' });
        }
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (message.type === 'CAPTURE_ACTIVE_TAB') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        sendResponse({ success: true, tab });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});
