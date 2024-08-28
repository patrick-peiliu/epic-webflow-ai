document.addEventListener('DOMContentLoaded', () => {
    const productDetailsString = localStorage.getItem('currentProductDetails');

    if (productDetailsString) {
        try {
            const productDetails = JSON.parse(productDetailsString);
            displayBasicProductInfo(productDetails);
            showLoadingState();
            if (productDetails.offerId) {
                fetchProductDetails(productDetails.offerId);
            } else {
                console.error('No offerId found in product details');
                hideLoadingState();
                showErrorMessage('Error loading full product details. Some information may be missing.');
            }
        } catch (error) {
            console.error('Error parsing product details:', error);
            showErrorMessage('Error loading product details. Please try again.');
        }
    } else {
        console.error('No product details found in localStorage');
        showErrorMessage('Product details not found. Please return to the search page.');
    }
});

function displayBasicProductInfo(productDetails) {

    // Update the product title
    const titleElement = document.getElementById('h1 _24-28');
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

function showLoadingState() {
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    // Optionally, you can disable certain elements or add a loading overlay here
}

function hideLoadingState() {
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    // Optionally, re-enable elements or remove the loading overlay here
}

function showErrorMessage(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
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
            showErrorMessage('Error loading full product details. Some information may be missing.');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        showErrorMessage('Error loading full product details. Some information may be missing.');
    } finally {
        hideLoadingState();
    }
}

function displayFullProductDetails(productDetails) {
    // Update additional images if available
    const additionalImagesContainerVar = document.getElementById('product-image-additional variables');
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