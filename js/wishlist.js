document.addEventListener('DOMContentLoaded', function() {
    const wishlistContainer = document.getElementById('wishlistGrid');

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
        console.log('Saved wishlist:', JSON.stringify(wishlist));
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
            return;
        }

        wishlist.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${item.imageUrl}" loading="lazy" alt="${item.subjectTrans}" />
                <h3 class="h3 _24-28">${item.subjectTrans}</h3>
                <div class="w-layout-hflex like-dislike-line">
                    <a href="#" class="link-text remove-wishlist" data-offer-id="${item.offerId}">Remove</a>
                    <img src="https://cdn.prod.website-files.com/669bd37b63bfa4c0c5ff7765/66a16605ed582742f5697ac1_heart-filled-02.png" loading="lazy" alt="" class="heart-icon filled" />
                </div>
            `;
            wishlistContainer.appendChild(card);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-wishlist').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                removeFromWishlist(this.dataset.offerId);
            });
        });
    }

    function removeFromWishlist(offerId) {
        let wishlist = getWishlist();
        
        wishlist = wishlist.filter(item => String(item.offerId) !== String(offerId));
        
        saveWishlist(wishlist);
        
        // Force a re-fetch from localStorage to verify the save
        let updatedWishlist = getWishlist();
        
        displayWishlist();
    }

    // Check if the wishlist container exists before trying to display the wishlist
    if (wishlistContainer) {
        displayWishlist();
    } else {
        console.log('Wishlist container not found on this page');
    }
});