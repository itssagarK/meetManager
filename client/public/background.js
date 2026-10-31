// PCS Meet Manager - Background Service Worker (Manifest V3)

// 1. Open persistent Side Panel when user clicks the extension toolbar icon
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.warn('Could not set sidePanel action behavior:', err));
  }
});

// 2. Pre-Meeting Desktop Alarm Listener (triggers 2 minutes before scheduled calls)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('meet-alert:')) {
    const meetingTitle = alarm.name.replace('meet-alert:', '');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon-128.png',
      title: 'Upcoming Meeting - PCS Meet Manager',
      message: `"${meetingTitle}" starts in 2 minutes.`,
      priority: 2,
    });
  }
});

// 3. Open side panel or focus window when notification is clicked
chrome.notifications.onClicked.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    chrome.windows.getCurrent((win) => {
      chrome.sidePanel.open({ windowId: win.id }).catch(() => {});
    });
  }
});
