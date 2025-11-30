// Variáveis globais
let currentBookId = null;

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    currentBookId = document.getElementById('bookId').value;
    loadBookData();
    setupForm();
    setupModal();
});

// Carregar dados do livro
async function loadBookData() {
    if (!currentBookId) {
        showNotification('ID do livro não encontrado', 'error');
        return;
    }
    
    try {
        showFormLoading();
        const book = await BookAPI.get(`/api/books/${currentBookId}`);
        populateForm(book);
    } catch (error) {
        console.error('Erro ao carregar dados do livro:', error);
        showNotification('Erro ao carregar dados do livro', 'error');
        // Redirecionar para a página principal após erro
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    } finally {
        hideFormLoading();
    }
}

// Popular formulário com dados do livro
function populateForm(book) {
    document.getElementById('title').value = book.title || '';
    document.getElementById('author').value = book.author || '';
    document.getElementById('year').value = book.year || '';
    document.getElementById('genre').value = book.genre || '';
    document.getElementById('description').value = book.description || '';
    
    // NOVO: Preencher rating e reading_status
    const rating = book.rating || 0;
    document.getElementById('rating').value = rating;
    setRatingDisplay(rating);
    
    const readingStatus = book.reading_status || 'want_to_read';
    document.getElementById('reading_status').value = readingStatus;
}

// Configurar formulário
function setupForm() {
    const form = document.getElementById('editBookForm');
    if (!form) return;
    
    form.addEventListener('submit', handleSubmit);
    
    // Adicionar validação em tempo real
    const requiredFields = form.querySelectorAll('input[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearFieldError);
    });
    
    // Validação do ano
    const yearField = document.getElementById('year');
    if (yearField) {
        yearField.addEventListener('input', validateYear);
    }
    
    // Configurar estrelas de rating
    setupRatingStars();
}

// Configurar estrelas de rating
function setupRatingStars() {
    const stars = document.querySelectorAll('#ratingStars .star');
    const ratingInput = document.getElementById('rating');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            ratingInput.value = value;
            setRatingDisplay(value);
        });
        
        star.addEventListener('mouseover', function() {
            const value = this.getAttribute('data-value');
            highlightStars(value);
        });
    });
    
    // Remover highlight ao sair da area de estrelas
    document.getElementById('ratingStars').addEventListener('mouseleave', function() {
        const currentRating = ratingInput.value || 0;
        setRatingDisplay(currentRating);
    });
}

