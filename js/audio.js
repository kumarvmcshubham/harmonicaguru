// js/audio.js
// HarmonicaGuru — Audio engine
// Constants and logic ported from hb-ai-coach-v4.html pilot — proven working

import { yin, getRMS } from './yin.js';

// ── Constants — ported exactly from pilot file ────────────────────────
const FFT               = 2048;  // was 4096 — smaller = faster, less latency
const LOOP_MS           = 35;    // was 30
const SILENCE           = 0.013;
const STAB_WIN          = 12;    // was 8 — wider stability window
const HOLD_FRAMES       = 7;     // was 4 — back to pilot value
const HIT_CENTS         = 35;    // was 65 — back to pilot, tighter tuning
const WRONG_FRAME_LIMIT = 15;    // was 8 — back to pilot value
const COOLDOWN_MS       = 450;   // was 380

const WN = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const SARGAM_MAP = {
  0:'Sa', 2:'Re', 4:'Ga', 5:'Ma',
  7:'Pa', 9:'Dha', 11:'Ni',
  1:'Re♭', 3:'Ga♭', 6:'Ma#', 8:'Dha♭', 10:'Ni♭'
};

// ── Audio State ───────────────────────────────────────────────────────
let actx      = null;
let analyser  = null;
let srcStream = null;
let buf       = null;
let loopTimer = null;
let isOn      = false;

// ── Lesson State ──────────────────────────────────────────────────────
let currentNotes       = [];
let currentNoteIdx     = 0;
let semitoneOffset     = 0;
let inCooldown         = false;
let prevSilent         = true;
let holdCount          = 0;
let wrongFrameCount    = 0;
let noteOnsetTime      = null;
let notePitchWhileHeld = [];
let lastNoteEndTime    = null;
let pitchHistory       = [];

// ── Callbacks ─────────────────────────────────────────────────────────
let onFrame          = null;
let onNoteCorrect    = null;
let onNoteMiss       = null;
let onLessonComplete = null;

// ── Key Transposition ─────────────────────────────────────────────────
const KEY_OFFSETS = {
  'C':0,'C#':1,'D':2,'D#':3,'E':4,
  'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11
};

export function setKey(key) {
  semitoneOffset = KEY_OFFSETS[key] || 0;
}

function expectedMidi(noteObj) {
  return noteObj.baseMidi + semitoneOffset;
}

// ── Hz to Note ────────────────────────────────────────────────────────
function hzToNote(hz) {
  const semi   = 12 * Math.log2(hz / 440);
  const midi   = Math.round(semi) + 69;
  const cents  = Math.round((semi - Math.round(semi)) * 100);
  const chroma = ((midi % 12) + 12) % 12;
  return { note: WN[chroma], midi, cents, chroma };
}

function detectedSargam(nd) {
  const rootChroma = ((semitoneOffset % 12) + 12) % 12;
  const interval   = ((nd.chroma - rootChroma) + 12) % 12;
  return SARGAM_MAP[interval] || nd.note;
}

// ── Stability — exact formula from pilot ──────────────────────────────
function computeStability(midi) {
  pitchHistory.push(midi);
  if (pitchHistory.length > STAB_WIN) pitchHistory.shift();
  if (pitchHistory.length < 3) return 100;
  const mean = pitchHistory.reduce((a,b) => a+b, 0) / pitchHistory.length;
  const v    = pitchHistory.reduce((a,b) => a + (b-mean)**2, 0) / pitchHistory.length;
  return Math.max(0, Math.round(100 - Math.sqrt(v) * 5));
}

function calcDrift(pitches) {
  if (pitches.length < 3) return 0;
  const mean = pitches.reduce((a,b) => a+b, 0) / pitches.length;
  const v    = pitches.reduce((a,b) => a + (b-mean)**2, 0) / pitches.length;
  return Math.sqrt(v);
}

