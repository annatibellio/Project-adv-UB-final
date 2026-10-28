<?php
/**
 * Funções auxiliares usadas por todos os endpoints da API.
 */

// Inicia a sessão (usada para saber quem está logado) com cookie mais seguro
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    session_start();
}

// Todas as respostas da API são em JSON
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Erros inesperados viram JSON genérico (detalhes só no log do PHP)
set_exception_handler(function (Throwable $e): void {
    error_log($e);
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro interno do servidor.'], JSON_UNESCAPED_UNICODE);
    exit;
});

/** Tamanho máximo de upload (10 MB) e extensões aceitas. */
const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_EXTENSOES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'odt', 'rtf', 'jpg', 'jpeg', 'png'];

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

/** Texto obrigatório com limite de tamanho; devolve o valor "trimado" ou null se inválido. */
function textoValido($valor, int $max = 255): ?string
{
    if (!is_string($valor) && !is_numeric($valor)) {
        return null;
    }
    $valor = trim((string) $valor);
    return ($valor !== '' && mb_strlen($valor) <= $max) ? $valor : null;
}

/** Valida data no formato AAAA-MM-DD (e se existe no calendário). */
function dataValida($data): bool
{
    if (!is_string($data) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data)) {
        return false;
    }
    [$a, $m, $d] = array_map('intval', explode('-', $data));
    return checkdate($m, $d, $a);
}

/** Valida hora no formato HH:MM. */
function horaValida($hora): bool
{
    return is_string($hora) && (bool) preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $hora);
}

/**
 * Valida e move um arquivo enviado por formulário (campo $_FILES[$campo]).
 * Retorna [nomeOriginal, nomeArmazenado]. Responde erro JSON se algo estiver errado.
 */
function salvarUpload(string $campo, string $pasta): array
{
    if (empty($_FILES[$campo]) || !is_array($_FILES[$campo]) || is_array($_FILES[$campo]['name'])) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Anexe um arquivo antes de salvar.'], 400);
    }

    $arquivo = $_FILES[$campo];
    if ($arquivo['error'] === UPLOAD_ERR_INI_SIZE || $arquivo['error'] === UPLOAD_ERR_FORM_SIZE) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Arquivo muito grande (máximo de 10 MB).'], 413);
    }
    if ($arquivo['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($arquivo['tmp_name'])) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Falha no envio do arquivo. Tente novamente.'], 400);
    }
    if ($arquivo['size'] > UPLOAD_MAX_BYTES) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Arquivo muito grande (máximo de 10 MB).'], 413);
    }

    $nomeOriginal = mb_substr(basename($arquivo['name']), 0, 200);
    $extensao = strtolower(pathinfo($nomeOriginal, PATHINFO_EXTENSION));
    if (!in_array($extensao, UPLOAD_EXTENSOES, true)) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Tipo de arquivo não permitido. Aceitos: ' . implode(', ', UPLOAD_EXTENSOES) . '.'], 400);
    }

    if (!is_dir($pasta) && !mkdir($pasta, 0755, true)) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Não foi possível criar a pasta de uploads.'], 500);
    }

    $nomeArmazenado = bin2hex(random_bytes(12)) . '.' . $extensao;
    if (!move_uploaded_file($arquivo['tmp_name'], rtrim($pasta, '/') . '/' . $nomeArmazenado)) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Falha ao salvar o arquivo no servidor.'], 500);
    }

    return [$nomeOriginal, $nomeArmazenado];
}

/**
 * Envia um arquivo do disco para download, validando que ele está dentro de backend/uploads.
 */
function enviarDownload(string $caminhoRelativo, string $nomeExibicao): void
{
    $base = realpath(__DIR__ . '/../uploads');
    $caminho = realpath(__DIR__ . '/../' . $caminhoRelativo);

    if ($base === false || $caminho === false || strpos($caminho, $base . DIRECTORY_SEPARATOR) !== 0 || !is_file($caminho)) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Arquivo não encontrado no servidor.'], 404);
    }

    $nomeSeguro = str_replace(['"', "\r", "\n", '\\', '/'], '_', $nomeExibicao);
    header('Content-Type: application/octet-stream');
    header("Content-Disposition: attachment; filename=\"" . $nomeSeguro . "\"; filename*=UTF-8''" . rawurlencode($nomeExibicao));
    header('Content-Length: ' . filesize($caminho));
    readfile($caminho);
    exit;
}

/** Remove um arquivo de upload do disco (apenas dentro de backend/uploads). */
function apagarArquivoUpload(?string $caminhoRelativo): void
{
    if (empty($caminhoRelativo)) {
        return;
    }
    $base = realpath(__DIR__ . '/../uploads');
    $caminho = realpath(__DIR__ . '/../' . $caminhoRelativo);
    if ($base !== false && $caminho !== false && strpos($caminho, $base . DIRECTORY_SEPARATOR) === 0 && is_file($caminho)) {
        unlink($caminho);
    }
}
