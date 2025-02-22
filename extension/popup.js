// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
        // Get references to the elements
        const textInput = document.getElementById('textInput');
        const countButton = document.getElementById('countButton');
        const resultParagraph = document.getElementById('result');

        // Add a click event listener to the button
        countButton.addEventListener('click', function () {
            // Get the text from the textarea
                const text = textInput.value;

            // Check if the text is empty
                if (!text) {
                        resultParagraph.textContent = 'Please enter some text.';
                        return;
                }

            // Use the GPT tokenizer to count tokens
                try {
                // Assuming GPTTokenizer_cl100k_base is available globally from cl100k_base.js
                        const tokens = GPTTokenizer_cl100k_base.encode(text);
                        const tokenCount = tokens.length;

                // Display the result
                        resultParagraph.textContent = `Token count: ${tokenCount}`;
                } catch (error) {
                        // Handle errors (e.g., if the tokenizer is not available)
                        console.error('Error counting tokens:', error);
                        resultParagraph.textContent = 'An error occurred while counting tokens.';
                }
        });
});