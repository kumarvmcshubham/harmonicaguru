// js/app.js
// HarmonicaGuru — Main App Controller

import { signInWithGoogle, watchAuthState, getUserData, signOutUser } from './auth.js';
import { initTimer, getTimerDisplayText, getTimerColorClass, isLimitReached } from './timer.js';
import { initPractice } from './practice.js';
import { initSongs, showSongPaywall } from './songs.js';
import { initRequest } from './request.js';
import { initLesson } from './lesson.js';
import { setVoiceEnabled, setVoiceLang, getVoiceEnabled, getVoiceLang } from './voice.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from './firebase-config.js';

// ── Master Code — permanent bypass for Shubham only ──────────────────
// All other codes are stored in Firestore 'codes' collection
// Generate codes from Admin Dashboard — no app.js edit needed
export const UNLOCK_CODES = {
  '9934673761': { type: 'subscription', months: 1 },
};

// ── State ─────────────────────────────────────────────────────────────
let currentUser   = null;
let userData      = null;
let selectedKey   = 'C';
let harmonicaType = 'diatonic';

// ── Constants ─────────────────────────────────────────────────────────
const MASTER_EMAIL = 'writetokumarshubham@gmail.com';

// ── Screen Navigation ─────────────────────────────────────────────────
export function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + screenId).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.screen === screenId);
  });
}

// ── Auth State ────────────────────────────────────────────────────────
watchAuthState(
  async (user) => {
    currentUser = user;
    userData    = await getUserData(user.uid);
    onUserReady();
  },
  () => {
    currentUser = null;
    userData    = null;
    document.getElementById('bottomNav').style.display = 'none';
    // Hide loading screen — show login
    document.getElementById('screen-loading').style.display = 'none';
    showScreen('login');
  }
);

// ── On User Ready ─────────────────────────────────────────────────────
async function onUserReady() {
  // Hide loading screen
  document.getElementById('screen-loading').style.display = 'none';
  document.getElementById('bottomNav').style.display = 'flex';

  const name = currentUser.displayName?.split(' ')[0] || 'Dost';
  document.getElementById('homeGreeting').textContent = `Namaste, ${name}! 👋`;

  const tokens = userData?.subscription?.aiCreditsRemaining ?? 0;

  // Give 5 starter credits only to new users who never used AI and have zero credits
  const neverUsedAI  = (userData?.aiCallsTotal || 0) === 0;
  const isFreeZero   = tokens === 0 && userData?.subscription?.status !== 'monthly';
  if (isFreeZero && neverUsedAI) {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { 'subscription.aiCreditsRemaining': 5 });
      userData.subscription.aiCreditsRemaining = 5;
    } catch(e) { console.warn('Could not set initial credits:', e); }
  }

  const finalTokens = userData?.subscription?.aiCreditsRemaining || 0;
  document.querySelectorAll('.token-pill').forEach(p => {
    // Home pill has inner span, others are plain text
    const inner = p.querySelector('span');
    if (inner) {
      inner.textContent = `🤖 ${finalTokens}`;
    } else {
      p.textContent = `🤖 ${finalTokens}`;
    }
    p.style.background = finalTokens === 0 ? '#dc2626' : '#F4600C';
    p.style.cursor     = 'pointer';
    p.onclick          = () => showCreditsSheet();
  });

  harmonicaType = userData?.harmonicaType || null;

  // Restore voice settings
  const voiceOn  = localStorage.getItem('voiceEnabled');
  const voiceLng = localStorage.getItem('voiceLang');
  if (voiceOn !== null) setVoiceEnabled(voiceOn === 'true');
  if (voiceLng)         setVoiceLang(voiceLng);
  updateVoiceSheetUI();
  updateVoiceHeaderBtn();

  await initTimer(currentUser.uid);
  updateTimerDisplay();
  buildKeyRow();

  if (!harmonicaType) {
    showScreen('harmonica-select');
  } else {
    updateHarmonicaBadge();
    showScreen('home');
  }

  // Wire greeting → profile sheet
  document.getElementById('homeGreeting').onclick = () => showProfileSheet();

  // Show dev reset button only for master account
  const devBtn = document.getElementById('btnDevReset');
  if (devBtn) {
    devBtn.style.display = currentUser.email === MASTER_EMAIL ? 'block' : 'none';
  }
  showAdminIfMaster();
}

// ── Profile Sheet ─────────────────────────────────────────────────────
function showProfileSheet() {
  const sheet = document.getElementById('profileSheet');
  if (!sheet) return;
  // Fill name and email
  const nameEl  = document.getElementById('profileName');
  const emailEl = document.getElementById('profileEmail');
  if (nameEl)  nameEl.textContent  = currentUser?.displayName || 'HarmonicaGuru User';
  if (emailEl) emailEl.textContent = currentUser?.email || '';
  sheet.style.display = 'flex';
}

document.getElementById('btnCloseProfile')?.addEventListener('click', () => {
  document.getElementById('profileSheet').style.display = 'none';
});

document.getElementById('profileChangHarmonica')?.addEventListener('click', () => {
  document.getElementById('profileSheet').style.display = 'none';
  showScreen('harmonica-select');
});

