let currentPage = 1;
let isLoading = false;
let hasMoreResults = true;

document.addEventListener('DOMContentLoaded', function() {
    const productGrid = document.getElementById('productGrid');
    const resultsCountElement = document.getElementById('resultsCount');
    const searchResultsString = localStorage.getItem('searchResults');

    if (searchResultsString && resultsCountElement) {
        try {
            const searchResults = JSON.parse(searchResultsString);
            if (searchResults.result && searchResults.result.result && searchResults.result.result.data) {
                displayResults(searchResults.result.result);
            } else {
                productGrid.innerHTML = '<p>Invalid search results structure.</p>';
            }
        } catch (error) {
            console.error('Error parsing search results:', error);
            productGrid.innerHTML = '<p>Error displaying search results.</p>';
        }
    } else {
        productGrid.innerHTML = '<p>No search results available.</p>';
    }

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Clear the localStorage after displaying the results
    localStorage.removeItem('searchResults');
});

function displayResults(results) {
    const productGrid = document.getElementById('productGrid');
    const resultsCountElement = document.getElementById('resultsCount');
    const products = results.data;
    const totalRecords = results.totalRecords;

    if (products.length > 0) {
        products.forEach(item => {
            const productCard = createProductCard(item);
            productGrid.appendChild(productCard);
        });
        resultsCountElement.textContent = `Displaying ${productGrid.children.length} of ${totalRecords} results`;
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