/**
 * Drive Conduit Rack through the real viewer via window.__conduitTest.
 * Collisions are outer-skin (OD): centerlineDist − rA − rB.
 */
const puppeteer = require('/tmp/conduit-test/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.CONDUIT_URL || 'http://127.0.0.1:8000/';
const OUT = '/opt/cursor/artifacts/geometry-viewer-tests';
const SEEDS = [1, 2, 3, 7, 11, 17, 23, 42];

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function snap(page, name) {
  const file = path.join(OUT, `${name}.png`);
  const canvas = await page.$('#view');
  if (canvas) await canvas.screenshot({ path: file });
  else await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function dismiss(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.modal.open, #setupWizard.open, #projectStatusModal.open').forEach((el) => el.classList.remove('open'));
  });
}

async function collect(page) {
  return page.evaluate(() => {
    const T = window.__conduitTest;
    const s = T.state;
    const independent = T.odCollisions();
    const formulas = (s.modelData || []).map((d, i) => {
      const row = { i: i + 1, size: d.size };
      if (s.activeRackType === 'offset') {
        const expectedTO = Math.hypot(d.rise || 0, d.offsetDistance || 0);
        const theta = ((d.angle || 0) * Math.PI) / 180;
        row.toErr = Math.abs((d.trueOffset || 0) - expectedTO);
        row.travelErr = theta ? Math.abs((d.travel || 0) - expectedTO / Math.sin(theta)) : 0;
        row.shrinkErr = theta ? Math.abs((d.shrink || 0) - expectedTO * Math.tan(theta / 2)) : 0;
      }
      if (s.activeRackType === 'saddle') {
        const t1 = Math.hypot(d.rise || 0, d.offsetDistance || 0);
        const t2 = Math.hypot(d.secondRise || 0, d.secondOffsetDistance || 0);
        const theta = ((d.angle || 0) * Math.PI) / 180;
        row.to1Err = Math.abs((d.trueOffset1 || 0) - t1);
        row.to2Err = Math.abs((d.trueOffset2 || 0) - t2);
        row.travel1Err = theta ? Math.abs((d.travel1 || 0) - t1 / Math.sin(theta)) : 0;
        row.travel2Err = theta ? Math.abs((d.travel2 || 0) - t2 / Math.sin(theta)) : 0;
        row.shrink1Err = theta ? Math.abs((d.shrink1 || 0) - t1 * Math.tan(theta / 2)) : 0;
        row.shrink2Err = theta ? Math.abs((d.shrink2 || 0) - t2 * Math.tan(theta / 2)) : 0;
      }
      if (s.activeRackType === 'kicked-90' && d.rise != null && d.hyp != null && d.hyp > 0 && Math.abs(d.rise) <= Math.abs(d.hyp)) {
        const ang = (Math.asin(d.rise / d.hyp) * 180) / Math.PI;
        const sh = d.rise * Math.tan((ang * Math.PI) / 360);
        row.angleErr = Math.abs((d.angle || 0) - ang);
        row.shrinkErr = Math.abs((d.shrink || 0) - sh);
      }
      if (s.activeRackType === 'segmented' && d.radius != null) {
        const arc = (d.radius * Math.PI) / 2;
        row.arcErr = Math.abs((d.arcLength || 0) - arc);
        row.spacingErr = Math.abs((d.spacing || 0) - arc / 9);
      }
      return row;
    });
    const geometryChecks = (s.rackModels || []).map((m) => {
      const d = s.modelData[m.index];
      const start = m.points[0],
        end = m.points.at(-1);
      const trueDisp = Math.hypot(end[0] - start[0], end[1] - start[1]);
      let crownParallelErr = null,
        crownPitch = null;
      if (s.activeRackType === 'saddle' && m.secondBend && m.thirdBend && m.points.length > 1) {
        const a = m.startStraightEnd || m.points[1];
        const sx = a[0] - start[0],
          sy = a[1] - start[1],
          sz = a[2] - start[2];
        const sm = Math.hypot(sx, sy, sz) || 1;
        const ex = m.thirdBend[0] - m.secondBend[0],
          ey = m.thirdBend[1] - m.secondBend[1],
          ez = m.thirdBend[2] - m.secondBend[2];
        const em = Math.hypot(ex, ey, ez) || 1;
        const dot = (sx / sm) * (ex / em) + (sy / sm) * (ey / em) + (sz / sm) * (ez / em);
        crownParallelErr = Math.abs(Math.abs(dot) - 1);
        crownPitch = Math.abs(ey);
      }
      return {
        index: m.index + 1,
        trueDisp,
        expected: s.activeRackType === 'offset' ? d?.trueOffset : null,
        overLength: !!m.overLength,
        crownParallelErr,
        crownPitch,
      };
    });
    return {
      rackType: s.activeRackType,
      offsetType: s.activeOffsetType,
      saddleType: s.activeSaddleType,
      modelCount: (s.rackModels || []).length,
      collisions: (s.modelCollisions || []).map((c) => ({
        a: c.a + 1,
        b: c.b + 1,
        odClearance: c.clearance,
        required: c.requiredClearance,
        centerlineDist: c.distance,
      })),
      independent,
      formulas,
      geometryChecks,
      planeIssues: (s.rackPlaneIssues || []).length,
      hypIssues: (s.hypotenuseConflicts || []).length,
      transitionIssues: (s.transitionConsistencyIssues || []).length,
    };
  });
}

