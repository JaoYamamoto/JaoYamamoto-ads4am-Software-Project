// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    setupForm();
    setupModal();
    setupGoogleBooksSearch(); // Configura a busca da Google Books API
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
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSuccessModal);
    }
    
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
        showNotification('warning', 'Por favor, preencha todos os campos obrigatórios corretamente.');
        return;
    }
    
    const formData = getFormData();
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    try {
        // Desabilitar botão e mostrar loading
        setButtonLoading(submitButton, true);
        
        const response = await fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            showNotification('success', data.message);
            showSuccessModal();
            clearForm();
        } else {
            showNotification('error', data.error || 'Erro ao adicionar livro. Tente novamente.');
        }
        
    } catch (error) {
        console.error('Erro ao adicionar livro:', error);
        showNotification('error', 'Erro de conexão. Tente novamente.');
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
        description: formData.get('description').trim() || null,
        cover_image_url: formData.get('cover_image_url') || null // <-- CAMPO ADICIONADO
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
    
    clearFieldError({ target: field });
    
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
    
    clearFieldError({ target: field });
    
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
    
    // Limpar o campo oculto da capa
    document.getElementById('cover_image_url').value = '';
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

// Google Books API Integration
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
        showNotification('warning', 'Digite o nome do livro para buscar');
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
            <i class="fas fa-spinner fa-spin"></i>
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
        <div class="search-result-item" onclick="selectGoogleBook(${escapeHtml(JSON.stringify(book))})">
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
    
    // NOVO: Preencher o campo oculto com a URL da capa
    document.getElementById('cover_image_url').value = book.cover_image_url || '';
    
    // Limpar a busca
    document.getElementById('googleBooksQuery').value = '';
    hideSearchResults();
    
    // Mostrar notificação de sucesso
    showNotification('success', 'Campos preenchidos automaticamente!');
    
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

// Função auxiliar para escapar HTML (já deve estar em main.js, mas mantida aqui por segurança)
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
