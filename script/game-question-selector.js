function buildGameQuestionCatalog(questionBank) {
    if (questionBank === null || typeof questionBank !== "object" || Array.isArray(questionBank)) {
        throw new TypeError("The conversation question bank must be an object.");
    }

    const catalog = [];
    for (const [topicId, questions] of Object.entries(questionBank)) {
        if (!Array.isArray(questions)) {
            throw new TypeError(`Questions for topic "${topicId}" must be an array.`);
        }

        for (const [index, text] of questions.entries()) {
            if (typeof text !== "string" || !text.trim()) {
                throw new TypeError(`Question ${index + 1} for topic "${topicId}" must be non-empty text.`);
            }

            catalog.push({
                id: `${topicId}-${String(index + 1).padStart(3, "0")}`,
                topicId,
                text
            });
        }
    }

    return catalog;
}

function getRandomValue(random) {
    if (typeof random !== "function") {
        throw new TypeError("The random source must be a function.");
    }

    const value = random();
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError("The random source must return a number from 0 inclusive to 1 exclusive.");
    }

    return value;
}

function chooseRandomItem(items, random) {
    return items[Math.floor(getRandomValue(random) * items.length)];
}

function selectNextGameQuestion(state, random = Math.random) {
    if (state === null || typeof state !== "object" || !Array.isArray(state.usedQuestionIds)) {
        throw new TypeError("A game state with a used-question list is required.");
    }

    const catalog = buildGameQuestionCatalog(conversationQuestions);
    const usedQuestionIds = new Set(state.usedQuestionIds);
    const topicsWithUnusedQuestions = new Map();

    for (const question of catalog) {
        if (usedQuestionIds.has(question.id)) {
            continue;
        }

        if (!topicsWithUnusedQuestions.has(question.topicId)) {
            topicsWithUnusedQuestions.set(question.topicId, []);
        }
        topicsWithUnusedQuestions.get(question.topicId).push(question);
    }

    const availableTopics = [...topicsWithUnusedQuestions.keys()];
    if (availableTopics.length === 0) {
        throw new RangeError("No unused questions remain for this game session.");
    }

    const selectedTopic = chooseRandomItem(availableTopics, random);
    const selectedQuestion = chooseRandomItem(topicsWithUnusedQuestions.get(selectedTopic), random);
    state.usedQuestionIds.push(selectedQuestion.id);
    state.currentQuestion = selectedQuestion;

    return selectedQuestion;
}