function formulaErrors(state) {
  const errs = [];
  for (const row of state.formulas || []) {
    for (const [k, v] of Object.entries(row)) {
      if (k.endsWith('Err') && typeof v === 'number' && v > 1e-6) errs.push({ row: row.i, field: k, err: v });
    }
  }
  for (const g of state.geometryChecks || []) {
    // Mixed OD + opposite strut sides retarget a shared contact plane, so
    // endpoint rise can differ slightly from entered true-offset — allow 0.15".
    if (state.rackType === 'offset' && g.expected != null && Math.abs(g.trueDisp - g.expected) > 0.15) {
      errs.push({ row: g.index, field: 'endpointDisp', err: Math.abs(g.trueDisp - g.expected), trueDisp: g.trueDisp, expected: g.expected });
    }
    if (state.rackType === 'saddle' && g.crownParallelErr != null && g.crownParallelErr > 1e-3) {
      errs.push({ row: g.index, field: 'crownParallel', err: g.crownParallelErr });
    }
    if (state.rackType === 'saddle' && g.crownPitch != null && g.crownPitch > 1 / 16) {
      errs.push({ row: g.index, field: 'crownPitch', err: g.crownPitch });
    }
  }
  if (state.rackType === 'saddle' && (state.transitionIssues || 0) > 0) {
    errs.push({ row: 0, field: 'saddleTransition', err: state.transitionIssues });
  }
  return errs;
}

/** Each scenario is {label, fn, args} so page.evaluate receives args (no closure leak). */
const scenarios = [];
const add = (label, fn, args = {}) => scenarios.push({ label, fn, args });

add('basic90_default', () => {
  const T = window.__conduitTest;
  T.set({ activeLayoutMode: 'rack' });
  T.switchBendType('basic-90');
  T.populateBasic90TestRack(false);
});
add('kicked90_loadLast', () => {
  const T = window.__conduitTest;
  T.set({ activeLayoutMode: 'rack' });
  T.switchBendType('kicked-90');
  T.loadLast();
});
add('offset_standard_default', () => {
  const T = window.__conduitTest;
  T.set({ activeLayoutMode: 'rack' });
  T.switchBendType('offset-standard');
  T.populateOffsetTestRack(false);
});
add('offset_parallel_default', () => {
  const T = window.__conduitTest;
  T.set({ activeLayoutMode: 'rack' });
  T.switchBendType('offset-parallel');
  T.populateOffsetTestRack(false);
});
add('offset_rolled_default', () => {
  const T = window.__conduitTest;
  T.set({ activeLayoutMode: 'rack' });
  T.switchBendType('offset-rolled');
  T.populateOffsetTestRack(false);
});
add('saddle_standard_default', () => {
  const T = window.__conduitTest;
  T.set({ activeLayoutMode: 'rack' });
  T.switchBendType('saddle-standard');
  T.populateSaddleTestRack(false);
});
add('saddle_rolled_default', () => {
  const T = window.__conduitTest;
  T.set({ activeLayoutMode: 'rack' });
  T.switchBendType('saddle-rolled');
  T.populateSaddleTestRack(false);
});
add('segmented90_default', () => {
  const T = window.__conduitTest;
  T.set({ activeLayoutMode: 'rack' });
  T.switchBendType('segmented-90');
  T.populateSegmentedTestRack(false);
});

