// notifications.js - Sistema de notificaciones push

class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
        this.init();
    }

    // Inicializar el sistema de notificaciones
    async init() {
        if (!this.isSupported) {
            console.log('Las notificaciones no están soportadas en este navegador');
            return;
        }

        // Verificar el estado actual de los permisos
        this.permission = Notification.permission;
        
        // Si ya tenemos permiso, configurar las notificaciones
        if (this.permission === 'granted') {
            this.setupNotifications();
        }

        // Mostrar prompt para solicitar permisos después de 10 segundos
        setTimeout(() => {
            this.showPermissionPrompt();
        }, 10000);
    }

    // Mostrar prompt para solicitar permisos de notificación
    showPermissionPrompt() {
        // Solo mostrar si no hemos preguntado antes o si fue denegado hace tiempo
        const lastAsked = localStorage.getItem('notificationLastAsked');
        const now = Date.now();
        
        // Si preguntamos hace menos de 1 día, no volver a preguntar
        if (lastAsked && (now - parseInt(lastAsked)) < 24 * 60 * 60 * 1000) {
            return;
        }

        // Si ya está concedido o denegado permanentemente, no preguntar
        if (this.permission === 'granted' || this.permission === 'denied') {
            return;
        }

        // Crear modal personalizado para solicitar permisos
        this.createPermissionModal();
    }

    // Crear modal personalizado para solicitar permisos
    createPermissionModal() {
        // Verificar si ya existe un modal
        if (document.getElementById('notification-modal')) {
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'notification-modal';
        modal.className = 'notification-modal';
        modal.innerHTML = `
            <div class="notification-modal-content">
                <div class="notification-modal-header">
                    <i class="fas fa-bell"></i>
                    <h3>¿Permitir notificaciones?</h3>
                </div>
                <div class="notification-modal-body">
                    <p>Recibe notificaciones sobre nuevos artistas populares, recomendaciones personalizadas y actualizaciones de la aplicación.</p>
                    <div class="notification-benefits">
                        <div class="benefit-item">
                            <i class="fas fa-star"></i>
                            <span>Nuevos lanzamientos de tus artistas favoritos</span>
                        </div>
                        <div class="benefit-item">
                            <i class="fas fa-headphones"></i>
                            <span>Recomendaciones musicales personalizadas</span>
                        </div>
                        <div class="benefit-item">
                            <i class="fas fa-fire"></i>
                            <span>Tendencias musicales del momento</span>
                        </div>
                    </div>
                </div>
                <div class="notification-modal-footer">
                    <button id="notification-deny" class="btn btn-outline">Ahora no</button>
                    <button id="notification-allow" class="btn">Permitir notificaciones</button>
                </div>
            </div>
            <div class="notification-modal-overlay"></div>
        `;

        document.body.appendChild(modal);

        // Event listeners para los botones
        document.getElementById('notification-allow').addEventListener('click', () => {
            this.requestPermission();
            this.closeModal();
        });

        document.getElementById('notification-deny').addEventListener('click', () => {
            this.closeModal();
            // Guardar que el usuario rechazó para no molestar por un tiempo
            localStorage.setItem('notificationLastAsked', Date.now().toString());
        });

        // Cerrar al hacer clic en el overlay
        modal.querySelector('.notification-modal-overlay').addEventListener('click', () => {
            this.closeModal();
        });

        // Mostrar modal con animación
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
    }

    // Cerrar modal
    closeModal() {
        const modal = document.getElementById('notification-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // Solicitar permiso de notificaciones
    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;

            if (permission === 'granted') {
                this.setupNotifications();
                this.showWelcomeNotification();
                ui.showMessage('¡Notificaciones activadas! Te mantendremos informado sobre música nueva.', 'success');
            } else {
                ui.showMessage('Puedes activar las notificaciones desde la configuración de tu navegador.', 'info');
            }

            // Guardar timestamp de cuando preguntamos
            localStorage.setItem('notificationLastAsked', Date.now().toString());
        } catch (error) {
            console.error('Error al solicitar permisos de notificación:', error);
        }
    }

    // Configurar notificaciones
    setupNotifications() {
        // Programar notificaciones periódicas
        this.schedulePeriodicNotifications();
        
        // Configurar notificaciones basadas en actividad del usuario
        this.setupActivityBasedNotifications();
    }

    // Mostrar notificación de bienvenida
    showWelcomeNotification() {
        this.showNotification(
            '¡Bienvenido a SpotifyExplorer!',
            'Las notificaciones están activadas. Te avisaremos sobre música nueva y recomendaciones.',
            {
                icon: 'images/icons/icon-192x192.png',
                badge: 'images/icons/icon-72x72.png',
                tag: 'welcome',
                data: { type: 'welcome' }
            }
        );
    }

    // Programar notificaciones periódicas
    schedulePeriodicNotifications() {
        // Notificación diaria sobre nuevos artistas populares
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0); // 10:00 AM

        const timeUntilTomorrow = tomorrow.getTime() - now.getTime();

        setTimeout(() => {
            this.showNotification(
                '🎵 Descubre música nueva',
                'Explora los artistas populares de hoy y encuentra tu próxima canción favorita',
                {
                    icon: 'images/icons/icon-192x192.png',
                    badge: 'images/icons/icon-72x72.png',
                    tag: 'daily-music',
                    actions: [
                        {
                            action: 'explore',
                            title: 'Explorar ahora',
                            icon: 'images/icons/icon-72x72.png'
                        },
                        {
                            action: 'dismiss',
                            title: 'Descartar',
                            icon: 'images/icons/icon-72x72.png'
                        }
                    ],
                    data: { 
                        type: 'daily-music',
                        url: '/search.html'
                    }
                }
            );

            // Programar para el siguiente día
            this.schedulePeriodicNotifications();
        }, timeUntilTomorrow);
    }

    // Configurar notificaciones basadas en actividad
    setupActivityBasedNotifications() {
        // Notificación cuando el usuario agrega muchos favoritos
        this.setupFavoritesNotifications();
        
        // Notificación de recomendaciones basadas en búsquedas
        this.setupSearchBasedNotifications();
    }

    // Notificaciones relacionadas con favoritos
    setupFavoritesNotifications() {
        // Observar cambios en favoritos
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = (key, value) => {
            originalSetItem.call(localStorage, key, value);
            
            if (key === 'spotifyFavorites') {
                const favorites = JSON.parse(value);
                const totalFavorites = favorites.artists.length + favorites.tracks.length + favorites.albums.length;
                
                // Notificación cuando llega a 10 favoritos
                if (totalFavorites === 10) {
                    setTimeout(() => {
                        this.showNotification(
                            '🎉 ¡10 favoritos alcanzados!',
                            'Ya tienes una gran colección. ¿Qué tal si exploras algunos géneros nuevos?',
                            {
                                icon: 'images/icons/icon-192x192.png',
                                tag: 'favorites-milestone',
                                actions: [
                                    {
                                        action: 'explore-genres',
                                        title: 'Explorar géneros',
                                        icon: 'images/icons/icon-72x72.png'
                                    }
                                ],
                                data: { 
                                    type: 'favorites-milestone',
                                    url: '/search.html?q=genre:rock'
                                }
                            }
                        );
                    }, 2000);
                }
            }
        };
    }

    // Notificaciones basadas en búsquedas
    setupSearchBasedNotifications() {
        // Simular recomendaciones basadas en actividad
        setTimeout(() => {
            if (this.permission === 'granted') {
                this.showNotification(
                    '🎧 Recomendación personalizada',
                    'Basado en tu actividad, creemos que te gustará explorar música electrónica',
                    {
                        icon: 'images/icons/icon-192x192.png',
                        tag: 'recommendation',
                        actions: [
                            {
                                action: 'check-recommendation',
                                title: 'Ver recomendación',
                                icon: 'images/icons/icon-72x72.png'
                            }
                        ],
                        data: { 
                            type: 'recommendation',
                            url: '/search.html?q=genre:electronic'
                        }
                    }
                );
            }
        }, 30000); // Después de 30 segundos de uso
    }

    // Mostrar notificación
    showNotification(title, body, options = {}) {
        if (this.permission !== 'granted') {
            console.log('No hay permisos para mostrar notificaciones');
            return;
        }

        const defaultOptions = {
            icon: 'images/icons/icon-192x192.png',
            badge: 'images/icons/icon-72x72.png',
            vibrate: [200, 100, 200],
            requireInteraction: false,
            ...options
        };

        // Usar Service Worker para mostrar la notificación si está disponible
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body,
                    ...defaultOptions
                });
            });
        } else {
            // Fallback a notificación normal
            new Notification(title, {
                body,
                ...defaultOptions
            });
        }
    }

    // Manejar clics en notificaciones (debe ser llamado desde el Service Worker)
    static handleNotificationClick(event) {
        event.notification.close();

        const data = event.notification.data;
        
        if (data && data.url) {
            event.waitUntil(
                clients.openWindow(data.url)
            );
        } else {
            event.waitUntil(
                clients.openWindow('/')
            );
        }
    }

    // Manejar acciones de notificaciones
    static handleNotificationAction(event) {
        const action = event.action;
        const data = event.notification.data;

        event.notification.close();

        switch (action) {
            case 'explore':
            case 'check-recommendation':
            case 'explore-genres':
                event.waitUntil(
                    clients.openWindow(data.url || '/search.html')
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
    }
}

// CSS para el modal de notificaciones (agregar al final del archivo CSS)
const notificationStyles = `
.notification-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.notification-modal.show {
    opacity: 1;
    visibility: visible;
}

.notification-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
}

.notification-modal-content {
    background: white;
    border-radius: 16px;
    max-width: 480px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    z-index: 1;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    transform: translateY(20px);
    transition: transform 0.3s ease;
}

.notification-modal.show .notification-modal-content {
    transform: translateY(0);
}

.notification-modal-header {
    padding: 2rem 2rem 1rem;
    text-align: center;
    border-bottom: 1px solid #eee;
}

.notification-modal-header i {
    font-size: 3rem;
    color: var(--primary-color);
    margin-bottom: 1rem;
}

.notification-modal-header h3 {
    margin: 0;
    color: var(--secondary-color);
    font-size: 1.5rem;
}

.notification-modal-body {
    padding: 2rem;
}

.notification-modal-body p {
    color: var(--text-light);
    margin-bottom: 1.5rem;
    line-height: 1.6;
}

.notification-benefits {
    space-y: 1rem;
}

.benefit-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.benefit-item i {
    color: var(--primary-color);
    width: 20px;
    text-align: center;
}

.benefit-item span {
    color: var(--text-color);
    font-size: 0.9rem;
}

.notification-modal-footer {
    padding: 1rem 2rem 2rem;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.notification-modal-footer .btn {
    min-width: 120px;
}

@media (max-width: 576px) {
    .notification-modal-content {
        width: 95%;
        margin: 1rem;
    }
    
    .notification-modal-header,
    .notification-modal-body {
        padding: 1.5rem;
    }
    
    .notification-modal-footer {
        padding: 1rem 1.5rem 1.5rem;
        flex-direction: column;
    }
    
    .notification-modal-footer .btn {
        width: 100%;
    }
}
`;

// Agregar estilos al documento
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = notificationStyles;
    document.head.appendChild(style);
}

// Crear instancia global del manager de notificaciones
window.notificationManager = new NotificationManager();