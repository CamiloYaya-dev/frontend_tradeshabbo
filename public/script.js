$(document).ready(function() {
    // Función para actualizar el contenido traducido
    function updateContent() {
        $('[data-i18n]').each(function() {
            var key = $(this).data('i18n');
            if ($(this).is("input")) {
                $(this).attr("placeholder", i18next.t(key.split(']')[1]));
            } else if (key.startsWith('[title]')) {
                $(this).attr("title", i18next.t(key.split(']')[1]));
            } else {
                $(this).html(i18next.t(key));
            }
        });
    }

    // Función para cambiar el idioma y actualizar el contenido
    function changeLanguage(lng) {
        i18next.changeLanguage(lng, function(err, t) {
            if (err) return console.log('something went wrong loading', err);
            updateContent();
            localStorage.setItem('selectedLanguage', lng); // Guardar el idioma seleccionado en localStorage
        });
    }

    // Verificar si hay un idioma seleccionado en localStorage
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en'; // Valor por defecto es 'en'
    
    // Cambiar el idioma al seleccionado
    changeLanguage(selectedLanguage);
    
    // Actualizar el select del idioma
    $('#language-select').val(selectedLanguage);

    // Manejar el cambio de idioma desde el select
    $('#language-select').change(function() {
        const newLanguage = $(this).val();
        changeLanguage(newLanguage);
    });

    // Actualizar el contenido al cargar la página
    updateContent();

    $.getScript('songs.js', function() {});
    $.getScript('modal.js', function() {});
    $.getScript('noticias.js', function() {});
    $.getScript('sorteos.js', function() {});
    $.getScript('logic_script.js', function() {});

    $('.menu-link').on('click', function(e) {
        e.preventDefault();
        var section = $(this).data('section');
        if (section === 'catalogo') {
            $('#catalogo-section').show();
            $('#column-explications-catalogo').show();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#sort-options').show();
        } else if (section === 'noticias') {
            loadNoticias();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').show();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#sort-options').hide();
        } else if (section === 'calculador') {
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').show();
            $('#sorteos-section').hide();
            $('#sort-options').hide();
        } else if (section === 'sorteos') {
            loadSorteos();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').show();
            $('#sort-options').hide();
        }
        updateContent(); // Asegúrate de actualizar el contenido traducido después de cambiar de vista
    });

    $('[data-toggle="tooltip"]').tooltip(); 
});
