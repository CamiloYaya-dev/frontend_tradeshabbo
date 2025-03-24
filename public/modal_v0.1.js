$(document).ready(function () {
    const today = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    const lastSeen = localStorage.getItem('infoModalLastSeen');

    if (lastSeen !== today) {
        $('body').append(`
            <div class="modal" id="priceGuidelineModal" tabindex="-1" role="dialog" aria-labelledby="priceGuidelineModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal_olimpiadas" role="document">
                    <div class="modal-content online_users_content">
                        <div class="modal-header">
                            <h5 class="modal-title habbo_text_blue" id="priceGuidelineModalLabel">Actualización en TradesHabbo</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Cerrar">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body text-left">
                            <p>Buenos días, quería contarles que estaré 100% activo con la fansite y acabo de subir el primer refactor importante. Ahora TradesHabbo se sentirá más como una fansite y menos como un simple catálogo de precios.</p>
                            <p>Es posible que algunos estilos se hayan roto, tanto en web como en mobile. Les pido disculpas por ello y les aseguro que serán corregidos con la mayor brevedad posible.</p>
                            <p>Próximamente se añadirán nuevas funcionalidades como:</p>
                            <ul>
                                <li>Premios disponibles en Origins</li>
                                <li>Alertas cuando un precio de tu interés cambie</li>
                                <li>Calcular tu inventario automáticamente con base en nuestro catálogo</li>
                                <li>Explorar la viabilidad de subastas tipo eBay automáticas</li>
                                <li>Refactor visual por vista para adaptar todo a Habbo Origins</li>
                            </ul>
                            <p>Este mensaje es un pequeño spoiler de lo que viene. Les pido un poco de paciencia si encuentran estilos rotos o datos incorrectos. Si notan algo raro, por favor repórtenmelo. ¡Gracias por el apoyo! ❤️</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" data-dismiss="modal">Entendido</button>
                        </div>
                    </div>
                </div>
            </div>
        `);        

        // Mostrar el modal
        $('#priceGuidelineModal').modal('show');

        // Guardar la fecha actual al cerrar
        $('#priceGuidelineModal').on('hidden.bs.modal', function () {
            localStorage.setItem('infoModalLastSeen', today);
        });
    }
});
