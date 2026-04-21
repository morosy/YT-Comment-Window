(function initConstants(global) {
    "use strict";

    const namespace = global.YTCW = global.YTCW || {};

    namespace.constants = Object.freeze({
        EXTENSION_NAME: "YT-Comment-Window",
        WATCH_PATH: "/watch",
        OVERLAY_ID: "ytcw-comment-window",
        OVERLAY_BODY_ID: "ytcw-comment-window-body",
        OVERLAY_CLOSE_BUTTON_ID: "ytcw-comment-window-close",
        CSS_ROOT_CLASS: "ytcw-overlay",
        CSS_ACTIVE_CLASS: "ytcw-window-mode-active",
        COMMENT_RELOCATED_ATTRIBUTE: "data-ytcw-relocated",
        WINDOW_WIDTH_PX: 360,
        MIN_WINDOW_WIDTH_PX: 280,
        MIN_LAYOUT_WIDTH_PX: 920,
        LAYOUT_WAIT_TIMEOUT_MS: 8000,
        LAYOUT_RETRY_INTERVAL_MS: 250,
        SPA_GUARD_DEBOUNCE_MS: 180
    });
}(globalThis));
