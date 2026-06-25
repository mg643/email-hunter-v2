(() => {
  'use strict';

  // ── Page domain ──────────────────────────────────────────────────────────────

  const pageDomain = (() => {
    const h = window.location.hostname;
    return h.startsWith('www.') ? h.slice(4) : h;
  })();

  function matchesDomain(email) {
    const d = email.slice(email.indexOf('@') + 1);
    return d === pageDomain || d.endsWith('.' + pageDomain);
  }

  // ── Filters ──────────────────────────────────────────────────────────────────

  const BLOCKED_PREFIXES = new Set([
    'the', 'aaa', 'ab', 'abc', 'acc', 'account', 'accounts', 'ad', 'adm',
    'and', 'available', 'com', 'domain', 'email', 'fb', 'for', 'get', 'here',
    'info', 'linkedin', 'mailbox', 'name', 'need', 'nfo', 'now', 'online',
    'post', 'test', 'username', 'your.name', 'sales2', 'www', 'xxx',
    'firstname.lastname', 'my_name', 'n', 's', 'o', 'b', 'c', 'g', 'h', 'y',
    '2', '3', '4', '123',
  ]);

  const BLOCKED_PATTERNS = [
    /^(no|not)[-_]*reply/i,
    /^mailer[-_]*daemon/i,
    /reply.+\d{5,}/i,
    /\d{13,}/i,
  ];

  const BLOCKED_SUBSTRINGS = [
    '@linkedin.com', '@sentry', '@linkedhelper.com',
    'feedback', 'notification', 'nondelivery',
  ];

  const BLOCKED_EXTENSIONS = ['.png', '.jpg', '.gif', '.css', '.webp', '.crx1', '.js'];

  const EMAIL_REGEX = /\b[a-z\d][_a-z\d+.-]*@[a-z\d][a-z\d-]*(?:\.[a-z\d-]+)*\.[a-z]{2,63}\b/gi;

  // Catches obfuscated patterns like: user [at] domain [dot] com
  const OBFUSCATED_REGEX =
    /\b([a-z\d][_a-z\d+.-]+)\s*[\[(]?\s*(?:at|@)\s*[\])]?\s*([a-z\d][a-z\d-]*(?:\.[a-z\d-]+)*)\s*[\[(]?\s*(?:dot|\.)\s*[\])]?\s*([a-z]{2,63})\b/gi;

  function cleanEmail(raw) {
    return raw
      .replace(/^(x3|x2|u003|u0022)/i, '')
      .replace(/^sx_mrsp_/i, '')
      .replace(/^3a/i, '');
  }

  function isValid(email) {
    const e = email.toLowerCase().trim();
    const local = e.slice(0, e.indexOf('@'));
    if (BLOCKED_PREFIXES.has(local)) return false;
    if (BLOCKED_PATTERNS.some(p => p.test(e))) return false;
    if (BLOCKED_SUBSTRINGS.some(s => e.includes(s))) return false;
    if (BLOCKED_EXTENSIONS.some(ext => e.endsWith(ext))) return false;
    return true;
  }

  // ── Extractors ────────────────────────────────────────────────────────────────

  function fromText(text) {
    const found = new Set();

    // Standard regex pass
    for (const raw of (text.match(EMAIL_REGEX) || [])) {
      const e = cleanEmail(raw.toLowerCase().trim());
      if (!isValid(e)) continue;
      if (!matchesDomain(e)) continue;
      found.add(e);
    }

    // Obfuscated pass
    OBFUSCATED_REGEX.lastIndex = 0;
    let m;
    while ((m = OBFUSCATED_REGEX.exec(text)) !== null) {
      const e = `${m[1]}@${m[2]}.${m[3]}`.toLowerCase();
      if (!isValid(e)) continue;
      if (!matchesDomain(e)) continue;
      found.add(e);
    }

    return [...found];
  }

  function fromMailtoLinks() {
    const found = [];
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      const email = a.getAttribute('href')
        .replace(/^mailto:/i, '')
        .split('?')[0]
        .trim()
        .toLowerCase();
      if (email && isValid(email) && matchesDomain(email)) found.push(email);
    });
    return found;
  }

  function fromJsonLd() {
    const found = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        for (const raw of (script.textContent.match(EMAIL_REGEX) || [])) {
          const e = raw.toLowerCase().trim();
          if (isValid(e) && matchesDomain(e)) found.push(e);
        }
      } catch (_) {}
    });
    return found;
  }

  function fromDataAttributes() {
    const found = [];
    document.querySelectorAll('[data-email]').forEach(el => {
      const e = el.getAttribute('data-email').toLowerCase().trim();
      if (e && isValid(e) && matchesDomain(e)) found.push(e);
    });
    return found;
  }

  function collectAll() {
    const found = new Set();
    fromText(document.documentElement.innerHTML).forEach(e => found.add(e));
    fromMailtoLinks().forEach(e => found.add(e));
    fromJsonLd().forEach(e => found.add(e));
    fromDataAttributes().forEach(e => found.add(e));
    return [...found];
  }

  // ── MutationObserver (SPA support) ───────────────────────────────────────────

  let mutationTimer = null;

  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      const emails = collectAll();
      if (emails.length > 0) {
        chrome.runtime.sendMessage({ method: 'storeEmails', emails }).catch(() => {});
      }
    }, 1500);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // ── Message handler ───────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
    if (msg.method === 'getEmails') {
      respond({ emails: collectAll() });
      return true;
    }

    if (msg.method === 'extractEmails') {
      respond({ emails: fromText(msg.data) });
      return true;
    }

    if (msg.method === 'checkUnsafePage') {
      respond({ safe: document.getElementById('unsafe-page') === null });
      return true;
    }
  });
})();
