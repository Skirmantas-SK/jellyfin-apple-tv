(function () {
    "use strict";

    if (window.__abyssTvosPlayerLoaded) {
        return;
    }
    window.__abyssTvosPlayerLoaded = true;

    const SEEK_SECONDS = 15;
    const SEEK_KEYS = new Map([
        ["ArrowLeft", -1],
        ["Left", -1],
        ["MediaRewind", -1],
        ["Rewind", -1],
        ["ArrowRight", 1],
        ["Right", 1],
        ["MediaFastForward", 1],
        ["FastForward", 1]
    ]);

    let seekingTimer = 0;
    let overlayTimer = 0;

    function isEditableTarget(target) {
        if (!target || target === document.body) {
            return false;
        }

        return Boolean(target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']"));
    }

    function isPlayerActive() {
        return Boolean(document.querySelector(".videoPlayerContainer-onTop, #videoOsdPage, #videoDialog"));
    }

    function getActiveVideo() {
        const videos = Array.from(document.querySelectorAll("video"));
        return videos.find((video) => video.readyState > 0 && !video.paused) ||
            videos.find((video) => video.readyState > 0) ||
            null;
    }

    function clampTime(video, nextTime) {
        const duration = Number.isFinite(video.duration) ? video.duration : Number.MAX_SAFE_INTEGER;
        return Math.max(0, Math.min(duration, nextTime));
    }

    function ensureOverlay() {
        let overlay = document.getElementById("abyss-tvos-seek-overlay");

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "abyss-tvos-seek-overlay";
            overlay.setAttribute("aria-live", "polite");
            overlay.setAttribute("role", "status");
            document.body.appendChild(overlay);
        }

        return overlay;
    }

    function showSeekOverlay(deltaSeconds) {
        const overlay = ensureOverlay();
        overlay.textContent = `${deltaSeconds > 0 ? "+" : "-"}${Math.abs(deltaSeconds)}s`;
        overlay.classList.remove("is-visible");
        void overlay.offsetWidth;
        overlay.classList.add("is-visible");

        window.clearTimeout(overlayTimer);
        overlayTimer = window.setTimeout(() => {
            overlay.classList.remove("is-visible");
        }, 900);
    }

    function hidePassiveOsd() {
        document.body.classList.add("tvos-seeking");

        window.clearTimeout(seekingTimer);
        seekingTimer = window.setTimeout(() => {
            document.body.classList.remove("tvos-seeking");
        }, 1050);
    }

    function seekBy(direction) {
        const video = getActiveVideo();

        if (!video) {
            return false;
        }

        const deltaSeconds = direction * SEEK_SECONDS;
        video.currentTime = clampTime(video, (video.currentTime || 0) + deltaSeconds);
        video.dispatchEvent(new Event("timeupdate", { bubbles: true }));

        hidePassiveOsd();
        showSeekOverlay(deltaSeconds);
        return true;
    }

    window.addEventListener("keydown", (event) => {
        const direction = SEEK_KEYS.get(event.key) || SEEK_KEYS.get(event.code);

        if (!direction || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }

        if (!isPlayerActive() || isEditableTarget(event.target)) {
            return;
        }

        if (seekBy(direction)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);

    window.addEventListener("click", (event) => {
        const button = event.target && event.target.closest(".btnRewind, .btnFastForward");

        if (!button || !isPlayerActive()) {
            return;
        }

        const direction = button.classList.contains("btnRewind") ? -1 : 1;

        if (seekBy(direction)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
})();
