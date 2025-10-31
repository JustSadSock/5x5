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
      copyRoomCode: 'Copy code',
      copySuccess: 'Room code copied!',
      copyFail: 'Could not copy code',
      pasteRoomCode: 'Paste code',
      pasteSuccess: 'Inserted code {code}',
      pasteFail: 'Could not paste code.',
      copyUnavailable: 'Create a room to copy its code',
      roomCodeHint: 'Share the code with a friend or enter one to connect.',
      onlineLobbyTitle: 'Online duel',
      onlineLobbySubtitle: 'Host a room or join with a code to challenge a friend.',
      onlineCreateTitle: 'Host a room',
      onlineCreateDescription: 'Generate a code, share it, and wait for your friend to connect.',
      onlineJoinTitle: 'Join a room',
      onlineJoinDescription: 'Paste or enter a code to jump straight into the match.',
      resetScore: 'Reset score',
      settingsTooltip: 'Open settings',
      hudMenu: 'Open HUD menu',
      themeTooltip: 'Switch theme',
      settingsTitle: 'Settings',
      volume: 'Volume:',
      soundToggleLabel: 'Sound',
      soundToggleAria: 'Toggle sound',
      themeLabel: 'Theme:',
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
      phasePlanning: 'Planning: {player}',
      phaseExecuting: 'Execution: step {step}',
      roundShort: 'Round',
      ok: 'OK',
      playAgain: 'Play again',
      cancel: 'Cancel',
      replay: 'Replay',
      saveReplay: 'Save replay',
      replaySaved: 'Replay saved!',
      replaySaveFailed: 'Unable to save replay.',
      saveVideo: 'Save video',
      playbackSpeed: 'Playback speed',
      pauseReplay: 'Pause replay',
      resumeReplay: 'Resume replay',
      dir_up: 'up',
      dir_down: 'down',
      dir_left: 'left',
      dir_right: 'right',
      opponent_left_room: 'Opponent left the room',
      create_new: 'Create new',
      offline: 'Offline',
      connecting: 'Connecting...',
      checkingConnection: 'Checking server...',
      rejoin: 'Reconnected, rejoining...',
      onlineStatus: 'Online',
      connectedToast: 'Connected to server',
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
      roomCreatedToast: 'Room {code} ready to share',
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
      ,rulesIntro: 'This is a turn-based 5\u00d75 PvP arena for two players. After three rounds, sudden death starts on the central 3\u00d73 grid if nobody wins.'
      ,rule1: 'Each round players pre-plan five steps.'
      ,rule2: 'You can spend each round on movement, one attack, and one shield.'
      ,rule3: 'An attack needs a direction and hits your cell plus the beam of cells ahead.'
      ,rule3b: 'You can queue multiple attacks in different directions—each one consumes its own step.'
      ,rule4: "You can't move and attack in the same direction within a single round\u2014pick a different lane for the strike."
      ,rule5: 'The shield negates all damage for the chosen step.'
      ,rule6: 'After planning, actions resolve in order for both players simultaneously.'
      ,rule7: 'Taking a hit or stepping onto a collapsed tile knocks you out.'
      ,rule8: 'After three rounds the outer ring falls away, leaving a 3\u00d73 arena.'
      ,rule9: 'If sudden death ends without a winner, the match is declared a draw.'
      ,tutorial: 'Tutorial'
      ,tutorialIntro: 'Welcome! This glowing grid is your arena. Your marble starts on the left and the rival on the right.'
      ,tutorialIntroHint: 'Follow the highlighted area to see what to tap next.'
      ,tutorialGoal: 'Each round you plan five actions to outsmart your opponent.'
      ,tutorialGoalHint: 'The top bar shows the score and opens settings or the menu.'
      ,tutorialMovePrompt: 'Let’s queue your first move. Press the highlighted arrow to step one tile.'
      ,tutorialMoveHint: 'Tap the glowing arrow button to add a move to the plan list.'
      ,tutorialPlanPrompt: 'Great! Each square below fills with the actions you choose.'
      ,tutorialPlanHint: 'Fill all five steps—one attack and one shield per round.'
      ,tutorialDirectionRule: 'Keep actions balanced.'
      ,tutorialDirectionRuleHint: 'Within a round, you can’t move and attack in the same direction. Choose different arrows for each.'
      ,tutorialAttackPrompt: 'Time to prepare an attack. Tap the sword to enter attack mode.'
      ,tutorialAttackHint: 'Attack mode lets you pick the direction your strike will go.'
      ,tutorialAttackDirPrompt: 'Choose the red arrow to aim your strike—you can tap several—then confirm it.'
      ,tutorialAttackDirHint: 'Select one or several directions—each extra strike takes another step—then press confirm.'
      ,tutorialShieldPrompt: 'Now queue a shield to keep your marble safe.'
      ,tutorialShieldHint: 'Press the shield once to place it in your plan.'
      ,tutorialConfirmPrompt: 'All set! Start the round to watch your plan unfold.'
      ,tutorialConfirmHint: 'When all five steps are filled, press the confirm button.'
      ,tutorialWrap: 'Awesome! The round plays automatically, and you can replay or save it afterwards.'
      ,tutorialWrapHint: 'Check the menu anytime for rules or to run the tutorial again.'
      ,tutorialPracticeHint: 'Give it a go using the highlighted control.'
      ,tutorialTryButton: 'Let me try'
      ,tutorialFinish: 'Finish tutorial'
      ,tutorialNextHint: 'Tap Next to continue through the guide.'
      ,tutorialStepLabel: 'Step {current} of {total}'
      ,tutorialPromptTitle: 'First time here?'
      ,tutorialPromptBody: 'Looks like this is your first visit. Want us to guide you through the tutorial?'
      ,tutorialPromptStart: 'Yes, teach me'
      ,tutorialPromptSkip: 'Not now'
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
      copyRoomCode: 'Скопировать код',
      copySuccess: 'Код комнаты скопирован!',
      copyFail: 'Не удалось скопировать код',
      pasteRoomCode: 'Вставить код',
      pasteSuccess: 'Код {code} вставлен',
      pasteFail: 'Не удалось вставить код.',
      copyUnavailable: 'Сначала создайте комнату',
      roomCodeHint: 'Поделитесь кодом с другом или введите его, чтобы подключиться.',
      onlineLobbyTitle: 'Онлайн-дуэль',
      onlineLobbySubtitle: 'Создайте комнату или присоединитесь по коду, чтобы сыграть с другом.',
      onlineCreateTitle: 'Создать комнату',
      onlineCreateDescription: 'Сгенерируйте код, поделитесь им и дождитесь подключения соперника.',
      onlineJoinTitle: 'Присоединиться к комнате',
      onlineJoinDescription: 'Вставьте или введите код, чтобы сразу войти в матч.',
      resetScore: 'Сбросить счёт',
      settingsTooltip: 'Открыть настройки',
      hudMenu: 'Открыть меню',
      themeTooltip: 'Переключить тему',
      settingsTitle: 'Настройки',
      volume: 'Громкость:',
      soundToggleLabel: 'Звук',
      soundToggleAria: 'Переключить звук',
      themeLabel: 'Тема:',
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
      playAgain: 'Сыграть ещё',
      cancel: 'Отмена',
      replay: 'Повтор',
      saveReplay: 'Сохранить повтор',
      replaySaved: 'Повтор сохранён!',
      replaySaveFailed: 'Не удалось сохранить повтор.',
      saveVideo: 'Сохранить видео',
      playbackSpeed: 'Скорость воспроизведения',
      pauseReplay: 'Пауза повтора',
      resumeReplay: 'Возобновить повтор',
      dir_up: 'вверх',
      dir_down: 'вниз',
      dir_left: 'влево',
      dir_right: 'вправо',
      opponent_left_room: 'Оппонент покинул комнату',
      create_new: 'Создать новую',
      offline: 'Оффлайн',
      connecting: 'Подключение...',
      checkingConnection: 'Проверяем сервер...',
      rejoin: 'Переподключено, повторный вход...',
      onlineStatus: 'Онлайн',
      connectedToast: 'Соединение с сервером установлено',
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
      roomCreatedToast: 'Комната {code} готова к приглашению',
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
      rulesIntro: 'Это пошаговая PvP-арена 5\u00d75 для двух игроков. После трёх раундов без победителя начинается \u00abвнезапная смерть\u00bb в центре 3\u00d73.',
      rule1: 'Каждый раунд игроки заранее выбирают пять шагов.',
      rule2: 'За раунд можно сделать перемещения, одну атаку и один щит.',
      rule3: 'Атака требует направления и поражает текущую клетку и клетки вдоль луча.',
      rule3b: 'Можно добавить несколько атак в разных направлениях — каждая занимает отдельный шаг плана.',
      rule4: 'В одном раунде нельзя и двигаться, и атаковать в одну сторону \u2014 направление атаки должно отличаться.',
      rule5: 'Щит поглощает весь урон выбранного шага.',
      rule6: 'После планирования действия выполняются по порядку одновременно.',
      rule7: 'Игрок проигрывает от удара или наступив на разрушенную клетку.',
      rule8: 'Через три раунда внешнее кольцо поля разрушается, остаётся зона 3\u00d73.',
      rule9: '\u0415\u0441\u043b\u0438 \u043f\u043e\u0431\u0435\u0434\u0438\u0442\u0435\u043b\u044f \u043d\u0435\u0442 \u0434\u0430\u0436\u0435 \u043f\u043e\u0441\u043b\u0435 \u00ab\u0432\u043d\u0435\u0437\u0430\u043f\u043d\u043e\u0439 \u0441\u043c\u0435\u0440\u0442\u0438\u00bb, \u0437\u0430\u0441\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u043d\u0438\u0447\u044c\u044f.'
      ,tutorial: 'Обучение'
      ,tutorialIntro: 'Привет! Это поле 5\u00d75. Твой шарик слева, соперник справа.'
      ,tutorialIntroHint: 'Мы подсветим каждую кнопку, на которую нужно нажать.'
      ,tutorialGoal: 'В каждом раунде ты заранее выбираешь пять действий, чтобы перехитрить соперника.'
      ,tutorialGoalHint: 'Верхняя панель показывает счёт и даёт путь в меню и настройки.'
      ,tutorialMovePrompt: 'Сделаем первый шаг. Нажми подсвечённую стрелку, чтобы сдвинуться на одну клетку.'
      ,tutorialMoveHint: 'Нажми светящуюся стрелку — в списке ходов появится шаг.'
      ,tutorialPlanPrompt: 'Отлично! Клеточки плана снизу показывают твои будущие действия.'
      ,tutorialPlanHint: 'Заполни пять шагов — не забудь про атаку и щит.'
      ,tutorialDirectionRule: 'Следи за направлениями.'
      ,tutorialDirectionRuleHint: 'В одном раунде нельзя атаковать и двигаться в одном направлении. Выбирай разные стрелки.'
      ,tutorialAttackPrompt: 'Теперь готовим атаку. Коснись меча, чтобы включить режим атаки.'
      ,tutorialAttackHint: 'В режиме атаки выбираем направление удара.'
      ,tutorialAttackDirPrompt: 'Жми красные стрелки, чтобы выбрать направление (можно несколько), затем подтверди.'
      ,tutorialAttackDirHint: 'Выбери одно или несколько направлений — каждое займёт свой шаг — и нажми подтверждение.'
      ,tutorialShieldPrompt: 'Поставим защиту. Нажми щит, чтобы добавить его в план.'
      ,tutorialShieldHint: 'Одно нажатие — и ход со щитом появится в списке.'
      ,tutorialConfirmPrompt: 'Готово! Запусти раунд и посмотри, как выполняется план.'
      ,tutorialConfirmHint: 'Когда все пять шагов готовы, нажимай кнопку подтверждения.'
      ,tutorialWrap: 'Здорово! Раунд выполнится сам, а потом можно посмотреть или сохранить повтор.'
      ,tutorialWrapHint: 'В меню найдёшь правила и сможешь пройти обучение снова.'
      ,tutorialPracticeHint: 'Сделай действие на подсвеченной кнопке.'
      ,tutorialTryButton: 'Попробовать'
      ,tutorialFinish: 'Завершить обучение'
      ,tutorialNextHint: 'Нажмите \u00abДалее\u00bb, чтобы продолжить обучение.'
      ,tutorialStepLabel: '\u0428\u0430\u0433 {current} \u0438\u0437 {total}'
      ,tutorialPromptTitle: '\u0412\u043f\u0435\u0440\u0432\u044b\u0435 \u0443 \u043d\u0430\u0441?'
      ,tutorialPromptBody: '\u0412\u0438\u0434\u0438\u043c, \u0447\u0442\u043e \u0432\u044b \u0432\u043f\u0435\u0440\u0432\u044b\u0435 \u0437\u0430\u0448\u043b\u0438 \u043d\u0430 \u0441\u0430\u0439\u0442. \u041d\u0435 \u0436\u0435\u043b\u0430\u0435\u0442\u0435 \u043f\u0440\u043e\u0439\u0442\u0438 \u043e\u0431\u0443\u0447\u0435\u043d\u0438\u0435?'
      ,tutorialPromptStart: '\u0416\u0435\u043b\u0430\u044e'
      ,tutorialPromptSkip: '\u041d\u0435\u0442'
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
      copyRoomCode: 'Скопіювати код',
      copySuccess: 'Код кімнати скопійовано!',
      copyFail: 'Не вдалося скопіювати код',
      pasteRoomCode: 'Вставити код',
      pasteSuccess: 'Код {code} вставлено',
      pasteFail: 'Не вдалося вставити код.',
      copyUnavailable: 'Спершу створіть кімнату',
      roomCodeHint: 'Поділіться кодом із другом або введіть його, щоб підключитися.',
      onlineLobbyTitle: 'Онлайн-двобій',
      onlineLobbySubtitle: 'Створіть кімнату або приєднайтесь за кодом, щоб зіграти з другом.',
      onlineCreateTitle: 'Створити кімнату',
      onlineCreateDescription: 'Згенеруйте код, поділіться ним і дочекайтесь підключення суперника.',
      onlineJoinTitle: 'Приєднатись до кімнати',
      onlineJoinDescription: 'Вставте або введіть код, щоб одразу увійти в матч.',
      resetScore: 'Скинути рахунок',
      settingsTooltip: 'Відкрити налаштування',
      hudMenu: 'Відкрити меню',
      themeTooltip: 'Перемкнути тему',
      settingsTitle: 'Налаштування',
      volume: 'Гучність:',
      soundToggleLabel: 'Звук',
      soundToggleAria: 'Перемкнути звук',
      themeLabel: 'Тема:',
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
      playAgain: 'Зіграти ще',
      cancel: 'Скасувати',
      replay: 'Повторити',
      saveReplay: 'Зберегти повтор',
      replaySaved: 'Повтор збережено!',
      replaySaveFailed: 'Не вдалося зберегти повтор.',
      saveVideo: 'Зберегти відео',
      playbackSpeed: 'Швидкість відтворення',
      pauseReplay: 'Призупинити повтор',
      resumeReplay: 'Продовжити повтор',
      dir_up: 'вгору',
      dir_down: 'вниз',
      dir_left: 'вліво',
      dir_right: 'вправо',
      opponent_left_room: 'Опонент покинув кімнату',
      create_new: 'Створити нову',
      offline: 'Офлайн',
      connecting: 'Підключення...',
      checkingConnection: 'Перевіряємо сервер...',
      rejoin: 'Перепідключено, повторний вхід...',
      onlineStatus: 'Онлайн',
      connectedToast: 'З\u2019єднання з сервером встановлено',
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
      roomCreatedToast: 'Кімната {code} готова до запрошень',
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
      rulesIntro: 'Це покрокова PvP-арена 5\u00d75 для двох гравців. Після трьох раундів без переможця починається \u00abраптова смерть\u00bb у центрі 3\u00d73.',
      rule1: 'Щоразу гравці заздалегідь планують п\u2019ять ходів.',
      rule2: 'За раунд доступні пересування, одна атака та один щит.',
      rule3: 'Атака потребує напрямку й б\u2019є по вашій клітинці та клітинах уздовж променя.',
      rule3b: 'Можна додати кілька атак у різні боки — кожна займає окремий крок плану.',
      rule4: 'В одному раунді не можна іти та атакувати в один бік \u2014 напрямок атаки має бути іншим.',
      rule5: 'Щит поглинає будь-яку шкоду на вибраному кроці.',
      rule6: 'Після планування дії виконуються послідовно й одночасно для обох гравців.',
      rule7: 'Поразка настає від удару або падіння на зруйновану клітинку.',
      rule8: 'Після трьох раундів зовнішнє кільце поля обвалюється, лишається арена 3\u00d73.',
      rule9: 'Якщо навіть після \u00abраптової смерті\u00bb переможця немає, фіксується нічия.'
      ,tutorial: 'Навчання'
      ,tutorialIntro: '\u0412\u0456\u0442\u0430\u044e! \u0426\u0435 \u043f\u043e\u043b\u0435 5\u00d75. \u0422\u0432\u043e\u044f \u043a\u0443\u043b\u044c\u043a\u0430 \u043b\u0456\u0432\u043e\u0440\u0443\u0447, \u0441\u0443\u043f\u0435\u0440\u043d\u0438\u043a\u0430 \u2014 \u043f\u0440\u0430\u0432\u043e\u0440\u0443\u0447.'
      ,tutorialIntroHint: '\u041c\u0438 \u043f\u0456\u0434\u0441\u0432\u0456\u0442\u0438\u043c\u043e \u043a\u043e\u0436\u0435\u043d \u043f\u043e\u0442\u0440\u0456\u0431\u043d\u0438\u0439 \u0435\u043b\u0435\u043c\u0435\u043d\u0442.'
      ,tutorialGoal: '\u0429\u043e\u0440\u0430\u0437\u0443 \u0442\u0438 \u043f\u043b\u0430\u043d\u0443\u0454\u0448 \u043f\u2019\u044f\u0442\u044c \u0434\u0456\u0439, \u0449\u043e\u0431 \u043f\u0435\u0440\u0435\u0445\u0438\u0442\u0440\u0438\u0442\u0438 \u0441\u0443\u043f\u0435\u0440\u043d\u0438\u043a\u0430.'
      ,tutorialGoalHint: '\u0412\u0435\u0440\u0445\u043d\u044f \u043f\u0430\u043d\u0435\u043b\u044c \u043f\u043e\u043a\u0430\u0437\u0443\u0454 \u0440\u0430\u0445\u0443\u043d\u043e\u043a \u0456 \u0432\u0456\u0434\u043a\u0440\u0438\u0432\u0430\u0454 \u043c\u0435\u043d\u044e \u0442\u0430 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f.'
      ,tutorialMovePrompt: '\u0417\u0440\u043e\u0431\u0456\u043c\u043e \u043f\u0435\u0440\u0448\u0438\u0439 \u043a\u0440\u043e\u043a. \u041d\u0430\u0442\u0438\u0441\u043d\u0438 \u043f\u0456\u0434\u0441\u0432\u0456\u0447\u0435\u043d\u0443 \u0441\u0442\u0440\u0456\u043b\u043a\u0443, \u0449\u043e\u0431 \u043f\u0435\u0440\u0435\u0439\u0442\u0438 \u043d\u0430 \u043a\u043b\u0456\u0442\u0438\u043d\u043a\u0443.'
      ,tutorialMoveHint: '\u041d\u0430\u0442\u0438\u0441\u043d\u0438 \u0441\u0432\u0456\u0442\u043b\u0443 \u0441\u0442\u0440\u0456\u043b\u043a\u0443 \u2014 \u0443 \u0441\u043f\u0438\u0441\u043a\u0443 \u0437\u2019\u044f\u0432\u0438\u0442\u044c\u0441\u044f \u0445\u0456\u0434.'
      ,tutorialPlanPrompt: '\u0427\u0443\u0434\u043e\u0432\u043e! \u041d\u0438\u0436\u043d\u0456 \u043a\u043b\u0456\u0442\u0438\u043d\u043a\u0438 \u043f\u043b\u0430\u043d\u0430 \u043f\u043e\u043a\u0430\u0437\u0443\u044e\u0442\u044c, \u0449\u043e \u0442\u0438 \u0437\u0430\u0434\u0443\u043c\u0430\u0432.'
      ,tutorialPlanHint: '\u0417\u0430\u043f\u043e\u0432\u043d\u0438 \u0432\u0441\u0456 \u043f\u2019\u044f\u0442\u044c \u043a\u0440\u043e\u043a\u0456\u0432 \u2014 \u043d\u0435 \u0437\u0430\u0431\u0443\u0434\u044c \u043f\u0440\u043e \u0430\u0442\u0430\u043a\u0443 \u0439 \u0449\u0438\u0442.'
      ,tutorialDirectionRule: '\u0421\u043b\u0456\u0434\u043a\u0443\u0439 \u0437\u0430 \u043d\u0430\u043f\u0440\u044f\u043c\u043a\u0430\u043c\u0438.'
      ,tutorialDirectionRuleHint: '\u0412 \u043e\u0434\u043d\u043e\u043c\u0443 \u0440\u0430\u0443\u043d\u0434\u0456 \u043d\u0435 \u043c\u043e\u0436\u043d\u0430 \u0440\u0443\u0445\u0430\u0442\u0438\u0441\u044f \u0439 \u0430\u0442\u0430\u043a\u0443\u0432\u0430\u0442\u0438 \u0432 \u043e\u0434\u043d\u043e\u043c\u0443 \u043d\u0430\u043f\u0440\u044f\u043c\u043a\u0443. \u041e\u0431\u0438\u0440\u0430\u0439 \u0440\u0456\u0437\u043d\u0456 \u0441\u0442\u0440\u0456\u043b\u043a\u0438.'
      ,tutorialAttackPrompt: '\u0413\u043e\u0442\u0443\u0454\u043c\u043e \u0430\u0442\u0430\u043a\u0443. \u0422\u043e\u0440\u043a\u043d\u0438\u0441\u044f \u043c\u0435\u0447\u0430, \u0449\u043e\u0431 \u0443\u0432\u0456\u043c\u043a\u043d\u0443\u0442\u0438 \u0440\u0435\u0436\u0438\u043c \u0430\u0442\u0430\u043a\u0438.'
      ,tutorialAttackHint: '\u0423 \u0440\u0435\u0436\u0438\u043c\u0456 \u0430\u0442\u0430\u043a\u0438 \u043e\u0431\u0438\u0440\u0430\u0454\u043c\u043e \u043d\u0430\u043f\u0440\u044f\u043c\u043e\u043a \u0443\u0434\u0430\u0440\u0443.'
      ,tutorialAttackDirPrompt: '\u041e\u0431\u0435\u0440\u0438 \u0447\u0435\u0440\u0432\u043e\u043d\u0456 \u0441\u0442\u0440\u0456\u043b\u043a\u0438 (\u043c\u043e\u0436\u043d\u0430 \u043a\u0456\u043b\u044c\u043a\u0430), \u0449\u043e\u0431 \u043d\u0430\u043f\u0440\u0430\u0432\u0438\u0442\u0438 \u0443\u0434\u0430\u0440, \u0456 \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0438.'
      ,tutorialAttackDirHint: '\u041e\u0431\u0435\u0440\u0438 \u043e\u0434\u0438\u043d \u0447\u0438 \u043a\u0456\u043b\u044c\u043a\u0430 \u043d\u0430\u043f\u0440\u044f\u043c\u043a\u0456\u0432 \u2014 \u043a\u043e\u0436\u0435\u043d \u0437\u0430\u0439\u043c\u0435 \u0441\u0432\u0456\u0439 \u043a\u0440\u043e\u043a \u2014 \u0456 \u043d\u0430\u0442\u0438\u0441\u043d\u0438 \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043d\u044f.'
      ,tutorialShieldPrompt: '\u041f\u043e\u0441\u0442\u0430\u0432\u0438\u043c\u043e \u0437\u0430\u0445\u0438\u0441\u0442. \u041d\u0430\u0442\u0438\u0441\u043d\u0438 \u0449\u0438\u0442, \u0449\u043e\u0431 \u0434\u043e\u0434\u0430\u0442\u0438 \u0439\u043e\u0433\u043e \u0434\u043e \u043f\u043b\u0430\u043d\u0443.'
      ,tutorialShieldHint: '\u041e\u0434\u043d\u0435 \u043d\u0430\u0442\u0438\u0441\u043a\u0430\u043d\u043d\u044f \u2014 \u0456 \u043a\u0440\u043e\u043a \u0456\u0437 \u0449\u0438\u0442\u043e\u043c \u0437\u2019\u044f\u0432\u0438\u0442\u044c\u0441\u044f \u0432 \u0441\u043f\u0438\u0441\u043a\u0443.'
      ,tutorialConfirmPrompt: '\u0423\u0441\u0435 \u0433\u043e\u0442\u043e\u0432\u043e! \u0417\u0430\u043f\u0443\u0441\u043a\u0430\u0439 \u0440\u0430\u0443\u043d\u0434 \u0456 \u043f\u043e\u0434\u0438\u0432\u0438\u0441\u044c, \u044f\u043a \u0432\u0438\u043a\u043e\u043d\u0443\u0454\u0442\u044c\u0441\u044f \u043f\u043b\u0430\u043d.'
      ,tutorialConfirmHint: '\u041a\u043e\u043b\u0438 \u0432\u0441\u0456 \u043f\u2019\u044f\u0442\u044c \u043a\u0440\u043e\u043a\u0456\u0432 \u043d\u0430 \u043c\u0456\u0441\u0446\u0456, \u043d\u0430\u0442\u0438\u0441\u043a\u0430\u0439 \u043a\u043d\u043e\u043f\u043a\u0443 \u043f\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043d\u043d\u044f.'
      ,tutorialWrap: '\u0421\u0443\u043f\u0435\u0440! \u0420\u0430\u0443\u043d\u0434 \u0432\u0438\u043a\u043e\u043d\u0430\u0454\u0442\u044c\u0441\u044f \u0441\u0430\u043c, \u0430 \u043f\u043e\u0442\u0456\u043c \u043c\u043e\u0436\u043d\u0430 \u043f\u0435\u0440\u0435\u0433\u043b\u044f\u043d\u0443\u0442\u0438 \u0430\u0431\u043e \u0437\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u043f\u043e\u0432\u0442\u043e\u0440.'
      ,tutorialWrapHint: '\u0423 \u043c\u0435\u043d\u044e \u0454 \u043f\u0440\u0430\u0432\u0438\u043b\u0430 \u0439 \u043c\u043e\u0436\u043b\u0438\u0432\u0456\u0441\u0442\u044c \u043f\u0440\u043e\u0439\u0442\u0438 \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u044f \u0437\u043d\u043e\u0432\u0443.'
      ,tutorialPracticeHint: '\u0417\u0440\u043e\u0431\u0438 \u0434\u0456\u044e \u043d\u0430 \u043f\u0456\u0434\u0441\u0432\u0456\u0447\u0435\u043d\u0456\u0439 \u043a\u043d\u043e\u043f\u0446\u0456.'
      ,tutorialTryButton: '\u0421\u043f\u0440\u043e\u0431\u0443\u0432\u0430\u0442\u0438'
      ,tutorialFinish: '\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0438 \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u044f'
      ,tutorialNextHint: '\u041d\u0430\u0442\u0438\u0441\u043d\u0456\u0442\u044c \u00ab\u0414\u0430\u043b\u0456\u00bb, \u0449\u043e\u0431 \u043f\u0440\u043e\u0434\u043e\u0432\u0436\u0438\u0442\u0438 \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u044f.'
      ,tutorialStepLabel: '\u041a\u0440\u043e\u043a {current} \u0437 {total}'
      ,tutorialPromptTitle: '\u0412\u043f\u0435\u0440\u0448\u0435 \u0442\u0443\u0442?'
      ,tutorialPromptBody: '\u0421\u0445\u043e\u0436\u0435, \u0432\u0438 \u0432\u043f\u0435\u0440\u0448\u0435 \u043d\u0430 \u0441\u0430\u0439\u0442\u0456. \u0425\u043e\u0447\u0435\u0442\u0435 \u043f\u0440\u043e\u0439\u0442\u0438 \u043d\u0430\u0432\u0447\u0430\u043d\u043d\u044f?'
      ,tutorialPromptStart: '\u0411\u0430\u0436\u0430\u044e'
      ,tutorialPromptSkip: '\u041d\u0456'
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
