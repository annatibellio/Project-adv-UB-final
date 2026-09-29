<?php
/**
 * API de Movimentações (linha do tempo de um processo).
 *
 * GET    movimentacoes.php?processo_id=1  -> lista movimentações do processo
 * POST   movimentacoes.php                -> cria uma nova movimentação
 * DELETE movimentacoes.php?id=5           -> exclui uma movimentação
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/database.php';

exigirLogin();
$pdo = getConexao();

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        $processoId = (int) ($_GET['processo_id'] ?? 0);
        if ($processoId <= 0) {
            respostaJson(['sucesso' => false, 'mensagem' => 'Informe o processo_id.'], 400);
        }
        $stmt = $pdo->prepare('SELECT * FROM movimentacoes WHERE processo_id = :id ORDER BY data_hora DESC');
        $stmt->execute(['id' => $processoId]);
        respostaJson(['sucesso' => true, 'movimentacoes' => $stmt->fetchAll()]);
        break;

    case 'POST':
        $d = lerCorpoJson();

        foreach (['processoId', 'descricao', 'responsavel', 'cargo', 'data', 'hora'] as $campo) {
            if (empty($d[$campo])) {
                respostaJson(['sucesso' => false, 'mensagem' => 'Preencha todos os campos da movimentação.'], 400);
            }
        }

        $dataHora = $d['data'] . ' ' . $d['hora'] . ':00';

        $stmt = $pdo->prepare('INSERT INTO movimentacoes (processo_id, descricao, responsavel, cargo, data_hora)
            VALUES (:processo_id, :descricao, :responsavel, :cargo, :data_hora)');
        $stmt->execute([
            'processo_id' => (int) $d['processoId'],
            'descricao'   => $d['descricao'],
            'responsavel' => $d['responsavel'],
            'cargo'       => $d['cargo'],
            'data_hora'   => $dataHora,
        ]);

        // atualiza a "última atualização" exibida na tabela de processos
        $upd = $pdo->prepare('UPDATE processos SET ultima_atualizacao = :ultima WHERE id = :id');
        $upd->execute([
            'ultima' => (new DateTime($dataHora))->format('d/m/Y H:i'),
            'id'     => (int) $d['processoId'],
        ]);

        respostaJson(['sucesso' => true, 'mensagem' => 'Movimentação registrada com sucesso!', 'id' => (int) $pdo->lastInsertId()], 201);
        break;

    case 'DELETE':
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            respostaJson(['sucesso' => false, 'mensagem' => 'ID inválido.'], 400);
        }
        $stmt = $pdo->prepare('DELETE FROM movimentacoes WHERE id = :id');
        $stmt->execute(['id' => $id]);
        respostaJson(['sucesso' => true, 'mensagem' => 'Movimentação excluída.']);
        break;

    default:
        respostaJson(['sucesso' => false, 'mensagem' => 'Método não permitido.'], 405);
}
