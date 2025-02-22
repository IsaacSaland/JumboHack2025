// Create a div for the Wikipedia content
const wikiDiv = document.createElement('div');
wikiDiv.style.position = 'fixed';
wikiDiv.style.bottom = '50px';
wikiDiv.style.right = '10px';
wikiDiv.style.background = 'white';
wikiDiv.style.padding = '10px';
wikiDiv.style.border = '1px solid black';
wikiDiv.style.width = '300px';
wikiDiv.style.zIndex = '1000';
document.body.appendChild(wikiDiv);

// Function to fetch Wikipedia content
async function fetchWikipediaSummary(topic) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.extract) {
            wikiDiv.innerHTML = `<strong>Wikipedia:</strong> ${data.extract}`;
        } else {
            wikiDiv.innerHTML = `<strong>Wikipedia:</strong> No summary available.`;
        }
    } catch (error) {
        wikiDiv.innerHTML = `<strong>Error:</strong> Could not load Wikipedia content.`;
    }
}

// Example: Fetch a summary for "Google"
fetchWikipediaSummary("Google");
