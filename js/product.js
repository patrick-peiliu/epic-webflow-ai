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
    // Update additional images if available
    const additionalImagesContainerVar = document.getElementById('product-image-additional-variables');
    if (additionalImagesContainerVar && productDetails.productImage && productDetails.productImage.images.length > 1) {
        additionalImagesContainerVar.innerHTML = ''; // Clear existing content
        for (let i = 1; i < Math.min(productDetails.productImage.images.length, 4); i++) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'product-variable';
            
            const imgElement = document.createElement('img');
            imgElement.src = productDetails.productImage.images[i];
            imgElement.alt = `${productDetails.subjectTrans} - Image ${i + 1}`;
            imgElement.className = 'img-product';
            imgElement.loading = 'lazy';
            imgElement.width = '583';
            
            // const pElement = document.createElement('p');
            // pElement.className = 'p-16-20';
            // pElement.textContent = 'Short product description';
            
            imgContainer.appendChild(imgElement);
            // imgContainer.appendChild(pElement);
            additionalImagesContainerVar.appendChild(imgContainer);
        }
    }

    // Update additional product images
    const additionalImagesContainer = document.getElementById('product-image-additional');
    if (additionalImagesContainer && productDetails.productImage.images.length > 1) {
        additionalImagesContainer.innerHTML = ''; // Clear existing content
        for (let i = 1; i < Math.min(productDetails.productImage.images.length, 4); i++) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'product-variable';
            
            const imgElement = document.createElement('img');
            imgElement.src = productDetails.productImage.images[i];
            imgElement.alt = `${productDetails.subjectTrans} - Image ${i + 1}`;
            imgElement.className = 'img-product';
            imgElement.loading = 'lazy';
            imgElement.width = '583';
            
            imgContainer.appendChild(imgElement);
            additionalImagesContainer.appendChild(imgContainer);
        }
    }
}