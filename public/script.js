$(document).ready(function() {
    let version = '0.1'
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

    $.getScript(`login_v${version}.js?v=${version}`, function() {});
    $.getScript(`songs_v${version}.js?v=${version}`, function() {});
    $.getScript(`modal_v${version}.js?v=${version}`, function() {});
    $.getScript(`noticias_v${version}.js?v=${version}`, function() {});
    $.getScript(`sorteos_v${version}.js?v=${version}`, function() {});
    $.getScript(`logic_script_v${version}.js?v=${version}`, function() {});
    $.getScript(`mts_v${version}.js?v=${version}`, function() {});
    $.getScript(`salas_v${version}.js?v=${version}`, function() {});
    $.getScript(`marketplace_v${version}.js?v=${version}`, function() {});
    $.getScript(`placas_v${version}.js?v=${version}`, function() {});
    $.getScript(`register_v${version}.js?v=${version}`, function() {});

    $('#button_options').on('click', function(e) {
        var content = document.getElementById("toggle-content");
        if (content.style.display === "none") {
            content.style.display = "block";
        } else {
            content.style.display = "none";
        }
    });

    $('.menu-link').on('click', function(e) {
        e.preventDefault();
        var section = $(this).data('section');
        if (section === 'catalogo') {
            loadOtherClass();
            loadLastThreeNoticias();
            $('#catalogo-section').show();
            $('#column-explications-catalogo').show();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').show();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#text-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'noticias') {
            loadOtherClass();
            loadNoticias();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').show();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#text-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'calculador') {
            loadOtherClass();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').show();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#text-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'sorteos') {
            loadOtherClass();
            loadSorteos();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').show();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#text-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'master_trades') {
            loadMasterTrades();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').show();
            $('#sort-options').hide();
            $('#footer').hide();
            $('#column-explications-master-trades').show();
            $('#habbo-generator-section').hide();
            $('#text-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'habbo_generator_section'){
            loadOtherClass();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').show();
            $('#text-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'text_generator_section'){
            loadOtherClass();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#text-generator-section').show();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'comunidad_salas'){
            loadOtherClass();
            loadSalaImages();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#comunidad_salas').show();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'equipo'){
            loadOtherClass();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').show();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'compro_vendo'){
            loadOtherClass();
            renderThreads();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').show();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'login'){
            loadOtherClass();
            renderThreads();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').show();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'register'){
            loadOtherClass();
            renderThreads();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').show();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'acerca_nosotros'){
            loadOtherClass();
            renderThreads();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').show();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'terminos_condiciones'){
            loadOtherClass();
            renderThreads();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').show();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'preguntas_respuestas'){
            loadOtherClass();
            renderThreads();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').show();
            $('#politicas-privacidad-section').hide();
        } else if (section === 'politica_privacidad'){
            loadOtherClass();
            renderThreads();
            $('#catalogo-section').hide();
            $('#column-explications-catalogo').hide();
            $('#noticias-section').hide();
            $('#calculador-section').hide();
            $('#sorteos-section').hide();
            $('#master-trades-section').hide();
            $('#sort-options').hide();
            $('#footer').show();
            $('#column-explications-master-trades').hide();
            $('#habbo-generator-section').hide();
            $('#comunidad_salas').hide();
            $('#equipo-section').hide();
            $('#marketplace-section').hide();
            $('#login-section').hide();
            $('#register-section').hide();
            $('#acerca-nosotros-section').hide();
            $('#terminos-condiciones-section').hide();
            $('#preguntas-respuestas-section').hide();
            $('#politicas-privacidad-section').show();
        }
        updateContent();
    });

    $('[data-toggle="tooltip"]').tooltip(); 
});
