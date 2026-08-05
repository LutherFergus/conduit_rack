#!/usr/bin/env node
/**
 * Proof: push-through 3-point saddle using the 45° notch for every shot.
 *
 * Correct marks use per-angle notch shift δ(θ)=R·π/360·(45−θ) so A→B ≠ B→C.
 * Incorrect equal mark legs (A→B = B→C) keep final heading parallel but shift
 * the finish plane relative to the start plane.
 *
 * Run: node three-point-saddle-proof.cjs
 */
'use strict';

const R = 4.5; // 3/4" Ideal CLR
const H = 3;
const ALPHA = 10; // outer degrees; center = 20
const CENTER = 2 * ALPHA;

function deg(r){return r*180/Math.PI}
function rad(d){return d*Math.PI/180}
function frac(x){
  const a=Math.abs(x), n=Math.round(a*16), w=Math.floor(n/16), r=n%16, s=x<0?'-':'';
  if(!r) return `${s}${w}"`;
  const g=(a,b)=>b?g(b,a%b):a, d=g(r,16);
  return `${s}${w?w+'-':''}${r/d}/${16/d}"`;
}

/** 45° notch sits at COB for a 45° shot. */
const D45 = R * Math.PI / 8;
const notchShift = (thetaDeg) => R * Math.PI / 360 * (45 - thetaDeg);

const L = H / Math.tan(rad(ALPHA)); // equal COB legs
const d10 = notchShift(ALPHA);
const d20 = notchShift(CENTER);
const Delta = d10 - d20;

/** Build finished centerline from stick marks + push-through 45-notch bends. */
function simulate(marks, label){
  const [MA, MB, MC] = marks;
  // Bend plan along increasing stick station: A +α, B −2α, C +α
  const bends = [
    {mark: MA, theta: ALPHA, turn: +1, name: 'A'},
    {mark: MB, theta: CENTER, turn: -1, name: 'B'},
    {mark: MC, theta: ALPHA, turn: +1, name: 'C'}
  ];

  let y = 0, z = 0, heading = 0; // heading 0 = +z horizontal; + = pitched up
  let s = 0; // material cursor
  const peak = {y: -Infinity, z: 0};
  const samples = [{y, z, s, heading}];

  for(const b of bends){
    const theta = rad(b.theta);
    const sob = b.mark - D45;          // start-of-bend material (arrow)
    const arcLen = R * theta;
    const eob = sob + arcLen;

    if(sob + 1e-9 < s){
      return {ok:false, label, error:`Bend ${b.name}: mark/notch places start-of-bend behind cursor (overlap)`};
    }

    // Straight to start of bend
    const straight = sob - s;
    if(straight > 1e-12){
      y += Math.sin(heading) * straight;
      z += Math.cos(heading) * straight;
      s = sob;
      samples.push({y, z, s, heading});
      if(y > peak.y){peak.y=y; peak.z=z}
    }

    // Circular arc: turn sign changes heading by turn*theta
    const steps = Math.max(24, Math.ceil(b.theta));
    for(let i=1;i<=steps;i++){
      const prev = heading + b.turn * theta * ((i-1)/steps);
      const ds = arcLen / steps;
      y += Math.sin(prev + b.turn * theta / steps / 2) * ds; // midpoint rule
      z += Math.cos(prev + b.turn * theta / steps / 2) * ds;
      if(y > peak.y){peak.y=y; peak.z=z}
    }
    heading += b.turn * theta;
    s = eob;
    samples.push({y, z, s, heading, bend:b.name});
  }

  // Continue a bit of finish straight for plane read
  const tail = 12;
  const yEnd = y + Math.sin(heading) * tail;
  const zEnd = z + Math.cos(heading) * tail;

  return {
    ok: true,
    label,
    marks: {MA, MB, MC},
    markLegs: {AB: MB-MA, BC: MC-MB},
    startPlaneY: 0,
    finishPlaneY: y,           // elevation at end of last bend
    finishHeadingDeg: deg(heading),
    planeShift: y - 0,         // finish vs start plane
    peakY: peak.y,
    peakError: peak.y - H,
    parallel: Math.abs(heading) < 1e-9,
    samples,
    yEnd, zEnd
  };
}

// --- Mark sets ---
// Desired COBs (equal legs), center at 48"
const Cb = 48;
const Ca = Cb - L;
const Cc = Cb + L;

const correctMarks = [Ca + d10, Cb + d20, Cc + d10];
// Incorrect: equal mark legs about the (shifted) center mark — classic equal spacing mistake
const mid = Cb + d20;
const equalMarks = [mid - L, mid, mid + L];
// Also incorrect: equal spacing about true COBs with no notch shift
const noShiftEqual = [Ca, Cb, Cc];

