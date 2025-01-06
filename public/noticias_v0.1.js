const noticiasPerPage = 10;
let currentPage = 1;
let totalNoticias = 0;
let noticiasData = []; // Almacenar todas las noticias desde el archivo JSON
let filteredNoticiasData = []; // Para mantener las noticias filtradas por la búsqueda

// Función de debounce para limitar la frecuencia de la función de filtrado
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/*function renderPagination(totalPages) {
    const paginationContainer = $('.pagination');
    paginationContainer.empty();

    paginationContainer.append(`<a href="#" class="page-link noticia_pagination noticia_pagination_left" data-page="1">&laquo;</a>`);
    for (let i = 1; i <= totalPages; i++) {
        paginationContainer.append(`<a href="#" class="page-link noticia_pagination" data-page="${i}">${i}</a>`);
    }
    paginationContainer.append(`<a href="#" class="page-link noticia_pagination noticia_pagination_right" data-page="${totalPages}">&raquo;</a>`);
}*/

function renderNoticias() {
    const noticiasContainer = $('#noticias-div');
    noticiasContainer.empty();

    // Añadir todas las noticias disponibles al contenedor
    filteredNoticiasData.forEach(function(noticia) {
        let selectedLanguage = $('.language-select-pc').val();
        let displayDiv = "";
        if (selectedLanguage == "es" && noticia.hotel == "es") {
            displayDiv = "block";
        } else if (selectedLanguage == "en" && noticia.hotel == "com") {
            displayDiv = "block";
        } else if (selectedLanguage == "pt" && noticia.hotel == "com.br") {
            displayDiv = "block";
        } else {
            displayDiv = "none";
        }

        let hotelDefine = "";
        if (noticia.hotel == "com.br") {
            hotelDefine = "com_br";
        } else {
            hotelDefine = noticia.hotel;
        }

        const noticiaHTML = `
            <div class="noticia_div noticia_${hotelDefine}" data-toggle="modal" data-target="#noticiaModal" data-id="${noticia.id}" style="display: ${displayDiv};">
                <div class="row">
                    <div class="col-12 col-md-11">
                        <div class="row">
                            <div class="col-12">
                                <h5 class="noticia_title">${noticia.titulo}</h5>
                            </div>
                            <div class="col-12">
                                <p>${noticia.descripcion_resumida}</p>
                            </div>
                            <div class="col-12 noticia_fecha_col">
                                <p class="noticia_fecha">Fecha de publicación: ${noticia.fecha_noticia}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-md-1 d-flex justify-content-center align-items-center">
                        <img src="furnis/noticias/imagenes/resumidas/${noticia.imagen_resumida}.png" alt="${noticia.alt_imagen_resumida}" class="noticia_imagen_resumida">
                    </div>
                </div>
            </div>
        `;
        noticiasContainer.append(noticiaHTML);
    });
}

