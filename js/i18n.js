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
      easyHint: 'Great for first games',
      mediumHint: 'Balanced offence and defence',
      hardHint: 'Faster enemies and more aggression',
      expertHint: 'Advanced bot combos ahead',
      insaneHint: 'Ultimate challenge for champions',
      createRoom: 'Create Room',
      joinRoom: 'Join',
      toMenu: 'Menu',
      roomCodePlaceholder: 'Room Code',
      resetScore: 'Reset score',
      settingsTooltip: 'Open settings',
      themeTooltip: 'Switch theme',
      settingsTitle: 'Settings',
      volume: 'Volume:',
      soundToggleLabel: 'Sound',
      soundToggleAria: 'Toggle sound',
      language: 'Language:',
      close: 'Close',
      tagline1: 'Welcome to neon battles!',
      tagline2: 'Dive into the cyberpunk arena!',
      tagline3: 'It\'s time for shining duels!',
      tagline4: 'Ready for a cyber battle?',
      deleteBtn: '\u2190 Delete',
      nextBtn: '\u25B6 Next',
      confirmBtn: '\u2713 Confirm moves',
      confirmPendingBtn: 'Waiting for opponent…',
      revealBtn: '\u25B6 Reveal round',
      executeBtn: '\u25B6 Execute',
      round: 'Round',
      plan: 'plan',
      turn: 'turn',
      ok: 'OK',
      cancel: 'Cancel',
      replay: 'Replay',
      saveReplay: 'Save replay',
      replaySaved: 'Replay saved!',
      replaySaveFailed: 'Unable to save replay.',
      saveVideo: 'Save video',
      roundReportTitle: 'Round analysis',
      roundReportButton: 'Round report',
      roundReportAutoLabel: 'Show automatically',
      roundReportEmpty: 'No actions recorded this round.',
      roundReportStep: 'Step {step}',
      roundReportMoved: 'Moved {dir} to {cell}',
      roundReportHeld: 'Held position at {cell}',
      roundReportAttack: 'Attacked {dirs}',
      roundReportShieldReady: 'Raised shield',
      roundReportShieldBlocked: 'Shield blocked attack from {player} at {cell}',
      roundReportDamageAttack: 'Defeated at {cell} by {player}',
      roundReportDamageCollapse: 'Eliminated by collapse at {cell}',
      roundReportEliminatedEarlier: 'Eliminated earlier',
      roundReportCenter: 'center',
      roundReportDirsJoin: ', ',
      roundReportDirsNone: 'no directions',
      dir_up: 'up',
      dir_down: 'down',
      dir_left: 'left',
      dir_right: 'right',
      opponent_left_room: 'Opponent left the room',
      create_new: 'Create new',
      offline: 'Offline',
      connecting: 'Connecting...',
      rejoin: 'Reconnected, rejoining...',
      onlineStatus: 'Online',
      connection_lost: 'Connection lost',
      reconnecting: 'Offline. Reconnecting...',
      serverUnavailable: 'Server unavailable',
      invalidRoomCode: 'Enter a valid 4-character room code',
      roomNotFound: 'Room not found or full',
      roomJoinTimeout: 'Join request timed out',
      roomCreateTimeout: 'Room creation timed out',
      waitingForOpponent: 'Waiting for opponent',
      movesAlreadyConfirmed: 'Moves already confirmed',
      mustSendFiveMoves: 'Must send exactly 5 moves',
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
      ,bothDieDraw: 'Both players died: draw.'
      ,exhaustedDraw: 'Exhausted \u2014 draw.'
      ,playerA_wins: 'Player A won!'
      ,playerB_wins: 'Player B won!'
      ,selectSpeed: 'Select speed'
      ,recordingNotSupported: 'Recording not supported'
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
      ,tutorial1: 'Welcome! Use arrows or buttons to move your unit.'
      ,tutorial2: 'Plan five actions including one attack and one shield.'
      ,tutorial3: 'Press Confirm to execute and win.'
      ,tutorialNextHint: 'Tap Next to continue through the guide.'
      ,tutorialStepLabel: 'Step {current} of {total}'
      ,tutorialPromptTitle: 'Learn the basics?'
      ,tutorialPromptBody: 'Would you like to follow the guided tutorial or skip it for now?'
      ,tutorialPromptStart: 'Start tutorial'
      ,tutorialPromptSkip: 'Skip for now'
      ,tutorialPromptNote: 'You can launch the tutorial later from the Rules menu.'
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
      easyHint: 'Подходит для первых игр',
      mediumHint: 'Баланс атаки и защиты',
      hardHint: 'Быстрые враги и агрессия',
      expertHint: 'Продвинутые комбинации бота',
      insaneHint: 'Максимальный вызов для чемпионов',
      createRoom: 'Создать комнату',
      joinRoom: 'Присоединиться',
      toMenu: 'В меню',
      roomCodePlaceholder: 'Код комнаты',
      resetScore: 'Сбросить счёт',
      settingsTooltip: 'Открыть настройки',
      themeTooltip: 'Переключить тему',
      settingsTitle: 'Настройки',
      volume: 'Громкость:',
      soundToggleLabel: 'Звук',
      soundToggleAria: 'Переключить звук',
      language: 'Язык:',
      close: 'Закрыть',
      tagline1: 'Добро пожаловать в неоновые битвы!',
      tagline2: 'Погрузись в киберпанк-арену!',
      tagline3: 'Время сияющих дуэлей!',
      tagline4: 'Готов к битве в стиле кибер?',
      deleteBtn: '\u2190 Удалить',
      nextBtn: '\u25B6 Далее',
      confirmBtn: 'Подтвердить ходы',
      confirmPendingBtn: 'Ожидаем соперника…',
      revealBtn: 'Показать ход',
      executeBtn: '\u25B6 Выполнить',
      round: 'Раунд',
      plan: 'план',
      turn: 'ход',
      ok: 'Ок',
      cancel: 'Отмена',
      replay: 'Повтор',
      saveReplay: 'Сохранить повтор',
      replaySaved: 'Повтор сохранён!',
      replaySaveFailed: 'Не удалось сохранить повтор.',
      saveVideo: 'Сохранить видео',
      roundReportTitle: 'Анализ раунда',
      roundReportButton: 'Анализ раунда',
      roundReportAutoLabel: 'Показывать автоматически',
      roundReportEmpty: 'В этом раунде не было действий.',
      roundReportStep: 'Шаг {step}',
      roundReportMoved: 'Переместился {dir} к {cell}',
      roundReportHeld: 'Остался на позиции {cell}',
      roundReportAttack: 'Атаковал: {dirs}',
      roundReportShieldReady: 'Поднял щит',
      roundReportShieldBlocked: 'Щит заблокировал атаку от {player} на {cell}',
      roundReportDamageAttack: 'Поражение на {cell} от {player}',
      roundReportDamageCollapse: 'Погиб из-за обвала на {cell}',
      roundReportEliminatedEarlier: 'Уничтожен ранее',
      roundReportCenter: 'центр',
      roundReportDirsJoin: ', ',
      roundReportDirsNone: 'без направлений',
      dir_up: 'вверх',
      dir_down: 'вниз',
      dir_left: 'влево',
      dir_right: 'вправо',
      opponent_left_room: 'Оппонент покинул комнату',
      create_new: 'Создать новую',
      offline: 'Оффлайн',
      connecting: 'Подключение...',
      rejoin: 'Переподключено, повторный вход...',
      onlineStatus: 'Онлайн',
      connection_lost: 'Соединение прервано',
      reconnecting: 'Оффлайн. Переподключение...',
      serverUnavailable: 'Сервер недоступен',
      invalidRoomCode: 'Введите корректный код из 4 символов',
      roomNotFound: 'Комната не найдена или уже занята',
      roomJoinTimeout: 'Не удалось подключиться: истекло время ожидания',
      roomCreateTimeout: 'Не удалось создать комнату: истекло время ожидания',
      waitingForOpponent: 'Ожидание соперника',
      movesAlreadyConfirmed: 'Ходы уже подтверждены',
      mustSendFiveMoves: 'Нужно отправить ровно 5 ходов',
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
      bothDieDraw: 'Смерть с обеих сторон: ничья.',
      exhaustedDraw: 'Изнурённые \u2014 ничья.',
      playerA_wins: 'Игрок A победил!',
      playerB_wins: 'Игрок B победил!',
      selectSpeed: 'Выберите скорость',
      recordingNotSupported: 'Запись не поддерживается',
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
      ,tutorial1: 'Добро пожаловать! Используйте стрелки или кнопки, чтобы сдвинуть юнита.'
      ,tutorial2: 'Запланируйте пять действий, включая атаку и щит.'
      ,tutorial3: 'Нажмите \u00abПодтвердить\u00bb, чтобы начать раунд.'
      ,tutorialNextHint: 'Нажмите \u00abДалее\u00bb, чтобы продолжить обучение.'
      ,tutorialStepLabel: '\u0428\u0430\u0433 {current} \u0438\u0437 {total}'
      ,tutorialPromptTitle: '\u041f\u0440\u043e\u0439\u0442\u0438 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435?'
      ,tutorialPromptBody: '\u0425\u043e\u0442\u0438\u0442\u0435 \u043f\u0440\u043e\u0439\u0442\u0438 \u043f\u043e\u0448\u0430\u0433\u043e\u0432\u043e\u0435 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435 \u0438\u043b\u0438 \u043f\u0440\u043e\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u0435\u0433\u043e \u0441\u0435\u0439\u0447\u0430\u0441?'
      ,tutorialPromptStart: '\u041d\u0430\u0447\u0430\u0442\u044c \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435'
      ,tutorialPromptSkip: '\u041f\u0440\u043e\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u043f\u043e\u043a\u0430'
      ,tutorialPromptNote: '\u041f\u043e\u0437\u0436\u0435 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435 \u043c\u043e\u0436\u043d\u043e \u043e\u0442\u043a\u0440\u044b\u0442\u044c \u0432 \u0440\u0430\u0437\u0434\u0435\u043b\u0435 \u00ab\u041f\u0440\u0430\u0432\u0438\u043b\u0430\u00bb.'
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
      easyHint: 'Підійде для перших ігор',
      mediumHint: 'Баланс атаки й захисту',
      hardHint: 'Швидші вороги та більше агресії',
      expertHint: 'Просунуті комбінації бота',
      insaneHint: 'Максимальний виклик для чемпіонів',
      createRoom: 'Створити кімнату',
      joinRoom: 'Приєднатися',
      toMenu: 'До меню',
      roomCodePlaceholder: 'Код кімнати',
      resetScore: 'Скинути рахунок',
      settingsTooltip: 'Відкрити налаштування',
      themeTooltip: 'Перемкнути тему',
      settingsTitle: 'Налаштування',
      volume: 'Гучність:',
      soundToggleLabel: 'Звук',
      soundToggleAria: 'Перемкнути звук',
      language: 'Мова:',
      close: 'Закрити',
      tagline1: 'Ласкаво просимо до неонових битв!',
      tagline2: 'Поринь у кіберпанк-арену!',
      tagline3: 'Час сяючих дуелей!',
      tagline4: 'Готовий до кібер битви?',
      deleteBtn: '\u2190 Видалити',
      nextBtn: '\u25B6 Далі',
      confirmBtn: 'Підтвердити ходи',
      confirmPendingBtn: 'Очікуємо суперника…',
      revealBtn: 'Показати хід',
      executeBtn: '\u25B6 Виконати',
      round: 'Раунд',
      plan: 'план',
      turn: 'хід',
      ok: 'Ок',
      cancel: 'Скасувати',
      replay: 'Повторити',
      saveReplay: 'Зберегти повтор',
      replaySaved: 'Повтор збережено!',
      replaySaveFailed: 'Не вдалося зберегти повтор.',
      saveVideo: 'Зберегти відео',
      roundReportTitle: 'Аналіз раунду',
      roundReportButton: 'Аналіз раунду',
      roundReportAutoLabel: 'Показувати автоматично',
      roundReportEmpty: 'У цьому раунді не було дій.',
      roundReportStep: 'Крок {step}',
      roundReportMoved: 'Пересунувся {dir} до {cell}',
      roundReportHeld: 'Залишився на позиції {cell}',
      roundReportAttack: 'Атакував: {dirs}',
      roundReportShieldReady: 'Підняв щит',
      roundReportShieldBlocked: 'Щит зупинив атаку від {player} на {cell}',
      roundReportDamageAttack: 'Поразка на {cell} від {player}',
      roundReportDamageCollapse: 'Знищено обвалом на {cell}',
      roundReportEliminatedEarlier: 'Знищено раніше',
      roundReportCenter: 'центр',
      roundReportDirsJoin: ', ',
      roundReportDirsNone: 'без напрямів',
      dir_up: 'вгору',
      dir_down: 'вниз',
      dir_left: 'вліво',
      dir_right: 'вправо',
      opponent_left_room: 'Опонент покинув кімнату',
      create_new: 'Створити нову',
      offline: 'Офлайн',
      connecting: 'Підключення...',
      rejoin: 'Перепідключено, повторний вхід...',
      onlineStatus: 'Онлайн',
      connection_lost: 'З\u2019єднання перервано',
      reconnecting: 'Офлайн. Перепідключення...',
      serverUnavailable: 'Сервер недоступний',
      invalidRoomCode: 'Введіть коректний код із 4 символів',
      roomNotFound: 'Кімната не знайдена або вже зайнята',
      roomJoinTimeout: 'Не вдалося підключитися: час очікування минув',
      roomCreateTimeout: 'Не вдалося створити кімнату: час очікування минув',
      waitingForOpponent: 'Очікування суперника',
      movesAlreadyConfirmed: 'Ходи вже підтверджено',
      mustSendFiveMoves: 'Потрібно надіслати рівно 5 ходів',
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
      bothDieDraw: 'Смерть обох гравців: нічия.',
      exhaustedDraw: 'Виснаження \u2014 нічия.',
      playerA_wins: 'Гравець A переміг!',
      playerB_wins: 'Гравець B переміг!',
      selectSpeed: 'Виберіть швидкість',
      recordingNotSupported: 'Запис не підтримується',
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
      ,tutorial1: '\u041b\u0430\u0441\u043a\u0430\u0432\u043e \u043f\u0440\u043e\u0441\u0438\u043c\u043e! \u0412\u0438\u043a\u043e\u0440\u0438\u0441\u0442\u043e\u0432\u0443\u0439\u0442\u0435 \u0441\u0442\u0440\u0456\u043b\u043a\u0438 \u0430\u0431\u043e \u043a\u043d\u043e\u043f\u043a\u0438, \u0449\u043e\u0431 \u043f\u0435\u0440\u0435\u0441\u0443\u043d\u0443\u0442\u0438 \u0431\u043e\u0439\u0446\u044f.'
      ,tutorial2: '\u0417\u0430\u043f\u043b\u0430\u043d\u0443\u0439\u0442\u0435 \u043f\u2019\u044f\u0442\u044c \u0434\u0456\u0439, \u0432\u043a\u043b\u044e\u0447\u043d\u043e \u0437 \u0430\u0442\u0430\u043a\u043e\u044e \u0442\u0430 \u0449\u0438\u0442\u043e\u043c.'
      ,tutorial3: '\u041d\u0430\u0442\u0438\u0441\u043d\u0456\u0442\u044c \u00ab\u041f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0438\u00bb, \u0449\u043e\u0431 \u0440\u043e\u0437\u043f\u043e\u0447\u0430\u0442\u0438 \u0440\u0430\u0443\u043d\u0434.'
      ,tutorialNextHint: '\u041d\u0430\u0442\u0438\u0441\u043d\u0456\u0442\u044c \u00ab\u0414\u0430\u043b\u0456\u00bb, \u0449\u043e\u0431 \u043f\u0440\u043e\u0434\u043e\u0432\u0436\u0438\u0442\u0438 \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u044f.'
      ,tutorialStepLabel: '\u041a\u0440\u043e\u043a {current} \u0437 {total}'
      ,tutorialPromptTitle: '\u041f\u0440\u043e\u0439\u0442\u0438 \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u044f?'
      ,tutorialPromptBody: '\u0411\u0430\u0436\u0430\u0454\u0442\u0435 \u043f\u0440\u043e\u0439\u0442\u0438 \u043f\u043e\u043a\u0440\u043e\u043a\u043e\u0432\u0438\u0439 \u0442\u0443\u0442\u043e\u0440\u0456\u0430\u043b \u0447\u0438 \u043f\u0440\u043e\u043f\u0443\u0441\u0442\u0438\u0442\u0438 \u0439\u043e\u0433\u043e \u0437\u0430\u0440\u0430\u0437?'
      ,tutorialPromptStart: '\u0420\u043e\u0437\u043f\u043e\u0447\u0430\u0442\u0438 \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u044f'
      ,tutorialPromptSkip: '\u041f\u0440\u043e\u043f\u0443\u0441\u0442\u0438\u0442\u0438'
      ,tutorialPromptNote: '\u041f\u043e\u0432\u0435\u0440\u043d\u0443\u0442\u0438\u0441\u044c \u0434\u043e \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u044f \u043c\u043e\u0436\u043d\u0430 \u0437\u0433\u043e\u0434\u043e\u043c \u0447\u0435\u0440\u0435\u0437 \u043c\u0435\u043d\u044e \u00ab\u041f\u0440\u0430\u0432\u0438\u043b\u0430\u00bb.'
    }
  };

  let currentLang = 'en';
  const storedLang = localStorage.getItem('language');
  if (storedLang && translations[storedLang]) {
    currentLang = storedLang;
  }

  document.documentElement.lang = currentLang;
  if (document.body) {
    document.body.classList.add('lang-' + currentLang);
  }

  function t(key, params) {
    let str = (translations[currentLang] && translations[currentLang][key])
      ?? (translations.en && translations.en[key])
      ?? key;
    if (params && typeof str === 'string') {
      Object.keys(params).forEach(param => {
        const value = params[param];
        str = str.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
      });
    }
    return str;
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
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = t(key);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', t(key));
    });
    if (typeof window.refreshRoundReport === 'function') {
      window.refreshRoundReport();
    }
  }

  function setLang(lang) {
    if (translations[lang]) {
      currentLang = lang;
      document.documentElement.lang = lang;
      if (document.body) {
        Object.keys(translations).forEach(l => document.body.classList.remove('lang-' + l));
        document.body.classList.add('lang-' + lang);
      }
      applyTranslations();
    }
  }

  window.t = t;
  window.i18n = { t, setLang, applyTranslations, translations, get lang() { return currentLang; } };
})();
