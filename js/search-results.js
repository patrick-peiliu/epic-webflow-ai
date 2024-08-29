let currentPage = 1;
let isLoading = false;
let hasMoreResults = true;

document.addEventListener('DOMContentLoaded', function() {
    const searchResultsString = localStorage.getItem('searchResults');

    if (searchResultsString) {
        try {
            const searchResults = JSON.parse(searchResultsString);
            if (searchResults.result && searchResults.result.result && searchResults.result.result.data) {
                displayResults(searchResults.result.result);
            } else {
                console.log('No results found');
            }
        } catch (error) {
            console.error('Error parsing search results:', error);
        }
    } else {
        console.log('No search results in localStorage');
    }

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
});

function displayResults(results) {
    const productGrid = document.getElementById('productGrid');
    const resultsCountElement = document.getElementById('resultsCount');
    const products = results.data || [];
    const totalRecords = results.totalRecords || 0;

    if (products.length > 0) {
        products.forEach(item => {
            const productCard = createProductCard(item);
            productGrid.appendChild(productCard);
        });
        if (resultsCountElement) {
            resultsCountElement.textContent = `Displaying ${productGrid.children.length} of ${totalRecords} results`;
        }
        hasMoreResults = productGrid.children.length < totalRecords;
    } else if (currentPage === 1) {
        productGrid.innerHTML = '<p>No results found.</p>';
    }

    hasMoreResults = productGrid.children.length < totalRecords;
}

function createProductCard(item) {
    const productCard = document.createElement('div');
    productCard.className = 'card';
    productCard.innerHTML = `
        <div class="card-image-container">
            <img src="${item.imageUrl}" loading="lazy" alt="${item.subjectTrans || 'Product Image'}" />
        </div>
        <div class="card-content">
            <h3 class="product-title">${item.subjectTrans || 'Product'}</h3>
            <p class="product-price">¥${item.priceInfo.price || 'Price not available'}</p>
        </div>
    `;
    return productCard;
}

function handleScroll() {
    if (isLoading || !hasMoreResults) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.body.offsetHeight;

    if (scrollPosition >= bodyHeight - 500) { // Load more when 500px from bottom
        loadMoreResults();
    }
}

async function loadMoreResults() {
    if (!localStorage.getItem('lastSearchImage')) {
        console.log('No previous search data available');
        hasMoreResults = false;
        return;
    }

    isLoading = true;
    currentPage++;

    const isImageUrl = localStorage.getItem('isImageUrl') === 'true';
    const imageData = localStorage.getItem('lastSearchImage');

    const uploadEndpoint = isImageUrl 
        ? 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/imageQuery'
        : 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/imageSearch';

    const requestBody = isImageUrl
        ? {
            imageAddress: imageData,
            beginPage: currentPage,
            pageSize: 10,
            country: "en",
            imageId: "0"
          }
        : {
            base64Image: imageData,
            beginPage: currentPage,
            pageSize: 10,
            country: "en"
          };

    try {
        const response = await fetch(uploadEndpoint, {
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
            displayResults(data.result.result);
        } else {
            hasMoreResults = false;
        }
    } catch (error) {
        console.error('Error loading more results:', error);
        hasMoreResults = false;
    } finally {
        isLoading = false;
    }
}

function createProductCard(item) {
    const productCard = document.createElement('div');
    productCard.className = 'card';
    productCard.innerHTML = `
        <div class="card-image-container">
            <img src="${item.imageUrl}" loading="lazy" alt="${item.subjectTrans || 'Product Image'}" />
        </div>
        <div class="card-content">
            <h3 class="product-title">${item.subjectTrans || 'Product'}</h3>
            <p class="product-price">¥${item.priceInfo.price || 'Price not available'}</p>
        </div>
    `;

    productCard.addEventListener('click', () => {
        redirectToProductPage(item);
    });

    return productCard;
}

function redirectToProductPage(productDetails) {
    // Store the product details in localStorage
    localStorage.setItem('currentProductDetails', JSON.stringify(productDetails));
    // Redirect to the product page
    window.location.href = 'product.html';
    // window.location.href = '/product';
}