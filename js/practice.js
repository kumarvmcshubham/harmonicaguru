// js/practice.js
// HarmonicaGuru — Sargam Practice Screen

import {
  getSargamScale, getOctaveLabel
} from '../assets/data/lessons.js';
import {
  startMic, stopMic, loadNotes, setKey,
  playReference, stopReference, isPlayingRef, playDing
} from './audio.js';
import {
  startCounting, stopCounting,
  getTimerDisplayText, getTimerColorClass, isLimitReached
} from './timer.js';
import { speakTimerWarning } from './voice.js';
import { isSubscriptionActive } from './auth.js';

// ── State ─────────────────────────────────────────────────────────────
let currentMode      = 'scale';
let currentGroup     = 0;
let currentDirection = 'up';
let currentNotes     = [];
let noteResults      = [];
let isMicOn          = false;
let selectedKey      = 'C';
let harmonicaType    = 'diatonic';
let towerOctave      = 'middle';
let onUnlockRequest  = null;
let lastOctave       = null;
let timerWarningFired = false;

// ── Init ──────────────────────────────────────────────────────────────
export function initPractice(key, hType, userData, unlockCallback) {
  selectedKey      = key;
  harmonicaType    = hType || 'diatonic';
  onUnlockRequest  = unlockCallback;
  setKey(key);

  currentMode       = 'scale';
  currentGroup      = 0;
  currentDirection  = 'up';
  towerOctave       = 'middle';
  noteResults       = [];
  lastOctave        = null;
  timerWarningFired = false;

  const octaveRow = document.getElementById('towerOctaveRow');
  if (octaveRow) {
    octaveRow.style.display = harmonicaType === 'tower' ? 'flex' : 'none';
  }

  bindModeTabs(userData);
  bindActionButtons();
  bindGroupControls();
  bindOctaveButtons();

  currentNotes = getSargamScale(harmonicaType, towerOctave);
  loadNotes(currentNotes, makeCallbacks());
  buildProgressStrip(currentNotes);
  updateNoteCard(currentNotes[0]);
  resetDetectionUI();

  document.getElementById('groupSelector').style.display = 'none';
  document.querySelectorAll('.mode-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === 'scale');
  });

  updateTimerDisplay();
  if (isLimitReached()) showPaywall();
}

// ── Callbacks ──────────────────────────────────────────────────────────
function makeCallbacks() {
  return {
    onFrame:          handleFrame,
    onNoteCorrect:    handleNoteCorrect,
    onNoteMiss:       handleNoteMiss,
    onLessonComplete: handleLessonComplete
  };
}

// ── Stars calculation ──────────────────────────────────────────────────
function calcStars(results, total) {
  const clean  = results.filter(r => r === 'clean').length;
  const sloppy = results.filter(r => r === 'sloppy').length;
  const miss   = total - clean - sloppy;

  if (miss === 0 && sloppy === 0) return 3;
  if (miss === 0)                 return 2;
  return 1;
}

function starsDisplay(stars) {
  if (stars === 3) return '⭐⭐⭐';
  if (stars === 2) return '⭐⭐';
  return '⭐';
}

function starsMessage(stars) {
  if (stars === 3) return 'Ekdum sahi! Wah!';
  if (stars === 2) return 'Achha tha! Ek baar aur karo.';
  return 'Koshish jaari rakho!';
}

// ── Timer ──────────────────────────────────────────────────────────────
function updateTimerDisplay() {
  const el = document.getElementById('practiceTimerText');
  if (!el) return;
  el.textContent = getTimerDisplayText();
  el.className   = getTimerColorClass();
}

function showPaywall() {
  document.getElementById('timerPaywall').style.display = 'block';
  const btn = document.getElementById('btnStart');
  if (btn) { btn.disabled = true; btn.textContent = 'Aaj ka session khatam'; }
}

// ── Octave Buttons ─────────────────────────────────────────────────────
function bindOctaveButtons() {
  document.querySelectorAll('.octave-btn').forEach(btn => {
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.onclick = () => {
      stopMicIfOn();
      towerOctave = fresh.dataset.octave;
      document.querySelectorAll('.octave-btn').forEach(b => b.classList.remove('active'));
      fresh.classList.add('active');
      reloadLesson();
    };
  });
}

