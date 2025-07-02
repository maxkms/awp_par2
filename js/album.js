// album.js - Código específico para la página de detalles del álbum

document.addEventListener('DOMContentLoaded', () => {
    // Obtener el ID del álbum de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const albumId = urlParams.get('id');

    console.log('Album page loaded. Album ID:', albumId);

    if (!albumId) {
        document.getElementById('album-detail').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>No se especificó ningún álbum. Regresa y selecciona un álbum para ver sus detalles.</p>
                <a href="index.html" class="btn btn-sm">Volver al inicio</a>
            </div>
        `;
        return;
    }

    // Si existe una función loadAlbumPage en app.js, usarla
    if (typeof loadAlbumPage === 'function') {
        console.log('Usando loadAlbumPage de app.js');
        loadAlbumPage();
    } else {
        // Si no, cargar el álbum directamente
        console.log('Cargando álbum directamente desde album.js');
        loadAlbumData(albumId);
    }
});

// Función para cargar los datos del álbum
async function loadAlbumData(albumId) {
    try {
        // Mostrar indicador de carga
        document.getElementById('album-detail').innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> Cargando detalles del álbum...
            </div>
        `;

        console.log('Cargando álbum con ID:', albumId);

        // Verificar si el token es válido antes de hacer la solicitud
        if (!spotifyAPI.token) {
            console.log('No hay token, obteniendo uno nuevo...');
            await spotifyAPI.getToken();
        }

        // Intentar obtener los datos del álbum
        console.log('Haciendo solicitud getAlbum...');
        const album = await spotifyAPI.getAlbum(albumId);

        console.log('Datos del álbum recibidos:', album ? 'Éxito' : 'Error');

        // Guardar el álbum actual para uso posterior (favoritos)
        if (window.spotifyAPI) {
            window.spotifyAPI.currentAlbum = album;
        }

        // Si se reciben los datos, mostrarlos
        if (album && album.id) {
            console.log('Mostrando detalles del álbum...');
            ui.showAlbumDetail(album);
            console.log('Detalles mostrados con éxito.');
        } else {
            throw new Error('No se pudo obtener información del álbum');
        }

    } catch (error) {
        console.error('Error al cargar detalles del álbum:', error);

        // Mostrar mensaje de error
        document.getElementById('album-detail').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar los detalles del álbum. Intenta de nuevo más tarde.</p>
                <p class="error-details">${error.message || 'Error desconocido'}</p>
                <button id="retry-button" class="btn btn-sm">Intentar de nuevo</button>
            </div>
        `;

        // Agregar listener para botón de reintentar
        document.getElementById('retry-button')?.addEventListener('click', () => {
            loadAlbumData(albumId);
        });

        ui.showMessage('Error al cargar los detalles del álbum. Intenta de nuevo más tarde.', 'error');
    }
}