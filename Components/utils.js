// Utilitários compartilhados entre as páginas.
// Escapa texto vindo do servidor antes de inseri-lo via innerHTML (evita XSS).
function escapeHtml(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
