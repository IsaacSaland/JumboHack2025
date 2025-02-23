document.addEventListener("DOMContentLoaded", function () {
        const textInput = document.getElementById("textInput");
        const countButton = document.getElementById("countButton");
        const fileInput = document.getElementById("fileInput");
        const countFileButton = document.getElementById("countFileButton");
        const resultParagraph = document.getElementById("result");
        const currentSessionTokensSpan = document.getElementById("currentSessionTokens");
        const lifetimeTokensSpan = document.getElementById("lifetimeTokens");
        const energyUsageSpan = document.getElementById("totalEnergyUsage");
        const co2emissions = document.getElementById("totalCO2");
        const totalwater = document.getElementById("totalwater");

        let currentSessionTokens = 0;
        let lifetimeTokens = 0;
        let co2emissionsnum = 0;


        chrome.storage.local.get("lifetimeTokens", function (data) {
        if (data.lifetimeTokens) {
                lifetimeTokens = data.lifetimeTokens;

                energyUsageSpan.textContent = lifetimeTokens * 4 +" J";
                // co2 emmissions = energy in Kwh * avg world carbon intensity
                co2emissionsnum = ((lifetimeTokens * 4 * 475)/3600000).toExponential(2);
                co2emissions.textContent = co2emissionsnum + " g of Co2";
                totalwater.textContent = (lifetimeTokens * 0.67).toFixed(2) + " ml"

                lifetimeTokensSpan.textContent = lifetimeTokens;
        }
        });

        function updateTokenUsage() {
                currentSessionTokensSpan.textContent = currentSessionTokens;
                lifetimeTokensSpan.textContent = lifetimeTokens;

                const totalEnergyUsage = lifetimeTokens * 4;
                totalwater.textContent = (lifetimeTokens * 0.67).toFixed(2) + " ml"
                document.getElementById("totalEnergyUsage").textContent = totalEnergyUsage + " J";
                co2emissionsnum = ((lifetimeTokens * 4 * 475)/3600000).toExponential(2);
                co2emissions.textContent = co2emissionsnum + " g of Co2";
        }

        function saveLifetimeTokens() {
                chrome.storage.local.set({ lifetimeTokens: lifetimeTokens });
        }

        document.getElementById("fileInput").addEventListener("change", function () {
                const file = this.files[0];
                const fileUploadStatus = document.getElementById("fileUploadStatus");
                if (file) {
                        fileUploadStatus.textContent = `File selected: ${file.name}`;
                } else {
                        fileUploadStatus.textContent = "No file selected";
                }
        });
        
        countButton.addEventListener("click", function () {
                const text = textInput.value;
                if (!text) {
                        resultParagraph.textContent = "Please enter some text.";
                        return;
                }
                const tokenCount = countTokens(text);
                currentSessionTokens += tokenCount;
                lifetimeTokens += tokenCount;
                updateTokenUsage();
                saveLifetimeTokens();
        });

        countFileButton.addEventListener("click", function () {
                const file = fileInput.files[0];
                if (!file) {
                        resultParagraph.textContent = "Please upload a file.";
                        return;
                }
                extractTextFromFile(file)
                .then((text) => {
                        const tokenCount = countTokens(text);
                        currentSessionTokens += tokenCount;
                        lifetimeTokens += tokenCount;
                        updateTokenUsage();
                        saveLifetimeTokens();
                })
                .catch((error) => {
                        console.error("Error extracting text:", error);
                        resultParagraph.textContent = "Failed to extract text from the file.";
                });
        });

        function countTokens(text) {
                try {
                        const tokens = GPTTokenizer_cl100k_base.encode(text);
                        const tokenCount = tokens.length;
                        const energy = tokenCount * 4;
                        let co2 = ((energy * 475)/3600000).toExponential(2);
                        let water = (tokenCount * 0.67).toFixed(2) + " ml"
                        resultParagraph.textContent = `Token count: ${tokenCount}\nEnergy Used: ${energy} J\nCO2 emmited: ${co2} g of Co2\nWater Wasted: ${water}`;
                        return tokenCount;
                } catch (error) {
                        console.error("Error counting tokens:", error);
                        resultParagraph.textContent = "An error occurred while counting tokens.";
                        return 0;
                }
        }

        function extractTextFromFile(file) {
                return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                        if (file.type === "application/pdf") {
                                const data = new Uint8Array(reader.result);
                                extractTextFromPDF(data).then(resolve).catch(reject);
                        } else if (file.type === "text/plain") {
                                const text = reader.result;
                                resolve(text);
                        } else if (
                                file.type ===
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                                file.type === "application/msword"
                        ) {
                                extractTextFromWord(file).then(resolve).catch(reject);
                        } else {
                                reject(new Error("Unsupported file type."));
                        }
                };
                reader.onerror = () => {
                        reject(new Error("Failed to read the file."));
                };
                if (file.type === "application/pdf") {
                        reader.readAsArrayBuffer(file);
                } else if (file.type === "text/plain") {
                        reader.readAsText(file);
                } else if (
                        file.type ===
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                        file.type === "application/msword"
                ) {
                        reader.readAsArrayBuffer(file);
                } else {
                        reject(new Error("Unsupported file type."));
                }
        });
        }

        function extractTextFromPDF(data) {
                return new Promise((resolve, reject) => {
                const loadingTask = pdfjsLib.getDocument({ data });
                loadingTask.promise
                        .then(pdf => {
                                let text = "";
                                const numPages = pdf.numPages;
                                const pagePromises = [];
                                for (let i = 1; i <= numPages; i++) {
                                        pagePromises.push(
                                        pdf.getPage(i).then(page => {
                                        return page.getTextContent().then(textContent => {
                                        text += textContent.items.map(item => item.str).join(" ");
                                });
                                })
                        );
                        }
                        Promise.all(pagePromises)
                        .then(() => {
                                resolve(text);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
        }

        function extractTextFromWord(file) {
                return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function (event) {
                        const arrayBuffer = event.target.result;
                        mammoth.extractRawText({ arrayBuffer })
                        .then(result => resolve(result.value))
                        .catch(reject);
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
        });
        }
});

document.addEventListener("DOMContentLoaded", function () {
        const patchToggle = document.getElementById("patchToggle");

        // Load saved state from Chrome Storage (default to true if not set)
        chrome.storage.sync.get(["patchEnabled"], function (data) {
            if (data.patchEnabled === undefined) {
                chrome.storage.sync.set({ patchEnabled: true }, function () {
                    patchToggle.checked = true; // Default state is checked (true)
                });
            } else {
                patchToggle.checked = data.patchEnabled;
            }
        });

        // Toggle Patcher Behavior (Change the prepended text)
        patchToggle.addEventListener("change", function () {
            const isEnabled = patchToggle.checked;
            chrome.storage.sync.set({ patchEnabled: isEnabled });

            console.log("🔵 Sending message to background to", isEnabled ? "ENABLE" : "DISABLE");

            chrome.runtime.sendMessage({ action: "updatePatcher", enabled: isEnabled }, function(response) {
                console.log("🟢 Background response received:", response);
            });
        });
    });