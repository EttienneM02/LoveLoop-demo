const gamePanel = document.getElementById("game");
const gameSetupForm = document.getElementById("game-setup-form");
const playerANameInput = document.getElementById("player-a-name");
const playerBNameInput = document.getElementById("player-b-name");
const gameError = document.getElementById("game-error");
const gameReadyPanel = document.getElementById("game-ready");
const gameAnsweringPanel = document.getElementById("game-answering");
const gameRatingPanel = document.getElementById("game-rating");
const gameTurnCompletePanel = document.getElementById("game-turn-complete");
const gameTurnLabel = document.getElementById("game-turn-label");
const gamePlayerLabel = document.getElementById("game-player-label");
const gameTopicLabel = document.getElementById("game-topic-label");
const gameQuestionText = document.getElementById("game-question-text");
const startAnswerButton = document.getElementById("start-answer");
const finishAnswerButton = document.getElementById("finish-answer");
const timerDisplay = document.getElementById("game-timer");
const timerAnnouncement = document.getElementById("timer-announcement");
const gameStatus = document.getElementById("game-status");
const answeringTurnLabel = document.getElementById("answering-turn-label");
const answeringPlayerLabel = document.getElementById("answering-player-label");
const answeringTopicLabel = document.getElementById("answering-topic-label");
const answeringQuestionLabel = document.getElementById("answering-question-label");
const ratingTurnLabel = document.getElementById("rating-turn-label");
const ratingPlayerLabel = document.getElementById("rating-player-label");
const ratingTopicLabel = document.getElementById("rating-topic-label");
const ratingQuestionLabel = document.getElementById("rating-question-label");
const ratingForm = document.getElementById("rating-form");
const ratingStatus = document.getElementById("rating-status");
const completedTurnLabel = document.getElementById("completed-turn-label");
const transitionTurnButton = document.getElementById("transition-turn");

const TOPIC_LABELS = Object.freeze({
    "getting-to-know-each-other": "Getting to know each other",
    "fun-playful": "Fun & playful",
    "romance-attraction": "Romance & attraction",
    "future-dreams": "Future & dreams",
    "interests-hobbies": "Interests & hobbies",
    "personality-values": "Personality & values",
    relationships: "Relationships",
    "deep-emotional": "Deep & emotional"
});

function updateTimerDisplay(secondsRemaining) {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    timerDisplay.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
    timerDisplay.setAttribute("aria-label", `${secondsRemaining} seconds remaining`);
    gameState.timerRemaining = secondsRemaining;

    if (secondsRemaining === GAME_CONFIG.answerTimeSeconds
        || secondsRemaining === 60
        || secondsRemaining === 30
        || secondsRemaining === 10
        || secondsRemaining === 5
        || secondsRemaining === 0) {
        timerAnnouncement.textContent = secondsRemaining === 0
            ? "Time is up."
            : `${secondsRemaining} seconds remaining.`;
    }
}

function renderAnswerPhase() {
    const participants = getTurnParticipants(gameState.currentTurn);
    const answeringPlayer = gameState.players[participants.answeringPlayerId];

    gameSetupForm.hidden = true;
    gameReadyPanel.hidden = gameState.phase !== GAME_PHASES.READY;
    gameAnsweringPanel.hidden = gameState.phase !== GAME_PHASES.ANSWERING;
    gameRatingPanel.hidden = gameState.phase !== GAME_PHASES.RATING;
    gameTurnCompletePanel.hidden = gameState.phase !== GAME_PHASES.TURN_COMPLETE;
    finishAnswerButton.disabled = gameState.phase !== GAME_PHASES.ANSWERING;
    gameTurnLabel.textContent = `Turn ${gameState.currentTurn} of ${GAME_CONFIG.totalTurns}`;
    gamePlayerLabel.textContent = `${answeringPlayer.name} answers`;
    gameTopicLabel.textContent = TOPIC_LABELS[gameState.currentQuestion.topicId] || gameState.currentQuestion.topicId;
    gameQuestionText.textContent = gameState.currentQuestion.text;
    answeringTurnLabel.textContent = gameTurnLabel.textContent;
    answeringPlayerLabel.textContent = `${answeringPlayer.name} is answering`;
    answeringTopicLabel.textContent = gameTopicLabel.textContent;
    answeringQuestionLabel.textContent = gameQuestionText.textContent;
    ratingTurnLabel.textContent = gameTurnLabel.textContent;
    completedTurnLabel.textContent = gameTurnLabel.textContent;
    gameStatus.textContent = "";

    if (gameState.phase === GAME_PHASES.ANSWERING) {
        finishAnswerButton.focus();
    } else if (gameState.phase === GAME_PHASES.RATING) {
        const ratingPlayer = gameState.players[participants.ratingPlayerId];
        ratingPlayerLabel.textContent = `${ratingPlayer.name}, rate ${answeringPlayer.name}'s answer`;
        ratingTopicLabel.textContent = gameTopicLabel.textContent;
        ratingQuestionLabel.textContent = gameQuestionText.textContent;
        ratingForm.reset();
        ratingStatus.textContent = "";
        const firstRating = ratingForm.querySelector('input[name="rating"]');
        firstRating.focus();
    } else if (gameState.phase === GAME_PHASES.TURN_COMPLETE) {
        const answeringPlayer = gameState.players[participants.answeringPlayerId];
        gameStatus.textContent = `${gameState.currentRating} points awarded to ${answeringPlayer.name}.`;
        if (gameState.currentTurn === GAME_CONFIG.totalTurns) {
            transitionTurnButton.disabled = false;
            transitionTurnButton.textContent = "View results";
        } else {
            const nextAnsweringPlayer = getTurnParticipants(gameState.currentTurn + 1).answeringPlayerId;
            transitionTurnButton.disabled = false;
            transitionTurnButton.textContent = `Next turn — ${gameState.players[nextAnsweringPlayer].name}`;
        }
    }
}

