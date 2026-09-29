<?php
/**
 * Funções auxiliares usadas por todos os endpoints da API.
 */

// Inicia a sessão (usada para saber quem está logado)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Todas as respostas da API são em JSON
header('Content-Type: application/json; charset=utf-8');

/**
 * Envia uma resposta JSON e finaliza o script.
 */
function respostaJson($dados, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Lê o corpo JSON enviado pelo front-end (fetch com body JSON).
 */
function lerCorpoJson(): array
{
    $corpo = file_get_contents('php://input');
    $dados = json_decode($corpo, true);
    return is_array($dados) ? $dados : [];
}

/**
 * Garante que existe um usuário logado na sessão.
 * Se não houver, responde 401 e encerra o script.
 */
function exigirLogin(): void
{
    if (empty($_SESSION['usuario_id'])) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Não autenticado. Faça login novamente.'], 401);
    }
}

/**
 * Garante que a requisição está usando o método HTTP esperado.
 */
function exigirMetodo(string $metodo): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Método não permitido.'], 405);
    }
}
