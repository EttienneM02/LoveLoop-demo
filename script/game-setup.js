const gameSetupForm = document.getElementById("game-setup-form");
const playerANameInput = document.getElementById("player-a-name");
const playerBNameInput = document.getElementById("player-b-name");
const gameTopicInput = document.getElementById("game-topic");
const gameError = document.getElementById("game-error");
const persistenceStatus = document.getElementById("persistence-status");
const resumeGamePanel = document.getElementById("resume-game-panel");
const resumeGameDescription = document.getElementById("resume-game-description");

const savedGame = loadGameState();

if (savedGame.issue) {
    persistenceStatus.hidden = false;
    persistenceStatus.textContent = savedGame.issue === "unavailable"
        ? "Browser storage is unavailable. A new game must be saved before it can open."
        : "A saved game could not be recovered. It was cleared; you can set up a new game below.";
}

if (savedGame.state
    && !(savedGame.state.phase === GAME_PHASES.TURN_COMPLETE
        && savedGame.state.currentTurn === GAME_CONFIG.totalTurns)) {
    const { players, currentTurn, phase } = savedGame.state;
    const phaseDescription = phase === GAME_PHASES.ANSWERING
        ? " The timer is still running."
        : phase === GAME_PHASES.RATING
            ? " It’s ready for the other player to rate."
            : "";
    resumeGameDescription.textContent = `${players.A.name} and ${players.B.name} are on turn ${currentTurn} of ${GAME_CONFIG.totalTurns}.${phaseDescription}`;
    resumeGamePanel.hidden = false;
    gameSetupForm.hidden = true;
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
        startGameSession(validation.names, { topicId: gameTopicInput.value });
    } catch (error) {
        gameError.textContent = error instanceof Error
            ? error.message
            : "The game session could not be started.";
        return;
    }

    const saved = saveGameState(gameState);
    if (!saved.saved) {
        gameError.textContent = "This browser couldn’t save the game. Check your storage settings, then try again.";
        return;
    }

    window.location.assign("game.html");
});
