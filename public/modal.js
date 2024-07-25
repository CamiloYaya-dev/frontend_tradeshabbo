$('body').append(`
    <div class="modal" id="priceGuidelineModal" tabindex="-1" role="dialog" aria-labelledby="priceGuidelineModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal_olimpiadas" role="document">
            <div class="modal-content online_users_content">
                <div class="modal-header">
                    <h5 class="modal-title habbo_text_blue" id="priceGuidelineModalLabel">Aviso Importante</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body text-center">
                    <p class="online_habbo_text_white_fz_15">
                        Gran Evento en Habbo Origins, más información en el servidor de Discord 
                        <strong class="alerta_lloron">
                            <a href="https://discord.com/channels/1257448055050080297/1258417994543927338/1265701053341503540" target="_blank">DANDO CLICK AQUÍ</a>
                        </strong>
                    </p>
                    <img id="noticiaModalImage" src="./olimpiadas_habbo.png" alt="Evento Habbo Origins" class="img-fluid mb-3 olimpiadas_imagen">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-dismiss="modal">Aceptar</button>
                </div>
            </div>
        </div>
    </div>
`);
$('#priceGuidelineModal').modal('show');
