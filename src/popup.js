document.addEventListener('DOMContentLoaded', function () {
    const counterElement = document.getElementById('counter');
    const increaseButton = document.getElementById('increase');
    const decreaseButton = document.getElementById('decrease');

    function updateCounter(value) {
        chrome.storage.local.set({ counter: value });
        counterElement.textContent = value;
        chrome.runtime.sendMessage({ counter: value });
    }

    chrome.storage.local.get(['counter'], function (result) {
        counterElement.textContent = result.counter || 0;
    });

    increaseButton.addEventListener('click', () => {
        chrome.storage.local.get(['counter'], function (result) {
            updateCounter((result.counter || 0) + 1);
        });
    });

    decreaseButton.addEventListener('click', () => {
        chrome.storage.local.get(['counter'], function (result) {
            updateCounter((result.counter || 0) - 1);
        });
    });
});
