// js/request.js
// HarmonicaGuru — Sargam Request Screen

// ── Recently Fulfilled — hardcoded for now ────────────────────────────
const FULFILLED = [
  { song: 'Lag Ja Gale',          requester: 'Rahul, Mumbai',    date: 'Apr 2025' },
  { song: 'Tum Hi Ho',            requester: 'Priya, Delhi',     date: 'Apr 2025' },
  { song: 'Ek Pyaar Ka Nagma',    requester: 'Amit, Patna',      date: 'Mar 2025' },
  { song: 'Raghupati Raghav',     requester: 'Sunita, Jaipur',   date: 'Mar 2025' },
  { song: 'Hum Honge Kamyaab',    requester: 'Vikas, Lucknow',   date: 'Feb 2025' },
];

// ── State ─────────────────────────────────────────────────────────────
let _currentUser = null;

// ── Init ──────────────────────────────────────────────────────────────
export function initRequest(user) {
  _currentUser = user;
  renderFulfilledList();
  bindTallyButton();
}

// ── Tally Button ──────────────────────────────────────────────────────
function bindTallyButton() {
  const btn = document.getElementById('btnTallyRequest');
  if (!btn) return;

  // Remove old listener by cloning
  const fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);

  fresh.onclick = () => {
    // Replace with your actual Tally form URL when ready
    const tallyUrl = 'https://tally.so/r/XXXXXXXX';
    window.open(tallyUrl, '_blank');
  };
}

// ── Fulfilled List ────────────────────────────────────────────────────
function renderFulfilledList() {
  const list = document.getElementById('fulfilledList');
  if (!list) return;
  list.innerHTML = '';

  FULFILLED.forEach(item => {
    const div = document.createElement('div');
    div.className = 'fulfilled-item';
    div.innerHTML = `
      <div class="fulfilled-item-left">
        <div class="fulfilled-song">${item.song}</div>
        <div class="fulfilled-by">${item.requester} · ${item.date}</div>
      </div>
      <div class="fulfilled-badge">✓ Delivered</div>
    `;
    list.appendChild(div);
  });
}
