// Configuration
const CONFIG = {
    DEFAULT_PREFIX: "[BE SUCCINCT] ",
    TARGET_URL: "*://chatgpt.com/*",
    INJECTION_WORLD: "MAIN"
};

class TabManager {
    constructor() {
        this.activeTabId = null;
    }

    async getOrAssignActiveTab() {
        if (this.activeTabId) return this.activeTabId;
        
        const tabs = await chrome.tabs.query({ url: CONFIG.TARGET_URL });
        if (tabs.length > 0) {
            this.activeTabId = tabs[0].id;
            return this.activeTabId;
        }
        return null;
    }

    async injectScript(tabId, func, args = []) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                world: CONFIG.INJECTION_WORLD,
                func,
                args
            });
            console.log(`✅ Script injected successfully on tab ${tabId}`);
        } catch (error) {
            console.error(`⚠️ Injection failed on tab ${tabId}:`, error);
            throw error;
        }
    }
}

class MessageHandler {
    constructor(tabManager) {
        this.tabManager = tabManager;
    }

    async handleUpdatePatcher(message) {
        const newPrefix = message.enabled ? CONFIG.DEFAULT_PREFIX : "";
        console.log("🔵 Handling updatePatcher:", message.enabled);

        const tabId = await this.tabManager.getOrAssignActiveTab();
        if (!tabId) {
            throw new Error("No eligible tab found");
        }

        await this.tabManager.injectScript(tabId, (prefix) => {
            window.__patcherPrefix = prefix;
            console.log("✅ Updated prefix to:", prefix);
        }, [newPrefix]);

        return { status: "success" };
    }
}

// Initialize managers
const tabManager = new TabManager();
const messageHandler = new MessageHandler(tabManager);

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updatePatcher") {
        messageHandler.handleUpdatePatcher(message)
            .then(sendResponse)
            .catch(error => sendResponse({ 
                status: "error", 
                message: error.message 
            }));
        return true;
    }
});

// Tab update listener
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url?.includes("chatgpt.com")) {
        const activeTabId = await tabManager.getOrAssignActiveTab();
        if (tabId === activeTabId) {
            await tabManager.injectScript(tabId, function patchFetchAndXHR() {
                if (window.__fetch_patched) return;
                window.__fetch_patched = true;

                console.log("🔧 Applying request interceptors");
                window.__patcherPrefix = window.__patcherPrefix ?? "[BE SUCCINCT] ";

                // Patch fetch
                const originalFetch = window.fetch;
                window.fetch = async function(input, init) {
                    const options = { ...init };
                    if (options.body && typeof options.body === "string") {
                        try {
                            const bodyData = JSON.parse(options.body);
                            if (Array.isArray(bodyData.messages)) {
                                bodyData.messages.forEach(msg => {
                                    if (Array.isArray(msg?.content?.parts)) {
                                        msg.content.parts = msg.content.parts.map(
                                            part => window.__patcherPrefix + part
                                        );
                                    }
                                });
                                options.body = JSON.stringify(bodyData);
                            }
                        } catch (e) {
                            console.warn("Failed to parse fetch body:", e);
                        }
                    }
                    return originalFetch(input, options);
                };

                // Patch XHR
                const originalSend = XMLHttpRequest.prototype.send;
                XMLHttpRequest.prototype.send = function(body) {
                    if (this._url?.includes("/conversation") && body && typeof body === "string") {
                        try {
                            const parsedBody = JSON.parse(body);
                            if (Array.isArray(parsedBody.messages)) {
                                parsedBody.messages.forEach(msg => {
                                    if (Array.isArray(msg?.content?.parts)) {
                                        msg.content.parts = msg.content.parts.map(
                                            part => window.__patcherPrefix + part
                                        );
                                    }
                                });
                                body = JSON.stringify(parsedBody);
                            }
                        } catch (e) {
                            console.warn("Failed to parse XHR body:", e);
                        }
                    }
                    return originalSend.call(this, body);
                };
            });
        }
    }
});