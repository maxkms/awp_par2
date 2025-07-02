// sharing.js - Sistema para compartir contenido

class SharingManager {
    constructor() {
        this.isWebShareSupported = navigator.share && navigator.canShare;
        this.init();
    }

    // Inicializar el sistema de compartir
    init() {
        this.addSharingButtons();
        this.setupEventListeners();
    }

    // Agregar botones de compartir a las páginas existentes
    addSharingButtons() {
        // Agregar botón de compartir en páginas de detalles
        this.addDetailPageSharingButtons();
        
        // Agregar botones de compartir en tarjetas de resultados
        this.addCardSharingButtons();
    }

    // Agregar botones de compartir en páginas de detalles
    addDetailPageSharingButtons() {
        // Para página de artista
        const artistDetail = document.querySelector('.detail-header .action-buttons');
        if (artistDetail && window.location.pathname.includes('artist.html')) {
            const shareButton = this.createShareButton('artist');
            artistDetail.appendChild(shareButton);
        }

        // Para página de álbum
        const albumDetail = document.querySelector('.detail-header .action-buttons');
        if (albumDetail && window.location.pathname.includes('album.html')) {
            const shareButton = this.createShareButton('album');
            albumDetail.appendChild(shareButton);
        }
    }

    // Agregar botones de compartir en tarjetas
    addCardSharingButtons() {
        // Observer para nuevas tarjetas que se agreguen dinámicamente
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Buscar tarjetas en el nodo agregado
                        const cards = node.querySelectorAll ? node.querySelectorAll('.card') : [];
                        const trackItems = node.querySelectorAll ? node.querySelectorAll('.track-item') : [];
                        
                        cards.forEach(card => this.addShareButtonToCard(card));
                        trackItems.forEach(track => this.addShareButtonToTrack(track));

                        // Si el nodo mismo es una tarjeta
                        if (node.classList && node.classList.contains('card')) {
                            this.addShareButtonToCard(node);
                        }
                        if (node.classList && node.classList.contains('track-item')) {
                            this.addShareButtonToTrack(node);
                        }
                    }
                });
            });
        });

        // Observar cambios en los contenedores principales
        const containers = [
            document.getElementById('popular-artists'),
            document.getElementById('artists-results'),
            document.getElementById('albums-results'),
            document.getElementById('tracks-results'),
            document.getElementById('top-tracks'),
            document.getElementById('artist-albums'),
            document.getElementById('album-tracks')
        ];

        containers.forEach(container => {
            if (container) {
                observer.observe(container, { childList: true, subtree: true });
                
                // También agregar a elementos existentes
                container.querySelectorAll('.card').forEach(card => this.addShareButtonToCard(card));
                container.querySelectorAll('.track-item').forEach(track => this.addShareButtonToTrack(track));
            }
        });
    }

    // Crear botón de compartir
    createShareButton(type = 'general', size = 'normal') {
        const button = document.createElement('button');
        
        if (size === 'small') {
            button.className = 'btn-icon btn-share';
            button.innerHTML = '<i class="fas fa-share-alt"></i>';
            button.title = 'Compartir';
        } else {
            button.className = 'btn btn-sm btn-share';
            button.innerHTML = '<i class="fas fa-share-alt"></i> Compartir';
        }
        
        button.dataset.shareType = type;
        return button;
    }

    // Agregar botón de compartir a una tarjeta
    addShareButtonToCard(card) {
        const actions = card.querySelector('.card-actions');
        if (actions && !actions.querySelector('.btn-share')) {
            const shareButton = this.createShareButton('card', 'small');
            actions.appendChild(shareButton);
        }
    }

    // Agregar botón de compartir a un track
    addShareButtonToTrack(track) {
        const actions = track.querySelector('.track-actions');
        if (actions && !actions.querySelector('.btn-share')) {
            const shareButton = this.createShareButton('track', 'small');
            actions.appendChild(shareButton);
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Delegación de eventos para botones de compartir
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-share')) {
                e.preventDefault();
                e.stopPropagation();
                this.handleShareClick(e.target.closest('.btn-share'));
            }
        });
    }

    // Manejar clic en botón de compartir
    async handleShareClick(button) {
        const shareType = button.dataset.shareType;
        const shareData = this.getShareData(button, shareType);

        try {
            if (this.isWebShareSupported && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                ui.showMessage('¡Contenido compartido exitosamente!', 'success');
            } else {
                this.showShareModal(shareData);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error al compartir:', error);
                this.showShareModal(shareData);
            }
        }
    }

    // Obtener datos para compartir basado en el contexto
    getShareData(button, shareType) {
        const currentUrl = window.location.href;
        
        switch (shareType) {
            case 'artist':
                return this.getArtistShareData();
            case 'album':
                return this.getAlbumShareData();
            case 'card':
                return this.getCardShareData(button);
            case 'track':
                return this.getTrackShareData(button);
            default:
                return {
                    title: 'SpotifyExplorer',
                    text: 'Descubre música increíble con SpotifyExplorer',
                    url: currentUrl
                };
        }
    }

    // Datos para compartir artista
    getArtistShareData() {
        const artistName = document.querySelector('.detail-header h1')?.textContent || 'Artista';
        const urlParams = new URLSearchParams(window.location.search);
        const artistId = urlParams.get('id');
        
        return {
            title: `${artistName} - SpotifyExplorer`,
            text: `¡Descubre la música de ${artistName}! Ve sus canciones populares y álbumes.`,
            url: `${window.location.origin}/artist.html?id=${artistId}`
        };
    }

    // Datos para compartir álbum
    getAlbumShareData() {
        const albumName = document.querySelector('.detail-header h1')?.textContent || 'Álbum';
        const artistName = document.querySelector('.detail-header p')?.textContent || 'Artista';
        const urlParams = new URLSearchParams(window.location.search);
        const albumId = urlParams.get('id');
        
        return {
            title: `${albumName} - ${artistName}`,
            text: `¡Escucha "${albumName}" de ${artistName}! Un álbum increíble que debes conocer.`,
            url: `${window.location.origin}/album.html?id=${albumId}`
        };
    }

    // Datos para compartir desde tarjeta
    getCardShareData(button) {
        const card = button.closest('.card');
        const title = card.querySelector('.card-title')?.textContent || 'Música';
        const artist = card.querySelector('.card-text')?.textContent || '';
        const id = card.dataset.id;
        
        // Determinar si es artista o álbum basado en la página actual
        const isAlbum = window.location.pathname.includes('search.html') && 
                       card.closest('#albums-results');
        
        const pageUrl = isAlbum ? `/album.html?id=${id}` : `/artist.html?id=${id}`;
        
        return {
            title: `${title} - SpotifyExplorer`,
            text: `¡Descubre "${title}"${artist ? ` - ${artist}` : ''}! Música increíble te espera.`,
            url: `${window.location.origin}${pageUrl}`
        };
    }

    // Datos para compartir track
    getTrackShareData(button) {
        const track = button.closest('.track-item');
        const trackName = track.querySelector('.track-info h3')?.textContent || 'Canción';
        const artistName = track.querySelector('.track-info p')?.textContent || 'Artista';
        
        return {
            title: `${trackName} - ${artistName}`,
            text: `🎵 ¡Escucha "${trackName}" de ${artistName}! Una canción que tienes que conocer.`,
            url: window.location.href
        };
    }

    // Mostrar modal de compartir personalizado
    showShareModal(shareData) {
        // Eliminar modal existente si lo hay
        const existingModal = document.getElementById('share-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'share-modal';
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-content">
                <div class="share-modal-header">
                    <h3>Compartir</h3>
                    <button class="share-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="share-modal-body">
                    <div class="share-preview">
                        <h4>${shareData.title}</h4>
                        <p>${shareData.text}</p>
                        <div class="share-url">${shareData.url}</div>
                    </div>
                    <div class="share-options">
                        <button class="share-option" data-method="copy">
                            <i class="fas fa-copy"></i>
                            <span>Copiar enlace</span>
                        </button>
                        <button class="share-option" data-method="whatsapp">
                            <i class="fab fa-whatsapp"></i>
                            <span>WhatsApp</span>
                        </button>
                        <button class="share-option" data-method="telegram">
                            <i class="fab fa-telegram"></i>
                            <span>Telegram</span>
                        </button>
                        <button class="share-option" data-method="twitter">
                            <i class="fab fa-twitter"></i>
                            <span>Twitter</span>
                        </button>
                        <button class="share-option" data-method="facebook">
                            <i class="fab fa-facebook"></i>
                            <span>Facebook</span>
                        </button>
                        <button class="share-option" data-method="email">
                            <i class="fas fa-envelope"></i>
                            <span>Email</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="share-modal-overlay"></div>
        `;

        document.body.appendChild(modal);

        // Event listeners para el modal
        modal.querySelector('.share-modal-close').addEventListener('click', () => {
            this.closeShareModal();
        });

        modal.querySelector('.share-modal-overlay').addEventListener('click', () => {
            this.closeShareModal();
        });

        // Event listeners para opciones de compartir
        modal.querySelectorAll('.share-option').forEach(option => {
            option.addEventListener('click', () => {
                const method = option.dataset.method;
                this.executeShareMethod(method, shareData);
            });
        });

        // Mostrar modal con animación
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
    }

    // Cerrar modal de compartir
    closeShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // Ejecutar método de compartir específico
    async executeShareMethod(method, shareData) {
        const { title, text, url } = shareData;
        const fullText = `${title}\n\n${text}\n\n${url}`;

        switch (method) {
            case 'copy':
                try {
                    await navigator.clipboard.writeText(url);
                    ui.showMessage('¡Enlace copiado al portapapeles!', 'success');
                    this.closeShareModal();
                } catch (error) {
                    console.error('Error al copiar:', error);
                    // Fallback para navegadores que no soportan clipboard API
                    this.fallbackCopyToClipboard(url);
                }
                break;

            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
                this.closeShareModal();
                break;

            case 'telegram':
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title}\n\n${text}`)}`, '_blank');
                this.closeShareModal();
                break;

            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                this.closeShareModal();
                break;

            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                this.closeShareModal();
                break;

            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullText)}`;
                this.closeShareModal();
                break;

            default:
                console.error('Método de compartir no reconocido:', method);
        }
    }

    // Fallback para copiar al portapapeles en navegadores antiguos
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            ui.showMessage('¡Enlace copiado al portapapeles!', 'success');
            this.closeShareModal();
        } catch (error) {
            console.error('Error al copiar con fallback:', error);
            ui.showMessage('No se pudo copiar el enlace. Selecciona y copia manualmente.', 'error');
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

// CSS para el modal de compartir
const shareStyles = `
.share-modal {
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

.share-modal.show {
    opacity: 1;
    visibility: visible;
}

.share-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
}

.share-modal-content {
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

.share-modal.show .share-modal-content {
    transform: translateY(0);
}

.share-modal-header {
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.share-modal-header h3 {
    margin: 0;
    color: var(--secondary-color);
    font-size: 1.5rem;
}

.share-modal-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    color: var(--text-light);
    transition: all 0.2s ease;
}

.share-modal-close:hover {
    background-color: #f5f5f5;
    color: var(--text-color);
}

.share-modal-body {
    padding: 2rem;
}

.share-preview {
    background-color: #f8f9fa;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border-left: 4px solid var(--primary-color);
}

.share-preview h4 {
    margin: 0 0 0.5rem;
    color: var(--secondary-color);
    font-size: 1.1rem;
}

.share-preview p {
    margin: 0 0 1rem;
    color: var(--text-light);
    line-height: 1.5;
}

.share-url {
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--primary-color);
    background-color: white;
    padding: 0.5rem;
    border-radius: 6px;
    word-break: break-all;
}

.share-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
}

.share-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border: 2px solid #eee;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    color: var(--text-color);
}

.share-option:hover {
    border-color: var(--primary-color);
    background-color: var(--primary-light);
    transform: translateY(-2px);
}

.share-option i {
    font-size: 1.5rem;
    color: var(--text-light);
    transition: color 0.2s ease;
}

.share-option:hover i {
    color: var(--primary-color);
}

.share-option span {
    font-size: 0.85rem;
    font-weight: 500;
}

/* Colores específicos para cada plataforma */
.share-option[data-method="whatsapp"]:hover {
    border-color: #25D366;
    background-color: rgba(37, 211, 102, 0.1);
}

.share-option[data-method="whatsapp"]:hover i {
    color: #25D366;
}

.share-option[data-method="telegram"]:hover {
    border-color: #0088cc;
    background-color: rgba(0, 136, 204, 0.1);
}

.share-option[data-method="telegram"]:hover i {
    color: #0088cc;
}

.share-option[data-method="twitter"]:hover {
    border-color: #1DA1F2;
    background-color: rgba(29, 161, 242, 0.1);
}

.share-option[data-method="twitter"]:hover i {
    color: #1DA1F2;
}

.share-option[data-method="facebook"]:hover {
    border-color: #4267B2;
    background-color: rgba(66, 103, 178, 0.1);
}

.share-option[data-method="facebook"]:hover i {
    color: #4267B2;
}

.share-option[data-method="email"]:hover {
    border-color: #EA4335;
    background-color: rgba(234, 67, 53, 0.1);
}

.share-option[data-method="email"]:hover i {
    color: #EA4335;
}

.share-option[data-method="copy"]:hover {
    border-color: #6c757d;
    background-color: rgba(108, 117, 125, 0.1);
}

.share-option[data-method="copy"]:hover i {
    color: #6c757d;
}

/* Estilos para el botón de compartir */
.btn-share {
    gap: 0.5rem;
}

.btn-icon.btn-share {
    color: var(--text-light);
}

.btn-icon.btn-share:hover {
    background-color: rgba(29, 185, 84, 0.1);
    color: var(--primary-color);
    transform: scale(1.1);
}

@media (max-width: 576px) {
    .share-modal-content {
        width: 95%;
        margin: 1rem;
    }
    
    .share-modal-header,
    .share-modal-body {
        padding: 1.5rem;
    }
    
    .share-options {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .share-option {
        padding: 0.8rem;
    }
}
`;

// Agregar estilos al documento
if (!document.getElementById('share-styles')) {
    const style = document.createElement('style');
    style.id = 'share-styles';
    style.textContent = shareStyles;
    document.head.appendChild(style);
}

// Crear instancia global del manager de compartir
window.sharingManager = new SharingManager();