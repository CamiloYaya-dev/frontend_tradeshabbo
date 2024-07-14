    let isRepeating = false;
    let songs = [];

    // Inicializar el reproductor de audio con MediaElement.js
    const player = new MediaElementPlayer('audio-player', {
        features: ['playpause', 'current', 'progress', 'duration', 'volume'],
    });

    // Manejar el botón de repetir
    $('#repeat-button').on('click', function() {
        isRepeating = !isRepeating;
        $(this).toggleClass('btn-primary btn-danger');
        $(this).text(isRepeating ? 'No Repetir' : 'Repetir');
    });

    // Repetir la pista si isRepeating es true
    $('#audio-player').on('ended', function() {
        if (isRepeating) {
            this.play();
        } else {
            playRandomSong();
        }
    });

    // Cargar canciones desde el servidor
    $.getJSON('/get-songs', function(data) {
        songs = data;
        const trackList = $('#track-list');
        const audioPlayer = $('#audio-player')[0];

        songs.forEach(song => {
            trackList.append(new Option(song.name, song.path));
        });

        // Cambiar la pista cuando se selecciona una nueva canción
        trackList.on('change', function() {
            const selectedSong = $(this).val();
            audioPlayer.setSrc(selectedSong);
            audioPlayer.load();
            audioPlayer.play();
        });

        // Reproducir la primera canción por defecto
        if (songs.length > 0) {
            audioPlayer.setSrc(songs[0].path);
            audioPlayer.load();
            audioPlayer.play();
        }
    });

    // Manejar el botón de canción aleatoria
    $('#shuffle-button').on('click', function() {
        playRandomSong();
    });

    function playRandomSong() {
        if (songs.length > 0) {
            const randomIndex = Math.floor(Math.random() * songs.length);
            const selectedSong = songs[randomIndex].path;
            const audioPlayer = $('#audio-player')[0];
            audioPlayer.setSrc(selectedSong);
            audioPlayer.load();
            audioPlayer.play();

            // Actualizar el select para reflejar la canción que está sonando
            $('#track-list').val(selectedSong);
        }
    }