function beginAnsweringPhase() {
    if (gameState.phase !== GAME_PHASES.READY || !gameState.currentQuestion) {
        return false;
    }

    gameState.phase = GAME_PHASES.ANSWERING;
    gameState.turnDeadline = Date.now() + GAME_CONFIG.answerTimeSeconds * 1000;
    gameState.timerRemaining = GAME_CONFIG.answerTimeSeconds;
    renderAnswerPhase();

    startGameTimer({
        deadline: gameState.turnDeadline,
        onTick: updateTimerDisplay,
        onExpire: () => finishAnswering(true)
    });
    return true;
}

function finishAnswering(timerExpired = false) {
    if (gameState.phase !== GAME_PHASES.ANSWERING) {
        return false;
    }

    stopGameTimer();
    gameState.timerRemaining = timerExpired ? 0 : gameState.timerRemaining;
    gameState.turnDeadline = null;
    gameState.phase = GAME_PHASES.RATING;
    renderAnswerPhase();
    timerAnnouncement.textContent = timerExpired ? "Time is up. The rating phase has started." : "The answering round is complete. The rating phase has started.";
    ratingStatus.textContent = timerExpired
        ? "Time is up. The other player can now rate the verbal answer."
        : "The other player can now rate the verbal answer.";
    return true;
}

function submitGameRating(rating) {
    if (gameState.phase !== GAME_PHASES.RATING) {
        return false;
    }
    if (!isValidRating(rating)) {
        ratingStatus.textContent = `Choose a whole-number rating from ${GAME_CONFIG.minRating} to ${GAME_CONFIG.maxRating}.`;
        return false;
    }

    const { answeringPlayerId } = getTurnParticipants(gameState.currentTurn);
    const ratingPlayerId = answeringPlayerId === "A" ? "B" : "A";
    gameState.currentRating = rating;
    gameState.players[answeringPlayerId].score += rating;
    gameState.turns.push({
        turnNumber: gameState.currentTurn,
        answeringPlayerId,
        ratingPlayerId,
        questionId: gameState.currentQuestion.id,
        topicId: gameState.currentQuestion.topicId,
        questionText: gameState.currentQuestion.text,
        rating,
        completed: true
    });
    gameState.phase = GAME_PHASES.TURN_COMPLETE;
    renderAnswerPhase();
    gameStatus.textContent = `${rating} points awarded to ${gameState.players[answeringPlayerId].name}.`;
    return true;
}

function transitionToNextTurn() {
    if (gameState.phase !== GAME_PHASES.TURN_COMPLETE) {
        return false;
    }

    if (gameState.currentTurn === GAME_CONFIG.totalTurns) {
        return openGameResults();
    }

    const nextTurn = gameState.currentTurn + 1;
    const nextQuestionState = {
        usedQuestionIds: [...gameState.usedQuestionIds],
        currentQuestion: gameState.currentQuestion
    };
    const nextQuestion = selectNextGameQuestion(nextQuestionState);

    gameState.currentTurn = nextTurn;
    gameState.usedQuestionIds = nextQuestionState.usedQuestionIds;
    gameState.currentQuestion = nextQuestion;
    gameState.currentRating = null;
    gameState.timerRemaining = GAME_CONFIG.answerTimeSeconds;
    gameState.turnDeadline = null;
    gameState.phase = GAME_PHASES.READY;
    renderAnswerPhase();
    startAnswerButton.focus();
    return true;
}

