// assets/data/lessons.js
// HarmonicaGuru — All lesson and sargam group data

// ── Diatonic — 10 hole — middle octave holes 4-7 ─────────────────────
export const SARGAM_SCALE_DIATONIC = [
  { sg: 'Sa',  bd: '↑ Blow', hole: '4', baseMidi: 60, octave: 'middle' },
  { sg: 'Re',  bd: '↓ Draw', hole: '4', baseMidi: 62, octave: 'middle' },
  { sg: 'Ga',  bd: '↑ Blow', hole: '5', baseMidi: 64, octave: 'middle' },
  { sg: 'Ma',  bd: '↓ Draw', hole: '5', baseMidi: 65, octave: 'middle' },
  { sg: 'Pa',  bd: '↑ Blow', hole: '6', baseMidi: 67, octave: 'middle' },
  { sg: 'Dha', bd: '↓ Draw', hole: '6', baseMidi: 69, octave: 'middle' },
  { sg: 'Ni',  bd: '↓ Draw', hole: '7', baseMidi: 71, octave: 'middle' },
  { sg: "Sa'", bd: '↑ Blow', hole: '7', baseMidi: 72, octave: 'middle' },
];

// ── Tower Chromatic — 24 hole ─────────────────────────────────────────
export const SARGAM_SCALE_TOWER_LOWER = [
  { sg: "'Sa,",  bd: '↑ Blow', hole: '1',  baseMidi: 48, octave: 'lower' },
  { sg: "'Re,",  bd: '↓ Draw', hole: '1',  baseMidi: 50, octave: 'lower' },
  { sg: "'Ga,",  bd: '↑ Blow', hole: '2',  baseMidi: 52, octave: 'lower' },
  { sg: "'Ma,",  bd: '↓ Draw', hole: '2',  baseMidi: 53, octave: 'lower' },
  { sg: "'Pa,",  bd: '↑ Blow', hole: '3',  baseMidi: 55, octave: 'lower' },
  { sg: "'Dha,", bd: '↓ Draw', hole: '3',  baseMidi: 57, octave: 'lower' },
  { sg: "'Ni,",  bd: '↓ Draw', hole: '4',  baseMidi: 59, octave: 'lower' },
  { sg: "Sa",   bd: '↑ Blow', hole: '7',  baseMidi: 60, octave: 'lower-end' },
];

export const SARGAM_SCALE_TOWER_MIDDLE = [
  { sg: 'Sa',   bd: '↑ Blow', hole: '9',  baseMidi: 60, octave: 'middle' },
  { sg: 'Re',   bd: '↓ Draw', hole: '9',  baseMidi: 62, octave: 'middle' },
  { sg: 'Ga',   bd: '↑ Blow', hole: '10', baseMidi: 64, octave: 'middle' },
  { sg: 'Ma',   bd: '↓ Draw', hole: '10', baseMidi: 65, octave: 'middle' },
  { sg: 'Pa',   bd: '↑ Blow', hole: '11', baseMidi: 67, octave: 'middle' },
  { sg: 'Dha',  bd: '↓ Draw', hole: '11', baseMidi: 69, octave: 'middle' },
  { sg: 'Ni',   bd: '↓ Draw', hole: '12', baseMidi: 71, octave: 'middle' },
  { sg: "Sa'",  bd: '↑ Blow', hole: '15', baseMidi: 72, octave: 'middle-end' },
];

export const SARGAM_SCALE_TOWER_UPPER = [
  { sg: "Sa'",  bd: '↑ Blow', hole: '17', baseMidi: 72, octave: 'upper' },
  { sg: "Re'",  bd: '↓ Draw', hole: '17', baseMidi: 74, octave: 'upper' },
  { sg: "Ga'",  bd: '↑ Blow', hole: '18', baseMidi: 76, octave: 'upper' },
  { sg: "Ma'",  bd: '↓ Draw', hole: '18', baseMidi: 77, octave: 'upper' },
  { sg: "Pa'",  bd: '↑ Blow', hole: '19', baseMidi: 79, octave: 'upper' },
  { sg: "Dha'", bd: '↓ Draw', hole: '19', baseMidi: 81, octave: 'upper' },
  { sg: "Ni'",  bd: '↓ Draw', hole: '20', baseMidi: 83, octave: 'upper' },
  { sg: "Sa''", bd: '↑ Blow', hole: '23', baseMidi: 84, octave: 'upper-end' },
];

