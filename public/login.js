$(document).ready(function () {
    $('#login-button').on('click', function () {
        const username = $('#username').val().trim();
        const password = $('#password').val().trim();
        const recaptchaResponse = grecaptcha.getResponse();

        // Validaciones de correo electrónico
        const usernameRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=]+$/;
        if (!username || !usernameRegex.test(username)) {
            alert(
                'El nombre de usuario solo puede contener letras, números y caracteres especiales permitidos (!, @, #, $, %, ^, &, *, -, _, =, +).'
            );
            return;
        }

        // Validaciones de contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=]).{8,}$/;
        if (!password || !passwordRegex.test(password)) {
            alert(
                'La contraseña debe tener al menos 8 caracteres, incluyendo 1 letra mayúscula, 1 letra minúscula, 1 número y 1 carácter especial (!, @, #, $, %, ^, &, *, -, _, =, +).'
            );
            return;
        }

        if (!recaptchaResponse) {
            alert('Por favor, completa el reCAPTCHA.');
            return;
        }

        // Preparar el payload para enviar
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
                // SweetAlert2 con animación y posición para éxito
                Swal.fire({
                    title: response.message || 'Inicio de sesión exitoso.',
                    position: 'bottom-start', // Posición en la esquina inferior izquierda
                    showClass: {
                        popup: `
                            animate__animated
                            animate__backInLeft
                            animate__faster
                        `
                    },
                    hideClass: {
                        popup: `
                            animate__animated
                            animate__fadeOutDown
                            animate__faster
                        `
                    },
                    showConfirmButton: false, // Sin botón de confirmación
                    timer: 1000,
                    timerProgressBar: true,
                    width: "20em",
                    customClass: {
                        title: 'swal-title-success', // Clase personalizada para el título
                        popup: 'swal-popup-custom' // Clase personalizada para el popup
                    }
                }).then(() => {
                    $('#login-form')[0].reset(); // Limpiar el formulario
                    grecaptcha.reset(); // Restablecer reCAPTCHA
                    validationToken(); // Validar token de sesión
                });
            },
            error: function (xhr, status, error) {
                // SweetAlert2 con animación y posición para errores
                Swal.fire({
                    title: 'Error al iniciar sesión',
                    text: xhr.responseText || error,
                    icon: 'error',
                    position: 'bottom-start', // Posición en la esquina inferior izquierda
                    showClass: {
                        popup: `
                            animate__animated
                            animate__backInLeft
                            animate__faster
                        `
                    },
                    hideClass: {
                        popup: `
                            animate__animated
                            animate__fadeOutDown
                            animate__faster
                        `
                    },
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    grecaptcha.reset(); // Restablecer reCAPTCHA
                });
            }
        });        
    });

    $('#test-button').on('click', function () {
        Swal.fire({
            title: 'Inicio de sesión exitoso.',
            position: 'bottom-start', // Posición en la esquina inferior izquierda
            showClass: {
                popup: `
                    animate__animated
                    animate__backInLeft
                    animate__faster
                `
            },
            hideClass: {
                popup: `
                    animate__animated
                    animate__fadeOutDown
                    animate__faster
                `
            },
            showConfirmButton: false, // Sin botón de confirmación
            timer: 1000,
            timerProgressBar: true,
            width: "20em",
            customClass: {
                title: 'swal-title-error', // Clase personalizada para el título
                popup: 'swal-popup-custom' // Clase personalizada para el popup
            }
        }).then(() => {
            console.log("entre");
        });
    });

     // Manejar el cierre de sesión
     $('#logout_button').on('click', function () {
        document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; HttpOnly; SameSite=Strict";
        Swal.fire({
            title: 'Sesión cerrada correctamente.',
            position: 'bottom-start', // Posición en la esquina inferior izquierda
            showClass: {
                popup: `
                    animate__animated
                    animate__backInLeft
                    animate__faster
                `
            },
            hideClass: {
                popup: `
                    animate__animated
                    animate__fadeOutDown
                    animate__faster
                `
            },
            showConfirmButton: false, // Sin botón de confirmación
            timer: 1000,
            timerProgressBar: true,
            width: "20em",
            customClass: {
                title: 'swal-title-error', // Clase personalizada para el título
                popup: 'swal-popup-custom' // Clase personalizada para el popup
            }
        }).then(() => {
            location.reload(); // Recargar la página
        });
    });
    
});


function validationToken(){
    // Verifica si la cookie 'session_token' existe
    const sessionToken = document.cookie.split('; ').find(row => row.startsWith('session_token='));
    if (sessionToken) {
        // Decodifica el token y muestra el nombre de usuario
        const tokenValue = sessionToken.split('=')[1];
        const payload = JSON.parse(atob(tokenValue.split('.')[1]));

        // Muestra el nombre de usuario y oculta botones de login
        $('#username_display').text(payload.username);
        $('.no_login').hide();
        $('.usuario_logeado').show();

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
    } else {
        // Si no hay sesión activa, muestra botones de login
        $('.no_login').show();
        $('.usuario_logeado').hide();
    }
}