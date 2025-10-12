document.addEventListener("DOMContentLoaded", function() {
    const registerForm = document.getElementById("registerForm");
    const nicknameInput = document.getElementById("nickname");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const registerButton = document.getElementById("registerButton");

    if (registerForm) {
        registerForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            registerButton.disabled = true;
            registerButton.innerHTML = 
                `<i class="fas fa-spinner fa-spin"></i> Registrando...`;

            const nickname = nicknameInput.value;
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (password !== confirmPassword) {
                showNotification("error", "As senhas não coincidem.");
                registerButton.disabled = false;
                registerButton.innerHTML = `<i class="fas fa-user-plus"></i> Criar Conta`;
                return;
            }

            try {
                const response = await fetch("/api/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ nickname, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    showNotification("success", data.message);
                    setTimeout(() => {
                        window.location.href = "/login"; // Redirecionar para a página de login
                    }, 1500);
                } else {
                    showNotification("error", data.error || "Erro ao registrar.");
                }
            } catch (error) {
                console.error("Erro de rede:", error);
                showNotification("error", "Erro de conexão. Tente novamente.");
            } finally {
                registerButton.disabled = false;
                registerButton.innerHTML = `<i class="fas fa-user-plus"></i> Criar Conta`;
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

function toggleConfirmPassword() {
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const confirmPasswordToggleIcon = document.getElementById("confirmPasswordToggleIcon");
    if (confirmPasswordInput.type === "password") {
        confirmPasswordInput.type = "text";
        confirmPasswordToggleIcon.classList.remove("fa-eye");
        confirmPasswordToggleIcon.classList.add("fa-eye-slash");
    } else {
        confirmPasswordInput.type = "password";
        confirmPasswordToggleIcon.classList.remove("fa-eye-slash");
        confirmPasswordToggleIcon.classList.add("fa-eye");
    }
}