function report(r){
  console.log(`\n=== ${r.label} ===`);
  if(!r.ok){ console.log('FAIL:', r.error); return r; }
  console.log(`Marks: A=${frac(r.marks.MA)}  B=${frac(r.marks.MB)}  C=${frac(r.marks.MC)}`);
  console.log(`Mark legs: A→B=${frac(r.markLegs.AB)}  B→C=${frac(r.markLegs.BC)}  (Δ legs=${frac(r.markLegs.BC-r.markLegs.AB)})`);
  console.log(`Finish heading: ${r.finishHeadingDeg.toFixed(6)}°  parallel=${r.parallel}`);
  console.log(`Start plane Y=0   Finish plane Y=${r.finishPlaneY.toFixed(4)}" (${frac(r.finishPlaneY)})`);
  console.log(`Plane shift (finish−start): ${r.planeShift.toFixed(4)}" (${frac(r.planeShift)})`);
  console.log(`Peak Y=${r.peakY.toFixed(4)}"  target H=${H}"  error=${r.peakError.toFixed(4)}" (${frac(r.peakError)})`);
  return r;
}

console.log('3-point push-through proof · 10-20-10 · H=3" · 3/4" Ideal CLR=4.5"');
console.log(`COB leg L=H/tan(10°)=${L.toFixed(4)}" (${frac(L)})`);
console.log(`δ(10°)=${d10.toFixed(4)}" (${frac(d10)})  δ(20°)=${d20.toFixed(4)}" (${frac(d20)})  Δ=${Delta.toFixed(4)}" (${frac(Delta)})`);
console.log(`D45 (notch from arrow)=${D45.toFixed(4)}" (${frac(D45)})`);

const correct = report(simulate(correctMarks, 'CORRECT marks (per-angle δ, A→B ≠ B→C)'));
const equal = report(simulate(equalMarks, 'INCORRECT equal mark legs about center mark'));
const plain = report(simulate(noShiftEqual, 'INCORRECT equal marks at COBs (no notch shift)'));

// App geometry mirror: unequal COB legs from equal marks → plane shift via tan(α)
function appPlaneFromCobs(cobA, cobB, cobC, alphaDeg){
  const th = rad(alphaDeg);
  const rise1 = (cobB - cobA) * Math.tan(th);
  const drop2 = (cobC - cobB) * Math.tan(th);
  return rise1 - drop2;
}
const appCorrect = appPlaneFromCobs(Ca, Cb, Cc, ALPHA);
const eqCobA = equalMarks[0] - d10, eqCobB = equalMarks[1] - d20, eqCobC = equalMarks[2] - d10;
const appEqual = appPlaneFromCobs(eqCobA, eqCobB, eqCobC, ALPHA);
console.log('\n=== APP GEOMETRY MIRROR (COB legs × tan α) ===');
console.log(`Correct COBs → plane shift ${appCorrect.toFixed(6)}" (expect ~0)`);
console.log(`Equal-mark implied COBs [${frac(eqCobA)}, ${frac(eqCobB)}, ${frac(eqCobC)}]`);
console.log(`  COB legs ${(eqCobB-eqCobA).toFixed(4)}" / ${(eqCobC-eqCobB).toFixed(4)}" (unequal — third bend pushed)`);
console.log(`Equal-mark implied COBs → plane shift ${appEqual.toFixed(4)}" (${frac(appEqual)})`);
console.log(`Matches push-through sim within 1/32": ${Math.abs(appEqual - equal.planeShift) < 1/32 ? 'YES' : 'NO'}`);

console.log('\n=== VERDICT ===');
const okCorrect = correct.ok && correct.parallel && Math.abs(correct.planeShift)<0.05 && Math.abs(correct.peakError)<0.15;
console.log(`Correct marks restore start plane: ${Math.abs(correct.planeShift)<0.05?'YES':'NO'} (shift ${correct.planeShift.toFixed(4)}")`);
console.log(`Equal mark legs keep parallel heading: ${equal.parallel?'YES':'NO'}`);
console.log(`Equal mark legs shift finish plane: ${Math.abs(equal.planeShift)>0.05?'YES':'NO'} (shift ${equal.planeShift.toFixed(4)}" = ${frac(equal.planeShift)})`);
console.log(`That matches the claim: angles cancel (parallel) but wrong distances push the third bend so the run is parallel on a different plane.`);

if(!okCorrect){
  console.error('\nProof harness: correct-mark path did not close plane/peak within tolerance.');
  process.exit(1);
}
if(!(equal.parallel && Math.abs(equal.planeShift)>0.05)){
  console.error('\nProof harness: expected equal marks to stay parallel but shift plane.');
  process.exit(1);
}
if(Math.abs(appCorrect) > 1e-9 || Math.abs(appEqual - equal.planeShift) >= 1/32){
  console.error('\nApp geometry mirror failed.');
  process.exit(1);
}
console.log('\nProof OK.');
process.exit(0);
