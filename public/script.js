$(document).ready(function() {
    const noticiasPerPage = 10;
    let currentPage = 1;
    let totalNoticias = 0;
    let noticiasData = [];

    function renderPagination(totalPages) {
        const paginationContainer = $('.pagination');
        paginationContainer.empty();

        paginationContainer.append(`<a href="#" class="page-link noticia_pagination noticia_pagination_left" data-page="1">&laquo;</a>`);
        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.append(`<a href="#" class="page-link noticia_pagination" data-page="${i}">${i}</a>`);
        }
        paginationContainer.append(`<a href="#" class="page-link noticia_pagination noticia_pagination_right" data-page="${totalPages}">&raquo;</a>`);
    }

    function renderNoticias(page) {
        const startIndex = (page - 1) * noticiasPerPage;
        const endIndex = startIndex + noticiasPerPage;
        const noticiasContainer = $('#noticias-container');
        noticiasContainer.empty();

        const noticiasToRender = noticiasData.slice(startIndex, endIndex);
        noticiasToRender.forEach(function(noticia) {
            const noticiaHTML = `
                <div class="noticia_div" data-toggle="modal" data-target="#noticiaModal" data-id="${noticia.id}">
                    <div class="row">
                        <div class="col-11">
                            <div class="row">
                                <div class="col-12">
                                    <h5 class="noticia_title">${noticia.titulo}</h5>
                                </div>
                                <div class="col-12">
                                    ${noticia.descripcion_resumida}
                                </div>
                                <div class="col-12 noticia_fecha_col">
                                    <p class="noticia_fecha">Fecha de publicacion: ${noticia.fecha_noticia}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-1 d-flex justify-content-center align-items-center">
                            <img src="furnis/noticias/imagenes/resumidas/${noticia.imagen_resumida}.png" alt="${noticia.alt_imagen_resumida}" class="noticia_imagen_resumida">
                        </div>
                    </div>
                </div>
            `;
            noticiasContainer.append(noticiaHTML);
        });
    }

    function loadNoticias() {
        $.getJSON('furnis/noticias/noticias.json', function(data) {
            noticiasData = data.sort(function(a, b) {
                const dateA = new Date(a.fecha_noticia.split('-').reverse().join('-'));
                const dateB = new Date(b.fecha_noticia.split('-').reverse().join('-'));
                return dateB - dateA; // Sort descending
            });
            
            totalNoticias = noticiasData.length;
            const totalPages = Math.ceil(totalNoticias / noticiasPerPage);
            renderPagination(totalPages);
            renderNoticias(currentPage);
        });
    }

    $(document).on('click', '.page-link', function(e) {
        e.preventDefault();
        const page = $(this).data('page');
        if (page > 0 && page <= Math.ceil(totalNoticias / noticiasPerPage)) {
            currentPage = page;
            renderNoticias(currentPage);
        }
    });

    $(document).on('click', '.noticia_div', function() {
        const noticiaId = $(this).data('id');
        const noticia = noticiasData.find(n => n.id === noticiaId);

        $('#noticiaModalImage').attr('src', `furnis/noticias/imagenes/completas/${noticia.imagen_completa}.png`);
        $('#noticiaModalDescription').html(noticia.descripcion_completa);

        const clickSound = document.getElementById('click-sound');
        clickSound.play();

        $('#noticiaModal').modal('show');
    });

    function verifyIP(callback) {
        $.getJSON('/verify-ip', function(data) {
            callback();
        }).fail(function() {
            alert('Access forbidden: Proxy, VPN or Tor detected');
        });
    }

    function initialize() {
        const SECRET_KEY = '5229c0e71dddc98e14e7053988c57d20901e060b7d713ed4ccd5656c9192f47f';

        function fetchApiKey(callback) {
            $.getJSON('/api-key', function(data) {
                const decryptedData = decryptData(data.token);
                const API_KEY = decryptedData.apiKey;
                callback(API_KEY);
            });
        }

        function decryptData(token) {
            const bytes = CryptoJS.AES.decrypt(token, SECRET_KEY);
            const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            return decryptedData;
        }

        function loadOnlineCount() {
            $.getJSON('furnis/precios/habbo_online.json', function(data) {
                const habboEsCount = data[0].habbo_es;
                const habboBrCount = data[0].habbo_br;
                const habboComCount = data[0].habbo_com;
                $('#online-count-es').text(habboEsCount);
                $('#online-count-br').text(habboBrCount);
                $('#online-count-com').text(habboComCount);
            }).fail(function() {
                $('#online-count-es').text('En mantenimiento');
                $('#online-count-br').text('En mantenimiento');
                $('#online-count-com').text('En mantenimiento');
            });
        }

        loadOnlineCount();
        setInterval(loadOnlineCount, 3600000);

        function loadProducts(apiKey) {
            $.ajax({
                url: '/images',
                type: 'GET',
                headers: { 'x-api-key': apiKey },
                success: function(data) {
                    const decryptedData = decryptData(data.token);
                    var productContainer = $('#product-container');
                    var productHistoryContainer = $('#product-history-container');
                    var backButton = $('#back-button');
                    var searchContainer = $('#search-input');
                    var row_explanation_trends = $('#row_explanation_trends');
                    var row_explanation_votes = $('#row_explanation_votes');
                    var filter_tags = $('#filter_tags');

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
                                            ${item.icon == "mega_rare" ? `<img src="furnis/iconos/icon_mega_rare.png" class="iconos-funky" alt="icon">` : ''}
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

                        fillItemOptions(products);
                    }

                    renderProducts(decryptedData);

                    $('#search-input').on('input', function() {
                        var searchValue = $(this).val().toLowerCase();
                        var filteredProducts = decryptedData.filter(function(item) {
                            return item.name.toLowerCase().includes(searchValue);
                        });
                        renderProducts(filteredProducts);
                    });

                    $('.filter-button').on('click', function() {
                        var category = $(this).data('category');
                        if (category === 'all') {
                            renderProducts(decryptedData); // Mostrar todos los productos
                        } else {
                            var filteredProducts = decryptedData.filter(function(item) {
                                if (category === 'hot') {
                                    return item.hot == 1;
                                } else {
                                    return item.icon === category;
                                }
                            });
                            renderProducts(filteredProducts);
                        }
                    });

                    $(document).on('click', '.product-link', function(e) {
                        e.preventDefault();
                        var productId = $(this).data('id');
                        
                        fetchApiKey(function(apiKey) {
                            $.ajax({
                                url: `/price-history/${productId}`,
                                type: 'GET',
                                headers: { 'x-api-key': apiKey },
                                success: function(data) {
                                    const decryptedData = decryptData(data.token);
                                    searchContainer.hide();
                                    row_explanation_trends.hide();
                                    row_explanation_votes.hide();
                                    filter_tags.hide();
                                    productContainer.hide();
                                    productHistoryContainer.show();
                                    backButton.show();
                            
                                    var firstRecord = decryptedData[0];
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
                                    } else if (firstRecord.icon === "mega_rare") {
                                        imagePath = `furnis/rares/${firstRecord.name.replace(/ /g, '_')}.png`;
                                        imageClass = "price-history-img"
                                    }
                            
                                    var previousPrice = null;
                                    var actualPrice = true;
                                    var historyContent = `
                                        <h3 class="price_history_content habbo_text_blue">Historial de Precios</h3>
                                        <div class="price-history-image">
                                            <img src="${imagePath}" alt="${firstRecord.name}" class="${imageClass}">
                                        </div>
                                        <table class="table price_history_content">
                                            <thead>
                                                <tr>
                                                    <th class="habbo_text_blue">Fecha</th>
                                                    <th class="habbo_text_blue">Nombre</th>
                                                    <th class="habbo_text_blue">Precio <img src="furnis/dinero/credito.png" alt="credito" class="price-icon"></th>
                                                    <th class="habbo_text_blue">Precio <img src="furnis/dinero/vip.png" alt="vip" class="price-vip"></th>
                                                    <th class="habbo_text_blue">Tendencia</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${decryptedData.map((record, index) => {
                                                    const actualPrice = record.precio;
                                                    const previousPrice = index > 0 ? decryptedData[index - 1].precio : null;
                                                    const nextPrice = index < decryptedData.length - 1 ? decryptedData[index + 1].precio : null;
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
                                        <p class="price_history_content habbo_text_blue">${firstRecord.descripcion}</p>
                                    `;
                                    productHistoryContainer.html(historyContent);
                                }
                            });
                        });
                    });

                    backButton.on('click', function() {
                        productHistoryContainer.hide();
                        backButton.hide();
                        productContainer.show();
                        searchContainer.show();
                        row_explanation_trends.show();
                        row_explanation_votes.show();
                        filter_tags.show();
                    });

                    $(document).on('click', '.vote-button', function() {
                        var button = $(this);
                        var imageId = button.data('id');
                        var voteType = button.data('vote');
                        button.prop('disabled', true);
                    
                        fetchApiKey(function(apiKey) {
                            $.ajax({
                                url: `/images/${imageId}/vote`,
                                type: 'POST',
                                contentType: 'application/json',
                                headers: { 'x-api-key': apiKey },
                                data: JSON.stringify({ voteType: voteType }),
                                success: function(data) {
                                    const decryptedData = decryptData(data.token);
                                    var voteCountSpan = button.find('.vote-count');
                                    if (voteType === 'upvote') {
                                        voteCountSpan.text(decryptedData.upvotes);
                                    } else if (voteType === 'downvote') {
                                        voteCountSpan.text(decryptedData.downvotes);
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

                    function loadLastPriceUpdate() {
                        fetchApiKey(function(apiKey) {
                            $.ajax({
                                url: '/latest-price-update',
                                type: 'GET',
                                headers: { 'x-api-key': apiKey },
                                success: function(data) {
                                    const decryptedData = decryptData(data.token);
                                    const latestDate = new Date(decryptedData.fecha_precio);
                                    const formattedDate = latestDate.toLocaleDateString();
                                    $('#last_price_updated').text(formattedDate);
                                },
                                fail: function() {
                                    $('#last_price_updated').text('No disponible');
                                }
                            });
                        });
                    }

                    loadLastPriceUpdate();
                }
            });
        }

        fetchApiKey(loadProducts);
    }

    verifyIP(initialize);

    $('.menu-link').on('click', function(e) {
        e.preventDefault();
        var section = $(this).data('section');
        if (section === 'catalogo') {
            $('#catalogo-section').show();
            $('#column-explications-catalogo').show();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
        } else if (section === 'noticias') {
            loadNoticias();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').show();
            $('#calculador-section').hide();
        } else if (section === 'calculador') {
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').show();
        }
    });

    function fillItemOptions(products) {
        var itemASelect = $('#item-a');
        var itemBSelect = $('#item-b');
        itemASelect.empty();
        itemBSelect.empty();
    
        let optionNull = '<option value="0" data-src="" data-name="">Seleccione un item....</option>';
        itemASelect.append(optionNull);
        itemBSelect.append(optionNull);
    
        products.forEach(function(product) {
            var option = `<option value="${product.price}" data-src="${product.src}" data-name="${product.name}">${product.name}</option>`;
            itemASelect.append(option);
            itemBSelect.append(option);
        });
    
        $('#item-a').on('change', function() {
            updateImage('item-a');
            calculateEquivalent();
        });
    
        $('#item-b').on('change', function() {
            updateImage('item-b');
            calculateEquivalent();
        });
    }

    function updateImage(selectId) {
        var select = $('#' + selectId);
        var imageSrc = select.find('option:selected').data('src');
        if (imageSrc) {
            $('#' + selectId + '-image').html(`<img src="${imageSrc}" alt="${select.find('option:selected').text()}" class="img-fluid">`);
        } else {
            $('#' + selectId + '-image').html(''); // Clear the image if no item is selected
        }
    }

    function calculateEquivalent() {
        var itemASelect = $('#item-a');
        var itemBSelect = $('#item-b');
    
        var itemAPrice = parseFloat(itemASelect.val());
        var itemBPrice = parseFloat(itemBSelect.val());
    
        var itemNameA = itemASelect.find('option:selected').data('name');
        var itemNameB = itemBSelect.find('option:selected').data('name');
    
        if (itemAPrice && itemBPrice) {
            var equivalentAtoB = (itemAPrice / itemBPrice).toFixed(2);
            var equivalentBtoA = (itemBPrice / itemAPrice).toFixed(2);
            $('#equivalente').html(`<p class="online_habbo_text_white_fz_20 ">El furni "${itemNameA}" vale ${equivalentAtoB} "${itemNameB}"<br><br> Esto es lo mismo que decir que <br><br> El furni "${itemNameB}" vale ${equivalentBtoA} "${itemNameA}"</p>`);
            $('#item-a-price').html(`<p class="text-price"><img src="furnis/dinero/credito.png" alt="credito" class="price-icon">${itemAPrice}</p>`);
            $('#item-b-price').html(`<p class="text-price"><img src="furnis/dinero/credito.png" alt="credito" class="price-icon">${itemBPrice}</p>`);
        } else {
            $('#equivalente').text('');
            $('#item-a-price').text('');
            $('#item-b-price').text('');
        }
    }

    $('#noticiaModal').on('shown.bs.modal', function () {
        document.querySelectorAll('.footer-button').forEach(button => {
            button.addEventListener('mouseenter', function() {
                const img = this.querySelector('.button-icon');
                if (!img.src.includes('_focus')) {
                    img.dataset.originalSrc = img.src;
                    img.src = img.src.replace('.png', '_focus.png');
                }
            });
    
            button.addEventListener('mouseleave', function() {
                const img = this.querySelector('.button-icon');
                img.src = img.dataset.originalSrc;
            });
        });
    });
});