export function getOctaveLabel(octave) {
  switch(octave) {
    case 'lower':      return 'Lower Octave';
    case 'lower-end':  return 'Lower Octave';
    case 'middle':     return 'Middle Octave';
    case 'middle-end': return 'Middle Octave';
    case 'upper':      return 'Upper Octave';
    case 'upper-end':  return 'Upper Octave';
    default:           return '';
  }
}

export function getSargamScale(harmonicaType, towerOctave) {
  if (harmonicaType === 'diatonic') return SARGAM_SCALE_DIATONIC;
  switch(towerOctave) {
    case 'lower':  return SARGAM_SCALE_TOWER_LOWER;
    case 'upper':  return SARGAM_SCALE_TOWER_UPPER;
    default:       return SARGAM_SCALE_TOWER_MIDDLE;
  }
}

// ── 3-Note Groups — Diatonic ──────────────────────────────────────────
export const THREE_NOTE_GROUPS_DIATONIC = [
  { name: 'Sa Re Ga', notes: [
    { sg: 'Sa',  bd: '↑ Blow', hole: '4', baseMidi: 60, octave: 'middle' },
    { sg: 'Re',  bd: '↓ Draw', hole: '4', baseMidi: 62, octave: 'middle' },
    { sg: 'Ga',  bd: '↑ Blow', hole: '5', baseMidi: 64, octave: 'middle' },
  ]},
  { name: 'Re Ga Ma', notes: [
    { sg: 'Re',  bd: '↓ Draw', hole: '4', baseMidi: 62, octave: 'middle' },
    { sg: 'Ga',  bd: '↑ Blow', hole: '5', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '5', baseMidi: 65, octave: 'middle' },
  ]},
  { name: 'Ga Ma Pa', notes: [
    { sg: 'Ga',  bd: '↑ Blow', hole: '5', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '5', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '6', baseMidi: 67, octave: 'middle' },
  ]},
  { name: 'Ma Pa Dha', notes: [
    { sg: 'Ma',  bd: '↓ Draw', hole: '5', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '6', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '6', baseMidi: 69, octave: 'middle' },
  ]},
  { name: 'Pa Dha Ni', notes: [
    { sg: 'Pa',  bd: '↑ Blow', hole: '6', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '6', baseMidi: 69, octave: 'middle' },
    { sg: 'Ni',  bd: '↓ Draw', hole: '7', baseMidi: 71, octave: 'middle' },
  ]},
  { name: "Dha Ni Sa'", notes: [
    { sg: 'Dha', bd: '↓ Draw', hole: '6', baseMidi: 69, octave: 'middle' },
    { sg: 'Ni',  bd: '↓ Draw', hole: '7', baseMidi: 71, octave: 'middle' },
    { sg: "Sa'", bd: '↑ Blow', hole: '7', baseMidi: 72, octave: 'middle' },
  ]},
];

// ── 3-Note Groups — Tower Middle ──────────────────────────────────────
export const THREE_NOTE_GROUPS_TOWER = [
  { name: 'Sa Re Ga', notes: [
    { sg: 'Sa',  bd: '↑ Blow', hole: '9',  baseMidi: 60, octave: 'middle' },
    { sg: 'Re',  bd: '↓ Draw', hole: '9',  baseMidi: 62, octave: 'middle' },
    { sg: 'Ga',  bd: '↑ Blow', hole: '10', baseMidi: 64, octave: 'middle' },
  ]},
  { name: 'Re Ga Ma', notes: [
    { sg: 'Re',  bd: '↓ Draw', hole: '9',  baseMidi: 62, octave: 'middle' },
    { sg: 'Ga',  bd: '↑ Blow', hole: '10', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '10', baseMidi: 65, octave: 'middle' },
  ]},
  { name: 'Ga Ma Pa', notes: [
    { sg: 'Ga',  bd: '↑ Blow', hole: '10', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '10', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '11', baseMidi: 67, octave: 'middle' },
  ]},
  { name: 'Ma Pa Dha', notes: [
    { sg: 'Ma',  bd: '↓ Draw', hole: '10', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '11', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '11', baseMidi: 69, octave: 'middle' },
  ]},
  { name: 'Pa Dha Ni', notes: [
    { sg: 'Pa',  bd: '↑ Blow', hole: '11', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '11', baseMidi: 69, octave: 'middle' },
    { sg: 'Ni',  bd: '↓ Draw', hole: '12', baseMidi: 71, octave: 'middle' },
  ]},
  { name: "Dha Ni Sa'", notes: [
    { sg: 'Dha', bd: '↓ Draw', hole: '11', baseMidi: 69, octave: 'middle' },
    { sg: 'Ni',  bd: '↓ Draw', hole: '12', baseMidi: 71, octave: 'middle' },
    { sg: "Sa'", bd: '↑ Blow', hole: '15', baseMidi: 72, octave: 'middle-end' },
  ]},
];

