// Constants for energy and emissions calculations
const WATER_PER_KWH = 1.8; // PROBABLY CHANGE THIS NUMBER
const CARBON_INTENSITY = 47.5; // g CO₂ per kWh (global average) PROBABLY CHANGE

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

            // Calculate energy consumption
            const energyConsumption = (tokenCount / 1000) * ENERGY_PER_1000_TOKENS; // kWh

            // Calculate water usage
            const waterUsage = energyConsumption * WATER_PER_KWH * 1000; // Milliliters

            // Calculate carbon emissions
            const carbonEmissions = energyConsumption * CARBON_INTENSITY * 1000; // g CO₂

            // Display the result
            resultParagraph.innerHTML = `
                📝 Token count: ${tokenCount} <br>
                💧 Water used: ${waterUsage.toFixed(6)} Milliliters <br>
                🌍 Carbon emissions: ${carbonEmissions.toFixed(6)} g CO₂ <br>
            `;
        } catch (error) {
            // Handle errors (e.g., if the tokenizer is not available)
            console.error('Error counting tokens:', error);
            resultParagraph.textContent = 'An error occurred while counting tokens.';
        }
    });
});