function highlightStars(value) {
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach(star => {
        const starValue = star.getAttribute('data-value');
        if (starValue <= value) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function setRatingDisplay(value) {
    highlightStars(value);
    const ratingText = document.getElementById('ratingText');
    const ratings = {
        '0': 'Sem avaliacao',
        '1': 'Pessimo',
        '2': 'Ruim',
        '3': 'Bom',
        '4': 'Muito Bom',
        '5': 'Excelente'
    };
    ratingText.textContent = ratings[value] || 'Sem avaliacao';
}

// Configurar modal
function setupModal() {
    const modal = document.getElementById('successModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.addEventListener('click', closeSuccessModal);
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeSuccessModal();
        }
    });
}

// Manipular envio do formulário
async function handleSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const formData = getFormData();
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    try {
        // Desabilitar botão e mostrar loading
        setButtonLoading(submitButton, true);
        
        await BookAPI.request(`/api/books/${currentBookId}`, 'PUT', formData);
        
        showSuccessModal();
        
    } catch (error) {
        console.error('Erro ao atualizar livro:', error);
        showNotification('Erro ao atualizar livro. Tente novamente.', 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// Obter dados do formulário
function getFormData() {
    const form = document.getElementById('editBookForm');
    const formData = new FormData(form);
    
    const data = {
        title: formData.get('title').trim(),
        author: formData.get('author').trim(),
        genre: formData.get('genre').trim() || null,
        description: formData.get('description').trim() || null,
        rating: parseInt(formData.get('rating')) || 0,  // NOVO: Rating
        reading_status: formData.get('reading_status') || 'want_to_read'  // NOVO: Status de leitura
    };
    
    const year = formData.get('year');
    if (year && year.trim()) {
        data.year = parseInt(year);
    }
    
    return data;
}

// Validar formulário
function validateForm() {
    let isValid = true;
    
    // Validar campos obrigatórios
    const title = document.getElementById('title');
    const author = document.getElementById('author');
    
    if (!validateField({ target: title })) {
        isValid = false;
    }
    
    if (!validateField({ target: author })) {
        isValid = false;
    }
    
    // Validar ano
    const year = document.getElementById('year');
    if (year.value && !validateYear({ target: year })) {
        isValid = false;
    }
    
    return isValid;
}

// Validar campo individual
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    clearFieldError(event);
    
    if (field.required && !value) {
        showFieldError(field, 'Este campo é obrigatório');
        return false;
    }
    
    if (value.length > 255) {
        showFieldError(field, 'Este campo deve ter no máximo 255 caracteres');
        return false;
    }
    
    return true;
}

// Validar ano
function validateYear(event) {
    const field = event.target;
    const value = field.value;
    
    clearFieldError(event);
    
    if (value && (isNaN(value) || value < 1000 || value > new Date().getFullYear() + 1)) {
        showFieldError(field, 'Digite um ano válido');
        return false;
    }
    
    return true;
}

// Mostrar erro no campo
function showFieldError(field, message) {
    // Remove erro existente
    clearFieldError({ target: field });
    
    // Adiciona classe de erro
    field.classList.add('field-error');
    
    // Cria elemento de erro
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error-message';
    errorElement.textContent = message;
    
    // Adiciona estilos
    errorElement.style.cssText = `
        color: #dc3545;
        font-size: 0.85rem;
        margin-top: 5px;
        display: flex;
        align-items: center;
        gap: 5px;
    `;
    
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    // Insere após o campo
    field.parentNode.insertBefore(errorElement, field.nextSibling);
    
    // Adiciona estilo de erro ao campo
    field.style.borderColor = '#dc3545';
}

// Limpar erro do campo
function clearFieldError(event) {
    const field = event.target;
    
    // Remove classe de erro
    field.classList.remove('field-error');
    
    // Remove mensagem de erro
    const errorMessage = field.parentNode.querySelector('.field-error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
    
    // Restaura estilo do campo
    field.style.borderColor = '';
}

// Modal de sucesso
function showSuccessModal() {
    document.getElementById('successModal').style.display = 'block';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    // Redirecionar para a página principal após fechar o modal
    window.location.href = '/';
}

// Controle do botão de loading
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-save"></i> Atualizar Livro';
    }
}

// Loading do formulário
function showFormLoading() {
    const form = document.getElementById('editBookForm');
    const inputs = form.querySelectorAll('input, textarea, button');
    
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // Adicionar indicador de loading
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'form-loading';
    loadingIndicator.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: #667eea;"></i>
            <p style="margin-top: 10px; color: #666;">Carregando dados do livro...</p>
        </div>
    `;
    
    form.insertBefore(loadingIndicator, form.firstChild);
}

function hideFormLoading() {
    const form = document.getElementById('editBookForm');
    const inputs = form.querySelectorAll('input, textarea, button');
    
    inputs.forEach(input => {
        input.disabled = false;
    });
    
    // Remover indicador de loading
    const loadingIndicator = document.getElementById('form-loading');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Adicionar estilos para campos com erro (reutilizando do add_book.js)
if (!document.querySelector('#form-error-styles')) {
    const style = document.createElement('style');
    style.id = 'form-error-styles';
    style.textContent = `
        .field-error {
            border-color: #dc3545 !important;
            box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
        }
        
        .field-error-message {
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}


// Google Books API Integration for Edit Page
document.addEventListener('DOMContentLoaded', function() {
    setupGoogleBooksSearch();
});

function setupGoogleBooksSearch() {
    const searchInput = document.getElementById('googleBooksQuery');
    const searchButton = document.getElementById('searchGoogleBooks');
    const resultsContainer = document.getElementById('searchResults');
    
    if (!searchInput || !searchButton || !resultsContainer) return;
    
    // Event listeners
    searchButton.addEventListener('click', performGoogleBooksSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performGoogleBooksSearch();
        }
    });
    
    // Limpar resultados quando o input for limpo
    searchInput.addEventListener('input', function() {
        if (!this.value.trim()) {
            hideSearchResults();
        }
    });
}

