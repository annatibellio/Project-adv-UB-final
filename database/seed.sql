-- ============================================================
-- JURIS GESTOR — ADV UB
-- Dados de exemplo (os mesmos que já existiam nos arquivos .js)
-- Rode depois do schema.sql
-- ============================================================

USE `advub`;

-- Limpa os dados antigos para o script poder ser executado mais de uma vez
-- (DELETE em vez de TRUNCATE, porque TRUNCATE não funciona em tabelas com chave estrangeira)
DELETE FROM `movimentacoes`;
DELETE FROM `documentos_processo`;
DELETE FROM `documentos`;
DELETE FROM `audiencias`;
DELETE FROM `compromissos`;
DELETE FROM `processos`;
DELETE FROM `usuarios`;
ALTER TABLE `movimentacoes` AUTO_INCREMENT = 1;
ALTER TABLE `documentos_processo` AUTO_INCREMENT = 1;
ALTER TABLE `documentos` AUTO_INCREMENT = 1;
ALTER TABLE `audiencias` AUTO_INCREMENT = 1;
ALTER TABLE `compromissos` AUTO_INCREMENT = 1;
ALTER TABLE `processos` AUTO_INCREMENT = 1;
ALTER TABLE `usuarios` AUTO_INCREMENT = 1;

-- ------------------------------------------------------------
-- USUÁRIO PADRÃO PARA LOGIN DE TESTES
-- e-mail: admin@advub.com.br
-- senha : 123456
-- ------------------------------------------------------------
INSERT INTO `usuarios` (`nome`, `email`, `senha_hash`, `oab`) VALUES
('Wallace Pereira', 'admin@advub.com.br', '$2y$10$FK5QYuTmSLcd7ULxUUNn.uARzcDmlMX0O1TeM609j0sc.cCzaV4O6', 'OAB/SP 123456');

-- ------------------------------------------------------------
-- PROCESSOS
-- ------------------------------------------------------------
INSERT INTO `processos`
  (`id`, `numero`, `cliente`, `cpf_cnpj`, `area`, `vara`, `advogado`, `data_abertura`, `situacao`, `ultima_atualizacao`) VALUES
(1, '0012345-67.2024.8.26.0100', 'Empresa ABC Ltda.',   '12.345.676/0001-90', 'Cível',        'TJSP - 3ª Vara Cível',   'Wallace Pereira', '2024-01-15', 'Em andamento', 'Hoje, 09:15'),
(2, '0023456-78.2024.8.26.0100', 'João da Silva',        '123.456.789-00',     'Cível',        'TJSP - 3ª Vara Cível',   'Mariana Costa',   '2024-02-10', 'Aguardando',   'Ontem, 17:30'),
(3, '0034567-89.2024.8.26.0100', 'Maria Oliveira',       '987.654.321-00',     'Trabalhista',  'TRT 2ª Região - 1ª VT',  'Carlos Matos',    '2024-03-05', 'Suspenso',     '25/05/2025'),
(4, '0045678-90.2024.8.26.0100', 'Empresa XYZ S.A.',    '98.765.432/0001-10', 'Tributário',   'TJSP - 2ª Vara Cível',   'Wallace Pereira', '2024-04-20', 'Em andamento', '23/05/2025'),
(5, '0056789-01.2024.8.26.0100', 'Carlos Alberto',       '321.654.987-00',     'Cível',        'TJSP - 1ª Vara Cível',   'Mariana Costa',   '2024-05-12', 'Arquivado',    '20/05/2025');

-- ------------------------------------------------------------
-- MOVIMENTAÇÕES
-- ------------------------------------------------------------
INSERT INTO `movimentacoes` (`processo_id`, `descricao`, `responsavel`, `cargo`, `data_hora`) VALUES
(1, 'Petição inicial protocolada com sucesso', 'Wallace Pereira',     'Advogado',   '2026-05-27 09:15:00'),
(1, 'Citação do réu realizada via AR',          'Cartório TJSP',       'Cartório',   '2026-05-20 14:30:00'),
(1, 'Despacho saneador publicado',              'Juíza Dra. Ana Lima', 'Magistrada', '2026-05-10 11:00:00'),
(2, 'Aguardando resposta do réu no prazo de 15 dias', 'Mariana Costa', 'Advogada',  '2026-05-26 17:30:00'),
(3, 'Processo suspenso por acordo entre as partes',   'Carlos Matos',  'Advogado',  '2025-05-25 10:00:00'),
(4, 'Recurso de apelação interposto',                 'Wallace Pereira','Advogado', '2025-05-23 16:00:00'),
(5, 'Processo encerrado com êxito - arquivado definitivamente', 'Juiz Dr. Roberto Souza', 'Magistrado', '2025-05-20 09:00:00');

