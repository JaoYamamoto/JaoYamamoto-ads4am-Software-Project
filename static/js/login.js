document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    const nicknameInput = document.getElementById("nickname");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("loginButton");

    if (loginForm) {
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            loginButton.disabled = true;
            loginButton.innerHTML = 
                `<i class="fas fa-spinner fa-spin"></i> Entrando...`;

            const nickname = nicknameInput.value;
            const password = passwordInput.value;

            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ nickname, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification("success", data.message);
                    // Armazenar token ou informações do usuário se necessário
                    // Por enquanto, apenas redirecionar
                    setTimeout(() => {
                        window.location.href = "/"; // Redirecionar para a página inicial
                    }, 1500);
                } else {
                    showNotification("error", data.error || "Erro ao fazer login.");
                }
            } catch (error) {
                console.error("Erro de rede:", error);
                showNotification("error", "Erro de conexão. Tente novamente.");
            } finally {
                loginButton.disabled = false;
                loginButton.innerHTML = `<i class="fas fa-sign-in-alt"></i> Entrar`;
            }
        });
    }
});

function togglePassword() {
    const passwordInput = document.getElementById("password");
    const passwordToggleIcon = document.getElementById("passwordToggleIcon");
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passwordToggleIcon.classList.remove("fa-eye");
        passwordToggleIcon.classList.add("fa-eye-slash");
    } else {
        passwordInput.type = "password";
        passwordToggleIcon.classList.remove("fa-eye-slash");
        passwordToggleIcon.classList.add("fa-eye");
    }
}