// ── 4-Note Groups — Diatonic ──────────────────────────────────────────
export const FOUR_NOTE_GROUPS_DIATONIC = [
  { name: 'Sa Re Ga Ma', notes: [
    { sg: 'Sa',  bd: '↑ Blow', hole: '4', baseMidi: 60, octave: 'middle' },
    { sg: 'Re',  bd: '↓ Draw', hole: '4', baseMidi: 62, octave: 'middle' },
    { sg: 'Ga',  bd: '↑ Blow', hole: '5', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '5', baseMidi: 65, octave: 'middle' },
  ]},
  { name: 'Re Ga Ma Pa', notes: [
    { sg: 'Re',  bd: '↓ Draw', hole: '4', baseMidi: 62, octave: 'middle' },
    { sg: 'Ga',  bd: '↑ Blow', hole: '5', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '5', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '6', baseMidi: 67, octave: 'middle' },
  ]},
  { name: 'Ga Ma Pa Dha', notes: [
    { sg: 'Ga',  bd: '↑ Blow', hole: '5', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '5', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '6', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '6', baseMidi: 69, octave: 'middle' },
  ]},
  { name: 'Ma Pa Dha Ni', notes: [
    { sg: 'Ma',  bd: '↓ Draw', hole: '5', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '6', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '6', baseMidi: 69, octave: 'middle' },
    { sg: 'Ni',  bd: '↓ Draw', hole: '7', baseMidi: 71, octave: 'middle' },
  ]},
  { name: "Pa Dha Ni Sa'", notes: [
    { sg: 'Pa',  bd: '↑ Blow', hole: '6', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '6', baseMidi: 69, octave: 'middle' },
    { sg: 'Ni',  bd: '↓ Draw', hole: '7', baseMidi: 71, octave: 'middle' },
    { sg: "Sa'", bd: '↑ Blow', hole: '7', baseMidi: 72, octave: 'middle' },
  ]},
];

// ── 4-Note Groups — Tower Middle ──────────────────────────────────────
export const FOUR_NOTE_GROUPS_TOWER = [
  { name: 'Sa Re Ga Ma', notes: [
    { sg: 'Sa',  bd: '↑ Blow', hole: '9',  baseMidi: 60, octave: 'middle' },
    { sg: 'Re',  bd: '↓ Draw', hole: '9',  baseMidi: 62, octave: 'middle' },
    { sg: 'Ga',  bd: '↑ Blow', hole: '10', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '10', baseMidi: 65, octave: 'middle' },
  ]},
  { name: 'Re Ga Ma Pa', notes: [
    { sg: 'Re',  bd: '↓ Draw', hole: '9',  baseMidi: 62, octave: 'middle' },
    { sg: 'Ga',  bd: '↑ Blow', hole: '10', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '10', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '11', baseMidi: 67, octave: 'middle' },
  ]},
  { name: 'Ga Ma Pa Dha', notes: [
    { sg: 'Ga',  bd: '↑ Blow', hole: '10', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '10', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '11', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '11', baseMidi: 69, octave: 'middle' },
  ]},
  { name: 'Ma Pa Dha Ni', notes: [
    { sg: 'Ma',  bd: '↓ Draw', hole: '10', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '11', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '11', baseMidi: 69, octave: 'middle' },
    { sg: 'Ni',  bd: '↓ Draw', hole: '12', baseMidi: 71, octave: 'middle' },
  ]},
  { name: "Pa Dha Ni Sa'", notes: [
    { sg: 'Pa',  bd: '↑ Blow', hole: '11', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '11', baseMidi: 69, octave: 'middle' },
    { sg: 'Ni',  bd: '↓ Draw', hole: '12', baseMidi: 71, octave: 'middle' },
    { sg: "Sa'", bd: '↑ Blow', hole: '15', baseMidi: 72, octave: 'middle-end' },
  ]},
];

export function getThreeNoteGroups(harmonicaType) {
  return harmonicaType === 'diatonic' ? THREE_NOTE_GROUPS_DIATONIC : THREE_NOTE_GROUPS_TOWER;
}

export function getFourNoteGroups(harmonicaType) {
  return harmonicaType === 'diatonic' ? FOUR_NOTE_GROUPS_DIATONIC : FOUR_NOTE_GROUPS_TOWER;
}

