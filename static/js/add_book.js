// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    setupForm();
    setupModal();
});

// Configurar formulário
function setupForm() {
    const form = document.getElementById('addBookForm');
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
        
        await BookAPI.post('/api/books', formData);
        
        showSuccessModal();
        clearForm();
        
    } catch (error) {
        console.error('Erro ao adicionar livro:', error);
        showNotification('Erro ao adicionar livro. Tente novamente.', 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// Obter dados do formulário
function getFormData() {
    const form = document.getElementById('addBookForm');
    const formData = new FormData(form);
    
    const data = {
        title: formData.get('title').trim(),
        author: formData.get('author').trim(),
        genre: formData.get('genre').trim() || null,
        description: formData.get('description').trim() || null
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

// Limpar formulário
function clearForm() {
    const form = document.getElementById('addBookForm');
    form.reset();
    
    // Limpar erros
    const errorMessages = form.querySelectorAll('.field-error-message');
    errorMessages.forEach(error => error.remove());
    
    const errorFields = form.querySelectorAll('.field-error');
    errorFields.forEach(field => {
        field.classList.remove('field-error');
        field.style.borderColor = '';
    });
}

// Modal de sucesso
function showSuccessModal() {
    document.getElementById('successModal').style.display = 'block';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Controle do botão de loading
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-save"></i> Salvar Livro';
    }
}

// Adicionar estilos para campos com erro
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


// Google Books API Integration
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
    showNotification('Campos preenchidos automaticamente!', 'success');
    
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

// Função auxiliar para mostrar notificações
function showNotification(message, type = 'info') {
    // Remove notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Cria nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        ${message}
    `;
    
    // Estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    // Cores por tipo
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Adiciona ao DOM
    document.body.appendChild(notification);
    
    // Remove após 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

// Adicionar animações CSS para notificações
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

