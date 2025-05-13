// js/ai.js

export function generatePlan(units, currentRound, difficulty, stepsCount) {
  const DXY = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const probBest = difficulty === 'hard' ? 0.9 : difficulty === 'easy' ? 0.4 : 0.7;

  // AI state
  const state = {
    simX: units.B.x,
    simY: units.B.y,
    oppX: units.A.x,
    oppY: units.A.y,
    usedMove: new Set(),
    usedAtkDirs: new Set(),
    usedAtkCount: 0,
    usedShieldCount: 0
  };

  const plan = [];

  for (let i = 0; i < stepsCount; i++) {
    const options = [];

    // Movement options (cannot move in a direction already attacked)
    for (const d in DXY) {
      if (!state.usedAtkDirs.has(d)) {
        const [dx, dy] = DXY[d];
        const nx = state.simX + dx, ny = state.simY + dy;
        if (nx >= 0 && nx <= 4 && ny >= 0 && ny <= 4) options.push(d);
      }
    }

    // Attack options (if not used yet)
    if (state.usedAtkCount < 1) {
      // directional attacks at opponent
      for (const d in DXY) {
        if (!state.usedMove.has(d)) {
          const [dx, dy] = DXY[d];
          if (state.simX + dx === state.oppX && state.simY + dy === state.oppY) {
            options.push({ type: 'attack', dirs: [d] });
          }
        }
      }
      // always allow self-attack
      options.push({ type: 'attack', dirs: [] });
    }

    // Shield option
    if (state.usedShieldCount < 1) options.push('shield');

    // Score each option
    const scored = options.map(opt => {
      let score = -Infinity;
      if (typeof opt === 'string') {
        if (opt === 'shield') {
          // shield is valuable if opponent adjacent
          const dist = manhattan(state.simX, state.simY, state.oppX, state.oppY);
          score = dist <= 1 ? 50 : 10;
        } else {
          // movement: prefer reducing distance or moving to center in sudden death
          const [dx, dy] = DXY[opt];
          const nx = state.simX + dx, ny = state.simY + dy;
          const dist = manhattan(nx, ny, state.oppX, state.oppY);
          if (currentRound === 4) {
            score = centerScore(nx, ny);
          } else {
            score = -dist;
          }
        }
      } else if (opt.type === 'attack') {
        // attack: hits if opponent in target cells
        if (opt.dirs.length === 0) {
          score = (state.simX === state.oppX && state.simY === state.oppY) ? 100 : 0;
        } else {
          const [d] = opt.dirs;
          const [dx, dy] = DXY[d];
          const nx = state.simX + dx, ny = state.simY + dy;
          score = (nx === state.oppX && ny === state.oppY) ? 100 : 0;
        }
      }
      return { opt, score };
    });

    // Select best and possibly random
    let bestEntry = scored[0];
    for (const e of scored) if (e.score > bestEntry.score) bestEntry = e;
    let choice;
    if (Math.random() < probBest) {
      choice = bestEntry.opt;
    } else {
      // choose random among others
      const others = scored.filter(e => e.opt !== bestEntry.opt).map(e => e.opt);
      choice = others.length ? randomChoice(others) : bestEntry.opt;
    }

    // Apply choice to state
    if (typeof choice === 'string') {
      if (choice === 'shield') {
        state.usedShieldCount++;
      } else {
        state.usedMove.add(choice);
        const [dx, dy] = DXY[choice];
        state.simX += dx; state.simY += dy;
      }
    } else {
      state.usedAtkCount++;
      choice.dirs.forEach(d => state.usedAtkDirs.add(d));
    }

    plan.push(choice);
  }

  return plan;
}

// Helpers

function manhattan(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function centerScore(x, y) {
  // prefer closer to center (2,2) in sudden death
  return -manhattan(x, y, 2, 2);
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
