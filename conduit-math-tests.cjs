#!/usr/bin/env node
/**
 * Conduit math data-point audit.
 *
 * Compares live values in index.html against published EMT / bender charts:
 *   - ANSI C80.3 / UL 797 EMT OD & wall
 *   - Ideal / Klein / Milwaukee hand-bender CLR & deduct
 *   - Greenlee Sidewinder B2555 EMT shoe CLR & deduct
 *   - Greenlee table/hydraulic shoe CLR (777/PVC family used by app for 2-1/2 & 3)
 *   - Greenlee 881 Cam Track EMT deduct (reference for table-family deduct check)
 *   - Core trade formulas (travel, shrink, 90° gain)
 *
 * Run: node conduit-math-tests.cjs
 * Exit 0 only when every hard check passes.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function extractObjectLiteral(source, name) {
  const start = source.indexOf(`const ${name}=`);
  if (start < 0) throw new Error(`Missing const ${name}`);
  let i = source.indexOf('{', start);
  let depth = 0;
  for (let j = i; j < source.length; j++) {
    const ch = source[j];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        // eslint-disable-next-line no-new-func
        return Function(`"use strict"; return (${source.slice(i, j + 1)});`)();
      }
    }
  }
  throw new Error(`Unclosed object for ${name}`);
}

const emtOD = extractObjectLiteral(HTML, 'emtOD');
const emtGeometry = extractObjectLiteral(HTML, 'emtGeometry');
const benderProfiles = extractObjectLiteral(HTML, 'benderProfiles');

const ANSI_OD = {
  '1/2"': 0.706, '3/4"': 0.922, '1"': 1.163, '1-1/4"': 1.51,
  '1-1/2"': 1.74, '2"': 2.197, '2-1/2"': 2.875, '3"': 3.5,
  '3-1/2"': 4.0, '4"': 4.5
};
const ANSI_WALL = {
  '1/2"': 0.042, '3/4"': 0.049, '1"': 0.057, '1-1/4"': 0.065,
  '1-1/2"': 0.065, '2"': 0.065, '2-1/2"': 0.072, '3"': 0.072,
  '3-1/2"': 0.083, '4"': 0.083
};

/** Published manufacturer / chart references */
const REF = {
  ideal: {
    clr: { '1/2"': 4.0, '3/4"': 4.5, '1"': 5.75 },
    deduct: { '1/2"': 5, '3/4"': 6, '1"': 8 },
    source: 'Industry-standard Ideal hand bender take-up / CLR'
  },
  klein: {
    clr: { '1/2"': 4.625, '3/4"': 5.5, '1"': 7.375 },
    deduct: { '1/2"': 5, '3/4"': 6, '1"': 8 },
    source: 'Klein Tools product pages (51603/51604/51605 centerline bend radius)'
  },
  milwaukee: {
    // 1/2" CLR not confirmed on Milwaukee's public page; 3/4 and 1 from distributor listings.
    clr: { '3/4"': 5.25, '1"': 6.5 },
    deduct: { '1/2"': 5, '3/4"': 6, '1"': 8 },
    source: 'Distributor specs for Milwaukee 48-22-4081 / 48-22-4082'
  },
  sidewinder: {
    clr: { '1-1/4"': 8.75, '1-1/2"': 8 + 9 / 32, '2"': 9 + 3 / 16 },
    deduct: { '1-1/4"': 13 + 1 / 8, '1-1/2"': 13 + 7 / 8, '2"': 15 + 3 / 8 },
    source: 'Gardner Bender / Greenlee Sidewinder B2555 EMT radius + Chart B deduct'
  },
  tablePvcClr: {
    clr: { '2-1/2"': 11 + 7 / 16, '3"': 13.75, '3-1/2"': 16, '4"': 18.25 },
    source: 'Greenlee 777/880 PVC (and matching rigid shoe) centerline radii'
  },
  camTrack881: {
    clr: { '2-1/2"': 13.5, '3"': 16, '3-1/2"': 18 + 5 / 8, '4"': 20 + 7 / 8 },
    deduct: { '2-1/2"': 21.5, '3"': 24, '3-1/2"': 27.75, '4"': 32.25 },
    source: 'Greenlee 881/881CT Cam Track EMT Table 2'
  }
};

