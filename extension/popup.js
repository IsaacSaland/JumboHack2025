document.addEventListener("DOMContentLoaded", function () {
        const textInput = document.getElementById("textInput");
        const countButton = document.getElementById("countButton");
        const fileInput = document.getElementById("fileInput");
        const countFileButton = document.getElementById("countFileButton");
        const resultParagraph = document.getElementById("result");
        const currentSessionTokensSpan = document.getElementById("currentSessionTokens");
        const lifetimeTokensSpan = document.getElementById("lifetimeTokens");

        let currentSessionTokens = 0;
        let lifetimeTokens = 0;

        chrome.storage.local.get("lifetimeTokens", function (data) {
        if (data.lifetimeTokens) {
                lifetimeTokens = data.lifetimeTokens;
                lifetimeTokensSpan.textContent = lifetimeTokens;
        }
        });

        function updateTokenUsage() {
                currentSessionTokensSpan.textContent = currentSessionTokens;
                lifetimeTokensSpan.textContent = lifetimeTokens;
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
                        resultParagraph.textContent = `Token count: ${tokenCount}`;
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