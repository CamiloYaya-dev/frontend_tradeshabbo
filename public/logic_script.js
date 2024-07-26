function verifyIP(callback) {
    $.getJSON('/verify-ip', function(data) {
        callback();
    }).fail(function() {
        alert('Access forbidden: Proxy, VPN or Tor detected');
    });
}

function updateContent() {
    $('[data-i18n]').each(function() {
        var key = $(this).data('i18n');
        if ($(this).is("input")) {
            $(this).attr("placeholder", i18next.t(key.split(']')[1]));
        } else if (key.startsWith('[title]')) {
            $(this).attr("title", i18next.t(key.split(']')[1]));
        } else {
            $(this).html(i18next.t(key));
        }
    });
}

function changeLanguage(lng) {
    i18next.changeLanguage(lng, function(err, t) {
        if (err) return console.log('something went wrong loading', err);
        updateContent();
        localStorage.setItem('selectedLanguage', lng); // Guardar el idioma seleccionado en localStorage
    });
}

$(document).ready(function() {
    // Verificar si hay un idioma seleccionado en localStorage
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en'; // Valor por defecto es 'en'
    
    // Cambiar el idioma al seleccionado
    changeLanguage(selectedLanguage);
    
    // Actualizar el select del idioma
    $('#language-select').val(selectedLanguage);

    // Manejar el cambio de idioma desde el select
    $('#language-select').change(function() {
        const newLanguage = $(this).val();
        changeLanguage(newLanguage);
    });

    updateContent();
});

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

    function loadContador(){
        $.getJSON('../visitCount.json', function(data) {
            $('#contador').text(data.visits);
        }).fail(function() {
            $('#contador').text('En mantenimiento');
        });
    }

    loadOnlineCount();
    setInterval(loadOnlineCount, 3600000);

    function fetchFirebaseData() {
        return new Promise((resolve, reject) => {
            $.getJSON('/fetch-firebase-data', function(data) {
                resolve(data);
            }).fail(function(error) {
                reject(error);
            });
        });
    }

    function fetchItemData(callback) {
        $.getJSON('https://tc-api.serversia.com/items', function(data) {
            const itemData = data.map(item => ({
                id: item.id,
                name: item.name,
                slug: item.slug,
                hc_val: item.hc_val
            })).sort((a, b) => a.id - b.id); // Ordenar por id de menor a mayor
            callback(itemData);
        }).fail(function() {
            console.error('Error fetching item data');
            callback([]);
        });
    }

    function mapTradersClub(decryptedData, itemData) {
        const manualMapping = {
            1: 1, //club sofa
            2: 7, //jacuzzy
            3: 5, //imperiales
            4: 3, //trono hc
            5: 12, //da2hc
            6: 8, //cafetera
            7: 9, //escritorio hc
            8: 13, //lampara hc
            9: 2, //majestic
            10: 10, //mesa nordica
            11: 11, //hc set - mesahc
            12: 11, //hc set - mesahc
            13: 4, //habbocola
            44: 6, //vivo
            50: 14, //ph ticket
            23: 15, //pod funky
            22: 15, //pod funky
            21: 15, //pod funky
            20: 15, //pod funky
            19: 15, //pod funky
            46: 16, //alfombra funky
            47: 16, //alfombra funky
            48: 16, //alfombra funky
            49: 16, //alfombra funky
            51: 17, //almo purpura
            53: 22, //guirnalda morada
            52: 23, //guirnalda verde
            54: 18, //egg lila
            55: 20, //teleport britanico funky
            56: 24, // heladera dorada
            104: 25 // humared
        };
    
        decryptedData.forEach(decryptedItem => {
            const itemId = manualMapping[decryptedItem.id];
            if (itemId) {
                const matchingItem = itemData.find(item => item.id === itemId);
                if (matchingItem) {
                    if(itemId.id === 11 || itemId.id === 12){
                        decryptedItem.traders_club = matchingItem.hc_val / 5;
                    }else{
                        decryptedItem.traders_club = matchingItem.hc_val;
                    }
                    
                } else {
                    decryptedItem.traders_club = "N/A";
                }
            } else {
                decryptedItem.traders_club = "N/A";
            }
        });
    }

    function mapHabbonation(decryptedData, firebaseData) {
        const manualMapping = {
            2: "5",  //jacuzzy
            3: "1",  //imperiales
            4: "11",  //trono hc
            5: "6", //da2hc
            6: "3",  //cafetera
            7: "8",  //escritorio hc
            8: "9", //lampara hc
            9: "7",  //majestic
            10: "10", //mesa nordica
            11: "12", //hc set - mesahc
            12: "12", //hc set - mesahc
            13: "13",  //habbocola
            44: "14",  //vivo
            50: "-O14LE2bdCAJpds5g998", //ph ticket
            23: "-O14JZuYfwuw6x8-Fm1X", //pod funky
            22: "-O14JZuYfwuw6x8-Fm1X", //pod funky
            21: "-O14JZuYfwuw6x8-Fm1X", //pod funky
            20: "-O14JZuYfwuw6x8-Fm1X", //pod funky
            19: "-O14JZuYfwuw6x8-Fm1X", //pod funky
            46: "-O14NidAp6E44OFZ9bli", //alfombra funky
            47: "-O14NidAp6E44OFZ9bli", //alfombra funky
            48: "-O14NidAp6E44OFZ9bli", //alfombra funky
            49: "-O14NidAp6E44OFZ9bli", //alfombra funky
            51: "-O0p7fXT3HJnneJiU1Ik", //almo purpura
            53: "-O14OWTanqoE2ukWjBcS", //guirnalda morada
            52: "-O14O9uDOE07xffw92Tw", //guirnalda verde
            54: "-O1MUU23mb2SjRD4eUKi", //egg lila
            55: "-O1dq3aBROmChleZjPjP", //teleport britanico funky
            56: "-O1tGbbJU-DqRETGreA0", // heladera dorada
            18: "-O14NIUCN5VTZfSXU7xm", // silla funky
            28: "-O14NIUCN5VTZfSXU7xm", // silla funky
            29: "-O14NIUCN5VTZfSXU7xm", // silla funky
            30: "-O14NIUCN5VTZfSXU7xm", // silla funky
            31: "-O14NIUCN5VTZfSXU7xm" // silla funky
        };
    
        decryptedData.forEach(decryptedItem => {
            const itemId = manualMapping[decryptedItem.id];
            if (itemId) {
                const matchingItem = firebaseData[itemId];
                if (matchingItem) {
                    if ((matchingItem.id === "11" || matchingItem.id === "12")) {
                        decryptedItem.habbonation = parseFloat(matchingItem.price) / 5;
                    } else {
                        decryptedItem.habbonation = parseFloat(matchingItem.price);
                    }
                } else {
                    decryptedItem.habbonation = "N/A";
                }
            } else {
                decryptedItem.habbonation = "N/A";
            }
        });
    } 

    function loadProducts(apiKey, firebaseData) {
        fetchItemData(function(itemData) {
            $.ajax({
                url: '/images',
                type: 'GET',
                headers: { 'x-api-key': apiKey },
                success: function(data) {
                    loadContador();
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
                            var collapseId = `collapse${item.id}`;
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
                                            <div class="price-sections">
                                                <div class="section ingame">
                                                    <div class="row price_trades_habbo_origins">
                                                        <div class="col-12">
                                                            <p class="online_habbo_text_white">Origins .ES</p>
                                                            <p class="card-text text-price">
                                                                <img src="furnis/dinero/credito.png" alt="credito" class="price-icon-principal" data-toggle="tooltip" data-i18n="[title]titulo_creditos" title="Precio en Créditos">${item.price}
                                                                <img src="furnis/dinero/vip.png" alt="vip" class="price-vip-principal" data-toggle="tooltip" data-i18n="[title]titulo_vips" title="Precio en Vips">${(item.price / item.vip_price).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <button class="boton_collapse_otros_catalogos collapse_text_white" type="button" data-toggle="collapse" data-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                                                            Otros Precios <i class="fas fa-chevron-down toggle-icon"></i>
                                                        </button>
                                                    </div>
                                                    <div class="collapse text-price-es" id="${collapseId}">
                                                        <div class="row">
                                                            <div class="col-md-6 subsection origins">
                                                                <div>
                                                                    <div>
                                                                        <img src="furnis/iconos/icon_habbonation.png" alt="habbonation icon" class="habbonation_club_icon" data-toggle="tooltip" title="habbonation">
                                                                            <br>
                                                                        <img src="furnis/dinero/vip.png" alt="vip" class="price-vip" data-toggle="tooltip" data-i18n="[title]titulo_vips" title="Precio en Vips">${item.habbonation}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="col-md-6 subsection es">
                                                                <div class="section_es">
                                                                    <p class="online_habbo_text_white">Habbo .ES</p>
                                                                    <p class="card-text text-price-es">
                                                                        <span class="price-item">
                                                                            <img src="furnis/dinero/credito.png" alt="precio_habbo_es" class="credit-habbo-es" data-toggle="tooltip" data-i18n="[title]titulo_creditos_es" title="Precio Creditos .ES">
                                                                            ${Math.round(creditUsdPriceHabboEs * item.price)}
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                                <div class="section_origins_com">
                                                                    <p class="online_habbo_text_white_origins_com">Origins .COM</p>
                                                                    <p class="card-text text-price-es">
                                                                        <span class="price-item">
                                                                            <img src="furnis/iconos/icon_trader_club.png" alt="trader club icon" class="traders_club_icon" data-toggle="tooltip" title="traderclub.gg">
                                                                            <br>
                                                                            <img src="furnis/dinero/vip.png" alt="vip" class="price-vip" data-toggle="tooltip" data-i18n="[title]titulo_vips" title="Precio en Vips">${item.traders_club}
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div class="section_dolares">
                                                            <p class="online_habbo_text_white" data-i18n="dolares">Dólares <img src="furnis/iconos/icon_dolar.png" alt="dolar" class="dolar" data-toggle="tooltip" data-i18n="[title]titulo_dolares" title="Precio Externo en dolares"></p>
                                                            <p class="card-text text-price-other-markets">
                                                                <span class="price-item">
                                                                    <img src="furnis/iconos/icon_habbo.png" alt="habbo" class="price-habbo" data-toggle="tooltip" data-i18n="[title]titulo_habbo_dolares" title="Precio Habbo en dolares">
                                                                    ${((creditUsdPriceHabbo * item.price).toFixed(2).endsWith("00") ? parseInt((creditUsdPriceHabbo * item.price).toFixed(2), 10) : (creditUsdPriceHabbo * item.price).toFixed(2).replace(".", ","))}
                                                                </span>
                                                                <span class="price-item">
                                                                    <img src="furnis/iconos/icon_precio_externo.png" alt="precio_externo" class="price-market" data-i18n="[title]titulo_externo_dolares" data-toggle="tooltip" title="Precio Externo en dolares">
                                                                    ${((creditUsdPriceIlegal * item.price).toFixed(2).endsWith("00") ? parseInt((creditUsdPriceIlegal * item.price).toFixed(2), 10) : (creditUsdPriceIlegal * item.price).toFixed(2).replace(".", ","))}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <p class="card-text text-name online_habbo_text_white catalog_item_name">${item.name} ${item.mote ? `(${item.mote})` : ''}</p>
                                            <div class="row">
                                                <div class="col-6 d-flex flex-column justify-content-around opinion_precio catalog_votes">
                                                    <span class="online_habbo_text_white question_text" data-i18n="pregunta_precio">¿Precio adecuado?</span>
                                                    <div class="d-flex justify-content-around">
                                                        <button class="price_history_content vote-button-opinion" data-id="${item.id}" data-vote="upvote">👍<span class="vote-count-opinion">${item.upvotes}</span></button>
                                                        <button class="price_history_content vote-button-opinion" data-id="${item.id}" data-vote="downvote">👎<span class="vote-count-opinion">${item.downvotes}</span></button>
                                                    </div>
                                                </div>
                                                <div class="col-6 d-flex flex-column justify-content-around opinion_precio">
                                                    <span class="online_habbo_text_white question_text" data-i18n="pregunta_tendencia">¿Subirá o bajará?</span>
                                                    <div class="d-flex justify-content-around">
                                                        <button class="price_history_content vote-button-belief" data-id="${item.id}" data-vote="upprice"><img src="furnis/iconos/up_price_history.png" alt="up price" class="icon-vote"><span class="vote-count-belief">${item.upvotes_belief || 0}</span></button>
                                                        <button class="price_history_content vote-button-belief" data-id="${item.id}" data-vote="downprice"><img src="furnis/iconos/down_price_history.png" alt="down price" class="icon-vote"><span class="vote-count-belief">${item.downvotes_belief || 0}</span></button>
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
                    mapTradersClub(decryptedData, itemData);
                    mapHabbonation(decryptedData, firebaseData);
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
                            sortedProducts.sort((a, b) => b.price - a.price);
                        } else if (sortBy === 'price_asc') {
                            sortedProducts.sort((a, b) => a.price - b.price);
                        } else if (sortBy === 'date_desc') {
                            sortedProducts.sort((a, b) => new Date(b.fecha_precio) - new Date(a.fecha_precio));
                        } else if (sortBy === 'date_asc') {
                            sortedProducts.sort((a, b) => new Date(a.fecha_precio) - new Date(b.fecha_precio));
                        }
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
                                    $('#sort-options').hide();
                                    const decryptedData = decryptData(data.token);
                                    const datesWithTime = decryptedData.map(item => {
                                        return item.fecha_precio.replace('T', ' ').replace('.000Z', '');
                                    });
                                    const creditsPrice = decryptedData.map(item => {
                                        return item.precio;
                                    });
                                    const vipPrice = decryptedData.map(item => {
                                        return (item.precio / item.vip_price).toFixed(2);
                                    });
                                    // Llamar a la función para mostrar la tabla por defecto
                                    showTable(decryptedData);

                                    searchContainer.hide();
                                    row_explanation_trends.hide();
                                    row_explanation_votes.hide();
                                    filter_tags.hide();
                                    productContainer.hide();
                                    productHistoryContainer.show();
                                    backButton.show();

                                    $('#toggle-view-btn').on('click', function() {
                                        if ($(this).text() === 'Mostrar Gráfica') {
                                            $('#price-history-table').hide();
                                            $('#div_grafica_item').show();
                                            drawChart(datesWithTime, creditsPrice, vipPrice);
                                            $(this).text('Mostrar Tabla');
                                        } else {
                                            $('#div_grafica_item').hide();
                                            $('#price-history-table').show();
                                            $(this).text('Mostrar Gráfica');
                                        }
                                    });
                                }
                            });
                        });
                    });

                    function showTable(decryptedData) {
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
        
                        var historyContent = `
                            <h3 class="price_history_content habbo_text_blue h3_historial_precios" data-i18n="historial_precios">Historial de Precios</h3>
                            <div class="price-history-image">
                                <img src="${imagePath}" alt="${firstRecord.name}" class="${imageClass}">
                            </div>
                            <div>
                                <button id="toggle-view-btn" class="button_price_history_dinamic price_history_content online_habbo_text_white">Mostrar Gráfica</button>
                            </div>
                            <div class="grafic_item" id="div_grafica_item" style="display: none;">
                                <canvas id="price-history-chart"></canvas>
                            </div>
                            <div class="price-history-table-container">
                                <table class="table price_history_content" id="price-history-table">
                                    <thead>
                                        <tr>
                                            <th class="habbo_text_blue" data-i18n="historial_fecha">Fecha</th>
                                            <th class="habbo_text_blue" data-i18n="historial_nombre">Nombre</th>
                                            <th class="habbo_text_blue" data-i18n="historial_precio_credito">Precio <img src="furnis/dinero/credito.png" alt="credito" class="price-icon"></th>
                                            <th class="habbo_text_blue" data-i18n="historial_precios_vip">Precio <img src="furnis/dinero/vip.png" alt="vip" class="price-vip"></th>
                                            <th class="habbo_text_blue" data-i18n="historial_tendencia">Tendencia</th>
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
                                                    <td class="online_habbo_text_white">
                                                        <div class="td-in-mobile">
                                                            <div class="row">
                                                                <div class="col-6">
                                                                    <p class="consola_history_price habbo_text_blue">Fecha</p>
                                                                </div>
                                                                <div class="col-6">
                                                                    ${new Date(record.fecha_precio).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="td-no-mobile">
                                                            ${new Date(record.fecha_precio).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td class="online_habbo_text_white">
                                                        <div class="td-in-mobile">
                                                            <div class="row">
                                                                <div class="col-6">
                                                                    <p class="consola_history_pricehabbo_text_blue">Nombre</p>
                                                                </div>
                                                                <div class="col-6">
                                                                    ${record.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="td-no-mobile">
                                                            ${record.name}
                                                        </div>
                                                    </td>
                                                    <td class="online_habbo_text_white">
                                                        <div class="td-in-mobile">
                                                            <div class="row">
                                                                <div class="col-6">
                                                                    <p class="consola_history_pricehabbo_text_blue">Precio</p>
                                                                </div>
                                                                <div class="col-6">
                                                                    ${record.precio} <img src="furnis/dinero/credito.png" alt="credito" class="price-icon">
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="td-no-mobile">
                                                            ${record.precio}
                                                        </div>
                                                    </td>
                                                    <td class="online_habbo_text_white">
                                                        <div class="td-in-mobile">
                                                            <div class="row">
                                                                <div class="col-6">
                                                                    <p class="consola_history_pricehabbo_text_blue">Precio VIP</p>
                                                                </div>
                                                                <div class="col-6">
                                                                    ${(record.precio / record.vip_price).toFixed(2)} <img src="furnis/dinero/vip.png" alt="vip" class="price-vip">
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="td-no-mobile">
                                                            ${(record.precio / record.vip_price).toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td class="online_habbo_text_white">
                                                        <div class="td-in-mobile">
                                                            <div class="row">
                                                                <div class="col-6">
                                                                    <p class="consola_history_pricehabbo_text_blue">Tendencia</p>
                                                                </div>
                                                                <div class="col-6">
                                                                    ${trendIcon}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="td-no-mobile">
                                                            ${trendIcon}
                                                        </div>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                            <p class="price_history_content habbo_text_blue mobile_description">${firstRecord.descripcion}</p>
                        `;
                        $('#product-history-container').html(historyContent);
                        updateContent();
                    }

                    backButton.on('click', function() {
                        productHistoryContainer.hide();
                        backButton.hide();
                        productContainer.show();
                        searchContainer.show();
                        row_explanation_trends.show();
                        row_explanation_votes.show();
                        filter_tags.show();
                        $('#sort-options').show();
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
                                        alert(i18next.t('alert_voto_precio'));
                                    } else {
                                        alert(i18next.t('alert_error_voto_precio'));
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
                                        alert(i18next.t('alert_voto_tendencia'));
                                    } else {
                                        alert(i18next.t('alert_error_voto_tendencia'));
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
                    updateContent();
                    loadLastPriceUpdate();
                }
            });
        });
    }

    fetchApiKey(function(apiKey) {
        fetchFirebaseData()
            .then(firebaseData => {
                loadProducts(apiKey, firebaseData);
            })
            .catch(error => {
                console.error('Error fetching Firebase data:', error);
            });
    });
}

