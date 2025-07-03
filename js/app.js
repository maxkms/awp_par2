// app.js - Lógica principal de la aplicación con todas las funcionalidades

document.addEventListener('DOMContentLoaded', () => {
    // Verificar la página actual para cargar la funcionalidad adecuada
    const currentPage = window.location.pathname;

    // Inicializar managers globales (se crean automáticamente al cargar los scripts)
    console.log('Inicializando aplicación SpotifyExplorer...');

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

    // Inicializar funcionalidades globales
    initializeGlobalFeatures();
});

// Inicializar funcionalidades globales
function initializeGlobalFeatures() {
    // Los managers se inicializan automáticamente al cargar sus scripts:
    // - window.notificationManager (notifications.js)
    // - window.sharingManager (sharing.js) 
    // - window.networkStatusManager (network-status.js)
    // - window.ratingSystem (rating-system.js)

    // Configurar Service Worker con handlers de notificaciones
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Detectar si es primera visita para mostrar tour
    checkFirstVisit();

    // Configurar atajo de teclado para búsqueda rápida
    setupKeyboardShortcuts();

    // Forzar inicialización del sistema de rating después de un pequeño delay
    setTimeout(() => {
        if (window.ratingSystem) {
            console.log('Sistema de valoraciones iniciado');
            // Forzar la adición de componentes de rating
            window.ratingSystem.addRatingComponents();
        }
    }, 1000);
}

// Manejar mensajes del Service Worker
function handleServiceWorkerMessage(event) {
    const { type, data } = event.data || {};
    
    switch (type) {
        case 'CACHE_UPDATED':
            ui.showMessage('Contenido actualizado disponible', 'info');
            break;
        case 'OFFLINE_READY':
            ui.showMessage('Aplicación lista para uso offline', 'success');
            break;
        default:
            console.log('Mensaje del Service Worker:', event.data);
    }
}

// Verificar si es primera visita
function checkFirstVisit() {
    const hasVisited = localStorage.getItem('hasVisitedSpotifyExplorer');
    
    if (!hasVisited) {
        localStorage.setItem('hasVisitedSpotifyExplorer', 'true');
        
        // Mostrar mensaje de bienvenida después de 2 segundos
        setTimeout(() => {
            showWelcomeMessage();
        }, 2000);
    }
}

// Mostrar mensaje de bienvenida
function showWelcomeMessage() {
    if (window.notificationManager && window.notificationManager.permission !== 'granted') {
        ui.showMessage('¡Bienvenido a SpotifyExplorer! Explora música y guarda tus favoritos.', 'info');
    }
}

// Configurar atajos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K para búsqueda rápida
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            
            // Si no estamos en la página de búsqueda, ir allí
            if (!window.location.pathname.includes('search.html')) {
                window.location.href = '/search.html';
            } else {
                // Si ya estamos en búsqueda, enfocar el input
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        }

        // Escape para cerrar modales
        if (e.key === 'Escape') {
            // Cerrar modales abiertos
            const modals = document.querySelectorAll('.notification-modal.show, .share-modal.show, .comments-modal.show');
            modals.forEach(modal => {
                const closeBtn = modal.querySelector('.modal-close, .notification-modal-close, .share-modal-close, .comments-modal-close');
                if (closeBtn) {
                    closeBtn.click();
                }
            });
        }
    });
}

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

            // Configurar navegación de artistas
            setupArtistsNavigation();
        }
    } catch (error) {
        console.error('Error al cargar la página de inicio:', error);
        
        // Si hay error y estamos offline, mostrar mensaje específico
        if (!navigator.onLine) {
            ui.showMessage('Sin conexión. Algunas funciones pueden no estar disponibles.', 'warning');
        } else {
            ui.showMessage('Error al cargar los artistas populares. Intenta de nuevo más tarde.', 'error');
        }
    }
}

