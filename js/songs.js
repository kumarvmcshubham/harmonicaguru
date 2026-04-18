// js/songs.js
// HarmonicaGuru — Song Catalog Screen

import { isSubscriptionActive, hasSongAccess } from './auth.js';

// ── Song Catalog Data ─────────────────────────────────────────────────
const SONGS = [
  {
    id:         'hb',
    title:      'Happy Birthday',
    artist:     'Traditional',
    difficulty: 'Beginner',
    hissas:     4,
    price:      49,
    available:  true,
    emoji:      '🎂',
    desc:       'Sabse pehla gaana — 4 hissas mein seekho',
  },
  {
    id:         'sarjo',
    title:      'Sar Jo Tera Chakraye',
    artist:     'Pyaasa (1957)',
    difficulty: 'Intermediate',
    hissas:     6,
    price:      49,
    available:  false,
    emoji:      '🎬',
    desc:       'Classic Bollywood — jaldi aane wala hai',
  },
  {
    id:         'sholay',
    title:      'Sholay Medley',
    artist:     'Sholay (1975)',
    difficulty: 'Intermediate',
    hissas:     8,
    price:      99,
    available:  false,
    emoji:      '🔥',
    desc:       'Yeh dosti + Mehbooba — jaldi aane wala hai',
  },
  {
    id:         'haiaapna',
    title:      'Hai Apna Dil To Awara',
    artist:     'Solva Saal (1958)',
    difficulty: 'Advanced',
    hissas:     10,
    price:      299,
    available:  false,
    emoji:      '💫',
    desc:       'Premium classic — jaldi aane wala hai',
  },
];

// ── State ─────────────────────────────────────────────────────────────
let _currentUser   = null;
let _userData      = null;
let _onSongStart   = null;
let _onSongPaywall = null;

// ── Init ──────────────────────────────────────────────────────────────
export function initSongs(user, userData, onSongStart, onSongPaywall) {
  _currentUser   = user;
  _userData      = userData;
  _onSongStart   = onSongStart;
  _onSongPaywall = onSongPaywall;
  renderSongs();
}

// ── Render Song Cards ──────────────────────────────────────────────────
function renderSongs() {
  const container = document.getElementById('songsContainer');
  if (!container) return;
  container.innerHTML = '';

  SONGS.forEach(song => {
    const card = document.createElement('div');

    if (song.available) {
      const subActive = isSubscriptionActive(_userData);
      const hasAccess = hasSongAccess(_userData, song.id);

      card.className = 'song-card';
      card.innerHTML = `
        <div class="song-emoji">${song.emoji}</div>
        <div class="song-info">
          <div class="song-title">${song.title}</div>
          <div class="song-subtitle">${song.artist}</div>
          <div class="song-meta">
            <span class="song-difficulty ${song.difficulty.toLowerCase()}">${song.difficulty}</span>
            <span class="song-hissas">${song.hissas} Hissas</span>
          </div>
          <div class="song-status ${getBadgeClass(subActive, hasAccess)}">
            ${getBadgeLabel(subActive, hasAccess, song)}
          </div>
          <button class="btn-play-song ${getActionClass(subActive, hasAccess)}"
                  data-id="${song.id}">
            ${getActionLabel(subActive, hasAccess)}
          </button>
        </div>
      `;

      card.querySelector('.btn-play-song').onclick = () =>
        handleSongTap(song, subActive, hasAccess);

    } else {
      // Coming soon
      card.className = 'song-card coming-soon-card';
      card.innerHTML = `
        <div class="song-emoji faded">${song.emoji}</div>
        <div class="song-info">
          <div class="song-title">${song.title}</div>
          <div class="song-subtitle">${song.artist}</div>
          <div class="song-meta">
            <span class="song-difficulty ${song.difficulty.toLowerCase()}">${song.difficulty}</span>
            <span class="song-hissas">${song.hissas} Hissas</span>
          </div>
          <div class="song-status coming-soon">Jaldi Aayega · ₹${song.price}/month</div>
          <button class="btn-notify" data-id="${song.id}">
            🔔 Notify Me
          </button>
        </div>
      `;

      card.querySelector('.btn-notify').onclick = () =>
        handleNotifyMe(song);
    }

    container.appendChild(card);
  });
}

// ── Badge helpers ──────────────────────────────────────────────────────
function getBadgeLabel(subActive, hasAccess, song) {
  if (subActive || hasAccess) return 'Unlocked ✓';
  return 'Free with timer';
}

