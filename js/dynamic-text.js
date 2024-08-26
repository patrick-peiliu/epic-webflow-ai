document.addEventListener('DOMContentLoaded', function() {
    const uploadDropZone = document.getElementById('uploadDropZone');
    const searchDropZone = document.getElementById('searchDropZone');
    const imageUpload = document.getElementById('imageUpload');

    function setupDropZone(dropZone) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        // Handle dropped items
        dropZone.addEventListener('drop', handleDrop, false);
    }

    setupDropZone(uploadDropZone);
    setupDropZone(searchDropZone);

    // Handle file input change
    imageUpload.addEventListener('change', handleFileSelect, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        e.target.classList.add('highlight');
    }
    
    function unhighlight(e) {
        e.target.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        unhighlight(e);
        const dt = e.dataTransfer;
        if (dt.types.includes('text/uri-list') || dt.types.includes('text/plain')) {
            dt.items[0].getAsString(function(url) {
                console.log('Dropped URL:', url);
                if (isValidImageUrl(url)) {
                    sendImageDataAndRedirect(url, true);
                } else {
                    alert('Please drop a valid image URL.');
                }
            });
        } else if (dt.files.length > 0) {
            handleFiles(dt.files);
        } else {
            console.log('Dropped item is not a URL or file');
            alert('Please drop an image URL or file.');
        }
    }
    
    function isValidImageUrl(url) {
        return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        } else {
            console.log('No file selected');
        }
    }

    function fixExifOrientation(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const view = new DataView(e.target.result);
                if (view.getUint16(0, false) != 0xFFD8) {
                    resolve(file); // Not a JPEG
                    return;
                }
                const length = view.byteLength;
                let offset = 2;
                while (offset < length) {
                    const marker = view.getUint16(offset, false);
                    offset += 2;
                    if (marker == 0xFFE1) {
                        if (view.getUint32(offset += 2, false) != 0x45786966) {
                            resolve(file); // No EXIF data
                            return;
                        }
                        const little = view.getUint16(offset += 6, false) == 0x4949;
                        offset += view.getUint32(offset + 4, little);
                        const tags = view.getUint16(offset, little);
                        offset += 2;
                        for (let i = 0; i < tags; i++) {
                            if (view.getUint16(offset + (i * 12), little) == 0x0112) {
                                const orientation = view.getUint16(offset + (i * 12) + 8, little);
                                // You might want to rotate the image here based on the orientation
                                console.log('EXIF Orientation:', orientation);
                                resolve(file);
                                return;
                            }
                        }
                    } else if ((marker & 0xFF00) != 0xFF00) break;
                    else offset += view.getUint16(offset, false);
                }
                resolve(file);
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async function compressImage(file, maxWidth, maxHeight, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(resolve, 'image/jpeg', quality);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    async function handleFiles(files) {
        try {
            let file = await fixExifOrientation(files[0]);
            console.log('File details:', {
                name: file.name,
                type: file.type,
                size: file.size + ' bytes'
            });
    
            if (file.type.startsWith('image/')) {
                // Compress image if it's larger than 300KB
                if (file.size > 300 * 1024) {
                    const compressedBlob = await compressImage(file, 1920, 1080, 0.7);
                    file = new File([compressedBlob], file.name, { type: 'image/jpeg' });
                }
    
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64String = e.target.result.split(',')[1];
                    sendImageDataAndRedirect(base64String, false);
                };
                reader.onerror = function(error) {
                    console.error('Error reading file:', error);
                    alert('Error reading file: ' + error.message);
                };
                reader.readAsDataURL(file);
            } else {
                console.log('Not an image file');
                alert('Please select an image file.');
            }
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing file: ' + error.message);
        }
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
        if (responseData && responseData.result) {
            localStorage.setItem('searchResults', JSON.stringify(responseData));
            window.location.href = 'search-results.html'; // Make sure this path is correct
            // window.location.href = '/search-results'; // Update this URL to match your Webflow page slug
        } else {
            throw new Error('Invalid or missing response data');
        }
    } catch (error) {
        console.error(`Error in sendImageDataAndRedirect:`, error);
        alert(`Error processing request: ${error.message}`);
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