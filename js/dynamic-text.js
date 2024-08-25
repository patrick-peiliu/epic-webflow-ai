document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        // console.log('Drop event triggered');
        e.preventDefault();
        
        const dt = e.dataTransfer;
        // console.log('DataTransfer items:', dt.items.length);
        // console.log('DataTransfer types:', dt.types);
    
        if (dt.types.includes('text/uri-list')) {
            dt.items[0].getAsString(function(url) {
                // console.log('Dropped URL:', url);
                sendImageDataAndRedirect(url, true);
            });
        } else {
            // console.log('Dropped item is not a URL');
            alert('Please drop an image URL.');
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const imageUploadElement = document.getElementById('imageUpload');
    
    if (imageUploadElement) {
        imageUploadElement.addEventListener('change', function(event) {
            if (event.target && event.target.files && event.target.files.length > 0) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const base64String = e.target.result.split(',')[1];
                        sendImageDataAndRedirect(base64String, false);
                    };
                    reader.readAsDataURL(file);
                }
            } else {
                console.log('No file selected');
            }
        });
    } else {
        console.error('Image upload element not found');
    }
});

async function sendImageDataAndRedirect(data, isUrl = false) {
    const uploadEndpoint = isUrl 
        ? 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/imageQuery'
        : 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/imageSearch';

    const uploadRequestBody = isUrl
        ? {
            "imageAddress": data,
            "beginPage": 1,
            "pageSize": 10,
            "country": "en",
            "imageId": "0"
          }
        : {
            "base64Image": data,
            "beginPage": 1,
            "pageSize": 10,
            "country": "en"
          };

    try {
        // console.log(`Sending ${isUrl ? 'URL' : 'base64 image'} to API`);
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

        const responseData = await response.json();
        // console.log('API response received:', responseData);
        
        // Store the response in localStorage
        localStorage.setItem('searchResults', JSON.stringify(responseData));

        // Redirect to the search results page
        // console.log('Redirecting to search results page');
        window.location.href = 'search-results.html'; // Make sure this path is correct
        // window.location.href = '/search-results'; // Update this URL to match your Webflow page slug
    } catch (error) {
        console.error(`Error uploading ${isUrl ? 'image URL' : 'image'}:`, error);
        alert(`Error uploading ${isUrl ? 'image URL' : 'image'}: ${error.message}`);
    }
}

// Function to fetch top keywords
async function fetchTopKeywords() {
    const topKeywordEndpoint = 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/topKeyword';
    try {
        const requestBody = {
            "hotKeywordType": "cate",
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

        const responseText = await response.text();
        // console.log('Raw response:', responseText);

        if (!responseText) {
            throw new Error('Empty response received');
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            throw new Error('Invalid JSON in response');
        }

        if (!data.result || !data.result.result) {
            throw new Error('Unexpected response structure');
        }

        const result = JSON.parse(data.result.result);
        displayTopKeywords(result);

    } catch (error) {
        console.error('Error fetching top keywords:', error);
        // Handle the error gracefully in the UI
        displayErrorMessage('Please try again later.');
    }
}

// Add an element with the ID "error-message" to your HTML 
// where you want the error message to appear. For example:
// <div id="error-message" style="display: none; color: red;"></div>
function displayErrorMessage(message) {
    // You can implement this function to show an error message to the user
    // For example, updating a specific element in your HTML
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    } else {
        console.error(message);
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

document.addEventListener('DOMContentLoaded', function() {
    fetchAndPopulateGallery();
});

async function fetchAndPopulateGallery() {
    const recommendEndpoint = 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/recommend';
    const requestBody = {
        "beginPage": 1,
        "pageSize": 8,
        "country": "en"
    };

    try {
        const response = await fetch(recommendEndpoint, {
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
        const galleryItems = data.result.result;

        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer) {
            galleryContainer.innerHTML = ''; // Clear existing content

            galleryItems.forEach((item, index) => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                
                const img = document.createElement('img');
                img.src = item.imageUrl || 'images/placeholder-image.png';
                img.alt = item.subjectTrans;
                img.loading = 'lazy';

                galleryItem.appendChild(img);
                galleryContainer.appendChild(galleryItem);
            });
        } else {
            console.error('Gallery container not found');
        }

    } catch (error) {
        console.error('Error fetching gallery items:', error);
        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer) {
            galleryContainer.innerHTML = '<p>Unable to load gallery items. Please try again later.</p>';
        }
    }
}