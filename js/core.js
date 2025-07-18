let playerIndex = null;
let yourTurn = false;
let localMoves = [];
let canPlay = false;
let isOnline = false;
let soundVolume = parseFloat(localStorage.getItem('volume'));
if (isNaN(soundVolume)) soundVolume = 1;
let replaySpeed = 1;
let replayFrames = [];
let replayIndex = 0;
let replayTimer = null;
let replayPaused = false;
let recorder = null;
let recordedChunks = [];

const mySide = () => (playerIndex === 0 ? 'A' : 'B');

function placeSymbol(x, y, who) {
  const cell = document.getElementById(`c${x}${y}`);
  if (cell) {
    cell.textContent = who === 0 ? 'X' : 'O';
  }
}

function onCellClick(x, y) {
  if (!canPlay) return;
  if (localMoves.length >= 5) return;
  localMoves.push({ x, y });
  applyMove({ x, y }, playerIndex);
  // confirmation handled via Next button in online mode
  if (localMoves.length === 5) {
    updateUI();
  }
}

function handleOpponentMove(move) {
  placeSymbol(move.x, move.y, 1 - playerIndex);
  yourTurn = true;
}

function applyMove(move, who) {
  placeSymbol(move.x, move.y, who);
}

function startNewRound() {
  localMoves = [];
  canPlay = true;
  console.log('Planning phase started');
}

