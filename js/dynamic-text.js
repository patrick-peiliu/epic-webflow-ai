document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const base64String = e.target.result.split(',')[1];
            await sendImageAndRedirect(base64String);
        };
        reader.readAsDataURL(file);
    }
});

async function sendImageAndRedirect(base64String) {
    const uploadEndpoint = 'http://localhost:8080/imageSearch';
    const uploadRequestBody = {
        "base64Image": base64String,
        "beginPage": 1,
        "pageSize": 10,
        "country": "en"
    };

    try {
        const response = await fetch(uploadEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(uploadRequestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Store the response in localStorage
        localStorage.setItem('searchResults', JSON.stringify(data));

        // Redirect to the search results page
        window.location.href = 'search-results.html';

    } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Error uploading image: ${error.message}`);
    }
}

// ... rest of your existing code ...

// Function to fetch top keywords
async function fetchTopKeywords() {
    const topKeywordEndpoint = 'http://localhost:8080/topKeyword';

    try {
        // Request body
        const requestBody = {
        "hotKeywordType": "cate",
        // display Category Id
        "sourceId": "13",
        "country": "en"
        };
        const response = await fetch(topKeywordEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.result.result);
        // console.log('Top keywords:', result);

        // Process and display top keywords
        displayTopKeywords(result);

    } catch (error) {
        console.error('Error fetching top keywords:', error);
        alert(`Error fetching top keywords: ${error.message}`);
    }
}

// Function to display top keywords
function displayTopKeywords(data) {
    // Get all elements with the class 'text-btn-look'
    const textElements = document.querySelectorAll('.text-btn-look');

    if (!textElements.length) {
        console.error('No elements with class "text-btn-look" found.');
        return;
    }

    // Update the text content of each element with the corresponding 'seKeywordTranslation'
    textElements.forEach((element, index) => {
        if (data[index] && data[index].seKeywordTranslation) {
            element.textContent = data[index].seKeywordTranslation;
            // console.log(`Updated element ${index}:`, element);
        }
    });
}

// Call fetchTopKeywords on page load
document.addEventListener('DOMContentLoaded', fetchTopKeywords);