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
        } else if (key.startsWith('[src]')) {
            $(this).attr("src", i18next.t(key.split(']')[1]));
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
    const toggleBtn = document.getElementById("toggle-btn");
    const content = document.getElementById("content");

    let isOpen = false;

    toggleBtn.addEventListener("click", () => {
        if (isOpen) {
            content.style.display = "none";
            toggleBtn.innerHTML = "▲"; // Cambia el ícono
        } else {
            content.style.display = "block";
            toggleBtn.innerHTML = "▼"; // Cambia el ícono
        }
        isOpen = !isOpen;
    });

    const images = document.querySelectorAll('.patos_imagenes');

    // Función para generar un número aleatorio entre un rango
    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Función para seleccionar un pato aleatorio
    function showRandomLamp() {
        // Oculta todos los elementos anteriores y reinicia
        images.forEach(image => {
            image.style.display = 'none';
            image.style.animation = ''; // Elimina la animación previa
        });
    
        // Selecciona una imagen aleatoria
        const randomIndex = Math.floor(Math.random() * images.length);
        const selectedLamp = images[randomIndex];
    
        // Duración y posición aleatoria
        const randomDuration = getRandom(10, 30); // Duración entre 10 y 30 segundos
        const randomHorizontalPosition = getRandom(0, window.innerWidth - 100); // Posición horizontal
    
        selectedLamp.style.position = 'absolute';
        selectedLamp.style.left = `${randomHorizontalPosition}px`;
        selectedLamp.style.bottom = '0'; // Inicia desde la parte inferior
    
        // Aplica la animación
        selectedLamp.style.display = 'block';
        selectedLamp.style.animation = `subirSerpiente ${randomDuration}s linear`;
    
        // Detecta el final de la animación
        selectedLamp.addEventListener('animationend', () => {
            selectedLamp.style.display = 'none'; // Oculta al llegar al tope
        });

        setTimeout(() => {
            showRandomLamp();
        }, randomDuration * 1000); // Multiplicamos por 1000 para convertir segundos a milisegundos
    }
    
    // Inicia el ciclo mostrando el primer pato aleatorio
    showRandomLamp();

    document.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });
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
        const timestamp = new Date().getTime();
        $.getJSON(`furnis/precios/habbo_online.json?v=${timestamp}`, function(data) {
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
        const timestamp = new Date().getTime();
        $.getJSON(`../visitCount.json?v=${timestamp}`, function(data) {
            $('#contador').text(data.visits);
        }).fail(function() {
            $('#contador').text('En mantenimiento');
        });
        $.getJSON(`../votesCount.json?v=${timestamp}`, function(data) {
            $('#contador_votos').text(data.votes);
        }).fail(function() {
            $('#contador_votos').text('En mantenimiento');
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
        //FURNIS HC - 19/01/2025
        const manualMappingHC = {
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
            12: 11 //hc set - mesahc
        };

        //RARES - 19/01/2025
        const manualMappingRares = {
            13: 4, //habbocola
            44: 6, //vivo
            51: 17, //almo purpura
            56: 24, //heladera dorada
            104: 25, //humareda
            54: 18, //egg lila
            332: 122, //dragon dave
            325: 97, //maquina fesh
            326: 96, //holodave
            339: 121, //lucy dave
            331: 118, //hela dave
            340: 123, //regalo dave
            311: 105, //espacial negra
            305: 60, //tocadiscos cerulean
            304: 59, //tocadiscos romantico
            289: 57, //drako negro
            281: 52, //fontana gotica azul
            337: 119, //parasol dave
            315: 106, //tocadiscos lila
            316: 107, //tocadiscos platino
            318: 108, //tocadiscos banana
            317: 109, //tocadiscos cafe
            313: 110, //tocadiscos raver
            287: 56, //almo negro
            228: 51, //cesped de habboween
            297: 58, //hablador
            312: 104, //heladera negra
            336: 117, //fonty dave
            158: 47, //aloe vera
            119: 39, //lucy dorada
            335: 120, //almo dave
            334: 116, //dragon purpura
            175: 46, //pilar azul
            342: 126, //fonty red
            308: 115, //bola de nieve
            350: 125, //almo red
            309: 113, //alfombra nieve
            224: 50, //dragon sky
            324: 112, //adivina quien soy
            111: 27, //fontana azul
            118: 35, //laser red
            219: 49, //alfombra playa
            120: 41, //hamaca
            116: 34, //holo girl
            115: 31, //holo boy
        };

        //Megas - 19/01/2025
        const manualMappingMegarares = {
            50: 14, //ph ticket
            125: 44, //drako plata
            117: 28, //typo
            124: 43, //drako bronce
            322: 93, //tronito
            321: 94, //samovar
            327: 95, //submarino
            126: 45, //drako oro
            328: 98, //martillo oro
            329: 99, //martillo plata
            330: 100, //martillo bronce
            300: 101, //disco oro
            301: 102, //disco plata
            302: 103, //disco bronce
        };

        //FUNKY - pending
        const manualMappingFunky = {
            23: 15, //pod funky
            22: 15, //pod funky
            21: 15, //pod funky
            20: 15, //pod funky
            19: 15, //pod funky
            46: 16, //alfombra funky
            47: 16, //alfombra funky
            48: 16, //alfombra funky
            49: 16, //alfombra funky
            53: 22, //guirnalda morada
            52: 23, //guirnalda verde
            55: 20, //teleport britanico funky
        };

        const manualMapping = Object.assign({}, manualMappingHC, manualMappingRares, manualMappingMegarares, manualMappingFunky);
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
                    loadLastThreeNoticias();
                    obtenerPlacasLimit();
                    obtenerPremios();
                    obtenerEventos();
                    const decryptedData = decryptData(data.token);
                    const lastUpdateFurnis = decryptData(data.lastUpdateFurnis);
                    var productContainer = $('#product-container');
                    var productHistoryContainer = $('#product-history-container');
                    var backButton = $('#back-button');
                    var searchContainer = $('#search-input');
                    var row_explanation_trends = $('#row_explanation_trends');
                    var row_explanation_votes = $('#row_explanation_votes');
                    var filtros_filas = $('.filtros_filas');
                    var sortSelect = $('#sort-options');

                    function renderProducts(products) {
                        productContainer.empty();
                        products.forEach(function(item) {
                            var borderClass = item.highlight == 1 ? 'highlight-border' : '';
                            var collapseId = `collapse${item.id}`;
                            var parts = item.status.split('_');
                            var firstStatus = '';
                            var secondStatus = '';
                            let fecha_precio_es = item.fecha_precio.split('T')[0];
                            let partes_es = fecha_precio_es.split('-');
                            fecha_precio_es = `${partes_es[2]}-${partes_es[1]}-${partes_es[0]}`;
                            let fecha_precio_com = item.fecha_precio_com.split('T')[0];
                            let partes_com = fecha_precio_com.split('-');
                            fecha_precio_com = `${partes_com[2]}-${partes_com[1]}-${partes_com[0]}`;
                            if (parts.length >= 5) {
                                // Unimos las primeras tres partes
                                firstStatus = parts.slice(0, 3).join('_');
                                // Unimos el resto de las partes a partir del cuarto guion
                                secondStatus = parts.slice(3).join('_');
                            } else {
                                firstStatus = item.status;
                            }
                            var productCard = `
                                <div class="col-md-4 col-sm-6 mb-4 product-item catalog_item_div">
                                    <div class="card h-100 position-relative ${borderClass}">
                                        <div class="row furnis_row_new_year_scale">
                                            <div class="col-12 centrar_x">
                                                <a href="#" class="text-decoration-none product-link" data-id="${item.id}">
                                                    <div class="row">
                                                        <div class="col-12 furni_tipo">
                                                            ${item.icon == "hc" ? `<img src="furnis/iconos/catalogo_habbo_club.png" class="iconos-hc" alt="icon">` : ''}
                                                            ${item.icon == "rare" ? `<img src="furnis/iconos/icon_rare.png" class="iconos-rare" alt="icon">` : ''}
                                                            ${item.icon == "funky" ? `<img src="furnis/iconos/freaky_friday.png" class="iconos-funky" alt="icon">` : ''}
                                                            ${item.icon == "mega_rare" ? `<img src="furnis/iconos/icon_mega_rare.png" class="iconos-funky" alt="icon">` : ''}
                                                            ${item.icon == "coleccion" ? `<img src="furnis/iconos/coleccion.png" class="iconos-coleccion" alt="icon">` : ''}
                                                            ${item.icon == "deportes" ? `<img src="furnis/iconos/catalogo_deportes.png" class="iconos-deportes" alt="icon">` : ''}
                                                            ${item.icon == "cabin" ? `<img src="furnis/iconos/catalogo_cabin.png" class="iconos-cabin" alt="icon">` : ''}
                                                            ${item.icon == "habboween" ? `<img src="furnis/iconos/catalogo_habboween.png" class="iconos-habboween" alt="icon">` : ''}
                                                            ${item.icon == "gotico" ? `<img src="furnis/iconos/catalogo_gotico.png" class="iconos-gotico" alt="icon">` : ''}
                                                            ${item.icon == "xmas_rares" ? `<img src="furnis/iconos/xmas_rares.png" class="iconos-xmas-rares" alt="icon">` : ''}
                                                            ${item.icon == "unreleased" ? `<img src="furnis/iconos/unreleased.png" class="iconos-xmas-rares" alt="icon">` : ''}
                                                        </div>
                                                        <div class="col-12 furni_imagen">
                                                            <div class="info-popup">
                                                                <p class="card-text text-name online_habbo_text_white cantidad_premio name-item-es">${item.name} ${item.mote ? `(${item.mote})` : ''}</p>
                                                                <p class="card-text text-name online_habbo_text_white cantidad_premio name-item-en" style="display: none;">${item.name_us}</p>
                                                                <p class="card-text text-name online_habbo_text_white cantidad_premio name-item-pt" style="display: none;">${item.name_br}</p>
                                                            </div>
                                                            <img src="${item.src}" class="${item.icon == "coleccion" ? "card-img-coleccion" : "card-img-top"}" alt="${item.name}">
                                                        </div>
                                                        <div class="col-12 furni_tendencia">
                                                            <div class="row">
                                                                <div class="col-9">
                                                                    ${item.hot == 1 ? `<img src="furnis/iconos/hot_sale.png" class="iconos-hot-sale" alt="icon">` : ''}
                                                                </div>
                                                                <div class="col-3">
                                                                    ${firstStatus == "arrow_trend_up" ? `<img src="furnis/iconos/arrow_trend_up.png" class="iconos-arrow-trend-up" alt="icon">` : ''}
                                                                    ${firstStatus == "arrow_trend_down" ? `<img src="furnis/iconos/arrow_trend_down.png" class="iconos-arrow-trend-down" alt="icon">` : ''}
                                                                    ${firstStatus == "com_arrow_up" ? `<img src="furnis/iconos/arrow_trend_up_com.png" class="iconos-arrow-trend-up" alt="icon">` : ''}
                                                                    ${firstStatus == "com_arrow_down" ? `<img src="furnis/iconos/arrow_trend_down_com.png" class="iconos-arrow-trend-down" alt="icon">` : ''}
                                                                    ${secondStatus == "com_arrow_up" ? `<img src="furnis/iconos/arrow_trend_up_com.png" class="iconos-arrow-trend-up" alt="icon">` : ''}
                                                                    ${secondStatus == "com_arrow_down" ? `<img src="furnis/iconos/arrow_trend_down_com.png" class="iconos-arrow-trend-down" alt="icon">` : ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-12 furni_historico">
                                                            <img src="furnis/iconos/locales/historial_es.png" class="history_price_icon" alt="icon" data-i18n="[src]historial_precios_img">
                                                        </div>
                                                    </div>
                                                </a>
                                            </div>
                                            <div class="col-12">
                                                <div class="price-sections">
                                                    <div class="section">
                                                        <div class="row price_trades_habbo_origins">
                                                            <div class="col-12 col_in_card">
                                                                <div class="row">
                                                                    <div class="col-6 prices_spain">
                                                                        <div class="col-12">
                                                                            <div class="row">
                                                                                <div class="col-8">
                                                                                    <img src="furnis/iconos/origins.png" alt="origins icono">
                                                                                </div>
                                                                                <div class="col-4 col_no_padding">
                                                                                    <img src="furnis/iconos/spain.png" alt="spain icono" class="spain_icon">
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-12">
                                                                            <p class="card-text text-price credits spain">
                                                                                <img src="furnis/dinero/credito.png" alt="credito" class="price-icon-principal" data-toggle="tooltip" data-i18n="[title]titulo_creditos" title="Precio en Créditos">${item.price > 0 ? item.price : '??'}
                                                                            </p>
                                                                        </div>
                                                                        <div class="col-12">
                                                                            <p class="card-text text-price">
                                                                                <img src="furnis/dinero/vip.png" alt="vip" class="price-vip-principal" data-toggle="tooltip" data-i18n="[title]titulo_vips" title="Precio en Vips">${item.price > 0 ? (item.price / item.vip_price).toFixed(1) : '??'}
                                                                            </p>
                                                                        </div>
                                                                        <div class="col-12">
                                                                            <p class="card-text text-price">
                                                                                <img src="furnis/dinero/vivo.png" alt="vivo" class="price-vivo-principal" data-toggle="tooltip">${item.price > 0 ? (item.price / item.petal_price).toFixed(1) : '??'}
                                                                            </p>
                                                                        </div>
                                                                        <div class="col-12">
                                                                            <p class="noticia_descripcion" data-toggle="tooltip" data-i18n="[title]fecha_actualizada_main" title="Precio Actualizado el:">
                                                                                🔄${fecha_precio_es}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-6 prices_usa">
                                                                        <div class="col-12">
                                                                            <div class="row">
                                                                                <div class="col-8">
                                                                                    <img src="furnis/iconos/origins.png" alt="origins icono">
                                                                                </div>
                                                                                <div class="col-4 col_no_padding">
                                                                                    <img src="furnis/iconos/usa.png" alt="usa icono" class="usa_icon">
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-12">
                                                                            <p class="card-text text-price credits usa">
                                                                                <img src="furnis/dinero/credito.png" alt="credito" class="price-icon-principal" data-toggle="tooltip" data-i18n="[title]titulo_creditos" title="Precio en Créditos">${item.usa_price > 0 ? item.usa_price : '??'}
                                                                            </p>
                                                                        </div>
                                                                        <div class="col-12">
                                                                            <p class="card-text text-price">
                                                                                <img src="furnis/dinero/vip.png" alt="vip" class="price-vip-principal" data-toggle="tooltip" data-i18n="[title]titulo_vips" title="Precio en Vips">${item.usa_price > 0 ? (item.usa_price / item.vip_usa_price).toFixed(1) : '??'}
                                                                            </p>
                                                                        </div>
                                                                        <div class="col-12">
                                                                            <p class="card-text text-price">
                                                                                <img src="furnis/dinero/egg_lila.png" alt="egg lila" class="price-egg-principal" data-toggle="tooltip">${item.usa_price > 0 ? (item.usa_price / item.dino_price).toFixed(1) : '??'}
                                                                            </p>
                                                                        </div>
                                                                        <div class="col-12">
                                                                            <p class="noticia_descripcion cantidad_premio" data-toggle="tooltip" data-i18n="[title]fecha_actualizada_main" title="Precio Actualizado el:">
                                                                                🔄${fecha_precio_com}
                                                                            </p>
                                                                        </div>
                                                                        <div class="col-12">
                                                                            <p class="card-text text-price">
                                                                                <img src="furnis/iconos/icon_trader_club.png" alt="traders_club" class="price-egg-principal" data-toggle="tooltip" title="Traderclub.gg price">${item.traders_club > 0 ? item.traders_club : '??'}<img src="furnis/dinero/vip.png" alt="vip" class="price-vip-principal" data-toggle="tooltip" data-i18n="[title]titulo_vips" title="Precio en Vips">
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <!--<div class="col-12">
                                                <div class="row col_no_padding">
                                                    <button class="boton_collapse_otros_catalogos collapse_text_white" type="button" data-toggle="collapse" data-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                                                        Votaciones <i class="fas fa-chevron-down toggle-icon"></i>
                                                    </button>
                                                </div>
                                            </div>-->
                                        </div>
                                        <!--
                                        <div class="card-body text-center furnis_row_new_year_scale no_padding_all">
                                            <div class="collapse text-price-es" id="${collapseId}">
                                                <div class="row">
                                                    <div class="col-12 d-flex flex-column justify-content-around opinion_precio">
                                                        <div class="row">
                                                            <div class="col-12 d-flex flex-column justify-content-around opinion_precio">
                                                                <span class="online_habbo_text_white question_text" data-i18n="pregunta_precio">Precio adecuado?</span>
                                                            </div>
                                                            <div class="col-12 d-flex flex-column justify-content-around opinion_precio">
                                                                <div class="d-flex justify-content-around votos_furnis">
                                                                    <button class="price_history_content vote-button-opinion" data-id="${item.id}" data-vote="upvote">👍<span class="vote-count-opinion">${item.upvotes}</span></button>
                                                                    <button class="price_history_content vote-button-opinion" data-id="${item.id}" data-vote="downvote">👎<span class="vote-count-opinion">${item.downvotes}</span></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-12 d-flex flex-column justify-content-around opinion_precio">
                                                        <div class="row">
                                                            <div class="col-12 d-flex flex-column justify-content-around opinion_precio">
                                                                <span class="online_habbo_text_white question_text" data-i18n="pregunta_tendencia">Subirá o bajará?</span>
                                                            </div>
                                                            <div class="col-12 d-flex flex-column justify-content-around opinion_precio">
                                                                <div class="d-flex justify-content-around">
                                                                    <button class="price_history_content vote-button-belief" data-id="${item.id}" data-vote="upprice"><img src="furnis/iconos/up_price_history.png" alt="up price" class="icon-vote"><span class="vote-count-belief">${item.upvotes_belief || 0}</span></button>
                                                                    <button class="price_history_content vote-button-belief" data-id="${item.id}" data-vote="downprice"><img src="furnis/iconos/down_price_history.png" alt="down price" class="icon-vote"><span class="vote-count-belief">${item.downvotes_belief || 0}</span></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <img src="furnis/iconos/san_valentin/marco_san_valentin.png" class="marco_furnis_year_china" alt="marco año nuevo chino habbo">-->
                                    </div>
                                </div>
                            `;
                            productContainer.append(productCard);
                        });
                    
                        fillItemOptions(products);
                        $(document).trigger('productsRendered');
                    }

                    const lastUpdatedContainer = $('.furnis_min_actualizados');
                    lastUpdatedContainer.empty();
    
                    lastUpdateFurnis.forEach(furni => {
                        const isMobile = window.matchMedia("(max-width: 768px)").matches;
                        var selectedLanguage = isMobile ? $('.language-select-mobile').val() : $('.language-select-pc').val();
                        const furniImage = `
                            <div class="last_items_update last_items_update_es" data-toggle="tooltip" title="${furni.name} - ${furni.hotel}" style="display: ${selectedLanguage === 'es' ? 'flex' : 'none'};">
                                <img
                                    src="furnis/min/${furni.name.replace(/ /g, '_')}_min.gif" 
                                    alt="${furni.name}"
                                />
                                <img
                                    src="furnis/iconos/${furni.hotel.replace(/ /g, '_')}_min.png" 
                                    alt="icono min ${furni.hotel}" 
                                    class="icon_country_min" 
                                />
                            </div>
                            <div class="last_items_update last_items_update_en" data-toggle="tooltip" title="${furni.name_us} - ${furni.hotel}" style="display: ${selectedLanguage === 'en' ? 'flex' : 'none'};">
                                <img
                                    src="furnis/min/${furni.name.replace(/ /g, '_')}_min.gif" 
                                    alt="${furni.name}"
                                />
                                <img
                                    src="furnis/iconos/${furni.hotel.replace(/ /g, '_')}_min.png" 
                                    alt="icono min ${furni.hotel}" 
                                    class="icon_country_min" 
                                />
                            </div>
                            <div class="last_items_update last_items_update_pt" data-toggle="tooltip" title="${furni.name_br} - ${furni.hotel}" style="display: ${selectedLanguage === 'pt' ? 'flex' : 'none'};">
                                <img
                                    src="furnis/min/${furni.name.replace(/ /g, '_')}_min.gif" 
                                    alt="${furni.name}"
                                />
                                <img
                                    src="furnis/iconos/${furni.hotel.replace(/ /g, '_')}_min.png" 
                                    alt="icono min ${furni.hotel}" 
                                    class="icon_country_min" 
                                />
                            </div>
                        `;
                        lastUpdatedContainer.append(furniImage);
                    });
                    $(document).on('click', '.last_items_update', function(e) {
                        console.log("entre")
                        e.preventDefault();
                        $('#ultimos_precios_actualizados').show();
                        $('#home-section').hide();
                        $('#catalogo-section').show();
                        $('#column-explications-catalogo').hide();
                        $('#noticias-section').hide();
                        $('#calculador-section').hide();
                        $('#sorteos-section').hide();
                        $('#master-trades-section').hide();
                        $('#sort-options').show();
                        $('#footer').show();
                        $('#column-explications-master-trades').hide();
                        $('#habbo-generator-section').hide();
                        $('#text-generator-section').hide();
                        $('#comunidad_salas').hide();
                        $('#equipo-section').hide();
                        $('#marketplace-section').hide();
                        $('#login-section').hide();
                        $('#register-section').hide();
                        $('#acerca-nosotros-section').hide();
                        $('#terminos-condiciones-section').hide();
                        $('#preguntas-respuestas-section').hide();
                        $('#politicas-privacidad-section').hide();
                        $('#contactanos-section').hide();
                    });
                    mapTradersClub(decryptedData, itemData);
                    //mapHabbonation(decryptedData, firebaseData);
                    renderProducts(decryptedData);

                    $('#search-input').on('input', function() {
                        var searchValue = $(this).val().toLowerCase();
                        var filteredProducts = decryptedData.filter(function(item) {
                            return (
                                item.name.toLowerCase().includes(searchValue) ||
                                (item.name_us && item.name_us.toLowerCase().includes(searchValue)) ||
                                (item.name_br && item.name_br.toLowerCase().includes(searchValue))
                            );
                        });
                        renderProducts(filteredProducts);
                        if (typeof agregarBotonesEdicion === 'function') {
                            agregarBotonesEdicion();
                        }
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
                        if (typeof agregarBotonesEdicion === 'function') {
                            agregarBotonesEdicion();
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
                                    showTable(decryptedData, "ES");

                                    searchContainer.hide();
                                    row_explanation_trends.hide();
                                    row_explanation_votes.hide();
                                    filtros_filas.hide();
                                    productContainer.hide();
                                    productHistoryContainer.show();
                                    backButton.show();

                                    $(document).on('click', '.toggle-view-btn', function() {
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

                                    $(document).on('click', '.toggle-hotel-btn', function() {
                                        let currentHotel = $(this).text().includes("US") ? "US" : "ES";
                                        showTable(decryptedData, currentHotel);
                                    });
                                }
                            });
                        });
                    });

                    function showTable(decryptedData, hotel = "ES") {
                        const isMobile = window.matchMedia("(max-width: 768px)").matches;
                        var selectedLanguage = isMobile ? $('.language-select-mobile').val() : $('.language-select-pc').val();
                        let filteredData = decryptedData.filter(record => record.hotel === hotel);
                        // Hacer una copia para ordenarla del más antiguo al más reciente
                        let filteredDataAsc = [...filteredData].sort((a, b) => new Date(a.fecha_precio) - new Date(b.fecha_precio));

                        // Calcular las tendencias
                        filteredDataAsc.forEach((record, index) => {
                            const actualPrice = record.precio;
                            const previousPrice = index > 0 ? filteredDataAsc[index - 1].precio : 0;
                            let trendIcon = '';

                            // Calcular la tendencia
                            if (actualPrice === 0) {
                                trendIcon = '<img class="equal_price_history" src="./furnis/iconos/equal_price_history.png" alt="equal price">';
                            } else if (actualPrice > previousPrice) {
                                trendIcon = '<img class="up_price_history" src="./furnis/iconos/up_price_history.png" alt="up price">';
                            } else if (actualPrice < previousPrice) {
                                trendIcon = '<img class="down_price_history" src="./furnis/iconos/down_price_history.png" alt="down price">';
                            } else {
                                trendIcon = '<img class="equal_price_history" src="./furnis/iconos/equal_price_history.png" alt="equal price">';
                            }

                            // Asignar el icono calculado al registro
                            record.trendIcon = trendIcon;
                        });

                        // Si necesitas mostrar los datos nuevamente en orden descendente (más reciente al más antiguo)
                        let filteredDataDesc = [...filteredDataAsc].sort((a, b) => new Date(b.fecha_precio) - new Date(a.fecha_precio));
                        var firstRecord = filteredDataDesc[0];
                        var historyContent = `
                            <h3 class="price_history_content habbo_text_blue h3_historial_precios" data-i18n="historial_precios">Historial de Precios</h3>
                            <div class="price-history-image">
                                <img src="${firstRecord.src}" alt="${firstRecord.name}" class="price-history-img">
                            </div>
                            <div class="row">
                                <button class="toggle-hotel-btn button_price_history_dinamic price_history_content online_habbo_text_white">Mostrar ${hotel === "ES" ? "US" : "ES"} Precios</button>
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
                                            <th class="habbo_text_blue" data-i18n="historial_tendencia">Tendencia <img src="furnis/dinero/credito.png" alt="credito" class="price-icon"></th>
                                            <th class="habbo_text_blue" data-i18n="historial_precios_vip">Precio <img src="furnis/dinero/vip.png" alt="vip" class="price-vip"></th>
                                            
                                            <th class="habbo_text_blue" data-i18n="historial_agregado_por">Agregado por:</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${filteredDataDesc.map((record) => {
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
                                                                    <p class="name-item-history-es" style="display: ${selectedLanguage === 'es' ? 'block' : 'none'};">${record.name}</p>
                                                                    <p class="name-item-history-en" style="display: ${selectedLanguage === 'en' ? 'block' : 'none'};">${record.name_us}</p>
                                                                    <p class="name-item-history-pt" style="display: ${selectedLanguage === 'pt' ? 'block' : 'none'};">${record.name_br}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="td-no-mobile">
                                                            <p class="name-item-history-es" style="display: ${selectedLanguage === 'es' ? 'block' : 'none'};">${record.name}</p>
                                                            <p class="name-item-history-en" style="display: ${selectedLanguage === 'en' ? 'block' : 'none'};">${record.name_us}</p>
                                                            <p class="name-item-history-pt" style="display: ${selectedLanguage === 'pt' ? 'block' : 'none'};">${record.name_br}</p>
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
                                                                    <p class="consola_history_pricehabbo_text_blue">Tendencia <img src="furnis/dinero/credito.png" alt="credito" class="price-icon"></p>
                                                                </div>
                                                                <div class="col-6">
                                                                    ${record.trendIcon}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="td-no-mobile">
                                                            ${record.trendIcon}
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
                                                                    <p class="consola_history_pricehabbo_text_blue">Agregado por:</p>
                                                                </div>
                                                                <div class="col-6">
                                                                    ${record.user_modify}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="td-no-mobile">
                                                            ${record.user_modify}
                                                        </div>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                            <p class="price_history_content habbo_text_blue mobile_description">${firstRecord.descripcion == '' ? "No ahi descripcion disponible" : firstRecord.descripcion}</p>
                        `;
                        $('#product-history-container').html(historyContent);
                        selectedLanguage
                        updateContent();
                        
                    }

                    backButton.on('click', function() {
                        productHistoryContainer.hide();
                        backButton.hide();
                        productContainer.show();
                        searchContainer.show();
                        row_explanation_trends.show();
                        row_explanation_votes.show();
                        filtros_filas.show();
                        $('#sort-options').show();
                    });

                    $(document).on('click', '.vote-button-opinion', function() {
                        var button = $(this);
                        var imageId = button.data('id');
                        var voteType = button.data('vote');
                        button.prop('disabled', true);
                        let contador_votos = $('#contador_votos');
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
                                    contador_votos.text(decryptedData.contador_votos);
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
                        let contador_votos = $('#contador_votos');

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
                                    contador_votos.text(decryptedData.contador_votos);
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
                                    try {
                                        const decryptedData = decryptData(data.token);
                                        console.log(decryptedData);
                                        const latestDate = new Date(decryptedData.fecha_precio);
                                        console.log(latestDate);
                                        const formattedDate = latestDate.toLocaleString();
                                        console.log(formattedDate);
                                        $('#last_price_updated').text(formattedDate);
                                    } catch (error) {
                                        console.error('Error al procesar los datos:', error);
                                        $('#last_price_updated').text('Error al procesar la fecha');
                                    }
                                },
                                error: function(jqXHR) {
                                    if (jqXHR.status === 403) {
                                        console.error('Error 403: Acceso prohibido.');
                                        $('#last_price_updated').text('Acceso prohibido');
                                    } else {
                                        console.error('Error en la solicitud:', jqXHR);
                                        $('#last_price_updated').text('No disponible');
                                    }
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
    // Inicializar los elementos para item A y B
    const itemAInput = $('#item-a-search');
    const itemAOptions = $('#item-a-options');
    const itemBInput = $('#item-b-search');
    const itemBOptions = $('#item-b-options');

    function setupSearchableSelect(input, options, selectId) {
        // Limpiar las opciones previas
        options.empty();

        // Rellenar las opciones dinámicamente
        products.forEach(product => {
            const option = `<li data-value="${product.price}" data-src="${product.src}" data-name="${product.name}">${product.name}</li>`;
            options.append(option);
        });

        // Filtro dinámico en el input
        input.on('input', function () {
            const searchText = $(this).val().toLowerCase();
            const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchText));

            options.empty();
            if (filteredProducts.length === 0) {
                options.hide();
            } else {
                filteredProducts.forEach(product => {
                    const option = `<li data-value="${product.price}" data-src="${product.src}" data-name="${product.name}">${product.name}</li>`;
                    options.append(option);
                });
                options.show();
            }
        });

        // Selección de una opción
        options.on('click', 'li', function () {
            const selectedName = $(this).data('name');
            const selectedValue = $(this).data('value');
            const selectedSrc = $(this).data('src');

            // Actualizar input con el nombre seleccionado
            input.val(selectedName);
            options.hide();

            // Actualizar imagen y calcular equivalentes
            updateImage(selectId, selectedSrc, selectedName);
            calculateEquivalent();
        });

        // Ocultar opciones al hacer clic fuera
        $(document).on('click', function (e) {
            if (!$(e.target).closest('.search-select').length) {
                options.hide();
            }
        });
    }

    // Configurar para ambos selects
    setupSearchableSelect(itemAInput, itemAOptions, 'item-a');
    setupSearchableSelect(itemBInput, itemBOptions, 'item-b');
}

function updateImage(selectId, src, alt) {
    const imageContainer = $(`#${selectId}-image`);
    if (src) {
        imageContainer.html(`<img src="${src}" alt="${alt}" class="img-fluid">`);
    } else {
        imageContainer.html(''); // Vaciar si no hay imagen
    }
}

function calculateEquivalent() {
    const itemAInput = $('#item-a-search');
    const itemBInput = $('#item-b-search');
    const itemAOptions = $('#item-a-options');
    const itemBOptions = $('#item-b-options');
    const imgAElement = document.querySelector('#item-a-image img');
    const itemAImage = imgAElement ? imgAElement.src : "/secure-image/furni_buffer_min.gif";
    console.log(itemAImage);
    const imgBElement = document.querySelector('#item-b-image img');
    const itemBImage = imgBElement ? imgBElement.src : "/secure-image/furni_buffer.gif";
    const itemAImageMin = itemAImage ? itemAImage.replace(/\.(gif|png|jpg|jpeg|webp)$/i, '_min.gif') : null;
    const itemBImageMin = itemBImage ? itemBImage.replace(/\.(gif|png|jpg|jpeg|webp)$/i, '_min.gif') : null;
    
    const itemAPrice = parseFloat(itemAOptions.find('li:contains("' + itemAInput.val() + '")').data('value'));
    const itemBPrice = parseFloat(itemBOptions.find('li:contains("' + itemBInput.val() + '")').data('value'));

    if (itemAPrice && itemBPrice) {
        const rawAtoB = itemAPrice / itemBPrice;
        const rawBtoA = itemBPrice / itemAPrice;
        const equivalentAtoB = Number.isInteger(rawAtoB) ? rawAtoB : rawAtoB.toFixed(2);
        const equivalentBtoA = Number.isInteger(rawBtoA) ? rawBtoA : rawBtoA.toFixed(2);
        const itemNameA = itemAInput.val();
        const itemNameB = itemBInput.val();

        $('#equivalente').html(`
            <div class="row">
                <div class="col-4">
                    <img src="${itemAImageMin}" class="imagen_calculador_tradeos">
                </div>
                <div class="col-4">
                    <div class="row">
                        <div class="col-12">
                            <img src="furnis/iconos/flecha_izquierda.png" />
                        </div>
                        <div class="col-12">
                            <img src="furnis/iconos/flecha_derecha.png" />
                        </div>
                    </div>
                </div>
                <div class="col-4">
                    <img src="${itemBImageMin}" class="imagen_calculador_tradeos">
                </div>
                <div class="col-12">
                    <p class="online_habbo_text_white_fz_20">
                        1 <strong>${itemNameA}</strong> equivale a ${equivalentAtoB} <strong>${itemNameB}</strong>, esto es lo mismo que decir, 1 <strong>${itemNameB}</strong> equivale a ${equivalentBtoA} <strong>${itemNameA}</strong>.
                    </p>
                </div>
            </div>
        `);
        $('#item-a-price').html(`<p class="text-price precio_items"><img src="furnis/dinero/credito.png" alt="credito" class="price-icon">${itemAPrice}</p>`);
        $('#item-b-price').html(`<p class="text-price precio_items"><img src="furnis/dinero/credito.png" alt="credito" class="price-icon">${itemBPrice}</p>`);
    } else {
        $('#equivalente').html('');
        $('#item-a-price').html('');
        $('#item-b-price').html('');
    }
    let imgA = new Image();
    let imgB = new Image();

    imgA.src = itemAImageMin;
    imgB.src = itemBImageMin;

    imgA.onload = imgB.onload = function () {
        let widthA = imgA.width;
        let widthB = imgB.width;
        let heightA = imgA.height;
        let heightB = imgB.height;

        let maxWidth = Math.max(widthA, widthB);
        let maxHeight = Math.max(heightA, heightB);

        let diffWidthA = maxWidth - widthA;
        let diffWidthB = maxWidth - widthB;
        let diffHeightA = maxHeight - heightA;
        let diffHeightB = maxHeight - heightB;

        let imgElements = document.querySelectorAll('#equivalente .col-4 > img');
        let imgAElement = imgElements[0];
        let imgBElement = imgElements[1];
        console.log(widthA);
        console.log(widthB);
        console.log(heightA);
        console.log(heightB);
        console.log(imgAElement);
        console.log(imgBElement);
        console.log(diffWidthA);
        console.log(diffWidthB);
        console.log(diffHeightA);
        console.log(diffHeightB);
        if (
            imgAElement &&
            imgBElement &&
            widthA > 0 &&
            widthB > 0 &&
            heightA > 0 &&
            heightB > 0 &&
            (widthA !== widthB || heightA !== heightB)
        ) {
            if (diffWidthA > 0) {
                imgAElement.style.paddingLeft = (diffWidthA / 2) + 'px';
                imgAElement.style.paddingRight = (diffWidthA / 2) + 'px';
            }
            if (diffWidthB > 0) {
                imgBElement.style.paddingLeft = (diffWidthB / 2) + 'px';
                imgBElement.style.paddingRight = (diffWidthB / 2) + 'px';
            }

            if (diffHeightA > 0) {
                imgAElement.style.paddingTop = (diffHeightA / 2) + 'px';
                imgAElement.style.paddingBottom = (diffHeightA / 2) + 'px';
            }
            if (diffHeightB > 0) {
                imgBElement.style.paddingTop = (diffHeightB / 2) + 'px';
                imgBElement.style.paddingBottom = (diffHeightB / 2) + 'px';
            }
        }
    };

    let fullImgA = new Image();
    let fullImgB = new Image();

    fullImgA.src = itemAImage;
    fullImgB.src = itemBImage;

    fullImgA.onload = fullImgB.onload = function () {
        let widthA = fullImgA.width;
        let widthB = fullImgB.width;
        let heightA = fullImgA.height;
        let heightB = fullImgB.height;

        let maxWidth = Math.max(widthA, widthB);
        let maxHeight = Math.max(heightA, heightB);

        let diffWidthA = maxWidth - widthA;
        let diffWidthB = maxWidth - widthB;
        let diffHeightA = maxHeight - heightA;
        let diffHeightB = maxHeight - heightB;

        let fullImgAElement = document.querySelector('#item-a-image img');
        let fullImgBElement = document.querySelector('#item-b-image img');

        if (widthA !== widthB || heightA !== heightB) {
            if (diffWidthA > 0) {
                fullImgAElement.style.paddingLeft = (diffWidthA / 2) + 'px';
                fullImgAElement.style.paddingRight = (diffWidthA / 2) + 'px';
            }
            if (diffWidthB > 0) {
                fullImgBElement.style.paddingLeft = (diffWidthB / 2) + 'px';
                fullImgBElement.style.paddingRight = (diffWidthB / 2) + 'px';
            }

            if (diffHeightA > 0) {
                fullImgAElement.style.paddingTop = (diffHeightA / 2) + 'px';
                fullImgAElement.style.paddingBottom = (diffHeightA / 2) + 'px';
            }
            if (diffHeightB > 0) {
                fullImgBElement.style.paddingTop = (diffHeightB / 2) + 'px';
                fullImgBElement.style.paddingBottom = (diffHeightB / 2) + 'px';
            }
        }
    };
}


function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

Chart.defaults.backgroundColor = '#3B1C2A';
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
                ctx.fillStyle = isMobileDevice() ? '#555' : '#3B1C2A';
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        }]
    };

    chartInstance = new Chart(ctx, config);
}
