// app.js - Lógica principal de la aplicación

document.addEventListener('DOMContentLoaded', () => {
    // Verificar la página actual para cargar la funcionalidad adecuada
    const currentPage = window.location.pathname;

    // Página de inicio
    if (currentPage.includes('index.html') || currentPage === '/' || currentPage === '') {
        loadHomePage();
    }

    // Página de búsqueda
    if (currentPage.includes('search.html')) {
        setupSearchPage();
    }

    // Página de detalles de artista
    if (currentPage.includes('artist.html')) {
        loadArtistPage();
    }

    // Página de detalles de álbum
    if (currentPage.includes('album.html')) {
        loadAlbumPage();
    }

    // Página de favoritos
    if (currentPage.includes('favorites.html')) {
        loadFavoritesPage();
    }
});

// Cargar contenido de la página de inicio
async function loadHomePage() {
    try {
        // Cargar artistas populares
        const popularArtistsContainer = document.getElementById('popular-artists');

        if (popularArtistsContainer) {
            // Intentar obtener datos del caché primero
            const cachedData = await getCachedData('popularArtists');

            if (cachedData) {
                ui.showPopularArtists(cachedData);
            } else {
                // Si no hay caché, obtener datos de la API
                const result = await spotifyAPI.getPopularArtists();
                const artists = result.artists.items;

                // Mostrar artistas
                ui.showPopularArtists(artists);

                // Guardar en caché
                cacheData('popularArtists', artists);
            }
        }
    } catch (error) {
        console.error('Error al cargar la página de inicio:', error);
        ui.showMessage('Error al cargar los artistas populares. Intenta de nuevo más tarde.', 'error');
    }
}

// Configurar la página de búsqueda
function setupSearchPage() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const resultsContainer = document.querySelector('.results-container');

    if (searchForm && searchInput) {
        // Escuchar envío del formulario
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const query = searchInput.value.trim();

            if (query === '') {
                ui.showMessage('Por favor, ingresa un término de búsqueda', 'error');
                return;
            }

            try {
                // Mostrar indicador de carga
                searchResults.innerHTML = `
                    <div class="container">
                        <div class="loading">
                            <i class="fas fa-spinner fa-spin"></i>
                            Buscando "${query}"...
                        </div>
                    </div>
                `;

                // Ocultar resultados anteriores si los hay
                resultsContainer.style.display = 'none';

                // Intentar obtener datos del caché primero
                const cacheKey = `search_${query}`;
                const cachedData = await getCachedData(cacheKey);

                if (cachedData) {
                    searchResults.innerHTML = '';
                    ui.showSearchResults(cachedData);
                } else {
                    // Si no hay caché, obtener datos de la API
                    const results = await spotifyAPI.search(query);

                    // Mostrar resultados
                    searchResults.innerHTML = '';
                    ui.showSearchResults(results);

                    // Guardar en caché
                    cacheData(cacheKey, results);
                }
            } catch (error) {
                console.error('Error al buscar:', error);
                searchResults.innerHTML = `
                    <div class="container">
                        <div class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            Error al realizar la búsqueda. Intenta de nuevo más tarde.
                        </div>
                    </div>
                `;
                ui.showMessage('Error al realizar la búsqueda. Intenta de nuevo más tarde.', 'error');
            }
        });

        // Si hay un parámetro de búsqueda en la URL, realizar búsqueda automáticamente
        const urlParams = new URLSearchParams(window.location.search);
        const queryParam = urlParams.get('q');

        if (queryParam) {
            searchInput.value = queryParam;
            searchForm.dispatchEvent(new Event('submit'));
        }
    }
}

// Cargar contenido de la página de artista
async function loadArtistPage() {
    // Obtener ID del artista de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get('id');

    if (!artistId) {
        ui.showMessage('ID de artista no proporcionado', 'error');
        return;
    }

    try {
        // Mostrar indicadores de carga
        document.getElementById('artist-detail').innerHTML = ui.loader;

        // Intentar obtener datos del caché primero
        const cachedArtist = await getCachedData(`artist_${artistId}`);
        const cachedTopTracks = await getCachedData(`artist_${artistId}_top_tracks`);
        const cachedAlbums = await getCachedData(`artist_${artistId}_albums`);

        let artist, topTracks, albums;

        // Obtener datos del artista
        if (cachedArtist) {
            artist = cachedArtist;
        } else {
            artist = await spotifyAPI.getArtist(artistId);
            cacheData(`artist_${artistId}`, artist);
        }

        // Obtener canciones top
        if (cachedTopTracks) {
            topTracks = cachedTopTracks;
        } else {
            topTracks = await spotifyAPI.getArtistTopTracks(artistId);
            cacheData(`artist_${artistId}_top_tracks`, topTracks);
        }

        // Obtener álbumes
        if (cachedAlbums) {
            albums = cachedAlbums;
        } else {
            albums = await spotifyAPI.getArtistAlbums(artistId);
            cacheData(`artist_${artistId}_albums`, albums);
        }

        // Mostrar detalles del artista
        ui.showArtistDetail(artist, topTracks, albums);
    } catch (error) {
        console.error('Error al cargar la página de artista:', error);
        ui.showMessage('Error al cargar los detalles del artista. Intenta de nuevo más tarde.', 'error');
    }
}

// Cargar contenido de la página de álbum
async function loadAlbumPage() {
    // Obtener ID del álbum de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');

    if (!albumId) {
        ui.showMessage('ID de álbum no proporcionado', 'error');
        return;
    }

    try {
        // Mostrar indicador de carga
        document.getElementById('album-detail').innerHTML = ui.loader;

        // Intentar obtener datos del caché primero
        const cachedAlbum = await getCachedData(`album_${albumId}`);

        let album;

        if (cachedAlbum) {
            album = cachedAlbum;
        } else {
            album = await spotifyAPI.getAlbum(albumId);
            cacheData(`album_${albumId}`, album);
        }

        // Mostrar detalles del álbum
        ui.showAlbumDetail(album);
    } catch (error) {
        console.error('Error al cargar la página de álbum:', error);
        ui.showMessage('Error al cargar los detalles del álbum. Intenta de nuevo más tarde.', 'error');
    }
}

// Cargar contenido de la página de favoritos
function loadFavoritesPage() {
    // Mostrar favoritos almacenados localmente
    ui.showFavorites();
}

// Función para obtener datos de caché (usando IndexedDB a través del Service Worker)
async function getCachedData(key) {
    // Si estamos offline, intentamos obtener datos del caché local
    if (!navigator.onLine) {
        // Verificar si tenemos una copia en localStorage como respaldo
        const localData = localStorage.getItem(`cache_${key}`);
        if (localData) {
            return JSON.parse(localData);
        }
        return null;
    }

    try {
        // Intentar obtener datos de la caché a través del Service Worker
        const cache = await caches.open('spotify-data');
        const response = await cache.match(`data:${key}`);

        if (response) {
            return await response.json();
        }

        return null;
    } catch (error) {
        console.error('Error al obtener datos de caché:', error);
        return null;
    }
}

// Función para almacenar datos en caché
async function cacheData(key, data) {
    try {
        // Guardar en caché a través del Service Worker
        const cache = await caches.open('spotify-data');
        const jsonResponse = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });

        await cache.put(`data:${key}`, jsonResponse);

        // También guardamos una copia en localStorage como respaldo
        localStorage.setItem(`cache_${key}`, JSON.stringify(data));
    } catch (error) {
        console.error('Error al almacenar datos en caché:', error);
    }
}