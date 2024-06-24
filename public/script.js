$(document).ready(function() {
    // Cargar productos desde el servidor
    $.getJSON('/images', function(data) {
        var productContainer = $('#product-container');
        var productHistoryContainer = $('#product-history-container');
        var backButton = $('#back-button');
        var searchContainer = $('#search-input');

        // Función para renderizar los productos
        function renderProducts(products) {
            productContainer.empty();
            products.forEach(function(item) {
                var borderClass = item.highlight == 1 ? 'highlight-border' : '';
                var productCard = `
                    <div class="col-md-3 col-sm-6 mb-4 product-item">
                        <a href="#" class="text-decoration-none product-link" data-id="${item.id}">
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
                                    <p class="card-text text-name online_habbo_text_white">${item.name}</p>
                                </div>
                            </div>
                        </a>
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

        // Manejar clic en un producto para mostrar el historial de precios
        $(document).on('click', '.product-link', function(e) {
            e.preventDefault();
            var productId = $(this).data('id');

            $.getJSON(`/price-history/${productId}`, function(historyData) {
                console.log('Historial de precios:', JSON.stringify(historyData, null, 2));

                searchContainer.hide();
                productContainer.hide();
                productHistoryContainer.show();
                backButton.show();

                var firstRecord = historyData[0];
                var imagePath = '';
                if (firstRecord.icon === 'hc') {
                    imagePath = `furnis/hc/${firstRecord.name.replace(/ /g, '_')}.png`;
                } else if (firstRecord.icon === 'rare') {
                    imagePath = `furnis/rares/${firstRecord.name.replace(/ /g, '_')}.png`;
                }

                var historyContent = `
                    <h3 class="price_history_content online_habbo_text_blue">Historial de Precios</h3>
                    <div class="price-history-image">
                        <img src="${imagePath}" alt="${firstRecord.name}" class="price-history-img">
                    </div>
                    <table class="table price_history_content">
                        <thead>
                            <tr>
                                <th class="online_habbo_text_blue">Fecha</th>
                                <th class="online_habbo_text_blue">Nombre</th>
                                <th class="online_habbo_text_blue">Precio</th>
                                <th class="online_habbo_text_blue">Categoria</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${historyData.map(record =>`
                                <tr>
                                    <td class="online_habbo_text_white">${new Date(record.fecha_precio).toLocaleDateString()}</td>
                                    <td class="online_habbo_text_white">${record.name}</td>
                                    <td class="online_habbo_text_white">${record.precio}</td>
                                    <td>${record.icon == "hc" ? `<img src="furnis/iconos/icon_hc.png" class="iconos-hc-historico" alt="icon">` : 
                                        record.icon == "rare" ? `<img src="furnis/iconos/icon_rare.png" class="iconos-rare-historico" alt="icon">` : ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
                productHistoryContainer.html(historyContent);
            });
        });

        // Manejar clic en el botón de regreso para mostrar la lista de productos
        backButton.on('click', function() {
            productHistoryContainer.hide();
            backButton.hide();
            productContainer.show();
            searchContainer.show();
        });
    });
});
