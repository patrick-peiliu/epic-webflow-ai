document.addEventListener('DOMContentLoaded', function() {
    const wishlistContainer = document.getElementById('wishlistGrid');
    const wishListsField = document.getElementById('Wishlists');

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

    function saveWishlist(wishlist) {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        updateWishlistField(wishlist);
    }

    function updateWishlistField(wishlist) {
        if (wishListsField) {
            wishListsField.value = JSON.stringify(wishlist);
        }
    }

    function displayWishlist() {
        if (!wishlistContainer) {
            console.log('Wishlist container not found on this page');
            return;
        }

        let wishlist = getWishlist();
        wishlistContainer.innerHTML = '';

        if (wishlist.length === 0) {
            wishlistContainer.innerHTML = '<p>Your wishlist is empty.</p>';
            updateWishlistField([]);
            return;
        }

        wishlist.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-image-container">
                    <img src="${item.imageUrl}" loading="lazy" alt="${item.subjectTrans}" />
                </div>
                <div class="wishlist-card-content">
                    <h3 class="wishlist-product-title">${item.subjectTrans}</h3>
                    <div class="w-layout-hflex like-dislike-line">
                        <a href="#" class="link-text remove-wishlist" data-offer-id="${item.offerId}">Remove</a>
                    </div>
                </div>
            `;

            card.addEventListener('click', (event) => {
                // Prevent redirection if the click is on the remove button
                if (!event.target.closest('.remove-wishlist')) {
                    redirectToProductPage(item);
                }
            });

            wishlistContainer.appendChild(card);
        });

        document.querySelectorAll('.remove-wishlist').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Prevent the card click event from firing
                removeFromWishlist(this.dataset.offerId);
            });
        });

        updateWishlistField(wishlist);
    }

    function removeFromWishlist(offerId) {
        let wishlist = getWishlist();
        
        wishlist = wishlist.filter(item => String(item.offerId) !== String(offerId));
        
        saveWishlist(wishlist);
        
        // Force a re-fetch from localStorage to verify the save
        let updatedWishlist = getWishlist();
        
        displayWishlist();
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

    // Check if the wishlist container exists before trying to display the wishlist
    if (wishlistContainer) {
        displayWishlist();
    } else {
        console.log('Wishlist container not found on this page');
    }
});