// js/lesson.js
// HarmonicaGuru — Song Lesson Screen
// Scalable: works for any song defined in lessons.js
// Currently wired for Happy Birthday

import { HAPPY_BIRTHDAY } from '../assets/data/lessons.js';
import {
  startMic, stopMic, loadNotes, setKey, playReference,
  stopReference, isPlayingRef, playDing
} from './audio.js';
import { db } from './firebase-config.js';
import { doc, updateDoc, getDoc, increment } from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Groq config ────────────────────────────────────────────────────────
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_KEY   = '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';

// ── State ─────────────────────────────────────────────────────────────
let currentSong     = null;
let currentHissaIdx = 0;
let currentNotes    = [];
let noteResults     = [];
let isMicOn         = false;
let harmonicaType   = 'diatonic';
let currentUser     = null;
let userData        = null;
let hissaResults    = [];  // stores stars per hissa

// ── Song data map — add new songs here as they are built ──────────────
const SONG_DATA = {
  'hb': HAPPY_BIRTHDAY
};

// ── Init ──────────────────────────────────────────────────────────────
export function initLesson(songCatalog, hType, user, uData) {
  const songData = SONG_DATA[songCatalog.id];
  if (!songData) {
    const content = document.getElementById('lessonContent');
    if (content) content.innerHTML = `
      <div style="padding:40px 20px;text-align:center;color:var(--muted)">
        <div style="font-size:2rem;margin-bottom:12px">🎵</div>
        <div style="font-family:var(--font-h);font-size:1rem;color:var(--white)">
          ${songCatalog.title}
        </div>
        <div style="margin-top:8px;font-size:0.85rem">
          Lesson jaldi aayega — abhi available nahi
        </div>
      </div>`;
    return;
  }

  currentSong   = songData;
  harmonicaType = hType || 'diatonic';
  currentUser   = user;
  userData      = uData; // use passed data immediately
  hissaResults  = new Array(songData.lines.length).fill(null);

  setKey('C');
  renderLessonScreen();
  loadHissa(0);

  // Refresh credits in background — updates token pill when ready
  import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
    .then(({ getDoc, doc: d }) => getDoc(d(db, 'users', user.uid)))
    .then(snap => {
      if (snap.exists()) {
        userData = snap.data();
        // Update token pill with fresh credits
        const credits = userData?.subscription?.aiCreditsRemaining || 0;
        document.querySelectorAll('.token-pill').forEach(p => {
          p.textContent      = `🤖 ${credits}`;
          p.style.background = credits === 0 ? '#dc2626' : '#F4600C';
        });
      }
    })
    .catch(e => console.warn('Could not refresh userData:', e));
}

// ── Render Lesson Screen ───────────────────────────────────────────────
function renderLessonScreen() {
  const content = document.getElementById('lessonContent');
  if (!content) return;

  const hissaTabs = currentSong.lines.map((line, i) => `
    <button class="hissa-tab ${i === 0 ? 'active' : ''}" data-hissa="${i}">
      ${line.label}
      <span class="hissa-star" id="hissaStar${i}"></span>
    </button>
  `).join('');

  content.innerHTML = `
    <!-- Hissa Tabs -->
    <div class="hissa-tabs" id="hissaTabs">${hissaTabs}</div>

    <!-- Lyric Line -->
    <div class="lesson-lyric" id="lessonLyric"></div>

    <!-- Note Card — reuses practice screen styling -->
    <div class="note-card" id="lessonNoteCard">
      <div class="note-card-band blow" id="lessonNoteCardBand">↑ Blow</div>
      <div class="note-card-sargam" id="lessonNoteCardSargam">—</div>
      <div class="note-card-hole" id="lessonNoteCardHole">—</div>
    </div>

    <!-- Word indicator -->
    <div class="lesson-word" id="lessonWord"></div>

    <!-- Progress Strip -->
    <div class="progress-strip" id="lessonProgressStrip"></div>

    <!-- Action Buttons -->
    <div class="action-btns">
      <button class="btn-listen" id="lessonBtnListen">🎵 Suno Pehle</button>
      <button class="btn-start" id="lessonBtnStart">🎙 Shuru Karo</button>
    </div>

    <!-- Live Detection -->
    <div class="detect-box">
      <div class="detect-ring-wrap">
        <div class="detect-ring" id="lessonDetectRing">
          <div class="detect-note" id="lessonDetectNote">—</div>
        </div>
      </div>
      <div class="detect-status" id="lessonDetectStatus">Hissa chunno aur shuru karo</div>
    </div>

    <!-- Signal Bar -->
    <div class="signal-bar-wrap">
      <div class="signal-bar-header">
        <span class="signal-label-title">App Ki Awaaz</span>
        <span class="signal-label" id="lessonSignalLabel">Start playing...</span>
      </div>
      <div class="signal-track">
        <div class="signal-fill" id="lessonSignalBar" style="width:0%"></div>
      </div>
    </div>

    <!-- Hissa Result Card — shown after hissa complete -->
    <div class="hissa-result" id="hissaResult" style="display:none">
      <div class="hissa-result-stars" id="hissaResultStars"></div>
      <div class="hissa-result-msg" id="hissaResultMsg"></div>
      <div class="hissa-result-detail" id="hissaResultDetail"></div>

      <!-- AI Ustaad Panel -->
      <div class="ai-panel" id="aiPanel">
        <div class="ai-panel-header">
          <span class="ai-dot"></span>
          <span class="ai-label">🎓 AI Ustaad</span>
          <span class="ai-credits-badge" id="aiCreditsDisplay"></span>
        </div>
        <div class="ai-info-text">Harmonica teacher — aapki galtiyan pakadta hai aur seedha feedback deta hai</div>
        <div class="ai-text" id="aiText">Hissa complete karo — AI feedback milega</div>
      </div>

      <div class="hissa-result-actions">
        <button class="btn-retry" id="btnRetryHissa">↩ Phir Se</button>
        <button class="btn-next-hissa" id="btnNextHissa">Agle Hisse →</button>
      </div>
    </div>
  `;

  bindHissaTabs();
  bindLessonButtons();
}