for (const start of ['left', 'right']) {
  for (const horiz of ['left', 'right']) {
    add(
      `offset_parallel_${start}Start_${horiz}Horiz`,
      ({ start, horiz }) => {
        const T = window.__conduitTest;
        T.set({
          activeLayoutMode: 'rack',
          offsetRackStart: start,
          offsetHorizontalDirection: horiz,
          offsetCriticalBend: 'first',
          autoSpaceActive: true,
        });
        T.switchBendType('offset-parallel');
        T.updateRackModeUI();
        T.populateOffsetTestRack(false);
      },
      { start, horiz }
    );
  }
}

for (const vert of ['up', 'down']) {
  for (const horiz of ['left', 'right']) {
    add(
      `offset_rolled_${vert}_${horiz}`,
      ({ vert, horiz }) => {
        const T = window.__conduitTest;
        T.set({
          activeLayoutMode: 'rack',
          offsetRackStart: 'left',
          offsetVerticalDirection: vert,
          offsetHorizontalDirection: horiz,
          autoSpaceActive: true,
        });
        T.switchBendType('offset-rolled');
        T.updateRackModeUI();
        T.populateOffsetTestRack(false);
      },
      { vert, horiz }
    );
  }
}

for (const dir of ['up', 'down', 'left', 'right']) {
  add(
    `basic90_${dir}`,
    ({ dir }) => {
      const T = window.__conduitTest;
      T.set({ activeLayoutMode: 'rack', basic90Direction: dir });
      T.switchBendType('basic-90');
      T.populateBasic90TestRack(false);
    },
    { dir }
  );
}

for (const kickPos of ['before', 'after']) {
  for (const turn of ['left', 'right']) {
    for (const kickDir of ['up', 'down']) {
      add(
        `kicked90_${kickPos}_${turn}_${kickDir}`,
        ({ kickPos, turn, kickDir }) => {
          const T = window.__conduitTest;
          T.set({ activeLayoutMode: 'rack', autoSpaceActive: true });
          T.switchBendType('kicked-90');
          T.setRadioValue('kickPosition', kickPos);
          T.setRadioValue('turnDirection', turn);
          T.setRadioValue('kickDirection', kickDir);
          T.setRadioValue('firstStrutSide', 'top');
          T.setRadioValue('secondStrutSide', 'top');
          const setup = T.rackSetupFromReference('longest', turn);
          T.setRadioValue('direction', setup.direction);
          T.setRadioValue('startingSide', setup.startingSide);
          document.getElementById('count').value = 6;
          T.build(false);
          const sizes = ['3/4"', '3/4"', '1"', '1"', '1-1/4"', '1-1/4"'];
          [...document.querySelectorAll('#rows tr')].forEach((tr, i) => {
            tr.querySelector('.size').value = sizes[i];
            const b = tr.querySelector('.bender');
            const opts = [...b.options].map((o) => o.value).filter(Boolean);
            b.value = opts[0] || '';
            tr.querySelector('.strut').value = i === 0 ? '3' : '';
            const be = tr.querySelector('.bon') || tr.querySelector('.oal');
            if (be) {
              be.value = i === 0 ? '60' : '';
              be.dataset.auto = i === 0 ? '0' : '1';
            }
            tr.querySelector('.rise').value = i === 0 ? '6' : '';
            tr.querySelector('.hyp').value = i === 0 ? '24' : '';
            tr.querySelector('.hyp').dataset.auto = i === 0 ? '0' : '1';
          });
          T.updateAutoSpaceButton();
          T.applyAllAutoSpacing();
        },
        { kickPos, turn, kickDir }
      );
    }
  }
}

for (const turn of ['left', 'right']) {
  add(
    `segmented_${turn}`,
    ({ turn }) => {
      const T = window.__conduitTest;
      T.set({ activeLayoutMode: 'rack', segmentedTurnDirection: turn, segmentedReferenceMode: 'back' });
      T.switchBendType('segmented-90');
      T.populateSegmentedTestRack(false);
    },
    { turn }
  );
}

for (const vert of ['up', 'down']) {
  add(
    `saddle_std_${vert}`,
    ({ vert }) => {
      const T = window.__conduitTest;
      T.set({ activeLayoutMode: 'rack', saddleVerticalDirection: vert });
      T.switchBendType('saddle-standard');
      T.populateSaddleTestRack(false);
    },
    { vert }
  );
}