document.getElementById('btnSignOut')?.addEventListener('click', async () => {
  document.getElementById('profileSheet').style.display = 'none';
  await signOutUser();
  // Auth state change will handle redirect to login
});

// ── Harmonica Badge ───────────────────────────────────────────────────
function updateHarmonicaBadge() {
  const badge = document.getElementById('harmonicaBadge');
  if (!badge) return;
  badge.textContent = harmonicaType === 'tower'
    ? '🎶 24-Hole Chromatic / Tower'
    : '🎵 10-Hole Diatonic';
}

// ── Harmonica Selector ────────────────────────────────────────────────
async function selectHarmonica(type) {
  harmonicaType = type;
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, { harmonicaType: type });
  } catch(e) { console.warn('Could not save harmonicaType:', e); }
  updateHarmonicaBadge();
  showScreen('home');
}

document.getElementById('hselDiatonic').onclick      = () => selectHarmonica('diatonic');
document.getElementById('hselTower').onclick         = () => selectHarmonica('tower');
document.getElementById('hselSkip').onclick          = () => selectHarmonica('diatonic');
document.getElementById('btnChangeHarmonica').onclick = () => showScreen('harmonica-select');

// ── Timer Display ─────────────────────────────────────────────────────
function updateTimerDisplay() {
  const el = document.getElementById('timerDisplay');
  if (!el) return;
  el.textContent = getTimerDisplayText();
  el.className   = 'fc-sub ' + getTimerColorClass();
}

// ── Key Row ───────────────────────────────────────────────────────────
const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function isSubActive() {
  const sub = userData?.subscription;
  if (!sub || sub.status !== 'monthly') return false;
  if (!sub.expiresAt) return false;
  const exp = sub.expiresAt.toDate ? sub.expiresAt.toDate() : new Date(sub.expiresAt);
  return exp > new Date();
}

function buildKeyRow() {
  const row         = document.getElementById('keyRow');
  row.innerHTML     = '';
  const allUnlocked = isSubActive() || userData?.allScalesUnlocked || false;

  KEYS.forEach(key => {
    const btn      = document.createElement('button');
    const isLocked = key !== 'C' && !allUnlocked;
    const isActive = key === selectedKey;
    btn.className   = 'key-btn' + (isActive ? ' active' : '') + (isLocked ? ' locked' : '');
    btn.textContent = isLocked ? `${key} 🔒` : key;
    btn.onclick = () => {
      if (isLocked) { showUnlockModal('allScales'); return; }
      if (key !== selectedKey) { selectedKey = key; buildKeyRow(); }
    };
    row.appendChild(btn);
  });
}

