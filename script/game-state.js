function validatePlayerNames(playerAName, playerBName) {
    const names = {
        A: typeof playerAName === "string" ? playerAName.trim() : "",
        B: typeof playerBName === "string" ? playerBName.trim() : ""
    };
    const errors = {};

    for (const playerId of ["A", "B"]) {
        const name = names[playerId];
        if (!name) {
            errors[playerId] = "Enter a name for both players.";
        } else if (name.length > GAME_CONFIG.maxPlayerNameLength) {
            errors[playerId] = `Names must be ${GAME_CONFIG.maxPlayerNameLength} characters or fewer.`;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        names,
        errors
    };
}

function createInitialGameState(playerNames = {}) {
    if (playerNames === null || typeof playerNames !== "object" || Array.isArray(playerNames)) {
        throw new TypeError("Player names must be provided as an object.");
    }

    const names = validatePlayerNames(
        playerNames.A === undefined ? "Player A" : playerNames.A,
        playerNames.B === undefined ? "Player B" : playerNames.B
    );

    if (!names.isValid) {
        throw new Error(`Invalid player names: ${Object.values(names.errors).join(" ")}`);
    }

    return {
        version: GAME_CONFIG.stateVersion,
        sessionId: null,
        createdAt: null,
        updatedAt: null,
        phase: GAME_PHASES.SETUP,
        currentTurn: 1,
        players: {
            A: {
                id: "A",
                name: names.names.A,
                score: 0
            },
            B: {
                id: "B",
                name: names.names.B,
                score: 0
            }
        },
        turns: [],
        usedQuestionIds: [],
        currentQuestion: null,
        currentRating: null,
        timerRemaining: GAME_CONFIG.answerTimeSeconds,
        turnDeadline: null
    };
}

function getTurnParticipants(turnNumber) {
    if (!Number.isInteger(turnNumber) || turnNumber < 1 || turnNumber > GAME_CONFIG.totalTurns) {
        throw new RangeError(`Turn number must be an integer from 1 to ${GAME_CONFIG.totalTurns}.`);
    }

    const answeringPlayerId = turnNumber % 2 === 1 ? "A" : "B";
    return {
        answeringPlayerId,
        ratingPlayerId: answeringPlayerId === "A" ? "B" : "A"
    };
}

function isValidRating(rating) {
    return Number.isInteger(rating)
        && rating >= GAME_CONFIG.minRating
        && rating <= GAME_CONFIG.maxRating;
}

let gameState = createInitialGameState();
