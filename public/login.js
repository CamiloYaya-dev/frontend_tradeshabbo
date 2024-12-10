let loginRecaptchaWidget;

// Inicialización de reCAPTCHA
function initializeLoginRecaptcha() {
    console.log("Inicializando reCAPTCHA de login");
    if (typeof grecaptcha !== "undefined" && $('#login-recaptcha').length) {
        loginRecaptchaWidget = grecaptcha.render('login-recaptcha', {
            sitekey: '6Lcvhc4ZAAAAAAPMvUDwQ8yvLetUarwazNfCr4D8'
        });
    } else {
        console.error("reCAPTCHA no está disponible o el contenedor no existe.");
    }
}

$(document).ready(function () {
    $('#login-button').on('click', function () {
        // Sanitizar entradas
        const username = $('#username').val().trim().replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=]+/g, '');
        const password = $('#password').val().trim().replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=]+/g, '');
        const recaptchaResponse = grecaptcha.getResponse(loginRecaptchaWidget);

        // Validar reCAPTCHA antes de enviar
        if (!recaptchaResponse) {
            mostrarAlertaError('Por favor, completa el reCAPTCHA.');
            return;
        }

        // Preparar el payload
        const payload = {
            username,
            password,
            recaptchaToken: recaptchaResponse
        };

        // Enviar datos mediante AJAX
        $.ajax({
            url: '/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                mostrarAlertaExito(response.message || 'Inicio de sesión exitoso.');
                $('#login-form')[0].reset(); // Limpiar el formulario
                grecaptcha.reset(); // Resetear reCAPTCHA
                validationToken(); // Validar token de sesión
            },
            error: function (xhr) {
                const errorMessage = xhr.responseJSON?.error || 'Error al iniciar sesión.';
                mostrarAlertaError(errorMessage);
                grecaptcha.reset(); // Resetear reCAPTCHA
            }
        });
    });

    // Manejar cierre de sesión
    $('#logout_button').on('click', function () {
        document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; HttpOnly; SameSite=Strict";
        mostrarAlertaExito('Sesión cerrada correctamente.');
        setTimeout(() => location.reload(), 1500); // Recargar la página después de la alerta
    });
});

// Validar token de sesión
function validationToken() {
    const sessionToken = document.cookie.split('; ').find(row => row.startsWith('session_token='));
    if (sessionToken) {
        const tokenValue = sessionToken.split('=')[1];
        const payload = JSON.parse(atob(tokenValue.split('.')[1]));

        // Mostrar nombre de usuario y ocultar botones de login
        $('#username_display').text(payload.username);
        $('.no_login').hide();
        $('.usuario_logeado').show();

        // Mostrar/Ocultar secciones relevantes
        $('#catalogo-section, #column-explications-catalogo, #sort-options, #footer').show();
        $('#noticias-section, #calculador-section, #sorteos-section, #master-trades-section, #column-explications-master-trades, #habbo-generator-section, #text-generator-section, #comunidad_salas, #equipo-section, #marketplace-section, #login-section, #register-section').hide();
    } else {
        $('.no_login').show();
        $('.usuario_logeado').hide();
    }
}

// Funciones de alerta
function mostrarAlertaError(mensaje) {
    Swal.fire({
        title: mensaje,
        icon: 'error',
        position: 'bottom-start',
        showClass: {
            popup: 'animate__animated animate__backInLeft animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutDown animate__faster'
        },
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        width: "20em",
        customClass: {
            title: 'swal-title-error',
            popup: 'swal-popup-custom'
        }
    });
}

function mostrarAlertaExito(mensaje) {
    Swal.fire({
        title: mensaje,
        icon: 'success',
        position: 'bottom-start',
        showClass: {
            popup: 'animate__animated animate__backInLeft animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutDown animate__faster'
        },
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        width: "20em",
        customClass: {
            title: 'swal-title-success',
            popup: 'swal-popup-custom'
        }
    });
}