-- ------------------------------------------------------------
-- DOCUMENTOS ANEXADOS AOS PROCESSOS (dentro do modal de detalhes)
-- ------------------------------------------------------------
INSERT INTO `documentos_processo` (`processo_id`, `nome`, `data`) VALUES
(1, 'Petição Inicial.pdf',            '2024-01-15'),
(1, 'Procuração.pdf',                 '2024-01-15'),
(1, 'Comprovante de Citação.pdf',     '2026-05-20'),
(2, 'Contrato de Honorários.pdf',     '2024-02-10'),
(4, 'Recurso de Apelação.pdf',        '2025-05-23'),
(5, 'Sentença Final.pdf',             '2025-05-20'),
(5, 'Certidão de Baixa.pdf',          '2025-05-20');

-- ------------------------------------------------------------
-- DOCUMENTOS (página Documentos)
-- ------------------------------------------------------------
INSERT INTO `documentos` (`nome`, `tipo`, `processo_numero`, `processo_relacionado`, `arquivo_nome`, `arquivo_path`, `data_envio`, `status`) VALUES
('Procuração - Maria Souza',             'Procuração', '0098765-12.2024.8.26.0000', NULL, 'procuracao_maria.pdf',    '', '2025-03-10', 'enviado'),
('Contrato de Prestação de Serviços',    'Contrato',   '0011223-34.2024.8.26.0000', NULL, 'contrato_prestacao.pdf',  '', '2025-03-15', 'enviado'),
('Comprovante de Pagamento - Abril',     'Comprovante','0044556-67.2024.8.26.0000', NULL, 'comprovante_abril.pdf',   '', '2025-04-02', 'enviado'),
('Petição Inicial - Carlos Lima',        'Petição',    '0077889-90.2024.8.26.0000', NULL, 'peticao_carlos.pdf',      '', '2025-04-18', 'enviado'),
('Contrato de Honorários - Ana Paula',   'Contrato',   '0033221-10.2024.8.26.0000', NULL, 'contrato_ana.pdf',        '', '2025-05-05', 'enviado');

-- ------------------------------------------------------------
-- AUDIÊNCIAS
-- ------------------------------------------------------------
INSERT INTO `audiencias` (`data_hora`, `processo_numero`, `processo_desc`, `parte_adversa`, `vara`, `grau`, `tipo`, `status`) VALUES
(CONCAT(CURDATE(), ' 09:00:00'), '0001234-56.2024.8.26.0000', 'Ação de Cobrança',        'Universidade Brasil',              '3ª Vara Cível',       '1º Grau', 'Audiência de Conciliação', 'Agendada'),
(CONCAT(DATE_ADD(CURDATE(), INTERVAL 1 DAY), ' 14:00:00'), '0012345-67.2024.8.26.0000', 'Ação Trabalhista',        'Ricardo Da Silva Alves',           '2ª Vara do Trabalho', '1º Grau', 'Instrução e Julgamento',   'Confirmada'),
(CONCAT(DATE_SUB(CURDATE(), INTERVAL 5 DAY), ' 10:30:00'), '0023456-78.2024.8.26.0000', 'Ação de Alimentos',       'Edson Company Colalto Junior',     '2ª Vara de Família',  '1º Grau', 'Conciliação',              'Realizada'),
(CONCAT(DATE_ADD(CURDATE(), INTERVAL 6 DAY), ' 09:30:00'), '0034567-89.2024.8.26.0000', 'Indenização por Danos',   'José Maria da Silva',              '4ª Vara Cível',       '1º Grau', 'Instrução e Julgamento',   'Agendada'),
(CONCAT(DATE_ADD(CURDATE(), INTERVAL 8 DAY), ' 16:00:00'), '0045678-90.2024.8.26.0000', 'Revisional de Contrato',  'Thiago Duarte de Oliveira',        '7ª Vara Cível',       '1º Grau', 'Conciliação',              'Cancelada');

-- ------------------------------------------------------------
-- COMPROMISSOS DA AGENDA
-- ------------------------------------------------------------
INSERT INTO `compromissos` (`titulo`, `data`, `hora`, `tipo`) VALUES
('Prazo: Contestação',           DATE_ADD(CURDATE(), INTERVAL 2 DAY), NULL, 'Prazo Processual'),
('Audiência: Proc. 0023...',     DATE_ADD(CURDATE(), INTERVAL 7 DAY), NULL, 'Audiência'),
('Prazo: Manifestação',          DATE_ADD(CURDATE(), INTERVAL 5 DAY), NULL, 'Prazo Processual'),
('Prazo: Recurso',               DATE_ADD(CURDATE(), INTERVAL 3 DAY), NULL, 'Prazo Processual');