verifyIP(initialize);

function fillItemOptions(products) {
    var itemASelect = $('#item-a');
    var itemBSelect = $('#item-b');
    itemASelect.empty();
    itemBSelect.empty();

    let optionNull = '<option value="0" data-src="" data-name="" data-i18n="calculadora_op1">Seleccione un item....</option>';
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
        const textoTraducido = i18next.t('equivalente_text', { itemNameA, equivalentAtoB, itemNameB, equivalentBtoA });
        $('#equivalente').html(`<p class="online_habbo_text_white_fz_20">${textoTraducido}</p>`);
        $('#item-a-price').html(`<p class="text-price"><img src="furnis/dinero/credito.png" alt="credito" class="price-icon">${itemAPrice}</p>`);
        $('#item-b-price').html(`<p class="text-price"><img src="furnis/dinero/credito.png" alt="credito" class="price-icon">${itemBPrice}</p>`);
    } else {
        $('#equivalente').text('');
        $('#item-a-price').text('');
        $('#item-b-price').text('');
    }
}

function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

Chart.defaults.backgroundColor = '#26627D';
Chart.defaults.borderColor = '#36A2EB';
Chart.defaults.color = '#FFFFFF';

let chartInstance = null;

function drawChart(labels, creditsPrice, vipPrice) {
    const ctx = document.getElementById('price-history-chart').getContext('2d');

    // Destruir el gráfico existente antes de crear uno nuevo
    if (chartInstance) {
        chartInstance.destroy();
    }

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Precio en Creditos',
                data: creditsPrice,
                borderColor: '#DDB81C',
                backgroundColor: 'rgba(221, 184, 28, 0.8)',
                pointBackgroundColor: '#DDB81C',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                fill: false,
                tension: 1
            },
            {
                label: 'Precio en Vips',
                data: vipPrice,
                borderColor: '#3F9317',
                backgroundColor: 'rgba(63, 147, 23, 0.8)',
                pointBackgroundColor: '#3F9317',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                fill: false,
                tension: 0.1
            }
        ]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'PPpp',
                        displayFormats: {
                            month: 'MMM yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Months',
                        color: '#ffffff'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value',
                        color: '#ffffff'
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            if (values.length > 5) {
                                const step = Math.ceil(values.length / 5);
                                if (index % step === 0) {
                                    return value;
                                } else {
                                    return null;
                                }
                            }
                            return value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(tooltipItem) {
                            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff'
                }
            }
        },
        plugins: [{
            beforeDraw: function(chart) {
                const ctx = chart.ctx;
                ctx.save();
                ctx.fillStyle = isMobileDevice() ? '#555' : '#26627D';
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        }]
    };

    chartInstance = new Chart(ctx, config);
}