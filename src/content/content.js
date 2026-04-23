(function initContentScript(global) {
    "use strict";

    const namespace = global.YTCW = global.YTCW || {};
    const constants = namespace.constants || {};
    const messages = namespace.messages || {};
    const youtubeLayout = namespace.youtubeLayout || {};
    const overlayController = namespace.overlayController || {};
    const MESSAGE_TYPES = messages.MESSAGE_TYPES || {};
    const RESPONSE_STATUS = messages.RESPONSE_STATUS || {};

    if (namespace.contentScriptInitialized) {
        return;
    }

    namespace.contentScriptInitialized = true;

    let lastKnownUrl = global.location.href;
    let navigationTimerId = 0;

    /**
     * @returns {Promise<{ ok: boolean, status: string }>}
     */
    async function handleStartMessage() {
        if (!youtubeLayout.isWatchPage()) {
            return {
                ok: false,
                status: RESPONSE_STATUS.NOT_WATCH_PAGE,
                debugMessage: "Content script received a start message outside a YouTube watch page.",
                debugContext: {
                    url: global.location.href
                }
            };
        }

        return overlayController.startWindowMode();
    }

    /**
     * @returns {{ ok: boolean, status: string }}
     */
    function handleCloseMessage() {
        return overlayController.closeWindowMode();
    }

    function checkNavigation() {
        if (global.location.href === lastKnownUrl) {
            overlayController.cleanupOrphanedOverlay();
            return;
        }

        lastKnownUrl = global.location.href;
        overlayController.handleNavigationChange();
    }

    function scheduleNavigationCheck() {
        if (navigationTimerId) {
            global.clearTimeout(navigationTimerId);
        }

        navigationTimerId = global.setTimeout(() => {
            checkNavigation();
        }, constants.SPA_GUARD_DEBOUNCE_MS);
    }

    function installSpaGuards() {
        global.addEventListener("yt-navigate-finish", () => {
            scheduleNavigationCheck();
        }, true);

        global.addEventListener("popstate", () => {
            scheduleNavigationCheck();
        }, true);

        const observer = new MutationObserver(() => {
            if (global.location.href !== lastKnownUrl) {
                scheduleNavigationCheck();
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!message || !message.type) {
            return undefined;
        }

        if (message.type === MESSAGE_TYPES.CONTENT_START_WINDOW_MODE) {
            handleStartMessage()
                .then((response) => {
                    sendResponse(response);
                })
                .catch((error) => {
                    console.error("[YT-Comment-Window] content failed to activate window mode.", error);
                    sendResponse({
                        ok: false,
                        status: RESPONSE_STATUS.ERROR,
                        debugMessage: "Content script threw while activating window mode.",
                        debugContext: {
                            errorName: error.name,
                            errorMessage: error.message,
                            url: global.location.href
                        }
                    });
                });
            return true;
        }

        if (message.type === MESSAGE_TYPES.CONTENT_CLOSE_WINDOW_MODE) {
            sendResponse(handleCloseMessage());
            return false;
        }

        return undefined;
    });

    installSpaGuards();
}(globalThis));