function loadLastThreeNoticias() {
    $.getJSON('furnis/noticias/noticias.json', function(data) {
        // Filtrar y renderizar noticias para cada hotel
        const hoteles = ['es', 'com', 'com.br'];
        const lastThreeContainer = $('#last_three_noticies');
        lastThreeContainer.empty();

        hoteles.forEach(function(hotel) {
            // Filtrar noticias para el hotel actual
            const noticiasPorHotel = data.filter(function(noticia) {
                return noticia.hotel === hotel;
            });

            // Ordenar por ID de manera descendente
            const noticiasOrdenadas = noticiasPorHotel.sort(function(a, b) {
                return b.id - a.id;
            });

            // Obtener las tres últimas noticias
            const lastThreeNoticias = noticiasOrdenadas.slice(0, 3);
            let selectedLanguage = $('.language-select-pc').val();
            let displayDiv = "";
            if(selectedLanguage == "es" && hotel == "es"){
                displayDiv = "block";
            } else if (selectedLanguage == "en" && hotel == "com") {
                displayDiv = "block";
            } else if (selectedLanguage == "pt" && hotel == "com.br") {
                displayDiv = "block";
            } else {
                displayDiv = "none";
            }
            let hotelDefine = "";
            if(hotel == "com.br"){
                hotelDefine = "com_br"
            } else {
                hotelDefine = hotel
            }
            // Renderizar las noticias
            lastThreeNoticias.forEach(function(noticia) {
                const noticiaHTML = `
                    <div class="noticia_div noticia_div_last_three ultimas_tres_noticias_${hotelDefine}" data-toggle="modal" data-target="#noticiaModal" data-id="${noticia.id}" style="display: ${displayDiv};">
                        <div class="row">
                            <div class="col-12">
                                <div class="row">
                                    <div class="col-12">
                                        <h5 class="noticia_title_last_three">${noticia.titulo}</h5>
                                    </div>
                                    <div class="col-12 noticia_descripcion_last_three">
                                        <p>${noticia.descripcion_resumida}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 d-flex justify-content-center align-items-center">
                                <img src="furnis/noticias/imagenes/resumidas/${noticia.imagen_resumida}.png" alt="${noticia.alt_imagen_resumida}" class="noticia_imagen_resumida_last_three">
                            </div>
                        </div>
                    </div>
                `;
                lastThreeContainer.append(noticiaHTML);
            });
        });
    });
}


function loadNoticias() {
    $.getJSON('furnis/noticias/noticias.json', function(data) {
        // Ordenar las noticias por ID de manera descendente
        noticiasData = data.sort(function(a, b) {
            return b.id - a.id;
        });
        filteredNoticiasData = noticiasData; // Inicialmente mostrar todas las noticias
        /*totalNoticias = filteredNoticiasData.length;
        const totalPages = Math.ceil(totalNoticias / noticiasPerPage);
        renderPagination(totalPages);*/
        renderNoticias(currentPage);
    });
}

// Filtrar noticias según la búsqueda
function filterNoticias(keyword) {
    let selectedLanguage = $('.language-select-pc').val();
    let languageToHotelMap = {
        "en": "com",
        "es": "es",
        "pt": "com.br"
    };

    let selectedHotel = languageToHotelMap[selectedLanguage]; // Mapea el valor del select al hotel correspondiente

    // Iterar sobre todas las noticias y ajustar su visibilidad
    noticiasData.forEach(noticia => {
        const noticiaElement = $(`.noticia_div[data-id="${noticia.id}"]`);
        if (
            noticia.hotel === selectedHotel &&
            (noticia.titulo.toLowerCase().includes(keyword.toLowerCase()) ||
             noticia.descripcion_resumida.toLowerCase().includes(keyword.toLowerCase()))
        ) {
            noticiaElement.css('display', 'block'); // Mostrar noticia si coincide
        } else {
            noticiaElement.css('display', 'none'); // Ocultar noticia si no coincide
        }
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

    if (noticia) {
        $('#noticiaModalImage').attr('src', `furnis/noticias/imagenes/completas/${noticia.imagen_completa}.png`);
        $('#noticiaModalDescription').html(noticia.descripcion_completa);

        const clickSound = document.getElementById('click-sound');
        clickSound.play();

        $('#noticiaModal').modal('show');
    } else {
        console.error('Noticia not found for ID:', noticiaId);
    }
});

$('#noticiaModal').on('shown.bs.modal', function () {
    let i = 0;
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

/*$('#toggle-button').on('click', function() {
    $('#music-player-container').toggleClass('minimized');
});*/

// Inicializar noticias y campo de búsqueda
$(document).ready(function() {
    // Adjuntar el evento de búsqueda con debounce
    $('#search-noticias').on('input', debounce(function() {
        const searchValue = $(this).val().toLowerCase();
        filterNoticias(searchValue);
    }, 300)); // 300 ms delay

    // Cargar las noticias iniciales
    loadNoticias();
});
