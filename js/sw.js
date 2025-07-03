// sw.js - Service Worker mejorado para funcionalidades offline y notificaciones

// Nombre de la caché
const CACHE_NAME = 'spotify-explorer-v2';

// Recursos estáticos para cachear inicialmente
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/search.html',
    '/artist.html',
    '/album.html',
    '/favorites.html',
    '/offline.html',
    '/css/style.css',
    '/js/app.js',
    '/js/api.js',
    '/js/ui.js',
    '/js/album.js',
    '/js/artists-navigation.js',
    '/js/pwa-installer.js',
    '/js/notifications.js',
    '/js/sharing.js',
    '/js/network-status.js',
    '/js/rating-system.js',
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

    // Ignorar solicitudes de Chrome extensions
    if (event.request.url.startsWith('chrome-extension://')) {
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

        // Si es una solicitud de HTML y estamos offline, mostrar página offline
        if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
            const offlineResponse = await caches.match('/offline.html');
            if (offlineResponse) {
                return offlineResponse;
            }
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
        if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
            const offlineResponse = await caches.match('/offline.html');
            if (offlineResponse) {
                return offlineResponse;
            }
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

// Event listener para notificaciones push
self.addEventListener('push', event => {
    console.log('Push message recibido:', event);

    const options = {
        body: event.data ? event.data.text() : 'Nueva actualización disponible',
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Explorar',
                icon: '/images/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/images/icons/icon-72x72.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('SpotifyExplorer', options)
    );
});

// Event listener para clics en notificaciones
self.addEventListener('notificationclick', event => {
    console.log('Clic en notificación:', event);
    
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/search.html')
        );
    } else if (event.action === 'close') {
        // No hacer nada, solo cerrar
        return;
    } else {
        // Clic en el cuerpo de la notificación
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                // Si ya hay una ventana abierta, enfocarla
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === '/' || client.url.includes('index.html')) {
                        return client.focus();
                    }
                }
                // Si no hay ventanas abiertas, abrir una nueva
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});

// Event listener para acciones de notificaciones
self.addEventListener('notificationaction', event => {
    console.log('Acción de notificación:', event.action);
    
    const action = event.action;
    const data = event.notification.data;

    event.notification.close();

    switch (action) {
        case 'explore':
        case 'check-recommendation':
        case 'explore-genres':
            event.waitUntil(
                clients.openWindow(data && data.url ? data.url : '/search.html')
            );
            break;
        case 'dismiss':
            // No hacer nada, solo cerrar
            break;
        default:
            event.waitUntil(
                clients.openWindow('/')
            );
    }
});

// Event listener para sincronización en background
self.addEventListener('sync', event => {
    console.log('Background sync:', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Función para sincronización en background
async function doBackgroundSync() {
    try {
        // Aquí podrías sincronizar datos offline con el servidor
        console.log('Ejecutando sincronización en background');
        
        // Ejemplo: enviar valoraciones y comentarios pendientes
        // En una implementación real, podrías tener una cola de acciones offline
        
        return Promise.resolve();
    } catch (error) {
        console.error('Error en sincronización background:', error);
        throw error;
    }
}

// Event listener para cuando el Service Worker se actualiza
self.addEventListener('message', event => {
    console.log('Mensaje recibido en Service Worker:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // Responder al cliente si es necesario
    if (event.ports && event.ports.length > 0) {
        event.ports[0].postMessage({ success: true });
    }
});

// Función para cachear datos dinámicos
async function cacheData(key, data) {
    try {
        const cache = await caches.open('spotify-data');
        const jsonResponse = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put(`data:${key}`, jsonResponse);
        console.log('Datos cacheados:', key);
    } catch (error) {
        console.error('Error al cachear datos:', error);
    }
}

// Función para obtener datos cacheados
async function getCachedData(key) {
    try {
        const cache = await caches.open('spotify-data');
        const response = await cache.match(`data:${key}`);
        if (response) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error al obtener datos cacheados:', error);
        return null;
    }
}

// Exponer funciones para uso desde la aplicación principal
self.cacheData = cacheData;
self.getCachedData = getCachedData;