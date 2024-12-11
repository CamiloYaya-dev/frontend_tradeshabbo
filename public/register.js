let registerRecaptchaWidget;

// Función de inicialización de reCAPTCHA (ámbito global)
function initializeRegisterRecaptcha() {
    if (typeof grecaptcha !== "undefined" && $('#register-recaptcha').length) {
        registerRecaptchaWidget = grecaptcha.render('register-recaptcha', {
            sitekey: '6Lcvhc4ZAAAAAAPMvUDwQ8yvLetUarwazNfCr4D8'
        });
    } else {
        console.error("reCAPTCHA no está disponible o el contenedor no existe.");
    }
}

$(document).ready(function () {
    // Inicializar tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Escuchar el evento click del botón registrar
    $('#register-button').on('click', async function () {
        const usernameRegister = $('#usernameRegister').val().trim();
        const email = $('#email').val().trim();
        const passwordRegister = $('#passwordRegister').val();
        const confirmPassword = $('#confirm-password').val();
        const recaptchaResponse = grecaptcha.getResponse(registerRecaptchaWidget);

        // Validaciones de nombre de usuario
        const usernameRegisterRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=]+$/;
        if (!usernameRegister || !usernameRegisterRegex.test(usernameRegister)) {
            mostrarAlertaError('El nombre de usuario solo puede contener letras, números y caracteres especiales permitidos.');
            return;
        }

        if (usernameRegister.length < 3 || usernameRegister.length > 30) {
            mostrarAlertaError('El nombre de usuario debe tener entre 3 y 30 caracteres.');
            return;
        }

        // Validaciones de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            mostrarAlertaError('Por favor, ingresa un correo electrónico válido.');
            return;
        }

        // Validaciones de contraseña
        const passwordRegisterRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=]).{8,}$/;
        if (!passwordRegister || !passwordRegisterRegex.test(passwordRegister)) {
            mostrarAlertaError('La contraseña debe tener al menos 8 caracteres, incluyendo 1 letra mayúscula, 1 letra minúscula, 1 número y 1 carácter especial.');
            return;
        }

        if (passwordRegister !== confirmPassword) {
            mostrarAlertaError('Las contraseñas no coinciden. Por favor, verifica.');
            return;
        }

        if (!recaptchaResponse) {
            mostrarAlertaError('Por favor, completa el reCAPTCHA.');
            return;
        }

        try {
            const payload = {
                usernameRegister,
                email,
                passwordRegister,
                recaptchaToken: recaptchaResponse
            };

            // Enviar datos al backend
            $.ajax({
                url: '/register-user',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload),
                success: function (response) {
                    if(response.message === "El usuario o correo ya está registrado."){
                        mostrarAlertaError(response.message);
                    } else {
                        mostrarAlertaExito(response.message || 'Usuario registrado correctamente');
                        $('#register-form')[0].reset(); // Limpiar formulario
                        grecaptcha.reset(); // Resetear reCAPTCHA
                    }
                },
                error: function (xhr) {
                    const errorMessage = xhr.responseJSON?.error || 'Error al registrar el usuario.';
                    mostrarAlertaError(errorMessage);
                    grecaptcha.reset(); // Resetear reCAPTCHA
                }
            });
        } catch (error) {
            console.error('Error ejecutando reCAPTCHA:', error);
            mostrarAlertaError('Error ejecutando reCAPTCHA. Intenta de nuevo.');
        }
    });

    // Función para mostrar alertas de error
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

    // Función para mostrar alertas de éxito
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
});
