$(document).ready(function () {
    const today = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    const lastSeen = localStorage.getItem('infoModalLastSeen');

    //if (lastSeen !== today) {
        $('body').append(`
            <div class="modal" id="priceGuidelineModal" tabindex="-1" role="dialog" aria-labelledby="priceGuidelineModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal_olimpiadas" role="document">
                    <div class="modal-content online_users_content">
                        <div class="modal-header">
                            <h5 class="modal-title habbo_text_blue" id="priceGuidelineModalLabel">Despedida de TradesHabbo</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Cerrar">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body text-left">
                            <p>Quiero agradecer profundamente a todos los que confiaron en mí y dedicaron parte de su tiempo a acompañar este proyecto llamado TradesHabbo (OriginsKingdom). Desde el primer día estuve presente con toda la intención de seguir hasta el final, pero lamentablemente eso ya no será posible.</p>

                            <p>Las decisiones actuales de la administración de Habbo Origins, sumadas a las constantes faltas de respeto en concursos, eventos y competiciones, han generado un ambiente completamente hostil e insostenible para seguir aportando con el mismo entusiasmo de siempre.</p>

                            <p>La comunidad de .ES y .BR ha sido completamente ignorada, mientras solo se da voz y relevancia a la comunidad de .COM. A esto se suma la muerte del sistema de cambio, la moderación excesiva dentro y fuera del hotel, y una cultura absurda donde, a pesar de que el juego es +18, parece diseñado para niños de 2 años en cuanto a libertad de expresión.</p>

                            <p>También está la intensa toxicidad generada por los pocos jugadores que aún quedan, las burlas hacia la comunidad y la total falta de integridad reflejada en situaciones como los "ganadores" de Battle Ball Season 1 (clones tramposos de realmadrid y morrt), entre muchísimas otras cosas que solo generan desgaste.</p>

                            <p>Todo esto hace que, personalmente, ya no tenga sentido dedicar ni un segundo más de esfuerzo o apoyo a Habbo Origins.</p>

                            <p>Gracias de corazón a quienes me acompañaron durante este tiempo. Siempre valoraré la confianza depositada. ❤️</p>

                            <p>Los llevaré a todos en el corazón. Atentamente, Emo. ❤️</p>
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
    //}
});
