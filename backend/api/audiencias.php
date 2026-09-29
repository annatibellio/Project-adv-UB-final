<?php
/**
 * API da página Audiências.
 *
 * GET    audiencias.php        -> lista todas as audiências (aceita filtros)
 * POST   audiencias.php        -> cria uma nova audiência
 * PUT    audiencias.php?id=1   -> atualiza status/dados de uma audiência
 * DELETE audiencias.php?id=1   -> exclui uma audiência
 *
 * Filtros aceitos via GET: data_inicio, data_fim, status, vara
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/database.php';

exigirLogin();
$pdo = getConexao();

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        listarAudiencias($pdo);
        break;

    case 'POST':
        criarAudiencia($pdo);
        break;

    case 'PUT':
        atualizarAudiencia($pdo, (int) ($_GET['id'] ?? 0));
        break;

    case 'DELETE':
        $stmt = $pdo->prepare('DELETE FROM audiencias WHERE id = :id');
        $stmt->execute(['id' => (int) ($_GET['id'] ?? 0)]);
        respostaJson(['sucesso' => true, 'mensagem' => 'Audiência excluída.']);
        break;

    default:
        respostaJson(['sucesso' => false, 'mensagem' => 'Método não permitido.'], 405);
}

function listarAudiencias(PDO $pdo): void
{
    $sql = 'SELECT * FROM audiencias WHERE 1=1';
    $params = [];

    if (!empty($_GET['data_inicio'])) {
        $sql .= ' AND DATE(data_hora) >= :data_inicio';
        $params['data_inicio'] = $_GET['data_inicio'];
    }
    if (!empty($_GET['data_fim'])) {
        $sql .= ' AND DATE(data_hora) <= :data_fim';
        $params['data_fim'] = $_GET['data_fim'];
    }
    if (!empty($_GET['status'])) {
        $sql .= ' AND status = :status';
        $params['status'] = $_GET['status'];
    }
    if (!empty($_GET['vara'])) {
        $sql .= ' AND vara LIKE :vara';
        $params['vara'] = '%' . $_GET['vara'] . '%';
    }

    $sql .= ' ORDER BY data_hora ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    respostaJson(['sucesso' => true, 'audiencias' => $stmt->fetchAll()]);
}

function criarAudiencia(PDO $pdo): void
{
    $d = lerCorpoJson();

    foreach (['numeroProcesso', 'parteAdversa', 'vara', 'data', 'hora', 'tipo'] as $campo) {
        if (empty($d[$campo])) {
            respostaJson(['sucesso' => false, 'mensagem' => 'Preencha todos os campos obrigatórios.'], 400);
        }
    }

    $stmt = $pdo->prepare('INSERT INTO audiencias
        (data_hora, processo_numero, processo_desc, parte_adversa, vara, grau, tipo, status)
        VALUES (:data_hora, :numero, :desc, :parte, :vara, :grau, :tipo, :status)');

    $stmt->execute([
        'data_hora' => $d['data'] . ' ' . $d['hora'] . ':00',
        'numero'    => $d['numeroProcesso'],
        'desc'      => $d['descricao'] ?? null,
        'parte'     => $d['parteAdversa'],
        'vara'      => $d['vara'],
        'grau'      => $d['grau'] ?? '1º Grau',
        'tipo'      => $d['tipo'],
        'status'    => $d['status'] ?? 'Agendada',
    ]);

    respostaJson(['sucesso' => true, 'mensagem' => 'Audiência cadastrada com sucesso!', 'id' => (int) $pdo->lastInsertId()], 201);
}

function atualizarAudiencia(PDO $pdo, int $id): void
{
    if ($id <= 0) {
        respostaJson(['sucesso' => false, 'mensagem' => 'ID inválido.'], 400);
    }

    $d = lerCorpoJson();
    $campos = [];
    $params = ['id' => $id];

    if (isset($d['status'])) {
        $campos[] = 'status = :status';
        $params['status'] = $d['status'];
    }
    if (isset($d['vara'])) {
        $campos[] = 'vara = :vara';
        $params['vara'] = $d['vara'];
    }
    if (isset($d['parteAdversa'])) {
        $campos[] = 'parte_adversa = :parte';
        $params['parte'] = $d['parteAdversa'];
    }
    if (isset($d['data']) && isset($d['hora'])) {
        $campos[] = 'data_hora = :data_hora';
        $params['data_hora'] = $d['data'] . ' ' . $d['hora'] . ':00';
    }

    if (empty($campos)) {
        respostaJson(['sucesso' => false, 'mensagem' => 'Nenhum dado para atualizar.'], 400);
    }

    $sql = 'UPDATE audiencias SET ' . implode(', ', $campos) . ' WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    respostaJson(['sucesso' => true, 'mensagem' => 'Audiência atualizada com sucesso!']);
}
