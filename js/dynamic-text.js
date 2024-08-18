document.addEventListener("DOMContentLoaded", function() {
    // API endpoint
    const apiEndpoint = 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/topKeyword';
    // const apiEndpoint = 'http://localhost:8080/topKeyword';

    // Request body
    const requestBody = {
        "hotKeywordType": "cate",
        // display Category Id
        "sourceId": "13",
        "country": "en"
    };

    // Fetch data from the API using POST method
    fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        // Parse the result from the API response
        const result = JSON.parse(data.result.result);
        console.log('Parsed result:', result);

        // Get all elements with the class 'text-btn-look' inside 'loop-animation-wrapper'
        const textElements = document.querySelectorAll('.loop-animation-wrapper .text-btn-look');
        console.log('Text elements:', textElements);

        // Update the text content of each element with 'seKeywordTranslation'
        textElements.forEach((element, index) => {
            if (result[index] && result[index].seKeywordTranslation) {
                element.textContent = result[index].seKeywordTranslation;
                console.log(`Updated element ${index}:`, element);
            }
        });
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
});