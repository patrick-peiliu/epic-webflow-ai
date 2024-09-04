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
    function updateMainImage(clickedImg, container) {
        if (mainImageElement) {
            mainImageElement.src = clickedImg.src;
            mainImageElement.alt = clickedImg.alt;
        }
        
        // Remove 'selected' class from all images in the container
        container.querySelectorAll('.img-product, .spec-image').forEach(img => {
            img.classList.remove('selected');
        });
        
        // Add 'selected' class to the clicked image
        clickedImg.classList.add('selected');
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

    // Event listener for spec images
    if (additionalImagesContainerVar) {
        additionalImagesContainerVar.addEventListener('click', function(event) {
            const clickedImg = event.target.closest('.spec-image');
            if (clickedImg) {
                updateMainImage(clickedImg, additionalImagesContainerVar);
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
                if (j === 0) specContainer.classList.add('selected');

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
    }

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
    
    formatButtons.forEach(button => {
        button.addEventListener('click', function() {
            formatButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
});