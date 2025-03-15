$(document).ready(function () {
    if (!localStorage.getItem('priceGuidelineModalSeen')) {
        $('body').append(`
            <div class="modal" id="priceGuidelineModal" tabindex="-1" role="dialog" aria-labelledby="priceGuidelineModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal_olimpiadas" role="document">
                    <div class="modal-content online_users_content">
                        <div class="modal-header">
                            <h5 class="modal-title habbo_text_blue" id="priceGuidelineModalLabel">Un Nuevo evento se aproxima</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body text-center">
                            <blockquote class="twitter-tweet">
                                <p lang="es" dir="ltr">
                                    Atención Comunidad de .ES<br><br>🚀 ¡Se viene Kingdom’s Lab! 🏆✨<br>El evento con la mayor premiación en juego 🎉<br><br>📅 22 de marzo<br>⏰ 17H<br><br>🔎 ¿Estás preparado? Pronto más información… 🔥<br><br>Nuestra web: <a href="https://t.co/7VAzVTKrGY">https://t.co/7VAzVTKrGY</a><br>Nuestro servidor de Discord: <a href="https://t.co/CL2D9aZrZF">https://t.co/CL2D9aZrZF</a>… <a href="https://t.co/4uht81WXPe">pic.twitter.com/4uht81WXPe</a>
                                </p>&mdash; Origins Kingdom (@OriginsKingdom) <a href="https://twitter.com/OriginsKingdom/status/1901048068658905359?ref_src=twsrc%5Etfw">March 15, 2025</a>
                            </blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" data-dismiss="modal">Aceptar</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Mostrar el modal
        $('#priceGuidelineModal').modal('show');

        // Guardar en localStorage cuando el modal se cierre
        $('#priceGuidelineModal').on('hidden.bs.modal', function () {
            localStorage.setItem('priceGuidelineModalSeen', 'true');
        });
    }
});