async function performGoogleBooksSearch() {
    const searchInput = document.getElementById('googleBooksQuery');
    const searchButton = document.getElementById('searchGoogleBooks');
    const resultsContainer = document.getElementById('searchResults');
    
    const query = searchInput.value.trim();
    if (!query) {
        showNotification('Digite o nome do livro para buscar', 'warning');
        return;
    }
    
    try {
        // Mostrar loading
        setSearchButtonLoading(searchButton, true);
        showSearchLoading(resultsContainer);
        
        // Fazer requisição para a API
        const response = await fetch(`/api/search-google-books?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro na busca');
        }
        
        // Mostrar resultados
        displaySearchResults(data, resultsContainer);
        
    } catch (error) {
        console.error('Erro na busca:', error);
        showSearchError(resultsContainer, error.message);
    } finally {
        setSearchButtonLoading(searchButton, false);
    }
}

function showSearchLoading(container) {
    container.style.display = 'block';
    container.innerHTML = `
        <div class="search-loading">
            <i class="fas fa-spinner"></i>
            Buscando livros na Google Books...
        </div>
    `;
}

function displaySearchResults(data, container) {
    container.style.display = 'block';
    
    if (!data.books || data.books.length === 0) {
        container.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                Nenhum livro encontrado. Tente uma busca diferente.
            </div>
        `;
        return;
    }
    
    const resultsHTML = data.books.map(book => `
        <div class="search-result-item" onclick="selectGoogleBook(${JSON.stringify(book).replace(/"/g, '&quot;')})">
            <img src="${book.thumbnail || '/static/img/book-placeholder.png'}" 
                 alt="${book.title}" 
                 class="result-thumbnail"
                 onerror="this.src='/static/img/book-placeholder.png'">
            <div class="result-info">
                <div class="result-title">${book.title}</div>
                <div class="result-author">${book.author || 'Autor não informado'}</div>
                <div class="result-details">
                    ${book.year ? `${book.year} • ` : ''}
                    ${book.genre || 'Gênero não informado'}
                    ${book.publisher ? ` • ${book.publisher}` : ''}
                </div>
                <div class="result-description">
                    ${book.description ? book.description.substring(0, 150) + '...' : 'Descrição não disponível'}
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = resultsHTML;
}

function selectGoogleBook(book) {
    // Preencher os campos do formulário
    document.getElementById('title').value = book.title || '';
    document.getElementById('author').value = book.author || '';
    document.getElementById('year').value = book.year || '';
    document.getElementById('genre').value = book.genre || '';
    document.getElementById('description').value = book.description || '';
    
    // Limpar a busca
    document.getElementById('googleBooksQuery').value = '';
    hideSearchResults();
    
    // Mostrar notificação de sucesso
    showNotification('Campos atualizados automaticamente!', 'success');
    
    // Focar no primeiro campo para o usuário revisar
    document.getElementById('title').focus();
}

function showSearchError(container, message) {
    container.style.display = 'block';
    container.innerHTML = `
        <div class="search-error">
            <i class="fas fa-exclamation-triangle"></i>
            Erro na busca: ${message}
        </div>
    `;
}

function hideSearchResults() {
    const resultsContainer = document.getElementById('searchResults');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
    }
}

function setSearchButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-search"></i> Buscar';
    }
}