// ── Mode Tabs ──────────────────────────────────────────────────────────
function bindModeTabs(userData) {
  const groupsUnlocked = isSubscriptionActive(userData) || userData?.sargamGroupsUnlocked || false;

  document.querySelectorAll('.mode-tab').forEach(tab => {
    const mode = tab.dataset.mode;

    if (mode === 'scale') {
      tab.onclick = () => {
        stopMicIfOn();
        currentMode  = 'scale';
        currentGroup = 0;
        noteResults  = [];
        document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('groupSelector').style.display = 'none';
        reloadLesson();
      };
      return;
    }

    // Update visual lock state
    if (groupsUnlocked) {
      tab.classList.remove('locked');
      tab.textContent = mode === 'two' ? '2-Note' : mode === 'three' ? '3-Note' : '4-Note';
    } else {
      tab.classList.add('locked');
      tab.textContent = mode === 'two' ? '2-Note 🔒' : mode === 'three' ? '3-Note 🔒' : '4-Note 🔒';
    }

    // Set onclick directly — no cloneNode
    tab.onclick = () => {
      if (!groupsUnlocked) {
        onUnlockRequest('sargamGroups');
        return;
      }
      stopMicIfOn();
      currentMode  = mode;
      currentGroup = 0;
      noteResults  = [];
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('groupSelector').style.display = 'none';
      reloadLesson();
    };
  });
}

// ── Reload Lesson ──────────────────────────────────────────────────────
function reloadLesson() {
  noteResults       = [];
  lastOctave        = null;
  timerWarningFired = false;

  if (currentMode === 'scale') {
    const base = getSargamScale(harmonicaType, towerOctave);
    if (currentDirection === 'down') {
      currentNotes = [...base].reverse();
    } else if (currentDirection === 'both') {
      currentNotes = [...base, ...[...base].reverse()];
    } else {
      currentNotes = [...base];
    }
  } else {
    // Build continuous sliding sequence from all groups
    currentNotes = buildSlidingSequence(currentMode, currentDirection);
  }

  loadNotes(currentNotes, makeCallbacks());
  buildProgressStrip(currentNotes);
  updateNoteCard(currentNotes[0]);
  resetDetectionUI();
}

// ── Build Sliding Sequence ─────────────────────────────────────────────
// Generates one continuous note array from sliding groups
// e.g. 2-note up: Sa Re Re Ga Ga Ma Ma Pa Pa Dha Dha Ni Ni Sa'
// Each pair/triplet/quad overlaps with next group
function buildSlidingSequence(mode, direction) {
  const scale = getSargamScale(harmonicaType, towerOctave);

  let windowSize = mode === 'two' ? 2 : mode === 'three' ? 3 : 4;

  // Build sliding windows from the scale
  const windows = [];
  for (let i = 0; i <= scale.length - windowSize; i++) {
    windows.push(scale.slice(i, i + windowSize));
  }

  if (direction === 'down') {
    // Reverse each window and reverse order of windows
    const downWindows = [...windows].reverse().map(w => [...w].reverse());
    return downWindows.flat();
  } else if (direction === 'both') {
    const upFlat   = windows.flat();
    const downFlat = [...windows].reverse().map(w => [...w].reverse()).flat();
    return [...upFlat, ...downFlat];
  } else {
    // Up — just flatten all windows
    return windows.flat();
  }
}

