// Protege as páginas internas: se não houver sessão ativa no back-end,
// redireciona para a tela de login. Incluir logo no <body>, antes dos
// outros scripts da página, em qualquer página que exija login.
(async function () {
    try {
        const resposta = await fetch("../../backend/api/check_session.php", {
            credentials: "same-origin",
        });
        const dados = await resposta.json();

        if (!dados.logado) {
            window.location.href = "../Login/index.html";
        }
    } catch (erro) {
        // Se o back-end não estiver rodando, não bloqueia a navegação
        // (útil durante o desenvolvimento do front-end isoladamente).
        console.warn("Não foi possível verificar a sessão:", erro);
    }
})();