// ── Hissa Tabs ─────────────────────────────────────────────────────────
function bindHissaTabs() {
  document.querySelectorAll('.hissa-tab').forEach(tab => {
    tab.onclick = () => {
      const idx = parseInt(tab.dataset.hissa);
      stopLessonMic();
      loadHissa(idx);
    };
  });
}

// ── Load Hissa ─────────────────────────────────────────────────────────
function loadHissa(idx) {
  currentHissaIdx = idx;
  noteResults     = [];
  const hissa     = currentSong.lines[idx];
  currentNotes    = hissa.notes;

  // Update tab UI
  document.querySelectorAll('.hissa-tab').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });

  // Update lyric
  const lyricEl = document.getElementById('lessonLyric');
  if (lyricEl) lyricEl.textContent = hissa.lyric || hissa.label;

  // Reset UI
  document.getElementById('hissaResult').style.display = 'none';
  document.getElementById('lessonNoteCard').className  = 'note-card';
  resetLessonDetection();
  buildLessonProgressStrip(currentNotes);
  updateLessonNoteCard(currentNotes[0]);

  // Load notes into audio engine
  loadNotes(currentNotes, makeLessonCallbacks());
}

// ── Callbacks ──────────────────────────────────────────────────────────
function makeLessonCallbacks() {
  return {
    onFrame:          handleLessonFrame,
    onNoteCorrect:    handleLessonNoteCorrect,
    onNoteMiss:       handleLessonNoteMiss,
    onLessonComplete: handleHissaComplete
  };
}

// ── Lesson Buttons ─────────────────────────────────────────────────────
function bindLessonButtons() {
  document.getElementById('lessonBtnListen').onclick = () => {
    if (isMicOn) return;
    if (isPlayingRef()) { stopReference(); return; }
    playReference(currentNotes, (note, idx) => {
      updateLessonNoteCard(note);
      highlightLessonStrip(idx, 'ref');
      const wordEl = document.getElementById('lessonWord');
      if (wordEl) wordEl.textContent = note.w || '';
    });
  };

  document.getElementById('lessonBtnStart').onclick = async () => {
    if (isMicOn) {
      stopLessonMic();
      return;
    }
    const ok = await startMic();
    if (!ok) return;
    isMicOn = true;
    loadNotes(currentNotes, makeLessonCallbacks());
    buildLessonProgressStrip(currentNotes);
    updateLessonNoteCard(currentNotes[0]);

    document.getElementById('lessonBtnStart').textContent = '⏹ Ruko';
    document.getElementById('lessonBtnStart').classList.add('active');
    document.getElementById('lessonBtnListen').disabled   = true;
    document.getElementById('lessonNoteCard').classList.add('listening');
    document.getElementById('lessonDetectRing').classList.add('listening');
    document.getElementById('lessonDetectNote').className = 'detect-note listening';
    document.getElementById('lessonDetectStatus').textContent = 'Sun rahi hoon...';
  };
}

