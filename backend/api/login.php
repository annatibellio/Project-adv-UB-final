<?php
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../config/database.php';

exigirMetodo('POST');

$dados = lerCorpoJson();
$email = trim((string) ($dados['email'] ?? ''));
$senha = (string) ($dados['senha'] ?? '');

if ($email === '' || $senha === '') {
    respostaJson(['sucesso' => false, 'mensagem' => 'Preencha o e-mail e a senha!'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respostaJson(['sucesso' => false, 'mensagem' => 'Digite um e-mail válido!'], 400);
}

$pdo = getConexao();
$stmt = $pdo->prepare('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = :email LIMIT 1');
$stmt->execute(['email' => $email]);
$usuario = $stmt->fetch();

if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
    respostaJson(['sucesso' => false, 'mensagem' => 'E-mail ou senha inválidos.'], 401);
}

// Login OK: renova o ID da sessão (evita session fixation) e guarda o usuário
session_regenerate_id(true);
$_SESSION['usuario_id']   = $usuario['id'];
$_SESSION['usuario_nome'] = $usuario['nome'];
$_SESSION['usuario_email'] = $usuario['email'];

respostaJson([
    'sucesso' => true,
    'usuario' => [
        'id'    => $usuario['id'],
        'nome'  => $usuario['nome'],
        'email' => $usuario['email'],
    ],
]);
