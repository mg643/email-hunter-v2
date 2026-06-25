// Service worker — handles cross-tab email accumulation and badge updates.

const STORAGE_KEY = 'storedEmails';

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.method === 'storeEmails') {
    storeEmails(msg.emails);
    return false;
  }
});

async function storeEmails(incoming) {
  if (!incoming || incoming.length === 0) return;

  const result = await chrome.storage.local.get(STORAGE_KEY);
  const existing = result[STORAGE_KEY] || [];
  const merged = [...new Set([...existing, ...incoming.map(e => e.toLowerCase().trim())])];

  await chrome.storage.local.set({ [STORAGE_KEY]: merged });

  // Update badge on the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  if (tab) {
    chrome.action.setBadgeText({ text: String(merged.length), tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
  }
}

// Clear badge when navigating to a new page
chrome.webNavigation?.onCommitted?.addListener(details => {
  if (details.frameId === 0) {
    chrome.action.setBadgeText({ text: '', tabId: details.tabId });
  }
});
