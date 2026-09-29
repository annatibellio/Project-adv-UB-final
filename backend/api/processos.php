<?php
/**
 * API de Processos.
 *
 * GET    processos.php            -> lista todos os processos
 * GET    processos.php?id=1       -> retorna um processo com movimentações e documentos
 * POST   processos.php            -> cria um novo processo
 * PUT    processos.php?id=1       -> atualiza um processo existente
 * DELETE processos.php?id=1       -> exclui um processo
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/database.php';

exigirLogin();
$pdo = getConexao();

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        if (isset($_GET['id'])) {
            buscarProcesso($pdo, (int) $_GET['id']);
        } else {
            listarProcessos($pdo);
        }
        break;

    case 'POST':
        criarProcesso($pdo);
        break;

    case 'PUT':
        atualizarProcesso($pdo, (int) ($_GET['id'] ?? 0));
        break;

    case 'DELETE':
        excluirProcesso($pdo, (int) ($_GET['id'] ?? 0));
        break;

    default:
        respostaJson(['sucesso' => false, 'mensagem' => 'Método não permitido.'], 405);
}

function listarProcessos(PDO $pdo): void
{
    $stmt = $pdo->query('SELECT * FROM processos ORDER BY criado_em DESC');
    respostaJson(['sucesso' => true, 'processos' => $stmt->fetchAll()]);
}

function buscarProcesso(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare('SELECT * FROM processos WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $processo = $stmt->fetch();

    if (!$processo) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Processo não encontrado.'], 404);
    }

    $movStmt = $pdo->prepare('SELECT * FROM movimentacoes WHERE processo_id = :id ORDER BY data_hora DESC');
    $movStmt->execute(['id' => $id]);
    $processo['movimentacoes'] = $movStmt->fetchAll();

    $docStmt = $pdo->prepare('SELECT * FROM documentos_processo WHERE processo_id = :id ORDER BY data DESC');
    $docStmt->execute(['id' => $id]);
    $processo['documentos'] = $docStmt->fetchAll();

    respostaJson(['sucesso' => true, 'processo' => $processo]);
}

function criarProcesso(PDO $pdo): void
{
    $d = lerCorpoJson();

    $campos = ['numero', 'cliente', 'cpf', 'area', 'vara', 'advogado', 'dataAbertura', 'situacao'];
    foreach ($campos as $campo) {
        if (empty($d[$campo])) {
            respostaJson(['sucesso' => false, 'mensagem' => 'Preencha todos os campos obrigatórios.'], 400);
        }
    }

    $agora = new DateTime();
    $ultimaAtualizacao = $agora->format('d/m/Y') . ', ' . $agora->format('H:i');

    $stmt = $pdo->prepare('INSERT INTO processos
        (numero, cliente, cpf_cnpj, area, vara, advogado, data_abertura, situacao, ultima_atualizacao)
        VALUES (:numero, :cliente, :cpf, :area, :vara, :advogado, :data, :situacao, :ultima)');

    $stmt->execute([
        'numero'   => $d['numero'],
        'cliente'  => $d['cliente'],
        'cpf'      => $d['cpf'],
        'area'     => $d['area'],
        'vara'     => $d['vara'],
        'advogado' => $d['advogado'],
        'data'     => $d['dataAbertura'],
        'situacao' => $d['situacao'],
        'ultima'   => $ultimaAtualizacao,
    ]);

    $novoId = (int) $pdo->lastInsertId();

    // primeira movimentação automática, igual ao comportamento original do front-end
    $movStmt = $pdo->prepare('INSERT INTO movimentacoes (processo_id, descricao, responsavel, cargo, data_hora)
        VALUES (:id, :descricao, :responsavel, :cargo, NOW())');
    $movStmt->execute([
        'id'          => $novoId,
        'descricao'   => 'Processo cadastrado no sistema',
        'responsavel' => $d['advogado'],
        'cargo'       => 'Advogado',
    ]);

    respostaJson(['sucesso' => true, 'mensagem' => 'Processo cadastrado com sucesso!', 'id' => $novoId], 201);
}

function atualizarProcesso(PDO $pdo, int $id): void
{
    if ($id <= 0) {
        respostaJson(['sucesso' => false, 'mensagem' => 'ID inválido.'], 400);
    }

    $d = lerCorpoJson();
    $campos = ['numero', 'cliente', 'cpf', 'area', 'vara', 'advogado', 'dataAbertura', 'situacao'];
    foreach ($campos as $campo) {
        if (empty($d[$campo])) {
            respostaJson(['sucesso' => false, 'mensagem' => 'Preencha todos os campos obrigatórios.'], 400);
        }
    }

    $agora = new DateTime();
    $ultimaAtualizacao = $agora->format('d/m/Y') . ', ' . $agora->format('H:i');

    $stmt = $pdo->prepare('UPDATE processos SET
        numero = :numero, cliente = :cliente, cpf_cnpj = :cpf, area = :area,
        vara = :vara, advogado = :advogado, data_abertura = :data,
        situacao = :situacao, ultima_atualizacao = :ultima
        WHERE id = :id');

    $stmt->execute([
        'numero'   => $d['numero'],
        'cliente'  => $d['cliente'],
        'cpf'      => $d['cpf'],
        'area'     => $d['area'],
        'vara'     => $d['vara'],
        'advogado' => $d['advogado'],
        'data'     => $d['dataAbertura'],
        'situacao' => $d['situacao'],
        'ultima'   => $ultimaAtualizacao,
        'id'       => $id,
    ]);

    if ($stmt->rowCount() === 0) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Processo não encontrado.'], 404);
    }

    respostaJson(['sucesso' => true, 'mensagem' => 'Processo atualizado com sucesso!']);
}

function excluirProcesso(PDO $pdo, int $id): void
{
    if ($id <= 0) {
        respostaJson(['sucesso' => false, 'mensagem' => 'ID inválido.'], 400);
    }

    $stmt = $pdo->prepare('DELETE FROM processos WHERE id = :id');
    $stmt->execute(['id' => $id]);

    if ($stmt->rowCount() === 0) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Processo não encontrado.'], 404);
    }

    respostaJson(['sucesso' => true, 'mensagem' => 'Processo excluído com sucesso!']);
}
