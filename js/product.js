function initializeWishlistFeature(productDetails) {
    const wishlistButton = document.querySelector('.w-layout-hflex.like-dislike-product');
    const wishlistText = wishlistButton.querySelector('.link-text');
    const heartIcon = wishlistButton.querySelector('.heart-icon');

    function updateWishlistButton(isWishlisted) {
        if (isWishlisted) {
            wishlistText.textContent = 'Remove from wishlist';
            heartIcon.src = 'https://cdn.prod.website-files.com/669bd37b63bfa4c0c5ff7765/66a16605ed582742f5697ac1_heart-filled-02.png';
        } else {
            wishlistText.textContent = 'Add to wishlist';
            heartIcon.src = 'https://cdn.prod.website-files.com/669bd37b63bfa4c0c5ff7765/669ee220214d380bcfc1f169_heart-icon.png';
        }
    }

    function toggleWishlist() {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const index = wishlist.findIndex(item => item.offerId === productDetails.offerId);

        if (index > -1) {
            wishlist.splice(index, 1);
            updateWishlistButton(false);
        } else {
            wishlist.push({
                offerId: productDetails.offerId,
                imageUrl: productDetails.productImage.images[0],
                subjectTrans: productDetails.subjectTrans
            });
            updateWishlistButton(true);
        }

        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }

    wishlistButton.addEventListener('click', function(e) {
        e.preventDefault();
        toggleWishlist();
    });

    // Check if the product is already in the wishlist when the page loads
    function checkWishlistStatus() {
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const isWishlisted = wishlist.some(item => item.offerId === productDetails.offerId);
        updateWishlistButton(isWishlisted);
    }

    checkWishlistStatus();
}

document.addEventListener('DOMContentLoaded', function() {
    const productDetailsString = localStorage.getItem('currentProductDetails');
    const urlParams = new URLSearchParams(window.location.search);
    const encodedOfferId = urlParams.get('id');
    
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

function populateProductSubject(productDetails) {
    const productSubjectField = document.getElementById('product-subject');
    if (productSubjectField && productDetails.subjectTrans) {
        productSubjectField.value = productDetails.subjectTrans;
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

    populateProductSubject(productDetails);

    // Function to update main image and highlight selected image
    function updateMainImage(clickedElement, container) {
        if (mainImageElement) {
            const newSrc = clickedElement.src || clickedElement.querySelector('img')?.src;
            if (newSrc) {
                mainImageElement.src = newSrc;
                mainImageElement.alt = clickedElement.alt || clickedElement.querySelector('img')?.alt || '';
            } else {
                console.log('No image source found for this spec');
                // Optionally, set a placeholder image or do nothing
            }
        }
        
        // Remove 'selected' class from all elements in the container
        container.querySelectorAll('.spec-container, .img-product, .spec-image').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add 'selected' class to the clicked element or its parent spec-container
        const targetElement = clickedElement.closest('.spec-container') || clickedElement;
        targetElement.classList.add('selected');
    }

    // Event listener for additional product images
    if (additionalImagesContainer) {
        additionalImagesContainer.addEventListener('click', function(event) {
            const clickedImg = event.target.closest('.img-product');
            if (clickedImg) {
                updateMainImage(clickedImg, additionalImagesContainer);
            }
        });
    }

    // Populate additional product images
    if (additionalImagesContainer && productDetails.productImage && productDetails.productImage.images.length > 0) {
        additionalImagesContainer.innerHTML = ''; // Clear existing content
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
    }
    
    function updateSpecSelection(text) {
        const specSelectionField = document.getElementById('spec-selection');
        if (specSelectionField) {
            specSelectionField.value = text;
        }
    }

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
                        </div>
                    </div>
                `;
                detailsContainer.appendChild(detailBlock);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const formatButtons = document.querySelectorAll('.format-button');
    const formatSelectionField = document.getElementById('format-selection');
    
    formatButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove 'selected' class from all buttons
            formatButtons.forEach(btn => btn.classList.remove('selected'));

            // Add 'selected' class to clicked button
            this.classList.add('selected');
            
            // Update the hidden input field with the selected format
            if (formatSelectionField) {
                formatSelectionField.value = this.textContent.trim();
            }
        });
    });
});

// Optionally, set an initial value for the format selection
function setInitialFormatSelection() {
    const formatSelectionField = document.getElementById('format-selection');
    const initialSelectedButton = document.querySelector('.format-button.selected');
    if (formatSelectionField && initialSelectedButton) {
        formatSelectionField.value = initialSelectedButton.textContent.trim();
    }
}

// Call this function after the DOM is loaded
setInitialFormatSelection();