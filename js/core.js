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
let replayLoop = null;
let replayPaused = false;
let recorder = null;
let recordedChunks = [];
let recorderMime = 'video/webm';
let recorderExt = 'webm';
let recorderStream = null;
let recorderCanvas = null;
let attackMode = false;
let attackModeOwner = null;

const hudMotionQuery = (typeof window !== 'undefined' && typeof window.matchMedia === 'function')
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

function playHudIconAnimation(icon, opening) {
  if (!icon || typeof icon.animate !== 'function') return;
  if (hudMotionQuery && hudMotionQuery.matches) return;
  if (opening && icon.classList.contains('active')) return;
  if (!opening && !icon.classList.contains('active')) return;
  const styles = getComputedStyle(icon);
  const rotateValue = parseFloat(styles.getPropertyValue('--icon-open-rotate'));
  const translateValue = parseFloat(styles.getPropertyValue('--icon-open-translate'));
  const targetRotate = Number.isFinite(rotateValue) ? rotateValue : 0;
  const targetTranslate = Number.isFinite(translateValue) ? translateValue : -3;
  if (icon._hudAnimation && typeof icon._hudAnimation.cancel === 'function') {
    icon._hudAnimation.cancel();
  }
  const frames = opening
    ? [
        { transform: 'translateY(0px) rotate(0deg) scale(0.88)' },
        { transform: `translateY(${targetTranslate - 1}px) rotate(${targetRotate * 0.78}deg) scale(1.12)` },
        { transform: `translateY(${targetTranslate}px) rotate(${targetRotate}deg) scale(1)` }
      ]
    : [
        { transform: `translateY(${targetTranslate}px) rotate(${targetRotate}deg) scale(1.04)` },
        { transform: `translateY(${targetTranslate * 0.45}px) rotate(${targetRotate * 0.4}deg) scale(0.9)` },
        { transform: 'translateY(0px) rotate(0deg) scale(1)' }
      ];
  const animation = icon.animate(frames, {
    duration: 420,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'forwards'
  });
  icon._hudAnimation = animation;
  const clear = () => {
    if (icon._hudAnimation === animation) {
      icon._hudAnimation = null;
    }
  };
  if (typeof animation.addEventListener === 'function') {
    animation.addEventListener('finish', clear, { once: true });
    animation.addEventListener('cancel', clear, { once: true });
  } else {
    animation.onfinish = clear;
    animation.oncancel = clear;
  }
}

const mySide = () => (playerIndex === 0 ? 'A' : 'B');

function placeSymbol(x, y) {
  const cell = document.getElementById(`c${x}${y}`);
  if (cell) {
    cell.textContent = '';
    cell.classList.remove('cell-marked');
  }
}

function onCellClick(x, y) {
  if (typeof window.toggleCellMark === 'function') {
    window.toggleCellMark(x, y);
    return;
  }
  const cell = document.getElementById(`c${x}${y}`);
  if (!cell) return;
  cell.classList.toggle('cell-marked');
}

function handleOpponentMove(move) {
  placeSymbol(move.x, move.y);
  yourTurn = true;
}

