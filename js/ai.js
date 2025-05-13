// js/ai.js
// AI-модуль: полноценная логика выбора ходов, приближённая к реальному игроку.

export function generatePlan(units, currentRound, difficulty, stepsCount) {
  const DXY = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };

  // Вес шанса выбрать лучший ход по сложности
  const probBest = difficulty==='hard'?0.9: difficulty==='easy'?0.4: 0.7;

  // Инициализация состояния ИИ
  const state = {
    x: units.B.x, y: units.B.y,
    oppX: units.A.x, oppY: units.A.y,
    usedMove: new Set(), usedAtkDirs: new Set(),
    usedAtk: 0, usedShield: 0
  };

  const plan = [];

  for(let i=0; i<stepsCount; i++){
    // Собираем все допустимые действия
    const actions = [];

    // 1) Атаки
    if(state.usedAtk<1){
      // самопроизвольная атака
      actions.push({type:'attack',dirs:[]});
      // направленные атаки на соперника
      for(const d in DXY){
        if(!state.usedMove.has(d)){
          const [dx,dy]=DXY[d];
          if(state.x+dx===state.oppX && state.y+dy===state.oppY){
            actions.push({type:'attack',dirs:[d]});
          }
        }
      }
    }

    // 2) Щит
    if(state.usedShield<1){
      actions.push('shield');
    }

    // 3) Ходы
    for(const d in DXY){
      if(!state.usedAtkDirs.has(d)){
        const [dx,dy]=DXY[d];
        const nx=state.x+dx, ny=state.y+dy;
        if(nx>=0&&nx<5&&ny>=0&&ny<5) actions.push(d);
      }
    }

    // Оцениваем каждое действие
    const scored = actions.map(act=>{
      let score=-Infinity;
      if(act==='shield'){
        // shield ценнее, когда противник рядом
        const dist=manh(state.x,state.y,state.oppX,state.oppY);
        score = dist<=1?80:20;
      }
      else if(typeof act==='object'&&act.type==='attack'){
        // атака: максимальный приоритет, если убивает
        if(act.dirs.length===0){
          score = (state.x===state.oppX&&state.y===state.oppY)?100:10;
        } else {
          const [d]=act.dirs, [dx,dy]=DXY[d];
          score = (state.x+dx===state.oppX&&state.y+dy===state.oppY)?100:20;
        }
      }
      else {
        // движение: стремимся к врагу, центрируемся в sudden-death
        const [dx,dy]=DXY[act];
        const nx=state.x+dx, ny=state.y+dy;
        if(currentRound===4){
          score = -manh(nx,ny,2,2); // ближе к центру
        } else {
          score = -manh(nx,ny,state.oppX,state.oppY);
        }
      }
      return {act,score};
    });

    // Выбираем лучшее действие
    let best = scored[0];
    for(const s of scored) if(s.score>best.score) best=s;
    let choice;
    if(Math.random()<probBest){
      choice=best.act;
    } else {
      // случайный из остальных
      const other = scored.filter(s=>s.act!==best.act).map(s=>s.act);
      choice = other.length? other[Math.floor(Math.random()*other.length)] : best.act;
    }

    // Обновляем состояние
    if(choice==='shield'){
      state.usedShield++;
    }
    else if(typeof choice==='object'){
      state.usedAtk++;
      choice.dirs.forEach(d=>state.usedAtkDirs.add(d));
    }
    else {
      state.usedMove.add(choice);
      const [dx,dy]=DXY[choice];
      state.x+=dx; state.y+=dy;
    }

    plan.push(choice);
  }

  return plan;
}

function manh(x1,y1,x2,y2){ return Math.abs(x1-x2)+Math.abs(y1-y2); }