// ── Stop Mic ───────────────────────────────────────────────────────────
function stopLessonMic() {
  if (!isMicOn) return;
  stopMic();
  isMicOn = false;
  const startBtn = document.getElementById('lessonBtnStart');
  if (startBtn) { startBtn.textContent = '🎙 Shuru Karo'; startBtn.classList.remove('active'); startBtn.disabled = false; }
  const listenBtn = document.getElementById('lessonBtnListen');
  if (listenBtn) listenBtn.disabled = false;
  document.getElementById('lessonNoteCard')?.classList.remove('listening','correct','sloppy','wrong');
  document.getElementById('lessonDetectRing').className        = 'detect-ring';
  document.getElementById('lessonDetectNote').className        = 'detect-note';
  document.getElementById('lessonDetectNote').textContent      = '—';
  document.getElementById('lessonDetectStatus').textContent    = 'Shuru karo dabao...';
  updateLessonSignalBar(0, 0);
}

// ── Frame Handler ──────────────────────────────────────────────────────
function handleLessonFrame(data) {
  updateLessonSignalBar(data.confidence || 0, data.stability || 0);

  if (data.silent) {
    document.getElementById('lessonDetectNote').textContent   = '—';
    document.getElementById('lessonDetectNote').className     = 'detect-note listening';
    document.getElementById('lessonDetectStatus').textContent = 'Sun rahi hoon...';
    return;
  }

  document.getElementById('lessonDetectNote').textContent = data.sg;

  if (data.stability < 28) {
    document.getElementById('lessonDetectNote').className     = 'detect-note wrong';
    document.getElementById('lessonDetectStatus').textContent = 'Focus your lips on one hole only';
    return;
  }

  document.getElementById('lessonDetectNote').className     = 'detect-note listening';
  document.getElementById('lessonDetectStatus').textContent = 'Sun rahi hoon...';
}

// ── Note Correct ───────────────────────────────────────────────────────
function handleLessonNoteCorrect(data) {
  playDing();
  noteResults[data.idx] = data.outcome;

  const dots = document.querySelectorAll('#lessonProgressStrip .strip-dot');
  if (dots[data.idx]) {
    dots[data.idx].classList.remove('current','ref');
    dots[data.idx].classList.add(data.outcome);
  }

  const nextIdx = data.idx + 1;
  if (nextIdx < currentNotes.length) {
    if (dots[nextIdx]) dots[nextIdx].classList.add('current');
    updateLessonNoteCard(currentNotes[nextIdx]);
    const wordEl = document.getElementById('lessonWord');
    if (wordEl) wordEl.textContent = currentNotes[nextIdx].w || '';

    const card = document.getElementById('lessonNoteCard');
    card.classList.remove('listening','wrong','sloppy','correct');
    card.classList.add(data.outcome === 'clean' ? 'correct' : 'sloppy');
    setTimeout(() => {
      card.classList.remove('correct','sloppy');
      card.classList.add('listening');
    }, 350);
  }

  const ring = document.getElementById('lessonDetectRing');
  ring.classList.remove('listening','wrong');
  ring.classList.add('correct');
  document.getElementById('lessonDetectNote').className     = 'detect-note correct';
  document.getElementById('lessonDetectStatus').textContent = 'Sahi! ✓';
  setTimeout(() => {
    ring.classList.remove('correct');
    ring.classList.add('listening');
    document.getElementById('lessonDetectNote').className     = 'detect-note listening';
    document.getElementById('lessonDetectStatus').textContent = 'Sun rahi hoon...';
  }, 400);
}

// ── Note Miss ──────────────────────────────────────────────────────────
function handleLessonNoteMiss(data) {
  const card = document.getElementById('lessonNoteCard');
  card.classList.remove('listening','correct','sloppy');
  card.classList.add('wrong');
  setTimeout(() => { card.classList.remove('wrong'); card.classList.add('listening'); }, 320);

  document.getElementById('lessonDetectNote').className     = 'detect-note wrong';
  document.getElementById('lessonDetectRing').classList.add('wrong');
  document.getElementById('lessonDetectStatus').textContent = `Got ${data.got} — need ${data.need}`;
  setTimeout(() => {
    document.getElementById('lessonDetectRing').classList.remove('wrong');
    document.getElementById('lessonDetectRing').classList.add('listening');
    document.getElementById('lessonDetectNote').className = 'detect-note listening';
  }, 400);
}

