# Juris Gestor — ADV UB — Backend (PHP + MySQL)

Este projeto agora tem **front-end** (o que já existia) + **backend em PHP** +
**banco de dados MySQL**. As funções que estavam incompletas no semestre passado
(login, cadastro/edição de processos, movimentações, upload de documentos,
audiências e agenda) foram conectadas ao banco de dados real.

O visual (HTML/CSS) **não foi alterado**. Só a lógica JavaScript que antes usava
dados fixos ("mockados") agora conversa com os arquivos PHP em `backend/api/`.

---

## 1. Requisitos

- **XAMPP**, **Laragon** ou **WAMP** (qualquer ambiente com Apache + PHP 8+ + MySQL)
- PHP com a extensão `pdo_mysql` habilitada (já vem ativada por padrão nesses pacotes)

## 2. Instalação

1. Copie a pasta inteira do projeto (`Project-adv-UB`) para dentro de `htdocs`
   (XAMPP) ou `www` (Laragon).

2. Abra o **phpMyAdmin** (ou HeidiSQL, DBeaver, etc.) e importe, **nesta ordem**:
   - `database/schema.sql` → cria o banco `advub` e todas as tabelas.
   - `database/seed.sql` → insere os dados de exemplo (os mesmos que já
     existiam no código) e um usuário de teste.

   Ou, pelo terminal:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```

3. Confira as credenciais do banco em `backend/config/database.php`. No
   XAMPP/Laragon padrão, o usuário é `root` e a senha é vazia — então
   normalmente **não precisa mudar nada**.

4. Acesse pelo navegador:
   ```
   http://localhost/Project-adv-UB/pages/Login/index.html
   ```

## 3. Login de teste

```
E-mail: admin@advub.com.br
Senha : 123456
```

Para cadastrar outros usuários por enquanto é preciso inserir direto no banco
(tabela `usuarios`), gerando o hash da senha com `password_hash()` do PHP. Se
quiser, dá pra criar depois uma tela de cadastro de usuário chamando um novo
endpoint `backend/api/registrar.php` — não veio pronta porque o projeto
original também não tinha essa tela.

## 4. O que foi implementado

| Página       | O que já funcionava (front) | O que foi conectado ao banco |
|--------------|------------------------------|-------------------------------|
| Login        | Validação de formato de e-mail | Autenticação real (sessão PHP + senha com hash) |
| Dashboard    | Layout dos cards/gráfico | KPIs, gráfico de situação dos processos e feed calculados a partir do banco |
| Processos    | CRUD completo (só na memória) | CRUD completo persistido, movimentações, anexo de documentos com upload real |
| Audiências   | Só o layout da tabela | Listagem, filtros (data/status/vara), cadastro de audiência, avançar status |
| Agenda       | Calendário com eventos fixos | Calendário dinâmico, próximos prazos, cadastro de novo compromisso |
| Documentos   | CRUD só na memória, sem upload real | CRUD completo com upload/download de arquivo real no servidor |

## 5. Estrutura de pastas criada

```
Project-adv-UB/
├── backend/
│   ├── config/
│   │   ├── database.php      # conexão PDO
│   │   └── helpers.php       # funções auxiliares (sessão, JSON)
│   ├── api/
│   │   ├── login.php
│   │   ├── logout.php
│   │   ├── check_session.php
│   │   ├── processos.php
│   │   ├── movimentacoes.php
│   │   ├── documentos_processo.php
│   │   ├── documentos.php
│   │   ├── audiencias.php
│   │   ├── agenda.php
│   │   └── dashboard.php
│   └── uploads/               # arquivos enviados pelos usuários
│       ├── processos/
│       └── documentos/
└── database/
    ├── schema.sql
    └── seed.sql
```

## 6. Próximos passos sugeridos (para você continuar evoluindo)

- Tela de cadastro/edição de usuários
- Validação mais forte de CPF/CNPJ e número de processo (máscaras)
- Paginação/filtros também na página de Documentos e Audiências vindos do servidor (hoje o filtro de documentos é só no front)
- Deploy em um servidor com HTTPS antes de usar em produção (hoje as senhas trafegam via HTTPS só se o Apache estiver configurado com certificado)
