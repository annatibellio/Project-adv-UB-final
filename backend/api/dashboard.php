<?php
/**
 * API do Dashboard: calcula os indicadores (KPIs) reais a partir do banco,
 * no lugar dos números fixos que existiam no dashboard.js original.
 *
 * GET dashboard.php
 */

require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/database.php';

exigirLogin();
exigirMetodo('GET');

$pdo = getConexao();

// Processos ativos = tudo que não está Arquivado
$processosAtivos = (int) $pdo->query(
    "SELECT COUNT(*) FROM processos WHERE situacao != 'Arquivado'"
)->fetchColumn();

// Prazos/compromissos nos próximos 7 dias
$prazosProximos = (int) $pdo->query(
    "SELECT COUNT(*) FROM compromissos WHERE data BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)"
)->fetchColumn();

// Audiências de hoje
$audienciasHoje = (int) $pdo->query(
    "SELECT COUNT(*) FROM audiencias WHERE DATE(data_hora) = CURDATE()"
)->fetchColumn();

// Documentos pendentes = usados aqui como "tarefas pendentes"
$tarefasPendentes = (int) $pdo->query(
    "SELECT COUNT(*) FROM documentos WHERE status = 'pendente'"
)->fetchColumn();

// Distribuição de processos por situação (para o gráfico de pizza)
$distribuicao = $pdo->query(
    "SELECT situacao, COUNT(*) AS total FROM processos GROUP BY situacao"
)->fetchAll();

// Últimas movimentações registradas no sistema (feed de informações recentes)
$feed = $pdo->query(
    "SELECT m.descricao, m.data_hora, p.numero
     FROM movimentacoes m
     JOIN processos p ON p.id = m.processo_id
     ORDER BY m.data_hora DESC
     LIMIT 5"
)->fetchAll();

respostaJson([
    'sucesso' => true,
    'kpis' => [
        'processosAtivos'  => $processosAtivos,
        'prazosProximos'   => $prazosProximos,
        'audienciasHoje'   => $audienciasHoje,
        'tarefasPendentes' => $tarefasPendentes,
    ],
    'distribuicaoProcessos' => $distribuicao,
    'feed' => $feed,
]);
