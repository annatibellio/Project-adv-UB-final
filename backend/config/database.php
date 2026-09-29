<?php
/**
 * Conexão com o banco de dados (MySQL / MariaDB) usando PDO.
 *
 * Ajuste as constantes abaixo com os dados do seu ambiente
 * (XAMPP, Laragon, WAMP, servidor da faculdade, etc).
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'advub');
define('DB_USER', 'root');
define('DB_PASS', '');       // no XAMPP/Laragon padrão a senha do root é vazia
define('DB_CHARSET', 'utf8mb4');

/**
 * Retorna uma instância PDO já conectada ao banco.
 * Lança uma exceção clara em caso de falha na conexão.
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
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Falha ao conectar ao banco de dados: ' . $e->getMessage(),
            ]);
            exit;
        }
    }

    return $pdo;
}