function createGameResults(state) {
    if (state.phase !== GAME_PHASES.TURN_COMPLETE
        || state.currentTurn !== GAME_CONFIG.totalTurns
        || state.turns.length !== GAME_CONFIG.totalTurns) {
        throw new Error("Results are only available after all turns have been completed.");
    }

    const calculatedScores = { A: 0, B: 0 };
    for (const [index, turn] of state.turns.entries()) {
        if (!turn.completed
            || turn.turnNumber !== index + 1
            || !isValidRating(turn.rating)
            || !["A", "B"].includes(turn.answeringPlayerId)) {
            throw new Error("Completed turn data is invalid. Results cannot be calculated.");
        }
        calculatedScores[turn.answeringPlayerId] += turn.rating;
    }

    if (calculatedScores.A !== state.players.A.score || calculatedScores.B !== state.players.B.score) {
        throw new Error("Player scores do not match the completed turn ratings.");
    }

    const combinedScore = calculatedScores.A + calculatedScores.B;
    const scoreBand = GAME_CONFIG.combinedScoreBands.find(
        band => combinedScore >= band.min && combinedScore <= band.max
    );
    if (!scoreBand) {
        throw new Error(`No relationship-status message is defined for a combined score of ${combinedScore}.`);
    }

    let winner;
    if (calculatedScores.A === calculatedScores.B) {
        winner = {
            type: "tie",
            text: "It’s a shared win — you’re a perfect match!"
        };
    } else {
        const winnerId = calculatedScores.A > calculatedScores.B ? "A" : "B";
        winner = {
            type: "player",
            playerId: winnerId,
            text: `${state.players[winnerId].name} wins this game!`
        };
    }

    return {
        version: GAME_CONFIG.stateVersion,
        sessionId: state.sessionId,
        completedAt: new Date().toISOString(),
        players: {
            A: { name: state.players.A.name, score: calculatedScores.A },
            B: { name: state.players.B.name, score: calculatedScores.B }
        },
        completedTurns: state.turns.length,
        combinedScore,
        winner,
        relationshipStatus: scoreBand.message
    };
}

function openGameResults() {
    if (gameState.phase !== GAME_PHASES.TURN_COMPLETE || gameState.currentTurn !== GAME_CONFIG.totalTurns) {
        return false;
    }

    try {
        const results = createGameResults(gameState);
        sessionStorage.setItem(GAME_CONFIG.storageKeys.latestResults, JSON.stringify(results));
        gameState.phase = GAME_PHASES.RESULTS;
        window.location.assign("results.html");
        return true;
    } catch (error) {
        gameStatus.textContent = error instanceof Error
            ? `Could not open results: ${error.message}`
            : "Could not open results. Please try again.";
        return false;
    }
}

function showGameSetup() {
    gameSetupForm.hidden = false;
    gamePanel.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
    });
    playerANameInput.focus();
}

gameSetupForm.addEventListener("submit", event => {
    event.preventDefault();
    gameError.textContent = "";

    const validation = validatePlayerNames(playerANameInput.value, playerBNameInput.value);
    if (!validation.isValid) {
        gameError.textContent = Object.values(validation.errors).join(" ");
        return;
    }

    try {
        startGameSession(validation.names);
    } catch (error) {
        gameError.textContent = error instanceof Error ? error.message : "The game session could not be started.";
        return;
    }

    renderAnswerPhase();
});

startAnswerButton.addEventListener("click", beginAnsweringPhase);
finishAnswerButton.addEventListener("click", () => finishAnswering());

ratingForm.addEventListener("submit", event => {
    event.preventDefault();
    const selectedRating = ratingForm.querySelector('input[name="rating"]:checked');
    const rating = selectedRating ? Number(selectedRating.value) : null;
    submitGameRating(rating);
});

transitionTurnButton.addEventListener("click", transitionToNextTurn);

gamePanel.addEventListener("click", event => {
    if (event.target.closest("#start-game-link")) {
        showGameSetup();
    }
});

if (window.location.hash === "#game") {
    showGameSetup();
}