for (const horiz of ['left', 'right']) {
  add(
    `saddle_rolled_${horiz}Horiz`,
    ({ horiz }) => {
      const T = window.__conduitTest;
      T.set({
        activeLayoutMode: 'rack',
        saddleHorizontalDirection: horiz,
        saddleVerticalDirection: 'up',
        autoSpaceActive: true,
      });
      T.switchBendType('saddle-rolled');
      T.updateRackModeUI();
      T.populateSaddleTestRack(false);
    },
    { horiz }
  );
}

for (const seed of SEEDS) {
  for (const type of [
    'basic-90',
    'kicked-90',
    'offset-standard',
    'offset-parallel',
    'offset-rolled',
    'saddle-standard',
    'saddle-rolled',
    'segmented-90',
  ]) {
    add(
      `rand_${type.replace(/-/g, '_')}_s${seed}`,
      ({ seed, type }) => {
        const T = window.__conduitTest;
        T.seedRandom(seed);
        T.set({ activeLayoutMode: 'rack', autoSpaceActive: true });
        T.updateAutoSpaceButton();
        T.switchBendType(type);
        if (type === 'basic-90') T.populateBasic90TestRack(true);
        else if (type.startsWith('offset')) T.populateOffsetTestRack(true);
        else if (type.startsWith('saddle')) T.populateSaddleTestRack(true);
        else if (type === 'segmented-90') T.populateSegmentedTestRack(true);
        else T.randomRackTest();
      },
      { seed, type }
    );
  }
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  // Bust any stale cache
  await page.goto(BASE + '?t=' + Date.now(), { waitUntil: 'networkidle0' });
  await dismiss(page);
  const ready = await page.evaluate(() => !!window.__conduitTest);
  if (!ready) throw new Error('__conduitTest not available');

  const results = [];
  let pass = 0,
    fail = 0;

  for (const sc of scenarios) {
    try {
      await dismiss(page);
      await page.evaluate(sc.fn, sc.args);
      await sleep(250);
      await dismiss(page);
      await page.evaluate(() => {
        try {
          window.__conduitTest.fitCurrentView();
        } catch (_) {}
      });
      await sleep(120);
      const state = await collect(page);
      const shot = await snap(page, sc.label.replace(/[^a-zA-Z0-9_-]+/g, '_'));
      const fErrs = formulaErrors(state);
      const collisionFail = (state.independent || []).length > 0 || (state.collisions || []).length > 0;
      const ok = !collisionFail && fErrs.length === 0 && state.modelCount > 0;
      const result = { label: sc.label, shot, ...state, formulaErrors: fErrs, ok, collisionFail };
      if (ok) pass++;
      else fail++;
      results.push(result);
      console.log(
        `[${ok ? 'PASS' : 'FAIL'}] ${sc.label} models=${state.modelCount} coll=${state.collisions.length} indep=${state.independent.length} ferr=${fErrs.length}`
      );
      if (collisionFail) {
        console.log('  indep:', JSON.stringify(state.independent.slice(0, 4)));
        console.log('  app:', JSON.stringify(state.collisions.slice(0, 4)));
      }
      if (fErrs.length) console.log('  formula:', JSON.stringify(fErrs.slice(0, 5)));
    } catch (err) {
      fail++;
      console.error(`[ERROR] ${sc.label}:`, err.message);
      results.push({ label: sc.label, ok: false, error: err.message, collisionFail: true });
    }
  }

  const summary = {
    total: results.length,
    pass,
    fail,
    failedLabels: results.filter((r) => !r.ok).map((r) => r.label),
    collisionCases: results
      .filter((r) => (r.independent || []).length || (r.collisions || []).length)
      .map((r) => ({
        label: r.label,
        type: r.rackType,
        subtype: r.offsetType || r.saddleType,
        worstOd: Math.min(...[...(r.independent || []).map((c) => c.odClearance), Infinity]),
        independent: r.independent,
        app: r.collisions,
      })),
    formulaFailCases: results.filter((r) => (r.formulaErrors || []).length).map((r) => ({ label: r.label, errors: r.formulaErrors })),
    byType: {},
  };
  for (const r of results) {
    const k = r.error ? 'error' : r.rackType || 'unknown';
    if (!summary.byType[k]) summary.byType[k] = { pass: 0, fail: 0, collisions: 0 };
    if (r.ok) summary.byType[k].pass++;
    else summary.byType[k].fail++;
    if (r.collisionFail) summary.byType[k].collisions++;
  }

  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ summary, results }, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
