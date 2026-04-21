(function initMessages(global) {
    "use strict";

    const namespace = global.YTCW = global.YTCW || {};

    namespace.messages = Object.freeze({
        MESSAGE_TYPES: Object.freeze({
            POPUP_START_WINDOW_MODE: "popup/start-window-mode",
            CONTENT_START_WINDOW_MODE: "content/start-window-mode",
            CONTENT_CLOSE_WINDOW_MODE: "content/close-window-mode"
        }),
        RESPONSE_STATUS: Object.freeze({
            SUCCESS: "success",
            ERROR: "error",
            NOT_WATCH_PAGE: "not-watch-page",
            COMMENTS_NOT_FOUND: "comments-not-found",
            LAYOUT_NOT_FOUND: "layout-not-found",
            TOO_NARROW: "too-narrow",
            ALREADY_ACTIVE: "already-active",
            NOT_ACTIVE: "not-active"
        })
    });
}(globalThis));
