// Listen for messages from popup.js to toggle patching
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "updatePatcher") {
        const newPrefix = message.enabled ? "[BE SUCCINT] " : "";

        console.log("🔵 Received updatePatcher message:", message.enabled);

        // Define a function that will run inside the page to update the global variable
        function setPrefix(prefix) {
            window.__patcherPrefix = prefix;
            console.log("✅ Updated window.__patcherPrefix to:", prefix);
        }

        // For each open ChatGPT tab, execute the script that updates the global variable
        const tabs = await chrome.tabs.query({ url: "*://chatgpt.com/*" });
        for (let tab of tabs) {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                world: "MAIN",
                func: setPrefix,
                args: [newPrefix]
            });
        }
    }
});

// Inject the patch function when a tab loads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url?.includes("chatgpt.com")) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: "MAIN",
            func: patchFetchAndXHR
        }).then(() => {
            console.log("✅ Injected patcher on chatgpt.com");
        }).catch((err) => {
            console.warn("⚠️ Injection failed", err);
        });
    }
});

// Function to patch fetch/XHR using the global variable
function patchFetchAndXHR() {
    if (window.__fetch_patched) return;
    window.__fetch_patched = true;

    console.log("🔧 Applying fetch/XHR patch, will use window.__patcherPrefix");

    // Ensure the global variable exists
    if (typeof window.__patcherPrefix === "undefined") {
        window.__patcherPrefix = "[BE SUCCINT] ";
    }

    // Patch fetch
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        const options = init || {};
        if (options.body && typeof options.body === "string") {
            try {
                let bodyData = JSON.parse(options.body);
                if (Array.isArray(bodyData.messages)) {
                    bodyData.messages.forEach((msg) => {
                        if (Array.isArray(msg?.content?.parts)) {
                            msg.content.parts = msg.content.parts.map(
                                (part) => window.__patcherPrefix + part // ✅ Use global variable
                            );
                        }
                    });
                    options.body = JSON.stringify(bodyData);
                }
            } catch (e) {}
        }
        return originalFetch(input, options);
    };

    // Patch XMLHttpRequest
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body) {
        if (this._url?.includes("/conversation") && body && typeof body === "string") {
            try {
                let parsedBody = JSON.parse(body);
                if (Array.isArray(parsedBody.messages)) {
                    parsedBody.messages.forEach((msg) => {
                        if (Array.isArray(msg?.content?.parts)) {
                            msg.content.parts = msg.content.parts.map(
                                (part) => window.__patcherPrefix + part // ✅ Use global variable
                            );
                        }
                    });
                    body = JSON.stringify(parsedBody);
                }
            } catch (e) {}
        }
        return originalSend.call(this, body);
    };
}