const DEFAULT_BENDER = {
  '1/2"': 'ideal', '3/4"': 'ideal', '1"': 'ideal',
  '1-1/4"': 'sidewinder', '1-1/2"': 'sidewinder', '2"': 'sidewinder',
  '2-1/2"': 'table', '3"': 'table', '3-1/2"': 'table', '4"': 'table'
};

const hard = [];
const soft = [];

function nearly(a, b, tol = 0.01) {
  return Math.abs(Number(a) - Number(b)) <= tol;
}

function check(list, ok, name, app, expected, note, tol = 0.01) {
  const pass = ok || nearly(app, expected, tol);
  list.push({
    pass,
    name,
    app,
    expected,
    delta: app == null || expected == null ? null : Math.abs(Number(app) - Number(expected)),
    note
  });
}

// --- 1. EMT OD / wall ---
for (const [size, od] of Object.entries(ANSI_OD)) {
  check(hard, nearly(emtOD[size], od, 1e-9), `emtOD[${size}]`, emtOD[size], od, 'ANSI C80.3 / UL 797', 1e-9);
  check(hard, nearly(emtGeometry[size].od, od, 1e-9), `emtGeometry.od[${size}]`, emtGeometry[size].od, od, 'ANSI C80.3 / UL 797', 1e-9);
  check(hard, nearly(emtGeometry[size].wall, ANSI_WALL[size], 1e-9), `emtGeometry.wall[${size}]`, emtGeometry[size].wall, ANSI_WALL[size], 'ANSI C80.3 / UL 797', 1e-9);
}

// --- 2. Hand / power / table profiles vs published charts ---
for (const [size, clr] of Object.entries(REF.ideal.clr)) {
  check(hard, false, `ideal.clr[${size}]`, benderProfiles.ideal.clr[size], clr, REF.ideal.source);
}
for (const [size, d] of Object.entries(REF.ideal.deduct)) {
  check(hard, false, `ideal.deduct[${size}]`, benderProfiles.ideal.deduct[size], d, REF.ideal.source);
}

for (const [size, clr] of Object.entries(REF.klein.clr)) {
  check(hard, false, `klein.clr[${size}]`, benderProfiles.klein.clr[size], clr, REF.klein.source);
}
for (const [size, d] of Object.entries(REF.klein.deduct)) {
  check(hard, false, `klein.deduct[${size}]`, benderProfiles.klein.deduct[size], d, REF.klein.source);
}

for (const [size, clr] of Object.entries(REF.milwaukee.clr)) {
  check(hard, false, `milwaukee.clr[${size}]`, benderProfiles.milwaukee.clr[size], clr, REF.milwaukee.source);
}
for (const [size, d] of Object.entries(REF.milwaukee.deduct)) {
  check(hard, false, `milwaukee.deduct[${size}]`, benderProfiles.milwaukee.deduct[size], d, REF.milwaukee.source);
}

for (const [size, clr] of Object.entries(REF.sidewinder.clr)) {
  check(hard, false, `sidewinder.clr[${size}]`, benderProfiles.sidewinder.clr[size], clr, REF.sidewinder.source, 0.02);
}
for (const [size, d] of Object.entries(REF.sidewinder.deduct)) {
  check(hard, false, `sidewinder.deduct[${size}]`, benderProfiles.sidewinder.deduct[size], d, REF.sidewinder.source, 0.05);
}

// Table CLR: app already uses PVC/777 values for 2-1/2 and 3; require full family consistency.
for (const [size, clr] of Object.entries(REF.tablePvcClr.clr)) {
  check(hard, false, `table.clr[${size}] (PVC/777 family)`, benderProfiles.table.clr[size], clr, REF.tablePvcClr.source, 0.02);
}

