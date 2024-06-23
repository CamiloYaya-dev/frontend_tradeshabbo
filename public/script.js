$(document).ready(function() {
    /*$.get('/api/checkin-count', function(data) {
        $('#online-count').text(data.count);
    });*/
    // Cargar productos desde el servidor
    $.getJSON('/images', function(data) {
        var productContainer = $('#product-container');

        // Función para renderizar los productos
        function renderProducts(products) {
            productContainer.empty();
            products.forEach(function(item) {
                var borderClass = item.highlight == 1 ? 'highlight-border' : '';
                var productCard = `
                    <div class="col-md-3 col-sm-6 mb-4 product-item">
                        <div class="card h-100 position-relative ${borderClass}">
                            ${item.icon == "hc" ? `<img src="furnis/iconos/icon_hc.png" class="iconos-hc" alt="icon">` : ''}
                            ${item.icon == "rare" ? `<img src="furnis/iconos/icon_rare.png" class="iconos-rare" alt="icon">` : ''}
                            ${item.hot == 1 ? `<img src="furnis/iconos/hot_sale.png" class="iconos-hot-sale" alt="icon">` : ''}
                            ${item.status == "arrow_trend_up" ? `<img src="furnis/iconos/arrow_trend_up.png" class="iconos-arrow-trend-up" alt="icon">` : ''}
                            ${item.status == "arrow_trend_down" ? `<img src="furnis/iconos/arrow_trend_down.png" class="iconos-arrow-trend-down" alt="icon">` : ''}
                            <img src="${item.src}" class="card-img-top" alt="${item.name}">
                            <div class="card-body text-center">
                                <p class="card-text text-price">
                                    <img src="furnis/dinero/credito.png" alt="credito" class="price-icon">${item.price}
                                </p>
                                <p class="card-text text-name">${item.name}</p>
                            </div>
                        </div>
                    </div>
                `;
                productContainer.append(productCard);
            });
        }

        // Renderizar todos los productos inicialmente
        renderProducts(data);

        // Filtrar productos según el valor del campo de búsqueda
        $('#search-input').on('input', function() {
            var searchValue = $(this).val().toLowerCase();
            var filteredProducts = data.filter(function(item) {
                return item.name.toLowerCase().includes(searchValue);
            });
            renderProducts(filteredProducts);
        });
    });
});
