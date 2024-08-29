document.addEventListener('DOMContentLoaded', function() {
    const productDetailsString = localStorage.getItem('currentProductDetails');

    if (productDetailsString) {
        try {
            const productDetails = JSON.parse(productDetailsString);
            displayBasicProductInfo(productDetails);
            if (productDetails.offerId) {
                fetchProductDetails(productDetails.offerId);
            } else {
                console.error('No offerId found in product details');
            }
        } catch (error) {
            console.error('Error parsing product details:', error);
        }
    } else {
        console.error('No product details found in localStorage');
    }
});

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

async function fetchProductDetails(offerId) {
    const detailEndpoint = 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/detail';
    const requestBody = {
        offerId: offerId,
        country: "en"
    };

    try {
        const response = await fetch(detailEndpoint, {
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
        if (data && data.result && data.result.result) {
            displayFullProductDetails(data.result.result);
        } else {
            console.error('Invalid product details response');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
    }
}

function displayFullProductDetails(productDetails) {
    const mainImageElement = document.querySelector('#product-image-main > img');
    const additionalImagesContainer = document.getElementById('product-image-additional');
    const additionalImagesContainerVar = document.getElementById('product-image-additional-variables');

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
        
        productDetails.productSkuInfos.forEach((skuInfo, index) => {
            const specContainer = document.createElement('div');
            specContainer.className = 'spec-container';
            if (index === 0) specContainer.classList.add('selected'); 
            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'spec-image-container';
            
            const skuImageUrl = skuInfo.skuAttributes.find(attr => attr.skuImageUrl)?.skuImageUrl;
            const valueTrans = skuInfo.skuAttributes.find(attr => attr.valueTrans)?.valueTrans;
            
            if (skuImageUrl) {
                const imgElement = document.createElement('img');
                imgElement.src = skuImageUrl;
                imgElement.alt = valueTrans || `Spec ${index + 1}`;
                imgElement.className = 'spec-image';
                imgContainer.appendChild(imgElement);
            } else {
                imgContainer.classList.add('no-image');
            }
            
            specContainer.appendChild(imgContainer);
            
            if (valueTrans) {
                const pElement = document.createElement('p');
                pElement.className = 'spec-text';
                pElement.textContent = valueTrans;
                specContainer.appendChild(pElement);
            }

            // Add click event listener to highlight the selected spec
            specContainer.addEventListener('click', function() {
                // Remove 'selected' class from all spec containers
                additionalImagesContainerVar.querySelectorAll('.spec-container').forEach(container => {
                    container.classList.remove('selected');
                });
                // Add 'selected' class to the clicked spec container
                this.classList.add('selected');
            });
            
            additionalImagesContainerVar.appendChild(specContainer);
        });
    }
}