function renderThreads(filterTag = null, mode = 'any') {
    const marketplaceDiv = $("#marketplace-section");
    marketplaceDiv.empty();

    // Crear los cuatro botones al principio
    const buttonsHTML = `
        <div class="row mb-3">
            <div class="col-12 d-flex justify-content-center div_marketplace">
                <button id="todoBtn" class="btn navbar_item habbo_text_blue">
                    Todos
                </button>
                <button id="comproBtn" class="btn navbar_item habbo_text_blue">
                    <img src="furnis/iconos/marketplace_icon.png" class="marketplace_icons_button" alt="compro icono">
                    Compro
                </button>
                <button id="vendoBtn" class="btn navbar_item habbo_text_blue">
                    <img src="furnis/iconos/vendo.png" class="marketplace_icons_button" alt="vendo icono">
                    Vendo
                </button>
                <button id="cambioBtn" class="btn navbar_item habbo_text_blue">
                    <img src="furnis/iconos/calculador_de_trades_icon.png" class="marketplace_icons_button" alt="cambio icono">
                    Cambio
                </button>
            </div>
        </div>
    `;

    // Añadir los botones al marketplace
    marketplaceDiv.append(buttonsHTML);

    // Obtener los datos del archivo JSON
    $.getJSON('./forum_threads.json', function(data) {
        // Filtrar los hilos según la etiqueta seleccionada (si hay un filtro)
        if (filterTag) {
            if (mode === 'single') {
                // Solo muestra hilos con una única etiqueta específica
                data = data.filter(thread => thread.appliedTags.length === 1 && thread.appliedTags.includes(filterTag));
            } else if (mode === 'both') {
                // Solo muestra hilos que tienen ambas etiquetas
                data = data.filter(thread => thread.appliedTags.includes('1284690542315438110') && thread.appliedTags.includes('1284690495997739070'));
            }
        }

        // Ordenar los hilos por el createdTimestamp más reciente
        data.sort((a, b) => b.createdTimestamp - a.createdTimestamp);

        data.forEach(thread => {
            // Verificar si el primer mensaje tiene un autor
            if (!thread.messages[0] || !thread.messages[0].author) {
                console.log(`Hilo ${thread.id} ignorado debido a que no tiene autor en el primer mensaje.`);
                return; // Ignora este hilo si el autor está vacío
            }

            // Verificar si el hilo tiene al menos una de las etiquetas requeridas
            if (!thread.appliedTags.includes('1284690542315438110') && !thread.appliedTags.includes('1284690495997739070')) {
                console.log(`Hilo ${thread.id} ignorado debido a que no contiene ninguna de las etiquetas requeridas.`);
                return; // Ignora este hilo si no tiene las etiquetas requeridas
            }

            // Ordenar los mensajes dentro de cada hilo por el createdTimestamp más reciente
            thread.messages.sort((a, b) => b.createdTimestamp - a.createdTimestamp);

            let imageSrc = '';
            if (thread.appliedTags.includes('1284690542315438110') && thread.appliedTags.includes('1284690495997739070')) {
                imageSrc = 'furnis/iconos/calculador_de_trades_icon.png'; // Ambas etiquetas
            } else if (thread.appliedTags.includes('1284690542315438110')) {
                imageSrc = 'furnis/iconos/vendo.png'; // Solo 1284690542315438110
            } else if (thread.appliedTags.includes('1284690495997739070')) {
                imageSrc = 'furnis/iconos/marketplace_icon.png'; // Solo 1284690495997739070
            }

            const arrayMessagesPositionAuthor = 0; // Asumiendo que quieres siempre mostrar el primer mensaje

            // Crear la estructura HTML para cada hilo
            const threadHTML = `
                <div class="noticia_div" data-id="${thread.id}">
                    <div class="row">
                        <div class="col-12 col-md-11">
                            <div class="row">
                                <div class="col-12">
                                    <h5 class="noticia_title">${thread.name}</h5>
                                </div>
                                <div class="col-12 thread_messages">
                                    <p class="threads_p"><strong>${thread.messages[arrayMessagesPositionAuthor].author}</strong>: ${thread.messages[arrayMessagesPositionAuthor].content}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-1 d-flex justify-content-center align-items-center">
                            <img src="${imageSrc}" alt="rare" class="noticia_imagen_resumida">
                        </div>
                        <div class="col-12 d-flex justify-content-center align-items-center">
                            <a href="${thread.url}" target="_blank"><img src="furnis/iconos/ver_hilo_completo.png" alt="ver hilo completo"></a>
                        </div>
                    </div>
                </div>
            `;

            // Añadir el HTML generado al marketplace
            marketplaceDiv.append(threadHTML);
        });
    }).fail(function() {
        console.error('Error al cargar forum_threads.json');
    });

    // Agregar eventos a los botones para filtrar hilos según la etiqueta
    $("#todoBtn").click(() => renderThreads()); // Mostrar todos los hilos (sin filtro)
    $("#comproBtn").click(() => renderThreads('1284690495997739070', 'single')); // Filtrar por "Compro" (solo esa etiqueta)
    $("#vendoBtn").click(() => renderThreads('1284690542315438110', 'single'));  // Filtrar por "Vendo" (solo esa etiqueta)
    $("#cambioBtn").click(() => renderThreads('1284690495997739070', 'both'));   // Filtrar por "Cambio" (ambas etiquetas)
}

// Ejecutar renderThreads al cargar la página para mostrar todos los hilos
//renderThreads();
