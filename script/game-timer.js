let activeGameTimer = null;

function stopGameTimer() {
    if (activeGameTimer !== null) {
        activeGameTimer.stop();
        activeGameTimer = null;
    }
}

function startGameTimer({ deadline, onTick, onExpire, now = Date.now, schedule = window.setInterval, cancel = window.clearInterval }) {
    if (!Number.isFinite(deadline)) {
        throw new TypeError("A valid timer deadline is required.");
    }
    if (typeof onTick !== "function" || typeof onExpire !== "function") {
        throw new TypeError("Timer callbacks are required.");
    }
    if (typeof now !== "function" || typeof schedule !== "function" || typeof cancel !== "function") {
        throw new TypeError("Valid clock and interval functions are required.");
    }

    stopGameTimer();
    let intervalId = null;
    let stopped = false;
    let lastRemaining = null;

    const stop = () => {
        if (stopped) {
            return;
        }
        stopped = true;
        if (intervalId !== null) {
            cancel(intervalId);
            intervalId = null;
        }
    };

    const tick = () => {
        if (stopped) {
            return;
        }

        const currentTime = now();
        if (typeof currentTime !== "number" || !Number.isFinite(currentTime)) {
            stop();
            activeGameTimer = null;
            throw new TypeError("The timer clock must return a valid timestamp.");
        }
        const remaining = Math.max(0, Math.ceil((deadline - currentTime) / 1000));
        if (remaining !== lastRemaining) {
            lastRemaining = remaining;
            onTick(remaining);
        }

        if (remaining === 0) {
            stop();
            activeGameTimer = null;
            onExpire();
        }
    };

    activeGameTimer = { stop };
    tick();
    if (!stopped) {
        intervalId = schedule(tick, 250);
    }

    return stop;
}