(() => {
  const MAX_R = 4, STEPS = 5;
  const DXY = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  // aiRand controls how often the AI ignores optimal actions
  // aiMistake introduces deliberate suboptimal moves
  // aiSamples is the number of plans evaluated when autoplanning
  // planNoise and planNoiseVar add randomness to plan scoring
  let single = false, aiRand = 0.25, aiSamples = 60, planNoise = 0,
      aiMistake = 0, planNoiseVar = 0;
  let round = 1, step = 1, phase = 'planA';
  let plans = { A: [], B: [] };
  let usedMove = { A: new Set(), B: new Set() };
  let usedAtkDirs = { A: new Set(), B: new Set() };
  let usedAtk = { A: 0, B: 0 }, usedShield = { A: 0, B: 0 };
  let simPos = { A: { x: 0, y: 2 }, B: { x: 4, y: 2 } };
  let units = { A: { x: 0, y: 2, alive: true }, B: { x: 4, y: 2, alive: true } };
  let score = { A: 0, B: 0 };
  let edgesCollapsed = false;
  let replayHistory = [];
  let currentReplay = null;
  let isReplaying = false;
  let isTutorial = false;
  let tutorialIndex = 0;

  const ms = document.getElementById('modeSelect');
  const ds = document.getElementById('difficultySelect');
  const b1p = document.getElementById('btn1p');
  const b2p = document.getElementById('btn2p');
  const bOnline = document.getElementById('btnOnline');
  const rulesInit = document.getElementById('rulesBtnInitial');
  const rulesOv = document.getElementById('rulesOverlay');
  const rulesClose = document.getElementById('rulesClose');
  const rulesTutorial = document.getElementById('rulesTutorial');
  const onlineMenu = document.getElementById('onlineMenu');
  const onlineCreate = document.getElementById('onlineCreate');
  const onlineJoin = document.getElementById('onlineJoin');
  const roomInput = document.getElementById('roomInput');
  const p2pConnect = document.getElementById('p2pConnect');
  const p2pRoomInput = document.getElementById('p2pRoomInput');
  const board = document.getElementById('board');
  const ui = document.getElementById('ui');
  const phaseEl = document.getElementById('phase');
  const pcs = [...Array(STEPS)].map((_, i) => document.getElementById('pc' + i));
  const acts = Array.from(document.querySelectorAll('#actions button'));
  const btnDel = document.getElementById('btn-del');
  const btnNext = document.getElementById('btn-next');
  const atkOv = document.getElementById('atkOverlay');
  const scoreA = document.getElementById('scoreA');
  const scoreB = document.getElementById('scoreB');
  const scoreReset = document.getElementById('scoreReset');
  const tutorialScript = [
    { trigger: 'start', key: 'tutorial1' },
    { trigger: 'afterMove', key: 'tutorial2' },
    { trigger: 'afterConfirm', key: 'tutorial3' }
  ];

  function showTutorial(event) {
    if (!isTutorial) return;
    const step = tutorialScript[tutorialIndex];
    if (step && step.trigger === event && tutOv && tutCont && tutNext) {
      tutCont.textContent = t(step.key);
      tutOv.classList.add('show');
      tutNext.onclick = () => {
        tutOv.classList.remove('show');
        tutorialIndex++;
        if (tutorialIndex >= tutorialScript.length) {
          isTutorial = false;
          localStorage.setItem('tutorialDone', '1');
        }
      };
    }
  }

  function startTutorial() {
    single = true;
    isTutorial = true;
    tutorialIndex = 0;
    ms.style.display = 'none';
    if (ds) ds.style.display = 'none';
    startGame();
    resetGame();
    startNewRound();
    showTutorial('start');
  }

  window.startTutorial = startTutorial;
  const tutOv = document.getElementById('tutorialOverlay');
  const tutCont = document.getElementById('tutorialContent');
  const tutNext = document.getElementById('tutorialNext');

  let audioCtx;

  function playSound(type) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine';
    const freq = { move: 440, attack: 660, shield: 330, win: 880, ui: 550, nav: 500, death: 220 }[type] || 440;
    osc.frequency.value = freq; gain.gain.value = 0.3 * soundVolume;
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
  }

  // Expose sound function for handlers outside this scope
  window.playSound = playSound;

  function updateScore() {
    scoreA.textContent = score.A;
    scoreB.textContent = score.B;
  }

  scoreReset.onclick = () => {
    score = { A: 0, B: 0 };
    updateScore();
  };

  b1p.onclick = () => { single = true; ms.style.display = 'none'; ds.style.display = 'flex'; };
  b2p.onclick = () => { single = false; ms.style.display = 'none'; startGame(); };
  bOnline.onclick = () => { ms.style.display = 'none'; onlineMenu.style.display = 'flex'; };
  rulesInit.onclick = () => { rulesOv.style.display = 'block'; };
  rulesClose.onclick = () => rulesOv.style.display = 'none';
  if (rulesTutorial) rulesTutorial.onclick = () => { rulesOv.style.display = 'none'; startTutorial(); };

  ds.querySelector('.easy').onclick   = () => {
    aiRand = 0.6;  aiMistake = 0.5; aiSamples = 20;
    planNoise = 10; planNoiseVar = 3;
    ds.style.display = 'none'; startGame();
  };
  ds.querySelector('.medium').onclick = () => {
    aiRand = 0.3;  aiMistake = 0.2; aiSamples = 60;
    planNoise = 5;  planNoiseVar = 2;
    ds.style.display = 'none'; startGame();
  };
  ds.querySelector('.hard').onclick   = () => {
    aiRand = 0.1;  aiMistake = 0.05; aiSamples = 150;
    planNoise = 2;  planNoiseVar = 1;
    ds.style.display = 'none'; startGame();
  };
  ds.querySelector('.expert').onclick = () => {
    aiRand = 0.05; aiMistake = 0.02; aiSamples = 300;
    planNoise = 1;  planNoiseVar = 0.5;
    ds.style.display = 'none'; startGame();
  };
  ds.querySelector('.insane').onclick = () => {
    aiRand = 0.02; aiMistake = 0.01; aiSamples = 500;
    planNoise = 0;  planNoiseVar = 0;
    ds.style.display = 'none'; startGame();
  };

  onlineCreate.onclick = () => { createRoom(); };
  onlineJoin.onclick = () => { joinRoom(roomInput.value.trim()); };
  if (p2pConnect) {
    p2pConnect.onclick = () => {
      if (p2pRoomInput) connectToRoom(p2pRoomInput.value.trim());
    };
  }

  function startGame() {
    board.style.visibility = 'visible';
    ui.classList.add('show');
    buildBoard(); bindUI(); render(); updateUI();
    updateScore();
    edgesCollapsed = false;
    replayHistory = [];
  }

  function buildBoard() {
    board.innerHTML = '';
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const c = document.createElement('div');
        c.className = 'cell';
        c.id = `c${x}${y}`;
        c.addEventListener('click', () => onCellClick(x, y));
        board.append(c);
      }
    }
  }

  function bindUI() {
    acts.forEach(b => {
      b.onclick = () => {
        const P = isOnline ? mySide() : (phase === 'planA' ? 'A' : 'B');
        if (phase === 'execute' || plans[P].length >= STEPS) return;
        const act = b.dataset.act;
        if (DXY[act] && usedAtkDirs[P].has(act)) return;
        if (act === 'attack' && usedAtk[P] >= 1) return;
        if (act === 'shield' && usedShield[P] >= 1) return;
        act === 'attack' ? openAttack(P) : record(P, act);
      };
    });
    btnDel.onclick = () => { if (phase.startsWith('plan')) deleteLast(); };
    btnNext.onclick = () => nextStep();

    document.addEventListener('keydown', e => {
      if (atkOv.style.visibility === 'visible') return;
      const map = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        a: 'attack', s: 'shield'
      };
      if (map[e.key]) {
        const btn = acts.find(b => b.dataset.act === map[e.key]);
        if (btn && !btn.disabled) btn.click();
        e.preventDefault();
      } else if (e.key === 'Backspace') {
        if (phase.startsWith('plan')) btnDel.click();
      } else if (e.key === 'Enter') {
        btnNext.click();
      }
    });
  }

  function openAttack(P) {
    atkOv.innerHTML = '';
    atkOv.style.visibility = 'visible';
    let tmp = [];
    ['up', 'left', 'right', 'down'].forEach(d => {
      if (usedMove[P].has(d)) return;
      const btn = document.createElement('button');
      btn.className = d;
      btn.textContent = { up: '▲', down: '▼', left: '◀', right: '▶' }[d];
      btn.onclick = () => {
        if (tmp.includes(d)) {
          tmp = tmp.filter(x => x !== d);
          btn.classList.remove('sel');
        } else {
          tmp.push(d);
          btn.classList.add('sel');
        }
      };
      atkOv.append(btn);
    });
    const ok = document.createElement('button');
    ok.textContent = t('ok');
    ok.className = 'confirm';
    ok.onclick = () => {
      record(P, { type: 'attack', dirs: tmp.slice() });
      usedAtk[P]++; tmp.forEach(d => usedAtkDirs[P].add(d));
      atkOv.style.visibility = 'hidden';
    };
    atkOv.append(ok);

    const cancel = document.createElement('button');
    cancel.textContent = t('cancel');
    cancel.className = 'cancel';
    cancel.onclick = () => {
      atkOv.style.visibility = 'hidden';
    };
    atkOv.append(cancel);
  }

  function record(P, act) {
    plans[P].push(act);
    if (typeof act === 'string') {
      if (act === 'shield') usedShield[P]++;
      if (DXY[act]) {
        usedMove[P].add(act);
        simPos[P].x += DXY[act][0];
        simPos[P].y += DXY[act][1];
      }
    }
    updateUI();
    drawPlan(P);
    showTutorial('afterMove');
  }

  function deleteLast() {
    const P = isOnline ? mySide() : (phase === 'planA' ? 'A' : 'B');
    if (!plans[P].length) return;
    const a = plans[P].pop();
    if (typeof a === 'string') {
      if (a === 'shield') usedShield[P]--;
      if (DXY[a]) {
        usedMove[P].delete(a);
        simPos[P] = { ...units[P] };
        plans[P].forEach(r => {
          if (typeof r === 'string' && DXY[r]) {
            simPos[P].x += DXY[r][0]; simPos[P].y += DXY[r][1];
          }
        });
      }
    } else {
      usedAtk[P]--; a.dirs.forEach(d => usedAtkDirs[P].delete(d));
    }
    updateUI();
    drawPlan(P);
  }

  function nextStep() {
    if (isOnline && phase !== 'execute') {
      const moves = plans[mySide()];
      if (moves.length === STEPS) {
        if (window.peer) {
          sendPeerData({ type: 'moves', moves });
          sentMoves = true;
          btnNext.disabled = true;
          maybeStartPeerRound();
        } else {
          submitMoves(moves);
          btnNext.disabled = true;
        }
      }
      return;
    }
  if (phase === 'planA' && single) {
    autoPlanB();
    phase = 'execute';
    startRecordingRound();
    btnNext.textContent = t('executeBtn');
    clearPlan(); updateUI();
    showTutorial('afterConfirm');
    return;
  }
  if (phase !== 'execute') {
    phase = phase === 'planA' ? 'planB' : 'execute';
    if (phase === 'execute') { startRecordingRound(); showTutorial('afterConfirm'); }
    btnNext.textContent = phase === 'execute' ? t('executeBtn') : t('nextBtn');
    clearPlan(); updateUI();
    return;
  }
    execStep();
  }

  function simApplyMove(unit, act, collapsed) {
    if (typeof act === 'string' && DXY[act]) {
      let nx = unit.x + DXY[act][0];
      let ny = unit.y + DXY[act][1];
      nx = Math.max(0, Math.min(4, nx));
      ny = Math.max(0, Math.min(4, ny));
      if (collapsed && (nx === 0 || nx === 4 || ny === 0 || ny === 4)) {
        unit.alive = false;
      } else {
        unit.x = nx; unit.y = ny;
      }
    }
  }

  function simStep(state, actA, actB) {
    const { units } = state;
    simApplyMove(units.A, actA, state.edgesCollapsed);
    simApplyMove(units.B, actB, state.edgesCollapsed);

    const shieldA = actA === 'shield';
    const shieldB = actB === 'shield';

    if (typeof actA === 'object' && units.A.alive) {
      const atk = actA, tx = units.A.x, ty = units.A.y;
      if (!shieldB && units.B.alive && units.B.x === tx && units.B.y === ty) units.B.alive = false;
      atk.dirs.forEach(d => {
        const [dx, dy] = DXY[d];
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || nx > 4 || ny < 0 || ny > 4) return;
        if (!shieldB && units.B.alive && units.B.x === nx && units.B.y === ny) units.B.alive = false;
      });
    }

    if (typeof actB === 'object' && units.B.alive) {
      const atk = actB, tx = units.B.x, ty = units.B.y;
      if (!shieldA && units.A.alive && units.A.x === tx && units.A.y === ty) units.A.alive = false;
      atk.dirs.forEach(d => {
        const [dx, dy] = DXY[d];
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || nx > 4 || ny < 0 || ny > 4) return;
        if (!shieldA && units.A.alive && units.A.x === nx && units.A.y === ny) units.A.alive = false;
      });
    }

    state.step++;
    if (state.round === 4 && state.step === 2 && !state.edgesCollapsed) {
      state.edgesCollapsed = true;
      ['A', 'B'].forEach(pl => {
        const u = state.units[pl];
        if (u.alive && (u.x === 0 || u.x === 4 || u.y === 0 || u.y === 4)) u.alive = false;
      });
    }
  }

  function simOutcome(state) {
    if (!state.units.A.alive && !state.units.B.alive) return 'draw';
    if (state.units.A.alive && !state.units.B.alive) return 'A';
    if (!state.units.A.alive && state.units.B.alive) return 'B';
    return null;
  }

  function simulateSequence(planA, planB) {
    const state = {
      units: {
        A: { ...units.A },
        B: { ...units.B }
      },
      round,
      step: 1,
      edgesCollapsed
    };
    for (let i = 0; i < STEPS; i++) {
      simStep(state, planA[i], planB[i]);
      const out = simOutcome(state);
      if (out) break;
    }
    return state;
  }

  function scoreState(state) {
    const ua = state.units.A, ub = state.units.B;
    if (!ub.alive && !ua.alive) return -50;
    if (!ub.alive) return -100;
    if (!ua.alive) return 200;
    let dist = Math.abs(ub.x - ua.x) + Math.abs(ub.y - ua.y);
    let s = 10 - dist;
    if (dist === 1) s += 20;
    if (state.edgesCollapsed && (ub.x === 0 || ub.x === 4 || ub.y === 0 || ub.y === 4)) s -= 40;
    return s;
  }

  function randomAction(state, usedMoveSet, usedAtkSet, atkCount, shieldCount) {
    const me = state.units.B, opp = state.units.A;
    const di = Object.entries(DXY).find(([d, [dx, dy]]) =>
      me.x + dx === opp.x && me.y + dy === opp.y && !usedMoveSet.has(d)
    );
    if (di && atkCount < 1 && Math.random() > aiRand) {
      const [d] = di; return { type: 'attack', dirs: [d] };
    }
    let best = null, bd = Infinity;
    const opts = [];
    for (const [d, [dx, dy]] of Object.entries(DXY)) {
      if (usedAtkSet.has(d)) continue;
      const nx = me.x + dx, ny = me.y + dy;
      if (nx < 0 || nx > 4 || ny < 0 || ny > 4) continue;
      opts.push(d);
      const dist = Math.abs(nx - opp.x) + Math.abs(ny - opp.y);
      if (dist < bd) { bd = dist; best = d; }
    }
    if (best && opts.length > 1 && Math.random() < aiMistake) {
      const sub = opts.filter(o => o !== best);
      return sub[Math.floor(Math.random() * sub.length)];
    }
    if (Math.random() > aiRand && best) return best;
    if (shieldCount < 1 && Math.random() < 0.3) return 'shield';
    if (atkCount < 1) opts.push({ type: 'attack', dirs: [] });
    if (shieldCount < 1) opts.push('shield');
    return opts[Math.floor(Math.random() * opts.length)];
  }

  function autoPlanB() {
    plans.B = []; usedMove.B.clear(); usedAtkDirs.B.clear();
    usedAtk.B = 0; usedShield.B = 0; simPos.B = { ...units.B };

    const samples = aiSamples || 50;
    const candidates = [];
    for (let s = 0; s < samples; s++) {
      const state = {
        units: { A: { ...units.A }, B: { ...units.B } },
        round,
        step: 1,
        edgesCollapsed
      };
      const usedM = new Set();
      const usedA = new Set();
      let atkC = 0, shC = 0;
      const plan = [];
      for (let i = 0; i < STEPS; i++) {
        const act = randomAction(state, usedM, usedA, atkC, shC);
        plan.push(act);
        if (typeof act === 'string') {
          if (act === 'shield') shC++; else usedM.add(act);
        } else {
          atkC++; act.dirs.forEach(d => usedA.add(d));
        }
        simStep(state, plans.A[i], act);
        if (!state.units.B.alive) break;
      }
      candidates.push({ plan, score: scoreState(state) });
    }
    candidates.forEach(c => {
      const amp = planNoise + Math.random() * planNoiseVar;
      c.score += (Math.random() * 2 - 1) * amp;
    });
    candidates.sort((a, b) => b.score - a.score);
    const nTop = Math.min(candidates.length, Math.max(1, Math.round(1 / aiRand)));
    const choice = candidates[Math.floor(Math.random() * nTop)] || { plan: [] };
    plans.B = choice.plan;
  }

  function updateUI() {
    const P = isOnline ? mySide() : (phase === 'planA' ? 'A' : 'B');
    phaseEl.textContent =
      `${t('round')} ${round}/${MAX_R}, ${P}: ` +
      (phase === 'execute' ? t('turn') : t('plan')) +
      ` ${phase === 'execute' ? step : plans[P].length}/${STEPS}`;
    pcs.forEach((pc, i) => {
      const a = plans[P][i];
      pc.textContent = a
        ? typeof a === 'object' ? '⚔'
          : a === 'shield' ? '🛡'
          : { up: '↑', down: '↓', left: '←', right: '→' }[a]
        : '';
    });
    acts.forEach(b => {
      const a = b.dataset.act;
      b.disabled = false; b.classList.remove('blocked');
      if (DXY[a] && usedAtkDirs[P].has(a)) {
        b.disabled = true; b.classList.add('blocked');
      }
      if (a === 'attack' && usedAtk[P] >= 1) b.disabled = true;
      if (a === 'shield' && usedShield[P] >= 1) b.disabled = true;
    });
    if (single && phase === 'planA') {
      btnNext.disabled = plans[P].length !== STEPS;
    } else if (isOnline) {
      if (phase === 'execute') btnNext.disabled = false;
      else btnNext.disabled = plans[P].length !== STEPS;
    } else {
      btnNext.disabled = (plans[P].length < STEPS && phase !== 'execute');
    }
    btnDel.style.visibility = phase.startsWith('plan') ? 'visible' : 'hidden';
    document.querySelectorAll('.cell').forEach(c => {
      const x = +c.id[1], y = +c.id[2], edge = x === 0 || x === 4 || y === 0 || y === 4;
      c.classList.remove('cracked', 'lava');
      if (round === 4 && phase.startsWith('plan') && edge && !edgesCollapsed) {
        c.classList.add('cracked');
      } else if (edgesCollapsed && edge) {
        c.classList.add('lava');
      }
    });
  }

  function drawPlan(P) {
    if (!document.getElementById('c00')) return;
    clearPlan();
    if (phase === 'execute') return;
    let { x, y } = units[P];
    plans[P].forEach(r => {
      if (typeof r === 'string' && DXY[r]) {
        x += DXY[r][0]; y += DXY[r][1];
      }
      x = Math.max(0, Math.min(4, x)); y = Math.max(0, Math.min(4, y));
      const cell = document.getElementById(`c${x}${y}`);
      let ov = document.createElement('div');
      if (typeof r === 'object') {
        ov.className = 'planAttack'; ov.textContent = '•'; cell.append(ov);
        r.dirs.forEach(d => {
          const [dx, dy] = DXY[d], nx = x + dx, ny = y + dy;
          if (nx < 0 || nx > 4 || ny < 0 || ny > 4) return;
          const c2 = document.getElementById(`c${nx}${ny}`), ov2 = document.createElement('div');
          ov2.className = 'planAttack';
          ov2.textContent = { up: '↑', down: '↓', left: '←', right: '→' }[d];
          c2.append(ov2);
        });
      } else if (r === 'shield') {
        ov.className = 'planShield'; cell.append(ov);
      } else {
        ov.className = 'planMove';
        ov.textContent = { up: '↑', down: '↓', left: '←', right: '→' }[r];
        cell.append(ov);
      }
    });
  }


  function execStep() {
    clearPlan();
    document.querySelectorAll('.attack,.shield,.death').forEach(e => e.remove());
    const [aA, aB] = [plans.A[step - 1], plans.B[step - 1]];
    const moved = { A: false, B: false };
    ['A', 'B'].forEach(pl => {
      const r = pl === 'A' ? aA : aB;
      if (typeof r === 'string' && DXY[r]) {
        let nx = units[pl].x + DXY[r][0];
        let ny = units[pl].y + DXY[r][1];
        nx = Math.max(0, Math.min(4, nx));
        ny = Math.max(0, Math.min(4, ny));
        if (edgesCollapsed && (nx === 0 || nx === 4 || ny === 0 || ny === 4)) {
          units[pl].alive = false;
          showDeath(nx, ny);
          playSound('death');
        } else {
          units[pl].x = nx; units[pl].y = ny; playSound('move');
          moved[pl] = true;
        }
      }
    });
    render();
    Object.keys(moved).forEach(pl => {
      if (moved[pl]) {
        const el = document.querySelector(`#c${units[pl].x}${units[pl].y} .player${pl}`);
        if (el) el.classList.add('moveAnim');
      }
    });
    ['A', 'B'].forEach(pl => {
      const r = pl === 'A' ? aA : aB, other = pl === 'A' ? 'B' : 'A';
      if (typeof r === 'object') {
        const u = units[pl], tx = u.x, ty = u.y;
        const sh = plans[other][step - 1] === 'shield';
        const cellS = document.getElementById(`c${tx}${ty}`), ovS = document.createElement('div');
        ovS.className = 'attack'; cellS.append(ovS);
        if (!sh && units[other].x === tx && units[other].y === ty) {
          units[other].alive = false;
          showDeath(tx, ty);
          playSound('death');
        }
        r.dirs.forEach(d => {
          const [dx, dy] = DXY[d], nx = tx + dx, ny = ty + dy;
          if (nx < 0 || nx > 4 || ny < 0 || ny > 4) return;
          const cell2 = document.getElementById(`c${nx}${ny}`), ov2 = document.createElement('div');
          ov2.className = 'attack'; cell2.append(ov2);
          if (!sh && units[other].x === nx && units[other].y === ny) {
            units[other].alive = false;
            showDeath(nx, ny);
            playSound('death');
          }
        });
        playSound('attack');
      }
    });
    ['A', 'B'].forEach(pl => {
      const r = pl === 'A' ? aA : aB;
      if (r === 'shield') {
        const u = units[pl], ov = document.createElement('div');
        ov.className = 'shield'; document.getElementById(`c${u.x}${u.y}`).append(ov);
        playSound('shield');
      }
    });
    render();
    recordState();

    if (checkOutcome()) return;

    step++;
    if (round === 4 && step === 2 && !edgesCollapsed) {
      if (collapseEdges()) return;
    }
    if (step > STEPS) {
      finalizeRound();
      if (typeof sendState === 'function') {
        sendState(JSON.stringify({ units, round, step }));
      }
      round++;
      if (round > MAX_R) { showResult(t('exhaustedDraw')); return; }
      phase = 'planA'; step = 1;
      plans = { A: [], B: [] };
      window.plans = plans;
      usedMove = { A: new Set(), B: new Set() };
      usedAtkDirs = { A: new Set(), B: new Set() };
      usedAtk = { A: 0, B: 0 }; usedShield = { A: 0, B: 0 };
      simPos = { A: { x: units.A.x, y: units.A.y }, B: { x: units.B.x, y: units.B.y } };
      btnNext.textContent = t('nextBtn');
      startNewRound();
    }
    updateUI();
  }

  function render() {
    if (!document.getElementById('c00')) return;
    document.querySelectorAll('.playerA,.playerB,.playerHalf').forEach(e => e.remove());
    if (units.A.alive && units.B.alive && units.A.x === units.B.x && units.A.y === units.B.y) {
      const cell = document.getElementById(`c${units.A.x}${units.A.y}`);
      ['halfA', 'halfB'].forEach(cls => {
        const h = document.createElement('div'); h.className = 'playerHalf ' + cls;
        cell.append(h);
      });
    } else {
      ['A', 'B'].forEach(pl => {
        const u = units[pl]; if (!u.alive) return;
        const cell = document.getElementById(`c${u.x}${u.y}`);
        const p = document.createElement('div'); p.className = pl === 'A' ? 'playerA' : 'playerB';
        cell.append(p);
      });
    }
  }

  function checkOutcome() {
    let sim = false, win = null;
    if (!units.A.alive && !units.B.alive) sim = true;
    else if (units.A.alive && !units.B.alive) win = 'A';
    else if (!units.A.alive && units.B.alive) win = 'B';
    else if (step > STEPS && round >= MAX_R) win = 'DRAW';
    if (sim || win) {
      const txt = sim ? t('bothDieDraw') :
        win === 'DRAW' ? t('exhaustedDraw') :
        (win === 'A' ? t('playerA_wins') : t('playerB_wins'));
      if (win === 'A' || win === 'B') { score[win]++; updateScore(); playSound('win'); }
      finalizeRound();
      showResult(txt); return true;
    }
    return false;
  }

  function collapseEdges() {
    edgesCollapsed = true;
    document.querySelectorAll('.cell').forEach(c => {
      const x = +c.id[1], y = +c.id[2];
      if (x === 0 || x === 4 || y === 0 || y === 4) {
        c.classList.remove('cracked');
        c.classList.add('collapse');
        setTimeout(() => { c.classList.remove('collapse'); c.classList.add('lava'); }, 600);
      }
    });
    ['A', 'B'].forEach(pl => {
      const u = units[pl];
      if (u.alive && (u.x === 0 || u.x === 4 || u.y === 0 || u.y === 4)) {
        u.alive = false;
        showDeath(u.x, u.y);
        playSound('death');
      }
    });
    render();
    recordState();
    return checkOutcome();
  }

  function cloneState() {
    return {
      round,
      step,
      edgesCollapsed,
      units: {
        A: { ...units.A },
        B: { ...units.B }
      }
    };
  }

  function startRecordingRound() {
    currentReplay = {
      actions: {
        A: JSON.parse(JSON.stringify(plans.A)),
        B: JSON.parse(JSON.stringify(plans.B))
      },
      states: []
    };
    currentReplay.states.push(cloneState());
  }

  function recordState() { if (currentReplay) currentReplay.states.push(cloneState()); }

  function finalizeRound() {
    if (currentReplay) {
      replayHistory.push(currentReplay);
      currentReplay = null;
    }
    updateReplayButton();
  }

  function startReplay() {
    if (isReplaying || replayHistory.length === 0) return;
    isReplaying = true;
    const ov = document.getElementById('replayOverlay');
    if (ov) ov.classList.add('show');
    replayPaused = false;
    const pauseBtn = document.getElementById('replayPause');
    if (pauseBtn) pauseBtn.textContent = '❚❚';
    resetGame();
    replayFrames = [];
    replayHistory.forEach(r => {
      if (r.states.length) replayFrames.push({ state: r.states[0] });
      for (let i = 1; i < r.states.length; i++) {
        replayFrames.push({
          state: r.states[i],
          actions: { A: r.actions.A[i - 1], B: r.actions.B[i - 1] }
        });
      }
    });
    replayIndex = 0;
    const seek = document.getElementById('replaySeek');
    if (seek) {
      seek.max = replayFrames.length - 1;
      seek.value = 0;
    }
    function play() {
      if (!isReplaying) return;
      if (replayPaused) { replayTimer = setTimeout(play, 100); return; }
      if (replayIndex >= replayFrames.length) {
        replayPaused = true;
        replayIndex = replayFrames.length - 1;
        if (seek) seek.value = replayIndex;
        const pauseBtn = document.getElementById('replayPause');
        if (pauseBtn) pauseBtn.textContent = '▶';
        return;
      }
      const f = replayFrames[replayIndex++];
      renderReplayFrame(f);
      if (seek) seek.value = replayIndex;
      replayTimer = setTimeout(play, 700 / (replaySpeed || 0.1));
    }
    play();
  }

  function renderReplayFrame(f) {
    const st = f.state;
    round = st.round; step = st.step; edgesCollapsed = st.edgesCollapsed;
    units = { A: { ...st.units.A }, B: { ...st.units.B } };
    render(); updateUI();
    if (f.actions) animateReplayActions(f.actions);
  }

  function seekReplay(idx) {
    if (!isReplaying) return;
    if (idx < 0) idx = 0;
    if (idx >= replayFrames.length) idx = replayFrames.length - 1;
    replayIndex = idx;
    clearTimeout(replayTimer);
    const seek = document.getElementById('replaySeek');
    if (seek) seek.value = replayIndex;
    renderReplayFrame(replayFrames[replayIndex]);
  }

  async function saveReplayVideo() {
    if (!replayHistory.length || recorder) return;
    let stream;
    if (document.body.captureStream) {
      stream = document.body.captureStream();
    } else if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      try { stream = await navigator.mediaDevices.getDisplayMedia({ video: true }); }
      catch (e) { alert(t('recordingNotSupported')); return; }
    } else {
      alert(t('recordingNotSupported'));
      return;
    }
    recordedChunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => recordedChunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const file = new File([blob], 'replay.webm', { type: 'video/webm' });
      if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (e) {
          const url = URL.createObjectURL(file);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'replay.webm';
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'replay.webm';
        a.click();
        URL.revokeObjectURL(url);
      }
      recordedChunks = [];
    };
    recorder.start();
    startReplay();
  }

  function animateReplayActions(acts) {
    document.querySelectorAll('.attack,.shield,.death').forEach(e => e.remove());
    ['A', 'B'].forEach(pl => {
      const act = acts[pl];
      if (!act) return;
      if (typeof act === 'object') {
        const u = units[pl];
        const cellS = document.getElementById(`c${u.x}${u.y}`);
        if (cellS) {
          const ovS = document.createElement('div');
          ovS.className = 'attack';
          cellS.append(ovS);
          act.dirs.forEach(d => {
            const [dx, dy] = DXY[d];
            const nx = u.x + dx, ny = u.y + dy;
            if (nx < 0 || nx > 4 || ny < 0 || ny > 4) return;
            const c2 = document.getElementById(`c${nx}${ny}`);
            if (!c2) return;
            const ov2 = document.createElement('div');
            ov2.className = 'attack';
            c2.append(ov2);
          });
        }
      } else if (act === 'shield') {
        const u = units[pl];
        const cell = document.getElementById(`c${u.x}${u.y}`);
        if (cell) {
          const ov = document.createElement('div');
          ov.className = 'shield';
          cell.append(ov);
        }
      }
    });
    setTimeout(() => {
      document.querySelectorAll('.attack,.shield,.death').forEach(e => e.remove());
    }, 500);
  }

  function showDeath(x, y) {
    const cell = document.getElementById(`c${x}${y}`);
    if (!cell) return;
    const ov = document.createElement('div');
    ov.className = 'death';
    cell.append(ov);
  }

  function endReplay() {
    isReplaying = false;
    if (recorder) {
      try { recorder.stop(); } catch (e) {}
      recorder = null;
    }
    const ov = document.getElementById('replayOverlay');
    if (ov) ov.classList.remove('show');
    resetGame();
    updateScore();
    updateReplayButton();
  }

  window.startReplay = startReplay;

  function updateReplayButton() {
    const btn = document.getElementById('replayBtn');
    if (btn) btn.style.display = replayHistory.length ? 'inline-block' : 'none';
  }

  window.updateReplayButton = updateReplayButton;

  function showSaveSpeedModal() {
    if (document.getElementById('speedModal')) return;
    const ov = document.createElement('div');
    ov.id = 'speedModal';
    ov.innerHTML =
      `<div style="margin-bottom:8px;">${t('selectSpeed')}</div>` +
      '<div style="display:flex;gap:8px;justify-content:center;">' +
      '<button data-speed="1">1x</button>' +
      '<button data-speed="2">2x</button>' +
      '<button data-speed="3">3x</button>' +
      '<button data-speed="4">4x</button>' +
      '<button data-speed="5">5x</button>' +
      '</div>';
    document.body.append(ov);
    ov.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        replaySpeed = parseFloat(btn.dataset.speed);
        ov.remove();
        saveReplayVideo();
      };
    });
  }

  function showResult(text) {
    const ov = document.createElement('div');
    ov.id = 'resultOverlay';
    ov.innerHTML =
      `<div>${text}</div>` +
      '<div style="margin-top:10px;display:flex;gap:8px;justify-content:center;">' +
      `<button id="resReplay">${t('replay')}</button>` +
      `<button id="resMenu">${t('toMenu')}</button>` +
      `<button id="resOk">${t('ok')}</button>` +
      '</div>';
    document.body.append(ov);
    document.getElementById('resOk').onclick = () => {
      ov.remove();
      resetGame();
      if (typeof window.exitOnlineMode === 'function') window.exitOnlineMode();
      if (typeof window.cleanupRoom === 'function') window.cleanupRoom();
    };
    document.getElementById('resMenu').onclick = () => {
      ov.remove();
      returnToMenu();
    };
    document.getElementById('resReplay').onclick = () => {
      ov.remove();
      startReplay();
    };
  }

  function resetGame() {
    round = 1; step = 1; phase = 'planA';
    plans = { A: [], B: [] };
    window.plans = plans;
    usedMove = { A: new Set(), B: new Set() };
    usedAtkDirs = { A: new Set(), B: new Set() };
    usedAtk = { A: 0, B: 0 }; usedShield = { A: 0, B: 0 };
    simPos = { A: { x: 0, y: 2 }, B: { x: 4, y: 2 } };
    units = { A: { x: 0, y: 2, alive: true }, B: { x: 4, y: 2, alive: true } };
    edgesCollapsed = false;
    clearPlan();
    document.querySelectorAll('.attack,.shield,.death').forEach(e => e.remove());
    render(); btnNext.textContent = t('nextBtn'); updateUI();
  }

  function clearPlan() {
    document.querySelectorAll('.planMove,.planAttack,.planShield').forEach(e => e.remove());
  }

  window.launchGame = startGame;
  window.startOnlineGame = function(idx) {
    single = false;
    playerIndex = idx;
    isOnline = true;
    ms.style.display = 'none';
    if (onlineMenu) onlineMenu.style.display = 'none';
    startGame();
    resetGame();
    startNewRound();
  };

  let peerMoves = null;
  let sentMoves = false;
  window.onPeerConnect = function(initiator) {
    window.startOnlineGame(initiator ? 0 : 1);
  };

  window.onPeerMessage = function(msg) {
    if (msg.type === 'moves') {
      peerMoves = msg.moves;
      maybeStartPeerRound();
    }
  };

  window.onPeerClose = function() {
    peerMoves = null;
    sentMoves = false;
    returnToMenu();
  };

  function maybeStartPeerRound() {
    const myMoves = plans[mySide()];
    if (peerMoves && sentMoves && myMoves.length === STEPS) {
      const moves = playerIndex === 0 ? [myMoves, peerMoves] : [peerMoves, myMoves];
      peerMoves = null;
      sentMoves = false;
      onStartRound(moves);
    }
  }

  function exitOnlineMode() {
    isOnline = false;
    playerIndex = null;
  }

  window.exitOnlineMode = exitOnlineMode;
  function returnToMenu() {
    resetGame();
    board.style.visibility = 'hidden';
    ui.classList.remove('show');
    if (typeof window.cleanupRoom === 'function') window.cleanupRoom();
    if (typeof window.disconnectPeer === 'function') window.disconnectPeer();
    exitOnlineMode();
    ms.style.display = 'flex';
    if (ds) ds.style.display = 'none';
    if (onlineMenu) onlineMenu.style.display = 'none';
  }

  window.returnToMenu = returnToMenu;
  window.plans = plans;

  window.onStartRound = function(moves) {
    plans = { A: moves[0], B: moves[1] };
    window.plans = plans;
    console.log('Starting execution phase with moves', moves);
    phase = 'execute';
    step = 1;
    startRecordingRound();
    const next = document.getElementById('btn-next');
    if (next) {
      next.style.display = 'inline-block';
      next.textContent = t('executeBtn');
      next.disabled = false;
    }
    clearPlan();
    updateUI();
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const settingsClose = document.getElementById('settingsClose');
  const volumeSlider = document.getElementById('volumeSlider');
  const langSelect = document.getElementById('langSelect');
  const menuBtn = document.getElementById('menuBtn');
  const replayClose = document.getElementById('replayClose');
  const speedBtns = document.querySelectorAll('.speedBtn');
  const replayPauseBtn = document.getElementById('replayPause');
  const replayBtn = document.getElementById('replayBtn');
  const saveReplayBtn = document.getElementById('saveReplay');
  const replaySeek = document.getElementById('replaySeek');

  if (settingsBtn && settingsModal) {
    settingsBtn.onclick = () => { settingsModal.style.display = 'block'; };
  }
  if (settingsClose && settingsModal) {
    settingsClose.onclick = () => { settingsModal.style.display = 'none'; };
  }
  if (volumeSlider) {
    volumeSlider.value = soundVolume;
    volumeSlider.oninput = () => {
      soundVolume = parseFloat(volumeSlider.value);
      localStorage.setItem('volume', soundVolume);
    };
  }
  if (langSelect) {
    langSelect.dataset.value = window.i18n ? window.i18n.lang : 'en';
  }
  if (typeof setupDropdowns === 'function') setupDropdowns();
  if (langSelect) {
    langSelect.addEventListener('change', () => {
      const val = langSelect.dataset.value;
      if (window.i18n) {
        window.i18n.setLang(val);
        localStorage.setItem('language', val);
      }
    });
  }
  if (menuBtn) menuBtn.onclick = () => returnToMenu();
  if (replayClose) replayClose.onclick = () => endReplay();
  if (replayBtn) {
    replayBtn.onclick = () => startReplay();
    updateReplayButton();
  }
  if (saveReplayBtn) saveReplayBtn.onclick = () => showSaveSpeedModal();
  if (replaySeek) replaySeek.oninput = () => seekReplay(parseInt(replaySeek.value));
  if (speedBtns.length) {
    speedBtns.forEach(btn => {
      if (parseFloat(btn.dataset.speed) === replaySpeed) btn.classList.add('active');
      btn.onclick = () => {
        replaySpeed = parseFloat(btn.dataset.speed);
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });
  }
  if (replayPauseBtn) {
    replayPauseBtn.onclick = () => {
      replayPaused = !replayPaused;
      replayPauseBtn.textContent = replayPaused ? '▶' : '❚❚';
    };
  }

  document.body.addEventListener("click", e => {
    playSound(e.target.dataset.sound || "ui");
  });

  if (!localStorage.getItem('tutorialDone') && typeof window.startTutorial === 'function') {
    window.startTutorial();
  }
});

// Prevent double-click zoom on mobile
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
