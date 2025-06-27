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
      confirm: 'Confirm',
      deleteBtn: '\u2190 Delete',
      nextBtn: '\u25B6 Next',
      executeBtn: '\u25B6 Execute',
      round: 'Round',
      plan: 'plan',
      turn: 'turn',
      ok: 'OK',
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
    },
    ru: {
      singlePlayer: '1 игрок',
      rules: 'Правила',
      twoPlayers: '2 игрока',
      online: 'Онлайн',
      easy: 'Легко',
      medium: 'Средне',
      hard: 'Сложно',
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
      confirm: 'Подтвердить',
      deleteBtn: '\u2190 Удалить',
      nextBtn: '\u25B6 Далее',
      executeBtn: '\u25B6 Выполнить',
      round: 'Раунд',
      plan: 'план',
      turn: 'ход',
      ok: 'Ок',
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
      room_closed_inactivity: 'Комната закрыта из-за неактивности'
    },
    uk: {
      singlePlayer: '1 гравець',
      rules: 'Правила',
      twoPlayers: '2 гравці',
      online: 'Онлайн',
      easy: 'Легко',
      medium: 'Середньо',
      hard: 'Важко',
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
      confirm: 'Підтвердити',
      deleteBtn: '\u2190 Видалити',
      nextBtn: '\u25B6 Далі',
      executeBtn: '\u25B6 Виконати',
      round: 'Раунд',
      plan: 'план',
      turn: 'хід',
      ok: 'Ок',
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
      room_closed_inactivity: 'Кімната закрита через неактивність'
    }
  };

  let currentLang = 'en';

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
