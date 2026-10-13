function createGameSession(playerNames = {}, options = {}) {
    const now = options.now === undefined ? Date.now : options.now;
    const random = options.random === undefined ? Math.random : options.random;
    if (typeof now !== "function") {
        throw new TypeError("The clock source must be a function.");
    }

    const catalog = buildGameQuestionCatalog(conversationQuestions);
    if (options.topicId !== undefined
        && options.topicId !== null
        && (typeof options.topicId !== "string" || !Object.hasOwn(conversationQuestions, options.topicId))) {
        throw new RangeError("Choose a valid conversation topic to start the game.");
    }

    const availableQuestions = options.topicId
        ? catalog.filter(question => question.topicId === options.topicId)
        : catalog;
    const questionCount = availableQuestions.length;
    if (questionCount < GAME_CONFIG.totalTurns) {
        throw new Error(
            `A game needs at least ${GAME_CONFIG.totalTurns} unique questions in the selected topic, but only ${questionCount} are available.`
        );
    }

    const createdAt = now();
    if (typeof createdAt !== "number" || !Number.isFinite(createdAt)) {
        throw new TypeError("The clock source must return a valid timestamp.");
    }

    const state = createInitialGameState(playerNames);
    state.selectedTopicId = options.topicId || null;
    const randomToken = Math.floor(getRandomValue(random) * Number.MAX_SAFE_INTEGER).toString(36);
    state.sessionId = `session-${createdAt.toString(36)}-${randomToken}`;
    state.createdAt = new Date(createdAt).toISOString();
    state.updatedAt = state.createdAt;
    state.phase = GAME_PHASES.READY;
    selectNextGameQuestion(state, random);

    return state;
}

function startGameSession(playerNames = {}, options = {}) {
    const session = createGameSession(playerNames, options);
    gameState = session;
    return gameState;
}
