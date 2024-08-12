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
    const noticiasContainer = $('#noticias-div');
    noticiasContainer.empty();

    // Añadir noticias filtradas al contenedor
    const noticiasToRender = filteredNoticiasData.slice(startIndex, endIndex);
    noticiasToRender.forEach(function(noticia) {
        const noticiaHTML = `
            <div class="noticia_div" data-toggle="modal" data-target="#noticiaModal" data-id="${noticia.id}">
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
        // Ordenar las noticias por ID de manera descendente
        noticiasData = data.sort(function(a, b) {
            return b.id - a.id;
        });

        // Obtener las tres últimas noticias
        const lastThreeNoticias = noticiasData.slice(0, 3);
        const lastThreeContainer = $('#last_three_noticies');
        lastThreeContainer.empty();

        lastThreeNoticias.forEach(function(noticia) {
            const noticiaHTML = `
                <div class="noticia_div noticia_div_last_three" data-toggle="modal" data-target="#noticiaModal" data-id="${noticia.id}">
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
}


function loadNoticias() {
    $.getJSON('furnis/noticias/noticias.json', function(data) {
        // Ordenar las noticias por ID de manera descendente
        noticiasData = data.sort(function(a, b) {
            return b.id - a.id;
        });
        filteredNoticiasData = noticiasData; // Inicialmente mostrar todas las noticias
        totalNoticias = filteredNoticiasData.length;
        const totalPages = Math.ceil(totalNoticias / noticiasPerPage);
        renderPagination(totalPages);
        renderNoticias(currentPage);
    });
}

// Filtrar noticias según la búsqueda
function filterNoticias(keyword) {
    filteredNoticiasData = noticiasData.filter(noticia => {
        return noticia.titulo.toLowerCase().includes(keyword.toLowerCase()) ||
        noticia.descripcion_resumida.toLowerCase().includes(keyword.toLowerCase());
    });
    totalNoticias = filteredNoticiasData.length;
    const totalPages = Math.ceil(totalNoticias / noticiasPerPage);
    currentPage = 1; // Reiniciar a la primera página después de filtrar
    renderPagination(totalPages);
    renderNoticias(currentPage);
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

$('#toggle-button').on('click', function() {
    $('#music-player-container').toggleClass('minimized');
});

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