// ── Load Notes ────────────────────────────────────────────────────────
export function loadNotes(notes, callbacks) {
  currentNotes       = notes;
  currentNoteIdx     = 0;
  inCooldown         = false;
  prevSilent         = true;
  holdCount          = 0;
  wrongFrameCount    = 0;
  noteOnsetTime      = null;
  notePitchWhileHeld = [];
  lastNoteEndTime    = null;
  pitchHistory       = [];

  onFrame          = callbacks.onFrame          || null;
  onNoteCorrect    = callbacks.onNoteCorrect    || null;
  onNoteMiss       = callbacks.onNoteMiss       || null;
  onLessonComplete = callbacks.onLessonComplete || null;
}

export function getCurrentNoteIdx() { return currentNoteIdx; }
export function isRunning()         { return isOn; }

// ── Start Mic ─────────────────────────────────────────────────────────
export async function startMic() {
  if (isOn) return true;
  try {
    srcStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl:  false
      }
    });
    actx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
    analyser = actx.createAnalyser();
    analyser.fftSize = FFT;
    analyser.smoothingTimeConstant = 0;
    actx.createMediaStreamSource(srcStream).connect(analyser);
    buf  = new Float32Array(FFT);
    isOn = true;
    prevSilent = true;
    loop();
    return true;
  } catch(e) {
    if (e.name === 'NotAllowedError') {
      alert('Mic ka permission do — settings mein jaao aur HarmonicaGuru ko allow karo');
    } else {
      alert('Mic error: ' + e.message);
    }
    return false;
  }
}

// ── Stop Mic ──────────────────────────────────────────────────────────
export function stopMic() {
  isOn = false;
  clearTimeout(loopTimer);
  if (srcStream) srcStream.getTracks().forEach(t => t.stop());
  if (actx)      actx.close();
  actx = null; srcStream = null; analyser = null; buf = null;
}

// ── Reference Playback ────────────────────────────────────────────────
let refActx    = null;
let refPlaying = false;

export function playReference(notes, onNoteRef) {
  if (isOn) return;
  if (refPlaying) { stopReference(); return; }

  refActx    = new (window.AudioContext || window.webkitAudioContext)();
  const ctx  = refActx;
  refPlaying = true;

  const GAP_S = 0.055;
  let t = ctx.currentTime + 0.1;

  notes.forEach((note, idx) => {
    const expMidi = expectedMidi(note);
    const hz      = 440 * Math.pow(2, (expMidi - 69) / 12);
    const durS    = note.durMs ? note.durMs / 1000 : 0.6;
    const soundS  = Math.max(0.04, durS - GAP_S);

    const osc1 = ctx.createOscillator();
    osc1.type  = 'sawtooth';
    osc1.frequency.setValueAtTime(hz, t);
    osc1.detune.setValueAtTime(12, t);

    const osc2 = ctx.createOscillator();
    osc2.type  = 'sawtooth';
    osc2.frequency.setValueAtTime(hz, t);
    osc2.detune.setValueAtTime(-10, t);

    const bp = ctx.createBiquadFilter();
    bp.type  = 'bandpass';
    bp.frequency.setValueAtTime(hz * 2, t);
    bp.Q.setValueAtTime(1.2, t);

    const lp = ctx.createBiquadFilter();
    lp.type  = 'lowpass';
    lp.frequency.setValueAtTime(2600, t);
    lp.Q.setValueAtTime(0.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.20, t + 0.025);
    gain.gain.setValueAtTime(0.18, t + soundS - 0.04);
    gain.gain.linearRampToValueAtTime(0, t + soundS);

    osc1.connect(bp); osc2.connect(bp);
    bp.connect(lp);   lp.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t); osc1.stop(t + soundS);
    osc2.start(t); osc2.stop(t + soundS);

    const startMs = (t - ctx.currentTime) * 1000;
    setTimeout(() => {
      if (!refPlaying) return;
      if (onNoteRef) onNoteRef(note, idx);
    }, Math.max(0, startMs));

    t += durS;
  });

  const totalMs = (t - ctx.currentTime) * 1000;
  setTimeout(() => { if (refPlaying) stopReference(); }, Math.max(0, totalMs + 300));
}

