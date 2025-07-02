// api.js - Manejo de la comunicación con la API de Spotify

class SpotifyAPI {
    constructor() {
        // Credenciales de Spotify (¡Asegúrate de reemplazar estos valores!)
        this.clientId = '3f4c6e69433240e5a60731fc36e92f5b';
        this.clientSecret = '1f4aea2706b34bfcb51ac60ba2469300';

        // Token y su fecha de caducidad
        this.token = '';
        this.tokenExpiry = null;
    }

    // Método para obtener token de autenticación
    async getToken() {
        // Si ya tenemos un token válido, lo devolvemos
        if (this.token && this.tokenExpiry && this.tokenExpiry > Date.now()) {
            return this.token;
        }

        try {
            // Solicitud para obtener token
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                throw new Error('Falló la autenticación con Spotify');
            }

            const data = await response.json();
            this.token = data.access_token;
            // Establecer expiración (token de Spotify dura 3600 segundos)
            this.tokenExpiry = Date.now() + (data.expires_in * 1000);

            return this.token;
        } catch (error) {
            console.error('Error al obtener token:', error);
            throw error;
        }
    }

    // Método para hacer solicitudes a la API de Spotify
    async makeRequest(endpoint, method = 'GET') {
        try {
            const token = await this.getToken();

            const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error en solicitud: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en solicitud a Spotify:', error);
            throw error;
        }
    }

    // Método para buscar artistas, álbumes o canciones
    async search(query, type = 'artist,track,album', limit = 20) {
        return this.makeRequest(`/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`);
    }

    // Método para obtener artistas populares (basados en un género)
    async getPopularArtists(genre = 'pop', limit = 10) {
        return this.makeRequest(`/search?q=genre:${genre}&type=artist&limit=${limit}`);
    }

    // Método para obtener detalles de un artista
    async getArtist(artistId) {
        return this.makeRequest(`/artists/${artistId}`);
    }

    // Método para obtener las canciones top de un artista
    async getArtistTopTracks(artistId, country = 'AR') {
        return this.makeRequest(`/artists/${artistId}/top-tracks?market=${country}`);
    }

    // Método para obtener álbumes de un artista
    async getArtistAlbums(artistId, limit = 10) {
        return this.makeRequest(`/artists/${artistId}/albums?limit=${limit}`);
    }

    // Método para obtener detalles de un álbum
    async getAlbum(albumId) {
        return this.makeRequest(`/albums/${albumId}`);
    }

    // Método para obtener detalles de una canción
    async getTrack(trackId) {
        return this.makeRequest(`/tracks/${trackId}`);
    }
}

// Exportar instancia única de la API
const spotifyAPI = new SpotifyAPI();