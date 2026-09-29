<?php
/**
 * API da página Documentos (catálogo geral de documentos do escritório).
 *
 * GET    documentos.php                  -> lista todos os documentos
 * POST   documentos.php (multipart/form) -> cria um novo documento com upload
 * GET    documentos.php?download=5       -> baixa o arquivo
 * DELETE documentos.php?id=5             -> exclui o documento
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/database.php';

exigirLogin();
$pdo = getConexao();

$pastaUploads = __DIR__ . '/../uploads/documentos/';

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET' && isset($_GET['download'])) {
    baixarDocumento($pdo, (int) $_GET['download']);
} elseif ($metodo === 'GET') {
    $stmt = $pdo->query('SELECT * FROM documentos ORDER BY criado_em DESC');
    respostaJson(['sucesso' => true, 'documentos' => $stmt->fetchAll()]);
} elseif ($metodo === 'POST') {
    criarDocumento($pdo, $pastaUploads);
} elseif ($metodo === 'DELETE') {
    excluirDocumento($pdo, (int) ($_GET['id'] ?? 0));
} else {
    respostaJson(['sucesso' => false, 'mensagem' => 'Método não permitido.'], 405);
}

function gerarNumeroProcesso(PDO $pdo): string
{
    do {
        $seq      = str_pad((string) random_int(0, 9999999), 7, '0', STR_PAD_LEFT);
        $digito   = str_pad((string) random_int(0, 99), 2, '0', STR_PAD_LEFT);
        $ano      = date('Y');
        $vara     = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        $numero   = "{$seq}-{$digito}.{$ano}.8.26.{$vara}";

        $stmt = $pdo->prepare('SELECT COUNT(*) FROM documentos WHERE processo_numero = :n');
        $stmt->execute(['n' => $numero]);
        $existe = (int) $stmt->fetchColumn() > 0;
    } while ($existe);

    return $numero;
}

function criarDocumento(PDO $pdo, string $pastaUploads): void
{
    $nome        = trim($_POST['nome'] ?? '');
    $tipo        = trim($_POST['tipo'] ?? '');
    $relacionado = trim($_POST['processoRelacionado'] ?? '');

    if ($nome === '' || $tipo === '') {
        respostaJson(['sucesso' => false, 'mensagem' => 'Preencha os campos obrigatórios (Nome e Tipo).'], 400);
    }
    if (empty($_FILES['arquivo'])) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Anexe um arquivo antes de salvar.'], 400);
    }

    if (!is_dir($pastaUploads)) {
        mkdir($pastaUploads, 0755, true);
    }

    $arquivo = $_FILES['arquivo'];
    $nomeOriginal = basename($arquivo['name']);
    $nomeArmazenado = uniqid('doc_', true) . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $nomeOriginal);
    $destino = $pastaUploads . $nomeArmazenado;

    if (!move_uploaded_file($arquivo['tmp_name'], $destino)) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Falha ao salvar o arquivo no servidor.'], 500);
    }

    $numeroProcesso = gerarNumeroProcesso($pdo);

    $stmt = $pdo->prepare('INSERT INTO documentos
        (nome, tipo, processo_numero, processo_relacionado, arquivo_nome, arquivo_path, data_envio, status)
        VALUES (:nome, :tipo, :numero, :relacionado, :arquivo_nome, :arquivo_path, CURDATE(), :status)');

    $stmt->execute([
        'nome'         => $nome,
        'tipo'         => $tipo,
        'numero'       => $numeroProcesso,
        'relacionado'  => $relacionado !== '' ? $relacionado : null,
        'arquivo_nome' => $nomeOriginal,
        'arquivo_path' => 'uploads/documentos/' . $nomeArmazenado,
        'status'       => 'pendente',
    ]);

    respostaJson([
        'sucesso'  => true,
        'mensagem' => 'Documento salvo com sucesso!',
        'id'       => (int) $pdo->lastInsertId(),
        'numeroProcesso' => $numeroProcesso,
    ], 201);
}

function excluirDocumento(PDO $pdo, int $id): void
{
    if ($id <= 0) {
        respostaJson(['sucesso' => false, 'mensagem' => 'ID inválido.'], 400);
    }

    $stmt = $pdo->prepare('SELECT arquivo_path FROM documentos WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $doc = $stmt->fetch();

    $del = $pdo->prepare('DELETE FROM documentos WHERE id = :id');
    $del->execute(['id' => $id]);

    if ($doc && !empty($doc['arquivo_path'])) {
        $caminho = __DIR__ . '/../' . $doc['arquivo_path'];
        if (file_exists($caminho)) {
            unlink($caminho);
        }
    }

    respostaJson(['sucesso' => true, 'mensagem' => 'Documento excluído.']);
}

function baixarDocumento(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare('SELECT * FROM documentos WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $doc = $stmt->fetch();

    if (!$doc) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Documento não encontrado.'], 404);
    }

    $caminhoCompleto = __DIR__ . '/../' . $doc['arquivo_path'];
    if (!file_exists($caminhoCompleto)) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Arquivo não encontrado no servidor.'], 404);
    }

    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $doc['arquivo_nome'] . '"');
    header('Content-Length: ' . filesize($caminhoCompleto));
    readfile($caminhoCompleto);
    exit;
}
