document.addEventListener('DOMContentLoaded', function() {
    const resultsCountElement = document.getElementById('resultsCount');
    const productGrid = document.getElementById('productGrid');
    const searchResultsString = localStorage.getItem('searchResults');

    if (searchResultsString && resultsCountElement) {
        try {
            const searchResults = JSON.parse(searchResultsString);
            if (searchResults.result && searchResults.result.result && searchResults.result.result.data) {
                const products = searchResults.result.result.data;
                const totalRecords = searchResults.result.result.totalRecords;
                if (products.length > 0) {
                    products.forEach(item => {
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
                        productGrid.appendChild(productCard);
                        resultsCountElement.textContent = `Displaying ${products.length} of ${totalRecords} results`;
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
        productGrid.innerHTML = '<p></p>';
    }

    // Clear the localStorage after displaying the results
    localStorage.removeItem('searchResults');
});