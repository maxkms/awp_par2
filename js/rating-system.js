// rating-system.js - Sistema de valoraciones y comentarios

class RatingSystem {
    constructor() {
        this.ratings = this.loadRatings();
        this.comments = this.loadComments();
        this.init();
    }

    // Inicializar el sistema
    init() {
        this.addRatingComponents();
        this.setupEventListeners();
    }

    // Cargar valoraciones del localStorage
    loadRatings() {
        const ratings = localStorage.getItem('spotifyRatings');
        return ratings ? JSON.parse(ratings) : {};
    }

    // Cargar comentarios del localStorage
    loadComments() {
        const comments = localStorage.getItem('spotifyComments');
        return comments ? JSON.parse(comments) : {};
    }

    // Guardar valoraciones en localStorage
    saveRatings() {
        localStorage.setItem('spotifyRatings', JSON.stringify(this.ratings));
    }

    // Guardar comentarios en localStorage
    saveComments() {
        localStorage.setItem('spotifyComments', JSON.stringify(this.comments));
    }

    // Agregar componentes de valoración a las páginas
    addRatingComponents() {
        // Observer para detectar cuando se cargan nuevos elementos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.addRatingToElements(node);
                    }
                });
            });
        });

        // Observar cambios en contenedores principales
        const containers = [
            document.getElementById('artist-detail'),
            document.getElementById('album-detail'),
            document.getElementById('popular-artists'),
            document.getElementById('artists-results'),
            document.getElementById('albums-results'),
            document.getElementById('tracks-results')
        ];

        containers.forEach(container => {
            if (container) {
                observer.observe(container, { childList: true, subtree: true });
                // También agregar a elementos existentes
                this.addRatingToElements(container);
            }
        });

        // Agregar a elementos ya existentes en la página
        this.addRatingToElements(document);
    }

    // Agregar valoraciones a elementos específicos
    addRatingToElements(container) {
        // Para páginas de detalles (artista/álbum)
        const detailHeaders = container.querySelectorAll ? container.querySelectorAll('.detail-header .action-buttons') : [];
        detailHeaders.forEach(actionButtons => {
            if (!actionButtons.querySelector('.rating-component')) {
                const detailRating = this.createDetailRatingComponent();
                actionButtons.appendChild(detailRating);
            }
        });

        // Para tarjetas de artistas y álbumes
        const cards = container.querySelectorAll ? container.querySelectorAll('.card') : [];
        cards.forEach(card => {
            if (!card.querySelector('.rating-component')) {
                this.addRatingToCard(card);
            }
        });

        // Para tracks
        const tracks = container.querySelectorAll ? container.querySelectorAll('.track-item') : [];
        tracks.forEach(track => {
            if (!track.querySelector('.rating-component')) {
                this.addRatingToTrack(track);
            }
        });
    }

    // Crear componente de valoración para páginas de detalle
    createDetailRatingComponent() {
        const itemId = this.getCurrentItemId();
        const itemType = this.getCurrentItemType();
        const currentRating = this.ratings[`${itemType}_${itemId}`] || 0;
        
        const component = document.createElement('div');
        component.className = 'rating-component detail-rating';
        component.innerHTML = `
            <div class="rating-section">
                <h4>Tu valoración</h4>
                <div class="star-rating" data-id="${itemId}" data-type="${itemType}">
                    ${this.createStarHTML(currentRating)}
                </div>
                <span class="rating-text">${this.getRatingText(currentRating)}</span>
            </div>
            <button class="btn btn-sm btn-comments" data-id="${itemId}" data-type="${itemType}">
                <i class="fas fa-comment"></i> Comentarios (${this.getCommentCount(itemType, itemId)})
            </button>
        `;
        
        return component;
    }

    // Agregar valoración a tarjetas
    addRatingToCard(card) {
        const itemId = card.dataset.id;
        if (!itemId) return;

        const itemType = this.getItemTypeFromCard(card);
        const currentRating = this.ratings[`${itemType}_${itemId}`] || 0;
        
        const cardContent = card.querySelector('.card-content');
        if (cardContent) {
            const ratingDiv = document.createElement('div');
            ratingDiv.className = 'rating-component card-rating';
            ratingDiv.innerHTML = `
                <div class="star-rating compact" data-id="${itemId}" data-type="${itemType}">
                    ${this.createStarHTML(currentRating, true)}
                </div>
            `;
            
            // Insertar antes de las acciones
            const actions = cardContent.querySelector('.card-actions');
            if (actions) {
                cardContent.insertBefore(ratingDiv, actions);
            } else {
                cardContent.appendChild(ratingDiv);
            }
        }
    }

    // Agregar valoración a tracks
    addRatingToTrack(track) {
        const itemId = track.dataset.id;
        if (!itemId) return;

        const currentRating = this.ratings[`track_${itemId}`] || 0;
        
        const trackActions = track.querySelector('.track-actions');
        if (trackActions) {
            const ratingDiv = document.createElement('div');
            ratingDiv.className = 'rating-component track-rating';
            ratingDiv.innerHTML = `
                <div class="star-rating mini" data-id="${itemId}" data-type="track">
                    ${this.createStarHTML(currentRating, false, true)}
                </div>
            `;
            
            trackActions.appendChild(ratingDiv);
        }
    }

    // Crear HTML de estrellas
    createStarHTML(rating, compact = false, mini = false) {
        let starsHTML = '';
        const sizeClass = mini ? 'mini' : (compact ? 'compact' : '');
        
        for (let i = 1; i <= 5; i++) {
            const filled = i <= rating ? 'fas' : 'far';
            starsHTML += `<i class="${filled} fa-star star ${sizeClass}" data-rating="${i}"></i>`;
        }
        
        return starsHTML;
    }

    // Obtener ID del elemento actual (para páginas de detalle)
    getCurrentItemId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || '';
    }

    // Obtener tipo del elemento actual
    getCurrentItemType() {
        if (window.location.pathname.includes('artist.html')) return 'artist';
        if (window.location.pathname.includes('album.html')) return 'album';
        return 'unknown';
    }

    // Obtener tipo de elemento desde tarjeta
    getItemTypeFromCard(card) {
        const parentContainer = card.closest('[id]');
        if (parentContainer) {
            const id = parentContainer.id;
            if (id.includes('artist')) return 'artist';
            if (id.includes('album')) return 'album';
        }
        
        // Fallback: determinar por la página actual
        if (window.location.pathname.includes('search.html')) {
            if (card.closest('#albums-results')) return 'album';
            return 'artist';
        }
        
        return 'artist';
    }

    // Configurar event listeners
    setupEventListeners() {
        // Event listener para clics en estrellas
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('star')) {
                e.preventDefault();
                e.stopPropagation();
                this.handleStarClick(e.target);
            }
        });

        // Event listener para botón de comentarios
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-comments')) {
                e.preventDefault();
                e.stopPropagation();
                this.showCommentsModal(e.target.closest('.btn-comments'));
            }
        });

        // Hover effect para estrellas
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('star')) {
                this.handleStarHover(e.target);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('star')) {
                this.handleStarOut(e.target);
            }
        });
    }

    // Manejar clic en estrella
    handleStarClick(star) {
        const rating = parseInt(star.dataset.rating);
        const starContainer = star.closest('.star-rating');
        const itemId = starContainer.dataset.id;
        const itemType = starContainer.dataset.type;
        
        // Guardar valoración
        this.setRating(itemType, itemId, rating);
        
        // Actualizar visualización
        this.updateStarDisplay(starContainer, rating);
        
        // Actualizar texto de valoración si existe
        const ratingText = starContainer.parentElement.querySelector('.rating-text');
        if (ratingText) {
            ratingText.textContent = this.getRatingText(rating);
        }
        
        // Mostrar mensaje
        ui.showMessage(`Valoración guardada: ${rating} estrella${rating !== 1 ? 's' : ''}`, 'success');
    }

    // Manejar hover en estrella
    handleStarHover(star) {
        const rating = parseInt(star.dataset.rating);
        const starContainer = star.closest('.star-rating');
        this.updateStarDisplay(starContainer, rating, true);
    }

    // Manejar cuando se sale del hover
    handleStarOut(star) {
        const starContainer = star.closest('.star-rating');
        const itemId = starContainer.dataset.id;
        const itemType = starContainer.dataset.type;
        const actualRating = this.ratings[`${itemType}_${itemId}`] || 0;
        this.updateStarDisplay(starContainer, actualRating);
    }

    // Actualizar visualización de estrellas
    updateStarDisplay(container, rating, isHover = false) {
        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            const starRating = index + 1;
            if (starRating <= rating) {
                star.className = star.className.replace('far', 'fas');
                if (isHover) {
                    star.style.color = '#ffc107';
                } else {
                    star.style.color = '';
                }
            } else {
                star.className = star.className.replace('fas', 'far');
                star.style.color = '';
            }
        });
    }

    // Establecer valoración
    setRating(type, id, rating) {
        this.ratings[`${type}_${id}`] = rating;
        this.saveRatings();
    }

    // Obtener valoración
    getRating(type, id) {
        return this.ratings[`${type}_${id}`] || 0;
    }

    // Obtener texto descriptivo de la valoración
    getRatingText(rating) {
        const texts = {
            0: 'Sin valorar',
            1: 'No me gusta',
            2: 'Regular',
            3: 'Bueno',
            4: 'Muy bueno',
            5: 'Excelente'
        };
        return texts[rating] || 'Sin valorar';
    }

    // Obtener cantidad de comentarios
    getCommentCount(type, id) {
        const key = `${type}_${id}`;
        return this.comments[key] ? this.comments[key].length : 0;
    }

    // Mostrar modal de comentarios
    showCommentsModal(button) {
        const itemId = button.dataset.id;
        const itemType = button.dataset.type;
        const itemName = this.getItemName(itemType, itemId);

        // Crear modal
        const modal = document.createElement('div');
        modal.id = 'comments-modal';
        modal.className = 'comments-modal';
        modal.innerHTML = `
            <div class="comments-modal-content">
                <div class="comments-modal-header">
                    <h3>Comentarios - ${itemName}</h3>
                    <button class="comments-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="comments-modal-body">
                    <div class="comments-list" id="comments-list">
                        ${this.renderComments(itemType, itemId)}
                    </div>
                    <form class="comment-form" id="comment-form">
                        <div class="form-group">
                            <label for="comment-author">Tu nombre (opcional):</label>
                            <input type="text" id="comment-author" placeholder="Anónimo" maxlength="50">
                        </div>
                        <div class="form-group">
                            <label for="comment-text">Comentario:</label>
                            <textarea id="comment-text" placeholder="Escribe tu comentario..." required maxlength="500" rows="3"></textarea>
                            <div class="char-counter">
                                <span id="char-count">0</span>/500
                            </div>
                        </div>
                        <button type="submit" class="btn">
                            <i class="fas fa-comment"></i> Agregar comentario
                        </button>
                    </form>
                </div>
            </div>
            <div class="comments-modal-overlay"></div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.comments-modal-close').addEventListener('click', () => {
            this.closeCommentsModal();
        });

        modal.querySelector('.comments-modal-overlay').addEventListener('click', () => {
            this.closeCommentsModal();
        });

        modal.querySelector('#comment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addComment(itemType, itemId, button);
        });

        // Contador de caracteres
        const textarea = modal.querySelector('#comment-text');
        const charCount = modal.querySelector('#char-count');
        textarea.addEventListener('input', () => {
            charCount.textContent = textarea.value.length;
        });

        // Mostrar modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
    }

    // Renderizar lista de comentarios
    renderComments(type, id) {
        const key = `${type}_${id}`;
        const comments = this.comments[key] || [];
        
        if (comments.length === 0) {
            return '<div class="no-comments">Aún no hay comentarios. ¡Sé el primero en comentar!</div>';
        }

        return comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <strong class="comment-author">${comment.author}</strong>
                    <span class="comment-date">${this.formatDate(comment.date)}</span>
                </div>
                <div class="comment-text">${this.escapeHtml(comment.text)}</div>
            </div>
        `).join('');
    }

    // Agregar comentario
    addComment(type, id, button) {
        const modal = document.getElementById('comments-modal');
        const author = modal.querySelector('#comment-author').value.trim() || 'Anónimo';
        const text = modal.querySelector('#comment-text').value.trim();

        if (!text) {
            ui.showMessage('El comentario no puede estar vacío', 'error');
            return;
        }

        const key = `${type}_${id}`;
        if (!this.comments[key]) {
            this.comments[key] = [];
        }

        const comment = {
            id: Date.now(),
            author: author,
            text: text,
            date: new Date().toISOString()
        };

        this.comments[key].push(comment);
        this.saveComments();

        // Actualizar contador en el botón
        const commentCount = this.getCommentCount(type, id);
        button.innerHTML = `<i class="fas fa-comment"></i> Comentarios (${commentCount})`;

        // Actualizar lista de comentarios en el modal
        const commentsList = modal.querySelector('#comments-list');
        commentsList.innerHTML = this.renderComments(type, id);

        // Limpiar formulario
        modal.querySelector('#comment-form').reset();
        modal.querySelector('#char-count').textContent = '0';

        ui.showMessage('Comentario agregado exitosamente', 'success');
    }

    // Obtener nombre del elemento
    getItemName(type, id) {
        if (type === 'artist' || type === 'album') {
            const title = document.querySelector('.detail-header h1');
            if (title) return title.textContent;
        }
        
        const card = document.querySelector(`.card[data-id="${id}"]`);
        if (card) {
            const title = card.querySelector('.card-title');
            if (title) return title.textContent;
        }
        
        return `${type === 'artist' ? 'Artista' : type === 'album' ? 'Álbum' : 'Canción'}`;
    }

    // Cerrar modal de comentarios
    closeCommentsModal() {
        const modal = document.getElementById('comments-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // Formatear fecha
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    // Escapar HTML para prevenir XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Obtener estadísticas de valoraciones
    getRatingStats(type, id) {
        const rating = this.getRating(type, id);
        const commentCount = this.getCommentCount(type, id);
        
        return {
            rating,
            commentCount,
            hasRating: rating > 0,
            hasComments: commentCount > 0
        };
    }
}

// CSS para el sistema de valoraciones
const ratingStyles = `
/* Componente de valoración */
.rating-component {
    margin: 0.5rem 0;
}

.rating-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: var(--text-color);
}

.star-rating {
    display: flex;
    gap: 4px;
    margin: 0.3rem 0;
}

.star-rating.compact {
    gap: 2px;
}

.star-rating.mini {
    gap: 1px;
}

.star {
    color: #ddd;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 18px;
}

.star.compact {
    font-size: 14px;
}

.star.mini {
    font-size: 12px;
}

.star:hover {
    color: #ffc107;
    transform: scale(1.1);
}

.star.fas {
    color: #ffc107;
}

.rating-text {
    font-size: 0.85rem;
    color: var(--text-light);
    margin-left: 0.5rem;
}

.btn-comments {
    margin-top: 0.5rem;
    gap: 0.5rem;
}

/* Modal de comentarios */
.comments-modal {
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

.comments-modal.show {
    opacity: 1;
    visibility: visible;
}

.comments-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
}

.comments-modal-content {
    background: white;
    border-radius: 16px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    position: relative;
    z-index: 1;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    transform: translateY(20px);
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
}

.comments-modal.show .comments-modal-content {
    transform: translateY(0);
}

.comments-modal-header {
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.comments-modal-header h3 {
    margin: 0;
    color: var(--secondary-color);
    font-size: 1.3rem;
}

.comments-modal-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    color: var(--text-light);
    transition: all 0.2s ease;
}

.comments-modal-close:hover {
    background-color: #f5f5f5;
    color: var(--text-color);
}

.comments-modal-body {
    padding: 1.5rem 2rem 2rem;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.comments-list {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 2rem;
    flex-shrink: 0;
}

.no-comments {
    text-align: center;
    color: var(--text-light);
    padding: 2rem;
    font-style: italic;
}

.comment-item {
    border-bottom: 1px solid #f0f0f0;
    padding: 1rem 0;
}

.comment-item:last-child {
    border-bottom: none;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.comment-author {
    color: var(--primary-color);
    font-size: 0.9rem;
}

.comment-date {
    color: var(--text-light);
    font-size: 0.8rem;
}

.comment-text {
    color: var(--text-color);
    line-height: 1.5;
    white-space: pre-wrap;
}

.comment-form {
    border-top: 1px solid #eee;
    padding-top: 1.5rem;
    flex-shrink: 0;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-color);
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary-color);
}

.char-counter {
    text-align: right;
    font-size: 0.8rem;
    color: var(--text-light);
    margin-top: 0.3rem;
}

/* Responsive */
@media (max-width: 768px) {
    .comments-modal-content {
        width: 95%;
        max-height: 85vh;
    }
    
    .comments-modal-header,
    .comments-modal-body {
        padding: 1rem;
    }
    
    .comments-modal-header h3 {
        font-size: 1.1rem;
    }
    
    .star {
        font-size: 16px;
    }
    
    .star.compact {
        font-size: 12px;
    }
    
    .star.mini {
        font-size: 10px;
    }
}

@media (max-width: 576px) {
    .comments-modal-content {
        width: 98%;
        margin: 1rem;
    }
    
    .comments-list {
        max-height: 200px;
    }
}
`;

// Agregar estilos al documento
if (!document.getElementById('rating-styles')) {
    const style = document.createElement('style');
    style.id = 'rating-styles';
    style.textContent = ratingStyles;
    document.head.appendChild(style);
}

// Crear instancia global del sistema de valoraciones
window.ratingSystem = new RatingSystem();