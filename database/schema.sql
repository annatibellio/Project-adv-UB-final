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
