// js/timer.js
// HarmonicaGuru — Daily Practice Timer
// Tracks 20 mins (1200 seconds) of free sargam practice per day
// Resets at midnight — each calendar day is a fresh Firestore document

import { db } from './firebase-config.js';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Constants ────────────────────────────────────────────────────────
const FREE_SECONDS = 1200; // 20 minutes
const SYNC_INTERVAL_MS = 30000; // write to Firestore every 30 seconds

// ── State ────────────────────────────────────────────────────────────
let uid = null;
let secondsUsedToday = 0;
let localCounter = 0; // counts up while mic is active
let timerInterval = null;
let syncInterval = null;
let onTickCallback = null;
let onLimitCallback = null;

// ── Helpers ──────────────────────────────────────────────────────────
function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getDocRef() {
  return doc(db, 'users', uid, 'dailyPractice', getTodayKey());
}

// ── Initialise ───────────────────────────────────────────────────────
// Call this once after user logs in
export async function initTimer(userId) {
  uid = userId;
  const snap = await getDoc(getDocRef());
  if (snap.exists()) {
    secondsUsedToday = snap.data().sargamSecondsUsed || 0;
  } else {
    secondsUsedToday = 0;
  }
  localCounter = 0;
}

// ── Get Remaining Seconds ────────────────────────────────────────────
export function getRemainingSeconds() {
  const total = secondsUsedToday + localCounter;
  return Math.max(0, FREE_SECONDS - total);
}

// ── Format for Display ───────────────────────────────────────────────
export function formatRemaining() {
  const secs = getRemainingSeconds();
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ── Timer Display String with Hinglish ──────────────────────────────
export function getTimerDisplayText() {
  const secs = getRemainingSeconds();
  if (secs <= 0) return 'Free Practice: Done for today';
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  if (secs <= 120) return `Free Practice: ${m}:${s} remaining — jaldi!`;
  if (secs <= 300) return `Free Practice: ${m}:${s} remaining`;
  return `Free Practice: ${m}:${s} remaining`;
}

// ── Timer Color Class ────────────────────────────────────────────────
export function getTimerColorClass() {
  const secs = getRemainingSeconds();
  if (secs <= 0) return 'timer-zero';
  if (secs <= 120) return 'timer-red';
  if (secs <= 300) return 'timer-amber';
  return 'timer-green';
}

// ── Is Limit Reached ────────────────────────────────────────────────
export function isLimitReached() {
  return getRemainingSeconds() <= 0;
}

// ── Start Counting ───────────────────────────────────────────────────
// Call when mic turns ON
export function startCounting(onTick, onLimit) {
  if (timerInterval) return; // already running
  if (isLimitReached()) {
    if (onLimit) onLimit();
    return;
  }

  onTickCallback = onTick;
  onLimitCallback = onLimit;

  // Count every second
  timerInterval = setInterval(() => {
    localCounter++;
    if (onTickCallback) onTickCallback(getTimerDisplayText(), getTimerColorClass());

    if (isLimitReached()) {
      stopCounting();
      if (onLimitCallback) onLimitCallback();
    }
  }, 1000);

  // Sync to Firestore every 30 seconds
  syncInterval = setInterval(() => {
    syncToFirestore();
  }, SYNC_INTERVAL_MS);
}

// ── Stop Counting ────────────────────────────────────────────────────
// Call when mic turns OFF
export function stopCounting() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  // Final sync immediately on stop
  syncToFirestore();
}

// ── Sync to Firestore ────────────────────────────────────────────────
async function syncToFirestore() {
  if (!uid || localCounter === 0) return;

  const totalUsed = secondsUsedToday + localCounter;
  secondsUsedToday = totalUsed;
  localCounter = 0;

  try {
    const ref = getDocRef();
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        sargamSecondsUsed: totalUsed,
        lastUpdated: serverTimestamp()
      });
    } else {
      await setDoc(ref, {
        date: getTodayKey(),
        sargamSecondsUsed: totalUsed,
        lastUpdated: serverTimestamp()
      });
    }
  } catch (err) {
    // If sync fails keep local counter running
    // Will retry on next interval
    localCounter = totalUsed - secondsUsedToday;
    console.warn('Timer sync failed — will retry:', err);
  }
}