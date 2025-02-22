chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ counter: 0 });
});