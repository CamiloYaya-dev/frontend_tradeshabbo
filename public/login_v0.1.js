let loginRecaptchaWidget;
let isTokenValid = false; // Variable global para evitar ciclos infinitos

// Inicialización de reCAPTCHA
function initializeLoginRecaptcha() {
    if (typeof grecaptcha !== "undefined" && $('#login-recaptcha').length) {
        loginRecaptchaWidget = grecaptcha.render('login-recaptcha', {
            sitekey: '6Lcvhc4ZAAAAAAPMvUDwQ8yvLetUarwazNfCr4D8'
        });
    } else {
        console.error("reCAPTCHA no está disponible o el contenedor no existe.");
    }
}

$(document).ready(async function () {
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
            success: async function (response) {
                mostrarAlertaExito(response.message || 'Inicio de sesión exitoso.');
                $('#login-form')[0].reset(); // Limpiar el formulario
                grecaptcha.reset(); // Resetear reCAPTCHA
                window.location.reload();
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
        // Realizar la solicitud AJAX al servidor para cerrar sesión
        $.ajax({
            url: '/logout', // Ruta del servidor para eliminar la cookie
            type: 'POST', // Tipo de solicitud
            success: function (response) {
                // Mostrar mensaje de éxito
                mostrarAlertaExito(response.message || 'Sesión cerrada correctamente.');
                
                // Recargar la página después de un tiempo
                setTimeout(() => window.location.reload(), 1500);
            },
            error: function (xhr) {
                // Mostrar mensaje de error si algo falla
                const errorMessage = xhr.responseJSON?.error || 'Error al cerrar la sesión.';
                mostrarAlertaError(errorMessage);
            }
        });
    });
    window.onload = async function () {
        await validationToken();
        agregarBotonesEdicion();
        if ($('#register-recaptcha').length) {
            initializeRegisterRecaptcha();
        }
        if ($('#login-recaptcha').length) {
            initializeLoginRecaptcha();
        }
    }
});

// Validar token de sesión
async function validationToken() {
    const sessionToken = document.cookie.split('; ').find(row => row.startsWith('session_token='));

    if (sessionToken) {
        try {
            const tokenValue = sessionToken.split('=')[1];
            const payload = JSON.parse(atob(tokenValue.split('.')[1]));

            // Validar expiración del token
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < currentTime) {
                // Eliminar token expirado
                document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; HttpOnly; SameSite=Strict";
                $('.no_login').show();
                $('.usuario_logeado').hide();
                isTokenValid = false; // Token inválido
                return false;
            }

            // Mostrar nombre de usuario y ocultar botones de login
            $('#username_display').text(payload.username);
            $('.no_login').hide();
            $('.usuario_logeado').show();

            // Mostrar/Ocultar secciones relevantes
            $('#catalogo-section, #column-explications-catalogo, #sort-options, #footer').show();
            $('#noticias-section, #calculador-section, #sorteos-section, #master-trades-section, #column-explications-master-trades, #habbo-generator-section, #text-generator-section, #comunidad_salas, #equipo-section, #marketplace-section, #login-section, #register-section').hide();

            // Extraer los IDs de permisos
            const userPermissions = (payload.permissions || []).map(p => p.permission_id);

            // Mostrar solo opciones permitidas
            $('.dropdown-item[data-permission]').each(function () {
                const requiredPermission = parseInt($(this).data('permission'));
                if (userPermissions.includes(requiredPermission)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });

            isTokenValid = true; // Token válido
            return true;
        } catch (error) {
            console.error('Error al procesar el token:', error);
            isTokenValid = false; // Token inválido o corrupto
            return false;
        }
    } else {
        $('.no_login').show();
        $('.usuario_logeado').hide();
        isTokenValid = false; // No hay token
        return false;
    }
}



// Funciones de alerta
function mostrarAlertaError(mensaje) {
    Swal.fire({
        title: mensaje,
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

window.agregarBotonesEdicion = async function() {
    if (isTokenValid) {
        $('.text-price.credits').each(function () {
            const productoDiv = $(this).closest('.product-item');
            const productId = productoDiv.find('.product-link').data('id');

            // Determina el contenedor padre para el idioma
            const isSpain = $(this).closest('.prices_spain').length > 0;
            const isUsa = $(this).closest('.prices_usa').length > 0;
            let lang = '';

            if (isSpain) {
                lang = 'es';
            } else if (isUsa) {
                lang = 'us';
            }

            // Evitar duplicados
            if ($(this).find('.edit-button').length === 0 && lang) {
                // Crear botón de edición con el idioma correcto
                const editButton = $(`
                    <button class="btn btn-sm btn-outline-primary edit-button ml-2" 
                            data-id="${productId}" data-lang="${lang}" title="Editar precio (${lang.toUpperCase()})">
                        <i class="fas fa-edit"></i>
                    </button>
                `);

                // Inserta el botón en el contenedor adecuado
                $(this).append(editButton);
            }
        });

        // Acción para los botones
        $(document).on('click', '.edit-button', async function () {
            const productId = $(this).data('id');
            const lang = $(this).data('lang');
        
            // Mostrar SweetAlert para capturar el precio
            const { value: price } = await Swal.fire({
                title: `Editar precio (${lang.toUpperCase()})`,
                input: 'number',
                inputAttributes: {
                    autocapitalize: 'off',
                    min: 0,
                    step: 0.01
                },
                showCancelButton: true,
                confirmButtonText: 'Actualizar',
                cancelButtonText: 'Cancelar',
                showLoaderOnConfirm: true,
                preConfirm: (price) => {
                    if (!price || price <= 0) {
                        Swal.showValidationMessage('El precio debe ser un número mayor a 0');
                        return false;
                    }
                    return price;
                },
                allowOutsideClick: () => !Swal.isLoading()
            });
        
            if (price) {
                // Enviar datos al backend de Nexus
                try {
                    const response = await fetch('/update-catalog', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            product_id: productId,
                            lang: lang,
                            price: price
                        })
                    });
        
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Error al actualizar el precio');
                    }
        
                    const responseData = await response.json();

                    // Actualizar visualmente el precio
                    const priceSelector = lang === 'es' ? '.text-price.credits.spain' : '.text-price.credits.usa';
                    const priceElement = $(`.product-item .product-link[data-id="${productId}"]`).closest('.product-item').find(priceSelector);

                    if (priceElement.length) {
                        priceElement.html(`
                            <img src="furnis/dinero/credito.png" alt="credito" class="price-icon-principal" 
                                data-toggle="tooltip" data-i18n="[title]titulo_creditos" title="Precio en Créditos">${price}
                            <button class="btn btn-sm btn-outline-primary edit-button ml-2" 
                                data-id="${productId}" data-lang="${lang}" title="Editar precio (${lang.toUpperCase()})">
                                <i class="fas fa-edit"></i>
                            </button>
                        `);
                    }

                    Swal.fire({
                        title: 'Precio actualizado',
                        text: responseData.message || 'El precio se actualizó correctamente',
                        icon: 'success'
                    });
                } catch (error) {
                    Swal.fire({
                        title: 'Error',
                        text: error.message,
                        icon: 'error'
                    });
                }
            }
        });        
    }
}