// ── Hissa Complete ─────────────────────────────────────────────────────
async function handleHissaComplete() {
  stopLessonMic();

  const total  = currentNotes.length;
  const clean  = noteResults.filter(r => r === 'clean').length;
  const sloppy = noteResults.filter(r => r === 'sloppy').length;
  const miss   = total - clean - sloppy;
  const hit    = clean + sloppy;
  const stars  = miss === 0 && sloppy === 0 ? 3 : miss === 0 ? 2 : 1;

  // Save stars for this hissa
  hissaResults[currentHissaIdx] = stars;

  // Update hissa tab star
  const starEl = document.getElementById(`hissaStar${currentHissaIdx}`);
  if (starEl) starEl.textContent = stars === 3 ? '⭐⭐⭐' : stars === 2 ? '⭐⭐' : '⭐';

  // Show result card
  const resultCard = document.getElementById('hissaResult');
  resultCard.style.display = 'block';

  document.getElementById('hissaResultStars').textContent =
    stars === 3 ? '⭐⭐⭐' : stars === 2 ? '⭐⭐' : '⭐';
  document.getElementById('hissaResultMsg').textContent =
    stars === 3 ? 'Wah! Ekdum sahi!' : stars === 2 ? 'Achha tha! Ek baar aur karo.' : 'Koshish jaari rakho!';
  document.getElementById('hissaResultDetail').textContent =
    `${hit} out of ${total} notes · ${clean} perfect · ${sloppy} good · ${miss} missed`;

  // Wire retry and next buttons
  document.getElementById('btnRetryHissa').onclick = () => loadHissa(currentHissaIdx);
  const isLast = currentHissaIdx >= currentSong.lines.length - 1;
  const nextBtn = document.getElementById('btnNextHissa');
  nextBtn.textContent = isLast ? '🎉 Song Complete!' : 'Agle Hisse →';
  nextBtn.onclick = () => {
    if (isLast) showSongComplete();
    else loadHissa(currentHissaIdx + 1);
  };

  // AI Ustaad
  await runAIUstaad(clean, sloppy, miss, total, noteResults);

  resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Constants ──────────────────────────────────────────────────────────
const MASTER_WA    = '917992414776';
const GROQ_DAILY_LIMIT = 14400;
const GROQ_ALERT_AT    = 13000; // 90% — alert threshold

// ── AI Ustaad ──────────────────────────────────────────────────────────
async function runAIUstaad(clean, sloppy, miss, total, results) {
  const credits    = userData?.subscription?.aiCreditsRemaining || 0;
  const creditsEl  = document.getElementById('aiCreditsDisplay');
  const textEl     = document.getElementById('aiText');
  const panelEl    = document.getElementById('aiPanel');

  // ── Show credit badge with color ──────────────────────────────────────
  if (creditsEl) {
    if (credits <= 0) {
      creditsEl.textContent = '0 credits';
      creditsEl.className   = 'ai-credits-badge zero';
    } else if (credits <= 2) {
      creditsEl.textContent = `⚠️ ${credits} credit${credits === 1 ? '' : 's'} bacha`;
      creditsEl.className   = 'ai-credits-badge low';
    } else {
      creditsEl.textContent = `${credits} credits`;
      creditsEl.className   = 'ai-credits-badge ok';
    }
  }

  // ── No credits — show WhatsApp buy button ─────────────────────────────
  if (credits <= 0) {
    const waMsg = encodeURIComponent(
      `Namaste Shubham! Main HarmonicaGuru mein aur AI credits kharidna chahta hoon.\nMera account: ${currentUser?.email}\nKaunsa pack available hai?`
    );
    if (textEl) textEl.innerHTML = `
      <div class="ai-zero-state">
        <div class="ai-zero-msg">AI Ustaad ke credits khatam ho gaye 😔</div>
        <div class="ai-zero-sub">Nayi pack lo aur seekhna jaari rakho</div>
        <div class="ai-zero-options">
          <div class="ai-zero-option">5 credits — ₹19</div>
          <div class="ai-zero-option">20 credits — ₹49</div>
          <div class="ai-zero-option best-val">60 credits — ₹99 ⭐</div>
        </div>
        <a href="https://wa.me/${MASTER_WA}?text=${waMsg}"
           target="_blank" class="btn-ai-buy">
          💬 WhatsApp pe credits lo
        </a>
      </div>`;
    return;
  }

  // ── Loading state ─────────────────────────────────────────────────────
  if (textEl) textEl.innerHTML = `
    <div class="ai-loading-wrap">
      <span class="ai-loading-dot"></span>
      <span class="ai-loading-dot"></span>
      <span class="ai-loading-dot"></span>
      <span class="ai-loading-text">AI Ustaad soch raha hai...</span>
    </div>`;

  const hissa     = currentSong.lines[currentHissaIdx];
  const noteLines = results.map((r, i) => {
    const note = hissa.notes[i];
    if (!note) return '';
    if (r === 'clean')  return `${note.sg}: hit correctly`;
    if (r === 'sloppy') return `${note.sg}: reached but wavered`;
    return `${note.sg}: missed`;
  }).filter(Boolean).join(' | ');

  const quality = clean >= Math.ceil(total * 0.75) && miss === 0
    ? `Good overall — ${clean}/${total} clean hits.`
    : `Needs work — ${clean} clean, ${sloppy} sloppy, ${miss} missed out of ${total}.`;

  const prompt = `Student played "${hissa.lyric}" (${hissa.label} of ${currentSong.name}).
Note results: ${noteLines}.
${quality}
Give one sentence of feedback — direct, specific, encouraging when deserved. Use sargam note names. Maximum 20 words.`;

  try {
    // ── Cache check ───────────────────────────────────────────────────
    const cacheKey = `aiCache_${currentSong.id}_${currentHissaIdx}_${clean}_${sloppy}_${miss}`;
    const cached   = sessionStorage.getItem(cacheKey);
    if (cached) {
      if (textEl) textEl.innerHTML = `
        <div class="ai-feedback-wrap">
          <div class="ai-feedback-text">${cached}</div>
          <div class="ai-cached-tag">⚡ Cached</div>
        </div>`;
      return;
    }

    // ── Groq API call ─────────────────────────────────────────────────
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        max_tokens:  80,
        temperature: 0.3,
        messages: [
          { role: 'system', content: `You are a professional harmonica teacher. Give exactly ONE sentence, maximum 20 words. Be direct and specific. Use sargam note names (Sa Re Ga Ma Pa Dha Ni). Never mention cents or Hz.` },
          { role: 'user',   content: prompt }
        ]
      })
    });

    // ── Handle Groq rate limit separately ────────────────────────────
    if (res.status === 429) {
      if (textEl) textEl.innerHTML = `
        <div class="ai-busy-state">
          <div class="ai-busy-msg">🎵 AI Ustaad thoda busy hai</div>
          <div class="ai-busy-sub">Yeh free service hai — thodi der mein wapas aao. Aapka credit safe hai.</div>
        </div>`;
      await checkAndSendGroqAlert();
      return;
    }

    const data     = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Groq error');
    const feedback = (data.choices?.[0]?.message?.content || '').trim();

    // ── Show feedback ─────────────────────────────────────────────────
    sessionStorage.setItem(cacheKey, feedback);
    if (textEl) textEl.innerHTML = `
      <div class="ai-feedback-wrap">
        <div class="ai-feedback-text">${feedback}</div>
        <div class="ai-powered-tag">✨ AI Powered</div>
      </div>`;

    // ── Deduct credit + track usage — separate try/catch so errors here
    // don't show the "internet" error message to user
    if (currentUser) {
      try {
        const newCredits = credits - 1;
        const userRef    = doc(db, 'users', currentUser.uid);

        await updateDoc(userRef, {
          'subscription.aiCreditsRemaining': newCredits,
          'aiCallsTotal':                    increment(1),
          'aiCallsThisMonth':                increment(1),
        });

        // Update admin stats
        await trackAICallInAdmin();

        // Update local state
        userData.subscription.aiCreditsRemaining = newCredits;
        if (creditsEl) {
          if (newCredits <= 0) {
            creditsEl.textContent = '0 credits';
            creditsEl.className   = 'ai-credits-badge zero';
          } else if (newCredits <= 2) {
            creditsEl.textContent = `⚠️ ${newCredits} credit${newCredits === 1 ? '' : 's'} bacha`;
            creditsEl.className   = 'ai-credits-badge low';
          } else {
            creditsEl.textContent = `${newCredits} credits`;
            creditsEl.className   = 'ai-credits-badge ok';
          }
        }

        // Update token pill in header
        document.querySelectorAll('.token-pill').forEach(p => {
          p.textContent      = `🤖 ${newCredits}`;
          p.style.background = newCredits === 0 ? '#dc2626' : '#F4600C';
        });

        // Low credits warning — 1 or 2 left
        if (newCredits > 0 && newCredits <= 2) {
          const waMsg = encodeURIComponent(
            `Namaste Shubham! Mere HarmonicaGuru AI credits sirf ${newCredits} bache hain. Nayi pack lena chahta hoon.\nMera account: ${currentUser?.email}`
          );
          setTimeout(() => {
            const lowDiv = document.createElement('div');
            lowDiv.className = 'ai-low-warning';
            lowDiv.innerHTML = `
              ⚠️ Sirf ${newCredits} credit${newCredits === 1 ? '' : 's'} bacha hai —
              <a href="https://wa.me/${MASTER_WA}?text=${waMsg}" target="_blank">abhi lo →</a>`;
            panelEl?.appendChild(lowDiv);
          }, 1000);
        }
      } catch(creditErr) {
        // Credit deduction failed — log but don't show error to user
        // Feedback was already shown successfully above
        console.warn('Credit deduction error:', creditErr);
      }
    }

  } catch(e) {
    console.warn('Groq error:', e);
    if (textEl) textEl.innerHTML = `
      <div class="ai-busy-state">
        <div class="ai-busy-msg">🎵 AI Ustaad se connect nahi ho paya</div>
        <div class="ai-busy-sub">Internet check karo aur dobara try karo. Credit deduct nahi hua.</div>
      </div>`;
  }
}