// ── Google Sign In ────────────────────────────────────────────────────
document.getElementById('btnGoogleSignIn').onclick = async () => {
  const btn    = document.getElementById('btnGoogleSignIn');
  const errDiv = document.getElementById('loginError');
  btn.disabled    = true;
  btn.textContent = 'Sign in ho raha hai...';
  errDiv.textContent = '';
  try {
    await signInWithGoogle();
  } catch(err) {
    errDiv.textContent = 'Sign in nahi hua — dobara try karo';
    btn.disabled = false;
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13 17.8 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
      <path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.4 10.7l8.2-6.1z"/>
      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.9l-8.2 6.1C6.5 42.5 14.6 48 24 48z"/>
    </svg> Google se Sign In Karo`;
  }
};

// ── Bottom Nav ────────────────────────────────────────────────────────
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.onclick = () => {
    const screen = tab.dataset.screen;
    showScreen(screen);

    // Init screens on first tap
    if (screen === 'practice') {
      initPractice(selectedKey, harmonicaType, userData, showUnlockModal);
    }
    if (screen === 'songs') {
      initSongs(
        currentUser,
        userData,
        (song) => {
          document.getElementById('lessonTitle').textContent = song.title;
          showScreen('lesson');
          initLesson(song, harmonicaType, currentUser, userData);
        },
        (song) => showSongPaywall(song, currentUser, userData)
      );
    }
    if (screen === 'request') {
      initRequest(currentUser);
    }
  };
});

// ── Back Buttons ──────────────────────────────────────────────────────
document.getElementById('btnBackFromPractice').onclick = () => {
  // Stop mic if running when leaving practice
  document.dispatchEvent(new CustomEvent('stopPracticeMic'));
  showScreen('home');
};
document.getElementById('btnBackFromSongs').onclick    = () => showScreen('home');
document.getElementById('btnBackFromLesson').onclick   = () => {
  // Stop mic if running when leaving lesson
  document.dispatchEvent(new CustomEvent('stopLessonMic'));
  showScreen('songs');
};
document.getElementById('btnBackFromRequest').onclick  = () => showScreen('home');

// ── showUnlockModal event — fired from lesson.js buy credits link ─────
document.addEventListener('showUnlockModal', (e) => {
  showUnlockModal(e.detail);
});

// ── Paywall code entry — same validateCode used everywhere ────────────
document.addEventListener('validateUnlockCode', (e) => {
  const { code } = e.detail;
  // Point error display to paywall error div
  const paywallErr = document.getElementById('paywallCodeError');
  validateCode(code, paywallErr).then(() => {
    // Close paywall sheet on success
    if (document.getElementById('paywallSheet').style.display !== 'none') {
      const tokens = userData?.subscription?.aiCreditsRemaining || 0;
      if (tokens > 0 || userData?.subscription?.status === 'monthly') {
        document.getElementById('paywallSheet').style.display = 'none';
      }
    }
  });
});

// ── Feature Cards ─────────────────────────────────────────────────────
document.getElementById('cardPractice').onclick = () => {
  showScreen('practice');
  initPractice(selectedKey, harmonicaType, userData, showUnlockModal);
};

document.getElementById('cardSongs').onclick = () => {
  showScreen('songs');
  initSongs(
    currentUser,
    userData,
    (song) => {
      document.getElementById('lessonTitle').textContent = song.title;
      showScreen('lesson');
      initLesson(song, harmonicaType, currentUser, userData);
    },
    (song) => showSongPaywall(song, currentUser, userData)
  );
};

document.getElementById('cardRequest').onclick = () => {
  showScreen('request');
  initRequest(currentUser);
};

// ── DEV ONLY — Reset to free tier — Shubham only ─────────────────────
const devResetBtn  = document.getElementById('btnDevReset');
if (devResetBtn) {
  devResetBtn.style.display = 'none';
}

document.getElementById('btnDevReset')?.addEventListener('click', async () => {
  if (!currentUser || currentUser.email !== MASTER_EMAIL) return;
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      'subscription.status':             'free',
      'subscription.expiresAt':          null,
      'subscription.renewalDate':        null,
      'subscription.aiCreditsRemaining': 5,
      'subscription.aiCreditsLastReset': null,
      allScalesUnlocked:                 false,
      sargamGroupsUnlocked:              false,
      songAccess:                        [],
      freePlaysUsed:                     [],
    });
    userData = await getUserData(currentUser.uid);
    buildKeyRow();
    updateTimerDisplay();
    // Update token pill to show 5 credits
    document.querySelectorAll('.token-pill').forEach(p => {
      p.textContent      = '🤖 5';
      p.style.background = '#F4600C';
    });
    // Re-init songs screen with fresh userData
    initSongs(
      currentUser, userData,
      (song) => {
        document.getElementById('lessonTitle').textContent = song.title;
        showScreen('lesson');
        initLesson(song, harmonicaType, currentUser, userData);
      },
      (song) => showSongPaywall(song, currentUser, userData)
    );
    alert('Reset to free tier ✓ (5 AI credits, timer-based HB access)');
  } catch(e) {
    console.error('Reset failed:', e);
    alert('Reset failed: ' + e.message);
  }
});

// Timer paywall subscribe button
document.getElementById('btnTimerPaywall')?.addEventListener('click', () => {
  showSubscribeSheet();
});

// ── Subscribe Sheet ───────────────────────────────────────────────────
function showSubscribeSheet() {
  const modal   = document.getElementById('unlockModal');
  const content = document.getElementById('unlockContent');

  const waMsg = encodeURIComponent(
    `Namaste Shubham! Main HarmonicaGuru ka ₹99/month subscription lena chahta hoon.\nMera account: ${currentUser?.email}\nUPI pe bhej raha hoon abhi.`
  );

  content.innerHTML = `
    <div class="unlock-header">
      <div class="unlock-title">Monthly Subscription</div>
      <div class="unlock-price">₹99/month</div>
    </div>
    <div class="unlock-desc">
      Unlimited practice · All scales · Happy Birthday unlimited · 5 AI credits/month
    </div>
    <a href="https://wa.me/917992414776?text=${waMsg}"
       target="_blank" class="btn-whatsapp">
      💬 Subscribe karo — ₹99/month
    </a>
      <div class="unlock-code-section">
      <div class="unlock-code-label">Code mila? Yahan daalo:</div>
      <input type="text" id="unlockCodeInput"
             class="unlock-code-input"
             placeholder="e.g. A3F7X2"
             maxlength="10"
             style="text-transform:uppercase;letter-spacing:4px" />
      <button id="btnSubmitCode" class="btn-submit-code">Unlock Karo ✓</button>
      <div id="unlockCodeError" class="unlock-code-error"></div>
    </div>
    <button class="btn-modal-close" id="btnCloseModal">Baad mein</button>
  `;

  document.getElementById('btnCloseModal').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('btnSubmitCode').onclick = () => {
    validateCode(document.getElementById('unlockCodeInput').value);
  };
  modal.style.display = 'flex';
}

// ── Unlock Modal (general) ────────────────────────────────────────────
export function showUnlockModal(feature) {
  const features = {
    allScales:    { name: 'All Scales (C through B)',        price: '₹99/month',  desc: 'Unlock all 12 keys, 2-Note 3-Note 4-Note groups, unlimited practice. Subscribe karo.' },
    sargamGroups: null,
    aiStarter:    { name: 'AI Credits — 5 pack',             price: '₹19',  desc: '5 AI feedback sessions.' },
    aiStandard:   { name: 'AI Credits — 20 pack',            price: '₹49',  desc: '20 AI feedback sessions.' },
    aiPower:      { name: 'AI Credits — 60 pack',            price: '₹99',  desc: '60 AI feedback sessions.' },
  };

  const f = features[feature];
  if (!f) { showSubscribeSheet(); return; }

  const modal   = document.getElementById('unlockModal');
  const content = document.getElementById('unlockContent');
  const waMsg   = encodeURIComponent(
    `Namaste Shubham! Main "${f.name}" unlock karna chahta hoon.\nMera account: ${currentUser?.email}\n${f.price} aapke UPI pe bhej raha hoon.`
  );

  content.innerHTML = `
    <div class="unlock-header">
      <div class="unlock-title">${f.name}</div>
      <div class="unlock-price">${f.price}</div>
    </div>
    <div class="unlock-desc">${f.desc}</div>
    <a href="https://wa.me/917992414776?text=${waMsg}"
       target="_blank" class="btn-whatsapp">💬 WhatsApp Pe Unlock Karo</a>
      <div class="unlock-code-section">
      <div class="unlock-code-label">Code mila? Yahan daalo:</div>
      <input type="text" id="unlockCodeInput"
             class="unlock-code-input"
             placeholder="e.g. A3F7X2"
             maxlength="10"
             style="text-transform:uppercase;letter-spacing:4px" />
      <button id="btnSubmitCode" class="btn-submit-code">Unlock Karo ✓</button>
      <div id="unlockCodeError" class="unlock-code-error"></div>
    </div>
    <button class="btn-modal-close" id="btnCloseModal">Baad mein</button>
  `;

  document.getElementById('btnCloseModal').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('btnSubmitCode').onclick = () => {
    validateCode(document.getElementById('unlockCodeInput').value);
  };
  modal.style.display = 'flex';
}

// ── Universal Code Validator ──────────────────────────────────────────
async function validateCode(code, errDivOverride) {
  const errDiv = errDivOverride || document.getElementById('unlockCodeError');
  if (!errDiv) return;

  // Trim and uppercase
  code = (code || '').trim().toUpperCase();
  if (!code) {
    errDiv.textContent = 'Code daalo pehle.';
    errDiv.style.color = '#dc2626';
    return;
  }

  // ── Step 1: Check master code (hardcoded, always works) ──────────────
  const masterEntry = UNLOCK_CODES[code];

  // ── Step 2: Check Firestore codes collection ──────────────────────────
  let entry = masterEntry || null;
  let isFirestoreCode = false;

  if (!masterEntry) {
    try {
      const { getDoc: gd } = await import(
        "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
      );
      const codeRef  = doc(db, 'codes', code);
      const codeSnap = await gd(codeRef);
      if (codeSnap.exists()) {
        const data = codeSnap.data();
        if (!data.active) {
          errDiv.textContent = 'Yeh code pehle hi use ho chuka hai.';
          errDiv.style.color = '#dc2626';
          return;
        }
        entry = data;
        isFirestoreCode = true;
      }
    } catch(e) {
      console.warn('Firestore code check error:', e);
    }
  }

  if (!entry) {
    errDiv.textContent = 'Galat code hai. WhatsApp pe check karo.';
    errDiv.style.color = '#dc2626';
    return;
  }

  // ── Step 3: Single-use check for non-master codes ─────────────────────
  if (code !== '9934673761') {
    try {
      const { getDoc: gd, setDoc: sd } = await import(
        "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
      );
      // Check usedCodes collection
      const usedRef  = doc(db, 'usedCodes', code);
      const usedSnap = await gd(usedRef);
      if (usedSnap.exists()) {
        errDiv.textContent = 'Yeh code pehle hi use ho chuka hai.';
        errDiv.style.color = '#dc2626';
        return;
      }
      // Mark as used in usedCodes
      await sd(usedRef, {
        usedBy:    currentUser.uid,
        usedAt:    new Date(),
        email:     currentUser.email,
        codeType:  entry.type || 'unknown',
        detail:    entry.type === 'ai' ? `${entry.credits} credits`
                 : entry.type === 'song' ? entry.songId
                 : entry.type === 'subscription' ? `${entry.months}m`
                 : ''
      });
      // If Firestore code — mark inactive in codes collection
      if (isFirestoreCode) {
        const { updateDoc: ud } = await import(
          "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
        );
        await ud(doc(db, 'codes', code), {
          active:   false,
          usedBy:   currentUser.uid,
          usedAt:   new Date(),
          usedEmail: currentUser.email
        });
      }
    } catch(e) {
      console.warn('Could not check usedCodes:', e);
    }
  }

  // ── Step 4: Apply the unlock ──────────────────────────────────────────
  try {
    const userRef = doc(db, 'users', currentUser.uid);

    if (entry.type === 'subscription') {
      const expiry  = new Date();
      expiry.setMonth(expiry.getMonth() + (entry.months || 1));
      await updateDoc(userRef, {
        'subscription.status':             'monthly',
        'subscription.expiresAt':          expiry,
        'subscription.renewalDate':        new Date(expiry),
        'subscription.aiCreditsRemaining': 5,
        'subscription.aiCreditsLastReset': new Date(),
        allScalesUnlocked:                 true,
        sargamGroupsUnlocked:              true,
      });
      alert('Subscription active ho gayi! 1 mahine ke liye. 🎉');
    }

    else if (entry.type === 'song') {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);
      const { arrayUnion } = await import(
        "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
      );
      await updateDoc(userRef, {
        songAccess: arrayUnion({
          id:         entry.songId,
          expiresAt:  expiry,
          playsUsed:  0,
          unlockedAt: new Date(),
        })
      });
      alert(`Song unlock ho gaya! 30 din ke liye. 🎉`);
    }

    else if (entry.type === 'ai') {
      const current = userData?.subscription?.aiCreditsRemaining || 0;
      await updateDoc(userRef, {
        'subscription.aiCreditsRemaining': current + (entry.credits || 5)
      });
      alert(`${entry.credits} AI credits add ho gaye! 🎉`);
    }

    // Refresh user data + UI
    userData = await getUserData(currentUser.uid);
    document.getElementById('unlockModal').style.display = 'none';

    const tokens = userData?.subscription?.aiCreditsRemaining || 0;
    document.querySelectorAll('.token-pill').forEach(p => {
      p.textContent      = `🤖 ${tokens}`;
      p.style.background = tokens === 0 ? '#dc2626' : '#F4600C';
    });

    if (entry.type === 'subscription') {
      buildKeyRow();
      // Re-init practice screen with fresh userData so tabs unlock immediately
      initPractice(selectedKey, harmonicaType, userData, showUnlockModal);
    }

  } catch(err) {
    if (errDiv) errDiv.textContent = 'Kuch error hua — dobara try karo.';
    console.error(err);
  }
}

// ── Voice Settings ────────────────────────────────────────────────────
document.getElementById('btnVoice').onclick      = () => {
  document.getElementById('voiceSheet').style.display = 'flex';
};
document.getElementById('btnCloseVoice').onclick = () => {
  document.getElementById('voiceSheet').style.display = 'none';
};
document.getElementById('voiceBtnOn').onclick = () => {
  setVoiceEnabled(true);
  localStorage.setItem('voiceEnabled', 'true');
  updateVoiceSheetUI(); updateVoiceHeaderBtn();
};
document.getElementById('voiceBtnOff').onclick = () => {
  setVoiceEnabled(false);
  localStorage.setItem('voiceEnabled', 'false');
  updateVoiceSheetUI(); updateVoiceHeaderBtn();
};
document.getElementById('voiceBtnHinglish').onclick = () => {
  setVoiceLang('hinglish');
  localStorage.setItem('voiceLang', 'hinglish');
  updateVoiceSheetUI();
};
document.getElementById('voiceBtnEnglish').onclick = () => {
  setVoiceLang('english');
  localStorage.setItem('voiceLang', 'english');
  updateVoiceSheetUI();
};

function updateVoiceSheetUI() {
  const on  = getVoiceEnabled();
  const lng = getVoiceLang();
  document.getElementById('voiceBtnOn').classList.toggle('active', on);
  document.getElementById('voiceBtnOff').classList.toggle('active', !on);
  document.getElementById('voiceBtnHinglish').classList.toggle('active', lng === 'hinglish');
  document.getElementById('voiceBtnEnglish').classList.toggle('active', lng === 'english');
}

function updateVoiceHeaderBtn() {
  const btn = document.getElementById('btnVoice');
  if (btn) btn.textContent = getVoiceEnabled() ? '🔊' : '🔇';
}

// ── AI Credits Sheet ──────────────────────────────────────────────────
function showCreditsSheet() {
  const credits = userData?.subscription?.aiCreditsRemaining || 0;
  const finalTokens = credits;
  const modal   = document.getElementById('unlockModal');
  const content = document.getElementById('unlockContent');

  const wa5  = encodeURIComponent(`Namaste Shubham! Main HarmonicaGuru AI Credits — Starter Pack 10 credits (₹10) lena chahta hoon.\nMera account: ${currentUser?.email}`);
  const wa20 = encodeURIComponent(`Namaste Shubham! Main HarmonicaGuru AI Credits — Standard Pack 25 credits (₹20) lena chahta hoon.\nMera account: ${currentUser?.email}`);
  const wa60 = encodeURIComponent(`Namaste Shubham! Main HarmonicaGuru AI Credits — Power Pack 50 credits (₹30) lena chahta hoon.\nMera account: ${currentUser?.email}`);

  const creditColor = credits === 0 ? '#dc2626' : credits <= 2 ? '#F59E0B' : '#22C55E';
  const creditMsg   = credits === 0 ? 'Credits khatam — nayi pack lo'
                    : credits <= 2  ? 'Sirf thode credits bache hain'
                    : 'Credits available hain';

  content.innerHTML = `
    <div style="background:rgba(244,96,12,0.08);border:1px solid rgba(244,96,12,0.2);border-radius:14px;padding:14px 16px;margin-bottom:18px">
      <div style="font-family:var(--font-h);font-size:0.9rem;font-weight:800;color:#fff;margin-bottom:6px">🎓 AI Ustaad kya karta hai?</div>
      <div style="font-size:0.78rem;color:var(--muted);line-height:1.6">Happy Birthday ka ek hissa complete karo — AI Ustaad aapki performance sunta hai aur seedha Hindi mein feedback deta hai. Kaun sa note weak tha, kaun sa sahi — specific aur helpful.<br><br><strong style="color:var(--saffron)">1 hissa = 1 credit</strong></div>
    </div>

    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:2.5rem;margin-bottom:6px">🤖</div>
      <div style="font-family:var(--font-h);font-size:1.8rem;font-weight:800;color:${creditColor}">${finalTokens}</div>
      <div style="font-family:var(--font-h);font-size:0.85rem;color:var(--muted);margin-top:4px">${creditMsg}</div>
    </div>

    <div style="font-family:var(--font-h);font-size:0.75rem;font-weight:800;color:var(--saffron);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">
      AI Credits Kharidein
    </div>

    <div class="credits-pack" style="margin-bottom:10px">
      <div class="credits-pack-info">
        <div class="credits-pack-name">Starter Pack</div>
        <div class="credits-pack-count">10 credits</div>
        <div class="credits-pack-desc">₹1 per feedback</div>
      </div>
      <div class="credits-pack-right">
        <div class="credits-pack-price">₹10</div>
        <a href="https://wa.me/917992414776?text=${wa5}" target="_blank" class="btn-credits-buy">Buy →</a>
      </div>
    </div>

    <div class="credits-pack" style="margin-bottom:10px">
      <div class="credits-pack-info">
        <div class="credits-pack-name">Standard Pack</div>
        <div class="credits-pack-count">25 credits</div>
        <div class="credits-pack-desc">₹0.80 per feedback</div>
      </div>
      <div class="credits-pack-right">
        <div class="credits-pack-price">₹20</div>
        <a href="https://wa.me/917992414776?text=${wa20}" target="_blank" class="btn-credits-buy">Buy →</a>
      </div>
    </div>

    <div class="credits-pack best-pack" style="margin-bottom:20px">
      <div class="credits-pack-badge">⭐ Best Value</div>
      <div class="credits-pack-info">
        <div class="credits-pack-name">Power Pack</div>
        <div class="credits-pack-count">50 credits</div>
        <div class="credits-pack-desc">₹0.60 per feedback</div>
      </div>
      <div class="credits-pack-right">
        <div class="credits-pack-price">₹30</div>
        <a href="https://wa.me/917992414776?text=${wa60}" target="_blank" class="btn-credits-buy">Buy →</a>
      </div>
    </div>

    <div style="font-size:0.75rem;color:var(--muted);text-align:center;margin-bottom:16px;line-height:1.5">
      WhatsApp pe order karo → UPI pe pay karo → code milega → app mein daalo
    </div>

      <div class="unlock-code-section">
      <div class="unlock-code-label">Code mila? Yahan daalo:</div>
      <input type="text" id="unlockCodeInput"
             class="unlock-code-input"
             placeholder="e.g. A3F7X2"
             maxlength="10"
             style="text-transform:uppercase;letter-spacing:4px" />
      <button id="btnSubmitCode" class="btn-submit-code">Unlock Karo ✓</button>
      <div id="unlockCodeError" class="unlock-code-error"></div>
    </div>
    <button class="btn-modal-close" id="btnCloseModal">Baad mein</button>
  `;

  document.getElementById('btnCloseModal').onclick = () => { modal.style.display = 'none'; };
  document.getElementById('btnSubmitCode').onclick = () => {
    validateCode(document.getElementById('unlockCodeInput').value);
  };
  modal.style.display = 'flex';
}

// ── Admin Dashboard ───────────────────────────────────────────────────
const adminBtn = document.getElementById('btnAdminDash');
if (adminBtn) adminBtn.style.display = 'none';

document.getElementById('btnAdminDash')?.addEventListener('click', () => {
  // Button is already hidden for non-master — just open it
  showScreen('admin');
  loadAdminDashboard();
});

document.getElementById('btnBackFromAdmin')?.addEventListener('click', () => {
  showScreen('home');
});

async function loadAdminDashboard() {
  const content = document.getElementById('adminContent');
  if (!content) return;
  content.innerHTML = '<div class="admin-loading">⏳ Loading stats...</div>';

  try {
    const { getDoc: gd, collection, getDocs } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );

    const today = new Date().toISOString().slice(0, 10);

    // Read admin stats — may not exist yet if no AI calls made
    let totalAll   = 0;
    let totalToday = 0;
    let lastBy     = '—';

    try {
      const statsSnap = await gd(doc(db, 'admin', 'aiStats'));
      const daySnap   = await gd(doc(db, 'admin', `aiDay_${today}`));
      if (statsSnap.exists()) {
        totalAll = statsSnap.data()?.totalCallsAllTime || 0;
        lastBy   = statsSnap.data()?.lastCallBy || '—';
      }
      if (daySnap.exists()) {
        totalToday = daySnap.data()?.totalCalls || 0;
      }
    } catch(e) {
      // admin collection may not exist yet — that is fine
      console.log('No admin stats yet:', e.message);
    }

    const pct      = Math.round((totalToday / 14400) * 100);
    const barColor = pct >= 90 ? '#dc2626' : pct >= 60 ? '#F59E0B' : '#22C55E';

    // Read users
    let totalUsers = 0, activeSubscribers = 0;
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach(d => {
        totalUsers++;
        const sub = d.data()?.subscription;
        if (sub?.status === 'monthly' && sub?.expiresAt) {
          const exp = sub.expiresAt.toDate ? sub.expiresAt.toDate() : new Date(sub.expiresAt);
          if (exp > new Date()) activeSubscribers++;
        }
      });
    } catch(e) {
      console.log('Could not read users:', e.message);
    }

    // Read recent codes
    let recentCodes = [];
    try {
      const codesSnap = await getDocs(collection(db, 'usedCodes'));
      const codes = [];
      codesSnap.forEach(d => codes.push({ code: d.id, ...d.data() }));
      codes.sort((a, b) => (b.usedAt?.seconds || 0) - (a.usedAt?.seconds || 0));
      recentCodes = codes.slice(0, 5);
    } catch(e) {
      console.log('Could not read codes:', e.message);
    }

    content.innerHTML = `
      <div class="admin-section">
        <div class="admin-title">🔑 Generate New Code</div>
        <select id="adminCodeType" style="width:100%;padding:10px;border-radius:10px;background:var(--navy3);border:1px solid rgba(255,255,255,0.1);color:var(--white);font-family:var(--font-h);font-size:0.88rem;margin-bottom:10px">
          <option value="subscription_1">Subscription — ₹99/month</option>
          <option value="ai_10">AI Credits — Starter 10 pack (₹10)</option>
          <option value="ai_25">AI Credits — Standard 25 pack (₹20)</option>
          <option value="ai_50">AI Credits — Power 50 pack (₹30)</option>
          <option value="song_hb">Song — Happy Birthday (₹49)</option>
          <option value="song_sarjo">Song — Sar Jo Tera (₹49)</option>
          <option value="song_sholay">Song — Sholay Medley (₹99)</option>
          <option value="song_haiaapna">Song — Hai Apna Dil (₹299)</option>
        </select>
        <button id="btnGenerateCode" class="admin-action-btn" style="background:var(--saffron);color:white;border:none;cursor:pointer;text-align:center">
          ⚡ Generate Code
        </button>
        <div id="generatedCodeDisplay" style="display:none;margin-top:12px;background:var(--navy3);border-radius:10px;padding:14px;border:1px solid rgba(244,96,12,0.3)">
          <div style="font-size:0.72rem;color:var(--muted);margin-bottom:6px">Code for user — copy and send on WhatsApp:</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div id="generatedCodeVal" style="font-family:var(--font-h);font-size:1.6rem;font-weight:800;color:var(--saffron);letter-spacing:3px"></div>
            <button id="btnCopyCode" style="padding:6px 14px;border-radius:8px;border:1px solid var(--saffron);background:none;color:var(--saffron);font-family:var(--font-h);font-size:0.78rem;cursor:pointer">Copy</button>
          </div>
          <div style="font-size:0.7rem;color:var(--muted);margin-top:6px">Valid for 1 use only · Expires in 30 days</div>
        </div>
      </div>

      <div class="admin-section">
        <div class="admin-title">📊 Today's AI Usage</div>
        <div class="admin-stat-big">${totalToday} <span>/ 14,400 calls</span></div>
        <div class="admin-bar-wrap">
          <div class="admin-bar" style="width:${pct}%;background:${barColor}"></div>
        </div>
        <div class="admin-bar-label">${pct}% of free Groq limit used today</div>
        <div class="admin-stat-row">
          <span>Total calls ever</span><strong>${totalAll}</strong>
        </div>
        <div class="admin-stat-row">
          <span>Last used by</span><strong>${lastBy}</strong>
        </div>
      </div>

      <div class="admin-section">
        <div class="admin-title">👥 Users</div>
        <div class="admin-stat-row">
          <span>Total users</span><strong>${totalUsers}</strong>
        </div>
        <div class="admin-stat-row">
          <span>Active subscribers</span><strong>${activeSubscribers}</strong>
        </div>
        <div class="admin-stat-row">
          <span>Est. monthly revenue</span><strong>₹${activeSubscribers * 99}</strong>
        </div>
      </div>

      <div class="admin-section">
        <div class="admin-title">🔑 Recent Codes Used</div>
        ${recentCodes.length === 0
          ? '<div class="admin-empty">No codes used yet</div>'
          : recentCodes.map(c => `
              <div class="admin-code-row">
                <div class="admin-code-val">${c.code}</div>
                <div class="admin-code-meta">${c.email || '—'} · ${c.codeType || ''}${c.detail ? ' · ' + c.detail : ''}</div>
              </div>`).join('')
        }
      </div>

      <div class="admin-section">
        <div class="admin-title">⚡ Quick Actions</div>
        <a href="https://console.groq.com" target="_blank" class="admin-action-btn">
          🔋 Groq Console — Check Credits
        </a>
        <a href="https://console.firebase.google.com" target="_blank" class="admin-action-btn">
          🔥 Firebase Console
        </a>
      </div>
    `;

    // Wire generate code button
    document.getElementById('btnGenerateCode').onclick = () => generateCode();
    document.getElementById('btnCopyCode').onclick = () => {
      const code = document.getElementById('generatedCodeVal').textContent;
      navigator.clipboard.writeText(code).then(() => {
        document.getElementById('btnCopyCode').textContent = 'Copied ✓';
        setTimeout(() => document.getElementById('btnCopyCode').textContent = 'Copy', 2000);
      });
    };

  } catch(e) {
    content.innerHTML = `<div class="admin-loading">❌ Error: ${e.message}<br><br>Check Firestore rules — admin collection needs read access for your UID.</div>`;
    console.error('Admin load error:', e);
  }
}

// Show admin button only for Shubham — called after login
function showAdminIfMaster() {
  const ab = document.getElementById('btnAdminDash');
  if (!ab) return;
  ab.style.display = currentUser?.email === MASTER_EMAIL ? 'block' : 'none';
}

// ── Generate Code — writes to Firestore codes collection ──────────────
async function generateCode() {
  const typeVal = document.getElementById('adminCodeType')?.value;
  if (!typeVal) return;

  // Parse type value e.g. "ai_20" → { type:'ai', credits:20 }
  let entry = {};
  if (typeVal.startsWith('subscription')) {
    entry = { type: 'subscription', months: 1 };
  } else if (typeVal.startsWith('ai_')) {
    entry = { type: 'ai', credits: parseInt(typeVal.split('_')[1]) };
  } else if (typeVal.startsWith('song_')) {
    entry = { type: 'song', songId: typeVal.split('_')[1] };
  }

  // Generate random 6-char alphanumeric code e.g. "A3F7X2"
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code   = Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('');

  // Expiry — 30 days
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  try {
    const { setDoc: sd } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    await sd(doc(db, 'codes', code), {
      ...entry,
      active:    true,
      createdAt: new Date(),
      createdBy: currentUser.email,
      expiresAt: expiry,
    });

    // Show generated code with type label
    const display  = document.getElementById('generatedCodeDisplay');
    const codeEl   = document.getElementById('generatedCodeVal');
    if (display && codeEl) {
      codeEl.textContent = code;
      // Show type label
      const typeLabel = document.getElementById('generatedCodeType') || (() => {
        const el = document.createElement('div');
        el.id = 'generatedCodeType';
        el.style.cssText = 'font-size:0.72rem;color:var(--muted);margin-top:6px';
        display.appendChild(el);
        return el;
      })();
      const typeNames = {
        subscription_1: 'Subscription — ₹99/month',
        ai_10: 'AI Credits — Starter 10 pack',
        ai_25: 'AI Credits — Standard 25 pack',
        ai_50: 'AI Credits — Power 50 pack',
        song_hb: 'Song — Happy Birthday',
        song_sarjo: 'Song — Sar Jo Tera',
        song_sholay: 'Song — Sholay Medley',
        song_haiaapna: 'Song — Hai Apna Dil',
      };
      typeLabel.textContent = `Type: ${typeNames[typeVal] || typeVal}`;
      display.style.display = 'block';
    }
  } catch(e) {
    alert('Code generate nahi hua: ' + e.message);
    console.error(e);
  }
}

// ── Swipe Down to Dismiss — all modal sheets ──────────────────────────
// Attaches touch drag-down detection to every .modal-sheet
// User swipes down → sheet translates → releases → backdrop closes
function initSwipeToDismiss() {
  document.querySelectorAll('.modal-sheet').forEach(sheet => {
    let startY     = 0;
    let startX     = 0;
    let currentY   = 0;
    let isDragging = false;
    let decided    = false; // have we decided swipe vs scroll yet

    sheet.addEventListener('touchstart', (e) => {
      startY   = e.touches[0].clientY;
      startX   = e.touches[0].clientX;
      currentY = startY;
      isDragging = false;
      decided    = false;
      sheet.style.transition = 'none';
    }, { passive: true });

    sheet.addEventListener('touchmove', (e) => {
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;

      // Decide direction only once per gesture
      if (!decided) {
        decided = true;
        // If moving more horizontally or upward — not a dismiss gesture
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          isDragging = false;
          return;
        }
        // If sheet content is scrolled down — let scroll happen first
        if (sheet.scrollTop > 0) {
          isDragging = false;
          return;
        }
        // Moving downward from top — take control
        isDragging = true;
      }

      if (!isDragging) return;

      // Prevent page scroll while dismissing
      e.preventDefault();
      currentY = e.touches[0].clientY;
      const move = Math.max(0, currentY - startY);
      sheet.style.transform = `translateY(${move}px)`;
    }, { passive: false }); // passive:false so we can preventDefault

    sheet.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      decided    = false;
      const dy = Math.max(0, currentY - startY);
      sheet.style.transition = 'transform 0.25s ease';

      if (dy > 120) {
        sheet.style.transform = `translateY(100%)`;
        setTimeout(() => {
          sheet.style.transform  = '';
          sheet.style.transition = '';
          const backdrop = sheet.closest('.modal-backdrop');
          if (backdrop) backdrop.style.display = 'none';
        }, 250);
      } else {
        sheet.style.transform = '';
      }
    });
  });
}

// Also wire backdrop tap to close (tapping outside the sheet)
function initBackdropTapToClose() {
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.style.display = 'none';
      }
    });
  });
}

// Run both after DOM is ready
initSwipeToDismiss();
initBackdropTapToClose();

// ── Service Worker Update Banner ──────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'SW_UPDATED') {
      const banner = document.getElementById('updateBanner');
      if (banner) banner.style.display = 'flex';
    }
  });
}

document.getElementById('btnUpdateRefresh')?.addEventListener('click', () => {
  window.location.reload();
});
