<?php
/**
 * Conexão com o banco de dados (MySQL / MariaDB) usando PDO.
 *
 * Para mudar usuário/senha SEM editar este arquivo (e sem versionar segredos):
 *   - copie backend/config/config.local.example.php para config.local.php e edite; ou
 *   - defina as variáveis de ambiente DB_HOST, DB_NAME, DB_USER, DB_PASS.
 * Os valores padrão abaixo funcionam no XAMPP/Laragon recém-instalados.
 */

// Configuração local opcional (ignorada pelo Git)
$configLocal = __DIR__ . '/config.local.php';
if (is_file($configLocal)) {
    require_once $configLocal;
}

$definirPadrao = function (string $nome, string $padrao): void {
    if (!defined($nome)) {
        $env = getenv($nome);
        define($nome, $env !== false ? $env : $padrao);
    }
};
$definirPadrao('DB_HOST', 'localhost');
$definirPadrao('DB_NAME', 'advub');
$definirPadrao('DB_USER', 'root');
$definirPadrao('DB_PASS', '');   // no XAMPP/Laragon padrão a senha do root é vazia
$definirPadrao('DB_CHARSET', 'utf8mb4');

/**
 * Retorna uma instância PDO já conectada ao banco.
 * Em caso de falha, registra o detalhe no log do PHP e responde um erro genérico.
 */
function getConexao(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            error_log('Falha na conexão com o banco: ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'sucesso'  => false,
                'mensagem' => 'Falha ao conectar ao banco de dados. Verifique se o MySQL está ligado, se o banco "advub" foi importado e as credenciais em backend/config.',
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    return $pdo;
}
