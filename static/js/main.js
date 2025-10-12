function showNotification(type, message) {
    const modal = document.getElementById("notificationModal");
    const icon = document.getElementById("notificationIcon");
    const msg = document.getElementById("notificationMessage");

    // Reset classes
    icon.className = "";
    icon.classList.add("fas");

    if (type === "success") {
        icon.classList.add("fa-check-circle");
        icon.style.color = "#28a745";
    } else if (type === "error") {
        icon.classList.add("fa-times-circle");
        icon.style.color = "#dc3545";
    } else if (type === "info") {
        icon.classList.add("fa-info-circle");
        icon.style.color = "#007bff";
    } else if (type === "warning") {
        icon.classList.add("fa-exclamation-triangle");
        icon.style.color = "#ffc107";
    }

    msg.textContent = message;
    modal.style.display = "block";

    setTimeout(() => {
        closeNotificationModal();
    }, 3000);
}

function closeNotificationModal() {
    const modal = document.getElementById("notificationModal");
    if (modal) {
        modal.style.display = "none";
    }
}

// Fechar modal clicando fora
window.onclick = function(event) {
    const modal = document.getElementById("notificationModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Funções de formatação (mantidas do original)
function formatYear(year) {
    return year ? year.toString() : 'Não informado';
}

function formatGenre(genre) {
    return genre || 'Não categorizado';
}

function truncateText(text, maxLength = 150) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Inicialização global (mantida do original)
document.addEventListener('DOMContentLoaded', function() {
    // Adiciona efeitos de hover nos botões
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Adiciona efeitos de foco nos inputs
    const inputs = document.querySelectorAll('.form-input, .form-textarea, .search-input, .filter-select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
});


