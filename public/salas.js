function loadSalaImages() {
    const imageDirectory = '/salas/';
    
    // Obtener la lista de imágenes (asegúrate de que el servidor esté entregando una lista de nombres de archivos)
    $.getJSON(imageDirectory, function(imageFiles) {
        const comunidadSalas = $('#comunidad_salas');
        comunidadSalas.empty();

        // Ordenar los archivos por fecha y hora en orden descendente (de más reciente a más antiguo)
        imageFiles.sort((a, b) => {
            let [datePartA, timePartA] = a.split('_');
            let [dayA, monthA, yearA] = datePartA.split('-');
            let [hourA, minuteA, secondA] = timePartA.split('-');

            let [datePartB, timePartB] = b.split('_');
            let [dayB, monthB, yearB] = datePartB.split('-');
            let [hourB, minuteB, secondB] = timePartB.split('-');

            let dateA = new Date(yearA, monthA - 1, dayA, hourA, minuteA, secondA);
            let dateB = new Date(yearB, monthB - 1, dayB, hourB, minuteB, secondB);

            return dateB - dateA; // Ordenar de más reciente a más antiguo
        });

        // Generar el HTML para cada imagen ordenada
        imageFiles.forEach(function(imageFile) {
            // Obtener la fecha, hora y usuario desde el nombre del archivo
            let [datePart, timePart, userId] = imageFile.split('_');
            let [day, month, year] = datePart.split('-');
            let [hour, minute, second] = timePart.split('-');
            let datetime = `${day}-${month}-${year} ${hour}:${minute}:${second}`;

            // Generar el HTML de la imagen
            const imageHtml = `
                <div class="gallery-item">
                    <img src="${imageDirectory}${imageFile}" class="img-fluid gallery-img" alt="Imagen ${imageFile}" data-toggle="modal" data-target="#imageModal" data-user="${userId}" data-datetime="${datetime}">
                </div>
            `;
            comunidadSalas.append(imageHtml);
        });

        // Configurar el modal para mostrar la imagen ampliada
        $('.gallery-img').click(function() {
            const imgSrc = $(this).attr('src');
            const user = $(this).data('user');
            const datetime = $(this).data('datetime');

            $('#modalImage').attr('src', imgSrc);
            $('#imageDetails').html(`<strong class="modal_habbo_text_blue">Usuario:</strong><p class="modal_habbo_text_white"> ${user}</p><strong class="modal_habbo_text_blue">Fecha y Hora:</strong><p class="modal_habbo_text_white"> ${datetime}</p>`);
        });
    });
}
