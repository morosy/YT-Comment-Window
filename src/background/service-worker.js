"use strict";

importScripts("../shared/constants.js", "../shared/messages.js");

const namespace = globalThis.YTCW || {};
const constants = namespace.constants || {};
const messages = namespace.messages || {};
const MESSAGE_TYPES = messages.MESSAGE_TYPES || {};
const RESPONSE_STATUS = messages.RESPONSE_STATUS || {};

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
        console.warn("[YT-Comment-Window] background failed to parse tab URL.", error);
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
 * @returns {Promise<{ ok: boolean, status: string }>}
 */
async function startWindowModeForActiveTab() {
    const activeTab = await getActiveTab();

    if (!activeTab || typeof activeTab.id !== "number" || !isWatchUrl(activeTab.url)) {
        return {
            ok: false,
            status: RESPONSE_STATUS.NOT_WATCH_PAGE
        };
    }

    try {
        const response = await chrome.tabs.sendMessage(activeTab.id, {
            type: MESSAGE_TYPES.CONTENT_START_WINDOW_MODE
        });

        if (response && response.status) {
            return response;
        }

        return {
            ok: false,
            status: RESPONSE_STATUS.ERROR
        };
    } catch (error) {
        console.error("[YT-Comment-Window] background failed to reach the content script.", error);
        return {
            ok: false,
            status: RESPONSE_STATUS.ERROR
        };
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== MESSAGE_TYPES.POPUP_START_WINDOW_MODE) {
        return undefined;
    }

    startWindowModeForActiveTab()
        .then((response) => {
            sendResponse(response);
        })
        .catch((error) => {
            console.error("[YT-Comment-Window] background failed to process popup request.", error);
            sendResponse({
                ok: false,
                status: RESPONSE_STATUS.ERROR
            });
        });

    return true;
});
