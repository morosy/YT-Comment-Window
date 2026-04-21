(function initOverlayController(global) {
    "use strict";

    const namespace = global.YTCW = global.YTCW || {};
    const constants = namespace.constants || {};
    const messages = namespace.messages || {};
    const RESPONSE_STATUS = messages.RESPONSE_STATUS || {};
    const youtubeLayout = namespace.youtubeLayout || {};

    const state = {
        isWindowMode: false,
        originalParent: null,
        originalNextSibling: null,
        overlayRoot: null,
        overlayBody: null,
        commentsNode: null,
        currentVideoId: null
    };

    /**
     * @returns {HTMLButtonElement}
     */
    function createCloseButton() {
        const button = document.createElement("button");
        button.id = constants.OVERLAY_CLOSE_BUTTON_ID;
        button.type = "button";
        button.className = "ytcw-overlay__close";
        button.textContent = "閉じる";
        button.addEventListener("click", () => {
            closeWindowMode();
        });
        return button;
    }

    /**
     * @returns {{ root: HTMLSectionElement, body: HTMLDivElement }}
     */
    function createOverlayElements() {
        const root = document.createElement("section");
        root.id = constants.OVERLAY_ID;
        root.className = constants.CSS_ROOT_CLASS;

        const header = document.createElement("header");
        header.className = "ytcw-overlay__header";

        const title = document.createElement("h2");
        title.className = "ytcw-overlay__title";
        title.textContent = "コメント";

        const body = document.createElement("div");
        body.id = constants.OVERLAY_BODY_ID;
        body.className = "ytcw-overlay__body";

        header.appendChild(title);
        header.appendChild(createCloseButton());
        root.appendChild(header);
        root.appendChild(body);

        return {
            root,
            body
        };
    }

    function clearState() {
        state.isWindowMode = false;
        state.originalParent = null;
        state.originalNextSibling = null;
        state.overlayRoot = null;
        state.overlayBody = null;
        state.commentsNode = null;
        state.currentVideoId = null;
        document.documentElement.classList.remove(constants.CSS_ACTIVE_CLASS);
    }

    function detachOverlay() {
        if (state.overlayRoot && state.overlayRoot.isConnected) {
            state.overlayRoot.remove();
        }
    }

    function restoreCommentsNode() {
        if (!state.commentsNode) {
            return;
        }

        state.commentsNode.removeAttribute(constants.COMMENT_RELOCATED_ATTRIBUTE);

        if (!state.originalParent) {
            return;
        }

        if (state.originalNextSibling && state.originalParent.contains(state.originalNextSibling)) {
            state.originalParent.insertBefore(state.commentsNode, state.originalNextSibling);
            return;
        }

        state.originalParent.appendChild(state.commentsNode);
    }

    /**
     * @param {{
     *     overlayHost: Element|null,
     *     commentsContainer: Element|null
     * }} elements
     * @returns {{ ok: boolean, status: string }}
     */
    function moveCommentsIntoOverlay(elements) {
        if (!elements.overlayHost) {
            return {
                ok: false,
                status: RESPONSE_STATUS.LAYOUT_NOT_FOUND
            };
        }

        if (!elements.commentsContainer) {
            return {
                ok: false,
                status: RESPONSE_STATUS.COMMENTS_NOT_FOUND
            };
        }

        const overlay = createOverlayElements();
        state.originalParent = elements.commentsContainer.parentNode;
        state.originalNextSibling = elements.commentsContainer.nextSibling;
        state.commentsNode = elements.commentsContainer;
        state.overlayRoot = overlay.root;
        state.overlayBody = overlay.body;

        state.commentsNode.setAttribute(constants.COMMENT_RELOCATED_ATTRIBUTE, "true");
        state.overlayBody.appendChild(state.commentsNode);
        elements.overlayHost.prepend(state.overlayRoot);
        document.documentElement.classList.add(constants.CSS_ACTIVE_CLASS);

        return {
            ok: true,
            status: RESPONSE_STATUS.SUCCESS
        };
    }

    /**
     * @returns {Promise<{ ok: boolean, status: string }>}
     */
    async function startWindowMode() {
        if (!youtubeLayout.isWatchPage()) {
            return {
                ok: false,
                status: RESPONSE_STATUS.NOT_WATCH_PAGE
            };
        }

        if (!youtubeLayout.hasMinimumWidth()) {
            return {
                ok: false,
                status: RESPONSE_STATUS.TOO_NARROW
            };
        }

        if (state.isWindowMode && state.overlayRoot && state.overlayRoot.isConnected) {
            return {
                ok: true,
                status: RESPONSE_STATUS.ALREADY_ACTIVE
            };
        }

        const elements = await youtubeLayout.waitForLayoutElements({
            timeoutMs: constants.LAYOUT_WAIT_TIMEOUT_MS
        });

        if (!elements) {
            const currentLayout = youtubeLayout.getLayoutElements();

            if (!currentLayout.overlayHost) {
                return {
                    ok: false,
                    status: RESPONSE_STATUS.LAYOUT_NOT_FOUND
                };
            }

            return {
                ok: false,
                status: RESPONSE_STATUS.COMMENTS_NOT_FOUND
            };
        }

        const response = moveCommentsIntoOverlay(elements);

        if (response.ok) {
            state.isWindowMode = true;
            state.currentVideoId = youtubeLayout.getCurrentVideoId();
        }

        return response;
    }

    /**
     * @returns {{ ok: boolean, status: string }}
     */
    function closeWindowMode() {
        if (!state.isWindowMode && !state.overlayRoot) {
            return {
                ok: true,
                status: RESPONSE_STATUS.NOT_ACTIVE
            };
        }

        try {
            restoreCommentsNode();
        } catch (error) {
            console.error("[YT-Comment-Window] failed to restore the comments node.", error);
        }

        detachOverlay();
        clearState();

        return {
            ok: true,
            status: RESPONSE_STATUS.SUCCESS
        };
    }

    function cleanupOrphanedOverlay() {
        if (state.overlayRoot && !state.overlayRoot.isConnected) {
            clearState();
        }
    }

    function handleNavigationChange() {
        cleanupOrphanedOverlay();

        if (!state.currentVideoId) {
            return;
        }

        const nextVideoId = youtubeLayout.getCurrentVideoId();

        if (!youtubeLayout.isWatchPage() || nextVideoId !== state.currentVideoId) {
            closeWindowMode();
        }
    }

    namespace.overlayController = {
        startWindowMode,
        closeWindowMode,
        handleNavigationChange,
        cleanupOrphanedOverlay
    };
}(globalThis));