// ── 2-Note Sliding Groups — Diatonic ─────────────────────────────────
export const TWO_NOTE_GROUPS_DIATONIC = [
  { name: 'Sa Re', notes: [
    { sg: 'Sa',  bd: '↑ Blow', hole: '4', baseMidi: 60, octave: 'middle' },
    { sg: 'Re',  bd: '↓ Draw', hole: '4', baseMidi: 62, octave: 'middle' },
  ]},
  { name: 'Re Ga', notes: [
    { sg: 'Re',  bd: '↓ Draw', hole: '4', baseMidi: 62, octave: 'middle' },
    { sg: 'Ga',  bd: '↑ Blow', hole: '5', baseMidi: 64, octave: 'middle' },
  ]},
  { name: 'Ga Ma', notes: [
    { sg: 'Ga',  bd: '↑ Blow', hole: '5', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '5', baseMidi: 65, octave: 'middle' },
  ]},
  { name: 'Ma Pa', notes: [
    { sg: 'Ma',  bd: '↓ Draw', hole: '5', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '6', baseMidi: 67, octave: 'middle' },
  ]},
  { name: 'Pa Dha', notes: [
    { sg: 'Pa',  bd: '↑ Blow', hole: '6', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '6', baseMidi: 69, octave: 'middle' },
  ]},
  { name: 'Dha Ni', notes: [
    { sg: 'Dha', bd: '↓ Draw', hole: '6', baseMidi: 69, octave: 'middle' },
    { sg: 'Ni',  bd: '↓ Draw', hole: '7', baseMidi: 71, octave: 'middle' },
  ]},
  { name: "Ni Sa'", notes: [
    { sg: 'Ni',  bd: '↓ Draw', hole: '7', baseMidi: 71, octave: 'middle' },
    { sg: "Sa'", bd: '↑ Blow', hole: '7', baseMidi: 72, octave: 'middle' },
  ]},
];

// ── 2-Note Sliding Groups — Tower Middle ─────────────────────────────
export const TWO_NOTE_GROUPS_TOWER = [
  { name: 'Sa Re', notes: [
    { sg: 'Sa',  bd: '↑ Blow', hole: '9',  baseMidi: 60, octave: 'middle' },
    { sg: 'Re',  bd: '↓ Draw', hole: '9',  baseMidi: 62, octave: 'middle' },
  ]},
  { name: 'Re Ga', notes: [
    { sg: 'Re',  bd: '↓ Draw', hole: '9',  baseMidi: 62, octave: 'middle' },
    { sg: 'Ga',  bd: '↑ Blow', hole: '10', baseMidi: 64, octave: 'middle' },
  ]},
  { name: 'Ga Ma', notes: [
    { sg: 'Ga',  bd: '↑ Blow', hole: '10', baseMidi: 64, octave: 'middle' },
    { sg: 'Ma',  bd: '↓ Draw', hole: '10', baseMidi: 65, octave: 'middle' },
  ]},
  { name: 'Ma Pa', notes: [
    { sg: 'Ma',  bd: '↓ Draw', hole: '10', baseMidi: 65, octave: 'middle' },
    { sg: 'Pa',  bd: '↑ Blow', hole: '11', baseMidi: 67, octave: 'middle' },
  ]},
  { name: 'Pa Dha', notes: [
    { sg: 'Pa',  bd: '↑ Blow', hole: '11', baseMidi: 67, octave: 'middle' },
    { sg: 'Dha', bd: '↓ Draw', hole: '11', baseMidi: 69, octave: 'middle' },
  ]},
  { name: 'Dha Ni', notes: [
    { sg: 'Dha', bd: '↓ Draw', hole: '11', baseMidi: 69, octave: 'middle' },
    { sg: 'Ni',  bd: '↓ Draw', hole: '12', baseMidi: 71, octave: 'middle' },
  ]},
  { name: "Ni Sa'", notes: [
    { sg: 'Ni',  bd: '↓ Draw', hole: '12', baseMidi: 71, octave: 'middle' },
    { sg: "Sa'", bd: '↑ Blow', hole: '15', baseMidi: 72, octave: 'middle-end' },
  ]},
];

export function getTwoNoteGroups(harmonicaType) {
  return harmonicaType === 'diatonic' ? TWO_NOTE_GROUPS_DIATONIC : TWO_NOTE_GROUPS_TOWER;
}