// ── Group Selector ─────────────────────────────────────────────────────
function buildGroupSelector(groups) {
  const scroll = document.getElementById('groupScroll');
  scroll.innerHTML = '';
  groups.forEach((g, i) => {
    const btn = document.createElement('button');
    btn.className   = 'group-btn' + (i === currentGroup ? ' active' : '');
    btn.textContent = g.name;
    btn.onclick = () => {
      stopMicIfOn();
      currentGroup = i;
      document.querySelectorAll('.group-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reloadLesson();
    };
    scroll.appendChild(btn);
  });
}

// ── Direction Toggle ───────────────────────────────────────────────────
function bindGroupControls() {
  // Group direction buttons
  document.querySelectorAll('.dir-btn[data-dir]').forEach(btn => {
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.onclick = () => {
      stopMicIfOn();
      currentDirection = fresh.dataset.dir;
      document.querySelectorAll('#groupSelector .dir-btn').forEach(b => b.classList.remove('active'));
      fresh.classList.add('active');
      reloadLesson();
    };
  });

  // Scale direction buttons
  document.querySelectorAll('.dir-btn[data-scale-dir]').forEach(btn => {
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.onclick = () => {
      stopMicIfOn();
      currentDirection = fresh.dataset.scaleDir;
      document.querySelectorAll('#scaleDirRow .dir-btn').forEach(b => b.classList.remove('active'));
      fresh.classList.add('active');
      reloadLesson();
    };
  });
}

// ── Action Buttons ─────────────────────────────────────────────────────
function bindActionButtons() {
  const listenBtn = document.getElementById('btnListen');
  const startBtn  = document.getElementById('btnStart');
  const freshL    = listenBtn.cloneNode(true);
  const freshS    = startBtn.cloneNode(true);
  listenBtn.parentNode.replaceChild(freshL, listenBtn);
  startBtn.parentNode.replaceChild(freshS, startBtn);

  freshL.onclick = () => {
    if (isMicOn) return;
    if (isPlayingRef()) { stopReference(); resetNoteCardFromRef(); return; }
    playReference(currentNotes, (note, idx) => {
      updateNoteCard(note);
      highlightStripDot(idx, 'ref');
    });
  };

  freshS.onclick = async () => {
    if (isMicOn) {
      stopMicIfOn();
    } else {
      if (isLimitReached()) { showPaywall(); return; }
      const ok = await startMic();
      if (!ok) return;

      isMicOn = true;
      loadNotes(currentNotes, makeCallbacks());
      buildProgressStrip(currentNotes);
      updateNoteCard(currentNotes[0]);

      document.getElementById('btnStart').textContent = '⏹ Ruko';
      document.getElementById('btnStart').classList.add('active');
      document.getElementById('btnListen').disabled = true;
      document.getElementById('noteCard').classList.add('listening');
      document.getElementById('detectRing').classList.add('listening');
      document.getElementById('detectNote').className     = 'detect-note listening';
      document.getElementById('detectNote').textContent   = '—';
      document.getElementById('detectStatus').textContent = 'Sun rahi hoon...';

      startCounting(
        (text, colorClass) => {
          const el = document.getElementById('practiceTimerText');
          if (el) { el.textContent = text; el.className = colorClass; }
          if (!timerWarningFired && getSecondsFromText(text) <= 120) {
            timerWarningFired = true;
            speakTimerWarning();
          }
        },
        () => { stopMicIfOn(); showPaywall(); }
      );
    }
  };
}

function getSecondsFromText(text) {
  const match = text.match(/(\d+):(\d+)/);
  if (!match) return 9999;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

// ── Stop Mic ───────────────────────────────────────────────────────────
function stopMicIfOn() {
  if (!isMicOn) return;
  stopMic();
  stopCounting();
  isMicOn = false;

  const startBtn = document.getElementById('btnStart');
  if (startBtn) {
    startBtn.textContent = '🎙 Shuru Karo';
    startBtn.classList.remove('active');
    startBtn.disabled = false;
  }
  const listenBtn = document.getElementById('btnListen');
  if (listenBtn) listenBtn.disabled = false;

  document.getElementById('noteCard')?.classList.remove('listening','correct','sloppy','wrong');
  document.getElementById('detectRing').className     = 'detect-ring';
  document.getElementById('detectNote').className     = 'detect-note';
  document.getElementById('detectNote').textContent   = '—';
  document.getElementById('detectStatus').textContent = 'Shuru karo dabao...';
  updateSignalBar(0, 0);
}

function resetNoteCardFromRef() {
  if (currentNotes.length > 0) updateNoteCard(currentNotes[0]);
  buildProgressStrip(currentNotes);
}

function resetDetectionUI() {
  document.getElementById('detectNote').textContent   = '—';
  document.getElementById('detectNote').className     = 'detect-note';
  document.getElementById('detectRing').className     = 'detect-ring';
  document.getElementById('detectStatus').textContent = 'Shuru karo dabao...';
  document.getElementById('noteCard').className       = 'note-card';
  updateSignalBar(0, 0);
}

// ── Signal Bar ─────────────────────────────────────────────────────────
function updateSignalBar(confidence, stability) {
  const bar   = document.getElementById('signalBar');
  const label = document.getElementById('signalLabel');
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

// ── Frame Handler ──────────────────────────────────────────────────────
function handleFrame(data) {
  updateSignalBar(data.confidence || 0, data.stability || 0);

  if (data.silent) {
    document.getElementById('detectNote').textContent   = '—';
    document.getElementById('detectNote').className     = 'detect-note listening';
    document.getElementById('detectStatus').textContent = 'Sun rahi hoon...';
    return;
  }

  document.getElementById('detectNote').textContent = data.sg;

  if (data.stability < 28) {
    document.getElementById('detectNote').className     = 'detect-note wrong';
    document.getElementById('detectStatus').textContent = 'Focus your lips on one hole only';
    return;
  }

  document.getElementById('detectNote').className     = 'detect-note listening';
  document.getElementById('detectStatus').textContent = 'Sun rahi hoon...';
}

// ── Note Correct ───────────────────────────────────────────────────────
function handleNoteCorrect(data) {
  playDing();
  noteResults[data.idx] = data.outcome;

  const dots = document.querySelectorAll('.strip-dot');
  if (dots[data.idx]) {
    dots[data.idx].classList.remove('current','ref');
    dots[data.idx].classList.add(data.outcome);
  }

  const nextIdx = data.idx + 1;
  if (nextIdx < currentNotes.length) {
    if (dots[nextIdx]) dots[nextIdx].classList.add('current');
    updateNoteCard(currentNotes[nextIdx]);

    const card = document.getElementById('noteCard');
    card.classList.remove('listening','wrong','sloppy','correct');
    card.classList.add(data.outcome === 'clean' ? 'correct' : 'sloppy');
    setTimeout(() => {
      card.classList.remove('correct','sloppy');
      card.classList.add('listening');
    }, 350);
  }

  const ring = document.getElementById('detectRing');
  ring.classList.remove('listening','wrong');
  ring.classList.add('correct');
  document.getElementById('detectNote').className     = 'detect-note correct';
  document.getElementById('detectStatus').textContent = 'Sahi! ✓';
  setTimeout(() => {
    ring.classList.remove('correct');
    ring.classList.add('listening');
    document.getElementById('detectNote').className     = 'detect-note listening';
    document.getElementById('detectStatus').textContent = 'Sun rahi hoon...';
  }, 400);
}

// ── Note Miss ──────────────────────────────────────────────────────────
function handleNoteMiss(data) {
  const card = document.getElementById('noteCard');
  card.classList.remove('listening','correct','sloppy');
  card.classList.add('wrong');
  setTimeout(() => {
    card.classList.remove('wrong');
    card.classList.add('listening');
  }, 320);

  document.getElementById('detectNote').className     = 'detect-note wrong';
  document.getElementById('detectRing').classList.add('wrong');
  document.getElementById('detectStatus').textContent = `Got ${data.got} — need ${data.need}`;
  setTimeout(() => {
    document.getElementById('detectRing').classList.remove('wrong');
    document.getElementById('detectRing').classList.add('listening');
    document.getElementById('detectNote').className = 'detect-note listening';
  }, 400);
}

// ── Lesson Complete ────────────────────────────────────────────────────
function handleLessonComplete() {
  stopMicIfOn();

  const total  = currentNotes.length;
  const clean  = noteResults.filter(r => r === 'clean').length;
  const sloppy = noteResults.filter(r => r === 'sloppy').length;
  const miss   = total - clean - sloppy;
  const stars  = calcStars(noteResults, total);
  const hit    = clean + sloppy;

  const card = document.getElementById('noteCard');
  card.className = 'note-card correct';

  const band = document.getElementById('noteCardBand');
  band.textContent      = starsMessage(stars);
  band.style.background = stars === 3 ? 'var(--green)' : stars === 2 ? 'var(--gold)' : '#dc2626';
  band.style.color      = 'white';

  document.getElementById('noteCardSargam').textContent = starsDisplay(stars);
  document.getElementById('noteCardHole').textContent   = `${hit} out of ${total} notes hit`;

  document.getElementById('detectNote').textContent     = stars === 3 ? '🎵' : stars === 2 ? '🎶' : '✊';
  document.getElementById('detectNote').className       = 'detect-note correct';
  document.getElementById('detectStatus').textContent   =
    `${clean} perfect · ${sloppy} good · ${miss} missed`;
}

// ── Update Note Card ───────────────────────────────────────────────────
function updateNoteCard(note) {
  document.getElementById('noteCardSargam').textContent = note.sg;

  const holeNum     = harmonicaType === 'tower' && note.towerHole
    ? note.towerHole : note.hole;
  const octaveLabel = getOctaveLabel(note.octave);
  document.getElementById('noteCardHole').textContent =
    octaveLabel ? `Hole ${holeNum} · ${octaveLabel}` : `Hole ${holeNum}`;

  const band   = document.getElementById('noteCardBand');
  const isBlow = note.bd.includes('Blow');
  band.textContent      = note.bd;
  band.className        = 'note-card-band ' + (isBlow ? 'blow' : 'draw');
  band.style.background = '';
  band.style.color      = '';

  if (note.octave && note.octave !== lastOctave) {
    if (lastOctave !== null) showOctaveBanner(octaveLabel, note.octave);
    lastOctave = note.octave;
  }
}

// ── Octave Banner ──────────────────────────────────────────────────────
function showOctaveBanner(label, octave) {
  let banner = document.getElementById('octaveBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id        = 'octaveBanner';
    banner.className = 'octave-banner';
    document.getElementById('noteCard').insertAdjacentElement('afterend', banner);
  }
  const arrow = (octave === 'lower' || octave === 'lower-end') ? '↓' : '↑';
  banner.textContent = `${arrow} ${label}`;
  banner.classList.add('visible');
  setTimeout(() => banner.classList.remove('visible'), 1600);
}

// ── Progress Strip ─────────────────────────────────────────────────────
function buildProgressStrip(notes) {
  const strip = document.getElementById('progressStrip');
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

function highlightStripDot(idx, cls) {
  document.querySelectorAll('.strip-dot').forEach((d, i) => {
    d.classList.remove('current','ref');
    if (i === idx) d.classList.add(cls);
  });
}

// ── Stop mic on back button event ─────────────────────────────────────
document.addEventListener('stopPracticeMic', () => stopMicIfOn());
