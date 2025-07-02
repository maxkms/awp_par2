// sw.js - Service Worker para funcionalidades offline

// Nombre de la caché
const CACHE_NAME = 'spotify-explorer-v1';

// Recursos estáticos para cachear inicialmente
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/search.html',
    '/artist.html',
    '/album.html',
    '/favorites.html',
    '/css/style.css',
    '/js/app.js',
    '/js/api.js',
    '/js/ui.js',
    '/images/default-artist.png',
    '/images/default-album.png',
    '/images/default-track.png',
    '/images/logo.png',
    '/images/icons/icon-72x72.png',
    '/images/icons/icon-96x96.png',
    '/images/icons/icon-128x128.png',
    '/images/icons/icon-144x144.png',
    '/images/icons/icon-152x152.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-384x384.png',
    '/images/icons/icon-512x512.png',
    '/manifest.json'
];

// Event listener para la instalación del Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker instalado');

    // Precachear recursos estáticos
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cacheando archivos estáticos');
                return cache.addAll(STATIC_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Event listener para la activación del Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker activado');

    // Limpiar cachés antiguas
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== 'spotify-data') {
                        console.log('Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    return self.clients.claim();
});

// Event listener para la interceptación de peticiones
self.addEventListener('fetch', event => {
    // Ignorar solicitudes de API de Spotify (debido a autenticación)
    if (event.request.url.includes('api.spotify.com')) {
        return;
    }

    // Estrategia Cache First para recursos estáticos y Network First para dinámicos
    if (isStaticResource(event.request.url)) {
        event.respondWith(cacheFirstStrategy(event.request));
    } else {
        event.respondWith(networkFirstStrategy(event.request));
    }
});

// Estrategia Cache First - Intenta obtener del caché primero, si no está disponible, va a la red
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Si no está en caché, intentar obtener de la red
        const networkResponse = await fetch(request);

        // Guardar en caché para futuras solicitudes
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('Error en estrategia Cache First:', error);

        // Intentar mostrar una página de fallback si es una solicitud de HTML
        if (request.headers.get('Accept').includes('text/html')) {
            return caches.match('/offline.html');
        }

        // Devolver un error para otro tipo de recursos
        return new Response('Error: No se pudo cargar el recurso.', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Estrategia Network First - Intenta obtener de la red primero, si falla, va al caché
async function networkFirstStrategy(request) {
    try {
        // Intentar obtener de la red
        const networkResponse = await fetch(request);

        // Guardar en caché para uso offline
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Fallback al caché para:', request.url);

        // Si falla la red, intentar obtener del caché
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Si tampoco está en caché, mostrar página de fallback para HTML
        if (request.headers.get('Accept').includes('text/html')) {
            return caches.match('/offline.html');
        }

        // Devolver un error para otro tipo de recursos
        return new Response('Error: No se pudo cargar el recurso y no está en caché.', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Función para determinar si un recurso es estático
function isStaticResource(url) {
    // Convertir URL a string si es un objeto
    const urlString = url.toString();

    // Verificar si la URL corresponde a algún recurso estático
    return STATIC_CACHE.some(resource => {
        // Comprobar si la URL termina con el recurso
        return urlString.endsWith(resource) || resource === '/' && (urlString.endsWith('/') || urlString.endsWith('/index.html'));
    }) || urlString.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Crear una página offline básica si no existe
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Verificar si ya existe la página offline
            return cache.match('/offline.html').then(response => {
                if (!response) {
                    // Crear una página offline básica
                    const offlineHTML = `
                        <!DOCTYPE html>
                        <html lang="es">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Sin conexión - SpotifyExplorer</title>
                            <style>
                                body {
                                    font-family: 'Montserrat', sans-serif;
                                    background-color: #191414;
                                    color: white;
                                    text-align: center;
                                    padding: 20px;
                                    margin: 0;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    min-height: 100vh;
                                }
                                .offline-icon {
                                    font-size: 5rem;
                                    margin-bottom: 20px;
                                }
                                h1 {
                                    font-size: 2rem;
                                    margin-bottom: 1rem;
                                }
                                p {
                                    font-size: 1.2rem;
                                    margin-bottom: 2rem;
                                }
                                .btn {
                                    display: inline-block;
                                    background-color: #1DB954;
                                    color: white;
                                    padding: 0.8rem 1.5rem;
                                    border-radius: 30px;
                                    font-weight: 600;
                                    text-decoration: none;
                                    transition: all 0.3s ease;
                                }
                                .btn:hover {
                                    background-color: #1ED760;
                                    transform: translateY(-3px);
                                }
                            </style>
                        </head>
                        <body>
                            <div class="offline-icon">📶</div>
                            <h1>Sin conexión a Internet</h1>
                            <p>No se pudo conectar a la red. Puedes acceder a tus favoritos guardados mientras estás offline.</p>
                            <a href="/favorites.html" class="btn">Ver Favoritos</a>
                        </body>
                        </html>
                    `;

                    // Guardar la página offline en caché
                    return cache.put('/offline.html', new Response(offlineHTML, {
                        headers: { 'Content-Type': 'text/html' }
                    }));
                }
            });
        })
    );
});