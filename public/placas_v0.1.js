function obtenerPlacas() {
    $.ajax({
        url: '/obtener-placas',
        method: 'GET',
        success: function(imageFiles) {
            const divPlacas = $('.div_placas');
            let rowHTML = `
            <p class="habbo_text_gold p_titulo_placas" data-i18n="placas_alojadas">
                Últimas Placas Alojadas
            </p>
            <div class="row">
            `;

            imageFiles.forEach(function(placa, index) {
                const fileName = placa.nombre;
                let tooltipText = fileName.replace("badge_", "").replace(".png", "");

                const imageHTML = `
                    <div class="col-3 no_padding">
                        <div class="placa" data-toggle="tooltip" title="${tooltipText}">
                            <img src="/secure-image/${fileName}" alt="${fileName}">
                        </div>
                    </div>
                `;

                rowHTML += imageHTML;

                if ((index + 1) % 4 === 0) {
                    rowHTML += '</div><div class="row">';
                }
            });

            rowHTML += '</div>';
            divPlacas.append(rowHTML);
        },
        error: function() {
            console.error('Error al cargar las imágenes');
        }
    });
}


function obtenerPlacasLimit() {
    $.ajax({
        url: '/obtener-placas?limit=8',
        method: 'GET',
        success: function(imageFiles) {
            const divPlacas = $('.div_placas');
            let rowHTML = `
            <p class="habbo_text_gold p_titulo_placas" data-i18n="placas_alojadas">
                Últimas Placas Alojadas
            </p>
            <div class="row">
            `;

            imageFiles.forEach(function(placa, index) {
                const fileName = placa.nombre;
                let tooltipText = fileName.replace("badge_", "").replace(".png", "");

                const imageHTML = `
                    <div class="col-3 no_padding">
                        <div class="placa" data-toggle="tooltip" title="${tooltipText}">
                            <img src="/secure-image/${fileName}" alt="${fileName}">
                        </div>
                    </div>
                `;

                rowHTML += imageHTML;

                if ((index + 1) % 4 === 0) {
                    rowHTML += '</div><div class="row">';
                }
            });

            rowHTML += '</div>';
            divPlacas.append(rowHTML);
        },
        error: function() {
            console.error('Error al cargar las placas limitadas');
        }
    });
}

