$(document).ready(function () {
    $('#login-button').on('click', function () {
        const email = $('#email').val().trim();
        const password = $('#password').val().trim();
        const recaptchaResponse = grecaptcha.getResponse();

        // Validaciones de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            alert('Por favor, ingresa un correo electrónico válido.');
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
            email,
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
                alert(response.message || 'Inicio de sesión exitoso.');
                $('#login-form')[0].reset(); // Limpiar el formulario
                grecaptcha.reset(); // Restablecer reCAPTCHA
            },
            error: function (xhr, status, error) {
                alert('Error al iniciar sesión: ' + (xhr.responseText || error));
                grecaptcha.reset(); // Restablecer reCAPTCHA
            }
        });
    });
});
