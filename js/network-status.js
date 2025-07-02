// network-status.js - Detección del estado de conexión online/offline

class NetworkStatusManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.statusIndicator = null;
        this.lastOnlineTime = Date.now();
        this.init();
    }

    // Inicializar el manager de estado de red
    init() {
        this.createStatusIndicator();
        this.setupEventListeners();
        this.updateUI();
        this.showInitialStatus();
    }

    // Crear indicador visual del estado de conexión
    createStatusIndicator() {
        // Crear el indicador si no existe
        if (!document.getElementById('network-status')) {
            const indicator = document.createElement('div');
            indicator.id = 'network-status';
            indicator.className = 'network-status';
            document.body.appendChild(indicator);
            this.statusIndicator = indicator;
        } else {
            this.statusIndicator = document.getElementById('network-status');
        }
    }

    // Configurar event listeners para cambios de conectividad
    setupEventListeners() {
        // Eventos nativos del navegador
        window.addEventListener('online', () => {
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.handleOffline();
        });

        // Verificación periódica adicional (cada 30 segundos)
        setInterval(() => {
            this.checkConnectionStatus();
        }, 30000);

        // Verificar conexión cuando la ventana obtiene foco
        window.addEventListener('focus', () => {
            this.checkConnectionStatus();
        });

        // Verificar conexión en interacciones del usuario
        document.addEventListener('click', (e) => {
            // Solo verificar en clics de elementos importantes
            if (e.target.closest('.btn') || e.target.closest('a')) {
                this.checkConnectionStatus();
            }
        });
    }

    // Manejar cuando se detecta conexión online
    handleOnline() {
        console.log('Conexión restaurada');
        this.isOnline = true;
        this.lastOnlineTime = Date.now();
        this.updateUI();
        this.showOnlineNotification();
    }

    // Manejar cuando se detecta que no hay conexión
    handleOffline() {
        console.log('Conexión perdida');
        this.isOnline = false;
        this.updateUI();
        this.showOfflineNotification();
    }

    // Verificar estado de conexión de forma más robusta
    async checkConnectionStatus() {
        try {
            // Intentar hacer una petición pequeña para verificar conectividad real
            const response = await fetch('/manifest.json', {
                method: 'HEAD',
                cache: 'no-cache',
                signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
            });

            const wasOnline = this.isOnline;
            this.isOnline = response.ok;

            // Si el estado cambió, actualizar UI
            if (wasOnline !== this.isOnline) {
                if (this.isOnline) {
                    this.handleOnline();
                } else {
                    this.handleOffline();
                }
            }
        } catch (error) {
            // Si hay error en la petición, probablemente estamos offline
            if (this.isOnline) {
                this.handleOffline();
            }
        }
    }

    // Actualizar la interfaz según el estado de conexión
    updateUI() {
        // Actualizar el indicador visual
        this.updateStatusIndicator();
        
        // Actualizar estilos del body para cambios globales
        document.body.classList.toggle('offline', !this.isOnline);
        document.body.classList.toggle('online', this.isOnline);

        // Actualizar elementos específicos
        this.updateNavigationStyle();
        this.updateButtonStates();
        this.updateContentAreas();
    }

    // Actualizar el indicador de estado
    updateStatusIndicator() {
        if (!this.statusIndicator) return;

        const statusText = this.isOnline ? 'Conectado' : 'Sin conexión';
        const statusIcon = this.isOnline ? 'fa-wifi' : 'fa-wifi-slash';
        const statusClass = this.isOnline ? 'online' : 'offline';

        this.statusIndicator.innerHTML = `
            <div class="status-content">
                <i class="fas ${statusIcon}"></i>
                <span>${statusText}</span>
            </div>
        `;

        // Remover clases anteriores y agregar la actual
        this.statusIndicator.className = `network-status ${statusClass}`;

        // Mostrar temporalmente el indicador
        this.statusIndicator.classList.add('visible');
        
        // Ocultar después de 3 segundos si estamos online
        if (this.isOnline) {
            setTimeout(() => {
                this.statusIndicator.classList.remove('visible');
            }, 3000);
        }
    }

    // Actualizar estilo de la navegación
    updateNavigationStyle() {
        const header = document.querySelector('header');
        if (header) {
            header.classList.toggle('offline-mode', !this.isOnline);
        }
    }

    // Actualizar estado de botones
    updateButtonStates() {
        // Deshabilitar botones que requieren conexión cuando estamos offline
        const onlineButtons = document.querySelectorAll('.btn:not(.btn-offline-safe)');
        
        onlineButtons.forEach(button => {
            if (!this.isOnline) {
                button.classList.add('offline-disabled');
                button.disabled = true;
                button.title = 'Requiere conexión a Internet';
            } else {
                button.classList.remove('offline-disabled');
                button.disabled = false;
                button.title = '';
            }
        });

        // Los botones de favoritos siempre funcionan (son offline-safe)
        const favoriteButtons = document.querySelectorAll('.btn-favorite, .btn-remove');
        favoriteButtons.forEach(button => {
            button.classList.add('btn-offline-safe');
            button.disabled = false;
        });
    }

    // Actualizar áreas de contenido
    updateContentAreas() {
        // Mostrar mensajes informativos en áreas que requieren conexión
        if (!this.isOnline) {
            this.showOfflineMessages();
        } else {
            this.hideOfflineMessages();
        }
    }

    // Mostrar mensajes de offline en áreas relevantes
    showOfflineMessages() {
        // En la página de búsqueda
        const searchResults = document.getElementById('search-results');
        if (searchResults && window.location.pathname.includes('search.html')) {
            searchResults.innerHTML = `
                <div class="container">
                    <div class="offline-message">
                        <i class="fas fa-wifi-slash"></i>
                        <h3>Sin conexión a Internet</h3>
                        <p>No puedes realizar búsquedas sin conexión. Mientras tanto, puedes:</p>
                        <ul>
                            <li>Ver tus <a href="favorites.html">favoritos guardados</a></li>
                            <li>Explorar contenido ya cargado</li>
                        </ul>
                    </div>
                </div>
            `;
        }

        // En elementos de carga
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            if (!element.classList.contains('offline-message-added')) {
                element.innerHTML = `
                    <i class="fas fa-wifi-slash"></i>
                    <p>Sin conexión - No se puede cargar contenido nuevo</p>
                    <p><a href="favorites.html">Ver favoritos guardados</a></p>
                `;
                element.classList.add('offline-message-added');
            }
        });
    }

    // Ocultar mensajes de offline
    hideOfflineMessages() {
        const offlineMessages = document.querySelectorAll('.offline-message');
        offlineMessages.forEach(message => {
            message.remove();
        });

        // Restaurar elementos de carga originales si es necesario
        const modifiedLoading = document.querySelectorAll('.loading.offline-message-added');
        modifiedLoading.forEach(element => {
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
            element.classList.remove('offline-message-added');
        });
    }

    // Mostrar notificación cuando se establece conexión
    showOnlineNotification() {
        // Calcular tiempo que estuvimos offline
        const offlineTime = Date.now() - this.lastOnlineTime;
        const offlineMinutes = Math.floor(offlineTime / (1000 * 60));
        
        let message = '¡Conexión restaurada!';
        if (offlineMinutes > 1) {
            message += ` (Estuviste offline ${offlineMinutes} minutos)`;
        }

        ui.showMessage(message, 'success');

        // Si hay notificaciones habilitadas, enviar una
        if (window.notificationManager && window.notificationManager.permission === 'granted') {
            window.notificationManager.showNotification(
                '🌐 Conexión restaurada',
                'Ya puedes buscar música nueva y explorar contenido online.',
                {
                    tag: 'connection-restored',
                    icon: 'images/icons/icon-192x192.png'
                }
            );
        }
    }

    // Mostrar notificación cuando se pierde conexión
    showOfflineNotification() {
        ui.showMessage('Sin conexión a Internet. Puedes seguir viendo tus favoritos.', 'warning');
    }

    // Mostrar estado inicial
    showInitialStatus() {
        // Solo mostrar si estamos offline al cargar
        if (!this.isOnline) {
            setTimeout(() => {
                this.showOfflineNotification();
            }, 1000);
        }
    }

    // Método público para verificar estado
    getConnectionStatus() {
        return {
            isOnline: this.isOnline,
            lastOnlineTime: this.lastOnlineTime,
            timeSinceLastOnline: Date.now() - this.lastOnlineTime
        };
    }

    // Método para mostrar/ocultar manualmente el indicador
    showStatusIndicator() {
        if (this.statusIndicator) {
            this.statusIndicator.classList.add('visible');
        }
    }

    hideStatusIndicator() {
        if (this.statusIndicator) {
            this.statusIndicator.classList.remove('visible');
        }
    }
}

