function obtenerEventos() {
    $.ajax({
        url: '/obtener-eventos',
        method: 'GET',
        success: function(eventos) {
            const contenedor = $('.div_eventos_home');
            contenedor.empty();

            const imagenesIds = [];

            eventos.forEach((evento, index) => {
                const idImg = `evento_img_${index}`;
                imagenesIds.push(idImg);

                const html = `
                    <div class="col-4" style="cursor: pointer;" onclick="window.open('${evento.url}', '_blank')">
                        <div class="div_eventos_home_body">
                            <img id="${idImg}" src="${evento.imagen}" alt="icon" class="ancho_imagen_100">
                            <div class="col-12 evento_titulo">
                                <h6>${evento.titulo}</h6>
                            </div>
                            <div class="col-12 evento_descripcion">
                                <h6>${evento.descripcion}</h6>
                            </div>
                        </div>
                    </div>
                `;
                contenedor.append(html);
            });

            // Esperar a que todas las imágenes se carguen para calcular alturas
            const checkImagesLoaded = () => {
                const heights = [];
                let loadedCount = 0;

                imagenesIds.forEach((id, i) => {
                    const img = document.getElementById(id);
                    if (!img.complete) {
                        img.onload = () => {
                            loadedCount++;
                            if (loadedCount === imagenesIds.length) ajustarAlturas();
                        };
                    } else {
                        loadedCount++;
                        if (loadedCount === imagenesIds.length) ajustarAlturas();
                    }
                });

                function ajustarAlturas() {
                    imagenesIds.forEach(id => {
                        const img = document.getElementById(id);
                        heights.push(img.offsetHeight);
                    });

                    const maxHeight = Math.max(...heights);

                    imagenesIds.forEach((id, i) => {
                        const img = document.getElementById(id);
                        const currentHeight = heights[i];

                        if (currentHeight < maxHeight) {
                            const paddingTotal = maxHeight - currentHeight;
                            const paddingTop = Math.floor(paddingTotal / 2);
                            const paddingBottom = paddingTotal - paddingTop;

                            img.style.paddingTop = `${paddingTop}px`;
                            img.style.paddingBottom = `${paddingBottom}px`;
                        }
                    });
                }
            };

            checkImagesLoaded();
        },
        error: function() {
            console.error('Error al obtener los eventos');
        }
    });
}
