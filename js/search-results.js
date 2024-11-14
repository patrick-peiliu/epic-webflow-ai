// Global variables
let currentPage = 1;
let isLoading = false;
let hasMoreResults = true;
let currentSortOption = 'relevant';

// Main initialization function
function initializeSearchResults() {
    loadInitialResults();
    updateWishlistCounter();
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
    setupSortButtons();
    setupLoadMoreButton();
}

function setupLoadMoreButton() {
    const loadMoreButton = document.getElementById('load-more-button');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            if (!isLoading && hasMoreResults) {
                loadMoreResults(false); // false indicates it's not a new search
            }
        });
    }
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

async function loadMoreResults(newSearch = false) {
    if (isLoading) return;

    isLoading = true;
    updateLoadingState(true);

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
        updateLoadingState(false);
        return;
    }

    const uploadEndpoint = 'https://degmvu0zx6.execute-api.us-east-1.amazonaws.com/Prod/imageQuery';

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
            updateResultsCount(data.result.result.totalRecords);
        } else {
            hasMoreResults = false;
        }
    } catch (error) {
        console.error('Error loading more results:', error);
        hasMoreResults = false;
    } finally {
        isLoading = false;
        updateLoadingState(false);
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
        updateResultsCount(totalRecords);
    } else if (newSearch) {
        productGrid.innerHTML = '<p>No results found.</p>';
    }
}

function updateLoadingState(isLoading) {
    const loadMoreButton = document.getElementById('load-more-button');
    if (loadMoreButton) {
        if (isLoading) {
            loadMoreButton.innerHTML = 'Loading <img src="https://cdn.prod.website-files.com/669bd37b63bfa4c0c5ff7765/66dadfb9e2fdbb07d0b2f446_loading.png" alt="Loading" class="loading-icon">';
            loadMoreButton.classList.add('loading');
        } else {
            loadMoreButton.innerHTML = 'Load more';
            loadMoreButton.classList.remove('loading');
        }
        loadMoreButton.disabled = isLoading;
    }
}

function updateResultsCount(totalRecords) {
    const resultsCountElements = document.querySelectorAll('.results-count');
    const productGrid = document.querySelector('.w-layout-hflex.grid-products');

    if (productGrid) {
        const displayedCount = productGrid.children.length;

        resultsCountElements.forEach(element => {
            element.textContent = `Displaying ${displayedCount} of ${totalRecords} results`;
        });

        const hasMoreResults = displayedCount < totalRecords;

        const loadMoreButton = document.getElementById('load-more-button');
        if (loadMoreButton) {
            loadMoreButton.style.display = hasMoreResults ? 'block' : 'none';
        }
    }
}

function createProductCard(item) {
    const productCard = document.createElement('div');
    productCard.className = 'card';
    productCard.innerHTML = `
        <div class="card-image-container">
            <img src="${item.imageUrl}" loading="lazy" alt="${item.subjectTrans || 'Product Image'}" />
            <div class="wishlist-icon">
                <img src="https://cdn.prod.website-files.com/669bd37b63bfa4c0c5ff7765/669ee220214d380bcfc1f169_heart-icon.png" alt="Add to wishlist" class="heart-icon">
            </div>
        </div>
        <div class="card-content">
            <h3 class="product-title">${item.subjectTrans || 'Product'}</h3>
            <div class="product-stats">
                <p class="monthly-sales">Monthly Sales:${item.monthSold || 0}</p>
                <p class="repurchase-rate">Repurchase rate:${item.repurchaseRate || '0%'}</p>
            </div>
        </div>
    `;

    productCard.dataset.productId = item.offerId;
    productCard.dataset.productDetails = JSON.stringify(item);

    checkWishlistStatus(productCard);

    productCard.addEventListener('click', (event) => {
        // Check if the clicked element is the wishlist icon or its child
        if (!event.target.closest('.wishlist-icon')) {
            redirectToProductPage(item);
        }
    });
    return productCard;
}

function redirectToProductPage(productDetails) {
    // Store the product details in localStorage
    localStorage.setItem('currentProductDetails', JSON.stringify(productDetails));
    // Redirect to the product page
    const encodedOfferId = Base64.encodeURI(productDetails.offerId);
    // Construct the URL
    const url = `product.html?id=${encodedOfferId}`;
    // For production, use:
    // const url = `/product?id=${encodedOfferId}`;
    
    // Open the URL in a new tab
    window.open(url, '_blank');
}

// Initialize the page
document.addEventListener('DOMContentLoaded', initializeSearchResults);

function setupWishlistFunctionality() {
    const productGrid = document.getElementById('productGrid');
    productGrid.addEventListener('click', function(e) {
        const wishlistIcon = e.target.closest('.wishlist-icon');
        if (wishlistIcon) {
            e.preventDefault(); // Prevent card click event
            const productCard = wishlistIcon.closest('.card');
            const productId = productCard.dataset.productId;
            toggleWishlist(productCard);
            updateWishlistCounter();
        }
    });
}

function toggleWishlist(productCard) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const productDetails = JSON.parse(productCard.dataset.productDetails);
    const index = wishlist.findIndex(item => item.offerId === productDetails.offerId);

    if (index > -1) {
        wishlist.splice(index, 1);
        updateWishlistButton(productCard, false);
    } else {
        wishlist.push({
            offerId: productDetails.offerId,
            imageUrl: productDetails.imageUrl,
            subjectTrans: productDetails.subjectTrans,
            originalUrl: `https://detail.1688.com/offer/${productDetails.offerId}.html`
        });
        updateWishlistButton(productCard, true);
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function updateWishlistButton(productCard, isWishlisted) {
    const heartIcon = productCard.querySelector('.heart-icon');
    if (isWishlisted) {
        heartIcon.src = 'https://cdn.prod.website-files.com/669bd37b63bfa4c0c5ff7765/66a16605ed582742f5697ac1_heart-filled-02.png';
    } else {
        heartIcon.src = 'https://cdn.prod.website-files.com/669bd37b63bfa4c0c5ff7765/669ee220214d380bcfc1f169_heart-icon.png';
    }
}

function checkWishlistStatus(productCard) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const productDetails = JSON.parse(productCard.dataset.productDetails);
    const isWishlisted = wishlist.some(item => item.offerId === productDetails.offerId);
    updateWishlistButton(productCard, isWishlisted);
}

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

// Call this function after loading the search results
setupWishlistFunctionality();