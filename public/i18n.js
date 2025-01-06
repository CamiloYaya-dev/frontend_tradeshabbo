i18next
    .use(i18nextXHRBackend)
    .use(i18nextBrowserLanguageDetector)
    .init({
        fallbackLng: 'en',
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json'
        },
        debug: true,
        ns: ['translations'],
        defaultNS: 'translations',
        keySeparator: false, // we use content as keys
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
            escapeInterpolation: false // para permitir HTML en las traducciones
        }
    }, function(err, t) {
        // Update content
        updateContent();
    });

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

function changeLanguage(lng) {
    i18next.changeLanguage(lng, function(err, t) {
        if (err) return console.log('something went wrong loading', err);
        updateContent();
        localStorage.setItem('selectedLanguage', lng); // Guardar el idioma seleccionado en localStorage
    });
}

$(document).ready(function() {
    // Verificar si hay un idioma seleccionado en localStorage
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en'; // Valor por defecto es 'en'
    
    // Cambiar el idioma al seleccionado
    changeLanguage(selectedLanguage);
    
    // Actualizar el select del idioma
    $('.language-select-mobile').val(selectedLanguage);

    // Manejar el cambio de idioma desde el select
    $('.language-select-mobile').change(function() {
        const newLanguage = $(this).val();
        changeLanguage(newLanguage);

        $('.name-item-es').hide();
        $('.name-item-en').hide();
        $('.name-item-pt').hide();
        $('.name-item-history-es').hide();
        $('.name-item-history-en').hide();
        $('.name-item-history-pt').hide();
        $('.ultimas_tres_noticias_es').hide();
        $('.ultimas_tres_noticias_com').hide();
        $('.ultimas_tres_noticias_com_br').hide();
        $('.noticia_es').hide();
        $('.noticia_com').hide();
        $('.noticia_com_br').hide();
        if (newLanguage === 'es') {
            $('.name-item-es').show();
            $('.name-item-history-es').show();
            $('.last_items_update_es').show();
            $('.ultimas_tres_noticias_es').show();
            $('.noticia_es').show();
        } else if (newLanguage === 'en') {
            $('.name-item-en').show();
            $('.name-item-history-en').show();
            $('.last_items_update_en').show();
            $('.ultimas_tres_noticias_com').show();
            $('.noticia_com').show();
        } else if (newLanguage === 'pt') {
            $('.name-item-pt').show();
            $('.name-item-history-pt').show();
            $('.last_items_update_pt').show();
            $('.ultimas_tres_noticias_com_br').show();
            $('.noticia_com_br').show();
        }
    });

    $('.language-select-pc').val(selectedLanguage);

    // Manejar el cambio de idioma desde el select
    $('.language-select-pc').change(function() {
        console.log("entre aca");
        const newLanguage = $(this).val();
        changeLanguage(newLanguage);

        $('.name-item-es').hide();
        $('.name-item-en').hide();
        $('.name-item-pt').hide();
        $('.name-item-history-es').hide();
        $('.name-item-history-en').hide();
        $('.name-item-history-pt').hide();
        $('.last_items_update_es').hide();
        $('.last_items_update_en').hide();
        $('.last_items_update_pt').hide();
        $('.ultimas_tres_noticias_es').hide();
        $('.ultimas_tres_noticias_com').hide();
        $('.ultimas_tres_noticias_com_br').hide();
        $('.noticia_es').hide();
        $('.noticia_com').hide();
        $('.noticia_com_br').hide();

        if (newLanguage === 'es') {
            $('.name-item-es').show();
            $('.name-item-history-es').show();
            $('.last_items_update_es').show();
            $('.ultimas_tres_noticias_es').show();
            $('.noticia_es').show();
        } else if (newLanguage === 'en') {
            $('.name-item-en').show();
            $('.name-item-history-en').show();
            $('.last_items_update_en').show();
            $('.ultimas_tres_noticias_com').show();
            $('.noticia_com').show();
        } else if (newLanguage === 'pt') {
            $('.name-item-pt').show();
            $('.name-item-history-pt').show();
            $('.last_items_update_pt').show();
            $('.ultimas_tres_noticias_com_br').show();
            $('.noticia_com_br').show();
        }
    });
    
    updateContent();
});

$(document).on('productsRendered', function() {
    // Configura el idioma según el valor guardado en localStorage
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    if (selectedLanguage === 'es') {
        $('.name-item-es').show();
        $('.name-item-en').hide();
        $('.name-item-pt').hide();
    } else if (selectedLanguage === 'en') {
        $('.name-item-es').hide();
        $('.name-item-en').show();
        $('.name-item-pt').hide();
    } else if (selectedLanguage === 'pt') {
        $('.name-item-es').hide();
        $('.name-item-en').hide();
        $('.name-item-pt').show();
    }
});