// ── Track AI call in admin Firestore ──────────────────────────────────
async function trackAICallInAdmin() {
  try {
    const { setDoc, serverTimestamp } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const today    = new Date().toISOString().slice(0, 10);
    const statsRef = doc(db, 'admin', 'aiStats');
    const dayRef   = doc(db, 'admin', `aiDay_${today}`);

    // Overall stats
    await setDoc(statsRef, {
      totalCallsAllTime: increment(1),
      lastCallAt:        serverTimestamp(),
      lastCallBy:        currentUser?.email || 'unknown',
    }, { merge: true });

    // Per-day stats
    await setDoc(dayRef, {
      date:       today,
      totalCalls: increment(1),
      lastCallAt: serverTimestamp(),
    }, { merge: true });

    // Check if alert needed
    const { getDoc: gd } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const daySnap = await gd(dayRef);
    const calls   = daySnap.data()?.totalCalls || 0;
    if (calls >= GROQ_ALERT_AT) await checkAndSendGroqAlert(calls);

  } catch(e) {
    console.warn('Admin tracking error:', e);
  }
}

// ── Groq limit alert — WhatsApp to Shubham ────────────────────────────
async function checkAndSendGroqAlert(calls = 0) {
  try {
    const { getDoc: gd, setDoc: sd, serverTimestamp: st } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const today      = new Date().toISOString().slice(0, 10);
    const alertRef   = doc(db, 'admin', `groqAlert_${today}`);
    const alertSnap  = await gd(alertRef);

    // Only send once per day
    if (alertSnap.exists()) return;

    // Mark alert sent
    await sd(alertRef, { sentAt: st(), calls });

    // Open WhatsApp alert to Shubham
    const msg = encodeURIComponent(
      `🚨 HarmonicaGuru ALERT: Groq AI calls aaj ${calls}/${GROQ_DAILY_LIMIT} ho gaye hain (90% limit). Groq credits refill karo: console.groq.com`
    );
    window.open(`https://wa.me/${MASTER_WA}?text=${msg}`, '_blank');

  } catch(e) {
    console.warn('Alert error:', e);
  }
}

