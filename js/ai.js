// js/ai.js

/**
 * Генерирует план из stepsCount действий для ИИ (игрок B),
 * предугадывая ответ игрока A на каждом шаге.
 * Используется поиск minimax с альфа-бета-отсечением depth=2 (ход ИИ + ответ игрока).
 *
 * @param {{A:{x:number,y:number,alive:boolean}, B:{x:number,y:number,alive:boolean}}} units
 * @param {number} currentRound — номер раунда (1–4)
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {number} stepsCount — обычно 5
 * @returns {(string|{type:"attack",dirs:string[]})[]}
 */
export function generatePlan(units, currentRound, difficulty, stepsCount) {
  const DXY = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
  // глубина = 2 (ИИ → игрок), можно расширять для hard на 3
  const depth = difficulty === 'hard' ? 3 : 2;

  // инициализируем состояние
  let state = {
    A: { x: units.A.x, y: units.A.y, alive: units.A.alive },
    B: { x: units.B.x, y: units.B.y, alive: units.B.alive }
  };

  const plan = [];
  for (let i = 0; i < stepsCount; i++) {
    // 1) Выбираем лучший ход ИИ с учётом ответа игрока
    const { action } = minimax(state, depth, -Infinity, Infinity, true, DXY);
    plan.push(action);
    // 2) Применяем ход ИИ
    state = applyAction(state, 'B', action, DXY);
    // 3) Симулируем оптимальный ответ игрока (глубина=1, minimizing)
    const { action: oppAct } = minimax(state, 1, -Infinity, Infinity, false, DXY);
    state = applyAction(state, 'A', oppAct, DXY);
    // Если кто-то умер — дальнейшая симуляция не нужна, просто дополняем пустыми ходами
    if (!state.A.alive || !state.B.alive) {
      for (let j = i+1; j < stepsCount; j++) plan.push('shield');
      break;
    }
  }
  return plan;
}

// Минимакс с альфа-бета
function minimax(state, depth, alpha, beta, maximizingPlayer, DXY) {
  if (depth === 0 || isTerminal(state)) {
    return { value: evaluateState(state), action: null };
  }
  const player = maximizingPlayer ? 'B' : 'A';
  let bestValue  = maximizingPlayer ? -Infinity : Infinity;
  let bestAction = null;

  for (const action of getLegalActions(state, player, DXY)) {
    const next = applyAction(cloneState(state), player, action, DXY);
    const { value } = minimax(next, depth - 1, alpha, beta, !maximizingPlayer, DXY);
    if (maximizingPlayer) {
      if (value > bestValue) { bestValue = value; bestAction = action; }
      alpha = Math.max(alpha, bestValue);
    } else {
      if (value < bestValue) { bestValue = value; bestAction = action; }
      beta  = Math.min(beta, bestValue);
    }
    if (beta <= alpha) break;
  }
  return { value: bestValue, action: bestAction };
}

// Генерация всех легальных действий для данного игрока в текущем состоянии
function getLegalActions(state, player, DXY) {
  const acts = [];
  const me = state[player];
  const opp = state[player==='A'?'B':'A'];

  // 1) Атака (один раз за раунд)
  // — self
  acts.push({ type:'attack', dirs:[] });
  // — в каждую сторону
  for (const d in DXY) {
    const [dx,dy] = DXY[d];
    const nx = me.x + dx, ny = me.y + dy;
    if (nx>=0&&nx<5&&ny>=0&&ny<5) acts.push({ type:'attack', dirs:[d] });
  }

  // 2) Щит (одноразово)
  acts.push('shield');

  // 3) Передвижение
  for (const d in DXY) {
    const [dx,dy] = DXY[d];
    const nx = me.x + dx, ny = me.y + dy;
    if (nx>=0&&nx<5&&ny>=0&&ny<5) acts.push(d);
  }
  return acts;
}

// Применение действия к копии состояния — возвращает новый state
function applyAction(state, player, act, DXY) {
  const me = state[player];
  const opp = state[player==='A'?'B':'A'];

  if (act === 'shield') {
    // просто сохраняем щит, не моделируем здесь подробно
    return state;
  }
  if (typeof act === 'string') {
    // движение
    const [dx,dy] = DXY[act];
    me.x = Math.max(0, Math.min(4, me.x + dx));
    me.y = Math.max(0, Math.min(4, me.y + dy));
    return state;
  }
  // атака
  // self‐атака
  if (act.dirs.length === 0) {
    if (me.x === opp.x && me.y === opp.y) opp.alive = false;
  }
  // directional
  act.dirs.forEach(d=>{
    const [dx,dy] = DXY[d];
    const nx = me.x + dx, ny = me.y + dy;
    if (nx>=0&&nx<5&&ny>=0&&ny<5) {
      if (opp.x===nx && opp.y===ny) opp.alive = false;
    }
  });
  return state;
}

// Оценочная функция состояния:
// +1000 если B победил, -1000 если A победил;
// иначе – манхэттен дистанция (чем меньше – тем лучше для B).
function evaluateState(state) {
  if (!state.A.alive &&  state.B.alive) return +1000;
  if ( state.A.alive && !state.B.alive) return -1000;
  const dist = Math.abs(state.B.x - state.A.x) + Math.abs(state.B.y - state.A.y);
  return -dist;
}

function isTerminal(state) {
  return !state.A.alive || !state.B.alive;
}

// Глубокое копирование состояния
function cloneState(s) {
  return {
    A: { x:s.A.x, y:s.A.y, alive: s.A.alive },
    B: { x:s.B.x, y:s.B.y, alive: s.B.alive }
  };
}