function getBadgeClass(subActive, hasAccess) {
  if (subActive || hasAccess) return 'unlocked';
  return 'free';
}

function getActionLabel(subActive, hasAccess) {
  if (subActive || hasAccess) return '▶ Bajao';
  return '▶ Play (Free)';
}

function getActionClass(subActive, hasAccess) {
  return '';
}

// ── Song Tap Handler ──────────────────────────────────────────────────
// HB and available songs: open if subscribed, song purchased, OR timer has time remaining
// Paywall only when timer is exhausted and no subscription/purchase
async function handleSongTap(song, subActive, hasAccess) {
  if (subActive || hasAccess) {
    if (_onSongStart) _onSongStart(song);
    return;
  }
  // Free user with time remaining — let them in
  const { isLimitReached } = await import('./timer.js');
  if (!isLimitReached()) {
    if (_onSongStart) _onSongStart(song);
    return;
  }
  // Timer exhausted — show paywall
  if (_onSongPaywall) _onSongPaywall(song);
}

// ── Notify Me ─────────────────────────────────────────────────────────
function handleNotifyMe(song) {
  const waMsg = encodeURIComponent(
    `Namaste Shubham! Main "${song.title}" ka lesson HarmonicaGuru pe chahta hoon.\nJab ready ho jaaye toh notify karna.\nMera account: ${_currentUser?.email}`
  );
  window.open(`https://wa.me/917992414776?text=${waMsg}`, '_blank');
}

// ── Song Paywall Sheet ────────────────────────────────────────────────
export function showSongPaywall(song, user, userData) {
  const sheet   = document.getElementById('paywallSheet');
  const content = document.getElementById('paywallContent');

  const subMsg = encodeURIComponent(
    `Namaste Shubham! Main HarmonicaGuru ka ₹99/month subscription lena chahta hoon.\nMera account: ${user?.email}\nUPI pe bhej raha hoon abhi.`
  );
  const songMsg = encodeURIComponent(
    `Namaste Shubham! Main "${song.title}" unlock karna chahta hoon HarmonicaGuru pe — ₹${song.price}/month.\nMera account: ${user?.email}\nUPI pe bhej raha hoon abhi.`
  );

  content.innerHTML = `
    <div class="paywall-title">🔒 ${song.title}</div>
    <div class="paywall-subtitle">Free play khatam. Aage seekhne ke liye unlock karo.</div>

    <div class="paywall-option best">
      <div class="paywall-option-badge">⭐ Best Value</div>
      <div class="paywall-option-title">Monthly Subscription</div>
      <div class="paywall-option-price">₹99<span>/month</span></div>
      <div class="paywall-option-desc">
        Unlimited practice · All scales · Happy Birthday unlimited · 5 AI credits/month
      </div>
      <a href="https://wa.me/917992414776?text=${subMsg}"
         target="_blank" class="btn-paywall-action subscribe">
        💬 Subscribe — ₹99/month
      </a>
    </div>

    <div style="text-align:center;color:var(--muted);font-size:0.8rem;margin:8px 0;">ya</div>

    <div class="paywall-option">
      <div class="paywall-option-title">Sirf ${song.title}</div>
      <div class="paywall-option-price">₹${song.price}<span>/month</span></div>
      <div class="paywall-option-desc">
        Sirf yeh gaana · Monthly access ·
        Renew karo WhatsApp pe
      </div>
      <a href="https://wa.me/917992414776?text=${songMsg}"
         target="_blank" class="btn-paywall-action song-only">
        💬 Sirf Yeh Gaana — ₹${song.price}/month
      </a>
    </div>

    <div class="paywall-code-section">
      <div class="paywall-code-label">Code mila? Yahan daalo:</div>
      <input type="number" id="paywallCodeInput"
             class="unlock-code-input" placeholder="4-digit code" maxlength="4" />
      <button id="btnPaywallCode" class="btn-submit-code">Unlock Karo ✓</button>
      <div id="paywallCodeError" class="unlock-code-error"></div>
    </div>

    <button class="btn-modal-close" id="btnClosePaywall">Baad mein</button>
  `;

  document.getElementById('btnClosePaywall').onclick = () => {
    sheet.style.display = 'none';
  };

  document.getElementById('btnPaywallCode').onclick = () => {
    const code = document.getElementById('paywallCodeInput').value;
    document.dispatchEvent(new CustomEvent('validateUnlockCode', {
      detail: { code, songId: song.id }
    }));
  };

  sheet.style.display = 'flex';
}
