// 五右衛門 ECサイト - お気に入り JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadWishlist();
});

// お気に入りを読み込み
function loadWishlist() {
    const wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];
    const wishlistGrid = document.getElementById('wishlistGrid');
    const emptyWishlist = document.getElementById('emptyWishlist');
    const wishlistCount = document.getElementById('wishlistCount');

    // 件数を表示
    wishlistCount.textContent = `${wishlist.length}件の商品`;

    if (wishlist.length === 0) {
        // お気に入りが空の場合
        emptyWishlist.style.display = 'block';
        wishlistGrid.style.display = 'none';
    } else {
        // お気に入り商品を表示
        emptyWishlist.style.display = 'none';
        wishlistGrid.style.display = 'grid';
        displayWishlistItems(wishlist);
    }
}

// お気に入り商品を表示
function displayWishlistItems(wishlist) {
    const wishlistGrid = document.getElementById('wishlistGrid');

    wishlistGrid.innerHTML = wishlist.map(item => `
        <div class="product-card" style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; transition: transform 0.3s;">
            <div style="position: relative;">
                <a href="goemon-product.html?id=${item.id}">
                    <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 250px; object-fit: cover;">
                </a>
                <button class="btn-remove-wishlist" data-id="${item.id}" style="position: absolute; top: 10px; right: 10px; background: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s;">
                    <i class="fas fa-heart" style="color: #e74c3c; font-size: 18px;"></i>
                </button>
            </div>
            <div style="padding: 15px;">
                <h3 style="font-size: 16px; margin-bottom: 10px; height: 48px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                    <a href="goemon-product.html?id=${item.id}" style="color: #333; text-decoration: none;">
                        ${item.name}
                    </a>
                </h3>
                <p style="font-size: 20px; font-weight: bold; color: #e74c3c; margin-bottom: 15px;">
                    ¥${item.price.toLocaleString()}
                </p>
                <a href="goemon-product.html?id=${item.id}" class="btn-cmn-02" style="display: block; text-align: center; text-decoration: none; padding: 10px;">
                    商品を見る
                </a>
            </div>
        </div>
    `).join('');

    // 削除ボタンのイベントリスナーを追加
    const removeButtons = document.querySelectorAll('.btn-remove-wishlist');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            removeFromWishlist(productId);
        });
    });
}

// お気に入りから削除
function removeFromWishlist(productId) {
    if (!confirm('お気に入りから削除しますか?')) return;

    try {
        let wishlist = JSON.parse(localStorage.getItem('goemonwishlist')) || [];
        wishlist = wishlist.filter(item => item.id !== productId);
        localStorage.setItem('goemonwishlist', JSON.stringify(wishlist));

        // 再読み込み
        loadWishlist();
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        alert('お気に入りから削除できませんでした');
    }
}
