function initializeWishlistFeature(productDetails) {
    const wishlistButton = document.querySelector('.w-layout-hflex.add-to-wishlist-button');
    const wishlistText = document.getElementById('wishlistText');
    const addRemoveIcon = document.getElementById('addRemoveIcon');

    function updateWishlistButton(isWishlisted) {
        if (isWishlisted) {
            wishlistText.textContent = 'Remove from wishlist';
            addRemoveIcon.src = 'https://cdn.prod.website-files.com/669bd37b63bfa4c0c5ff7765/66ed22f656c24937c6d81a57_minus.png';
        } else {
            wishlistText.textContent = 'Add to wishlist';
            addRemoveIcon.src = 'https://cdn.prod.website-files.com/669bd37b63bfa4c0c5ff7765/66ed22f6f93665fd49b04bd9_plus.png';
        }
    }

    function toggleWishlist() {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const index = wishlist.findIndex(item => item.offerId === productDetails.offerId);

        if (index > -1) {
            wishlist.splice(index, 1);
            updateWishlistButton(false);
        } else {
            const specSelectionField = document.querySelector('.spec-container.selected .spec-text');
            // const formatSelectionField = document.querySelector('.format-button.selected');
            
            // Get the image URL from the currently selected image in additionalImagesContainerVar
            const selectedImageElement = document.querySelector('#product-image-additional-variables .spec-container.selected img');
            let imageUrl = productDetails.productImage.images[0];

            if (selectedImageElement && selectedImageElement.src && isValidUrl(selectedImageElement.src)) {
                imageUrl = selectedImageElement.src;
            }

            wishlist.push({
                offerId: productDetails.offerId,
                imageUrl: imageUrl,
                subjectTrans: productDetails.subjectTrans,
                spec: specSelectionField ? specSelectionField.textContent.trim() : '',
                // format: formatSelectionField ? formatSelectionField.textContent.trim() : '',
                originalUrl: `https://detail.1688.com/offer/${productDetails.offerId}.html`
            });
            updateWishlistButton(true);
        }

        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }

    // Helper function to validate URL
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    wishlistButton.addEventListener('click', function(e) {
        e.preventDefault();
        toggleWishlist();
        updateWishlistCounter();
    });

    // Check if the product is already in the wishlist when the page loads
    function checkWishlistStatus() {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const isWishlisted = wishlist.some(item => item.offerId === productDetails.offerId);
        updateWishlistButton(isWishlisted);
        // Remove the hidden-field class to show the button
        wishlistButton.classList.remove('hidden-field');
    }

    // Check wishlist status and show the button when ready
    checkWishlistStatus();
}

document.addEventListener('DOMContentLoaded', function() {
    const productDetailsString = localStorage.getItem('currentProductDetails');
    const urlParams = new URLSearchParams(window.location.search);
    const encodedOfferId = urlParams.get('id');

    updateWishlistCounter();
    
    if (encodedOfferId) {
        const offerId = Base64.decode(encodedOfferId);
        let localDataUsed = false;
        if (productDetailsString) {
            try {
                const productDetails = JSON.parse(productDetailsString);
                if (String(offerId) === String(productDetails.offerId)) {
                    displayBasicProductInfo(productDetails);
                    localDataUsed = true;
                } else {
                    console.info('No matched product details found in localStorage');
                }
            } catch (error) {
                console.error('Error parsing product details:', error);
            }
        } else {
            console.info('No product details found in localStorage');
        }
        
        fetchProductDetails(offerId, localDataUsed);
    } else {
        console.info('No product ID found in URL');
        // Redirect to 404 page
        window.location.href = '404.html';
        // window.location.href = '/404';
    }
});

function fetchProductDetails(offerId, localDataUsed) {
    const detailEndpoint = 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/detail';
    const requestBody = {
        offerId: offerId,
        country: "en"
    };

    fetch(detailEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data && data.result && data.result.result) {
            displayFullProductDetails(data.result.result, localDataUsed);
        } else {
            console.error('Invalid product details response');
            window.location.href = '404.html';
            // window.location.href = '/404';
        }
    })
    .catch(error => {
        console.error('Error fetching product details:', error);
    });
}

