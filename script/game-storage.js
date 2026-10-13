const SAVED_GAME_PHASES = new Set([
    GAME_PHASES.READY,
    GAME_PHASES.ANSWERING,
    GAME_PHASES.RATING,
    GAME_PHASES.TURN_COMPLETE
]);

function validateSavedGameState(state) {
    if (!state || typeof state !== "object" || Array.isArray(state)
        || state.version !== GAME_CONFIG.stateVersion
        || typeof state.sessionId !== "string" || !state.sessionId
        || !Number.isFinite(Date.parse(state.createdAt))
        || !Number.isFinite(Date.parse(state.updatedAt))
        || !SAVED_GAME_PHASES.has(state.phase)
        || !Number.isInteger(state.currentTurn)
        || state.currentTurn < 1
        || state.currentTurn > GAME_CONFIG.totalTurns
        || !Array.isArray(state.turns)
        || !Array.isArray(state.usedQuestionIds)
        || !Number.isInteger(state.timerRemaining)
        || state.timerRemaining < 0
        || state.timerRemaining > GAME_CONFIG.answerTimeSeconds) {
        return false;
    }

    if (state.turnDeadline !== null
        && (typeof state.turnDeadline !== "number" || !Number.isFinite(state.turnDeadline))) {
        return false;
    }

    if (state.phase === GAME_PHASES.ANSWERING && state.turnDeadline === null) {
        return false;
    }
    if (state.phase !== GAME_PHASES.ANSWERING && state.turnDeadline !== null) {
        return false;
    }

    const participantsByTurn = Array.from(
        { length: GAME_CONFIG.totalTurns },
        (_, index) => getTurnParticipants(index + 1)
    );
    const questionCatalog = new Map(
        buildGameQuestionCatalog(conversationQuestions).map(question => [question.id, question])
    );
    if (state.selectedTopicId !== undefined
        && state.selectedTopicId !== null
        && (typeof state.selectedTopicId !== "string" || !Object.hasOwn(conversationQuestions, state.selectedTopicId))) {
        return false;
    }

    const uniqueQuestionIds = new Set(state.usedQuestionIds);
    if (state.usedQuestionIds.length !== state.currentTurn
        || uniqueQuestionIds.size !== state.usedQuestionIds.length
        || state.usedQuestionIds.some(id => !questionCatalog.has(id)
            || (state.selectedTopicId && questionCatalog.get(id).topicId !== state.selectedTopicId))) {
        return false;
    }

    if (!state.currentQuestion || typeof state.currentQuestion !== "object") {
        return false;
    }
    const currentQuestion = questionCatalog.get(state.currentQuestion.id);
    if (!currentQuestion
        || currentQuestion.topicId !== state.currentQuestion.topicId
        || currentQuestion.text !== state.currentQuestion.text
        || (state.selectedTopicId && currentQuestion.topicId !== state.selectedTopicId)
        || state.usedQuestionIds[state.currentTurn - 1] !== currentQuestion.id) {
        return false;
    }

    if (!state.players || typeof state.players !== "object") {
        return false;
    }
    for (const playerId of ["A", "B"]) {
        const player = state.players[playerId];
        if (!player
            || player.id !== playerId
            || typeof player.name !== "string"
            || !player.name.trim()
            || player.name.length > GAME_CONFIG.maxPlayerNameLength
            || !Number.isInteger(player.score)
            || player.score < 0
            || player.score > GAME_CONFIG.totalTurns * GAME_CONFIG.maxRating) {
            return false;
        }
    }

    const completedTurns = state.phase === GAME_PHASES.TURN_COMPLETE
        ? state.currentTurn
        : state.currentTurn - 1;
    if (state.turns.length !== completedTurns) {
        return false;
    }

    const calculatedScores = { A: 0, B: 0 };
    for (const [index, turn] of state.turns.entries()) {
        const expectedParticipants = participantsByTurn[index];
        const expectedQuestion = questionCatalog.get(state.usedQuestionIds[index]);
        if (!turn
            || turn.completed !== true
            || turn.turnNumber !== index + 1
            || turn.answeringPlayerId !== expectedParticipants.answeringPlayerId
            || turn.ratingPlayerId !== expectedParticipants.ratingPlayerId
            || turn.questionId !== expectedQuestion.id
            || turn.topicId !== expectedQuestion.topicId
            || turn.questionText !== expectedQuestion.text
            || !isValidRating(turn.rating)) {
            return false;
        }
        calculatedScores[turn.answeringPlayerId] += turn.rating;
    }

    if (state.players.A.score !== calculatedScores.A || state.players.B.score !== calculatedScores.B) {
        return false;
    }

    const isTurnComplete = state.phase === GAME_PHASES.TURN_COMPLETE;
    if (isTurnComplete) {
        if (!isValidRating(state.currentRating)
            || state.currentRating !== state.turns[state.turns.length - 1].rating) {
            return false;
        }
    } else if (state.currentRating !== null) {
        return false;
    }

    return true;
}

function saveGameState(state) {
    if (!validateSavedGameState(state)) {
        throw new TypeError("The game state is invalid and cannot be saved.");
    }

    try {
        state.updatedAt = new Date().toISOString();
        window.localStorage.setItem(
            GAME_CONFIG.storageKeys.gameState,
            JSON.stringify(state)
        );
        return { saved: true, issue: null };
    } catch {
        return { saved: false, issue: "unavailable" };
    }
}

function loadGameState() {
    let rawState;
    try {
        rawState = window.localStorage.getItem(GAME_CONFIG.storageKeys.gameState);
    } catch {
        return { state: null, issue: "unavailable" };
    }

    if (rawState === null) {
        return { state: null, issue: null };
    }

    try {
        const state = JSON.parse(rawState);
        if (validateSavedGameState(state)) {
            return { state, issue: null };
        }
    } catch {
        // Invalid JSON is handled through the same recovery path as invalid state.
    }

    try {
        window.localStorage.removeItem(GAME_CONFIG.storageKeys.gameState);
    } catch {
        return { state: null, issue: "invalid-unavailable" };
    }
    return { state: null, issue: "invalid" };
}

function clearSavedGameState() {
    try {
        window.localStorage.removeItem(GAME_CONFIG.storageKeys.gameState);
        return { cleared: true, issue: null };
    } catch {
        return { cleared: false, issue: "unavailable" };
    }
}
