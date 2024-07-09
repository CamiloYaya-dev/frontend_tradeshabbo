$(document).ready(function() {

    let isRepeating = false;
    let songs = [];

    // Inicializar el reproductor de audio con MediaElement.js
    const player = new MediaElementPlayer('audio-player', {
        features: ['playpause', 'current', 'progress', 'duration', 'volume'],
    });

    // Manejar el botón de repetir
    $('#repeat-button').on('click', function() {
        isRepeating = !isRepeating;
        $(this).toggleClass('btn-primary btn-danger');
        $(this).text(isRepeating ? 'No Repetir' : 'Repetir');
    });

    // Repetir la pista si isRepeating es true
    $('#audio-player').on('ended', function() {
        if (isRepeating) {
            this.play();
        } else {
            playRandomSong();
        }
    });

    // Cargar canciones desde el servidor
    $.getJSON('/get-songs', function(data) {
        songs = data;
        const trackList = $('#track-list');
        const audioPlayer = $('#audio-player')[0];

        songs.forEach(song => {
            trackList.append(new Option(song.name, song.path));
        });

        // Cambiar la pista cuando se selecciona una nueva canción
        trackList.on('change', function() {
            const selectedSong = $(this).val();
            audioPlayer.setSrc(selectedSong);
            audioPlayer.load();
            audioPlayer.play();
        });

        // Reproducir la primera canción por defecto
        if (songs.length > 0) {
            audioPlayer.setSrc(songs[0].path);
            audioPlayer.load();
            audioPlayer.play();
        }
    });

    // Manejar el botón de canción aleatoria
    $('#shuffle-button').on('click', function() {
        playRandomSong();
    });

    function playRandomSong() {
        if (songs.length > 0) {
            const randomIndex = Math.floor(Math.random() * songs.length);
            const selectedSong = songs[randomIndex].path;
            const audioPlayer = $('#audio-player')[0];
            audioPlayer.setSrc(selectedSong);
            audioPlayer.load();
            audioPlayer.play();

            // Actualizar el select para reflejar la canción que está sonando
            $('#track-list').val(selectedSong);
        }
    }
    
    // Mostrar imagen en un modal
    $('body').append(`
        <div class="modal" id="priceGuidelineModal" tabindex="-1" role="dialog" aria-labelledby="priceGuidelineModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content online_users_content">
                    <div class="modal-header">
                        <h5 class="modal-title habbo_text_blue" id="priceGuidelineModalLabel">Aviso Importante</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body text-center">
                        <p class="online_habbo_text_white_fz_15">Se agregado una nueva seccion de <strong class="alerta_lloron">SORTEOS</strong> puedes verlos ahora en el menu o en el servidor de discord</p>
                        <strong class="alerta_lloron"><a href="https://discord.com/channels/1257448055050080297/1258640868496244736" target="_blank">DANDO CLICK AQUI</a></strong>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-dismiss="modal">Aceptar</button>
                    </div>
                </div>
            </div>
        </div>
    `);
    $('#priceGuidelineModal').modal('show');
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

    function loadSorteos() {
        $.getJSON('furnis/sorteos/sorteos.json', function(data) {
            sorteosData = data.sort(function(a, b) {
                return new Date(b.fecha) - new Date(a.fecha); // Sort descending by date
            });

            const sorteosContainer = $('#sorteos-container');
            sorteosContainer.empty();

            sorteosData.forEach(function(sorteo) {
                const sorteoHTML = `
                    <div class="col-md-3 col-sm-6 mb-4 catalog_item_div sorteo-item">
                        <div class="card h-100 position-relative rainbow-border">
                            <img src="${sorteo.src}" class="card-img-top" alt="${sorteo.name}">
                            <div class="card-body text-center">
                                <p class="card-text text-name online_habbo_text_white">${sorteo.name}</p>
                                <a href="${sorteo.link}" class="text-decoration-none" target="_blank">
                                    <img src="furnis/sorteos/click_y_participa.png" class="card-img-buttom sorteo-button" alt="${sorteo.name} Click para participar">
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                sorteosContainer.append(sorteoHTML);
            });
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
                    var sortSelect = $('#sort-options');
                    var creditUsdPriceHabbo = 0.06899;
                    var creditUsdPriceIlegal = 0.06;
                    var creditUsdPriceHabboEs = 1.72;
                    function renderProducts(products) {
                        productContainer.empty();
                        products.forEach(function(item) {
                            var borderClass = item.highlight == 1 ? 'highlight-border' : '';
                            var productCard = `
                                <div class="col-md-3 col-sm-6 mb-4 product-item catalog_item_div">
                                    <div class="card h-100 position-relative ${borderClass}">
                                        <a href="#" class="text-decoration-none product-link" data-id="${item.id}">
                                            <div>
                                                ${item.icon == "hc" ? `<img src="furnis/iconos/icon_hc.png" class="iconos-hc" alt="icon">` : ''}
                                                ${item.icon == "rare" ? `<img src="furnis/iconos/icon_rare.png" class="iconos-rare" alt="icon">` : ''}
                                                ${item.icon == "funky" ? `<img src="furnis/iconos/icon_funky.png" class="iconos-funky" alt="icon">` : ''}
                                                ${item.icon == "mega_rare" ? `<img src="furnis/iconos/icon_mega_rare.png" class="iconos-funky" alt="icon">` : ''}
                                                ${item.hot == 1 ? `<img src="furnis/iconos/hot_sale.png" class="iconos-hot-sale" alt="icon">` : ''}
                                                <img src="${item.src}" class="card-img-top" alt="${item.name}">
                                                ${item.status == "arrow_trend_up" ? `<img src="furnis/iconos/arrow_trend_up.png" class="iconos-arrow-trend-up" alt="icon">` : ''}
                                                ${item.status == "arrow_trend_down" ? `<img src="furnis/iconos/arrow_trend_down.png" class="iconos-arrow-trend-down" alt="icon">` : ''}
                                                ${!item.status ? `<div class="div-no-arrow"></div>` : ''}
                                            </div>
                                        </a>
                                        <div class="card-body text-center">
                                            <p class="card-text text-price">
                                                <img src="furnis/dinero/credito.png" alt="credito" class="price-icon" data-toggle="tooltip" title="Precio en Créditos">${item.price}
                                                <img src="furnis/dinero/vip.png" alt="vip" class="price-vip" data-toggle="tooltip" title="Precio en Vips">${(item.price / item.vip_price).toFixed(2)}
                                            </p>
                                            <p class="card-text text-price-other-markets">
                                                <img src="furnis/iconos/icon_habbo.png" alt="habbo" class="price-habbo" data-toggle="tooltip" title="Precio Habbo en dolares">${(creditUsdPriceHabbo * item.price).toFixed(2)}
                                                <img src="furnis/iconos/icon_precio_externo.png" alt="precio_externo" class="price-market" data-toggle="tooltip" title="Precio Externo en dolares">${(creditUsdPriceIlegal * item.price).toFixed(2)}
                                                <img src="furnis/iconos/icon_espana.png" alt="precio_externo" class="price-habbo-es" data-toggle="tooltip" title="Precio Creditos .ES">${(creditUsdPriceHabboEs * item.price)}
                                            </p>
                                            <p class="card-text text-name online_habbo_text_white catalog_item_name">${item.name} ${item.mote ? `(${item.mote})` : ''}</p>
                                            <div class="row">
                                                <div class="col-6 d-flex flex-column justify-content-around opinion_precio catalog_votes">
                                                    <span class="online_habbo_text_white">¿Precio adecuado?</span>
                                                    <div class="d-flex justify-content-around">
                                                        <button class="price_history_content vote-button-opinion" data-id="${item.id}" data-vote="upvote">👍<span class="vote-count-opinion">${item.upvotes}</span></button>
                                                        <button class="price_history_content vote-button-opinion" data-id="${item.id}" data-vote="downvote">👎<span class="vote-count-opinion">${item.downvotes}</span></button>
                                                    </div>
                                                </div>
                                                <div class="col-6 d-flex flex-column justify-content-around opinion_precio">
                                                    <span class="online_habbo_text_white">¿Subirá o bajará?</span>
                                                    <div class="d-flex justify-content-around">
                                                        <button class="price_history_content vote-button-belief" data-id="${item.id}" data-vote="upprice"><img src="furnis/iconos/up_price_history.png" alt="up price" class="price-icon"><span class="vote-count-belief">${item.upvotes_belief || 0}</span></button>
                                                        <button class="price_history_content vote-button-belief" data-id="${item.id}" data-vote="downprice"><img src="furnis/iconos/down_price_history.png" alt="down price" class="price-icon"><span class="vote-count-belief">${item.downvotes_belief || 0}</span></button>
                                                    </div>
                                                </div>
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

                    // Manejar el evento de cambio del select de ordenación
                    sortSelect.on('change', function() {
                        var sortBy = $(this).val();
                        var sortedProducts = [...decryptedData];

                        if (sortBy === 'price_desc') {
                            console.log('repre 1');
                            sortedProducts.sort((a, b) => b.price - a.price);
                        } else if (sortBy === 'price_asc') {
                            console.log('repre 2');
                            sortedProducts.sort((a, b) => a.price - b.price);
                        } else if (sortBy === 'date_desc') {
                            console.log('repre 3');
                            sortedProducts.sort((a, b) => new Date(b.fecha_precio) - new Date(a.fecha_precio));
                        } else if (sortBy === 'date_asc') {
                            console.log('repre 4');
                            sortedProducts.sort((a, b) => new Date(a.fecha_precio) - new Date(b.fecha_precio));
                        }
                        console.log(sortedProducts);
                        renderProducts(sortedProducts);
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

                    $(document).on('click', '.vote-button-opinion', function() {
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
                                    var voteCountSpan = button.find('.vote-count-opinion');
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

                    $(document).on('click', '.vote-button-belief', function() {
                        var button = $(this);
                        var imageId = button.data('id');
                        var voteType = button.data('vote');
                        button.prop('disabled', true);
                    
                        fetchApiKey(function(apiKey) {
                            $.ajax({
                                url: `/images/${imageId}/vote-belief`,
                                type: 'POST',
                                contentType: 'application/json',
                                headers: { 'x-api-key': apiKey },
                                data: JSON.stringify({ voteType: voteType }),
                                success: function(data) {
                                    const decryptedData = decryptData(data.token);
                                    var voteCountSpan = button.find('.vote-count-belief');
                                    if (voteType === 'upprice') {
                                        voteCountSpan.text(decryptedData.upvotes_belief);
                                    } else if (voteType === 'downprice') {
                                        voteCountSpan.text(decryptedData.downvotes_belief);
                                    }
                                    button.prop('disabled', false);
                                },
                                error: function(jqXHR) {
                                    if (jqXHR.status === 403) {
                                        alert('Usted ya voto si cree que subira o bajara el precio de este articulo.');
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
                                    const formattedDate = latestDate.toLocaleString();
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
            $('#sorteos-section').hide();
        } else if (section === 'noticias') {
            loadNoticias();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').show();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
        } else if (section === 'calculador') {
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').show();
            $('#sorteos-section').hide();
        } else if (section === 'sorteos') {
            loadSorteos();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').show();
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

    $('#toggle-button').on('click', function() {
        $('#music-player-container').toggleClass('minimized');
    });

    $('[data-toggle="tooltip"]').tooltip(); 
});
