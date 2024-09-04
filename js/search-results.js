// Global variables
let currentPage = 1;
let isLoading = false;
let hasMoreResults = true;
let currentSortOption = 'relevant';

// Main initialization function
function initializeSearchResults() {
    loadInitialResults();
    // Wait for the DOM to be fully loaded before setting up event listeners
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEventListeners);
    } else {
        setupEventListeners();
    }
}

// Load initial results from localStorage
function loadInitialResults() {
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
}

// Setup event listeners
function setupEventListeners() {
    window.addEventListener('scroll', handleScroll);
    setupSortButtons();
}

// Setup sort buttons
function setupSortButtons() {
    const relevantButton = document.querySelector('#relevant-button .button-primary');
    const popularButton = document.querySelector('#popular-button .button-primary');

    if (relevantButton && popularButton) {
        relevantButton.addEventListener('click', (e) => handleSortButtonClick(e, 'relevant', relevantButton));
        popularButton.addEventListener('click', (e) => handleSortButtonClick(e, 'popular', popularButton));
    } else {
        console.error('One or more sort buttons not found in the DOM');
    }
}

// Handle sort button click
function handleSortButtonClick(e, sortOption, button) {
    e.preventDefault();
    if (currentSortOption !== sortOption) {
        currentSortOption = sortOption;
        updateButtonStyles(button);
        currentPage = 1; // Reset to first page
        loadMoreResults(true);
    }
}

// Update button styles
function updateButtonStyles(selectedButton) {
    const buttons = document.querySelectorAll('.tags-grid .button-primary');
    buttons.forEach(button => {
        button.classList.remove('inverted');
        button.classList.add('inactive');
    });
    selectedButton.classList.remove('inactive');
    selectedButton.classList.add('inverted');
}

function handleScroll() {
    if (isLoading || !hasMoreResults) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.body.offsetHeight;

    if (scrollPosition >= bodyHeight - 500) { // Load more when 500px from bottom
        loadMoreResults();
    }
}

async function loadMoreResults(newSearch = false) {
    if (newSearch) {
        currentPage = 1;
        // Clear existing results here
    } else {
        currentPage++; // Increment the page number for subsequent requests
    }

    const isImageUrl = localStorage.getItem('isImageUrl') === 'true';
    const imageId = localStorage.getItem('imageId');
    const imageAddress = isImageUrl ? localStorage.getItem('lastSearchImage') : null;

    if (!imageId && !imageAddress) {
        console.log('No previous search data available');
        hasMoreResults = false;
        return;
    }

    isLoading = true;

    const uploadEndpoint = 'https://p1fvnvoh6d.execute-api.us-east-1.amazonaws.com/Prod/imageQuery';

    let requestBody = {
        beginPage: currentPage,
        pageSize: 20,
        country: "en"
    };

    if (isImageUrl) {
        requestBody.imageAddress = imageAddress;
        requestBody.imageId = "0";
    } else {
        requestBody.imageId = imageId;
    }

    // Add sort parameter based on currentSortOption
    if (currentSortOption === 'popular') {
        requestBody.sort = JSON.stringify({ monthSold: "desc" });
    }

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
            displayResults(data.result.result, newSearch);
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

function displayResults(results, newSearch) {
    const productGrid = document.getElementById('productGrid');
    const resultsCountElement = document.getElementById('resultsCount');
    const products = results.data || [];
    const totalRecords = results.totalRecords || 0;

    if (newSearch) {
        productGrid.innerHTML = ''; // Clear existing results
    }

    if (products.length > 0) {
        products.forEach(item => {
            const productCard = createProductCard(item);
            productGrid.appendChild(productCard);
        });
        if (resultsCountElement) {
            resultsCountElement.textContent = `Displaying ${productGrid.children.length} of ${totalRecords} results`;
        }
        hasMoreResults = productGrid.children.length < totalRecords;
    } else if (newSearch) {
        productGrid.innerHTML = '<p>No results found.</p>';
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
            <div class="product-stats">
                <p class="monthly-sales">Monthly Sales:${item.monthSold || 0}</p>
                <p class="repurchase-rate">Repurchase rate:${item.repurchaseRate || '0%'}</p>
            </div>
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
    const encodedOfferId = Base64.encodeURI(productDetails.offerId);
    window.location.href = `product.html?id=${encodedOfferId}`;
    // production url
    // window.location.href = `/product?id=${encodedOfferId}`;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', initializeSearchResults);