// ── Song Complete ──────────────────────────────────────────────────────
function showSongComplete() {
  const allStars = hissaResults.every(s => s === 3);
  const anyMiss  = hissaResults.some(s => s === 1);
  const resultCard = document.getElementById('hissaResult');

  document.getElementById('hissaResultStars').textContent =
    allStars ? '🎉⭐⭐⭐🎉' : anyMiss ? '🎶⭐🎶' : '🎵⭐⭐🎵';
  document.getElementById('hissaResultMsg').textContent =
    allStars ? `${currentSong.name} ekdum sahi bajaya! Ustaad ho gaye!`
    : anyMiss ? `${currentSong.name} complete! Thodi aur practice karo.`
    : `${currentSong.name} complete! Bahut achha!`;
  document.getElementById('hissaResultDetail').textContent =
    hissaResults.map((s, i) => `Hissa ${i+1}: ${'⭐'.repeat(s)}`).join('  ');

  document.getElementById('btnRetryHissa').textContent = '↩ Start Over';
  document.getElementById('btnRetryHissa').onclick     = () => {
    hissaResults = new Array(currentSong.lines.length).fill(null);
    document.querySelectorAll('.hissa-star').forEach(el => el.textContent = '');
    loadHissa(0);
  };
  document.getElementById('btnNextHissa').style.display = 'none';
  resultCard.style.display = 'block';
}

