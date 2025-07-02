// Navegación por artistas
document.addEventListener("DOMContentLoaded", () => {
    let currentPage = 0;
    const genres = [
        "pop",
        "rock",
        "electronic",
        "jazz",
        "hip-hop",
        "latin",
    ];

    // Botón para el siguiente género
    document
        .getElementById("next-artists")
        .addEventListener("click", () => {
            currentPage = (currentPage + 1) % genres.length;
            loadArtistsByGenre(genres[currentPage]);
        });

    // Botón para el género anterior
    document
        .getElementById("prev-artists")
        .addEventListener("click", () => {
            currentPage = (currentPage - 1 + genres.length) % genres.length;
            loadArtistsByGenre(genres[currentPage]);
        });

    // Botón para refrescar
    document
        .getElementById("refresh-artists")
        .addEventListener("click", () => {
            loadArtistsByGenre(genres[currentPage]);
        });

    // Función para cargar artistas por género
    function loadArtistsByGenre(genre) {
        const container = document.getElementById("popular-artists");
        container.innerHTML =
            '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando artistas populares...</div>';

        spotifyAPI
            .getPopularArtists(genre)
            .then((result) => {
                ui.showPopularArtists(result.artists.items);
            })
            .catch((error) => {
                console.error("Error al cargar artistas:", error);
                ui.showMessage(
                    "Error al cargar los artistas. Intenta de nuevo.",
                    "error"
                );
            });
    }

    // Cargamos artistas de pop al iniciar la página
    loadArtistsByGenre(genres[currentPage]);
});