// CSS para los estilos de estado de red
const networkStatusStyles = `
/* Indicador de estado de red */
.network-status {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 9999;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 200px;
}

.network-status.visible {
    transform: translateX(0);
    opacity: 1;
}

.network-status.online {
    background-color: #28a745;
    border-left: 4px solid #1e7e34;
}

.network-status.offline {
    background-color: #dc3545;
    border-left: 4px solid #c82333;
    transform: translateX(0);
    opacity: 1;
}

.status-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-content i {
    font-size: 16px;
}

/* Estilos para modo offline */
body.offline {
    filter: grayscale(20%);
}

body.offline header {
    background-color: #6c757d;
}

body.offline .btn:not(.btn-offline-safe) {
    opacity: 0.6;
    cursor: not-allowed;
}

body.offline .btn.offline-disabled {
    background-color: #6c757d !important;
    border-color: #6c757d !important;
}

body.offline .btn.offline-disabled:hover {
    transform: none !important;
    box-shadow: none !important;
}

/* Mensaje de offline */
.offline-message {
    text-align: center;
    padding: 3rem 2rem;
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 2px dashed #dee2e6;
    margin: 2rem 0;
}

.offline-message i {
    font-size: 3rem;
    color: #6c757d;
    margin-bottom: 1rem;
}

.offline-message h3 {
    color: #495057;
    margin-bottom: 1rem;
}

.offline-message p {
    color: #6c757d;
    margin-bottom: 1rem;
}

.offline-message ul {
    text-align: left;
    max-width: 300px;
    margin: 0 auto;
    color: #6c757d;
}

.offline-message a {
    color: var(--primary-color);
    text-decoration: underline;
}

.offline-message a:hover {
    color: var(--accent-color);
}

/* Estilos para el header en modo offline */
header.offline-mode {
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    position: relative;
}

header.offline-mode::after {
    content: "MODO OFFLINE";
    position: absolute;
    top: 0;
    right: 0;
    background-color: rgba(220, 53, 69, 0.9);
    color: white;
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

/* Responsive */
@media (max-width: 768px) {
    .network-status {
        top: 70px;
        right: 10px;
        left: 10px;
        max-width: none;
        text-align: center;
    }
    
    .offline-message {
        padding: 2rem 1rem;
    }
    
    .offline-message i {
        font-size: 2rem;
    }
    
    header.offline-mode::after {
        font-size: 9px;
        padding: 1px 6px;
    }
}

@media (max-width: 576px) {
    .network-status {
        font-size: 13px;
        padding: 10px 12px;
    }
}
`;

// Agregar estilos al documento
if (!document.getElementById('network-status-styles')) {
    const style = document.createElement('style');
    style.id = 'network-status-styles';
    style.textContent = networkStatusStyles;
    document.head.appendChild(style);
}

// Crear instancia global del manager de estado de red
window.networkStatusManager = new NetworkStatusManager();