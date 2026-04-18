// js/auth.js
// HarmonicaGuru — Google Authentication + User Document Creation

import { auth, provider, db } from './firebase-config.js';
import {
  signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Sign In ───────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    await createUserDocIfNeeded(result.user);
    return result.user;
  } catch(err) {
    console.error('Sign in error:', err);
    throw err;
  }
}

// ── Sign Out ──────────────────────────────────────────────────────────
export async function signOutUser() {
  try { await signOut(auth); } catch(err) { console.error(err); }
}

// ── Create User Document ──────────────────────────────────────────────
async function createUserDocIfNeeded(user) {
  const userRef  = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email:       user.email,
      displayName: user.displayName,
      photoURL:    user.photoURL || '',
      createdAt:   serverTimestamp(),
      preferredKey: 'C',
      harmonicaType: null,

      // ── Subscription ──────────────────────────────────────────────
      subscription: {
        status:              'free',
        expiresAt:           null,
        renewalDate:         null,
        aiCreditsRemaining:  5,        // 5 free credits for new users
        aiCreditsLastReset:  null,
      },

      // ── Song Access ───────────────────────────────────────────────
      // Each entry: { id, expiresAt, playsUsed }
      // playsUsed tracks free play (max 1 free per song)
      songAccess: [],

      // ── Free plays used ───────────────────────────────────────────
      // Array of song IDs where free play has been consumed
      freePlaysUsed: [],

      // ── Song interest (coming soon) ───────────────────────────────
      songInterest: [],
    });
    console.log('New user created:', user.email);
  } else {
    console.log('Existing user:', user.email);
  }
}

// ── Auth State Observer ───────────────────────────────────────────────
export function watchAuthState(onLoggedIn, onLoggedOut) {
  onAuthStateChanged(auth, (user) => {
    if (user) onLoggedIn(user);
    else onLoggedOut();
  });
}

// ── Get User Data ─────────────────────────────────────────────────────
export async function getUserData(uid) {
  const userRef  = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) return userSnap.data();
  return null;
}

// ── Access Helpers ────────────────────────────────────────────────────

// Check if subscription is currently active
export function isSubscriptionActive(userData) {
  if (!userData) return false;
  const sub = userData.subscription;
  if (!sub || sub.status === 'free') return false;
  if (sub.status === 'monthly') {
    if (!sub.expiresAt) return false;
    const expiry = sub.expiresAt.toDate ? sub.expiresAt.toDate() : new Date(sub.expiresAt);
    return expiry > new Date();
  }
  return false;
}

// Check if user has access to a specific song
export function hasSongAccess(userData, songId) {
  if (!userData) return false;
  if (isSubscriptionActive(userData)) return true;

  const songAccess = userData.songAccess || [];
  const entry      = songAccess.find(s => s.id === songId);
  if (!entry) return false;

  const expiry = entry.expiresAt?.toDate
    ? entry.expiresAt.toDate()
    : new Date(entry.expiresAt);
  return expiry > new Date();
}

// Check if free play is available for a song
export function hasFreePlay(userData, songId) {
  if (!userData) return true; // default allow
  const used = userData.freePlaysUsed || [];
  return !used.includes(songId);
}

// Get AI credits remaining
export function getAICredits(userData) {
  return userData?.subscription?.aiCreditsRemaining || 0;
}
