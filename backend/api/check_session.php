<?php
require_once __DIR__ . '/../config/helpers.php';

if (empty($_SESSION['usuario_id'])) {
    respostaJson(['logado' => false]);
}

respostaJson([
    'logado' => true,
    'usuario' => [
        'id'    => $_SESSION['usuario_id'],
        'nome'  => $_SESSION['usuario_nome'] ?? '',
        'email' => $_SESSION['usuario_email'] ?? '',
    ],
]);
