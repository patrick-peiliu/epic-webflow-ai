document.addEventListener('DOMContentLoaded', function() {
    const productGrid = document.getElementById('productGrid');
    const searchResultsString = localStorage.getItem('searchResults');

    if (searchResultsString) {
        try {
            const searchResults = JSON.parse(searchResultsString);
            if (searchResults.result && searchResults.result.result && searchResults.result.result.data) {
                const products = searchResults.result.result.data;
                if (products.length > 0) {
                    products.forEach(item => {
                        const productCard = document.createElement('div');
                        productCard.className = 'card';
                        productCard.innerHTML = `
                            <img src="${item.imageUrl}" loading="lazy" alt="${item.subjectTrans || 'Product Image'}" />
                            <h3 class="product-title">${item.subjectTrans || 'Product'}</h3>
                            <p class="product-price">¥${item.priceInfo.price || 'Price not available'}</p>
                            <div class="wishlist-container">
                                <a href="#" class="wishlist-link">Show my wishlist</a>
                                <img src="images/heart-icon.png" loading="lazy" alt="" class="heart-icon" />
                            </div>
                        `;
                        productGrid.appendChild(productCard);
                    });
                } else {
                    productGrid.innerHTML = '<p>No results found.</p>';
                }
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

    // Clear the localStorage after displaying the results
    localStorage.removeItem('searchResults');
});