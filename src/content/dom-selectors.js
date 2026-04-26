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
        SECONDARY_CHIP_BAR: [
            "#secondary ytd-feed-filter-chip-bar-renderer",
            "#secondary #chips-wrapper",
            "#secondary yt-chip-cloud-renderer"
        ],
        SECONDARY_CHIP_CONTAINER: [
            "#secondary ytd-feed-filter-chip-bar-renderer #chips",
            "#secondary ytd-feed-filter-chip-bar-renderer #chips-content",
            "#secondary yt-chip-cloud-renderer #chips",
            "#secondary #chips"
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
