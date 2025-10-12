// Variáveis globais
let allBooks = [];
let filteredBooks = [];
let bookToDeleteId = null;

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    // A função checkAuthStatus em auth.js já lida com a exibição da tela inicial
    // e chama loadBooks se o usuário estiver autenticado.
    // Não precisamos chamar loadBooks aqui diretamente.
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterBooks, 300));
    }

    // Filtro de gênero
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter) {
        genreFilter.addEventListener('change', filterBooks);
    }

    // Modal de exclusão
    const modal = document.getElementById('deleteModal');
    const closeBtn = modal.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDeleteModal);
    }
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeDeleteModal();
        }
    });
}

// Carregar livros da API
async function loadBooks() {
    try {
        showLoading();
        const response = await fetch('/api/books');
        if (!response.ok) {
            if (response.status === 401) {
                // Não autenticado, auth.js já deve ter redirecionado
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allBooks = await response.json();
        filteredBooks = [...allBooks];
        
        renderBooks();
        updateStats();
        populateGenreFilter();
        
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        showNotification('error', 'Erro ao carregar livros.');
        showEmptyState();
    } finally {
        hideLoading();
    }
}

// Renderizar livros na tela
function renderBooks() {
    const container = document.getElementById('booksContainer');
    const emptyState = document.getElementById('emptyState');
    const noResults = document.getElementById('noResults');
    
    if (!container || !emptyState || !noResults) return;

    if (allBooks.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        noResults.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';

    if (filteredBooks.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    
    container.innerHTML = filteredBooks.map(book => `
        <div class="book-card" data-book-id="${book.id}">
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <p class="book-author">por ${escapeHtml(book.author)}</p>
            
            <div class="book-meta">
                ${book.year ? `<span class="book-year">${book.year}</span>` : ''}
                ${book.genre ? `<span class="book-genre">${escapeHtml(book.genre)}</span>` : ''}
            </div>
            
            ${book.description ? `
                <p class="book-description">${escapeHtml(truncateText(book.description, 120))}</p>
            ` : ''}
            
            <div class="book-actions">
                <a href="/edit-book/${book.id}" class="btn btn-secondary btn-small">
                    <i class="fas fa-edit"></i>
                    Editar
                </a>
                <button onclick="showDeleteModal(${book.id}, '${escapeHtml(book.title)}')" 
                        class="btn btn-danger btn-small">
                    <i class="fas fa-trash"></i>
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Filtrar livros
function filterBooks() {
    const searchInput = document.getElementById('searchInput');
    const genreFilter = document.getElementById('genreFilter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedGenre = genreFilter ? genreFilter.value : '';
    
    filteredBooks = allBooks.filter(book => {
        const matchesSearch = !searchTerm || 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            (book.genre && book.genre.toLowerCase().includes(searchTerm)) ||
            (book.description && book.description.toLowerCase().includes(searchTerm));
        
        const matchesGenre = !selectedGenre || book.genre === selectedGenre;
        
        return matchesSearch && matchesGenre;
    });
    
    renderBooks();
    updateStats();
}

// Atualizar estatísticas
function updateStats() {
    const totalBooks = document.getElementById('totalBooks');
    const totalGenres = document.getElementById('totalGenres');
    const totalAuthors = document.getElementById('totalAuthors');
    
    if (totalBooks) {
        totalBooks.textContent = filteredBooks.length;
    }
    
    if (totalGenres) {
        const uniqueGenres = new Set(filteredBooks.filter(book => book.genre).map(book => book.genre));
        totalGenres.textContent = uniqueGenres.size;
    }
    
    if (totalAuthors) {
        const uniqueAuthors = new Set(filteredBooks.map(book => book.author));
        totalAuthors.textContent = uniqueAuthors.size;
    }
}

// Popular filtro de gêneros
function populateGenreFilter() {
    const genreFilter = document.getElementById('genreFilter');
    if (!genreFilter) return;
    
    const genres = [...new Set(allBooks.filter(book => book.genre).map(book => book.genre))].sort();
    
    // Limpar opções existentes (exceto a primeira)
    while (genreFilter.children.length > 1) {
        genreFilter.removeChild(genreFilter.lastChild);
    }
    
    // Adicionar gêneros
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreFilter.appendChild(option);
    });
}

// Modal de exclusão
function showDeleteModal(bookId, bookTitle) {
    bookToDeleteId = bookId;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    bookToDeleteId = null;
}

async function confirmDelete() {
    if (!bookToDeleteId) return;
    
    try {
        const response = await fetch(`/api/books/${bookToDeleteId}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('success', data.message);
            closeDeleteModal();
            loadBooks(); // Recarregar lista
        } else {
            showNotification('error', data.error || 'Erro ao excluir livro.');
        }
    } catch (error) {
        console.error('Erro ao excluir livro:', error);
        showNotification('error', 'Erro de conexão. Tente novamente.');
    }
}

// Funções utilitárias
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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

function showLoading() {
    const container = document.getElementById('booksContainer');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i>
                <p style="margin-top: 15px; color: #666;">Carregando livros...</p>
            </div>
        `;
    }
}

function hideLoading() {
    // A função renderBooks() já substitui o conteúdo de loading
}

function showEmptyState() {
    const container = document.getElementById('booksContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (container) {
        container.innerHTML = '';
    }
    
    if (emptyState) {
        emptyState.style.display = 'block';
    }
}


