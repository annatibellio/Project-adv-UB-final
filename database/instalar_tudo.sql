-- Arquivo ÚNICO: cria o banco + tabelas + dados de teste.
-- No phpMyAdmin: aba "Importar" -> escolher ESTE arquivo -> Importar.
-- ============================================================
-- JURIS GESTOR — ADV UB
-- Script de criação do banco de dados
-- Rode este arquivo no phpMyAdmin, HeidiSQL, DBeaver ou:
--   mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `advub`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `advub`;

-- ------------------------------------------------------------
-- USUÁRIOS (login do sistema)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nome`          VARCHAR(150)        NOT NULL,
  `email`         VARCHAR(150)        NOT NULL UNIQUE,
  `senha_hash`    VARCHAR(255)        NOT NULL,
  `oab`           VARCHAR(30)         NULL,
  `criado_em`     DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PROCESSOS (página Processos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `processos` (
  `id`                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `numero`              VARCHAR(40)   NOT NULL UNIQUE,
  `cliente`             VARCHAR(150)  NOT NULL,
  `cpf_cnpj`            VARCHAR(30)   NOT NULL,
  `area`                VARCHAR(40)   NOT NULL,
  `vara`                VARCHAR(150)  NOT NULL,
  `advogado`            VARCHAR(150)  NOT NULL,
  `data_abertura`       DATE          NOT NULL,
  `situacao`            VARCHAR(30)   NOT NULL,
  `ultima_atualizacao`  VARCHAR(60)   NOT NULL,
  `criado_em`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- MOVIMENTAÇÕES (linha do tempo de cada processo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `movimentacoes` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `processo_id`   INT UNSIGNED  NOT NULL,
  `descricao`     TEXT          NOT NULL,
  `responsavel`   VARCHAR(150)  NOT NULL,
  `cargo`         VARCHAR(60)   NULL,
  `data_hora`     DATETIME      NOT NULL,
  `criado_em`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_mov_processo`
    FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- DOCUMENTOS ANEXADOS A UM PROCESSO (aba "Documentos" dentro do
-- modal de detalhes do processo, em Processos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `documentos_processo` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `processo_id`   INT UNSIGNED  NOT NULL,
  `nome`          VARCHAR(200)  NOT NULL,
  `arquivo_path`  VARCHAR(255)  NULL,
  `data`          DATE          NOT NULL,
  `criado_em`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_docproc_processo`
    FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- DOCUMENTOS (página Documentos — catálogo geral do escritório)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `documentos` (
  `id`                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nome`                  VARCHAR(200)  NOT NULL,
  `tipo`                  VARCHAR(40)   NOT NULL,
  `processo_numero`       VARCHAR(40)   NOT NULL,
  `processo_relacionado`  VARCHAR(40)   NULL,
  `arquivo_nome`          VARCHAR(255)  NOT NULL,
  `arquivo_path`          VARCHAR(255)  NOT NULL,
  `data_envio`            DATE          NOT NULL,
  `status`                ENUM('pendente','enviado') NOT NULL DEFAULT 'pendente',
  `criado_em`             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- AUDIÊNCIAS (página Audiências)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audiencias` (
  `id`              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `data_hora`       DATETIME      NOT NULL,
  `processo_numero` VARCHAR(40)   NOT NULL,
  `processo_desc`   VARCHAR(150)  NULL,
  `parte_adversa`   VARCHAR(150)  NOT NULL,
  `vara`            VARCHAR(150)  NOT NULL,
  `grau`            VARCHAR(30)   NULL,
  `tipo`            VARCHAR(60)   NOT NULL,
  `status`          ENUM('Agendada','Confirmada','Realizada','Cancelada') NOT NULL DEFAULT 'Agendada',
  `criado_em`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- COMPROMISSOS DA AGENDA (página Agenda / FullCalendar)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `compromissos` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `titulo`      VARCHAR(200)  NOT NULL,
  `data`        DATE          NOT NULL,
  `hora`        TIME          NULL,
  `tipo`        VARCHAR(40)   NOT NULL DEFAULT 'Outros',
  `criado_em`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- Limpa os dados antigos para o script poder ser executado mais de uma vez
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `movimentacoes`;
TRUNCATE TABLE `documentos_processo`;
TRUNCATE TABLE `documentos`;
TRUNCATE TABLE `audiencias`;
TRUNCATE TABLE `compromissos`;
TRUNCATE TABLE `processos`;
TRUNCATE TABLE `usuarios`;
SET FOREIGN_KEY_CHECKS = 1;

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
('2026-05-27 09:00:00', '0001234-56.2024.8.26.0000', 'Ação de Cobrança',        'Universidade Brasil',              '3ª Vara Cível',       '1º Grau', 'Audiência de Conciliação', 'Agendada'),
('2026-05-28 14:00:00', '0012345-67.2024.8.26.0000', 'Ação Trabalhista',        'Ricardo Da Silva Alves',           '2ª Vara do Trabalho', '1º Grau', 'Instrução e Julgamento',   'Confirmada'),
('2026-06-03 10:30:00', '0023456-78.2024.8.26.0000', 'Ação de Alimentos',       'Edson Company Colalto Junior',     '2ª Vara de Família',  '1º Grau', 'Conciliação',              'Realizada'),
('2026-06-10 09:30:00', '0034567-89.2024.8.26.0000', 'Indenização por Danos',   'José Maria da Silva',              '4ª Vara Cível',       '1º Grau', 'Instrução e Julgamento',   'Agendada'),
('2026-06-12 16:00:00', '0045678-90.2024.8.26.0000', 'Revisional de Contrato',  'Thiago Duarte de Oliveira',        '7ª Vara Cível',       '1º Grau', 'Conciliação',              'Cancelada');

-- ------------------------------------------------------------
-- COMPROMISSOS DA AGENDA
-- ------------------------------------------------------------
INSERT INTO `compromissos` (`titulo`, `data`, `hora`, `tipo`) VALUES
('Prazo: Contestação',           '2026-05-08', NULL, 'Prazo Processual'),
('Audiência: Proc. 0023...',     '2026-05-15', NULL, 'Audiência'),
('Prazo: Manifestação',          '2026-05-14', NULL, 'Prazo Processual'),
('Prazo: Recurso',               '2026-05-09', NULL, 'Prazo Processual');