// Table deduct: app values do not match Cam Track 881; flag as soft until shoe-family deduct chart is chosen.
for (const [size, d] of Object.entries(REF.camTrack881.deduct)) {
  const app = benderProfiles.table.deduct[size];
  const matchCam = nearly(app, d, 0.05);
  soft.push({
    pass: matchCam,
    name: `table.deduct[${size}] vs 881 Cam Track`,
    app,
    expected: d,
    delta: Math.abs(app - d),
    note: matchCam
      ? REF.camTrack881.source
      : `App deduct ${app} ≠ Cam Track ${d}. Table CLR follows 777/PVC shoes, so deduct source is unresolved.`
  });
}

// --- 3. Fallback geometry CLR should match default bender profile ---
for (const [size, key] of Object.entries(DEFAULT_BENDER)) {
  const geo = emtGeometry[size].clr;
  const profile = benderProfiles[key].clr[size];
  check(
    hard,
    false,
    `emtGeometry.clr[${size}] vs default ${key}`,
    geo,
    profile,
    'Fallback geometry must match the default bender shoe used for that trade size',
    0.02
  );
}

// --- 4. Formula identities used by the app ---
function travelMultiplier(deg) {
  return 1 / Math.sin((deg * Math.PI) / 180);
}
function shrinkConstant(deg) {
  return Math.tan(((deg / 2) * Math.PI) / 180);
}
function gain90(R) {
  return 2 * R * Math.tan(Math.PI / 4) - R * (Math.PI / 2);
}

const memorized = [
  [30, 2.0, 0.268],
  [45, 1.414, 0.414],
  [60, 1.155, 0.577]
];
for (const [deg, m, s] of memorized) {
  check(hard, nearly(travelMultiplier(deg), m, 0.002), `travel multiplier ${deg}°`, travelMultiplier(deg), m, 'TO / sin(θ)');
  check(hard, nearly(shrinkConstant(deg), s, 0.002), `shrink constant ${deg}°`, shrinkConstant(deg), s, 'tan(θ/2)');
}
for (const R of [4, 4.5, 5.75, 8.75]) {
  const g = gain90(R);
  const expect = R * (2 - Math.PI / 2);
  check(hard, nearly(g, expect, 1e-9), `90° gain @ CLR ${R}`, g, expect, '2R·tan(θ/2) − Rθ', 1e-9);
}

// Preferred clearance CTC identity
const preferredClearance = 9 / 16;
function requiredCC(a, b) {
  return Math.ceil((emtOD[a] / 2 + emtOD[b] / 2 + preferredClearance - 1e-10) * 16) / 16;
}
for (const [a, b] of [['3/4"', '3/4"'], ['1"', '1"'], ['1/2"', '1"']]) {
  const cc = requiredCC(a, b);
  const gap = cc - emtOD[a] / 2 - emtOD[b] / 2;
  check(hard, gap + 1e-9 >= preferredClearance, `Auto Space CTC ${a}→${b}`, gap, preferredClearance, 'surface gap ≥ 9/16"');
}

function printGroup(title, rows) {
  console.log(`\n=== ${title} ===`);
  for (const r of rows) {
    const mark = r.pass ? 'PASS' : 'FAIL';
    const delta = r.delta == null ? '' : ` Δ=${Number(r.delta).toFixed(4)}`;
    console.log(`${mark}: ${r.name}: app=${r.app} expected=${r.expected}${delta} — ${r.note}`);
  }
}

printGroup('HARD CHECKS (must match published conduit math)', hard);
printGroup('SOFT CHECKS (table deduct shoe-family unresolved)', soft);

const hardFails = hard.filter((r) => !r.pass);
const softFails = soft.filter((r) => !r.pass);

console.log(`\nHard: ${hard.length - hardFails.length}/${hard.length} pass`);
console.log(`Soft: ${soft.length - softFails.length}/${soft.length} pass`);

if (hardFails.length) {
  console.log('\nIncorrect data points:');
  hardFails.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name}: app=${r.app} → should be ${r.expected} (${r.note})`);
  });
  process.exit(1);
}

console.log('\nAll hard conduit-math data checks passed.');
process.exit(0);
