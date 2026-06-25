const STORAGE_EMAILS = 'storedEmails';
const STORAGE_DISABLE_COLLECT = 'disableCollectEmails';

const chkCollect = document.getElementById('chk-collect');
const btnClear = document.getElementById('btn-clear');
const status = document.getElementById('status');

function showStatus(msg, color = '#16a34a') {
  status.style.color = color;
  status.textContent = msg;
  setTimeout(() => { status.textContent = ''; }, 2500);
}

// Load current setting
chrome.storage.local.get(STORAGE_DISABLE_COLLECT, ({ [STORAGE_DISABLE_COLLECT]: disabled }) => {
  chkCollect.checked = !disabled;
});

chkCollect.addEventListener('change', () => {
  if (chkCollect.checked) {
    chrome.storage.local.remove(STORAGE_DISABLE_COLLECT);
  } else {
    chrome.storage.local.set({ [STORAGE_DISABLE_COLLECT]: true });
  }
  showStatus('Saved.');
});

btnClear.addEventListener('click', async () => {
  await chrome.storage.local.remove(STORAGE_EMAILS);
  showStatus('All stored emails cleared.');
});