export function stopReference() {
  if (refActx) { refActx.close(); refActx = null; }
  refPlaying = false;
}

export function isPlayingRef() { return refPlaying; }

// ── Ding ──────────────────────────────────────────────────────────────
export function playDing() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
    setTimeout(() => ctx.close(), 300);
  } catch(e) {}
}

// ── Audio Loop ────────────────────────────────────────────────────────
function loop() {
  if (!isOn) return;
  analyser.getFloatTimeDomainData(buf);
  const rms = getRMS(buf);
  const { pitch, clarity } = rms < SILENCE
    ? { pitch: null, clarity: 0 }
    : yin(buf, actx.sampleRate);
  processFrame(pitch, clarity, rms);
  loopTimer = setTimeout(loop, LOOP_MS);
}

// ── Process Frame ─────────────────────────────────────────────────────
function processFrame(pitch, clarity, rms) {
  const isSilent = !pitch || clarity < 0.45 || rms < SILENCE;

  if (isSilent) {
    if (!prevSilent) lastNoteEndTime = performance.now();
    prevSilent   = true;
    pitchHistory = [];
    holdCount    = 0;
    if (onFrame) onFrame({ silent: true, sg: '—', confidence: 0, stability: 0 });
    return;
  }

  const nd        = hzToNote(pitch);
  const stability = computeStability(nd.midi);
  const sg        = detectedSargam(nd);

  if (prevSilent) {
    noteOnsetTime      = performance.now();
    notePitchWhileHeld = [];
  }
  prevSilent = false;
  notePitchWhileHeld.push(nd.midi);

  if (onFrame) onFrame({
    silent:     false,
    sg,
    confidence: Math.round(clarity * 100),
    stability,
    cents:      nd.cents
  });

  // KEY FIX from pilot — reset BOTH holdCount AND wrongFrameCount on low stability
  // Prevents transition noise between holes from counting as wrong frames
  if (stability < 28) {
    holdCount       = 0;
    wrongFrameCount = 0;
    return;
  }

  if (inCooldown || currentNoteIdx >= currentNotes.length) return;

  const expMidi   = expectedMidi(currentNotes[currentNoteIdx]);
  const expChroma = ((expMidi % 12) + 12) % 12;
  const detChroma = ((nd.midi % 12) + 12) % 12;
  const isCorrect = detChroma === expChroma && Math.abs(nd.cents) <= HIT_CENTS;

  if (isCorrect) {
    holdCount++;
    if (holdCount >= HOLD_FRAMES) confirmNote(nd, stability);
  } else {
    wrongFrameCount++;
    holdCount = 0;
    if (onNoteMiss) onNoteMiss({
      got:   sg,
      need:  currentNotes[currentNoteIdx].sg,
      cents: nd.cents
    });
  }
}

// ── Confirm Note ──────────────────────────────────────────────────────
function confirmNote(nd, stability) {
  inCooldown = true;

  const now          = performance.now();
  const durMs        = noteOnsetTime ? now - noteOnsetTime : null;
  const drift        = calcDrift(notePitchWhileHeld);
  const outcome      = wrongFrameCount > WRONG_FRAME_LIMIT ? 'sloppy' : 'clean';
  const confirmedIdx = currentNoteIdx;

  if (onNoteCorrect) onNoteCorrect({
    idx:         confirmedIdx,
    note:        currentNotes[confirmedIdx],
    outcome,
    cents:       nd.cents,
    wrongFrames: wrongFrameCount,
    stability,
    durMs,
    drift
  });

  holdCount          = 0;
  wrongFrameCount    = 0;
  noteOnsetTime      = null;
  notePitchWhileHeld = [];
  lastNoteEndTime    = now;
  currentNoteIdx++;

  setTimeout(() => {
    inCooldown = false;
    if (currentNoteIdx >= currentNotes.length) {
      if (onLessonComplete) onLessonComplete();
    }
  }, COOLDOWN_MS);
}
