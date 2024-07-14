function loadMasterTrades(){
    $('main.container').addClass('master-trades-bg');
    $('header').removeClass('header-page');
    $('header').addClass('header-page-master-trades');
    $('li').removeClass('navbar_item');
    $('li').addClass('navbar_item_master_trades');
    $('a.habbo_text_blue').addClass('online_habbo_text_white_fz_15');
    $('.music-player-container').addClass('music-player-container-master-trades');
    $('#track-list').addClass('track-list-master-trades');
    $('.select_lenguage').addClass('select_lenguage_master_trades');
    $('.online_users_content').addClass('online_users_content_master_trades');
}

function loadOtherClass(){
    $('main.container').removeClass('master-trades-bg');
    $('header').removeClass('header-page-master-trades');
    $('header').addClass('header-page');
    $('li').removeClass('navbar_item_master_trades');
    $('li').addClass('navbar_item');
    $('a.habbo_text_blue').removeClass('online_habbo_text_white_fz_15');
    $('.music-player-container').removeClass('music-player-container-master-trades');
    $('#track-list').removeClass('track-list-master-trades');
    $('.select_lenguage').removeClass('select_lenguage_master_trades');
    $('.online_users_content').removeClass('online_users_content_master_trades');
}