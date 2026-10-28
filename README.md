# Juris Gestor — ADV UB

Sistema web de gestão para escritório de advocacia (projeto acadêmico): login, dashboard, processos, movimentações, audiências, agenda e documentos com upload.

**Stack:** HTML + CSS + JavaScript (front-end) · PHP 8+ com PDO (API em `backend/api`) · MySQL/MariaDB.

---

## 1. Pré-requisitos

- **XAMPP** (ou Laragon/WAMP) com Apache, **PHP 8.0+** e MySQL/MariaDB. Extensões `pdo_mysql` e `mbstring` (já vêm ativas).
- Um navegador atualizado.
- *(Opcional, só para rodar os testes)* **Node.js 18+**.

## 2. Instalação (XAMPP, passo a passo)

1. Baixe/clone o projeto e copie a pasta para `C:\xampp\htdocs\` renomeando-a para **`Project-adv-UB`**
   (no Linux/macOS: `/opt/lampp/htdocs/` ou `/Applications/XAMPP/htdocs/`).
   ```bash
   git clone <URL-DO-SEU-REPOSITORIO> Project-adv-UB
   ```
2. Abra o **XAMPP Control Panel** e inicie **Apache** e **MySQL**.
3. Crie o banco, **escolha uma das opções**:
   - **phpMyAdmin** (`http://localhost/phpmyadmin`) → aba **Importar** → selecione `database/instalar_tudo.sql` → **Importar**.
   - **Terminal:**
     ```bash
     mysql -u root -p < database/instalar_tudo.sql
     ```
     (no XAMPP a senha do `root` é vazia: apenas pressione Enter)
   > ⚠️ O script apaga e recria os dados de exemplo. Não rode em um banco com dados que você quer manter.
4. Acesse: **http://localhost/Project-adv-UB/pages/Login/index.html**

**Login de teste:** `admin@advub.com.br` · senha `123456`

## 3. Configuração do banco (só se necessário)

Por padrão a conexão usa `localhost`, banco `advub`, usuário `root`, senha vazia. Se o seu MySQL for diferente:

```bash
cp backend/config/config.local.example.php backend/config/config.local.php
# edite DB_HOST, DB_NAME, DB_USER, DB_PASS nesse arquivo
```
O `config.local.php` é ignorado pelo Git (não envie senhas ao GitHub). Alternativa: definir as variáveis de ambiente `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`.

## 4. Execução alternativa (sem XAMPP)

Com PHP e MySQL instalados e o banco importado:

```bash
php -S localhost:8000
```
Acesse `http://localhost:8000/pages/Login/index.html`.

## 5. Testes

```bash
npm test
```
Executa verificações estáticas com Node.js (sintaxe dos JS, estrutura dos PHP e SQL, escape de HTML, `.gitignore`). **Eles não substituem o teste manual**: após instalar, faça login e percorra cada página (criar/editar/excluir processo, movimentação, upload de documento, audiência e compromisso).

## 6. Estrutura de pastas

```
Project-adv-UB/
├── index.html               # redireciona para o dashboard
├── assets/                  # CSS global e imagens
├── Components/              # sidebar, auth-guard.js (exige login) e utils.js (escapeHtml)
├── pages/                   # Login, dashboard, processos, audiencias, agenda, documentos
├── backend/
│   ├── api/                 # endpoints PHP (login, processos, documentos, ...)
│   ├── config/              # database.php (PDO) e helpers.php (sessão, validações, upload)
│   └── uploads/             # arquivos enviados (conteúdo não é versionado)
├── database/                # schema.sql, seed.sql e instalar_tudo.sql
├── tests/                   # testes (Node.js)
└── package.json
```

## 7. Segurança implementada

Senhas com `password_hash`, sessão com cookie `HttpOnly`/`SameSite`, `session_regenerate_id` no login, consultas preparadas (PDO), escape de HTML no front-end, validação de datas/horas/status, upload limitado a 10 MB e extensões permitidas com nome aleatório, pasta `uploads` sem acesso direto, e erros internos sem vazar detalhes. Para uso real, publique com HTTPS e troque a senha do usuário de teste.

## 8. Problemas comuns

| Sintoma | Solução |
|---|---|
| "Falha ao conectar ao banco de dados" | MySQL desligado no XAMPP, banco `advub` não importado ou credenciais erradas (veja seção 3). |
| Página em branco / código PHP aparece no navegador | Abra via `http://localhost/...`, não clicando no arquivo (`file://`). |
| "Não foi possível conectar ao servidor" | Apache desligado ou pasta com nome diferente de `Project-adv-UB` (ajuste a URL). |
| Login sempre inválido | Reimporte `database/instalar_tudo.sql` e use `admin@advub.com.br` / `123456`. |
| Volta para o login a cada página | Cookies bloqueados, ou o site foi aberto por URLs diferentes (`localhost` vs `127.0.0.1`). |
| Upload falha ("muito grande") | Limite de 10 MB; confira `upload_max_filesize` e `post_max_size` no `php.ini` e reinicie o Apache. |
| Upload falha ("Falha ao salvar") | Dê permissão de escrita à pasta `backend/uploads/` (Linux: `chmod -R 775 backend/uploads`). |
| Porta 80/3306 ocupada | Feche Skype/IIS/outro MySQL, ou mude a porta no XAMPP. |
| `npm test` não encontra testes | Use Node.js 18+ (`node -v`). |

## 9. Publicar no GitHub

```bash
git init && git add . && git commit -m "Projeto Juris Gestor"
git branch -M main
git remote add origin <URL-DO-SEU-REPOSITORIO>
git push -u origin main
```
