const botaoLogin = document.getElementById("btn-login");

botaoLogin.addEventListener("click", async function () {

    const email = document.getElementById("email").value;

    const senha = document.getElementById("senha").value;


    // VALIDAÇÃO DE E-MAIL (formato genérico: qualquer domínio válido)
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    // CAMPOS VAZIOS

    if (email === "" || senha === "") {

        alert("Preencha o e-mail e a senha!");
        return;

    }

    // EMAIL INVÁLIDO

    else if (!emailValido) {

        alert("Digite um e-mail válido!");
        return;

    }

    // LOGIN OK (validado no back-end / banco de dados)

    else {

        botaoLogin.disabled = true;
        botaoLogin.textContent = "Entrando...";

        try {
            const resposta = await fetch("../../backend/api/login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ email: email.trim(), senha }),
            });

            const dados = await resposta.json();

            if (dados.sucesso) {
                window.location.href = "../dashboard/index.html";
            } else {
                alert(dados.mensagem || "E-mail ou senha inválidos.");
            }
        } catch (erro) {
            alert("Não foi possível conectar ao servidor. Verifique se o back-end está rodando.");
        } finally {
            botaoLogin.disabled = false;
            botaoLogin.textContent = "Entrar";
        }

    }

});


// MOSTRAR / OCULTAR SENHA

const senhaInput = document.getElementById("senha");

const toggleSenha = document.getElementById("toggleSenha");

toggleSenha.addEventListener("click", () => {

    if (senhaInput.type === "password") {

        senhaInput.type = "text";

    } else {

        senhaInput.type = "password";

    }

});