// Configurar navegación de artistas en la página principal
function setupArtistsNavigation() {
    let currentPage = 0;
    const genres = ['pop', 'rock', 'electronic', 'jazz', 'hip-hop', 'latin'];

    // Botones de navegación
    const prevBtn = document.getElementById('prev-artists');
    const nextBtn = document.getElementById('next-artists');
    const refreshBtn = document.getElementById('refresh-artists');

    if (prevBtn && nextBtn && refreshBtn) {
        prevBtn.addEventListener('click', () => {
            currentPage = (currentPage - 1 + genres.length) % genres.length;
            loadArtistsByGenre(genres[currentPage]);
        });

        nextBtn.addEventListener('click', () => {
            currentPage = (currentPage + 1) % genres.length;
            loadArtistsByGenre(genres[currentPage]);
        });

        refreshBtn.addEventListener('click', () => {
            loadArtistsByGenre(genres[currentPage]);
        });

        // Función para cargar artistas por género
        async function loadArtistsByGenre(genre) {
            const container = document.getElementById('popular-artists');
            if (!container) return;

            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando artistas populares...</div>';

            try {
                // Verificar conexión antes de hacer solicitud
                if (!navigator.onLine) {
                    throw new Error('Sin conexión a Internet');
                }

                const result = await spotifyAPI.getPopularArtists(genre);
                ui.showPopularArtists(result.artists.items);
                
                // Cachear los nuevos datos
                cacheData(`popularArtists_${genre}`, result.artists.items);

                // Forzar actualización de componentes de rating después de cargar contenido
                setTimeout(() => {
                    if (window.ratingSystem) {
                        window.ratingSystem.addRatingComponents();
                    }
                }, 500);
            } catch (error) {
                console.error('Error al cargar artistas:', error);
                
                // Intentar cargar desde caché si hay error
                const cachedData = await getCachedData(`popularArtists_${genre}`);
                if (cachedData) {
                    ui.showPopularArtists(cachedData);
                    ui.showMessage('Mostrando contenido guardado (sin conexión)', 'warning');
                } else {
                    container.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i><p>Error al cargar artistas. Intenta de nuevo.</p></div>';
                    ui.showMessage('Error al cargar los artistas. Intenta de nuevo.', 'error');
                }
            }
        }
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
            await performSearch();
        });

        // Búsqueda en tiempo real (con debounce)
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = searchInput.value.trim();
            
            if (query.length >= 3) {
                searchTimeout = setTimeout(() => {
                    performSearch(true); // true para búsqueda silenciosa
                }, 1000);
            }
        });

        // Función principal de búsqueda
        async function performSearch(silent = false) {
            const query = searchInput.value.trim();

            if (query === '') {
                ui.showMessage('Por favor, ingresa un término de búsqueda', 'error');
                return;
            }

            // Verificar estado de conexión
            if (!navigator.onLine) {
                searchResults.innerHTML = `
                    <div class="container">
                        <div class="offline-message">
                            <i class="fas fa-wifi-slash"></i>
                            <h3>Sin conexión a Internet</h3>
                            <p>No puedes realizar búsquedas sin conexión.</p>
                            <a href="favorites.html" class="btn">Ver favoritos guardados</a>
                        </div>
                    </div>
                `;
                return;
            }

            try {
                // Mostrar indicador de carga solo si no es búsqueda silenciosa
                if (!silent) {
                    searchResults.innerHTML = `
                        <div class="container">
                            <div class="loading">
                                <i class="fas fa-spinner fa-spin"></i>
                                Buscando "${query}"...
                            </div>
                        </div>
                    `;

                    // Ocultar resultados anteriores
                    if (resultsContainer) {
                        resultsContainer.style.display = 'none';
                    }
                }

                // Intentar obtener datos del caché primero
                const cacheKey = `search_${query}`;
                const cachedData = await getCachedData(cacheKey);

                if (cachedData && !silent) {
                    searchResults.innerHTML = '';
                    ui.showSearchResults(cachedData);
                    
                    // Forzar actualización de componentes de rating
                    setTimeout(() => {
                        if (window.ratingSystem) {
                            window.ratingSystem.addRatingComponents();
                        }
                    }, 500);
                } else {
                    // Obtener datos de la API
                    const results = await spotifyAPI.search(query);

                    // Mostrar resultados
                    searchResults.innerHTML = '';
                    ui.showSearchResults(results);

                    // Guardar en caché
                    cacheData(cacheKey, results);

                    // Actualizar URL sin recargar la página
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('q', query);
                    window.history.replaceState({}, '', newUrl);

                    // Forzar actualización de componentes de rating
                    setTimeout(() => {
                        if (window.ratingSystem) {
                            window.ratingSystem.addRatingComponents();
                        }
                    }, 500);
                }
            } catch (error) {
                console.error('Error al buscar:', error);
                
                if (!silent) {
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
            }
        }

        // Si hay un parámetro de búsqueda en la URL, realizar búsqueda automáticamente
        const urlParams = new URLSearchParams(window.location.search);
        const queryParam = urlParams.get('q');

        if (queryParam) {
            searchInput.value = queryParam;
            performSearch();
        }

        // Focus automático en el input de búsqueda
        setTimeout(() => {
            searchInput.focus();
        }, 100);
    }
}

