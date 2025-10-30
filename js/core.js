let playerIndex = null;
let yourTurn = false;
let localMoves = [];
let canPlay = false;
let isOnline = false;
let soundVolume = parseFloat(localStorage.getItem('volume'));
if (isNaN(soundVolume)) soundVolume = 1;
soundVolume = Math.min(Math.max(soundVolume, 0), 1);
const storedMuted = localStorage.getItem('soundMuted');
let soundMuted = storedMuted === '1';
if (storedMuted === null && soundVolume === 0) soundMuted = true;
let replaySpeed = 1;
let replayFrames = [];
let replayIndex = 0;
let replayTimer = null;
let replayPaused = false;
let recorder = null;
let recordedChunks = [];
let attackMode = false;
let attackModeOwner = null;

const mySide = () => (playerIndex === 0 ? 'A' : 'B');

function placeSymbol(x, y, who) {
  const cell = document.getElementById(`c${x}${y}`);
  if (cell) {
    cell.textContent = who === 0 ? 'X' : 'O';
  }
}

function onCellClick(x, y) {
  if (attackMode) return;
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
  let onlineConfirmed = { A: false, B: false };
  let waitingForServer = false;
  let revealReady = false;
  let edgesCollapsed = false;
  let replayHistory = [];
  let currentReplay = null;
  let isReplaying = false;
  let isTutorial = false;
  let tutorialIndex = 0;
  let roundEventLog = [];
  let lastRoundSummary = null;
  let roundReportUnread = false;
  let lastStepSummary = null;
  let autoRoundReport = true;
  let displayedRound = 0;
  const storedRoundReportPref = localStorage.getItem('roundReportAuto');
  if (storedRoundReportPref === '0') autoRoundReport = false;

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
  if (roomInput) {
    roomInput.addEventListener('input', () => {
      roomInput.classList.remove('input-error');
    });
  }
  const board = document.getElementById('board');
  const gameArea = document.getElementById('gameArea');
  const ui = document.getElementById('ui');
  const phaseEl = document.getElementById('phase');
  const planCells = [...Array(STEPS)].map((_, i) => document.getElementById('pc' + i));
  const planValues = planCells.map(cell => cell ? cell.querySelector('.planStepValue') : null);
  const acts = Array.from(document.querySelectorAll('#actions button'));
  const actionGrid = document.getElementById('actions');
  const moveButtons = acts.filter(b => DXY[b.dataset.act]);
  const attackButton = acts.find(b => b.dataset.act === 'attack');
  const shieldButton = acts.find(b => b.dataset.act === 'shield');
  const btnDel = document.getElementById('btn-del');
  const btnNext = document.getElementById('btn-next');
  const scoreboard = document.getElementById('scoreboard');
  const roundBadge = document.getElementById('roundBadge');
  const roundNumberEl = roundBadge ? roundBadge.querySelector('.round-number') : null;
  const scoreA = document.getElementById('scoreA');
  const scoreB = document.getElementById('scoreB');
  const scoreReset = document.getElementById('scoreReset');
  const roundReportBtn = document.getElementById('roundReportBtn');
  const roundReportPanel = document.getElementById('roundReportPanel');
  const roundReportBody = document.getElementById('roundReportBody');
  const roundReportClose = document.getElementById('roundReportClose');
  const roundReportAutoToggle = document.getElementById('roundReportAutoToggle');
  const roundReportTitleEl = document.getElementById('roundReportTitle');
  const tutorialScript = [
    { trigger: 'start', key: 'tutorial1' },
    { trigger: 'afterMove', key: 'tutorial2' },
    { trigger: 'afterConfirm', key: 'tutorial3' }
  ];
  const themeToggleButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
  let pendingAttackDirs = [];

  function resetOnlineFlags() {
    onlineConfirmed = { A: false, B: false };
    waitingForServer = false;
    revealReady = false;
  }

  function clearAttackButtons() {
    pendingAttackDirs = [];
    moveButtons.forEach(btn => {
      btn.classList.remove('attack-selected', 'attack-disabled');
      btn.disabled = false;
    });
    if (actionGrid) {
      actionGrid.classList.remove('attack-mode');
    }
  }

  function hideAttackOverlay(options = {}) {
    attackMode = false;
    attackModeOwner = null;
    clearAttackButtons();
    pendingAttackDirs = [];
    if (attackButton) {
      attackButton.classList.remove('blocked');
      attackButton.disabled = false;
    }
    if (shieldButton) {
      shieldButton.classList.remove('blocked');
      shieldButton.disabled = false;
    }
    if (!options || !options.silent) {
      updateUI();
    }
  }

  function updateRoundReportButton() {
    if (!roundReportBtn) return;
    roundReportBtn.disabled = !lastRoundSummary;
    roundReportBtn.classList.toggle('has-unread', Boolean(lastRoundSummary && roundReportUnread));
  }

  function hideRoundReport(resetUnread) {
    if (!roundReportPanel) return;
    roundReportPanel.classList.remove('show');
    roundReportPanel.setAttribute('aria-hidden', 'true');
    if (resetUnread) {
      roundReportUnread = false;
      updateRoundReportButton();
    }
  }

  function formatCell(cell) {
    if (!cell) return '';
    const cx = typeof cell.x === 'number' ? cell.x : 0;
    const cy = typeof cell.y === 'number' ? cell.y : 0;
    return `(${cx + 1}, ${cy + 1})`;
  }

  function playerName(pl) {
    return pl === 'A' ? t('playerA') : t('playerB');
  }

  function describeAttackDirs(dirs) {
    if (!Array.isArray(dirs) || !dirs.length) {
      return t('roundReportCenter');
    }
    const dirLabels = dirs.map(d => t(`dir_${d}`)).join(t('roundReportDirsJoin'));
    return `${t('roundReportCenter')} + ${dirLabels}`;
  }

  function formatPlayerEvents(playerKey, info) {
    const lines = [];
    if (!info || !Array.isArray(info.events)) return lines;
    info.events.forEach(evt => {
      switch (evt.type) {
        case 'inactive':
          lines.push(t('roundReportEliminatedEarlier'));
          break;
        case 'move':
          lines.push(t('roundReportMoved', {
            dir: t(`dir_${evt.dir}`),
            cell: formatCell(evt.to || info.endCell)
          }));
          break;
        case 'wait':
          lines.push(t('roundReportHeld', { cell: formatCell(evt.at || info.endCell) }));
          break;
        case 'attack':
          lines.push(t('roundReportAttack', { dirs: describeAttackDirs(evt.dirs || []) }));
          break;
        case 'shield': {
          const blocks = Array.isArray(evt.blocks) ? evt.blocks : [];
          if (evt.blocked && blocks.length) {
            blocks.forEach(block => {
              lines.push(t('roundReportShieldBlocked', {
                player: playerName(block.source || (playerKey === 'A' ? 'B' : 'A')),
                cell: formatCell(block.cell || info.endCell)
              }));
            });
          } else {
            lines.push(t('roundReportShieldReady'));
          }
          break;
        }
        case 'damage':
          if (evt.cause === 'attack') {
            lines.push(t('roundReportDamageAttack', {
              cell: formatCell(evt.cell || info.endCell),
              player: playerName(evt.source || (playerKey === 'A' ? 'B' : 'A'))
            }));
          } else if (evt.cause === 'collapse') {
            lines.push(t('roundReportDamageCollapse', {
              cell: formatCell(evt.cell || info.endCell)
            }));
          }
          break;
        default:
          break;
      }
    });
    return lines;
  }

  function buildRoundSummary(roundNumber) {
    const steps = roundEventLog.map(entry => {
      const players = ['A', 'B'].map(pl => {
        const info = entry.perPlayer[pl];
        const events = formatPlayerEvents(pl, info);
        return {
          key: pl,
          name: playerName(pl),
          events,
          info
        };
      });
      return {
        step: entry.step,
        players
      };
    });
    return { round: roundNumber, steps };
  }

  function renderRoundReport(summary) {
    if (!roundReportBody) return;
    roundReportBody.innerHTML = '';
    if (!summary || !summary.steps || !summary.steps.length) {
      const empty = document.createElement('div');
      empty.className = 'roundReportEmpty';
      empty.textContent = t('roundReportEmpty');
      roundReportBody.append(empty);
      if (roundReportTitleEl) {
        roundReportTitleEl.textContent = t('roundReportTitle');
      }
      return;
    }
    if (roundReportTitleEl) {
      roundReportTitleEl.textContent = `${t('roundReportTitle')} · ${t('round')} ${summary.round}`;
    }
    summary.steps.forEach(stepInfo => {
      const stepEl = document.createElement('div');
      stepEl.className = 'roundReportStep';
      const stepTitle = document.createElement('h4');
      stepTitle.textContent = t('roundReportStep', { step: stepInfo.step });
      stepEl.append(stepTitle);
      const playersWrap = document.createElement('div');
      playersWrap.className = 'roundReportPlayers';
      stepInfo.players.forEach(player => {
        const playerEl = document.createElement('div');
        playerEl.className = 'roundReportPlayer';
        const name = document.createElement('h5');
        name.textContent = player.name;
        playerEl.append(name);
        const list = document.createElement('ul');
        player.events.forEach(text => {
          const li = document.createElement('li');
          li.textContent = text;
          list.append(li);
        });
        playerEl.append(list);
        playersWrap.append(playerEl);
      });
      stepEl.append(playersWrap);
      roundReportBody.append(stepEl);
    });
  }

  function showRoundReport(summary, autoOpen = false) {
    if (!roundReportPanel || !summary) return;
    renderRoundReport(summary);
    roundReportPanel.classList.add('show');
    roundReportPanel.setAttribute('aria-hidden', 'false');
    roundReportUnread = false;
    updateRoundReportButton();
    if (roundReportAutoToggle) {
      roundReportAutoToggle.checked = autoRoundReport;
    }
    if (!autoOpen && roundReportClose) {
      roundReportClose.focus();
    }
  }

  window.refreshRoundReport = function() {
    if (roundReportPanel && roundReportPanel.classList.contains('show')) {
      const summary = lastRoundSummary || buildRoundSummary(round);
      showRoundReport(summary, true);
    } else if (lastRoundSummary && roundReportTitleEl) {
      renderRoundReport(lastRoundSummary);
    }
  };

  function showTutorial(event) {
    if (!isTutorial) return;
    const step = tutorialScript[tutorialIndex];
    if (step && step.trigger === event && tutOv && tutCont && tutNext) {
      tutCont.textContent = t(step.key);
      if (tutorialProgress) {
        const total = tutorialScript.length;
        const current = Math.min(tutorialIndex + 1, total);
        tutorialProgress.textContent = t('tutorialStepLabel', { current, total });
      }
      if (tutorialHint) tutorialHint.textContent = t('tutorialNextHint');
      tutOv.classList.add('show');
      tutOv.setAttribute('aria-hidden', 'false');
      if (tutNext) tutNext.focus();
      tutNext.onclick = () => {
        tutOv.classList.remove('show');
        tutOv.setAttribute('aria-hidden', 'true');
        tutorialIndex++;
        if (tutorialIndex >= tutorialScript.length) {
          isTutorial = false;
          localStorage.setItem('tutorialDone', '1');
        }
      };
    }
  }

  function hideTutorialPrompt() {
    if (!tutorialPrompt) return;
    tutorialPrompt.classList.remove('show');
    tutorialPrompt.setAttribute('aria-hidden', 'true');
  }

  function showTutorialPrompt() {
    if (!tutorialPrompt) return;
    tutorialPrompt.classList.add('show');
    tutorialPrompt.setAttribute('aria-hidden', 'false');
    if (tutorialPromptStart) {
      tutorialPromptStart.focus();
    } else if (tutorialPromptSkip) {
      tutorialPromptSkip.focus();
    }
  }

  function startTutorial() {
    hideTutorialPrompt();
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
  const tutorialProgress = document.getElementById('tutorialProgress');
  const tutorialHint = document.getElementById('tutorialHint');
  const tutorialPrompt = document.getElementById('tutorialPrompt');
  const tutorialPromptStart = document.getElementById('tutorialPromptStart');
  const tutorialPromptSkip = document.getElementById('tutorialPromptSkip');

  let audioCtx;

  function playSound(type) {
    if (soundMuted || soundVolume <= 0) return;
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

  function updateThemeToggle(theme) {
    if (!themeToggleButtons.length) return;
    const normalized = theme === 'light' ? 'light' : 'dark';
    const label = typeof t === 'function' ? t('themeTooltip') : 'Switch theme';
    themeToggleButtons.forEach(btn => {
      btn.textContent = normalized === 'light' ? '🌙' : '☀️';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });
  }

  function applyTheme(theme) {
    const normalized = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = normalized;
    try {
      localStorage.setItem('theme', normalized);
    } catch (err) {
      // ignore storage errors
    }
    updateThemeToggle(normalized);
  }

  if (themeToggleButtons.length) {
    const initial = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    updateThemeToggle(initial);
    themeToggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
      });
    });
  }

  if (roundReportBtn) {
    roundReportBtn.addEventListener('click', () => {
      if (!lastRoundSummary) return;
      showRoundReport(lastRoundSummary);
    });
  }
  if (roundReportClose) {
    roundReportClose.addEventListener('click', () => hideRoundReport(true));
  }
  if (roundReportPanel) {
    roundReportPanel.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        hideRoundReport(true);
      }
    });
  }
  if (roundReportAutoToggle) {
    roundReportAutoToggle.checked = autoRoundReport;
    roundReportAutoToggle.addEventListener('change', () => {
      autoRoundReport = roundReportAutoToggle.checked;
      try {
        localStorage.setItem('roundReportAuto', autoRoundReport ? '1' : '0');
      } catch (err) {
        /* ignore storage errors */
      }
    });
  }
  updateRoundReportButton();

  b1p.onclick = () => { single = true; ms.style.display = 'none'; ds.style.display = 'flex'; };
  b2p.onclick = () => { single = false; ms.style.display = 'none'; startGame(); };
  bOnline.onclick = () => { ms.style.display = 'none'; onlineMenu.style.display = 'flex'; };
  rulesInit.onclick = () => { rulesOv.style.display = 'block'; };
  rulesClose.onclick = () => rulesOv.style.display = 'none';
  if (rulesTutorial) rulesTutorial.onclick = () => {
    rulesOv.style.display = 'none';
    try { localStorage.removeItem('tutorialDone'); } catch (err) {}
    startTutorial();
  };
  if (tutorialPromptStart) {
    tutorialPromptStart.onclick = () => {
      try { localStorage.removeItem('tutorialDone'); } catch (err) {}
      startTutorial();
    };
  }
  if (tutorialPromptSkip) {
    tutorialPromptSkip.onclick = () => {
      try { localStorage.setItem('tutorialDone', '1'); } catch (err) {}
      hideTutorialPrompt();
    };
  }

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
  function startGame() {
    hideAttackOverlay();
    board.style.visibility = 'visible';
    ui.classList.add('show');
    if (scoreboard) scoreboard.classList.add('scoreboard-hidden');
    if (roundBadge) {
      roundBadge.classList.remove('visible', 'bump');
      displayedRound = 0;
    }
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
        const act = b.dataset.act;
        const P = isOnline ? mySide() : (phase === 'planA' ? 'A' : 'B');
        if (attackMode) {
          if (attackModeOwner && attackModeOwner !== P) return;
          if (!DXY[act]) return;
          if (b.disabled || b.classList.contains('attack-disabled')) return;
          toggleAttackDirection(act);
          return;
        }
        if (b.disabled) return;
        if (phase === 'execute' || plans[P].length >= STEPS) return;
        if (DXY[act] && usedAtkDirs[P].has(act)) return;
        if (act === 'attack' && usedAtk[P] >= 1) return;
        if (act === 'shield' && usedShield[P] >= 1) return;
        act === 'attack' ? openAttack(P) : record(P, act);
      };
    });
    btnDel.onclick = () => {
      if (attackMode) {
        hideAttackOverlay();
        return;
      }
      if (phase.startsWith('plan')) deleteLast();
    };
    btnNext.onclick = () => {
      if (attackMode) {
        confirmAttackSelection();
        return;
      }
      nextStep();
    };

    document.addEventListener('keydown', e => {
      if (attackMode) {
        if (e.key === 'Escape') {
          hideAttackOverlay();
          e.preventDefault();
          return;
        }
        if (e.key === 'Enter') {
          confirmAttackSelection();
          e.preventDefault();
          return;
        }
        const attackMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
        if (attackMap[e.key]) {
          const btn = moveButtons.find(x => x.dataset.act === attackMap[e.key]);
          if (btn && !btn.disabled && !btn.classList.contains('attack-disabled')) btn.click();
          e.preventDefault();
          return;
        }
      }
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
    clearAttackButtons();
    attackMode = true;
    attackModeOwner = P;
    pendingAttackDirs = [];
    if (actionGrid) {
      actionGrid.classList.add('attack-mode');
    }
    moveButtons.forEach(btn => {
      const dir = btn.dataset.act;
      if (!DXY[dir]) return;
      const locked = usedMove[P].has(dir);
      btn.disabled = locked;
      btn.classList.toggle('attack-disabled', locked);
      btn.classList.remove('attack-selected');
    });
    if (attackButton) {
      attackButton.disabled = true;
      attackButton.classList.add('blocked');
    }
    if (shieldButton) {
      shieldButton.disabled = true;
      shieldButton.classList.add('blocked');
    }
    updateUI();
  }

  function toggleAttackDirection(dir) {
    if (!attackMode) return;
    const btn = moveButtons.find(b => b.dataset.act === dir);
    if (!btn || btn.disabled || btn.classList.contains('attack-disabled')) return;
    if (pendingAttackDirs.includes(dir)) {
      pendingAttackDirs = pendingAttackDirs.filter(x => x !== dir);
      btn.classList.remove('attack-selected');
    } else {
      pendingAttackDirs.push(dir);
      btn.classList.add('attack-selected');
    }
    updateUI();
  }

  function confirmAttackSelection() {
    if (!attackMode) return;
    if (!pendingAttackDirs.length) {
      playSound('ui');
      return;
    }
    const owner = attackModeOwner || (isOnline ? mySide() : (phase === 'planA' ? 'A' : 'B'));
    record(owner, { type: 'attack', dirs: pendingAttackDirs.slice() });
    usedAtk[owner]++;
    pendingAttackDirs.forEach(d => usedAtkDirs[owner].add(d));
    hideAttackOverlay();
  }

  function record(P, act) {
    if (isOnline && phase !== 'execute' && onlineConfirmed[mySide()]) {
      return;
    }
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
    if (isOnline && phase !== 'execute' && onlineConfirmed[mySide()]) return;
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
      const side = mySide();
      if (onlineConfirmed[side]) return;
      const moves = plans[side];
      if (moves.length === STEPS) {
        waitingForServer = true;
        if (window.peer) {
          sendPeerData({ type: 'moves', moves });
          sentMoves = true;
          if (typeof window.onMovesSubmitted === 'function') window.onMovesSubmitted();
          btnNext.disabled = true;
          maybeStartPeerRound();
        } else {
          submitMoves(moves);
          btnNext.disabled = true;
        }
        updateUI();
      }
      return;
    }
    if (isOnline && phase === 'execute' && !revealReady) {
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
    if (attackMode && attackModeOwner && attackModeOwner !== P) {
      hideAttackOverlay({ silent: true });
    }
    if (attackMode && phase === 'execute') {
      hideAttackOverlay({ silent: true });
    }
    const executing = phase === 'execute';
    const locked = isOnline && !executing && onlineConfirmed[mySide()];
    if (phaseEl) {
      if (executing) {
        phaseEl.textContent = t('phaseExecuting', { step });
      } else {
        const playerLabel = P === 'A' ? t('playerA') : t('playerB');
        phaseEl.textContent = t('phasePlanning', { player: playerLabel });
      }
    }
    if (roundBadge && roundNumberEl) {
      if (!ui.classList.contains('show')) {
        roundBadge.classList.remove('visible', 'bump');
      } else {
        if (!roundBadge.classList.contains('visible')) {
          roundBadge.classList.add('visible');
        }
        if (displayedRound !== round) {
          displayedRound = round;
          roundNumberEl.textContent = String(round);
          roundBadge.classList.remove('bump');
          void roundBadge.offsetWidth;
          roundBadge.classList.add('bump');
        }
      }
    }
    const activeIdx = phase === 'execute'
      ? Math.max(0, Math.min(STEPS - 1, step - 1))
      : Math.max(0, Math.min(STEPS - 1, plans[P].length));
    planCells.forEach((cell, i) => {
      if (!cell) return;
      const a = plans[P][i];
      const valEl = planValues[i];
      if (valEl) {
        valEl.textContent = a
          ? typeof a === 'object' ? '⚔'
            : a === 'shield' ? '🛡'
            : { up: '↑', down: '↓', left: '←', right: '→' }[a]
          : '';
      }
      cell.classList.toggle('current', i === activeIdx);
    });
    acts.forEach(b => {
      const a = b.dataset.act;
      b.disabled = false; b.classList.remove('blocked');
      b.classList.remove('attack-disabled');
      if (attackMode) {
        if (DXY[a]) {
          const owner = attackModeOwner || P;
          const lockedDir = usedMove[owner].has(a);
          const selected = pendingAttackDirs.includes(a);
          b.disabled = lockedDir;
          b.classList.toggle('attack-disabled', lockedDir);
          b.classList.toggle('attack-selected', selected);
        } else {
          b.disabled = true;
          b.classList.add('blocked');
        }
        return;
      }
      if (executing || locked) {
        b.disabled = true;
        b.classList.add('blocked');
        return;
      }
      if (DXY[a] && usedAtkDirs[P].has(a)) {
        b.disabled = true; b.classList.add('blocked');
      }
      if (a === 'attack' && usedAtk[P] >= 1) b.disabled = true;
      if (a === 'shield' && usedShield[P] >= 1) b.disabled = true;
    });
    document.querySelectorAll('.cell').forEach(c => {
      const x = +c.id[1], y = +c.id[2], edge = x === 0 || x === 4 || y === 0 || y === 4;
      c.classList.remove('cracked', 'lava');
      if (round === 4 && phase.startsWith('plan') && edge && !edgesCollapsed) {
        c.classList.add('cracked');
      } else if (edgesCollapsed && edge) {
        c.classList.add('lava');
      }
    });
    if (attackMode) {
      btnDel.style.visibility = 'visible';
      btnDel.disabled = false;
      btnDel.textContent = t('cancel');
      btnDel.setAttribute('data-i18n', 'cancel');
      btnNext.textContent = t('ok');
      btnNext.setAttribute('data-i18n', 'ok');
      btnNext.disabled = pendingAttackDirs.length === 0;
      return;
    }

    btnDel.setAttribute('data-i18n', 'deleteBtn');
    btnDel.textContent = t('deleteBtn');
    btnDel.disabled = executing || locked;
    btnDel.style.visibility = phase.startsWith('plan') ? 'visible' : 'hidden';

    let nextKey = 'nextBtn';
    if (single && phase === 'planA') {
      nextKey = 'nextBtn';
      btnNext.disabled = plans[P].length !== STEPS;
    } else if (isOnline) {
      if (executing) {
        nextKey = 'revealBtn';
        btnNext.disabled = !revealReady;
      } else if (locked) {
        nextKey = waitingForServer ? 'confirmPendingBtn' : 'confirmBtn';
        btnNext.disabled = true;
      } else {
        nextKey = 'confirmBtn';
        btnNext.disabled = plans[P].length !== STEPS;
      }
    } else {
      nextKey = executing ? 'executeBtn' : 'nextBtn';
      btnNext.disabled = plans[P].length < STEPS && !executing;
    }
    btnNext.textContent = t(nextKey);
    btnNext.setAttribute('data-i18n', nextKey);
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
    const actions = { A: plans.A[step - 1], B: plans.B[step - 1] };
    const prevUnits = { A: { ...units.A }, B: { ...units.B } };
    const executedStep = step;
    const stepSummary = {
      step: executedStep,
      perPlayer: {
        A: {
          action: actions.A,
          events: [],
          startedAlive: prevUnits.A.alive,
          endAlive: prevUnits.A.alive,
          startCell: { x: prevUnits.A.x, y: prevUnits.A.y },
          endCell: { x: prevUnits.A.x, y: prevUnits.A.y }
        },
        B: {
          action: actions.B,
          events: [],
          startedAlive: prevUnits.B.alive,
          endAlive: prevUnits.B.alive,
          startCell: { x: prevUnits.B.x, y: prevUnits.B.y },
          endCell: { x: prevUnits.B.x, y: prevUnits.B.y }
        }
      }
    };
    lastStepSummary = stepSummary;

    const ensureShieldEvent = info => {
      let shieldEvt = info.events.find(evt => evt.type === 'shield');
      if (!shieldEvt) {
        shieldEvt = { type: 'shield', blocked: false, blocks: [], cell: { ...info.endCell } };
        info.events.push(shieldEvt);
      }
      if (!Array.isArray(shieldEvt.blocks)) shieldEvt.blocks = [];
      return shieldEvt;
    };

    ['A', 'B'].forEach(pl => {
      const info = stepSummary.perPlayer[pl];
      if (!info.startedAlive) {
        info.events.push({ type: 'inactive', cell: { ...info.startCell } });
        return;
      }
      const act = actions[pl];
      if (act === 'shield') {
        info.events.push({ type: 'shield', blocked: false, blocks: [], cell: { ...info.startCell } });
      } else if (typeof act === 'object') {
        info.events.push({ type: 'attack', dirs: Array.isArray(act.dirs) ? act.dirs.slice() : [] });
      }
    });

    const moved = { A: false, B: false };
    ['A', 'B'].forEach(pl => {
      const info = stepSummary.perPlayer[pl];
      if (!info.startedAlive) return;
      const act = actions[pl];
      if (typeof act === 'string' && DXY[act]) {
        let nx = units[pl].x + DXY[act][0];
        let ny = units[pl].y + DXY[act][1];
        nx = Math.max(0, Math.min(4, nx));
        ny = Math.max(0, Math.min(4, ny));
        if (edgesCollapsed && (nx === 0 || nx === 4 || ny === 0 || ny === 4)) {
          info.events.push({ type: 'damage', cause: 'collapse', cell: { x: nx, y: ny }, attemptedMove: act });
          info.endAlive = false;
          units[pl].alive = false;
          showDeath(nx, ny);
          playSound('death');
        } else {
          if (prevUnits[pl].x !== nx || prevUnits[pl].y !== ny) {
            info.events.push({ type: 'move', dir: act, from: { ...prevUnits[pl] }, to: { x: nx, y: ny } });
            units[pl].x = nx;
            units[pl].y = ny;
            info.endCell = { x: nx, y: ny };
            playSound('move');
            moved[pl] = true;
          }
        }
      }
    });

    render();
    Object.keys(moved).forEach(pl => {
      if (moved[pl]) {
        animateUnitMove(pl, prevUnits[pl]);
      }
    });

    ['A', 'B'].forEach(pl => {
      const info = stepSummary.perPlayer[pl];
      if (info.startedAlive) {
        info.endCell = { x: units[pl].x, y: units[pl].y };
      }
    });

    ['A', 'B'].forEach(pl => {
      const act = actions[pl];
      const other = pl === 'A' ? 'B' : 'A';
      if (typeof act === 'object') {
        const u = units[pl];
        const tx = u.x;
        const ty = u.y;
        const otherInfo = stepSummary.perPlayer[other];
        const sh = actions[other] === 'shield';
        const cellS = document.getElementById(`c${tx}${ty}`);
        if (cellS) {
          const ovS = document.createElement('div');
          ovS.className = 'attack';
          cellS.append(ovS);
        }
        if (units[other].x === tx && units[other].y === ty && units[other].alive) {
          if (sh && otherInfo.startedAlive) {
            const shieldEvt = ensureShieldEvent(otherInfo);
            shieldEvt.blocked = true;
            shieldEvt.blocks.push({ source: pl, cell: { x: tx, y: ty } });
          } else {
            units[other].alive = false;
            otherInfo.events.push({ type: 'damage', cause: 'attack', source: pl, cell: { x: tx, y: ty } });
            otherInfo.endAlive = false;
            showDeath(tx, ty);
            playSound('death');
          }
        }
        if (Array.isArray(act.dirs)) {
          act.dirs.forEach(d => {
            const delta = DXY[d];
            if (!delta) return;
            const nx = tx + delta[0];
            const ny = ty + delta[1];
            if (nx < 0 || nx > 4 || ny < 0 || ny > 4) return;
            const cell2 = document.getElementById(`c${nx}${ny}`);
            if (cell2) {
              const ov2 = document.createElement('div');
              ov2.className = 'attack';
              cell2.append(ov2);
            }
            if (units[other].alive && units[other].x === nx && units[other].y === ny) {
              if (sh && otherInfo.startedAlive) {
                const shieldEvt = ensureShieldEvent(otherInfo);
                shieldEvt.blocked = true;
                shieldEvt.blocks.push({ source: pl, cell: { x: nx, y: ny } });
              } else {
                units[other].alive = false;
                otherInfo.events.push({ type: 'damage', cause: 'attack', source: pl, cell: { x: nx, y: ny } });
                otherInfo.endAlive = false;
                showDeath(nx, ny);
                playSound('death');
              }
            }
          });
        }
        playSound('attack');
      }
    });

    ['A', 'B'].forEach(pl => {
      const act = actions[pl];
      if (act === 'shield' && units[pl].alive) {
        const u = units[pl];
        const cell = document.getElementById(`c${u.x}${u.y}`);
        if (cell) {
          const ov = document.createElement('div');
          ov.className = 'shield';
          cell.append(ov);
        }
        playSound('shield');
      }
    });

    ['A', 'B'].forEach(pl => {
      const info = stepSummary.perPlayer[pl];
      if (!info.startedAlive) return;
      info.endAlive = units[pl].alive;
      info.endCell = { x: units[pl].x, y: units[pl].y };
      const hasMoveOrDamage = info.events.some(evt => evt.type === 'move' || evt.type === 'damage');
      if (!hasMoveOrDamage) {
        info.events.push({ type: 'wait', at: { ...info.endCell } });
      }
      const shieldEvt = info.events.find(evt => evt.type === 'shield');
      if (shieldEvt) {
        shieldEvt.cell = { ...info.endCell };
      }
    });

    roundEventLog.push(stepSummary);

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
      if (isOnline) resetOnlineFlags();
      startNewRound();
    }
    updateUI();
  }

  function animateUnitMove(player, prev) {
    const current = units[player];
    if (!current || !current.alive) return;
    if (prev.x === current.x && prev.y === current.y) return;
    const newCell = document.getElementById(`c${current.x}${current.y}`);
    const oldCell = document.getElementById(`c${prev.x}${prev.y}`);
    if (!newCell || !oldCell) return;
    const unitEl = newCell.querySelector(player === 'A' ? '.playerA' : '.playerB');
    if (!unitEl) return;
    const fromRect = oldCell.getBoundingClientRect();
    const toRect = newCell.getBoundingClientRect();
    const dx = fromRect.left - toRect.left;
    const dy = fromRect.top - toRect.top;
    requestAnimationFrame(() => {
      unitEl.style.setProperty('--fromX', `${dx}px`);
      unitEl.style.setProperty('--fromY', `${dy}px`);
      unitEl.classList.add('moveAnim');
      unitEl.addEventListener('animationend', () => {
        unitEl.classList.remove('moveAnim');
        unitEl.style.removeProperty('--fromX');
        unitEl.style.removeProperty('--fromY');
      }, { once: true });
    });
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
        c.classList.add('cell-shatter');
        setTimeout(() => {
          c.classList.remove('collapse');
          c.classList.remove('cell-shatter');
          c.classList.add('lava');
        }, 600);
      }
    });
    ['A', 'B'].forEach(pl => {
      const u = units[pl];
      if (u.alive && (u.x === 0 || u.x === 4 || u.y === 0 || u.y === 4)) {
        u.alive = false;
        showDeath(u.x, u.y);
        playSound('death');
        if (lastStepSummary && lastStepSummary.perPlayer && lastStepSummary.perPlayer[pl]) {
          const info = lastStepSummary.perPlayer[pl];
          info.events = info.events.filter(evt => evt.type !== 'wait');
          info.events.push({ type: 'damage', cause: 'collapse', cell: { x: u.x, y: u.y } });
          info.endAlive = false;
          info.endCell = { x: u.x, y: u.y };
        }
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
    roundEventLog = [];
    lastStepSummary = null;
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
    const summary = buildRoundSummary(round);
    if (summary.steps.length || roundEventLog.length) {
      lastRoundSummary = summary;
      const panelOpen = roundReportPanel && roundReportPanel.classList.contains('show');
      const shouldShow = autoRoundReport || panelOpen;
      if (shouldShow) {
        showRoundReport(summary, true);
      } else {
        roundReportUnread = true;
      }
    }
    updateRoundReportButton();
    roundEventLog = [];
    lastStepSummary = null;
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

  function saveReplayToStorage(resultText) {
    if (!replayHistory.length) return false;
    try {
      const raw = localStorage.getItem('savedReplays');
      const saved = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(saved) ? saved : [];
      const entry = {
        id: `replay-${Date.now()}`,
        savedAt: new Date().toISOString(),
        result: resultText,
        language: window.i18n ? window.i18n.lang : 'en',
        history: JSON.parse(JSON.stringify(replayHistory))
      };
      list.push(entry);
      if (list.length > 20) list.splice(0, list.length - 20);
      localStorage.setItem('savedReplays', JSON.stringify(list));
      return true;
    } catch (err) {
      console.error('Failed to save replay', err);
      return false;
    }
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
    }, 700);
  }

  function showDeath(x, y) {
    const cell = document.getElementById(`c${x}${y}`);
    if (!cell) return;
    const ov = document.createElement('div');
    ov.className = 'death';
    cell.append(ov);
    cell.classList.add('cell-shatter');
    setTimeout(() => cell.classList.remove('cell-shatter'), 600);
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
      '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">' +
      `<button id="resReplay">${t('replay')}</button>` +
      `<button id="resSaveReplay">${t('saveReplay')}</button>` +
      `<button id="resRoundReport">${t('roundReportButton')}</button>` +
      `<button id="resMenu">${t('toMenu')}</button>` +
      `<button id="resOk">${t('ok')}</button>` +
      '</div>' +
      '<div id="replaySaveStatus" class="resultStatus" role="status" aria-live="polite"></div>';
    document.body.append(ov);
    const resOk = ov.querySelector('#resOk');
    const resMenu = ov.querySelector('#resMenu');
    const resReplay = ov.querySelector('#resReplay');
    const resSave = ov.querySelector('#resSaveReplay');
    const resRoundReport = ov.querySelector('#resRoundReport');
    const statusEl = ov.querySelector('#replaySaveStatus');
    if (resOk) {
      resOk.onclick = () => {
        ov.remove();
        resetGame();
        if (typeof window.exitOnlineMode === 'function') window.exitOnlineMode();
        if (typeof window.cleanupRoom === 'function') window.cleanupRoom();
      };
    }
    if (resMenu) {
      resMenu.onclick = () => {
        ov.remove();
        returnToMenu();
      };
    }
    if (resReplay) {
      resReplay.onclick = () => {
        ov.remove();
        startReplay();
      };
    }
    if (resSave) {
      if (!replayHistory.length) resSave.disabled = true;
      resSave.onclick = () => {
        const saved = saveReplayToStorage(text);
        if (statusEl) {
          statusEl.textContent = saved ? t('replaySaved') : t('replaySaveFailed');
          statusEl.classList.remove('success', 'error');
          statusEl.classList.add(saved ? 'success' : 'error');
        }
        if (saved) resSave.disabled = true;
      };
    }
    if (resRoundReport) {
      if (!lastRoundSummary) {
        resRoundReport.disabled = true;
      }
      resRoundReport.onclick = () => {
        if (!lastRoundSummary) return;
        showRoundReport(lastRoundSummary);
      };
    }
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
    roundEventLog = [];
    lastStepSummary = null;
    resetOnlineFlags();
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
      if (typeof window.onPlayerConfirmed === 'function') {
        window.onPlayerConfirmed(playerIndex === 0 ? 1 : 0);
      }
      maybeStartPeerRound();
    }
  };

  window.onPeerClose = function() {
    peerMoves = null;
    sentMoves = false;
    returnToMenu();
  };

  window.onMovesSubmitted = function() {
    if (!isOnline || playerIndex === null) return;
    onlineConfirmed[mySide()] = true;
    waitingForServer = true;
    updateUI();
  };

  window.onPlayerConfirmed = function(index) {
    if (!isOnline) return;
    const side = index === 0 ? 'A' : 'B';
    onlineConfirmed[side] = true;
    updateUI();
  };

  window.onOnlineDisconnected = function() {
    if (!isOnline) return;
    resetOnlineFlags();
    updateUI();
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
    resetOnlineFlags();
  }

  window.exitOnlineMode = exitOnlineMode;
  function returnToMenu() {
    resetGame();
    hideAttackOverlay();
    hideRoundReport(false);
    board.style.visibility = 'hidden';
    ui.classList.remove('show');
    if (scoreboard) scoreboard.classList.remove('scoreboard-hidden');
    if (roundBadge) {
      roundBadge.classList.remove('visible', 'bump');
      displayedRound = 0;
    }
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
      next.textContent = t('revealBtn');
      next.disabled = false;
    }
    revealReady = true;
    waitingForServer = false;
    onlineConfirmed = { A: false, B: false };
    clearPlan();
    updateUI();
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settingsBtn');
  const menuSettingsBtn = document.getElementById('menuSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const settingsClose = document.getElementById('settingsClose');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const soundToggle = document.getElementById('soundToggle');
  const langSelect = document.getElementById('langSelect');
  const menuBtn = document.getElementById('menuBtn');
  const replayClose = document.getElementById('replayClose');
  const speedBtns = document.querySelectorAll('.speedBtn');
  const replayPauseBtn = document.getElementById('replayPause');
  const replayBtn = document.getElementById('replayBtn');
  const saveReplayBtn = document.getElementById('saveReplay');
  const replaySeek = document.getElementById('replaySeek');

  const openSettings = () => { if (settingsModal) settingsModal.style.display = 'block'; };
  if (settingsBtn && settingsModal) {
    settingsBtn.onclick = openSettings;
  }
  if (menuSettingsBtn && settingsModal) {
    menuSettingsBtn.onclick = openSettings;
  }
  if (settingsClose && settingsModal) {
    settingsClose.onclick = () => { settingsModal.style.display = 'none'; };
  }
  const syncSoundControls = () => {
    if (volumeSlider) {
      volumeSlider.value = soundVolume;
      volumeSlider.dataset.muted = soundMuted ? '1' : '0';
    }
    if (volumeValue) {
      volumeValue.textContent = `${Math.round(soundVolume * 100)}%`;
    }
    if (soundToggle) {
      soundToggle.checked = !soundMuted;
    }
  };

  if (volumeSlider) {
    volumeSlider.value = soundVolume;
    volumeSlider.addEventListener('input', () => {
      const parsed = parseFloat(volumeSlider.value);
      if (!isNaN(parsed)) {
        soundVolume = Math.min(Math.max(parsed, 0), 1);
        localStorage.setItem('volume', soundVolume.toString());
        if (soundVolume === 0) {
          if (!soundMuted) {
            soundMuted = true;
            localStorage.setItem('soundMuted', '1');
          }
        } else if (soundMuted) {
          soundMuted = false;
          localStorage.setItem('soundMuted', '0');
        }
        syncSoundControls();
      }
    });
  }
  if (soundToggle) {
    soundToggle.checked = !soundMuted;
    soundToggle.addEventListener('change', () => {
      soundMuted = !soundToggle.checked;
      localStorage.setItem('soundMuted', soundMuted ? '1' : '0');
      syncSoundControls();
      if (!soundMuted && soundVolume > 0) {
        playSound('ui');
      }
    });
  }
  syncSoundControls();
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

  let shouldOfferTutorial = false;
  try {
    shouldOfferTutorial = !localStorage.getItem('tutorialDone');
  } catch (err) {
    shouldOfferTutorial = false;
  }
  if (shouldOfferTutorial) {
    showTutorialPrompt();
  }
});

// Prevent double-click zoom on mobile
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
