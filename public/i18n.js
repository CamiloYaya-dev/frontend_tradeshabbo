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
    $('#language-select').val(selectedLanguage);

    // Manejar el cambio de idioma desde el select
    $('#language-select').change(function() {
        const newLanguage = $(this).val();
        changeLanguage(newLanguage);
    });
    updateContent();
});
