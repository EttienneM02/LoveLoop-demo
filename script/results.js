const resultsError = document.getElementById("results-error");
const resultsContent = document.getElementById("results-content");

function isValidResults(results) {
    if (results === null || typeof results !== "object"
        || results.version !== GAME_CONFIG.stateVersion
        || typeof results.sessionId !== "string"
        || !Number.isInteger(results.completedTurns)
        || results.completedTurns !== GAME_CONFIG.totalTurns
        || !results.players || typeof results.players !== "object"
        || !results.winner || typeof results.winner.text !== "string"
        || typeof results.relationshipStatus !== "string") {
        return false;
    }

    for (const playerId of ["A", "B"]) {
        const player = results.players[playerId];
        if (!player || typeof player.name !== "string" || !player.name.trim()
            || !Number.isInteger(player.score) || player.score < 4 || player.score > 20) {
            return false;
        }
    }

    const combinedScore = results.players.A.score + results.players.B.score;
    const matchingBand = GAME_CONFIG.combinedScoreBands.find(
        band => combinedScore >= band.min && combinedScore <= band.max
    );
    const expectedWinner = results.players.A.score === results.players.B.score
        ? results.winner.type === "tie"
        : results.winner.type === "player"
            && results.winner.playerId === (results.players.A.score > results.players.B.score ? "A" : "B");

    return results.combinedScore === combinedScore
        && Boolean(matchingBand)
        && results.relationshipStatus === matchingBand.message
        && expectedWinner;
}

function renderResults() {
    let results;
    try {
        const rawResults = sessionStorage.getItem(GAME_CONFIG.storageKeys.latestResults);
        if (!rawResults) {
            throw new Error("No completed game results were found in this browser tab.");
        }
        results = JSON.parse(rawResults);
    } catch (error) {
        resultsError.textContent = error instanceof Error
            ? `${error.message} Finish a game first, or return to the homepage.`
            : "Results could not be loaded. Return to the homepage and play a game.";
        resultsError.hidden = false;
        return;
    }

    if (!isValidResults(results)) {
        resultsError.textContent = "The saved game results are invalid or incomplete. Return to the homepage and play a new game.";
        resultsError.hidden = false;
        return;
    }

    document.getElementById("results-winner").textContent = results.winner.text;
    document.getElementById("player-a-label").textContent = results.players.A.name;
    document.getElementById("player-a-score").textContent = String(results.players.A.score);
    document.getElementById("player-b-label").textContent = results.players.B.name;
    document.getElementById("player-b-score").textContent = String(results.players.B.score);
    document.getElementById("combined-score").textContent = String(results.combinedScore);
    document.getElementById("relationship-message").textContent = results.relationshipStatus;
    document.getElementById("results-turn-count").textContent = `${results.completedTurns} of ${GAME_CONFIG.totalTurns} turns completed`;
    resultsContent.hidden = false;
}

renderResults();
