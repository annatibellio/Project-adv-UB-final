<?php
/**
 * API da página Agenda (compromissos exibidos no FullCalendar).
 *
 * GET    agenda.php        -> lista todos os compromissos (formato pronto para o FullCalendar)
 * POST   agenda.php        -> cria um novo compromisso
 * DELETE agenda.php?id=1   -> exclui um compromisso
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/database.php';

exigirLogin();
$pdo = getConexao();

$metodo = $_SERVER['REQUEST_METHOD'];

// Cores por tipo de compromisso (iguais às usadas no mock original do agenda.js)
$cores = [
    'Prazo Processual' => ['bg' => '#fee2e2', 'text' => '#991b1b'],
    'Audiência'         => ['bg' => '#e0e7ff', 'text' => '#3730a3'],
    'Reunião'           => ['bg' => '#dcfce7', 'text' => '#166534'],
    'Outros'            => ['bg' => '#fef3c7', 'text' => '#92400e'],
];

switch ($metodo) {
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM compromissos ORDER BY data ASC');
        $eventos = array_map(function ($c) use ($cores) {
            $cor = $cores[$c['tipo']] ?? $cores['Outros'];
            return [
                'id'              => $c['id'],
                'title'           => $c['titulo'],
                'start'           => $c['data'] . ($c['hora'] ? 'T' . $c['hora'] : ''),
                'tipo'            => $c['tipo'],
                'backgroundColor' => $cor['bg'],
                'textColor'       => $cor['text'],
            ];
        }, $stmt->fetchAll());

        respostaJson(['sucesso' => true, 'eventos' => $eventos]);
        break;

    case 'POST':
        $d = lerCorpoJson();

        foreach (['titulo', 'data'] as $campo) {
            if (empty($d[$campo])) {
                respostaJson(['sucesso' => false, 'mensagem' => 'Preencha o título e a data do compromisso.'], 400);
            }
        }

        if (!dataValida($d['data']) || (!empty($d['hora']) && !horaValida($d['hora']))) {
            respostaJson(['sucesso' => false, 'mensagem' => 'Data ou hora inválida.'], 400);
        }
        if (!is_string($d['titulo']) || mb_strlen(trim($d['titulo'])) > 200) {
            respostaJson(['sucesso' => false, 'mensagem' => 'Título inválido (máximo de 200 caracteres).'], 400);
        }
        $tipo = $d['tipo'] ?? 'Outros';
        if (!isset($cores[$tipo])) {
            $tipo = 'Outros';
        }

        $stmt = $pdo->prepare('INSERT INTO compromissos (titulo, data, hora, tipo)
            VALUES (:titulo, :data, :hora, :tipo)');
        $stmt->execute([
            'titulo' => trim($d['titulo']),
            'data'   => $d['data'],
            'hora'   => !empty($d['hora']) ? $d['hora'] : null,
            'tipo'   => $tipo,
        ]);

        respostaJson(['sucesso' => true, 'mensagem' => 'Compromisso salvo com sucesso!', 'id' => (int) $pdo->lastInsertId()], 201);
        break;

    case 'DELETE':
        $stmt = $pdo->prepare('DELETE FROM compromissos WHERE id = :id');
        $stmt->execute(['id' => (int) ($_GET['id'] ?? 0)]);
        if ($stmt->rowCount() === 0) {
            respostaJson(['sucesso' => false, 'mensagem' => 'Compromisso não encontrado.'], 404);
        }
        respostaJson(['sucesso' => true, 'mensagem' => 'Compromisso excluído.']);
        break;

    default:
        respostaJson(['sucesso' => false, 'mensagem' => 'Método não permitido.'], 405);
}