// Cargar contenido de la página de artista
async function loadArtistPage() {
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
        if (cachedArtist && navigator.onLine) {
            artist = cachedArtist;
        } else if (navigator.onLine) {
            artist = await spotifyAPI.getArtist(artistId);
            cacheData(`artist_${artistId}`, artist);
        } else if (cachedArtist) {
            artist = cachedArtist;
            ui.showMessage('Mostrando información guardada (sin conexión)', 'warning');
        } else {
            throw new Error('Sin conexión y sin datos guardados');
        }

        // Obtener canciones top
        if (cachedTopTracks && navigator.onLine) {
            topTracks = cachedTopTracks;
        } else if (navigator.onLine) {
            topTracks = await spotifyAPI.getArtistTopTracks(artistId);
            cacheData(`artist_${artistId}_top_tracks`, topTracks);
        } else if (cachedTopTracks) {
            topTracks = cachedTopTracks;
        } else {
            topTracks = { tracks: [] };
        }

        // Obtener álbumes
        if (cachedAlbums && navigator.onLine) {
            albums = cachedAlbums;
        } else if (navigator.onLine) {
            albums = await spotifyAPI.getArtistAlbums(artistId);
            cacheData(`artist_${artistId}_albums`, albums);
        } else if (cachedAlbums) {
            albums = cachedAlbums;
        } else {
            albums = { items: [] };
        }

        // Mostrar detalles del artista
        ui.showArtistDetail(artist, topTracks, albums);

        // Actualizar título de la página
        document.title = `${artist.name} - SpotifyExplorer`;

        // Forzar actualización de componentes de rating
        setTimeout(() => {
            if (window.ratingSystem) {
                window.ratingSystem.addRatingComponents();
            }
        }, 500);
    } catch (error) {
        console.error('Error al cargar la página de artista:', error);
        
        document.getElementById('artist-detail').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar los detalles del artista.</p>
                <button onclick="window.location.reload()" class="btn btn-sm">Intentar de nuevo</button>
            </div>
        `;
        
        ui.showMessage('Error al cargar los detalles del artista. Intenta de nuevo más tarde.', 'error');
    }
}

// Cargar contenido de la página de álbum
async function loadAlbumPage() {
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

        if (cachedAlbum && navigator.onLine) {
            album = cachedAlbum;
        } else if (navigator.onLine) {
            album = await spotifyAPI.getAlbum(albumId);
            cacheData(`album_${albumId}`, album);
        } else if (cachedAlbum) {
            album = cachedAlbum;
            ui.showMessage('Mostrando información guardada (sin conexión)', 'warning');
        } else {
            throw new Error('Sin conexión y sin datos guardados');
        }

        // Guardar referencia del álbum actual
        if (window.spotifyAPI) {
            window.spotifyAPI.currentAlbum = album;
        }

        // Mostrar detalles del álbum
        ui.showAlbumDetail(album);

        // Actualizar título de la página
        document.title = `${album.name} - SpotifyExplorer`;

        // Forzar actualización de componentes de rating
        setTimeout(() => {
            if (window.ratingSystem) {
                window.ratingSystem.addRatingComponents();
            }
        }, 500);
    } catch (error) {
        console.error('Error al cargar la página de álbum:', error);
        
        document.getElementById('album-detail').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar los detalles del álbum.</p>
                <button onclick="window.location.reload()" class="btn btn-sm">Intentar de nuevo</button>
            </div>
        `;
        
        ui.showMessage('Error al cargar los detalles del álbum. Intenta de nuevo más tarde.', 'error');
    }
}

// Cargar contenido de la página de favoritos
function loadFavoritesPage() {
    // Los favoritos siempre están disponibles offline
    ui.showFavorites();
    
    // Actualizar título de la página
    document.title = 'Favoritos - SpotifyExplorer';

    // Forzar actualización de componentes de rating
    setTimeout(() => {
        if (window.ratingSystem) {
            window.ratingSystem.addRatingComponents();
        }
    }, 500);
}

