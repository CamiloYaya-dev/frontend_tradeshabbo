$(document).ready(function () {
    // Inicializar tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Escuchar el evento click del botón registrar
    $('#register-button').on('click', async function () {
        // Obtener los datos del formulario
        const username = $('#username').val().trim();
        const email = $('#email').val().trim();
        const password = $('#password').val();
        const confirmPassword = $('#confirm-password').val();

        // Validaciones de nombre de usuario
        const usernameRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=]+$/;
        if (!username || !usernameRegex.test(username)) {
            alert(
                'El nombre de usuario solo puede contener letras, números y caracteres especiales permitidos (!, @, #, $, %, ^, &, *, -, _, =, +).'
            );
            return;
        }

        if (username.length < 3 || username.length > 30) {
            alert('El nombre de usuario debe tener entre 3 y 30 caracteres. Por favor, verifica.');
            return;
        }

        // Validaciones de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            alert('Por favor, ingresa un correo electrónico válido.');
            return;
        }

        // Validaciones de contraseña
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=]).{8,}$/;
        if (!password || !passwordRegex.test(password)) {
            alert(
                'La contraseña debe tener al menos 8 caracteres, incluyendo 1 letra mayúscula, 1 letra minúscula, 1 número y 1 carácter especial (!, @, #, $, %, ^, &, *, -, _, =, +).'
            );
            return;
        }

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden. Por favor, verifica.');
            return;
        }

        try {
            // Ejecutar reCAPTCHA y obtener el token
            const recaptchaToken = await grecaptcha.enterprise.execute(
                '6Lff1ZYqAAAAAGXTMx_xDCDKzPNfs6uWNuGt8JlW', 
                { action: 'register' }
            );

            // Preparar el payload para enviar
            const payload = {
                username,
                email,
                password,
                recaptchaToken,
            };

            console.log('Datos listos para enviar:', payload);

            // Enviar los datos al backend mediante AJAX
            $.ajax({
                url: '/register-user',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload),
                success: function (response) {
                    alert(response.message);
                    $('#register-form')[0].reset(); // Limpiar el formulario
                },
                error: function (xhr) {
                    const errorMessage = xhr.responseJSON?.error || 'Error al registrar el usuario.';
                    alert(`Ocurrió un error: ${errorMessage}`);
                },
            });
        } catch (error) {
            console.error('Error ejecutando reCAPTCHA:', error);
            alert('Error ejecutando reCAPTCHA. Intenta de nuevo.');
        }
    });
});
