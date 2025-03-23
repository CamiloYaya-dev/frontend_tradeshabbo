function obtenerPremios() {
    $.ajax({
        url: '/obtener-premios',
        method: 'GET',
        success: function(premios) {
            const contenedor = $('.row_premios_render');
            contenedor.empty();

            premios.forEach(premio => {
                const nombreFurni = premio.furni_name || 'Sin nombre';
                const nombreLimpio = nombreFurni.replace(/_/g, " ");
                const imagenFurni = `furnis/min/${nombreFurni}_min.gif`;
                const iconoHotel = `furnis/iconos/${premio.hotel}_min.png`;
                const hotelTooltip = `${nombreLimpio} - ${premio.hotel}`;
                const idUnico = `img_${premio.id}`;

                // Si está deshabilitado, aplicar estilo gris
                const estiloImagen = premio.habilitado === 0 ? 'filter: grayscale(100%);' : '';

                const html = `
                    <div class="col-3 d-flex align-items-center justify-content-center">
                        <div class="premios_disponibles last_items_update_${premio.hotel.toLowerCase()}" data-toggle="tooltip" title="${hotelTooltip}" style="display: flex; flex-direction: column; align-items: center;">
                            <img id="${idUnico}" src="${imagenFurni}" alt="${nombreLimpio}" style="box-sizing: content-box; ${estiloImagen}">
                            <img src="${iconoHotel}" alt="icono ${premio.hotel}" class="icon_country_min">
                            <p class="cantidad_premio">x${premio.cantidad}</p>
                        </div>
                    </div>
                `;

                contenedor.append(html);

                const img = new Image();
                img.onload = function () {
                    const target = document.getElementById(idUnico);
                    const paddingTop = Math.floor((36 - img.height));
                    if (paddingTop > 0) {
                        target.style.paddingTop = `${paddingTop}px`;
                    }
                };
                img.src = imagenFurni;
            });

            $('[data-toggle="tooltip"]').tooltip();
        },
        error: function() {
            console.error('Error al obtener los premios');
        }
    });
}