// Función para obtener datos de caché (mejorada)
async function getCachedData(key) {
    try {
        // Si estamos offline, intentamos obtener datos del caché local primero
        if (!navigator.onLine) {
            const localData = localStorage.getItem(`cache_${key}`);
            if (localData) {
                return JSON.parse(localData);
            }
        }

        // Intentar obtener datos de la caché del Service Worker
        if ('caches' in window) {
            const cache = await caches.open('spotify-data');
            const response = await cache.match(`data:${key}`);

            if (response) {
                return await response.json();
            }
        }

        // Fallback a localStorage
        const localData = localStorage.getItem(`cache_${key}`);
        if (localData) {
            return JSON.parse(localData);
        }

        return null;
    } catch (error) {
        console.error('Error al obtener datos de caché:', error);
        return null;
    }
}

// Función para almacenar datos en caché (mejorada)
async function cacheData(key, data) {
    try {
        // Guardar en caché del Service Worker
        if ('caches' in window) {
            const cache = await caches.open('spotify-data');
            const jsonResponse = new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
            });
            await cache.put(`data:${key}`, jsonResponse);
        }

        // También guardamos una copia en localStorage como respaldo
        localStorage.setItem(`cache_${key}`, JSON.stringify(data));
        
        console.log('Datos cacheados exitosamente:', key);
    } catch (error) {
        console.error('Error al almacenar datos en caché:', error);
        
        // Fallback: solo usar localStorage
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify(data));
        } catch (localError) {
            console.error('Error también en localStorage:', localError);
        }
    }
}

// Función para limpiar caché antigua (utilidad de mantenimiento)
function clearOldCache() {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // Una semana en milisegundos

    // Limpiar localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
            try {
                const data = localStorage.getItem(key);
                const parsed = JSON.parse(data);
                
                // Si los datos tienen timestamp y son antiguos, eliminarlos
                if (parsed && parsed.timestamp && (now - parsed.timestamp > oneWeek)) {
                    localStorage.removeItem(key);
                    console.log('Caché antigua eliminada:', key);
                }
            } catch (error) {
                // Si no se puede parsear, eliminar
                localStorage.removeItem(key);
            }
        }
    }
}

// Ejecutar limpieza de caché antigua al cargar la aplicación
setTimeout(clearOldCache, 5000);

// Función para reportar errores (telemetría básica)
function reportError(error, context = '') {
    console.error(`Error en ${context}:`, error);
    
    // En un entorno de producción, aquí podrías enviar errores a un servicio de monitoreo
    // como Sentry, LogRocket, etc.
    
    // Por ahora, solo logueamos localmente
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.message || error.toString(),
        context,
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    // Guardar logs de errores localmente (máximo 50)
    const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    errorLogs.unshift(errorLog);
    
    if (errorLogs.length > 50) {
        errorLogs.splice(50);
    }
    
    localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
}

// Manejar errores globales
window.addEventListener('error', (event) => {
    reportError(event.error, 'Global Error');
});

window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, 'Unhandled Promise Rejection');
});

// Función para mostrar estadísticas de uso (para debug)
function showUsageStats() {
    const favorites = JSON.parse(localStorage.getItem('spotifyFavorites') || '{"artists":[],"tracks":[],"albums":[]}');
    const ratings = JSON.parse(localStorage.getItem('spotifyRatings') || '{}');
    const comments = JSON.parse(localStorage.getItem('spotifyComments') || '{}');
    
    const stats = {
        favorites: {
            artists: favorites.artists.length,
            tracks: favorites.tracks.length,
            albums: favorites.albums.length,
            total: favorites.artists.length + favorites.tracks.length + favorites.albums.length
        },
        ratings: Object.keys(ratings).length,
        comments: Object.keys(comments).reduce((total, key) => total + comments[key].length, 0),
        cacheItems: Object.keys(localStorage).filter(key => key.startsWith('cache_')).length
    };
    
    console.table(stats);
    return stats;
}

// Exponer funciones útiles para debug
window.spotifyExplorerDebug = {
    showUsageStats,
    clearOldCache,
    getCachedData,
    cacheData,
    reportError
};