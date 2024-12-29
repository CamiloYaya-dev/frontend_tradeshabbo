function obtenerPlacas() {

    // Hacer la petición al servidor para obtener la lista de imágenes
    $.ajax({
        url: '/obtener-placas',  // Endpoint que lista las imágenes
        method: 'GET',
        success: function(imageFiles) {
            const divPlacas = $('.div_placas'); // Asegúrate de que tienes este contenedor en tu HTML
            let rowHTML = `
            <p class="habbo_text_blue p_titulo_placas" data-i18n="placas_alojadas">
                Placas alojadas
            </p>
            <div class="row">
            `;
            
            // Iterar sobre la lista de imágenes recibidas y crear los elementos <img>
            imageFiles.forEach(function(fileName, index) {
                let tooltipText1 = fileName.replace("badge_", "");
                let tooltipText2 = tooltipText1.replace(".png", "");
                // Crear la estructura HTML de la imagen con la columna
                const imageHTML = `
                    <div class="col-3 no_padding">
                        <div class="placa" data-toggle="tooltip" title="${tooltipText2}">
                            <img src="/secure-image/${fileName}" alt="${fileName}">
                        </div>
                    </div>
                `;
        
                // Agregar la imagen a la fila
                rowHTML += imageHTML;
        
                // Cerrar y empezar una nueva fila cada 4 imágenes
                if ((index + 1) % 4 === 0) {
                    rowHTML += '</div><div class="row">';
                }
            });
        
            // Cerrar la última fila
            rowHTML += '</div>';
        
            // Insertar la fila en el contenedor
            divPlacas.append(rowHTML);
        },
        error: function() {
            console.error('Error al cargar las imágenes');
        }
    });
}
