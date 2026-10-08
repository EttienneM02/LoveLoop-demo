const topicButtons = [...document.querySelectorAll("[data-topic]")];
const bankStatus = document.getElementById("question-bank-status");
const generatorPanel = document.getElementById("generator");
const generatorTopic = document.getElementById("generator-topic");
const generatedQuestion = document.getElementById("generated-question");
const questionCount = document.getElementById("question-count");
const anotherQuestionButton = document.getElementById("another-question");

const questionBank = conversationQuestions;
const remainingQuestions = new Map();
let activeTopic = null;
let lastQuestion = null;
let questionNumber = 0;

function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
        const otherIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[otherIndex]] = [items[otherIndex], items[index]];
    }

    return items;
}

function drawQuestion(topic) {
    const allQuestions = questionBank[topic];
    let remaining = remainingQuestions.get(topic);

    if (!remaining || remaining.length === 0) {
        remaining = shuffle([...allQuestions]);
        if (remaining.length > 1 && remaining[0] === lastQuestion) {
            [remaining[0], remaining[1]] = [remaining[1], remaining[0]];
        }
    }

    const question = remaining.shift();
    remainingQuestions.set(topic, remaining);
    lastQuestion = question;
    questionNumber = allQuestions.length - remaining.length;
    generatedQuestion.textContent = question;
    questionCount.textContent = `Question ${questionNumber} of ${allQuestions.length}`;
}

function selectTopic(button) {
    const topic = button.dataset.topic;
    activeTopic = topic;
    generatorTopic.textContent = button.dataset.label;

    for (const topicButton of topicButtons) {
        const isSelected = topicButton === button;
        topicButton.classList.toggle("is-selected", isSelected);
        topicButton.setAttribute("aria-pressed", String(isSelected));
    }

    drawQuestion(topic);
    generatorPanel.hidden = false;
    bankStatus.textContent = `${button.dataset.label} selected. Your question is ready below.`;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    generatorPanel.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center"
    });
}

function initializeQuestionBank() {
    for (const button of topicButtons) {
        const questions = questionBank[button.dataset.topic];
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error(`No questions found for topic "${button.dataset.topic}".`);
        }

        const count = questions.length;
        button.querySelector(".topic-count").textContent = `${count} questions`;
        button.disabled = false;
    }

    bankStatus.textContent = "Choose a topic to get a conversation question.";
}

for (const button of topicButtons) {
    button.addEventListener("click", () => selectTopic(button));
    button.setAttribute("aria-pressed", "false");
}

anotherQuestionButton.addEventListener("click", () => {
    if (activeTopic) {
        drawQuestion(activeTopic);
    }
});

initializeQuestionBank();
