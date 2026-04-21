(function initPopup(global) {
    "use strict";

    const namespace = global.YTCW || {};
    const constants = namespace.constants || {};
    const messages = namespace.messages || {};
    const MESSAGE_TYPES = messages.MESSAGE_TYPES || {};
    const RESPONSE_STATUS = messages.RESPONSE_STATUS || {};

    const state = {
        buttonElement: null,
        statusElement: null,
        currentTab: null
    };

    /**
     * @param {string} urlString
     * @returns {boolean}
     */
    function isWatchUrl(urlString) {
        if (!urlString) {
            return false;
        }

        try {
            const url = new URL(urlString);
            return url.hostname === "www.youtube.com"
                && url.pathname === constants.WATCH_PATH
                && url.searchParams.has("v");
        } catch (error) {
            console.warn("[YT-Comment-Window] popup failed to parse URL.", error);
            return false;
        }
    }

    /**
     * @returns {Promise<chrome.tabs.Tab|null>}
     */
    async function getActiveTab() {
        const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (!tabs.length) {
            return null;
        }

        return tabs[0];
    }

    /**
     * @param {string} message
     * @param {boolean} isError
     */
    function setStatus(message, isError) {
        state.statusElement.textContent = message || "";
        state.statusElement.classList.toggle("is-error", Boolean(isError));
        state.statusElement.classList.toggle("is-success", Boolean(message) && !isError);
    }

    /**
     * @param {chrome.tabs.Tab|null} tab
     */
    function updateButtonState(tab, preserveStatus) {
        state.currentTab = tab;

        if (!tab || !isWatchUrl(tab.url)) {
            state.buttonElement.disabled = true;

            if (!preserveStatus) {
                setStatus("YouTube の通常 watch ページを開くと実行できます。", true);
            }
            return;
        }

        state.buttonElement.disabled = false;

        if (!preserveStatus) {
            setStatus("準備できました。ボタンを押すとコメント欄を右側へ移します。", false);
        }
    }

    /**
     * @param {string} status
     * @returns {{ message: string, isError: boolean }}
     */
    function getStatusMessage(status) {
        switch (status) {
        case RESPONSE_STATUS.SUCCESS:
            return {
                message: "コメント欄を右側ウィンドウへ表示しました。",
                isError: false
            };
        case RESPONSE_STATUS.ALREADY_ACTIVE:
            return {
                message: "このページではすでにコメントウィンドウ化されています。",
                isError: false
            };
        case RESPONSE_STATUS.NOT_WATCH_PAGE:
            return {
                message: "通常の YouTube watch ページでのみ利用できます。",
                isError: true
            };
        case RESPONSE_STATUS.COMMENTS_NOT_FOUND:
            return {
                message: "コメント欄の読み込みを待ってから、もう一度お試しください。",
                isError: true
            };
        case RESPONSE_STATUS.LAYOUT_NOT_FOUND:
            return {
                message: "右カラムを見つけられませんでした。画面サイズをご確認ください。",
                isError: true
            };
        case RESPONSE_STATUS.TOO_NARROW:
            return {
                message: "ブラウザ幅が狭いため起動を見送りました。少し広げてお試しください。",
                isError: true
            };
        default:
            return {
                message: "コメント欄のウィンドウ化に失敗しました。",
                isError: true
            };
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async function handleWindowModeClick() {
        try {
            const activeTab = await getActiveTab();
            updateButtonState(activeTab, false);

            if (!activeTab || !isWatchUrl(activeTab.url)) {
                return;
            }

            state.buttonElement.disabled = true;
            setStatus("YouTube ページへ開始命令を送っています...", false);

            const response = await chrome.runtime.sendMessage({
                type: MESSAGE_TYPES.POPUP_START_WINDOW_MODE
            });
            const resolved = getStatusMessage(response && response.status);
            setStatus(resolved.message, resolved.isError);
        } catch (error) {
            console.error("[YT-Comment-Window] popup failed to send start request.", error);
            setStatus("拡張機能との通信に失敗しました。ページを再読み込みしてお試しください。", true);
        } finally {
            state.buttonElement.disabled = !state.currentTab || !isWatchUrl(state.currentTab.url);
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async function initializePopup() {
        state.buttonElement = document.getElementById("windowCommentsButton");
        state.statusElement = document.getElementById("statusMessage");

        state.buttonElement.addEventListener("click", () => {
            handleWindowModeClick();
        });

        try {
            const activeTab = await getActiveTab();
            updateButtonState(activeTab, false);
        } catch (error) {
            console.error("[YT-Comment-Window] popup failed to inspect the active tab.", error);
            state.buttonElement.disabled = true;
            setStatus("タブ情報を取得できませんでした。", true);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        initializePopup();
    });
}(globalThis));
