const GAME_CONFIG = Object.freeze({
    totalTurns: 8,
    answerTimeSeconds: 90,
    minRating: 1,
    maxRating: 5,
    maxPlayerNameLength: 30,
    stateVersion: 1,
    storageKeys: Object.freeze({
        gameState: "conversationalPieces.gameState",
        settings: "conversationalPieces.settings",
        latestResults: "conversationalPieces.latestResults"
    }),
    combinedScoreBands: Object.freeze([
        Object.freeze({ min: 1, max: 10, message: "You guys need to open up 💔" }),
        Object.freeze({ min: 11, max: 20, message: "You guys are slowly developing trust... keep up the process, you are almost there." }),
        Object.freeze({ min: 21, max: 30, message: "This relationship has the potential to flourish; give it more time." }),
        Object.freeze({ min: 31, max: 40, message: "Cloud 9 — you guys are making good progress ❤" })
    ])
});

const GAME_PHASES = Object.freeze({
    SETUP: "setup",
    READY: "ready",
    ANSWERING: "answering",
    RATING: "rating",
    TURN_COMPLETE: "turn-complete",
    RESULTS: "results"
});
