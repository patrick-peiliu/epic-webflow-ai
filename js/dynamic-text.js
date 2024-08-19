document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const base64String = e.target.result.split(',')[1];
            // console.log('Base64 String:', base64String);

            // API endpoint for uploading image
            const uploadEndpoint = 'http://localhost:8080/imageSearch';

            // Request body for uploading image
            const uploadRequestBody = {
                "base64Image": base64String,
                "beginPage": 1,
                "pageSize": 10,
                "country": "en"
            };

            try {
                // Send base64 string to the API using POST method
                const response = await fetch(uploadEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(uploadRequestBody)
                });

                console.log('Received response from API:', response);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Upload response:', data);

                // Process the API response and update the search results
                handleApiResponseAndNavigate(data);

            } catch (error) {
                console.error('Error uploading image:', error);
                alert(`Error uploading image: ${error.message}`);
            }
        };
        reader.readAsDataURL(file);
    }
});

// Function to handle the API response and navigate to the search results page
async function handleApiResponseAndNavigate(data) {
    try {
        // Parse the result from the API response
        const result = data.result.result;
        console.log('Parsed result:', result);

        // Handle the data list from the API response
        if (result && result.data && result.data.length > 0) {
            const productGrids = document.querySelectorAll('.grid-products');
            console.log('productGrid:', productGrids);
            if (productGrids.length > 0) {
                productGrids.forEach((productGrid) => {
                    console.log('productGrid:', productGrid);
                    // Get all img elements inside each product grid
                    const imgElements = productGrid.querySelectorAll('.card img');
                    console.log('Selected image elements:', imgElements);
                    // Update the src attribute of each img element with the imageUrl
                    imgElements.forEach((imgElement) => {
                        imgElement.src = imageUrl;
                        console.log('Updated img element:', imgElement);
                    });
                });
            } else {
                console.error('No elements with class "grid-products" found.');
            }
        }
        console.log('Redirecting to:', data);
        // Redirect to the search results page
        window.location.href = 'search-results.html'; // Replace with the actual URL of your search results page
        console.log('Redirected:', data);

    } catch (error) {
        console.error('Error processing API response:', error);
        alert(`Error processing API response: ${error.message}`);
    }
}

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