// ── Happy Birthday ─────────────────────────────────────────────────────
// hole = diatonic hole number
// towerHole = tower chromatic hole number (middle octave)
// baseMidi same for both — pitch detection works for all harmonica types
export const HAPPY_BIRTHDAY = {
  id: 'hb',
  name: 'Happy Birthday',
  lines: [
    { label: 'Hissa 1', lyric: 'Happy Birthday to you', notes: [
      { sg: 'Pa',  bd: '↑ Blow', hole: '6',  towerHole: '11', baseMidi: 67, w: 'Hap-', durMs: 333 },
      { sg: 'Pa',  bd: '↑ Blow', hole: '6',  towerHole: '11', baseMidi: 67, w: 'py',   durMs: 333 },
      { sg: 'Dha', bd: '↓ Draw', hole: '6',  towerHole: '11', baseMidi: 69, w: 'Birth',durMs: 600 },
      { sg: 'Pa',  bd: '↑ Blow', hole: '6',  towerHole: '11', baseMidi: 67, w: 'day',  durMs: 400 },
      { sg: "Sa'", bd: '↑ Blow', hole: '7',  towerHole: '15', baseMidi: 72, w: 'to',   durMs: 400 },
      { sg: 'Ni',  bd: '↓ Draw', hole: '7',  towerHole: '12', baseMidi: 71, w: 'you',  durMs: 900 },
    ]},
    { label: 'Hissa 2', lyric: 'Happy Birthday to you', notes: [
      { sg: 'Pa',  bd: '↑ Blow', hole: '6',  towerHole: '11', baseMidi: 67, w: 'Hap-', durMs: 333 },
      { sg: 'Pa',  bd: '↑ Blow', hole: '6',  towerHole: '11', baseMidi: 67, w: 'py',   durMs: 333 },
      { sg: 'Dha', bd: '↓ Draw', hole: '6',  towerHole: '11', baseMidi: 69, w: 'Birth',durMs: 600 },
      { sg: 'Pa',  bd: '↑ Blow', hole: '6',  towerHole: '11', baseMidi: 67, w: 'day',  durMs: 400 },
      { sg: "Re'", bd: '↓ Draw', hole: '7',  towerHole: '17', baseMidi: 74, w: 'to',   durMs: 400 },
      { sg: "Sa'", bd: '↑ Blow', hole: '7',  towerHole: '15', baseMidi: 72, w: 'you',  durMs: 900 },
    ]},
    { label: 'Hissa 3', lyric: 'Happy Birthday dear ...', notes: [
      { sg: 'Pa',  bd: '↑ Blow', hole: '6',  towerHole: '11', baseMidi: 67, w: 'Hap-', durMs: 333 },
      { sg: 'Pa',  bd: '↑ Blow', hole: '6',  towerHole: '11', baseMidi: 67, w: 'py',   durMs: 333 },
      { sg: "Pa'", bd: '↑ Blow', hole: '8',  towerHole: '19', baseMidi: 79, w: 'Birth',durMs: 600 },
      { sg: "Ga'", bd: '↑ Blow', hole: '8',  towerHole: '18', baseMidi: 76, w: 'day',  durMs: 400 },
      { sg: "Sa'", bd: '↑ Blow', hole: '7',  towerHole: '15', baseMidi: 72, w: 'dear', durMs: 400 },
      { sg: 'Ni',  bd: '↓ Draw', hole: '7',  towerHole: '12', baseMidi: 71, w: '...',  durMs: 333 },
      { sg: 'Dha', bd: '↓ Draw', hole: '6',  towerHole: '11', baseMidi: 69, w: '...',  durMs: 900 },
    ]},
    { label: 'Hissa 4', lyric: 'Happy Birthday to you', notes: [
      { sg: "Ma'", bd: '↓ Draw', hole: '8',  towerHole: '18', baseMidi: 77, w: 'Hap-', durMs: 333 },
      { sg: "Ma'", bd: '↓ Draw', hole: '8',  towerHole: '18', baseMidi: 77, w: 'py',   durMs: 333 },
      { sg: "Ga'", bd: '↑ Blow', hole: '8',  towerHole: '18', baseMidi: 76, w: 'Birth',durMs: 600 },
      { sg: "Sa'", bd: '↑ Blow', hole: '7',  towerHole: '15', baseMidi: 72, w: 'day',  durMs: 400 },
      { sg: "Re'", bd: '↓ Draw', hole: '7',  towerHole: '17', baseMidi: 74, w: 'to',   durMs: 400 },
      { sg: "Sa'", bd: '↑ Blow', hole: '7',  towerHole: '15', baseMidi: 72, w: 'you',  durMs: 900 },
    ]},
  ]
};