function applyMove(move) {
  placeSymbol(move.x, move.y);
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
  let activeTutorialStep = null;
  let markedCells = { A: new Set(), B: new Set() };
  let markedOwner = null;
  let activeResultOverlay = null;
  let resultOverlaySuppressed = false;
  let displayedRound = 0;
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
  const scoreboardToggle = document.getElementById('scoreboardToggle');
  const scoreboardMenu = document.getElementById('scoreboardMenu');
  const scoreboardBackdrop = document.getElementById('scoreboardBackdrop');
  const settingsIcon = document.getElementById('settingsBtn');
  const roundBadge = document.getElementById('roundBadge');
  const roundNumberEl = roundBadge ? roundBadge.querySelector('.round-number') : null;
  const scoreA = document.getElementById('scoreA');
  const scoreB = document.getElementById('scoreB');
  const scoreReset = document.getElementById('scoreReset');
  const root = document.documentElement;
  let layoutScaleRaf = null;
  let hudMenuOpen = false;

  function closeHudMenu() {
    if (!scoreboardMenu) return;
    if (scoreboardToggle && scoreboardToggle.classList.contains('active')) {
      playHudIconAnimation(scoreboardToggle, false);
    }
    if (scoreboardMenu.classList.contains('show')) {
      if (scoreboardMenu.classList.contains('visible')) {
        scoreboardMenu.classList.remove('visible');
        const onTransition = evt => {
          if (evt && evt.target !== scoreboardMenu) return;
          if (evt && evt.propertyName && evt.propertyName !== 'opacity') return;
          scoreboardMenu.classList.remove('show');
          scoreboardMenu.removeEventListener('transitionend', onTransition);
        };
        scoreboardMenu.addEventListener('transitionend', onTransition);
        setTimeout(() => {
          scoreboardMenu.classList.remove('show');
          scoreboardMenu.removeEventListener('transitionend', onTransition);
        }, 320);
      } else {
        scoreboardMenu.classList.remove('show');
      }
    }
    scoreboardMenu.setAttribute('aria-hidden', 'true');
    if (scoreboardBackdrop) scoreboardBackdrop.classList.remove('show');
    if (scoreboardToggle) scoreboardToggle.setAttribute('aria-expanded', 'false');
    if (scoreboardToggle) scoreboardToggle.classList.remove('active');
    hudMenuOpen = false;
  }

  function openHudMenu() {
    if (!scoreboardMenu) return;
    if (scoreboardMenu.classList.contains('show')) return;
    if (scoreboardToggle) {
      playHudIconAnimation(scoreboardToggle, true);
    }
    scoreboardMenu.classList.add('show');
    scoreboardMenu.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      scoreboardMenu.classList.add('visible');
    });
    if (scoreboardBackdrop) scoreboardBackdrop.classList.add('show');
    if (scoreboardToggle) scoreboardToggle.setAttribute('aria-expanded', 'true');
    if (scoreboardToggle) scoreboardToggle.classList.add('active');
    const focusTarget = scoreboardMenu.querySelector('button:not([disabled])');
    if (focusTarget) focusTarget.focus();
    hudMenuOpen = true;
  }

  function syncHudSpacing() {
    if (!gameArea) return;
    if (!scoreboard) {
      root.style.removeProperty('--hud-stack-offset');
      gameArea.style.marginTop = '';
      return;
    }
    const rect = scoreboard.getBoundingClientRect();
    if (!rect || rect.height <= 0) {
      root.style.removeProperty('--hud-stack-offset');
      gameArea.style.marginTop = '';
      return;
    }
    const computed = getComputedStyle(gameArea);
    const gapStr = (computed.rowGap && computed.rowGap !== 'normal') ? computed.rowGap : computed.gap;
    let gapValue = parseFloat(gapStr);
    if (!Number.isFinite(gapValue)) gapValue = 0;
    const offset = Math.ceil(rect.bottom + gapValue);
    root.style.setProperty('--hud-stack-offset', `${offset}px`);
    gameArea.style.marginTop = '';
  }

  function recalcLayoutScale() {
    layoutScaleRaf = null;
    if (!board || !ui) return;
    const prev = getComputedStyle(root).getPropertyValue('--ui-scale') || '1';
    root.style.setProperty('--ui-scale', '1');
    const scoreboardRect = scoreboard ? scoreboard.getBoundingClientRect() : null;
    const boardRect = board.getBoundingClientRect();
    const uiRect = ui.getBoundingClientRect();
    if (boardRect.width === 0 || boardRect.height === 0) {
      root.style.setProperty('--ui-scale', prev.trim() || '1');
      return;
    }
    const rects = [boardRect, uiRect];
    if (scoreboardRect && scoreboardRect.width > 0 && scoreboardRect.height > 0) {
      rects.push(scoreboardRect);
    }
    let minLeft = rects[0].left;
    let maxRight = rects[0].right;
    let minTop = rects[0].top;
    let maxBottom = rects[0].bottom;
    for (let i = 1; i < rects.length; i += 1) {
      const rect = rects[i];
      if (rect.left < minLeft) minLeft = rect.left;
      if (rect.right > maxRight) maxRight = rect.right;
      if (rect.top < minTop) minTop = rect.top;
      if (rect.bottom > maxBottom) maxBottom = rect.bottom;
    }
    const totalWidth = Math.max(300, maxRight - minLeft);
    const totalHeight = Math.max(320, maxBottom - minTop);
    const safeMarginX = Math.max(16, Math.min(32, Math.round(window.innerWidth * 0.04)));
    const safeMarginY = Math.max(16, Math.min(56, Math.round(window.innerHeight * 0.06)));
    const availableWidth = Math.max(320, window.innerWidth - safeMarginX * 2);
    const availableHeight = Math.max(320, window.innerHeight - safeMarginY * 2);
    let scale = Math.min(1, availableWidth / totalWidth, availableHeight / totalHeight);
    if (!Number.isFinite(scale) || scale <= 0) {
      root.style.setProperty('--ui-scale', prev.trim() || '1');
      return;
    }
    const minScale = 0.35;
    scale = Math.max(minScale, Math.min(scale, 1));
    root.style.setProperty('--ui-scale', scale.toFixed(3));
    const scaledHeight = totalHeight * scale;
    const shouldAllowScroll = scaledHeight > (window.innerHeight - safeMarginY * 0.5);
    if (document.body) {
      document.body.style.overflowY = shouldAllowScroll ? 'auto' : 'hidden';
    }
    document.documentElement.style.overflowY = shouldAllowScroll ? 'auto' : 'hidden';
    requestAnimationFrame(syncHudSpacing);
  }

  function updateLayoutScale() {
    if (layoutScaleRaf !== null) cancelAnimationFrame(layoutScaleRaf);
    layoutScaleRaf = requestAnimationFrame(recalcLayoutScale);
  }

  if (scoreboardMenu) {
    scoreboardMenu.setAttribute('aria-hidden', 'true');
    scoreboardMenu.addEventListener('click', evt => {
      if (evt.target instanceof HTMLElement && evt.target.closest('button')) {
        closeHudMenu();
      }
    });
  }
  if (scoreboardBackdrop) {
    scoreboardBackdrop.addEventListener('click', closeHudMenu);
  }
  if (scoreboardToggle && scoreboardMenu) {
    scoreboardToggle.setAttribute('aria-expanded', 'false');
    scoreboardToggle.addEventListener('click', () => {
      if (scoreboardMenu.classList.contains('show')) {
        closeHudMenu();
      } else {
        openHudMenu();
      }
    });
  }

  document.addEventListener('keydown', evt => {
    if (evt.key === 'Escape' && hudMenuOpen) {
      closeHudMenu();
    }
  });

  window.closeHudMenu = closeHudMenu;

  window.addEventListener('resize', updateLayoutScale);
  window.addEventListener('orientationchange', updateLayoutScale);
  window.addEventListener('resize', refreshTutorialHighlight);
  window.addEventListener('orientationchange', refreshTutorialHighlight);

  const tutorialScript = [
    { key: 'tutorialIntro', highlight: '#board', hint: 'tutorialIntroHint' },
    { key: 'tutorialGoal', highlight: '#scoreboard', hint: 'tutorialGoalHint' },
    { key: 'tutorialMovePrompt', highlight: '#actions', hint: 'tutorialMoveHint', mode: 'practice', expect: 'moveQueued', focus: '#actions [data-act="up"]', buttonKey: 'tutorialTryButton' },
    { key: 'tutorialPlanPrompt', highlight: '#planIndicator', hint: 'tutorialPlanHint' },
    { key: 'tutorialDirectionRule', highlight: '#planIndicator', hint: 'tutorialDirectionRuleHint' },
    { key: 'tutorialAttackPrompt', highlight: '#actions [data-act="attack"]', hint: 'tutorialAttackHint', mode: 'practice', expect: 'attackMode', focus: '#actions [data-act="attack"]', buttonKey: 'tutorialTryButton' },
    { key: 'tutorialAttackDirPrompt', highlight: '#actions', hint: 'tutorialAttackDirHint', mode: 'practice', expect: 'attackQueued', focus: '#actions [data-act="right"]', buttonKey: 'tutorialTryButton' },
    { key: 'tutorialShieldPrompt', highlight: '#actions [data-act="shield"]', hint: 'tutorialShieldHint', mode: 'practice', expect: 'shieldQueued', focus: '#actions [data-act="shield"]', buttonKey: 'tutorialTryButton' },
    { key: 'tutorialConfirmPrompt', highlight: '#btn-next', hint: 'tutorialConfirmHint', mode: 'practice', expect: 'roundStarted', focus: '#btn-next', buttonKey: 'tutorialTryButton' },
    { key: 'tutorialWrap', highlight: '#gameArea', hint: 'tutorialWrapHint', buttonKey: 'tutorialFinish' }
  ];
  const themeToggleButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
  let pendingAttackDirs = [];
  let tutorialExpectEvent = null;
  let tutorialHighlightSelector = null;
  let tutorialHighlightRect = null;
  let tutorialCard = null;

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

  function applyTutorialHighlight(selector) {
    if (!tutorialHighlightEl) return;
    tutorialHighlightSelector = selector || null;
    if (!selector) {
      tutorialHighlightRect = null;
      tutorialHighlightEl.classList.remove('show');
      requestAnimationFrame(() => positionTutorialCard());
      return;
    }
    const target = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!target) {
      tutorialHighlightRect = null;
      tutorialHighlightEl.classList.remove('show');
      requestAnimationFrame(() => positionTutorialCard());
      return;
    }
    const rect = target.getBoundingClientRect();
    const pad = 18;
    const left = Math.max(8, rect.left - pad);
    const top = Math.max(8, rect.top - pad);
    const right = Math.min(window.innerWidth - 8, rect.right + pad);
    const bottom = Math.min(window.innerHeight - 8, rect.bottom + pad);
    tutorialHighlightRect = {
      left,
      top,
      right,
      bottom,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top)
    };
    tutorialHighlightEl.style.left = `${left}px`;
    tutorialHighlightEl.style.top = `${top}px`;
    tutorialHighlightEl.style.width = `${Math.max(0, right - left)}px`;
    tutorialHighlightEl.style.height = `${Math.max(0, bottom - top)}px`;
    tutorialHighlightEl.classList.add('show');
    requestAnimationFrame(() => positionTutorialCard());
  }

  function clearTutorialHighlight() {
    if (!tutorialHighlightEl) return;
    tutorialHighlightSelector = null;
    tutorialHighlightRect = null;
    tutorialHighlightEl.classList.remove('show');
    if (tutorialCard) {
      tutorialCard.style.removeProperty('left');
      tutorialCard.style.removeProperty('top');
      tutorialCard.style.removeProperty('transform');
    }
    requestAnimationFrame(() => positionTutorialCard());
  }

  function refreshTutorialHighlight() {
    if (!tutorialHighlightSelector) return;
    requestAnimationFrame(() => applyTutorialHighlight(tutorialHighlightSelector));
  }

  function positionTutorialCard() {
    if (!tutOv || !tutorialCard) return;
    if (!tutOv.classList.contains('show')) {
      tutorialCard.style.removeProperty('left');
      tutorialCard.style.removeProperty('top');
      tutorialCard.style.removeProperty('transform');
      return;
    }
    const margin = 20;
    const viewportW = window.innerWidth || document.documentElement.clientWidth;
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
    const prevTransform = tutorialCard.style.transform;
    tutorialCard.style.transform = 'none';
    const cardWidth = tutorialCard.offsetWidth || tutorialCard.getBoundingClientRect().width || 320;
    const cardHeight = tutorialCard.offsetHeight || tutorialCard.getBoundingClientRect().height || 200;
    tutorialCard.style.transform = prevTransform;
    let left = (viewportW - cardWidth) / 2;
    let top = (viewportH - cardHeight) / 2;
    if (tutorialHighlightRect) {
      const rect = tutorialHighlightRect;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const positions = [
        { left: centerX - cardWidth / 2, top: rect.bottom + margin },
        { left: centerX - cardWidth / 2, top: rect.top - margin - cardHeight },
        { left: rect.right + margin, top: centerY - cardHeight / 2 },
        { left: rect.left - margin - cardWidth, top: centerY - cardHeight / 2 }
      ];
      const fits = positions.find(pos =>
        pos.left >= margin &&
        pos.top >= margin &&
        pos.left + cardWidth <= viewportW - margin &&
        pos.top + cardHeight <= viewportH - margin
      );
      if (fits) {
        left = fits.left;
        top = fits.top;
      } else {
        left = clamp(centerX - cardWidth / 2, margin, Math.max(margin, viewportW - margin - cardWidth));
        const below = rect.bottom + margin;
        const above = rect.top - margin - cardHeight;
        if (below + cardHeight <= viewportH - margin) {
          top = below;
        } else if (above >= margin) {
          top = above;
        } else {
          top = clamp(centerY - cardHeight / 2, margin, Math.max(margin, viewportH - margin - cardHeight));
        }
      }
    }
    left = clamp(left, margin, Math.max(margin, viewportW - margin - cardWidth));
    top = clamp(top, margin, Math.max(margin, viewportH - margin - cardHeight));
    tutorialCard.style.left = `${Math.round(left)}px`;
    tutorialCard.style.top = `${Math.round(top)}px`;
    tutorialCard.style.transform = 'translate(0, 0)';
  }

  function stopTutorial(markComplete) {
    isTutorial = false;
    tutorialExpectEvent = null;
    activeTutorialStep = null;
    clearTutorialHighlight();
    if (tutOv) {
      tutOv.classList.remove('show');
      tutOv.setAttribute('aria-hidden', 'true');
    }
    if (markComplete) {
      try { localStorage.setItem('tutorialDone', '1'); } catch (err) {}
    }
    hideTutorialPrompt();
  }

  function finishTutorial() {
    stopTutorial(true);
  }

  function abortTutorial() {
    stopTutorial(false);
  }

  function isTutorialRequirementMet(event) {
    switch (event) {
      case 'moveQueued':
        return Array.isArray(plans.A) && plans.A.some(act => typeof act === 'string' && DXY[act]);
      case 'attackMode':
        return attackMode === true;
      case 'attackQueued':
        return Array.isArray(plans.A) && plans.A.some(act => act && typeof act === 'object' && act.type === 'attack');
      case 'shieldQueued':
        return usedShield.A > 0;
      case 'roundStarted':
        return phase === 'execute';
      default:
        return false;
    }
  }

  function hideTutorialOverlay() {
    if (!tutOv) return;
    tutOv.classList.remove('show');
    tutOv.setAttribute('aria-hidden', 'true');
  }

  function showTutorialStep() {
    if (!isTutorial) return;
    const step = tutorialScript[tutorialIndex];
    if (!step) {
      finishTutorial();
      return;
    }
    if (step.mode === 'practice' && step.expect && isTutorialRequirementMet(step.expect)) {
      tutorialIndex++;
      if (tutorialIndex >= tutorialScript.length) {
        finishTutorial();
        return;
      }
      showTutorialStep();
      return;
    }
    activeTutorialStep = step;
    tutorialExpectEvent = step.mode === 'practice' ? (step.expect || null) : null;
    applyTutorialHighlight(step.highlight);
    if (!tutOv || !tutCont || !tutNext) return;
    if (tutorialProgress) {
      const total = tutorialScript.length;
      const current = Math.min(tutorialIndex + 1, total);
      tutorialProgress.textContent = t('tutorialStepLabel', { current, total });
    }
    tutCont.textContent = t(step.key);
    if (tutorialHint) {
      const hintKey = step.hint || (step.mode === 'practice' ? 'tutorialPracticeHint' : 'tutorialNextHint');
      tutorialHint.textContent = t(hintKey);
    }
    const btnLabelKey = step.buttonKey || (step.mode === 'practice' ? 'tutorialTryButton' : 'nextBtn');
    tutNext.textContent = t(btnLabelKey);
    tutNext.disabled = false;
    tutOv.classList.add('show');
    tutOv.setAttribute('aria-hidden', 'false');
    tutNext.focus();
    requestAnimationFrame(() => positionTutorialCard());
    tutNext.onclick = () => {
      if (!isTutorial || activeTutorialStep !== step) return;
      if (step.mode === 'practice') {
        hideTutorialOverlay();
        positionTutorialCard();
        if (!step.expect || isTutorialRequirementMet(step.expect)) {
          tutorialExpectEvent = null;
          activeTutorialStep = null;
          tutorialIndex++;
          if (tutorialIndex >= tutorialScript.length) {
            finishTutorial();
            return;
          }
          showTutorialStep();
          return;
        }
        if (step.focus) {
          const focusTarget = document.querySelector(step.focus);
          if (focusTarget && typeof focusTarget.focus === 'function') {
            setTimeout(() => focusTarget.focus(), 60);
          }
        }
        return;
      }
      activeTutorialStep = null;
      tutorialIndex++;
      if (tutorialIndex >= tutorialScript.length) {
        finishTutorial();
        return;
      }
      showTutorialStep();
    };
  }

  function advanceTutorialEvent(event) {
    if (!isTutorial) return;
    if (tutorialExpectEvent && tutorialExpectEvent === event) {
      tutorialExpectEvent = null;
      hideTutorialOverlay();
      activeTutorialStep = null;
      tutorialIndex++;
      if (tutorialIndex >= tutorialScript.length) {
        finishTutorial();
        return;
      }
      showTutorialStep();
    }
  }

  function startTutorial() {
    hideTutorialPrompt();
    single = true;
    isTutorial = true;
    tutorialIndex = 0;
    activeTutorialStep = null;
    ms.style.display = 'none';
    if (ds) ds.style.display = 'none';
    startGame();
    resetGame();
    startNewRound();
    tutorialExpectEvent = null;
    clearTutorialHighlight();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (isTutorial) showTutorialStep();
      });
    });
  }

  window.startTutorial = startTutorial;
  const tutorialHighlightEl = document.getElementById('tutorialHighlight');
  const tutOv = document.getElementById('tutorialOverlay');
  if (tutOv) tutorialCard = tutOv.querySelector('.tutorialCard');
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
    closeHudMenu();
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

  const difficultyBack = document.getElementById('difficultyBack');
  const onlineBack = document.getElementById('onlineBack');

  b1p.onclick = () => { single = true; ms.style.display = 'none'; ds.style.display = 'flex'; };
  b2p.onclick = () => { single = false; ms.style.display = 'none'; startGame(); };
  bOnline.onclick = () => { ms.style.display = 'none'; onlineMenu.style.display = 'flex'; };

  if (difficultyBack) {
    difficultyBack.addEventListener('click', () => {
      ds.style.display = 'none';
      ms.style.display = 'flex';
      updateLayoutScale();
    });
  }

  if (onlineBack) {
    onlineBack.addEventListener('click', () => {
      onlineMenu.style.display = 'none';
      ms.style.display = 'flex';
      updateLayoutScale();
    });
  }
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
    closeHudMenu();
    board.style.visibility = 'visible';
    ui.classList.add('show');
    if (roundBadge) {
      roundBadge.classList.remove('visible', 'bump');
      displayedRound = 0;
    }
    buildBoard();
    resetMarkedCells();
    bindUI(); render(); updateUI();
    updateScore();
    edgesCollapsed = false;
    replayHistory = [];
    updateLayoutScale();
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

  function getMarkOwner() {
    if (phase === 'execute') return null;
    if (isOnline) return mySide();
    if (phase === 'planA') return 'A';
    if (phase === 'planB') return 'B';
    return null;
  }

  function refreshMarkedCells(owner, force = false) {
    if (!force && markedOwner === owner) return;
    markedOwner = owner || null;
    document.querySelectorAll('.cell.cell-marked').forEach(cell => cell.classList.remove('cell-marked'));
    if (!owner || !markedCells[owner]) return;
    markedCells[owner].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('cell-marked');
    });
  }

  function resetMarkedCells() {
    markedCells = { A: new Set(), B: new Set() };
    refreshMarkedCells(null, true);
  }

  function toggleCellMark(x, y) {
    if (isReplaying) return;
    const owner = getMarkOwner();
    if (!owner) return;
    if (!markedCells[owner]) markedCells[owner] = new Set();
    const id = `c${x}${y}`;
    const set = markedCells[owner];
    if (set.has(id)) set.delete(id); else set.add(id);
    refreshMarkedCells(owner, true);
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
    advanceTutorialEvent('attackMode');
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
    if (isTutorial && P === 'A') {
      if (typeof act === 'string') {
        if (act === 'shield') {
          advanceTutorialEvent('shieldQueued');
        } else if (DXY[act]) {
          advanceTutorialEvent('moveQueued');
        }
      } else if (act && typeof act === 'object' && act.type === 'attack') {
        advanceTutorialEvent('attackQueued');
      }
    }
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
    const tutorialPlanReady = isTutorial && Array.isArray(plans.A) && plans.A.length === STEPS;
    autoPlanB();
    phase = 'execute';
    startRecordingRound();
    btnNext.textContent = t('executeBtn');
    clearPlan(); updateUI();
    if (!isTutorial || tutorialPlanReady) {
      advanceTutorialEvent('roundStarted');
    }
    return;
  }
  if (phase !== 'execute') {
    const tutorialPlanReady = isTutorial && Array.isArray(plans.A) && plans.A.length === STEPS;
    phase = phase === 'planA' ? 'planB' : 'execute';
    if (phase === 'execute') {
      startRecordingRound();
      if (!isTutorial || tutorialPlanReady) {
        advanceTutorialEvent('roundStarted');
      }
    }
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
    refreshMarkedCells(getMarkOwner());
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
    let finalX = Math.max(0, Math.min(4, x));
    let finalY = Math.max(0, Math.min(4, y));
    const hasMove = plans[P].some(r => typeof r === 'string' && DXY[r]);
    plans[P].forEach(r => {
      if (typeof r === 'string' && DXY[r]) {
        x += DXY[r][0]; y += DXY[r][1];
      }
      x = Math.max(0, Math.min(4, x)); y = Math.max(0, Math.min(4, y));
      finalX = x; finalY = y;
      const cell = document.getElementById(`c${x}${y}`);
      if (!cell) return;
      const ov = document.createElement('div');
      if (typeof r === 'object') {
        ov.className = 'planAttack'; ov.textContent = '•'; cell.append(ov);
        r.dirs.forEach(d => {
          const [dx, dy] = DXY[d], nx = x + dx, ny = y + dy;
          if (nx < 0 || nx > 4 || ny < 0 || ny > 4) return;
          const c2 = document.getElementById(`c${nx}${ny}`);
          if (!c2) return;
          const ov2 = document.createElement('div');
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
    if (plans[P].length && hasMove) {
      const ghostCell = document.getElementById(`c${finalX}${finalY}`);
      if (ghostCell) {
        const ghost = document.createElement('div');
        ghost.className = `planGhost ${P === 'A' ? 'planGhostA' : 'planGhostB'}`;
        ghost.setAttribute('aria-hidden', 'true');
        ghostCell.append(ghost);
      }
    }
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
    let unitEl = newCell.querySelector(player === 'A' ? '.playerA' : '.playerB');
    if (!unitEl) {
      unitEl = newCell.querySelector('.playerBoth');
    }
    if (!unitEl || unitEl.dataset.moving === 'true') return;
    const fromRect = oldCell.getBoundingClientRect();
    const toRect = newCell.getBoundingClientRect();
    const dx = (fromRect.left + fromRect.width / 2) - (toRect.left + toRect.width / 2);
    const dy = (fromRect.top + fromRect.height / 2) - (toRect.top + toRect.height / 2);
    unitEl.dataset.moving = 'true';
    const cleanup = () => {
      delete unitEl.dataset.moving;
    };
    if (typeof unitEl.animate === 'function') {
      const animation = unitEl.animate([
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.9)`,
          opacity: 0.35,
          filter: 'drop-shadow(0 0 8px rgba(148,163,184,0.45))'
        },
        {
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1,
          filter: 'drop-shadow(0 0 4px rgba(15,23,42,0.45))'
        }
      ], {
        duration: 420,
        easing: 'cubic-bezier(.22,.74,.27,1.02)',
        fill: 'forwards'
      });
      animation.addEventListener('finish', cleanup, { once: true });
      animation.addEventListener('cancel', cleanup, { once: true });
    } else {
      requestAnimationFrame(() => {
        unitEl.style.setProperty('--fromX', `${dx}px`);
        unitEl.style.setProperty('--fromY', `${dy}px`);
        unitEl.classList.add('moveAnim');
        unitEl.addEventListener('animationend', () => {
          unitEl.classList.remove('moveAnim');
          unitEl.style.removeProperty('--fromX');
          unitEl.style.removeProperty('--fromY');
          cleanup();
        }, { once: true });
      });
    }
  }

  function render() {
    if (!document.getElementById('c00')) return;
    document.querySelectorAll('.playerA,.playerB,.playerBoth').forEach(e => e.remove());
    if (units.A.alive && units.B.alive && units.A.x === units.B.x && units.A.y === units.B.y) {
      const cell = document.getElementById(`c${units.A.x}${units.A.y}`);
      if (cell) {
        const merged = document.createElement('div');
        merged.className = 'playerBoth';
        cell.append(merged);
      }
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
    suppressResultOverlay();
    const ov = document.getElementById('replayOverlay');
    if (ov) {
      ov.classList.add('show');
      ov.setAttribute('aria-hidden', 'false');
    }
    replayPaused = false;
    const pauseBtn = document.getElementById('replayPause');
    if (pauseBtn) {
      pauseBtn.textContent = '❚❚';
      pauseBtn.setAttribute('aria-label', t('pauseReplay'));
      pauseBtn.setAttribute('data-i18n-aria', 'pauseReplay');
    }
    if (replayTimer) {
      clearTimeout(replayTimer);
      replayTimer = null;
    }
    replayLoop = null;
    resetGame();
    replayFrames = buildReplayFrames();
    if (!replayFrames.length) {
      endReplay();
      return;
    }
    replayIndex = 0;
    const seek = document.getElementById('replaySeek');
    if (seek) {
      seek.max = replayFrames.length - 1;
      seek.value = 0;
    }
    function play() {
      if (!isReplaying) return;
      if (replayPaused) {
        replayTimer = null;
        return;
      }
      if (replayIndex >= replayFrames.length) {
        replayPaused = true;
        replayIndex = replayFrames.length - 1;
        if (seek) seek.value = replayIndex;
        const pauseBtn = document.getElementById('replayPause');
        if (pauseBtn) {
          pauseBtn.textContent = '▶';
          pauseBtn.setAttribute('aria-label', t('resumeReplay'));
          pauseBtn.setAttribute('data-i18n-aria', 'resumeReplay');
        }
        stopReplayRecordingIfNeeded();
        return;
      }
      const f = replayFrames[replayIndex++];
      renderReplayFrame(f);
      if (seek) seek.value = replayIndex;
      replayTimer = setTimeout(play, 700 / Math.max(replaySpeed || 0.1, 0.1));
    }
    replayLoop = play;
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
    if (replayTimer) {
      clearTimeout(replayTimer);
      replayTimer = null;
    }
    const seek = document.getElementById('replaySeek');
    if (seek) seek.value = replayIndex;
    const frame = replayFrames[replayIndex];
    if (frame) {
      renderReplayFrame(frame);
    }
    if (!replayPaused && typeof replayLoop === 'function') {
      replayLoop();
    }
  }

  function buildReplayFrames() {
    const frames = [];
    replayHistory.forEach(r => {
      if (!r || !Array.isArray(r.states) || !r.states.length) return;
      frames.push({ state: r.states[0], prevState: null });
      for (let i = 1; i < r.states.length; i += 1) {
        const frameActions = r.actions && r.actions.A && r.actions.B ? {
          A: r.actions.A[i - 1],
          B: r.actions.B[i - 1]
        } : undefined;
        const prevState = r.states[i - 1] || null;
        frames.push({ state: r.states[i], actions: frameActions, prevState });
      }
    });
    return frames;
  }

  function drawReplayCanvasFrame(ctx, frame) {
    if (!ctx || !frame || !frame.state) return;
    const { canvas } = ctx;
    const width = canvas.width;
    const height = canvas.height;
    const isLight = document.documentElement.dataset.theme === 'light';
    const background = isLight ? '#f8fafc' : '#020617';
    const boardFill = isLight ? '#e2e8f0' : '#0f172a';
    const boardInner = isLight ? '#ffffff' : '#111827';
    const edgeFill = isLight ? '#fecdd3' : '#7f1d1d';
    const textColor = isLight ? '#0f172a' : '#f8fafc';
    const attackHighlights = { A: 'rgba(56,189,248,0.65)', B: 'rgba(249,115,22,0.65)' };
    const shieldHighlights = { A: 'rgba(56,189,248,0.5)', B: 'rgba(249,115,22,0.5)' };

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const topReserve = Math.round(height * 0.18);
    const boardOuter = Math.min(width * 0.86, (height - topReserve) * 0.94);
    const boardX = Math.round((width - boardOuter) / 2);
    const boardY = Math.round((height - boardOuter) / 2 + topReserve * 0.25);
    const cornerRadius = Math.max(18, Math.round(boardOuter * 0.06));
    const innerPadding = Math.max(16, Math.round(boardOuter * 0.08));
    const gap = Math.max(4, Math.round(boardOuter * 0.022));
    const innerSize = boardOuter - innerPadding * 2;
    const cellSize = (innerSize - gap * 4) / 5;
    const cellRadius = Math.max(10, cellSize * 0.22);
    const state = frame.state;
    const prevState = frame.prevState || null;

    const drawRoundedRect = (x, y, w, h, r) => {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    };

    ctx.fillStyle = boardFill;
    drawRoundedRect(boardX, boardY, boardOuter, boardOuter, cornerRadius);

    const innerX = boardX + innerPadding;
    const innerY = boardY + innerPadding;
    const getCellRect = (x, y) => ({
      x: innerX + x * (cellSize + gap),
      y: innerY + y * (cellSize + gap)
    });
    const getCellCenter = (x, y) => {
      const rect = getCellRect(x, y);
      return {
        x: rect.x + cellSize / 2,
        y: rect.y + cellSize / 2
      };
    };

    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const rect = getCellRect(x, y);
        const collapsed = state.edgesCollapsed && (x === 0 || x === 4 || y === 0 || y === 4);
        ctx.fillStyle = collapsed ? edgeFill : boardInner;
        drawRoundedRect(rect.x, rect.y, cellSize, cellSize, cellRadius);
      }
    }

    const highlightCell = (x, y, color, alpha = 0.5) => {
      if (x < 0 || x > 4 || y < 0 || y > 4) return;
      const rect = getCellRect(x, y);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      drawRoundedRect(rect.x, rect.y, cellSize, cellSize, cellRadius);
      ctx.restore();
    };

    const postDraw = [];

    const drawShield = (player, unit) => {
      if (!unit) return;
      const color = shieldHighlights[player] || 'rgba(148,163,184,0.45)';
      highlightCell(unit.x, unit.y, color, 0.35);
      const center = getCellCenter(unit.x, unit.y);
      const radius = Math.max(cellSize * 0.38, cellSize / 2 - gap * 0.45);
      postDraw.push(() => {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(4, cellSize * 0.16);
        ctx.shadowColor = color;
        ctx.shadowBlur = Math.max(6, cellSize * 0.12);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    };

    const drawAttack = (player, unit, dirs) => {
      if (!unit || !Array.isArray(dirs)) return;
      const color = attackHighlights[player] || 'rgba(14,165,233,0.6)';
      highlightCell(unit.x, unit.y, color, 0.6);
      const origin = getCellCenter(unit.x, unit.y);
      dirs.forEach(dir => {
        const delta = DXY[dir];
        if (!delta) return;
        const tx = unit.x + delta[0];
        const ty = unit.y + delta[1];
        if (tx < 0 || tx > 4 || ty < 0 || ty > 4) return;
        highlightCell(tx, ty, color, 0.45);
        const target = getCellCenter(tx, ty);
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(3, cellSize * 0.1);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.restore();
      });
    };

    if (frame.actions) {
      ['A', 'B'].forEach(player => {
        const act = frame.actions[player];
        if (!act) return;
        const currentUnit = state.units && state.units[player] ? { ...state.units[player] } : null;
        const fallbackUnit = !currentUnit && prevState && prevState.units ? prevState.units[player] : null;
        const unit = currentUnit || fallbackUnit;
        if (act === 'shield') {
          drawShield(player, unit);
        } else if (act && typeof act === 'object') {
          drawAttack(player, unit, act.dirs);
        }
      });
    }

    const drawToken = (x, y, color, clipStart = 0, clipEnd = Math.PI * 2) => {
      const center = getCellCenter(x, y);
      const radius = cellSize * 0.36;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, clipStart, clipEnd, false);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const aColor = '#38bdf8';
    const bColor = '#f97316';
    if (state.units && state.units.A && state.units.B && state.units.A.alive && state.units.B.alive &&
        state.units.A.x === state.units.B.x && state.units.A.y === state.units.B.y) {
      drawToken(state.units.A.x, state.units.A.y, aColor, Math.PI * 1.5, Math.PI * 0.5);
      drawToken(state.units.B.x, state.units.B.y, bColor, Math.PI * 0.5, Math.PI * 1.5);
    } else {
      if (state.units && state.units.A && state.units.A.alive) {
        drawToken(state.units.A.x, state.units.A.y, aColor);
      }
      if (state.units && state.units.B && state.units.B.alive) {
        drawToken(state.units.B.x, state.units.B.y, bColor);
      }
      if (state.units && state.units.A && !state.units.A.alive && Number.isFinite(state.units.A.x) && Number.isFinite(state.units.A.y)) {
        const center = getCellCenter(state.units.A.x, state.units.A.y);
        highlightCell(state.units.A.x, state.units.A.y, 'rgba(239,68,68,0.45)', 0.45);
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = Math.max(4, cellSize * 0.12);
        ctx.beginPath();
        ctx.moveTo(center.x - cellSize * 0.32, center.y - cellSize * 0.32);
        ctx.lineTo(center.x + cellSize * 0.32, center.y + cellSize * 0.32);
        ctx.moveTo(center.x + cellSize * 0.32, center.y - cellSize * 0.32);
        ctx.lineTo(center.x - cellSize * 0.32, center.y + cellSize * 0.32);
        ctx.stroke();
        ctx.restore();
      }
      if (state.units && state.units.B && !state.units.B.alive && Number.isFinite(state.units.B.x) && Number.isFinite(state.units.B.y)) {
        const center = getCellCenter(state.units.B.x, state.units.B.y);
        highlightCell(state.units.B.x, state.units.B.y, 'rgba(239,68,68,0.45)', 0.45);
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = Math.max(4, cellSize * 0.12);
        ctx.beginPath();
        ctx.moveTo(center.x - cellSize * 0.32, center.y - cellSize * 0.32);
        ctx.lineTo(center.x + cellSize * 0.32, center.y + cellSize * 0.32);
        ctx.moveTo(center.x + cellSize * 0.32, center.y - cellSize * 0.32);
        ctx.lineTo(center.x - cellSize * 0.32, center.y + cellSize * 0.32);
        ctx.stroke();
        ctx.restore();
      }
    }

    postDraw.forEach(fn => fn());

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    const roundLabel = typeof t === 'function' ? `${t('round')} ${state.round}` : `Round ${state.round}`;
    ctx.font = '600 30px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(roundLabel, width / 2, Math.max(48, boardY - 36));
    const stepLabel = typeof t === 'function' ? t('phaseExecuting', { step: state.step }) : `Step ${state.step}`;
    ctx.font = '500 20px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(stepLabel, width / 2, Math.max(72, boardY - 8));
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function saveReplayVideo() {
    if (!replayHistory.length || recorder) return;
    const frames = buildReplayFrames();
    if (!frames.length) {
      alert(typeof t === 'function' ? t('replaySaveFailed') : 'Unable to save replay.');
      return;
    }
    if (typeof HTMLCanvasElement === 'undefined') {
      alert(t('recordingNotSupported'));
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 720;
    canvas.style.position = 'fixed';
    canvas.style.left = '-9999px';
    canvas.style.top = '-9999px';
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = '0';
    document.body.append(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof canvas.captureStream !== 'function') {
      canvas.remove();
      alert(t('recordingNotSupported'));
      return;
    }
    const stream = canvas.captureStream(30);
    if (!stream) {
      canvas.remove();
      alert(t('recordingNotSupported'));
      return;
    }
    recordedChunks = [];
    if (typeof MediaRecorder === 'undefined') {
      try { stream.getTracks().forEach(track => track.stop()); } catch (err) {}
      canvas.remove();
      alert(t('recordingNotSupported'));
      return;
    }
    const mp4Candidates = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=h264,aac', 'video/mp4'];
    let selectedRecorder = null;
    let mime = null;
    for (const candidate of mp4Candidates) {
      if (typeof MediaRecorder.isTypeSupported === 'function' && !MediaRecorder.isTypeSupported(candidate)) continue;
      try {
        selectedRecorder = new MediaRecorder(stream, { mimeType: candidate });
        mime = selectedRecorder.mimeType || candidate;
        break;
      } catch (err) {
        selectedRecorder = null;
      }
    }
    if (!selectedRecorder && typeof MediaRecorder.isTypeSupported !== 'function') {
      try {
        selectedRecorder = new MediaRecorder(stream, { mimeType: 'video/mp4' });
        mime = selectedRecorder.mimeType || 'video/mp4';
      } catch (err) {
        selectedRecorder = null;
      }
    }
    if (!selectedRecorder || !mime || !mime.includes('mp4')) {
      try { stream.getTracks().forEach(track => track.stop()); } catch (err) {}
      canvas.remove();
      alert(t('recordingNotSupported'));
      return;
    }

    recorder = selectedRecorder;
    recorderMime = mime;
    recorderExt = 'mp4';
    recorderStream = stream;
    recorderCanvas = canvas;
    recorder.ondataavailable = e => {
      if (e.data && e.data.size) recordedChunks.push(e.data);
    };

    const finishRecording = () => {
      recordedChunks = [];
      if (recorderStream) {
        try { recorderStream.getTracks().forEach(track => track.stop()); } catch (err) {}
        recorderStream = null;
      }
      if (recorderCanvas) {
        try { recorderCanvas.remove(); } catch (err) {}
        recorderCanvas = null;
      }
      recorder = null;
    };

    let resolveRecording;
    let started = false;
    const completion = new Promise(resolve => {
      resolveRecording = resolve;
      recorder.onstop = async () => {
        try {
          const blob = new Blob(recordedChunks, { type: recorderMime });
          const filename = `replay.${recorderExt}`;
          const fileObject = typeof File === 'function' ? new File([blob], filename, { type: recorderMime }) : null;
          const triggerDownload = () => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
          };
          if (recorderExt === 'mp4' && typeof window.showSaveFilePicker === 'function') {
            try {
              const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{ description: 'MP4 Video', accept: { 'video/mp4': ['.mp4'] } }]
              });
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
              return;
            } catch (err) {
              // fallback to sharing or download
            }
          }
          if (fileObject && navigator.canShare && navigator.share && navigator.canShare({ files: [fileObject] })) {
            try {
              await navigator.share({ files: [fileObject] });
              return;
            } catch (err) {
              triggerDownload();
              return;
            }
          }
          triggerDownload();
        } catch (err) {
          console.error('Failed to export replay video', err);
          alert(t('replaySaveFailed'));
        } finally {
          finishRecording();
          if (typeof resolveRecording === 'function') resolveRecording();
        }
      };
    });

    try {
      recorder.start();
      started = true;
      const frameDuration = frames.length > 1 ? 560 : 900;
      for (let i = 0; i < frames.length; i += 1) {
        drawReplayCanvasFrame(ctx, frames[i]);
        await delay(frameDuration);
      }
      await delay(Math.max(820, frameDuration));
      stopReplayRecordingIfNeeded();
      await completion;
    } catch (err) {
      console.error('Failed to render replay video', err);
      alert(typeof t === 'function' ? t('replaySaveFailed') : 'Unable to save replay.');
      if (started) {
        try { stopReplayRecordingIfNeeded(); } catch (e) {}
        await completion;
      } else {
        finishRecording();
        if (typeof resolveRecording === 'function') resolveRecording();
      }
    }
  }

  function stopReplayRecordingIfNeeded() {
    if (!recorder) return;
    try {
      if (typeof recorder.state === 'string' && recorder.state === 'inactive') return;
      recorder.stop();
    } catch (err) {}
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
    if (replayTimer) {
      clearTimeout(replayTimer);
      replayTimer = null;
    }
    replayLoop = null;
    isReplaying = false;
    replayPaused = false;
    replayIndex = 0;
    replayFrames = [];
    if (recorder) {
      stopReplayRecordingIfNeeded();
      recorder = null;
    }
    if (recorderStream) {
      try { recorderStream.getTracks().forEach(track => track.stop()); } catch (e) {}
      recorderStream = null;
    }
    recordedChunks = [];
    recorderMime = 'video/webm';
    recorderExt = 'webm';
    const ov = document.getElementById('replayOverlay');
    if (ov) {
      ov.classList.remove('show');
      ov.setAttribute('aria-hidden', 'true');
    }
    resetGame();
    updateScore();
    updateReplayButton();
    restoreResultOverlay();
  }

  window.startReplay = startReplay;
  window.endReplay = endReplay;
  window.seekReplay = seekReplay;
  window.saveReplayVideo = saveReplayVideo;

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
        if (typeof window.saveReplayVideo === 'function') {
          window.saveReplayVideo();
        } else {
          saveReplayVideo();
        }
      };
    });
  }

  window.showSaveSpeedModal = showSaveSpeedModal;

  function removeResultOverlay() {
    if (activeResultOverlay && activeResultOverlay.parentNode) {
      activeResultOverlay.remove();
    }
    activeResultOverlay = null;
    resultOverlaySuppressed = false;
  }

  function suppressResultOverlay() {
    if (!activeResultOverlay || resultOverlaySuppressed) return;
    activeResultOverlay.classList.add('hidden');
    activeResultOverlay.setAttribute('aria-hidden', 'true');
    resultOverlaySuppressed = true;
  }

  function restoreResultOverlay() {
    if (!activeResultOverlay || !resultOverlaySuppressed) return;
    activeResultOverlay.classList.remove('hidden');
    activeResultOverlay.removeAttribute('aria-hidden');
    const focusTarget = activeResultOverlay.querySelector('#resPlayAgain') || activeResultOverlay.querySelector('button');
    if (focusTarget) {
      setTimeout(() => focusTarget.focus(), 0);
    }
    resultOverlaySuppressed = false;
  }

  function showResult(text) {
    removeResultOverlay();
    const ov = document.createElement('div');
    ov.id = 'resultOverlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.innerHTML =
      `<div>${text}</div>` +
      '<div class="resultActions">' +
      '  <div class="resultGroup">' +
      '    <div class="resultGroupButtons">' +
      `      <button id="resReplay">${t('replay')}</button>` +
      `      <button id="resSaveReplay">${t('saveReplay')}</button>` +
      '    </div>' +
      '    <div id="replaySaveStatus" class="resultStatus" role="status" aria-live="polite"></div>' +
      '  </div>' +
      '  <div class="resultGroup">' +
      '    <div class="resultGroupButtons">' +
      `      <button id="resMenu">${t('toMenu')}</button>` +
      `      <button id="resPlayAgain">${t('playAgain')}</button>` +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.append(ov);
    activeResultOverlay = ov;
    resultOverlaySuppressed = false;
    ov.setAttribute('aria-hidden', 'false');
    const resAgain = ov.querySelector('#resPlayAgain');
    const resMenu = ov.querySelector('#resMenu');
    const resReplay = ov.querySelector('#resReplay');
    const resSave = ov.querySelector('#resSaveReplay');
    const statusEl = ov.querySelector('#replaySaveStatus');
    if (resAgain) {
      resAgain.onclick = () => {
        removeResultOverlay();
        resetGame();
        if (typeof window.exitOnlineMode === 'function') window.exitOnlineMode();
        if (typeof window.cleanupRoom === 'function') window.cleanupRoom();
      };
    }
    if (resMenu) {
      resMenu.onclick = () => {
        removeResultOverlay();
        returnToMenu();
      };
    }
    if (resReplay) {
      resReplay.onclick = () => {
        suppressResultOverlay();
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
    resetOnlineFlags();
    resetMarkedCells();
    clearPlan();
    document.querySelectorAll('.attack,.shield,.death').forEach(e => e.remove());
    render(); btnNext.textContent = t('nextBtn'); updateUI();
  }

  function clearPlan() {
    document.querySelectorAll('.planMove,.planAttack,.planShield,.planGhost').forEach(e => e.remove());
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
    removeResultOverlay();
    resetGame();
    hideAttackOverlay();
    abortTutorial();
    board.style.visibility = 'hidden';
    ui.classList.remove('show');
    closeHudMenu();
    if (roundBadge) {
      roundBadge.classList.remove('visible', 'bump');
      displayedRound = 0;
    }
    if (typeof window.cleanupRoom === 'function') window.cleanupRoom();
    if (typeof window.disconnectPeer === 'function') window.disconnectPeer();
    exitOnlineMode();
    if (typeof window.hideSettingsModal === 'function') {
      window.hideSettingsModal({ immediate: true, returnFocus: false });
    } else {
      const settingsModalEl = document.getElementById('settingsModal');
      if (settingsModalEl) {
        settingsModalEl.classList.remove('visible', 'show');
        settingsModalEl.setAttribute('aria-hidden', 'true');
      }
      if (settingsIcon) settingsIcon.classList.remove('active');
    }
    ms.style.display = 'flex';
    if (ds) ds.style.display = 'none';
    if (onlineMenu) onlineMenu.style.display = 'none';
    updateLayoutScale();
  }

  window.returnToMenu = returnToMenu;
  window.plans = plans;
  window.toggleCellMark = toggleCellMark;

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

  syncHudSpacing();
  updateLayoutScale();
})();

document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const settingsClose = document.getElementById('settingsClose');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const soundToggle = document.getElementById('soundToggle');
  const langSelect = document.getElementById('langSelect');
  const tutorialPromptLang = document.getElementById('tutorialPromptLang');
  const menuBtn = document.getElementById('menuBtn');
  const replayClose = document.getElementById('replayClose');
  const speedBtns = document.querySelectorAll('.speedBtn');
  const replayPauseBtn = document.getElementById('replayPause');
  const replayBtn = document.getElementById('replayBtn');
  const saveReplayBtn = document.getElementById('saveReplay');
  const replaySeek = document.getElementById('replaySeek');
  const hideHudMenu = () => {
    if (typeof window.closeHudMenu === 'function') {
      window.closeHudMenu();
      return;
    }
    const menu = document.getElementById('scoreboardMenu');
    if (menu) {
      menu.classList.remove('show');
      menu.setAttribute('aria-hidden', 'true');
    }
    const backdrop = document.getElementById('scoreboardBackdrop');
    if (backdrop) backdrop.classList.remove('show');
    const toggle = document.getElementById('scoreboardToggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  };

  if (settingsModal) {
    settingsModal.setAttribute('aria-hidden', 'true');
  }

  const showSettingsModal = () => {
    if (!settingsModal) return;
    hideHudMenu();
    if (!settingsModal.classList.contains('show')) {
      settingsModal.classList.add('show');
    }
    settingsModal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      settingsModal.classList.add('visible');
    });
    if (settingsBtn && !settingsBtn.classList.contains('active')) {
      playHudIconAnimation(settingsBtn, true);
      settingsBtn.classList.add('active');
    }
    const focusTarget = settingsModal.querySelector('button, input, select, [tabindex]:not([tabindex="-1"])');
    if (focusTarget && typeof focusTarget.focus === 'function') {
      try {
        focusTarget.focus({ preventScroll: true });
      } catch (err) {
        focusTarget.focus();
      }
    }
  };

  const hideSettingsModal = (options = {}) => {
    if (!settingsModal) return;
    if (!settingsModal.classList.contains('show')) {
      settingsModal.setAttribute('aria-hidden', 'true');
      if (settingsBtn) settingsBtn.classList.remove('active');
      return;
    }
    const immediate = options.immediate === true;
    const finalize = () => {
      settingsModal.classList.remove('show');
      settingsModal.setAttribute('aria-hidden', 'true');
    };
    if (immediate) {
      settingsModal.classList.remove('visible');
      finalize();
    } else {
      if (settingsModal.classList.contains('visible')) {
        settingsModal.classList.remove('visible');
        const onTransition = evt => {
          if (evt && evt.target !== settingsModal) return;
          if (evt && evt.propertyName && evt.propertyName !== 'opacity') return;
          finalize();
          settingsModal.removeEventListener('transitionend', onTransition);
        };
        settingsModal.addEventListener('transitionend', onTransition);
        setTimeout(() => {
          finalize();
          settingsModal.removeEventListener('transitionend', onTransition);
        }, 360);
      } else {
        finalize();
      }
    }
    if (settingsBtn && settingsBtn.classList.contains('active')) {
      playHudIconAnimation(settingsBtn, false);
      settingsBtn.classList.remove('active');
    }
    if (options.returnFocus && settingsBtn && typeof settingsBtn.focus === 'function') {
      try {
        settingsBtn.focus({ preventScroll: true });
      } catch (err) {
        settingsBtn.focus();
      }
    }
  };

  window.hideSettingsModal = hideSettingsModal;

  if (settingsBtn && settingsModal) {
    settingsBtn.onclick = () => {
      if (settingsModal.classList.contains('show') && settingsModal.classList.contains('visible')) {
        hideSettingsModal({ returnFocus: false });
      } else {
        showSettingsModal();
      }
    };
  }
  if (settingsClose && settingsModal) {
    settingsClose.onclick = () => {
      hideSettingsModal({ returnFocus: true });
    };
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
  const detectInitialLanguage = () => {
    if (window.i18n && window.i18n.lang) return window.i18n.lang;
    try {
      const stored = localStorage.getItem('language');
      if (stored) return stored;
    } catch (err) {}
    return 'en';
  };

  const syncLanguageControls = lang => {
    if (langSelect) {
      langSelect.dataset.value = lang;
      const display = langSelect.querySelector('.dropdown-display');
      const option = langSelect.querySelector(`.dropdown-option[data-value="${lang}"]`);
      if (display && option) {
        display.textContent = option.textContent;
      }
    }
    if (tutorialPromptLang) {
      tutorialPromptLang.value = lang;
    }
  };

  const applyLanguage = lang => {
    if (!lang) return;
    const normalized = lang.toLowerCase();
    const translations = window.i18n && window.i18n.translations;
    if (translations && translations[normalized]) {
      window.i18n.setLang(normalized);
    } else {
      syncLanguageControls(normalized);
    }
    try { localStorage.setItem('language', normalized); } catch (err) {}
  };

  if (window.i18n && typeof window.i18n.setLang === 'function') {
    const originalSetLang = window.i18n.setLang.bind(window.i18n);
    window.i18n.setLang = lang => {
      originalSetLang(lang);
      syncLanguageControls(window.i18n.lang);
    };
  }

  const initialLang = detectInitialLanguage();
  syncLanguageControls(initialLang);

  if (typeof setupDropdowns === 'function') setupDropdowns();

  if (langSelect) {
    langSelect.addEventListener('change', () => {
      const val = langSelect.dataset.value;
      applyLanguage(val);
    });
  }

  if (tutorialPromptLang) {
    tutorialPromptLang.addEventListener('change', () => {
      applyLanguage(tutorialPromptLang.value);
    });
  }
  if (menuBtn) {
    menuBtn.onclick = () => {
      hideHudMenu();
      if (typeof window.returnToMenu === 'function') window.returnToMenu();
    };
  }
  if (replayClose) {
    replayClose.onclick = () => {
      if (typeof window.endReplay === 'function') window.endReplay();
    };
  }
  if (replayBtn) {
    replayBtn.onclick = () => {
      hideHudMenu();
      if (typeof window.startReplay === 'function') window.startReplay();
    };
    if (typeof window.updateReplayButton === 'function') window.updateReplayButton();
  }
  if (saveReplayBtn) {
    saveReplayBtn.onclick = () => {
      if (typeof window.showSaveSpeedModal === 'function') window.showSaveSpeedModal();
    };
  }
  if (replaySeek) {
    replaySeek.oninput = () => {
      const target = parseInt(replaySeek.value, 10);
      if (!Number.isNaN(target)) {
        if (typeof window.seekReplay === 'function') window.seekReplay(target);
      }
    };
  }
  if (speedBtns.length) {
    speedBtns.forEach(btn => {
      if (parseFloat(btn.dataset.speed) === replaySpeed) btn.classList.add('active');
      btn.onclick = () => {
        replaySpeed = parseFloat(btn.dataset.speed);
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (!replayPaused && typeof replayLoop === 'function') {
          if (replayTimer) {
            clearTimeout(replayTimer);
            replayTimer = null;
          }
          replayLoop();
        }
      };
    });
  }
  if (replayPauseBtn) {
    replayPauseBtn.setAttribute('aria-label', t('pauseReplay'));
    replayPauseBtn.setAttribute('data-i18n-aria', 'pauseReplay');
    replayPauseBtn.onclick = () => {
      replayPaused = !replayPaused;
      if (replayPaused) {
        replayPauseBtn.textContent = '▶';
        replayPauseBtn.setAttribute('aria-label', t('resumeReplay'));
        replayPauseBtn.setAttribute('data-i18n-aria', 'resumeReplay');
        if (replayTimer) {
          clearTimeout(replayTimer);
          replayTimer = null;
        }
      } else {
        replayPauseBtn.textContent = '❚❚';
        replayPauseBtn.setAttribute('aria-label', t('pauseReplay'));
        replayPauseBtn.setAttribute('data-i18n-aria', 'pauseReplay');
        if (typeof replayLoop === 'function') {
          replayLoop();
        }
      }
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
