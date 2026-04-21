(function initDomSelectors(global) {
    "use strict";

    const namespace = global.YTCW = global.YTCW || {};

    namespace.domSelectors = Object.freeze({
        WATCH_PAGE_ROOT: [
            "ytd-watch-flexy[flexy]",
            "ytd-watch-flexy"
        ],
        SECONDARY_COLUMN: [
            "#secondary",
            "#columns #secondary"
        ],
        SECONDARY_INNER: [
            "#secondary-inner",
            "#secondary ytd-watch-next-secondary-results-renderer",
            "#secondary"
        ],
        COMMENTS_CONTAINER: [
            "ytd-comments#comments",
            "#comments ytd-comments",
            "#comments"
        ],
        PAGE_MANAGER: [
            "ytd-page-manager"
        ],
        APP_ROOT: [
            "ytd-app"
        ]
    });
}(globalThis));
