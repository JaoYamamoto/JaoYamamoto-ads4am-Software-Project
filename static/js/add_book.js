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

