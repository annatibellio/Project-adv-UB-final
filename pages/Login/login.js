const botaoLogin = document.getElementById("btn-login");

botaoLogin.addEventListener("click", async function () {

    const email = document.getElementById("email").value;

    const senha = document.getElementById("senha").value;


    // VALIDAÇÃO DE E-MAIL
    const emailValido =
        email.includes("@gmail.com") ||
        email.includes("@hotmail.com") ||
        email.includes("@outlook.com") ||
        email.includes("@yahoo.com") ||
        email.includes("@icloud.com") ||
        email.includes("@live.com") ||
        email.includes("@msn.com") ||
        email.includes("@uol.com.br") ||
        email.includes("@bol.com.br") ||
        email.includes("@terra.com.br") ||
        email.includes("@globo.com") ||
        email.includes("@ig.com.br") ||
        email.includes("@r7.com") ||
        email.includes("@protonmail.com") ||
        email.includes("@aol.com") ||
        email.includes("@mail.com") ||
        email.includes("@gmx.com") ||
        email.includes("@zoho.com") ||
        email.includes("@edu.br") ||
        email.includes("@gov.br") ||
        email.includes("@jus.br") ||
        email.includes("@org.br") ||
        email.includes("@com.br");
    // const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
                body: JSON.stringify({ email, senha }),
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
