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
                        <div class="col-12 col-md-11">
                            <div class="row">
                                <div class="col-12">
                                    <h5 class="noticia_title">${noticia.titulo}</h5>
                                </div>
                                <div class="col-12">
                                    <p>${noticia.descripcion_resumida}</p>
                                </div>
                                <div class="col-12 noticia_fecha_col">
                                    <p class="noticia_fecha">Fecha de publicacion: ${noticia.fecha_noticia}</p>
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