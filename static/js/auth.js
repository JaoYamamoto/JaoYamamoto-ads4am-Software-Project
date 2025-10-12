document.addEventListener("DOMContentLoaded", function() {
    checkAuthStatus();
});

async function checkAuthStatus() {
    try {
        const response = await fetch("/api/current-user");
        const data = await response.json();

        const authRequiredElements = document.querySelectorAll(".auth-required");
        const authNotRequiredElements = document.querySelectorAll(".auth-not-required");
        const userNicknameSpan = document.getElementById("userNickname");
        const welcomeScreen = document.getElementById("welcomeScreen");
        const mainContent = document.getElementById("mainContent");

        if (data.authenticated) {
            // Usuário autenticado
            authRequiredElements.forEach(el => el.style.display = "block");
            authNotRequiredElements.forEach(el => el.style.display = "none");
            if (userNicknameSpan) {
                userNicknameSpan.textContent = data.user.nickname;
            }
            if (welcomeScreen) welcomeScreen.style.display = "none";
            if (mainContent) mainContent.style.display = "block";

            // Carregar livros se estivermos na página principal
            if (window.location.pathname === "/" && typeof loadBooks === 'function') {
                loadBooks();
            }

            // Se estiver nas páginas de login/registro, redirecionar para a home
            if (window.location.pathname === "/login" || window.location.pathname === "/register") {
                window.location.href = "/";
            }

        } else {
            // Usuário não autenticado
            authRequiredElements.forEach(el => el.style.display = "none");
            authNotRequiredElements.forEach(el => el.style.display = "block");
            if (welcomeScreen) welcomeScreen.style.display = "block";
            if (mainContent) mainContent.style.display = "none";

            // Se estiver em uma página protegida, redirecionar para login
            if (window.location.pathname === "/add-book" || window.location.pathname.startsWith("/edit-book")) {
                window.location.href = "/login";
            }
        }
    } catch (error) {
        console.error("Erro ao verificar status de autenticação:", error);
        // Em caso de erro, tratar como não autenticado
        document.querySelectorAll(".auth-required").forEach(el => el.style.display = "none");
        document.querySelectorAll(".auth-not-required").forEach(el => el.style.display = "block");
        const welcomeScreen = document.getElementById("welcomeScreen");
        const mainContent = document.getElementById("mainContent");
        if (welcomeScreen) welcomeScreen.style.display = "block";
        if (mainContent) mainContent.style.display = "none";
    }
}

async function logout() {
    try {
        const response = await fetch("/api/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (response.ok) {
            showNotification("success", data.message);
            setTimeout(() => {
                window.location.href = "/login"; // Redirecionar para a página de login após logout
            }, 1500);
        } else {
            showNotification("error", data.error || "Erro ao fazer logout.");
        }
    } catch (error) {
        console.error("Erro de rede ao fazer logout:", error);
        showNotification("error", "Erro de conexão. Tente novamente.");
    }
}

// Dropdown do usuário
document.addEventListener("click", function(event) {
    const userDropdown = document.getElementById("userDropdown");
    const userDropdownMenu = document.getElementById("userDropdownMenu");

    if (userDropdown && userDropdownMenu) {
        if (userDropdown.contains(event.target)) {
            userDropdownMenu.classList.toggle("show");
        } else if (!userDropdownMenu.contains(event.target)) {
            userDropdownMenu.classList.remove("show");
        }
    }
});


