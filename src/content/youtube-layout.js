(function initYoutubeLayout(global) {
    "use strict";

    const namespace = global.YTCW = global.YTCW || {};
    const constants = namespace.constants || {};
    const domSelectors = namespace.domSelectors || {};

    /**
     * @param {string[]} selectors
     * @param {ParentNode} root
     * @returns {Element|null}
     */
    function findFirst(selectors, root) {
        const searchRoot = root || document;

        for (const selector of selectors) {
            const match = searchRoot.querySelector(selector);

            if (match) {
                return match;
            }
        }

        return null;
    }

    /**
     * @param {string} [urlString]
     * @returns {boolean}
     */
    function isWatchPage(urlString) {
        const source = urlString || global.location.href;

        try {
            const url = new URL(source);
            return url.hostname === "www.youtube.com"
                && url.pathname === constants.WATCH_PATH
                && url.searchParams.has("v");
        } catch (error) {
            console.warn("[YT-Comment-Window] failed to parse YouTube URL.", error);
            return false;
        }
    }

    /**
     * @param {string} [urlString]
     * @returns {string|null}
     */
    function getCurrentVideoId(urlString) {
        const source = urlString || global.location.href;

        try {
            const url = new URL(source);
            return url.searchParams.get("v");
        } catch (error) {
            console.warn("[YT-Comment-Window] failed to extract the current video id.", error);
            return null;
        }
    }

    /**
     * @returns {boolean}
     */
    function hasMinimumWidth() {
        return global.innerWidth >= constants.MIN_LAYOUT_WIDTH_PX;
    }

    /**
     * @returns {{
     *     watchRoot: Element|null,
     *     secondaryColumn: Element|null,
     *     secondaryInner: Element|null,
     *     overlayHost: Element|null,
     *     commentsContainer: Element|null
     * }}
     */
    function getLayoutElements() {
        const watchRoot = findFirst(domSelectors.WATCH_PAGE_ROOT || [], document);
        const searchRoot = watchRoot || document;
        const secondaryColumn = findFirst(domSelectors.SECONDARY_COLUMN || [], searchRoot);
        const secondaryInner = findFirst(domSelectors.SECONDARY_INNER || [], searchRoot);
        const commentsContainer = findFirst(domSelectors.COMMENTS_CONTAINER || [], searchRoot);

        return {
            watchRoot,
            secondaryColumn,
            secondaryInner,
            overlayHost: secondaryInner || secondaryColumn,
            commentsContainer
        };
    }

    /**
     * @param {{ timeoutMs?: number }} options
     * @returns {Promise<ReturnType<typeof getLayoutElements> | null>}
     */
    function waitForLayoutElements(options) {
        const timeoutMs = options && options.timeoutMs
            ? options.timeoutMs
            : constants.LAYOUT_WAIT_TIMEOUT_MS;

        return new Promise((resolve) => {
            let completed = false;
            let observer = null;
            let intervalId = 0;
            let timeoutId = 0;

            /**
             * @param {ReturnType<typeof getLayoutElements> | null} result
             */
            function finish(result) {
                if (completed) {
                    return;
                }

                completed = true;

                if (observer) {
                    observer.disconnect();
                }

                if (intervalId) {
                    global.clearInterval(intervalId);
                }

                if (timeoutId) {
                    global.clearTimeout(timeoutId);
                }

                resolve(result);
            }

            function inspect() {
                const elements = getLayoutElements();

                if (elements.overlayHost && elements.commentsContainer) {
                    finish(elements);
                }
            }

            inspect();

            if (completed) {
                return;
            }

            observer = new MutationObserver(() => {
                inspect();
            });
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

            intervalId = global.setInterval(() => {
                inspect();
            }, constants.LAYOUT_RETRY_INTERVAL_MS);

            timeoutId = global.setTimeout(() => {
                finish(null);
            }, timeoutMs);
        });
    }

    namespace.youtubeLayout = {
        findFirst,
        isWatchPage,
        getCurrentVideoId,
        getLayoutElements,
        waitForLayoutElements,
        hasMinimumWidth
    };
}(globalThis));