function displayBasicProductInfo(productDetails) {
    // Update the product title
    const titleElement = document.getElementById('h1_24-28');
    if (titleElement) {
        titleElement.textContent = productDetails.subjectTrans || '';
    }

    // Update the main product image
    const mainImageElement = document.querySelector('#product-image-main img');
    if (mainImageElement) {
        mainImageElement.src = productDetails.imageUrl || '';
        mainImageElement.alt = productDetails.subjectTrans || '';
    }
}

function populateOriginalUrl(productDetails) {
    const originalUrlField = document.getElementById('original-url');
    if (originalUrlField && productDetails.offerId) {
        const productUrl = `https://detail.1688.com/offer/${productDetails.offerId}.html`;
        originalUrlField.value = productUrl;
    }
}

function displayFullProductDetails(productDetails, localDataUsed) {
    const mainImageElement = document.querySelector('#product-image-main > img');
    const additionalImagesContainer = document.getElementById('product-image-additional');
    const additionalImagesContainerVar = document.getElementById('product-image-additional-variables');
    
    if (!localDataUsed) {
        // Update the product title
        const titleElement = document.getElementById('h1_24-28');
        if (titleElement) {
            titleElement.textContent = productDetails.subjectTrans || '';
        }

        // Update the main product image
        if (mainImageElement) {
            mainImageElement.src = productDetails.productImage.images[0] || '';
            mainImageElement.alt = productDetails.subjectTrans || '';
        }
    }

    populateOriginalUrl(productDetails);

    function updateMainImage(clickedElement, container) {
        const mainImageContainer = document.getElementById('product-image-main');
        let mainMediaElement = mainImageContainer.querySelector('img.img-product, video.img-product');

        if (clickedElement.tagName.toLowerCase() === 'video' || clickedElement.classList.contains('video-container')) {
            // If it's a video, replace or update the video element
            const videoSrc = clickedElement.src || clickedElement.querySelector('video')?.src;
            if (mainMediaElement?.tagName.toLowerCase() !== 'video') {
                const videoElement = document.createElement('video');
                videoElement.src = videoSrc;
                videoElement.controls = true;
                videoElement.className = 'img-product'; // Use the same class as images
                videoElement.autoplay = false;
                videoElement.muted = true;
                if (mainMediaElement) {
                    mainMediaElement.replaceWith(videoElement);
                } else {
                    mainImageContainer.prepend(videoElement);
                }
                mainMediaElement = videoElement;
            } else {
                mainMediaElement.src = videoSrc;
            }
        } else {
            // If it's an image, replace or update the image element
            const newSrc = clickedElement.src || clickedElement.querySelector('img')?.src;
            if (newSrc) {
                if (mainMediaElement?.tagName.toLowerCase() !== 'img') {
                    const imgElement = document.createElement('img');
                    imgElement.className = 'img-product';
                    if (mainMediaElement) {
                        mainMediaElement.replaceWith(imgElement);
                    } else {
                        mainImageContainer.prepend(imgElement);
                    }
                    mainMediaElement = imgElement;
                }
                mainMediaElement.src = newSrc;
                mainMediaElement.alt = clickedElement.alt || clickedElement.querySelector('img')?.alt || '';
            }
        }

        // Remove 'selected' class from all elements in the container
        container.querySelectorAll('.product-variable, .spec-container').forEach(el => {
            el.classList.remove('selected');
        });

        // Add 'selected' class to the clicked element's parent container
        const targetElement = clickedElement.closest('.product-variable') || clickedElement.closest('.spec-container');
        if (targetElement) {
            targetElement.classList.add('selected');
        }

        // Update spec selection if applicable
        const specText = clickedElement.closest('.spec-container')?.querySelector('.spec-text')?.textContent;
        if (specText) {
            updateSpecSelection(specText);
        }
    }

    function updateSpecSelection(specText) {
        const specSelectionField = document.getElementById('spec-selection');
        if (specSelectionField) {
            specSelectionField.value = specText;
        }
    }

    function updateStockDisplay(skuInfo) {
        const stockElement = document.getElementById('available-stock');
        if (stockElement && skuInfo && skuInfo.amountOnSale !== undefined) {
            stockElement.textContent = skuInfo.amountOnSale.toLocaleString();
        } else {
            stockElement.textContent = '  '; // or any default text you prefer
        }
    }
    
    // Event listener for additional product images
    if (additionalImagesContainer) {
        additionalImagesContainer.addEventListener('click', function(event) {
            const clickedElement = event.target.closest('.img-product, video');
            if (clickedElement) {
                updateMainImage(clickedElement, this);
            }
        });
    }

    // Function to populate additionalImagesContainer
    function populateAdditionalImages(productDetails) {
        const additionalImagesContainer = document.getElementById('product-image-additional');
        if (additionalImagesContainer && productDetails.productImage && productDetails.productImage.images.length > 0) {
            additionalImagesContainer.innerHTML = ''; // Clear existing content

            // Add video container if mainVideo exists
            if (productDetails.mainVideo) {
                const videoContainer = document.createElement('div');
                videoContainer.className = 'product-variable video-container';
                
                const videoElement = document.createElement('video');
                videoElement.src = productDetails.mainVideo;
                videoElement.className = 'img-product video-product';
                videoElement.autoplay = false;
                videoElement.muted = true;
                videoElement.controls = false; // Remove controls
                videoElement.preload = 'metadata'; // Only load metadata for thumbnail
                
                videoContainer.appendChild(videoElement);
                additionalImagesContainer.appendChild(videoContainer);
            }

            // Add all product images
            productDetails.productImage.images.forEach((imageUrl, index) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'product-variable';
                
                const imgElement = document.createElement('img');
                imgElement.src = imageUrl;
                imgElement.alt = `${productDetails.subjectTrans} - Image ${index + 1}`;
                imgElement.className = 'img-product';
                imgElement.loading = 'lazy';
                imgElement.width = '583';
                
                imgContainer.appendChild(imgElement);
                additionalImagesContainer.appendChild(imgContainer);
            });

            // Select the first item (video or image) by default
            // const firstItem = additionalImagesContainer.querySelector('.product-variable');
            // if (firstItem) {
            //     updateMainImage(firstItem, additionalImagesContainer);
            // }
        }
    }

    // Call this function when loading the product details
    populateAdditionalImages(productDetails);

    if (additionalImagesContainerVar && productDetails.productSkuInfos && productDetails.productSkuInfos.length > 0) {
        additionalImagesContainerVar.innerHTML = ''; // Clear existing content

        for (let i = 0; i < productDetails.productSkuInfos.length; i += 6) {
            const rowContainer = document.createElement('div');
            rowContainer.className = 'spec-row';
            additionalImagesContainerVar.appendChild(rowContainer);

            for (let j = i; j < Math.min(i + 6, productDetails.productSkuInfos.length); j++) {
                const skuInfo = productDetails.productSkuInfos[j];
                const specContainer = document.createElement('div');
                specContainer.className = 'spec-container';
                if (j === 0) {
                    specContainer.classList.add('selected');
                }

                const imgContainer = document.createElement('div');
                imgContainer.className = 'spec-image-container';

                const skuImageUrl = skuInfo.skuAttributes.find(attr => attr.skuImageUrl)?.skuImageUrl;
                const valueTransArray = skuInfo.skuAttributes
                    .filter(attr => attr.valueTrans)
                    .map(attr => attr.valueTrans);
                const valueTrans = valueTransArray.join(' - ');

                if (skuImageUrl) {
                    const imgElement = document.createElement('img');
                    imgElement.src = skuImageUrl;
                    imgElement.alt = valueTrans || `Spec ${j + 1}`;
                    imgElement.className = 'spec-image';
                    imgElement.title = valueTrans; // Add title attribute for tooltip
                    imgContainer.appendChild(imgElement);
                } else {
                    imgContainer.classList.add('no-image');
                }

                specContainer.appendChild(imgContainer);

                if (valueTrans) {
                    const pElement = document.createElement('p');
                    pElement.className = 'spec-text';
                    pElement.textContent = valueTrans;
                    pElement.title = valueTrans; // Add title attribute to show full text on hover
                    specContainer.appendChild(pElement);
                }

                specContainer.addEventListener('click', function () {
                    additionalImagesContainerVar.querySelectorAll('.spec-container').forEach(container => {
                        container.classList.remove('selected');
                    });
                    this.classList.add('selected');
                    updateMainImage(this.querySelector('.spec-image') || this, additionalImagesContainerVar);
                    updateSpecSelection(this.querySelector('.spec-text').textContent);

                    // Find the corresponding SKU info and update stock display
                    const selectedIndex = Array.from(additionalImagesContainerVar.querySelectorAll('.spec-container')).indexOf(this);
                    updateStockDisplay(skuInfo);
                });

                rowContainer.appendChild(specContainer);
            }

            // Add placeholder elements to maintain layout if less than 6 items in a row
            for (let k = productDetails.productSkuInfos.length % 6; k < 6 && k !== 0; k++) {
                const placeholderContainer = document.createElement('div');
                placeholderContainer.className = 'spec-container placeholder';
                rowContainer.appendChild(placeholderContainer);
            }
        }

        // Set initial spec selection
        const initialSelectedSpec = additionalImagesContainerVar.querySelector('.spec-container.selected .spec-text');
        if (initialSelectedSpec) {
            updateSpecSelection(initialSelectedSpec.textContent);
        }

        // Set initial stock amount
        updateStockDisplay(productDetails.productSkuInfos[0]);
    }

    initializeWishlistFeature(productDetails);

    /**
     * filter out attributes
     * "attributeId": "7108" - Inventory: Yes
     * "attributeId": "3216" - Color: Red, Yellow, Green
     * "attributeId": "100000729" - Can be customized: Yes
     * "attributeId": "1627139" - Support customization
     * "attributeId": "182318189" - Main downstream platform: ebay, 
     * "attributeId": "193290002" - Main sales area: Africa, 
     * "attributeId": "4921" - Upper material: Fabric
     * "attributeId": "1773" - "Gram weight" - "More than 200g (inclusive)"
     * "attributeId": "3572" - Weight - ""
     * "attributeId": "1957" - Gross weight - ""
     * "attributeId": "287" - Material: Fabric
     * "attributeId": "2340" - Capacity: Fabric
     * "attributeId": "100124790" - Whether there is a patent: No
     * "attributeId": "243840851" - Whether there is copyright or patent: No
     * "attributeId": "446" - Dimensions: Trumpet 70*80cm
     * "attributeId": "401423489" - Diameter: Trumpet 70*80cm
     * "attributeId": "181680456" - Whether assembled: Assembly
     */
    
    // Define the list of allowed attribute IDs
    const attributeids = ['7108', '3216', '100000729', '1627139', '182318189', '193290002', '4921', '1773', '3572', '1957', '287', '2340', '100124790', '243840851', '446', '401423489', '181680456'];

    // Update product attributes
    if (productDetails.productAttribute && productDetails.productAttribute.length > 0) {
        const detailsContainer = document.querySelector('.details-grid');
        detailsContainer.innerHTML = ''; // Clear existing content

        productDetails.productAttribute.forEach((attribute) => {
            // Only process attributes with IDs in the attributeids list
            if (attribute.attributeId && attributeids.includes(attribute.attributeId)) {
                const detailBlock = document.createElement('div');
                detailBlock.className = 'details-block';
                
                const existingBlock = Array.from(detailsContainer.children).find(block => {
                    return block.querySelector('.div-align-left p').textContent.trim().toLowerCase() === (attribute.attributeNameTrans + ':').toLowerCase();
                });

                let rightPContent = attribute.valueTrans;

                if (existingBlock) {
                    const existingRightP = existingBlock.querySelector('.div-align-right p');
                    rightPContent = existingRightP.textContent.trim() + ', ' + attribute.valueTrans;
                    existingBlock.remove(); // Remove the existing block as we'll add an updated one
                }

                detailBlock.innerHTML = `
                <div class="w-layout-hflex description-line-details">
                  <div class="div-align-left">
                    <p class="p-16-20">${attribute.attributeNameTrans}:</p>
                  </div>
                  <div class="div-align-right">
                    <p class="p-16-20 bold">${rightPContent}</p>
                    <div class="chevron-icon"></div>
                  </div>
                </div>
              `;
              detailsContainer.appendChild(detailBlock);
            }
        });

        // Initialize expandable text after all details are added
        initializeExpandableText();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('email-form');
    const fileInput = document.getElementById('design-file');
    const fileUploadPlaceholder = document.querySelector('.file-upload-placeholder');
    const s3UrlInput = document.getElementById('design-file-url'); // Assuming you've added this hidden input to your form

    fileInput.addEventListener('change', async function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            fileUploadPlaceholder.textContent = file.name;

            // Create a new FormData object for just the file
            const fileFormData = new FormData();
            fileFormData.append('file', file);

            try {
                // For production, use:
                const url = 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/fileUpload';
                const response = await fetch(url, {
                    method: 'POST',
                    body: fileFormData
                });

                if (response.ok) {
                    const responseData = await response.json();
                    if (responseData.success) {
                        // Set the S3 URL to the hidden field
                        s3UrlInput.value = responseData.result;
                        fileUploadPlaceholder.textContent = 'File uploaded successfully';
                    } else {
                        console.error('File upload failed:', responseData.message);
                        fileUploadPlaceholder.textContent = responseData.message || 'File upload failed. Please try again.';
                    }
                } else {
                    console.error('File upload request failed');
                    fileUploadPlaceholder.textContent = 'File upload failed. Please try again.';
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                fileUploadPlaceholder.textContent = 'Error uploading file. Please try again.';
            }
        } else {
            fileUploadPlaceholder.innerHTML = '<span class="file-upload-text">Choose file or drag here</span>';
            s3UrlInput.value = ''; // Clear the S3 URL if no file is selected
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        // Handle form submission
        // The S3 URL is already in the hidden field, so you can submit the form as usual
        // Add your form submission logic here
    });
});

