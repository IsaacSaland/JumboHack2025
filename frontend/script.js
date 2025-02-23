function sendData() {
    const userInput = document.getElementById("userInput").value;

    fetch("http://127.0.0.1:5000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userInput })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("response").innerText = "Response: " + data.processed_text;
    })
    .catch(error => console.error("Error:", error));
}
