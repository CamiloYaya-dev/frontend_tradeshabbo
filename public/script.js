$(document).ready(function() {
    // Función para cargar el número de Habbos en línea
    function loadOnlineCount() {
        $.getJSON('furnis/precios/habbo_online.json', function (data) {
            const habboEsCount = data[0].habbo_es;
            const habboBrCount = data[0].habbo_br;
            const habboComCount = data[0].habbo_com;
            $('#online-count-es').text(habboEsCount);
            $('#online-count-br').text(habboBrCount);
            $('#online-count-com').text(habboComCount);
        }).fail(function () {
            $('#online-count-es').text('En mantenimiento');
            $('#online-count-br').text('En mantenimiento');
            $('#online-count-com').text('En mantenimiento');
        });
    }

    // Llamar a la función cuando la página se carga
    loadOnlineCount();

    // Llamar a la función cada hora
    setInterval(loadOnlineCount, 3600000);

    // Cargar productos desde el servidor
    $.getJSON('/images', function(data) {
        var productContainer = $('#product-container');
        var productHistoryContainer = $('#product-history-container');
        var backButton = $('#back-button');
        var searchContainer = $('#search-input');
        var row_explanation_trends = $('#row_explanation_trends');
        var row_explanation_votes = $('#row_explanation_votes');
        var filter_tags = $('#filter_tags');

        // Función para renderizar los productos
        function renderProducts(products) {
            productContainer.empty();
            products.forEach(function(item) {
                var borderClass = item.highlight == 1 ? 'highlight-border' : '';
                var productCard = `
                    <div class="col-md-3 col-sm-6 mb-4 product-item">
                        <div class="card h-100 position-relative ${borderClass}">
                            <a href="#" class="text-decoration-none product-link" data-id="${item.id}">
                                ${item.icon == "hc" ? `<img src="furnis/iconos/icon_hc.png" class="iconos-hc" alt="icon">` : ''}
                                ${item.icon == "rare" ? `<img src="furnis/iconos/icon_rare.png" class="iconos-rare" alt="icon">` : ''}
                                ${item.icon == "funky" ? `<img src="furnis/iconos/icon_funky.png" class="iconos-funky" alt="icon">` : ''}
                                ${item.hot == 1 ? `<img src="furnis/iconos/hot_sale.png" class="iconos-hot-sale" alt="icon">` : ''}
                                ${item.status == "arrow_trend_up" ? `<img src="furnis/iconos/arrow_trend_up.png" class="iconos-arrow-trend-up" alt="icon">` : ''}
                                ${item.status == "arrow_trend_down" ? `<img src="furnis/iconos/arrow_trend_down.png" class="iconos-arrow-trend-down" alt="icon">` : ''}
                                <img src="${item.src}" class="card-img-top" alt="${item.name}">
                            </a>
                                <div class="card-body text-center">
                                    <p class="card-text text-price">
                                        <img src="furnis/dinero/credito.png" alt="credito" class="price-icon">${item.price}
                                        <img src="furnis/dinero/vip.png" alt="vip" class="price-vip">${(item.price / item.vip_price).toFixed(2)}
                                    </p>
                                    <p class="card-text text-name online_habbo_text_white">${item.name}</p>
                                    <div class="vote-buttons">
                                        <button class="price_history_content vote-button" data-id="${item.id}" data-vote="upvote">👍<span class="vote-count">${item.upvotes}</span></button>
                                        <button class="price_history_content vote-button" data-id="${item.id}" data-vote="downvote">👎<span class="vote-count">${item.downvotes}</span></button>
                                    </div>
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

        // Filtrar productos por categoría al hacer clic en los botones
        $('.filter-button').on('click', function() {
            var category = $(this).data('category');
            if (category === 'all') {
                renderProducts(data); // Mostrar todos los productos
            } else {
                var filteredProducts = data.filter(function(item) {
                    if (category === 'hot') {
                        return item.hot == 1;
                    } else {
                        return item.icon === category;
                    }
                });
                renderProducts(filteredProducts);
            }
        });

        // Manejar clic en un producto para mostrar el historial de precios
        $(document).on('click', '.product-link', function(e) {
            e.preventDefault();
            var productId = $(this).data('id');
        
            $.getJSON(`/price-history/${productId}`, function(historyData) {
                searchContainer.hide();
                row_explanation_trends.hide();
                row_explanation_votes.hide();
                filter_tags.hide();
                productContainer.hide();
                productHistoryContainer.show();
                backButton.show();
        
                var firstRecord = historyData[0];
                console.log(firstRecord);
                var imagePath = '';
                if (firstRecord.icon === 'hc') {
                    imagePath = `furnis/hc/${firstRecord.name.replace(/ /g, '_')}.png`;
                    imageClass = "price-history-img"
                } else if (firstRecord.icon === 'rare') {
                    imagePath = `furnis/rares/${firstRecord.name.replace(/ /g, '_')}.png`;
                    imageClass = "price-history-img"
                } else if (firstRecord.icon === 'funky') {
                    imagePath = `furnis/rares/${firstRecord.name.replace(/ /g, '_')}.png`;
                    imageClass = "price-history-img-funky"
                }
        
                var previousPrice = null;
                var actualPrice = true;
                var historyContent = `
                    <h3 class="price_history_content online_habbo_text_blue">Historial de Precios</h3>
                    <div class="price-history-image">
                        <img src="${imagePath}" alt="${firstRecord.name}" class="${imageClass}">
                    </div>
                    <table class="table price_history_content">
                        <thead>
                            <tr>
                                <th class="online_habbo_text_blue">Fecha</th>
                                <th class="online_habbo_text_blue">Nombre</th>
                                <th class="online_habbo_text_blue">Precio <img src="furnis/dinero/credito.png" alt="credito" class="price-icon"></th>
                                <th class="online_habbo_text_blue">Precio <img src="furnis/dinero/vip.png" alt="vip" class="price-vip"></th>
                                <th class="online_habbo_text_blue">Tendencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${historyData.map((record, index) => {
                                const actualPrice = record.precio;
                                const previousPrice = index > 0 ? historyData[index - 1].precio : null;
                                const nextPrice = index < historyData.length - 1 ? historyData[index + 1].precio : null;
                                var trendIcon = '';
                                
                                if (previousPrice === null || nextPrice === null) {
                                    trendIcon = '<img class="equal_price_history" src="./furnis/iconos/equal_price_history.png" alt="equal price">';
                                } else if (actualPrice > previousPrice && actualPrice < nextPrice) {
                                    trendIcon = '<img class="down_price_history" src="./furnis/iconos/down_price_history.png" alt="up down price">';
                                } else if (actualPrice < previousPrice && actualPrice > nextPrice) {
                                    trendIcon = '<img class="up_price_history" src="./furnis/iconos/up_price_history.png" alt="up price">';
                                } else {
                                    trendIcon = '<img class="up_price_history" src="./furnis/iconos/up_price_history.png" alt="up price">';
                                }
                                return `
                                    <tr>
                                        <td class="online_habbo_text_white">${new Date(record.fecha_precio).toLocaleDateString()}</td>
                                        <td class="online_habbo_text_white">${record.name}</td>
                                        <td class="online_habbo_text_white">${record.precio}</td>
                                        <td class="online_habbo_text_white">${(record.precio / record.vip_price).toFixed(2)}</td>
                                        <td class="online_habbo_text_white">${trendIcon}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    <p class="price_history_content online_habbo_text_blue">${firstRecord.descripcion}</p>
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
            row_explanation_trends.show();
            row_explanation_votes.show();
            filter_tags.show();
        });

        // Manejar clic en los botones de votación
        $(document).on('click', '.vote-button', function() {
            var button = $(this);
            var imageId = button.data('id');
            var voteType = button.data('vote');
            button.prop('disabled', true);
    
            $.ajax({
                url: `/images/${imageId}/vote`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ voteType: voteType }),
                success: function(response) {
                    // Actualizar los contadores de votos en la interfaz
                    var voteCountSpan = button.find('.vote-count');
                    if (voteType === 'upvote') {
                        voteCountSpan.text(response.upvotes);
                    } else if (voteType === 'downvote') {
                        voteCountSpan.text(response.downvotes);
                    }
                    button.prop('disabled', false);
                },
                error: function(jqXHR) {
                    if (jqXHR.status === 403) {
                        alert('Usted ya ha votado a favor o en contra del precio de este articulo.');
                    } else {
                        alert('Error al votar. Por favor, inténtelo de nuevo.');
                    }
                    button.prop('disabled', false);
                }
            });
        });
    });
});