// document.addEventListener('DOMContentLoaded', function() {
//     const formatButtons = document.querySelectorAll('.format-button');
//     const formatSelectionField = document.getElementById('format-selection');
    
//     formatButtons.forEach(button => {
//         button.addEventListener('click', function() {
//             // Remove 'selected' class from all buttons
//             formatButtons.forEach(btn => btn.classList.remove('selected'));

//             // Add 'selected' class to clicked button
//             this.classList.add('selected');
            
//             // Update the hidden input field with the selected format
//             if (formatSelectionField) {
//                 formatSelectionField.value = this.textContent.trim();
//             }
//         });
//     });
// });

// // Optionally, set an initial value for the format selection
// function setInitialFormatSelection() {
//     const formatSelectionField = document.getElementById('format-selection');
//     const initialSelectedButton = document.querySelector('.format-button.selected');
//     if (formatSelectionField && initialSelectedButton) {
//         formatSelectionField.value = initialSelectedButton.textContent.trim();
//     }
// }

// // Call this function after the DOM is loaded
// setInitialFormatSelection();

function getWishlist() {
    const wishlistJSON = localStorage.getItem('wishlist');
    try {
        if (!wishlistJSON) {
            console.log('Wishlist is empty or not set');
            return [];
        }
        const parsedWishlist = JSON.parse(wishlistJSON);
        if (!Array.isArray(parsedWishlist)) {
            console.error('Parsed wishlist is not an array:', parsedWishlist);
            return [];
        }
        return parsedWishlist;
    } catch (error) {
        console.error('Error parsing wishlist:', error);
        return [];
    }
}

function updateWishlistCounter() {
    const wishlist = getWishlist();
    const count = wishlist.length;
    localStorage.setItem('wishlistCount', count);
    updateWishlistCounterUI(count);
}

function updateWishlistCounterUI(count) {
    const counterElement = document.querySelector('.heart-button .wishlist-counter');
    if (counterElement) {
        counterElement.textContent = count;
        counterElement.style.display = 'block';
    }
}

function initializeExpandableText() {
    const rightDivs = document.querySelectorAll('.div-align-right');
    
    rightDivs.forEach(div => {
      const paragraph = div.querySelector('p');
      if (paragraph && paragraph.scrollHeight > paragraph.clientHeight) {
        div.classList.add('expandable');
        
        div.addEventListener('click', function(event) {
          // Prevent the click from triggering on child elements
          if (event.target === div || event.target === paragraph || event.target.classList.contains('chevron-icon')) {
            this.classList.toggle('expanded');
          }
        });
      } else {
        // Hide the chevron if content doesn't need expansion
        const chevron = div.querySelector('.chevron-icon');
        if (chevron) {
          chevron.style.display = 'none';
        }
      }
    });
  }