// ── Note Card ──────────────────────────────────────────────────────────
function updateLessonNoteCard(note) {
  if (!note) return;
  document.getElementById('lessonNoteCardSargam').textContent = note.sg;
  const holeNum = harmonicaType === 'tower' && note.towerHole
    ? note.towerHole : note.hole;
  document.getElementById('lessonNoteCardHole').textContent = `Hole ${holeNum}`;
  const band   = document.getElementById('lessonNoteCardBand');
  const isBlow = note.bd.includes('Blow');
  band.textContent = note.bd;
  band.className   = 'note-card-band ' + (isBlow ? 'blow' : 'draw');
  band.style.background = '';
  band.style.color      = '';
  const wordEl = document.getElementById('lessonWord');
  if (wordEl) wordEl.textContent = note.w || '';
}

// ── Progress Strip ─────────────────────────────────────────────────────
function buildLessonProgressStrip(notes) {
  const strip = document.getElementById('lessonProgressStrip');
  if (!strip) return;
  strip.innerHTML = '';
  notes.forEach((note, i) => {
    const dot = document.createElement('div');
    dot.className = 'strip-dot' + (i === 0 ? ' current' : '');
    dot.innerHTML = `
      <span class="strip-sg">${note.sg.replace(/[',]/g, '')}</span>
      <span class="strip-bd">${note.bd.includes('Blow') ? '↑' : '↓'}</span>
    `;
    strip.appendChild(dot);
  });
}

function highlightLessonStrip(idx, cls) {
  document.querySelectorAll('#lessonProgressStrip .strip-dot').forEach((d, i) => {
    d.classList.remove('current','ref');
    if (i === idx) d.classList.add(cls);
  });
}

// ── Reset Detection ────────────────────────────────────────────────────
function resetLessonDetection() {
  document.getElementById('lessonDetectNote').textContent   = '—';
  document.getElementById('lessonDetectNote').className     = 'detect-note';
  document.getElementById('lessonDetectRing').className     = 'detect-ring';
  document.getElementById('lessonDetectStatus').textContent = 'Shuru karo dabao...';
  document.getElementById('lessonNoteCard').className       = 'note-card';
  updateLessonSignalBar(0, 0);
}

// ── Signal Bar ─────────────────────────────────────────────────────────
function updateLessonSignalBar(confidence, stability) {
  const bar   = document.getElementById('lessonSignalBar');
  const label = document.getElementById('lessonSignalLabel');
  if (!bar || !label) return;

  if (confidence === 0 && stability === 0) {
    bar.style.width      = '0%';
    bar.style.background = 'var(--muted)';
    label.textContent    = 'Start playing...';
    label.style.color    = 'var(--muted)';
    return;
  }

  const pct    = Math.round((confidence * 0.5) + (stability * 0.5));
  const isGood = stability >= 65 && confidence >= 60;
  const isMed  = stability >= 35 || confidence >= 40;

  bar.style.width = pct + '%';
  if (isGood) {
    bar.style.background = 'var(--green)';
    label.textContent    = 'App is hearing you clearly ✓';
    label.style.color    = 'var(--green)';
  } else if (isMed) {
    bar.style.background = 'var(--gold)';
    label.textContent    = 'Play a bit stronger or cover one hole';
    label.style.color    = 'var(--gold)';
  } else {
    bar.style.background = '#dc2626';
    label.textContent    = 'Focus your lips on one hole only';
    label.style.color    = '#dc2626';
  }
}

// ── Stop mic on back button event ─────────────────────────────────────
document.addEventListener('stopLessonMic', () => stopLessonMic());
