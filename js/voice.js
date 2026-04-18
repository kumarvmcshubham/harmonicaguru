// js/voice.js
// HarmonicaGuru — AI Voice via Web Speech API
// Only 1 voice moment: timer warning at 2 minutes

let voiceEnabled = true;
let voiceLang    = 'hinglish';
let isSpeaking   = false;
let speakQueue   = [];

export function isVoiceSupported() {
  return 'speechSynthesis' in window;
}
export function setVoiceEnabled(enabled) {
  voiceEnabled = enabled;
  if (!enabled) window.speechSynthesis.cancel();
}
export function setVoiceLang(lang) { voiceLang = lang; }
export function getVoiceEnabled()  { return voiceEnabled; }
export function getVoiceLang()     { return voiceLang; }

export function speak(textKey, priority = false) {
  if (!voiceEnabled || !isVoiceSupported()) return;
  const text = getText(textKey);
  if (!text) return;
  if (priority) {
    window.speechSynthesis.cancel();
    speakQueue = [];
    doSpeak(text);
  } else {
    speakQueue.push(text);
    if (!isSpeaking) processQueue();
  }
}

function processQueue() {
  if (speakQueue.length === 0) { isSpeaking = false; return; }
  isSpeaking = true;
  doSpeak(speakQueue.shift());
}

function doSpeak(text) {
  const u    = new SpeechSynthesisUtterance(text);
  u.lang     = voiceLang === 'hinglish' ? 'hi-IN' : 'en-IN';
  u.rate     = 0.92;
  u.pitch    = 1.0;
  u.volume   = 1.0;
  u.onend    = () => processQueue();
  u.onerror  = () => { isSpeaking = false; processQueue(); };
  window.speechSynthesis.speak(u);
}

// Only timer warning remains
const TEXTS = {
  timer_2min: {
    hinglish: 'Sirf 2 minute bacha hai',
    english:  'Only 2 minutes remaining'
  }
};

function getText(key) {
  const entry = TEXTS[key];
  if (!entry) return null;
  return voiceLang === 'hinglish' ? entry.hinglish : entry.english;
}

export function speakTimerWarning() {
  speak('timer_2min', true);
}
