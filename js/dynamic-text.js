const CACHE_DURATION = 20 * 1000; // 10 minutes in milliseconds

function getCachedData(key) {
    const cachedData = localStorage.getItem(key);
    if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
            return data;
        }
    }
    return null;
}

function setCachedData(key, data) {
    const cacheObject = {
        timestamp: Date.now(),
        data: data
    };
    localStorage.setItem(key, JSON.stringify(cacheObject));
}

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
        : 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/upload';

    // Only store lastSearchImage if it's a URL
    if (isUrl) {
        localStorage.setItem('lastSearchImage', data);
    } else {
        localStorage.removeItem('lastSearchImage');
    }
    localStorage.setItem('isImageUrl', isUrl.toString());

    // Clear previous search results
    localStorage.removeItem('searchResults');

    // Prepare the initial request body
    const initialRequestBody = isUrl
        ? {
            imageAddress: data,
            beginPage: 1,
            pageSize: 20,
            country: "en",
            imageId: "0"
          }
        : {
            base64Image: data
          };

    try {
        const initialResponse = await fetch(uploadEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(initialRequestBody)
        });

        if (!initialResponse.ok) {
            throw new Error(`HTTP error! status: ${initialResponse.status}`);
        }

        const initialResponseData = await initialResponse.json();
        
        if (isUrl) {
            // Handle imageQuery response
            if (initialResponseData && initialResponseData.result) {
                localStorage.setItem('searchResults', JSON.stringify(initialResponseData));
                // window.location.href = '/search-results';
                window.location.href = 'search-results.html';
            } else {
                throw new Error('Invalid or missing response data');
            }
        } else {
            // Handle upload response
            if (initialResponseData && initialResponseData.result && initialResponseData.result.result) {
                const imageId = initialResponseData.result.result;
                if (imageId === "0") {
                    alert("Image upload failed. Please upload an image less than 100KB.");
                } else {
                    localStorage.setItem('imageId', imageId);
                    
                    // Send a second request to imageQuery with the received imageId
                    const imageQueryEndpoint = 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/imageQuery';
                    const imageQueryRequestBody = {
                        beginPage: 1,
                        pageSize: 20,
                        country: "en",
                        imageId: imageId
                    };

                    const imageQueryResponse = await fetch(imageQueryEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(imageQueryRequestBody)
                    });

                    if (!imageQueryResponse.ok) {
                        throw new Error(`HTTP error! status: ${imageQueryResponse.status}`);
                    }

                    const imageQueryResponseData = await imageQueryResponse.json();

                    if (imageQueryResponseData && imageQueryResponseData.result) {
                        localStorage.setItem('searchResults', JSON.stringify(imageQueryResponseData));
                        // window.location.href = '/search-results';
                        window.location.href = 'search-results.html';
                    } else {
                        throw new Error('Invalid or missing response data from imageQuery');
                    }
                }
            } else {
                throw new Error('Invalid or missing response data from upload');
            }
        }
    } catch (error) {
        console.error(`Error in sendImageDataAndRedirect:`, error);
        alert(`Error processing request: ${error.message}`);
    }
}

// Function to fetch top keywords
async function fetchTopKeywords() {
    const cachedKeywords = getCachedData('topKeywords');
    if (cachedKeywords) {
        displayTopKeywords(cachedKeywords);
        return;
    }

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

        const data = await response.json();
        if (!data.result || !data.result.result) {
            throw new Error('Unexpected response structure');
        }

        const result = JSON.parse(data.result.result);
        setCachedData('topKeywords', result);
        displayTopKeywords(result);
    } catch (error) {
        console.error('Error fetching top keywords:', error);
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
    const loopHolder = document.querySelector('.loop-holder');
    if (!loopHolder) {
        console.error('Loop holder element not found.');
        return;
    }

    const textElements = loopHolder.querySelectorAll('.text-btn-look');
    if (!textElements.length) {
        console.error('No elements with class "text-btn-look" found.');
        return;
    }

    // Update existing elements
    textElements.forEach((element, index) => {
        if (data[index % data.length] && data[index % data.length].seKeywordTranslation) {
            element.textContent = data[index % data.length].seKeywordTranslation;
        }
    });

    // Clone elements to ensure smooth looping
    const elementsToClone = Array.from(loopHolder.children);
    elementsToClone.forEach(element => {
        loopHolder.appendChild(element.cloneNode(true));
    });

    // Set up the animation
    loopHolder.style.display = 'flex';
    loopHolder.style.animation = 'none'; // Reset animation
    loopHolder.offsetHeight; // Trigger reflow
    loopHolder.style.animation = 'scrollKeywords 30s linear infinite';
}

async function fetchAndPopulateGallery() {
    const cachedGallery = getCachedData('galleryItems');
    if (cachedGallery) {
        populateGallery(cachedGallery);
        return;
    }

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
        setCachedData('galleryItems', galleryItems);
        populateGallery(galleryItems);
    } catch (error) {
        console.error('Error fetching gallery items:', error);
        const galleryContainer = document.getElementById('gallery-container');
        if (galleryContainer) {
            galleryContainer.innerHTML = '<p>Unable to load gallery items. Please try again later.</p>';
        }
    }
}

function populateGallery(galleryItems) {
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
}

// Call these functions when the page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchTopKeywords();
    fetchAndPopulateGallery();
});

// Function to replace image sources
function replaceImageSources() {
    const imageUrls = [
        "https://cbu01.alicdn.com/img/ibank/O1CN018MFFKj2ItbZ6I0cDx_!!2212958579344-0-cib.jpg",
        "https://cbu01.alicdn.com/O1CN01QwJWyN1GHvVOXN4lD_!!1745930598-0-cib.jpg",
        "https://cbu01.alicdn.com/img/ibank/O1CN01GewAV11w0ig2hCNaL_!!3903836246-0-cib.jpg",
        "https://cbu01.alicdn.com/img/ibank/O1CN01EKPXwy1HyoO4QjkfB_!!2215849650827-0-cib.jpg",
        "https://cbu01.alicdn.com/img/ibank/18002844909_79330753.jpg",
        "https://cbu01.alicdn.com/O1CN013t1r6F1zQJkkJ3Wme_!!2206529356708-0-cib.jpg"
    ];

    // Select all elements with IDs starting with "step-img-drag-"
    const elements = document.querySelectorAll('[id^="step-img-drag-"]');
    
    elements.forEach((element, index) => {
        const img = element.querySelector('img');
        
        if (img && index < imageUrls.length) {
            // Use setAttribute to change the src
            img.setAttribute('src', imageUrls[index]);
            // Also update srcset if it exists
            if (img.hasAttribute('srcset')) {
                img.setAttribute('srcset', imageUrls[index]);
            }
        } else if (img) {
            console.log(`No URL available for element ${element.id}, image source not replaced`);
        } else {
            console.log(`No img tag found in element ${element.id}`);
        }
    });
}

// Function to ensure the script runs after Webflow's page load
function runAfterPageLoad() {
    if (document.readyState === 'complete') {
        replaceImageSources();
    } else {
        window.addEventListener('load', replaceImageSources);
    }
}

// Run the script
runAfterPageLoad();