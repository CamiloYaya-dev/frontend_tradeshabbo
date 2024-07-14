function loadSorteos() {
    $.getJSON('furnis/sorteos/sorteos.json', function(data) {
        sorteosData = data.sort(function(a, b) {
            return new Date(b.fecha) - new Date(a.fecha); // Sort descending by date
        });

        const sorteosContainer = $('#sorteos-container');
        sorteosContainer.empty();

        sorteosData.forEach(function(sorteo) {
            const sorteoHTML = `
                <div class="col-md-3 col-sm-6 mb-4 catalog_item_div sorteo-item">
                    <div class="card h-100 position-relative rainbow-border">
                        <img src="${sorteo.src}" class="card-img-top" alt="${sorteo.name}">
                        <div class="card-body text-center">
                            <p class="card-text text-name online_habbo_text_white">${sorteo.name}</p>
                            <a href="${sorteo.link}" class="text-decoration-none" target="_blank">
                                <img src="furnis/sorteos/click_y_participa.png" class="card-img-bottom sorteo-button" alt="${sorteo.name} Click para participar">
                            </a>
                        </div>
                    </div>
                </div>
            `;
            sorteosContainer.append(sorteoHTML);
        });

        // Load images for the carousel from the pagos folder
        loadCarouselImages();
    });
}

function loadCarouselImages() {
    $.getJSON('furnis/sorteos/pagos/', function(imageFiles) {
        const sorteosCarouselInner = $('#sorteos-carousel-inner');
        sorteosCarouselInner.empty();

        imageFiles.forEach(function(imageFile, index) {
            const carouselItemClass = index === 0 ? 'carousel-item active' : 'carousel-item';
            const carouselItemHTML = `
                <div class="${carouselItemClass}">
                    <img src="furnis/sorteos/pagos/${imageFile}" class="d-block w-100 test" alt="Sorteo Image">
                </div>
            `;
            sorteosCarouselInner.append(carouselItemHTML);
        });
    });
}