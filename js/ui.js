// ui.js - Manejo de la interfaz de usuario

class UI {
    constructor() {
        // Elementos comunes
        this.loader = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>`;

        // Inicializar contador de favoritos cuando se cargue el DOM
        document.addEventListener('DOMContentLoaded', () => {
            this.updateFavoritesCounter();
        });
    }

    // Mostrar artistas populares en la página de inicio
    showPopularArtists(artists) {
        const container = document.getElementById('popular-artists');

        if (!container) return;

        // Limpiar el contenedor
        container.innerHTML = '';

        if (artists.length === 0) {
            container.innerHTML = '<p class="no-results">No se encontraron artistas populares</p>';
            return;
        }

        artists.forEach(artist => {
            // Obtener imagen del artista o usar una predeterminada
            const imageUrl = artist.images && artist.images.length > 0
                ? artist.images[0].url
                : 'images/default-artist.png';

            const artistElement = document.createElement('div');
            artistElement.className = 'card';
            artistElement.dataset.id = artist.id;
            artistElement.innerHTML = `
                <img src="${imageUrl}" alt="${artist.name}" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${artist.name}</h3>
                    <p class="card-text">Seguidores: ${this.formatNumber(artist.followers.total)}</p>
                    <div class="card-actions">
                        <a href="artist.html?id=${artist.id}" class="btn btn-sm">Ver detalles</a>
                        <button class="btn-icon btn-favorite" data-id="${artist.id}" data-type="artist">
                            <i class="${this.isInFavorites(artist.id, 'artist') ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(artistElement);
        });

        // Agregar event listeners para botones de favoritos
        this.addFavoriteListeners();
    }

    // ★★★ FUNCIÓN PRINCIPAL - Mostrar detalles de un artista ★★★
    showArtistDetail(artist, topTracks, albums) {
        const artistDetail = document.getElementById('artist-detail');
        const topTracksContainer = document.getElementById('top-tracks');
        const albumsContainer = document.getElementById('artist-albums');

        if (!artistDetail) return;

        // Obtener imagen del artista o usar una predeterminada
        const imageUrl = artist.images && artist.images.length > 0
            ? artist.images[0].url
            : 'images/default-artist.png';

        // Mostrar información del artista CON BOTÓN DE FAVORITOS QUE FUNCIONA
        artistDetail.innerHTML = `
            <div class="detail-header">
                <img src="${imageUrl}" alt="${artist.name}" class="detail-img">
                <div class="detail-info">
                    <h1>${artist.name}</h1>
                    <p>Seguidores: ${this.formatNumber(artist.followers.total)}</p>
                    <p>Popularidad: ${artist.popularity}/100</p>
                    <div class="genre-tags">
                        ${artist.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-favorite-main" data-id="${artist.id}" data-type="artist">
                            <i class="${this.isInFavorites(artist.id, 'artist') ? 'fas' : 'far'} fa-heart"></i> 
                            ${this.isInFavorites(artist.id, 'artist') ? 'En favoritos' : 'Agregar a favoritos'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Mostrar canciones top
        if (topTracksContainer) {
            this.showTopTracks(topTracks.tracks, topTracksContainer);
        }

        // Mostrar álbumes
        if (albumsContainer) {
            this.showArtistAlbums(albums.items, albumsContainer);
        }

        // AGREGAR EVENT LISTENER PARA EL BOTÓN PRINCIPAL DE FAVORITOS
        setTimeout(() => {
            const mainFavBtn = document.querySelector('.btn-favorite-main');
            if (mainFavBtn) {
                mainFavBtn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const type = e.currentTarget.getAttribute('data-type');
                    const icon = e.currentTarget.querySelector('i');

                    if (this.isInFavorites(id, type)) {
                        // Eliminar de favoritos
                        this.removeFavorite(id, type);
                        icon.className = 'far fa-heart';
                        e.currentTarget.innerHTML = '<i class="far fa-heart"></i> Agregar a favoritos';
                    } else {
                        // Agregar a favoritos
                        this.addToFavorites(id, type);
                        icon.className = 'fas fa-heart';
                        e.currentTarget.innerHTML = '<i class="fas fa-heart"></i> En favoritos';
                        
                        // Crear animación de corazón volador
                        this.createFlyingHeart(e.currentTarget);
                    }

                    // Actualizar contador
                    this.updateFavoritesCounter();
                });
            }
        }, 100);

        // Agregar event listeners para otros botones de favoritos
        this.addFavoriteListeners();
    }

    // Mostrar resultados de búsqueda
    showSearchResults(results) {
        const searchResults = document.getElementById('search-results');
        const resultsContainer = document.querySelector('.results-container');

        // Ocultar el mensaje de prompt
        searchResults.innerHTML = '';

        // Mostrar el contenedor de resultados
        resultsContainer.style.display = 'block';

        const artistsContainer = document.getElementById('artists-results');
        const tracksContainer = document.getElementById('tracks-results');
        const albumsContainer = document.getElementById('albums-results');

        if (artistsContainer) {
            this.showArtistResults(results.artists.items, artistsContainer);
        }

        if (tracksContainer) {
            this.showTrackResults(results.tracks.items, tracksContainer);
        }

        if (albumsContainer) {
            this.showAlbumResults(results.albums.items, albumsContainer);
        }
    }

    // Mostrar artistas en los resultados de búsqueda
    showArtistResults(artists, container) {
        container.innerHTML = '';

        if (artists.length === 0) {
            container.innerHTML = '<p class="no-results">No se encontraron artistas</p>';
            return;
        }

        artists.forEach(artist => {
            const imageUrl = artist.images && artist.images.length > 0
                ? artist.images[0].url
                : 'images/default-artist.png';

            const artistElement = document.createElement('div');
            artistElement.className = 'card';
            artistElement.dataset.id = artist.id;
            artistElement.innerHTML = `
                <img src="${imageUrl}" alt="${artist.name}" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${artist.name}</h3>
                    <p class="card-text">Seguidores: ${this.formatNumber(artist.followers.total)}</p>
                    <div class="card-actions">
                        <a href="artist.html?id=${artist.id}" class="btn btn-sm">Ver detalles</a>
                        <button class="btn-icon btn-favorite" data-id="${artist.id}" data-type="artist">
                            <i class="${this.isInFavorites(artist.id, 'artist') ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(artistElement);
        });

        // Agregar event listeners para botones de favoritos
        this.addFavoriteListeners();
    }

    // Mostrar canciones en los resultados de búsqueda
    showTrackResults(tracks, container) {
        container.innerHTML = '';

        if (tracks.length === 0) {
            container.innerHTML = '<p class="no-results">No se encontraron canciones</p>';
            return;
        }

        tracks.forEach((track, index) => {
            const imageUrl = track.album.images && track.album.images.length > 0
                ? track.album.images[0].url
                : 'images/default-track.png';

            const trackElement = document.createElement('div');
            trackElement.className = 'track-item';
            trackElement.dataset.id = track.id;
            trackElement.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <img src="${imageUrl}" alt="${track.name}" class="track-img">
                <div class="track-info">
                    <h3>${track.name}</h3>
                    <p>${track.artists.map(artist => artist.name).join(', ')}</p>
                </div>
                <div class="track-duration">${this.formatDuration(track.duration_ms)}</div>
                <div class="track-actions">
                    <button class="btn-icon btn-favorite" data-id="${track.id}" data-type="track">
                        <i class="${this.isInFavorites(track.id, 'track') ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                ${track.preview_url ? `
                    <audio controls class="track-preview">
                        <source src="${track.preview_url}" type="audio/mpeg">
                        Tu navegador no soporta el elemento de audio.
                    </audio>
                ` : '<div class="no-preview">No hay vista previa disponible</div>'}
            `;

            container.appendChild(trackElement);
        });

        // Agregar event listeners para botones de favoritos
        this.addFavoriteListeners();
    }

    // Mostrar álbumes en los resultados de búsqueda
    showAlbumResults(albums, container) {
        container.innerHTML = '';

        if (albums.length === 0) {
            container.innerHTML = '<p class="no-results">No se encontraron álbumes</p>';
            return;
        }

        albums.forEach(album => {
            const imageUrl = album.images && album.images.length > 0
                ? album.images[0].url
                : 'images/default-album.png';

            const albumElement = document.createElement('div');
            albumElement.className = 'card';
            albumElement.dataset.id = album.id;
            albumElement.innerHTML = `
                <img src="${imageUrl}" alt="${album.name}" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${album.name}</h3>
                    <p class="card-text">${album.artists.map(artist => artist.name).join(', ')}</p>
                    <div class="card-actions">
                        <a href="album.html?id=${album.id}" class="btn btn-sm">Ver detalles</a>
                        <button class="btn-icon btn-favorite" data-id="${album.id}" data-type="album">
                            <i class="${this.isInFavorites(album.id, 'album') ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(albumElement);
        });

        // Agregar event listeners para botones de favoritos
        this.addFavoriteListeners();
    }

    // Mostrar las canciones top de un artista
    showTopTracks(tracks, container) {
        container.innerHTML = '<h2>Canciones Populares</h2>';

        if (tracks.length === 0) {
            container.innerHTML += '<p class="no-results">No se encontraron canciones populares</p>';
            return;
        }

        const tracksList = document.createElement('div');
        tracksList.className = 'tracks-list';

        tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.dataset.id = track.id;
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <img src="${track.album.images[0].url}" alt="${track.name}" class="track-img">
                <div class="track-info">
                    <h3>${track.name}</h3>
                    <p>${track.album.name}</p>
                </div>
                <div class="track-duration">${this.formatDuration(track.duration_ms)}</div>
                <div class="track-actions">
                    <button class="btn-icon btn-favorite" data-id="${track.id}" data-type="track">
                        <i class="${this.isInFavorites(track.id, 'track') ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                ${track.preview_url ? `
                    <audio controls class="track-preview">
                        <source src="${track.preview_url}" type="audio/mpeg">
                        Tu navegador no soporta el elemento de audio.
                    </audio>
                ` : '<div class="no-preview">No hay vista previa disponible</div>'}
            `;

            tracksList.appendChild(trackItem);
        });

        container.appendChild(tracksList);

        // Agregar event listeners para los botones de favoritos
        this.addFavoriteListeners();
    }

    // Mostrar álbumes de un artista
    showArtistAlbums(albums, container) {
        container.innerHTML = '<h2>Álbumes</h2>';

        if (albums.length === 0) {
            container.innerHTML += '<p class="no-results">No se encontraron álbumes</p>';
            return;
        }

        const albumsGrid = document.createElement('div');
        albumsGrid.className = 'card-grid';

        albums.forEach(album => {
            const imageUrl = album.images && album.images.length > 0
                ? album.images[0].url
                : 'images/default-album.png';

            const albumElement = document.createElement('div');
            albumElement.className = 'card';
            albumElement.dataset.id = album.id;
            albumElement.innerHTML = `
                <img src="${imageUrl}" alt="${album.name}" class="card-img">
                <div class="card-content">
                    <h3 class="card-title">${album.name}</h3>
                    <p class="card-text">${album.release_date.split('-')[0]} • ${album.total_tracks} canciones</p>
                    <div class="card-actions">
                        <a href="album.html?id=${album.id}" class="btn btn-sm">Ver detalles</a>
                        <button class="btn-icon btn-favorite" data-id="${album.id}" data-type="album">
                            <i class="${this.isInFavorites(album.id, 'album') ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;

            albumsGrid.appendChild(albumElement);
        });

        container.appendChild(albumsGrid);

        // Agregar event listeners para los botones de favoritos
        this.addFavoriteListeners();
    }

    // Mostrar detalles de un álbum
    showAlbumDetail(album) {
        const albumDetail = document.getElementById('album-detail');
        const tracksContainer = document.getElementById('album-tracks');

        if (!albumDetail) return;

        // Registrar el álbum actual para uso en favoritos
        if (window.spotifyAPI) {
            window.spotifyAPI.currentAlbum = album;
        }

        try {
            // Obtener imagen del álbum o usar una predeterminada
            const imageUrl = album.images && album.images.length > 0
                ? album.images[0].url
                : 'images/default-album.png';

            // Mostrar información del álbum con imagen más pequeña
            albumDetail.innerHTML = `
            <div class="detail-header">
                <img src="${imageUrl}" alt="${album.name}" class="detail-img">
                <div class="detail-info">
                    <h1>${album.name}</h1>
                    <p>${album.artists.map(artist =>
                `<a href="artist.html?id=${artist.id}">${artist.name}</a>`
            ).join(', ')}</p>
                    <p>${album.release_date.split('-')[0]} • ${album.total_tracks} canciones</p>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-favorite-main" data-id="${album.id}" data-type="album">
                            <i class="${this.isInFavorites(album.id, 'album') ? 'fas' : 'far'} fa-heart"></i> 
                            ${this.isInFavorites(album.id, 'album') ? 'En favoritos' : 'Agregar a favoritos'}
                        </button>
                    </div>
                </div>
            </div>
        `;

            // Mostrar canciones del álbum
            if (tracksContainer && album.tracks && album.tracks.items) {
                this.showAlbumTracks(album.tracks.items, tracksContainer);
            } else {
                console.error('No se encontraron pistas en el álbum o el contenedor no existe');
                tracksContainer.innerHTML = '<p class="no-results">No se encontraron canciones en este álbum</p>';
            }

            // AGREGAR EVENT LISTENER PARA EL BOTÓN PRINCIPAL DE FAVORITOS DE ÁLBUM
            setTimeout(() => {
                const mainFavBtn = document.querySelector('.btn-favorite-main');
                if (mainFavBtn) {
                    mainFavBtn.addEventListener('click', (e) => {
                        const id = e.currentTarget.getAttribute('data-id');
                        const type = e.currentTarget.getAttribute('data-type');
                        const icon = e.currentTarget.querySelector('i');

                        if (this.isInFavorites(id, type)) {
                            // Eliminar de favoritos
                            this.removeFavorite(id, type);
                            icon.className = 'far fa-heart';
                            e.currentTarget.innerHTML = '<i class="far fa-heart"></i> Agregar a favoritos';
                        } else {
                            // Agregar a favoritos
                            this.addToFavorites(id, type);
                            icon.className = 'fas fa-heart';
                            e.currentTarget.innerHTML = '<i class="fas fa-heart"></i> En favoritos';
                            
                            // Crear animación de corazón volador
                            this.createFlyingHeart(e.currentTarget);
                        }

                        // Actualizar contador
                        this.updateFavoritesCounter();
                    });
                }
            }, 100);

            // Agregar event listeners para los botones de favoritos
            this.addFavoriteListeners();
        } catch (error) {
            console.error('Error al mostrar detalles del álbum:', error);
            albumDetail.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al mostrar los detalles del álbum. Intenta de nuevo más tarde.</p>
                <button onclick="window.location.reload()" class="btn btn-sm">Intentar de nuevo</button>
            </div>
        `;
        }
    }

    // Mostrar canciones de un álbum
    showAlbumTracks(tracks, container) {
        container.innerHTML = '<h2>Canciones</h2>';

        if (tracks.length === 0) {
            container.innerHTML += '<p class="no-results">No se encontraron canciones</p>';
            return;
        }

        const tracksList = document.createElement('div');
        tracksList.className = 'tracks-list';

        tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.dataset.id = track.id;
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-info">
                    <h3>${track.name}</h3>
                    <p>${track.artists.map(artist =>
                `<a href="artist.html?id=${artist.id}">${artist.name}</a>`
            ).join(', ')}</p>
                </div>
                <div class="track-duration">${this.formatDuration(track.duration_ms)}</div>
                <div class="track-actions">
                    <button class="btn-icon btn-favorite" data-id="${track.id}" data-type="track">
                        <i class="${this.isInFavorites(track.id, 'track') ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                ${track.preview_url ? `
                    <audio controls class="track-preview">
                        <source src="${track.preview_url}" type="audio/mpeg">
                        Tu navegador no soporta el elemento de audio.
                    </audio>
                ` : '<div class="no-preview">No hay vista previa disponible</div>'}
            `;

            tracksList.appendChild(trackItem);
        });

        container.appendChild(tracksList);

        // Agregar event listeners para los botones de favoritos
        this.addFavoriteListeners();
    }

    // Mostrar favoritos guardados
    showFavorites() {
        const artistsContainer = document.getElementById('favorite-artists');
        const tracksContainer = document.getElementById('favorite-tracks');
        const albumsContainer = document.getElementById('favorite-albums');
        const emptyFavoritesMessage = document.getElementById('empty-favorites');

        // Obtener favoritos del almacenamiento local
        const favorites = this.getFavorites();

        // Comprobar si hay favoritos
        const hasFavorites = favorites.artists.length > 0 ||
            favorites.tracks.length > 0 ||
            favorites.albums.length > 0;

        // Mostrar/ocultar mensaje de vacío
        if (emptyFavoritesMessage) {
            emptyFavoritesMessage.style.display = hasFavorites ? 'none' : 'block';
        }

        // Mostrar artistas favoritos
        if (artistsContainer) {
            if (favorites.artists.length === 0) {
                artistsContainer.innerHTML = '<h2>Artistas Favoritos</h2><p class="no-results">No tienes artistas favoritos</p>';
            } else {
                artistsContainer.innerHTML = '<h2>Artistas Favoritos</h2>';
                const grid = document.createElement('div');
                grid.className = 'card-grid';

                favorites.artists.forEach(artist => {
                    const artistElement = document.createElement('div');
                    artistElement.className = 'card';
                    artistElement.dataset.id = artist.id;
                    artistElement.innerHTML = `
                    <img src="${artist.image}" alt="${artist.name}" class="card-img">
                    <div class="card-content">
                        <h3 class="card-title">${artist.name}</h3>
                        <div class="card-actions">
                            <a href="artist.html?id=${artist.id}" class="btn btn-sm">Ver detalles</a>
                            <button class="btn-icon btn-remove" data-id="${artist.id}" data-type="artist">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;

                    grid.appendChild(artistElement);
                });

                artistsContainer.appendChild(grid);
            }
        }

        // Mostrar canciones favoritas - SIMPLIFICADO pero elegante
        if (tracksContainer) {
            if (favorites.tracks.length === 0) {
                tracksContainer.innerHTML = '<h2>Canciones Favoritas</h2><p class="no-results">No tienes canciones favoritas</p>';
            } else {
                tracksContainer.innerHTML = '<h2>Canciones Favoritas</h2>';
                const tracksList = document.createElement('div');
                tracksList.className = 'tracks-list';

                favorites.tracks.forEach((track, index) => {
                    const trackItem = document.createElement('div');
                    trackItem.className = 'track-item';
                    trackItem.dataset.id = track.id;

                    // Estructura mejorada para tracks
                    trackItem.innerHTML = `
                    <div class="track-number">${index + 1}</div>
                    <img src="${track.image}" alt="${track.name}" class="track-img">
                    <div class="track-info">
                        <h3>${track.name}</h3>
                        <p>${track.artist}</p>
                    </div>
                    
                    ${track.preview_url ? `
                        <audio controls class="track-preview">
                            <source src="${track.preview_url}" type="audio/mpeg">
                            Tu navegador no soporta el elemento de audio.
                        </audio>
                    ` : '<div class="no-preview">No hay vista previa disponible</div>'}
                    
                    <div class="track-actions">
                        <button class="btn-icon btn-remove" data-id="${track.id}" data-type="track" title="Eliminar de favoritos">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;

                    tracksList.appendChild(trackItem);
                });

                tracksContainer.appendChild(tracksList);
            }
        }

        // Mostrar álbumes favoritos
        if (albumsContainer) {
            if (favorites.albums.length === 0) {
                albumsContainer.innerHTML = '<h2>Álbumes Favoritos</h2><p class="no-results">No tienes álbumes favoritos</p>';
            } else {
                albumsContainer.innerHTML = '<h2>Álbumes Favoritos</h2>';
                const grid = document.createElement('div');
                grid.className = 'card-grid';

                favorites.albums.forEach(album => {
                    const albumElement = document.createElement('div');
                    albumElement.className = 'card';
                    albumElement.dataset.id = album.id;
                    albumElement.innerHTML = `
                    <img src="${album.image}" alt="${album.name}" class="card-img">
                    <div class="card-content">
                        <h3 class="card-title">${album.name}</h3>
                        <p class="card-text">${album.artist}</p>
                        <div class="card-actions">
                            <a href="album.html?id=${album.id}" class="btn btn-sm">Ver detalles</a>
                            <button class="btn-icon btn-remove" data-id="${album.id}" data-type="album">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;

                    grid.appendChild(albumElement);
                });

                albumsContainer.appendChild(grid);
            }
        }

        // Agregar event listeners para los botones de eliminar
        this.addRemoveFavoriteListeners();
    }

    // Método para crear y animar el corazón volador
    createFlyingHeart(sourceElement) {
        // Crear el elemento para el corazón volador
        const heart = document.createElement('div');
        heart.className = 'flying-heart';
        heart.innerHTML = '<i class="fas fa-heart"></i>';

        // Obtener la posición del botón de origen
        const rect = sourceElement.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        // Establecer posición inicial
        heart.style.left = `${startX}px`;
        heart.style.top = `${startY}px`;

        // Agregar al DOM
        document.body.appendChild(heart);

        // Obtener la posición del contador de favoritos en la navegación
        const favLink = document.querySelector('.fav-link');
        if (!favLink) {
            heart.remove();
            return;
        }

        const favRect = favLink.getBoundingClientRect();
        const endX = favRect.left + favRect.width / 2;
        const endY = favRect.top + favRect.height / 2;

        // Iniciar la animación
        setTimeout(() => {
            heart.style.left = `${endX}px`;
            heart.style.top = `${endY}px`;
            heart.style.opacity = '0';
            heart.style.transform = 'scale(0.3)';

            // Remover el elemento después de la animación
            setTimeout(() => {
                heart.remove();
            }, 800);
        }, 10);
    }

    // Actualizar contador de favoritos
    updateFavoritesCounter() {
        // Obtener el total de favoritos
        const favorites = this.getFavorites();
        const totalCount = favorites.artists.length + favorites.tracks.length + favorites.albums.length;

        // Buscar el contador en todas las páginas
        const counters = document.querySelectorAll('.favorites-counter');

        counters.forEach(counter => {
            // Actualizar el número
            counter.textContent = totalCount;

            // Aplicar clase para animación
            counter.classList.remove('bounce');
            setTimeout(() => {
                counter.classList.add('bounce');
            }, 10);
        });
    }

    // Agregar event listeners para botones de favoritos
    addFavoriteListeners() {
        const favButtons = document.querySelectorAll('.btn-favorite:not(.processed)');

        favButtons.forEach(button => {
            button.classList.add('processed'); // Marcar como procesado
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const type = e.currentTarget.getAttribute('data-type');
                const icon = e.currentTarget.querySelector('i');

                // Si ya está en favoritos, actualizamos el estado visual
                const isFavorite = this.isInFavorites(id, type);

                if (isFavorite) {
                    // Eliminar de favoritos
                    this.removeFavorite(id, type);

                    // Cambiar el icono a corazón vacío
                    icon.className = 'far fa-heart';
                } else {
                    // Agregar a favoritos
                    this.addToFavorites(id, type);

                    // Cambiar el icono a corazón lleno
                    icon.className = 'fas fa-heart';

                    // Crear animación de corazón volador
                    this.createFlyingHeart(e.currentTarget);
                }

                // Actualizar el contador de favoritos
                this.updateFavoritesCounter();
            });
        });
    }

    // Agregar event listeners para botones de eliminar favoritos
    addRemoveFavoriteListeners() {
        const removeButtons = document.querySelectorAll('.btn-remove');

        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const type = e.currentTarget.getAttribute('data-type');

                // Eliminar de favoritos
                this.removeFavorite(id, type);

                // Eliminar el elemento de la interfaz
                const parentCard = e.currentTarget.closest('.card') || e.currentTarget.closest('.track-item');
                if (parentCard) {
                    parentCard.remove();
                }

                // Verificar si quedan elementos
                const container = document.getElementById(`favorite-${type}s`);
                const elements = container.querySelectorAll('.card, .track-item');

                if (elements.length === 0) {
                    container.innerHTML = `<h2>${this.typeToString(type)}s Favoritos</h2><p class="no-results">No tienes ${type}s favoritos</p>`;
                }

                // Comprobar si todos los favoritos están vacíos
                const favorites = this.getFavorites();
                const hasFavorites = favorites.artists.length > 0 ||
                    favorites.tracks.length > 0 ||
                    favorites.albums.length > 0;

                // Mostrar mensaje de vacío si no hay favoritos
                const emptyFavoritesMessage = document.getElementById('empty-favorites');
                if (emptyFavoritesMessage && !hasFavorites) {
                    emptyFavoritesMessage.style.display = 'block';
                }

                // Actualizar el contador de favoritos
                this.updateFavoritesCounter();
            });
        });
    }

    // Verificar si un elemento está en favoritos
    isInFavorites(id, type) {
        const favorites = this.getFavorites();

        if (type === 'artist') {
            return favorites.artists.some(artist => artist.id === id);
        } else if (type === 'track') {
            return favorites.tracks.some(track => track.id === id);
        } else if (type === 'album') {
            return favorites.albums.some(album => album.id === id);
        }

        return false;
    }

    // Agregar a favoritos
    addToFavorites(id, type) {
        // Debugging
        console.log(`Agregando a favoritos: tipo=${type}, id=${id}`);

        // Obtener información del elemento según su tipo
        let itemInfo = {};

        if (type === 'artist') {
            // Buscar info del artista en el DOM
            const artistCard = document.querySelector(`.card[data-id="${id}"]`) ||
                document.querySelector('.detail-header');

            if (artistCard) {
                const name = artistCard.querySelector('.card-title')?.textContent ||
                    artistCard.querySelector('h1')?.textContent;
                const image = artistCard.querySelector('img')?.src || 'images/default-artist.png';

                itemInfo = { id, name, image };
            }
        } else if (type === 'track') {
            // Buscar info de la canción en el DOM
            const trackItem = document.querySelector(`.track-item[data-id="${id}"]`);

            if (trackItem) {
                const name = trackItem.querySelector('h3')?.textContent;
                const artist = trackItem.querySelector('p')?.textContent;
                const image = trackItem.querySelector('img')?.src || 'images/default-track.png';
                const preview_url = trackItem.querySelector('audio source')?.src;

                // Obtener información del álbum
                let albumId = '';
                let albumName = '';

                // Si estamos en la página de detalles del álbum
                if (window.location.pathname.includes('album.html')) {
                    console.log('Estamos en la página de album.html');
                    // Obtener el ID del álbum de la URL
                    const urlParams = new URLSearchParams(window.location.search);
                    albumId = urlParams.get('id') || '';

                    // Obtener el nombre del álbum
                    const albumHeaderTitle = document.querySelector('.detail-header h1');
                    if (albumHeaderTitle) {
                        albumName = albumHeaderTitle.textContent.trim();
                    }

                    console.log(`Información del álbum desde URL: id=${albumId}, name=${albumName}`);
                }

                // Si no obtuvimos el albumId desde la URL, buscar en otros lugares
                if (!albumId) {
                    // Verificar si hay un elemento padre con data-album-id
                    const albumIdFromParent = trackItem.closest('[data-album-id]')?.dataset.albumId;
                    if (albumIdFromParent) {
                        albumId = albumIdFromParent;
                        const albumNameElement = document.querySelector('h1') || document.querySelector('.album-title');
                        if (albumNameElement) {
                            albumName = albumNameElement.textContent.trim();
                        }
                        console.log(`Información del álbum desde padre: id=${albumId}, name=${albumName}`);
                    }
                }

                // Si todavía no tenemos albumId pero tenemos el objeto API disponible
                if (!albumId && window.spotifyAPI && window.spotifyAPI.currentAlbum) {
                    const album = window.spotifyAPI.currentAlbum;
                    albumId = album.id;
                    albumName = album.name;
                    console.log(`Información del álbum desde spotifyAPI: id=${albumId}, name=${albumName}`);
                }

                itemInfo = {
                    id,
                    name,
                    artist,
                    image,
                    preview_url,
                    albumId,
                    albumName
                };

                // Debugging
                console.log('Información del track guardada:', itemInfo);
            }
        } else if (type === 'album') {
            // Buscar info del álbum en el DOM
            const albumCard = document.querySelector(`.card[data-id="${id}"]`) ||
                document.querySelector('.detail-header');

            if (albumCard) {
                const name = albumCard.querySelector('.card-title')?.textContent ||
                    albumCard.querySelector('h1')?.textContent;
                const artist = albumCard.querySelector('.card-text')?.textContent ||
                    albumCard.querySelector('p')?.textContent;
                const image = albumCard.querySelector('img')?.src || 'images/default-album.png';

                itemInfo = { id, name, artist, image };

                // Debugging
                console.log('Información del álbum guardada:', itemInfo);
            }
        }

        // Si encontramos información, guardarla en favoritos
        if (Object.keys(itemInfo).length > 0) {
            const favorites = this.getFavorites();

            if (type === 'artist') {
                // Evitar duplicados
                if (!favorites.artists.some(artist => artist.id === id)) {
                    favorites.artists.push(itemInfo);
                }
            } else if (type === 'track') {
                if (!favorites.tracks.some(track => track.id === id)) {
                    favorites.tracks.push(itemInfo);
                }
            } else if (type === 'album') {
                if (!favorites.albums.some(album => album.id === id)) {
                    favorites.albums.push(itemInfo);
                }
            }

            // Guardar en localStorage
            localStorage.setItem('spotifyFavorites', JSON.stringify(favorites));
            console.log('Favoritos actualizados:', favorites);

            // Mostrar mensaje de éxito
            this.showMessage(`${this.typeToString(type)} agregado a favoritos`, 'success');
        } else {
            console.error('No se pudo obtener información del elemento para agregar a favoritos');
        }
    }

    // Eliminar de favoritos
    removeFavorite(id, type) {
        const favorites = this.getFavorites();

        if (type === 'artist') {
            favorites.artists = favorites.artists.filter(artist => artist.id !== id);
        } else if (type === 'track') {
            favorites.tracks = favorites.tracks.filter(track => track.id !== id);
        } else if (type === 'album') {
            favorites.albums = favorites.albums.filter(album => album.id !== id);
        }

        localStorage.setItem('spotifyFavorites', JSON.stringify(favorites));

        // Mostrar mensaje de éxito
        this.showMessage(`${this.typeToString(type)} eliminado de favoritos`, 'success');
    }

    // Obtener favoritos del almacenamiento local
    getFavorites() {
        const favorites = localStorage.getItem('spotifyFavorites');

        if (favorites) {
            return JSON.parse(favorites);
        }

        return {
            artists: [],
            tracks: [],
            albums: []
        };
    }

    // Mostrar mensaje de notificación
    showMessage(message, type = 'info') {
        // Eliminar mensajes anteriores
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const messageContainer = document.createElement('div');
        messageContainer.className = `message message-${type}`;
        messageContainer.innerHTML = `
            <i class="fas ${this.getIconForMessageType(type)}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(messageContainer);

        // Mostrar mensaje
        setTimeout(() => {
            messageContainer.classList.add('show');
        }, 10);

        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
            messageContainer.classList.remove('show');

            // Eliminar mensaje del DOM después de la animación
            setTimeout(() => {
                messageContainer.remove();
            }, 300);
        }, 3000);
    }

    // Obtener icono para tipo de mensaje
    getIconForMessageType(type) {
        switch (type) {
            case 'success':
                return 'fa-check-circle';
            case 'error':
                return 'fa-exclamation-circle';
            case 'warning':
                return 'fa-exclamation-triangle';
            default:
                return 'fa-info-circle';
        }
    }

    // Formatear número con separadores de miles
    formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Formatear duración de milisegundos a formato mm:ss
    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    // Convertir tipo a string para mensajes
    typeToString(type) {
        if (type === 'artist') return 'Artista';
        if (type === 'track') return 'Canción';
        if (type === 'album') return 'Álbum';
        return type;
    }
}

// Exportar instancia única de la UI
const ui = new UI();