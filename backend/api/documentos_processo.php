<?php
/**
 * API de documentos anexados a um processo específico
 * (aba "Documentos" dentro do modal de detalhes do processo).
 *
 * GET    documentos_processo.php?processo_id=1  -> lista documentos do processo
 * POST   documentos_processo.php (multipart)     -> anexa um novo arquivo
 * GET    documentos_processo.php?download=5      -> baixa o arquivo
 * DELETE documentos_processo.php?id=5             -> remove o anexo
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/database.php';

exigirLogin();
$pdo = getConexao();

$pastaUploads = __DIR__ . '/../uploads/processos/';

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET' && isset($_GET['download'])) {
    baixarDocumento($pdo, (int) $_GET['download'], $pastaUploads);
} elseif ($metodo === 'GET') {
    $processoId = (int) ($_GET['processo_id'] ?? 0);
    $stmt = $pdo->prepare('SELECT * FROM documentos_processo WHERE processo_id = :id ORDER BY data DESC');
    $stmt->execute(['id' => $processoId]);
    respostaJson(['sucesso' => true, 'documentos' => $stmt->fetchAll()]);
} elseif ($metodo === 'POST') {
    anexarDocumento($pdo, $pastaUploads);
} elseif ($metodo === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        respostaJson(['sucesso' => false, 'mensagem' => 'ID inválido.'], 400);
    }
    $busca = $pdo->prepare('SELECT arquivo_path FROM documentos_processo WHERE id = :id');
    $busca->execute(['id' => $id]);
    $doc = $busca->fetch();
    if (!$doc) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Documento não encontrado.'], 404);
    }
    $stmt = $pdo->prepare('DELETE FROM documentos_processo WHERE id = :id');
    $stmt->execute(['id' => $id]);
    apagarArquivoUpload($doc['arquivo_path']);
    respostaJson(['sucesso' => true, 'mensagem' => 'Documento removido.']);
} else {
    respostaJson(['sucesso' => false, 'mensagem' => 'Método não permitido.'], 405);
}

function anexarDocumento(PDO $pdo, string $pastaUploads): void
{
    $processoId = (int) ($_POST['processoId'] ?? 0);
    if ($processoId <= 0) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Envie o arquivo e o processo relacionado.'], 400);
    }

    $existe = $pdo->prepare('SELECT COUNT(*) FROM processos WHERE id = :id');
    $existe->execute(['id' => $processoId]);
    if ((int) $existe->fetchColumn() === 0) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Processo não encontrado.'], 404);
    }

    [$nomeOriginal, $nomeArmazenado] = salvarUpload('arquivo', $pastaUploads);

    $stmt = $pdo->prepare('INSERT INTO documentos_processo (processo_id, nome, arquivo_path, data)
        VALUES (:processo_id, :nome, :path, CURDATE())');
    $stmt->execute([
        'processo_id' => $processoId,
        'nome'        => $nomeOriginal,
        'path'        => 'uploads/processos/' . $nomeArmazenado,
    ]);

    respostaJson(['sucesso' => true, 'mensagem' => 'Documento anexado com sucesso!', 'id' => (int) $pdo->lastInsertId()], 201);
}

function baixarDocumento(PDO $pdo, int $id, string $pastaUploads): void
{
    $stmt = $pdo->prepare('SELECT * FROM documentos_processo WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $doc = $stmt->fetch();

    if (!$doc || empty($doc['arquivo_path'])) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Documento não encontrado.'], 404);
    }

    enviarDownload($doc['arquivo_path'], $doc['nome']);
}
