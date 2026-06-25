# Email Hunter v2

A Chrome extension that automatically extracts email addresses from web pages as you browse.

## Features

- Extracts emails from page text, mailto links, JSON-LD structured data, and data attributes
- Detects obfuscated addresses like `user [at] domain [dot] com`
- Works on single-page applications via DOM mutation detection
- Accumulates emails across pages in a browsing session
- Filters out common false positives (noreply, notifications, test addresses)
- Export collected emails as CSV, TXT, or copy to clipboard

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the `email-hunter-v2/` directory inside this repo

## Usage

- The extension runs automatically on every page you visit
- Click the Email Hunter icon in the Chrome toolbar to open the popup
- **This Page** tab — emails found on the current page
- **All Pages** tab — emails accumulated across all visited pages
- Use the **Copy** or **Export** buttons to save results as CSV or TXT
- Toggle **Accumulate emails across pages** in the popup footer to enable or disable persistent storage
- Click **Clear** to wipe all stored emails

## File Structure
email-hunter-v2/
├── manifest.json # Extension manifest (Manifest v3)
├── popup.html # Popup UI
├── popup.js # Popup logic (tabs, copy, export, storage)
├── content.js # Content script — email extraction on every page
├── sw.js # Service worker — cross-tab sync and badge updates
├── options.html # Settings page
├── options.js # Settings logic
├── css/
│ └── popup.css # Popup styles
└── img/ # Extension icons (16–256px)

## Permissions
| Permission | Purpose |
|---|---|
| `storage` | Persist collected emails across sessions |
| `scripting` | Inject content script into pages |
| `tabs` | Read current tab URL for per-page grouping |
| `<all_urls>` | Run on any page |
## Privacy
The extension operates entirely locally. No data is sent to any server; all collected emails stay in your browser's local storage.
## Requirements
- Chrome 88+ (Manifest v3)
- No build step required — load directly as an unpacked extension
