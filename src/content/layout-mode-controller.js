(function initLayoutModeController(global) {
    "use strict";

    const namespace = global.YTCW = global.YTCW || {};
    const constants = namespace.constants || {};
    const youtubeLayout = namespace.youtubeLayout || {};

    const state = {
        currentVideoId: null,
        isCommentsMode: false,
        commentButton: null,
        chipContainer: null,
        chipHostChild: null,
        chipBarHostChild: null,
        secondaryInner: null,
        layoutPanel: null,
        commentsNode: null,
        originalParent: null,
        originalNextSibling: null,
        hiddenNodes: []
    };

    /**
     * @returns {HTMLButtonElement}
     */
    function createCommentButton() {
        const button = document.createElement("button");
        button.id = constants.LAYOUT_COMMENT_BUTTON_ID;
        button.type = "button";
        button.className = "ytcw-layout-chip";
        button.textContent = "コメント";
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await activateCommentsModeFromCurrentDom();
        });
        return button;
    }

    /**
     * @returns {HTMLDivElement}
     */
    function createLayoutPanel() {
        const panel = document.createElement("div");
        panel.id = constants.LAYOUT_PANEL_ID;
        panel.className = "ytcw-layout-panel";
        return panel;
    }

    /**
     * @param {Element} element
     * @returns {boolean}
     */
    function isCommentButtonTarget(element) {
        return Boolean(element && state.commentButton && element.closest(`#${constants.LAYOUT_COMMENT_BUTTON_ID}`));
    }

    /**
     * @param {Element} element
     * @returns {boolean}
     */
    function isChipInteractionTarget(element) {
        return Boolean(element && element.closest("button, yt-chip-cloud-chip-renderer"));
    }

    /**
     * @param {boolean} isActive
     */
    function setCommentButtonState(isActive) {
        if (!state.commentButton) {
            return;
        }

        state.commentButton.classList.toggle("is-active", isActive);
        state.commentButton.setAttribute("aria-pressed", isActive ? "true" : "false");
    }

    function showHiddenNodes() {
        for (const node of state.hiddenNodes) {
            node.classList.remove("ytcw-secondary-hidden");
        }

        state.hiddenNodes = [];
    }

    function hideSecondarySiblings() {
        if (!state.secondaryInner || !state.layoutPanel) {
            return;
        }

        showHiddenNodes();

        const hiddenNodes = [];
        const outerKeepNodes = new Set([
            state.layoutPanel,
            state.chipHostChild,
            state.chipBarHostChild
        ]);

        for (const child of Array.from(state.secondaryInner.children)) {
            if (!outerKeepNodes.has(child)) {
                hiddenNodes.push(child);
            }
        }

        if (state.chipHostChild && state.chipHostChild !== state.secondaryInner) {
            const innerKeepNodes = new Set([
                state.layoutPanel,
                state.chipBarHostChild
            ]);

            for (const child of Array.from(state.chipHostChild.children)) {
                if (!innerKeepNodes.has(child)) {
                    hiddenNodes.push(child);
                }
            }
        }

        state.hiddenNodes = hiddenNodes;

        for (const node of state.hiddenNodes) {
            node.classList.add("ytcw-secondary-hidden");
        }
    }

    function restoreCommentsNode() {
        if (!state.commentsNode) {
            return;
        }

        state.commentsNode.removeAttribute(constants.LAYOUT_RELOCATED_ATTRIBUTE);

        if (!state.originalParent) {
            return;
        }

        if (state.originalNextSibling && state.originalParent.contains(state.originalNextSibling)) {
            state.originalParent.insertBefore(state.commentsNode, state.originalNextSibling);
            return;
        }

        state.originalParent.appendChild(state.commentsNode);
    }

    function ensureLayoutPanel() {
        if (!state.secondaryInner) {
            return null;
        }

        if (!state.layoutPanel || !state.layoutPanel.isConnected) {
            state.layoutPanel = createLayoutPanel();
        }

        if (!state.layoutPanel.isConnected) {
            if (state.chipBarHostChild && state.chipBarHostChild.parentElement) {
                state.chipBarHostChild.insertAdjacentElement("afterend", state.layoutPanel);
            } else if (state.chipHostChild && state.chipHostChild.parentElement === state.secondaryInner) {
                state.chipHostChild.insertAdjacentElement("afterend", state.layoutPanel);
            } else {
                state.secondaryInner.prepend(state.layoutPanel);
            }
        }

        return state.layoutPanel;
    }

    /**
     * @param {boolean} shouldWait
     * @returns {Promise<boolean>}
     */
    async function refreshLayoutReferences(shouldWait) {
        const elements = shouldWait
            ? await youtubeLayout.waitForLayoutElements({
                timeoutMs: constants.LAYOUT_WAIT_TIMEOUT_MS,
                requireChipContainer: true
            })
            : youtubeLayout.getLayoutElements();

        if (!elements || !elements.secondaryInner || !elements.commentsContainer) {
            return false;
        }

        state.secondaryInner = elements.secondaryInner;
        state.commentsNode = elements.commentsContainer;
        state.chipHostChild = elements.secondaryChipHostChild;
        state.chipBarHostChild = elements.secondaryChipBarHostChild;

        if (!state.originalParent) {
            state.originalParent = state.commentsNode.parentNode;
            state.originalNextSibling = state.commentsNode.nextSibling;
        }

        if (elements.secondaryChipContainer) {
            ensureCommentButton(elements);
        }

        return true;
    }

    function deactivateCommentsMode() {
        restoreCommentsNode();
        showHiddenNodes();
        setCommentButtonState(false);

        if (state.layoutPanel && state.layoutPanel.isConnected) {
            state.layoutPanel.remove();
        }

        state.isCommentsMode = false;
    }

    function activateCommentsMode() {
        if (!state.commentsNode || !state.secondaryInner) {
            return;
        }

        const panel = ensureLayoutPanel();

        if (!panel) {
            return;
        }

        if (!state.originalParent) {
            state.originalParent = state.commentsNode.parentNode;
            state.originalNextSibling = state.commentsNode.nextSibling;
        }

        state.commentsNode.setAttribute(constants.LAYOUT_RELOCATED_ATTRIBUTE, "true");
        panel.appendChild(state.commentsNode);
        hideSecondarySiblings();
        setCommentButtonState(true);
        state.isCommentsMode = true;
    }

    /**
     * @returns {Promise<void>}
     */
    async function activateCommentsModeFromCurrentDom() {
        const didRefresh = await refreshLayoutReferences(true);

        if (!didRefresh) {
            return;
        }

        activateCommentsMode();
    }

    /**
     * @param {MouseEvent} event
     */
    function handleChipContainerClick(event) {
        const target = event.target instanceof Element ? event.target : null;

        if (!target || !state.isCommentsMode) {
            return;
        }

        if (isCommentButtonTarget(target)) {
            return;
        }

        if (!isChipInteractionTarget(target)) {
            return;
        }

        global.setTimeout(() => {
            deactivateCommentsMode();
        }, 0);
    }

    /**
     * @param {ReturnType<youtubeLayout.getLayoutElements>} elements
     */
    function ensureCommentButton(elements) {
        if (!elements.secondaryChipContainer) {
            return;
        }

        const existingButton = elements.secondaryChipContainer.querySelector(`#${constants.LAYOUT_COMMENT_BUTTON_ID}`);

        if (existingButton) {
            state.commentButton = existingButton;
        } else {
            state.commentButton = createCommentButton();
            elements.secondaryChipContainer.prepend(state.commentButton);
        }

        if (state.chipContainer !== elements.secondaryChipContainer) {
            if (state.chipContainer) {
                state.chipContainer.removeEventListener("click", handleChipContainerClick, true);
            }

            state.chipContainer = elements.secondaryChipContainer;
            state.chipContainer.addEventListener("click", handleChipContainerClick, true);
        }
    }

    function clearDetachedState() {
        if (state.commentButton && !state.commentButton.isConnected) {
            state.commentButton = null;
        }

        if (state.layoutPanel && !state.layoutPanel.isConnected) {
            state.layoutPanel = null;
        }

        if (state.commentsNode && !state.commentsNode.isConnected && state.commentsNode.parentNode !== state.layoutPanel) {
            state.commentsNode = null;
            state.originalParent = null;
            state.originalNextSibling = null;
        }
    }

    function teardown() {
        deactivateCommentsMode();

        if (state.chipContainer) {
            state.chipContainer.removeEventListener("click", handleChipContainerClick, true);
        }

        if (state.commentButton && state.commentButton.isConnected) {
            state.commentButton.remove();
        }

        state.currentVideoId = null;
        state.commentButton = null;
        state.chipContainer = null;
        state.chipHostChild = null;
        state.chipBarHostChild = null;
        state.secondaryInner = null;
        state.layoutPanel = null;
        state.commentsNode = null;
        state.originalParent = null;
        state.originalNextSibling = null;
        state.hiddenNodes = [];
    }

    /**
     * @returns {Promise<void>}
     */
    async function syncToCurrentPage() {
        clearDetachedState();

        if (!youtubeLayout.isWatchPage() || !youtubeLayout.hasMinimumWidth()) {
            teardown();
            return;
        }

        const currentVideoId = youtubeLayout.getCurrentVideoId();

        if (state.currentVideoId && state.currentVideoId !== currentVideoId) {
            teardown();
        }

        const elements = await youtubeLayout.waitForLayoutElements({
            timeoutMs: constants.LAYOUT_WAIT_TIMEOUT_MS,
            requireChipContainer: true
        });

        if (!elements || !elements.secondaryInner || !elements.commentsContainer || !elements.secondaryChipContainer) {
            return;
        }

        state.currentVideoId = currentVideoId;
        await refreshLayoutReferences(false);
        await activateCommentsModeFromCurrentDom();
    }

    namespace.layoutModeController = {
        syncToCurrentPage,
        activateCommentsModeFromCurrentDom,
        deactivateCommentsMode,
        teardown
    };
}(globalThis));
