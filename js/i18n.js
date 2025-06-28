(() => {
  const translations = {
    en: {
      singlePlayer: '1 Player',
      rules: 'Rules',
      twoPlayers: '2 Players',
      online: 'Online',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      expert: 'Expert',
      insane: 'Insane',
      createRoom: 'Create Room',
      joinRoom: 'Join',
      toMenu: 'Menu',
      roomCodePlaceholder: 'Room Code',
      resetScore: 'Reset score',
      volume: 'Volume:',
      language: 'Language:',
      close: 'Close',
      tagline1: 'Welcome to neon battles!',
      tagline2: 'Dive into the cyberpunk arena!',
      tagline3: 'It\'s time for shining duels!',
      tagline4: 'Ready for a cyber battle?',
      deleteBtn: '\u2190 Delete',
      nextBtn: '\u25B6 Next',
      executeBtn: '\u25B6 Execute',
      round: 'Round',
      plan: 'plan',
      turn: 'turn',
      ok: 'OK',
      cancel: 'Cancel',
      replay: 'Replay',
      saveVideo: 'Save video',
      opponent_left_room: 'Opponent left the room',
      create_new: 'Create new',
      offline: 'Offline',
      connecting: 'Connecting...',
      rejoin: 'Reconnected, rejoining...',
      onlineStatus: 'Online',
      connection_lost: 'Connection lost',
      reconnecting: 'Offline. Reconnecting...',
      room: 'Room',
      playerA: 'Player A',
      playerB: 'Player B',
      confirmed: 'confirmed moves',
      both_confirmed: 'Both players confirmed moves, playback starting',
      round_start: 'Round start',
      need_five_moves: 'Select exactly 5 moves',
      server_no_round: "Server didn't start round, check connection",
      ws_not_connected: 'WebSocket not connected yet',
      state_ok: 'Moves match',
      state_mismatch: 'State mismatch',
      room_closed_inactivity: 'Room closed due to inactivity'
      ,rulesHeader: 'Game Concept and Rules'
      ,rulesGeneral: 'Overview'
      ,rulesIntro: 'This is a turn-based 5\u00d75 PvP arena for two players. Up to three rounds are played. If nobody wins, sudden death starts on the central 3\u00d73 grid.'
      ,rule1: 'Each round players pre-plan five actions.'
      ,rule2: 'Available actions are movement, one attack and one shield per round.'
      ,rule3: 'An attack selects directions and hits your cell and chosen neighbours.'
      ,rule4: 'The shield negates all damage for that step.'
      ,rule5: 'After planning, actions execute in order for both players simultaneously.'
      ,rule6: 'A player dies if struck by an attack or when stepping on collapsed cells.'
      ,rule7: 'After three rounds the outer ring collapses leaving a 3\u00d73 arena.'
      ,rule8: 'If there is no winner after the last round, the match ends in a draw.'
      ,tutorial: 'Tutorial'
      ,tutorial1: 'Welcome! Use arrows or buttons to move.'
      ,tutorial2: 'Plan five actions including one attack and one shield.'
      ,tutorial3: 'Press Confirm to execute and win.'
    },
    ru: {
      singlePlayer: '1 игрок',
      rules: 'Правила',
      twoPlayers: '2 игрока',
      online: 'Онлайн',
      easy: 'Легко',
      medium: 'Средне',
      hard: 'Сложно',
      expert: 'Эксперт',
      insane: 'Безумие',
      createRoom: 'Создать комнату',
      joinRoom: 'Присоединиться',
      toMenu: 'В меню',
      roomCodePlaceholder: 'Код комнаты',
      resetScore: 'Сбросить счёт',
      volume: 'Громкость:',
      language: 'Язык:',
      close: 'Закрыть',
      tagline1: 'Добро пожаловать в неоновые битвы!',
      tagline2: 'Погрузись в киберпанк-арену!',
      tagline3: 'Время сияющих дуэлей!',
      tagline4: 'Готов к битве в стиле кибер?',
      deleteBtn: '\u2190 Удалить',
      nextBtn: '\u25B6 Далее',
      executeBtn: '\u25B6 Выполнить',
      round: 'Раунд',
      plan: 'план',
      turn: 'ход',
      ok: 'Ок',
      cancel: 'Отмена',
      replay: 'Повтор',
      saveVideo: 'Сохранить видео',
      opponent_left_room: 'Оппонент покинул комнату',
      create_new: 'Создать новую',
      offline: 'Оффлайн',
      connecting: 'Подключение...',
      rejoin: 'Переподключено, повторный вход...',
      onlineStatus: 'Онлайн',
      connection_lost: 'Соединение прервано',
      reconnecting: 'Оффлайн. Переподключение...',
      room: 'Комната',
      playerA: 'Игрок A',
      playerB: 'Игрок B',
      confirmed: 'подтвердил ходы',
      both_confirmed: 'Оба игрока подтвердили ходы, начинается просмотр',
      round_start: 'Начало раунда',
      need_five_moves: 'Нужно выбрать ровно 5 ходов',
      server_no_round: 'сервер не начал раунд, перепроверьте соединение',
      ws_not_connected: 'WebSocket ещё не подключён',
      state_ok: 'Ходы совпадают',
      state_mismatch: 'Несовпадение состояний',
      room_closed_inactivity: 'Комната закрыта из-за неактивности',
      rulesHeader: 'Концепция и правила игры',
      rulesGeneral: 'Общее',
      rulesIntro: 'Это пошаговая PvP-арена 5\u00d75 для двух игроков. Игра идёт три раунда, затем в отсутствие победителя начинается \u00abвнезапная смерть\u00bb в центре 3\u00d73.',
      rule1: 'Каждый раунд игроки заранее выбирают пять действий.',
      rule2: 'В распоряжении перемещения, одна атака и один щит за раунд.',
      rule3: 'Атака задаёт направления и поражает текущую и соседние клетки.',
      rule4: 'Щит блокирует урон выбранного хода.',
      rule5: 'После планирования действия выполняются по порядку одновременно.',
      rule6: 'Игрок погибает от атаки или наступив на провалившуюся клетку.',
      rule7: 'После трёх раундов края поля разрушаются, остаётся зона 3\u00d73.',
      rule8: 'Если победителя нет после финала, объявляется ничья.'
      ,tutorial: 'Обучение'
      ,tutorial1: 'Добро пожаловать! Используйте стрелки или кнопки для движения.'
      ,tutorial2: 'Запланируйте пять действий, включая атаку и щит.'
      ,tutorial3: 'Нажмите \u00abПодтвердить\u00bb, чтобы начать раунд.'
    },
    uk: {
      singlePlayer: '1 гравець',
      rules: 'Правила',
      twoPlayers: '2 гравці',
      online: 'Онлайн',
      easy: 'Легко',
      medium: 'Середньо',
      hard: 'Важко',
      expert: 'Експерт',
      insane: 'Божевілля',
      createRoom: 'Створити кімнату',
      joinRoom: 'Приєднатися',
      toMenu: 'До меню',
      roomCodePlaceholder: 'Код кімнати',
      resetScore: 'Скинути рахунок',
      volume: 'Гучність:',
      language: 'Мова:',
      close: 'Закрити',
      tagline1: 'Ласкаво просимо до неонових битв!',
      tagline2: 'Поринь у кіберпанк-арену!',
      tagline3: 'Час сяючих дуелей!',
      tagline4: 'Готовий до кібер битви?',
      deleteBtn: '\u2190 Видалити',
      nextBtn: '\u25B6 Далі',
      executeBtn: '\u25B6 Виконати',
      round: 'Раунд',
      plan: 'план',
      turn: 'хід',
      ok: 'Ок',
      cancel: 'Скасувати',
      replay: 'Повторити',
      saveVideo: 'Зберегти відео',
      opponent_left_room: 'Опонент покинув кімнату',
      create_new: 'Створити нову',
      offline: 'Офлайн',
      connecting: 'Підключення...',
      rejoin: 'Перепідключено, повторний вхід...',
      onlineStatus: 'Онлайн',
      connection_lost: 'З\u2019єднання перервано',
      reconnecting: 'Офлайн. Перепідключення...',
      room: 'Кімната',
      playerA: 'Гравець A',
      playerB: 'Гравець B',
      confirmed: 'підтвердив ходи',
      both_confirmed: 'Обидва гравці підтвердили ходи, починаємо перегляд',
      round_start: 'Початок раунду',
      need_five_moves: 'Потрібно вибрати рівно 5 ходів',
      server_no_round: 'сервер не почав раунд, перевірте з\u2019єднання',
      ws_not_connected: 'WebSocket ще не підключений',
      state_ok: 'Ходи збігаються',
      state_mismatch: 'Неспівпадіння станів',
      room_closed_inactivity: 'Кімната закрита через неактивність',
      rulesHeader: 'Концепція та правила гри',
      rulesGeneral: 'Загальне',
      rulesIntro: 'Це покрокова PvP-арена 5\u00d75 для двох гравців. Після трьох раундів за відсутності переможця починається \u00abраптова смерть\u00bb у центрі 3\u00d73.',
      rule1: 'Щоразу гравці заздалегідь планують п\u2019ять дій.',
      rule2: 'Доступні переміщення, одна атака та один щит за раунд.',
      rule3: 'Атака вибирає напрямки та вражає поточну й сусідні клітини.',
      rule4: 'Щит блокує весь урон цього кроку.',
      rule5: 'Після планування дії виконуються послідовно одночасно у обох гравців.',
      rule6: 'Гравець гине від атаки або ступивши на зруйновану клітину.',
      rule7: 'Після трьох раундів зовнішнє кільце зникає, залишається арена 3\u00d73.',
      rule8: 'Якщо переможця немає після фінального раунду, оголошується нічия.'
      ,tutorial: 'Навчання'
      ,tutorial1: 'Ласкаво просимо! Використовуйте стрілки або кнопки для руху.'
      ,tutorial2: 'Заплануйте п\u2019ять дій, включаючи атаку та щит.'
      ,tutorial3: 'Натисніть \u00abПідтвердити\u00bb, щоб розпочати раунд.'
    }
  };

  let currentLang = 'en';
  const storedLang = localStorage.getItem('language');
  if (storedLang && translations[storedLang]) {
    currentLang = storedLang;
  }

  function t(key) {
    return translations[currentLang][key] || translations.en[key] || key;
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (el.hasAttribute('data-i18n-placeholder')) {
        el.placeholder = t(key);
      } else {
        el.textContent = t(key);
      }
    });
  }

  function setLang(lang) {
    if (translations[lang]) {
      currentLang = lang;
      applyTranslations();
    }
  }

  window.t = t;
  window.i18n = { t, setLang, applyTranslations, translations, get lang() { return currentLang; } };
})();
