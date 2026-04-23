"use strict";

importScripts("../shared/constants.js", "../shared/messages.js");

const namespace = globalThis.YTCW || {};
const constants = namespace.constants || {};
const messages = namespace.messages || {};
const MESSAGE_TYPES = messages.MESSAGE_TYPES || {};
const RESPONSE_STATUS = messages.RESPONSE_STATUS || {};

const CONTENT_SCRIPT_FILES = Object.freeze([
    "src/shared/constants.js",
    "src/shared/messages.js",
    "src/content/dom-selectors.js",
    "src/content/youtube-layout.js",
    "src/content/overlay-controller.js",
    "src/content/content.js"
]);

const CONTENT_CSS_FILES = Object.freeze([
    "src/content/content.css"
]);

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
 * @param {Error} error
 * @returns {boolean}
 */
function isMissingContentScriptError(error) {
    return Boolean(error && error.message && error.message.includes("Receiving end does not exist"));
}

/**
 * @param {number} tabId
 * @returns {Promise<void>}
 */
async function injectContentAssets(tabId) {
    await chrome.scripting.insertCSS({
        target: {
            tabId
        },
        files: CONTENT_CSS_FILES
    });

    await chrome.scripting.executeScript({
        target: {
            tabId
        },
        files: CONTENT_SCRIPT_FILES
    });
}

/**
 * @param {chrome.tabs.Tab} activeTab
 * @returns {Promise<{ ok: boolean, status: string }>}
 */
async function sendStartMessageToTab(activeTab) {
    const response = await chrome.tabs.sendMessage(activeTab.id, {
        type: MESSAGE_TYPES.CONTENT_START_WINDOW_MODE
    });

    if (response && response.status) {
        return response;
    }

    return {
        ok: false,
        status: RESPONSE_STATUS.ERROR,
        debugMessage: "Content script returned an empty or malformed response.",
        debugContext: {
            tabId: activeTab.id,
            tabUrl: activeTab.url,
            response
        }
    };
}

/**
 * @returns {Promise<{ ok: boolean, status: string, debugMessage?: string, debugContext?: object }>}
 */
async function startWindowModeForActiveTab() {
    const activeTab = await getActiveTab();

    if (!activeTab || typeof activeTab.id !== "number" || !isWatchUrl(activeTab.url)) {
        return {
            ok: false,
            status: RESPONSE_STATUS.NOT_WATCH_PAGE,
            debugMessage: "Active tab is not a supported YouTube watch page.",
            debugContext: {
                tabId: activeTab && typeof activeTab.id === "number" ? activeTab.id : null,
                tabUrl: activeTab && activeTab.url ? activeTab.url : null
            }
        };
    }

    try {
        return await sendStartMessageToTab(activeTab);
    } catch (error) {
        if (isMissingContentScriptError(error)) {
            try {
                await injectContentAssets(activeTab.id);
                const retryResponse = await sendStartMessageToTab(activeTab);

                if (retryResponse.debugContext) {
                    retryResponse.debugContext.wasInjectedOnDemand = true;
                }

                return retryResponse;
            } catch (retryError) {
                console.error("[YT-Comment-Window] background failed after on-demand content script injection.", retryError);
                return {
                    ok: false,
                    status: RESPONSE_STATUS.ERROR,
                    debugMessage: "Background injected the content script on demand, but retry still failed.",
                    debugContext: {
                        tabId: activeTab.id,
                        tabUrl: activeTab.url,
                        initialErrorName: error.name,
                        initialErrorMessage: error.message,
                        retryErrorName: retryError.name,
                        retryErrorMessage: retryError.message
                    }
                };
            }
        }

        console.error("[YT-Comment-Window] background failed to reach the content script.", error);
        return {
            ok: false,
            status: RESPONSE_STATUS.ERROR,
            debugMessage: "Background could not send a message to the content script.",
            debugContext: {
                tabId: activeTab.id,
                tabUrl: activeTab.url,
                errorName: error.name,
                errorMessage: error.message
            }
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
                status: RESPONSE_STATUS.ERROR,
                debugMessage: "Background failed while processing the popup request.",
                debugContext: {
                    errorName: error.name,
                    errorMessage: error.message
                }
            });
        });

    return true;
});
