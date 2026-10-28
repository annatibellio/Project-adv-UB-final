// Testes estáticos: rodam só com Node.js (sem PHP/MySQL). Uso: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.join(__dirname, '..');
const ler = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
function listar(dir, ext, acc = []) {
  for (const n of fs.readdirSync(path.join(raiz, dir), { withFileTypes: true })) {
    const rel = path.join(dir, n.name);
    if (n.isDirectory()) listar(rel, ext, acc);
    else if (n.name.endsWith(ext)) acc.push(rel);
  }
  return acc;
}

test('escapeHtml neutraliza HTML e aspas', () => {
  const ctx = {};
  vm.runInNewContext(ler('Components/utils.js') + '\nthis.fn = escapeHtml;', ctx);
  assert.strictEqual(ctx.fn('<img src=x onerror="a()">'), '&lt;img src=x onerror=&quot;a()&quot;&gt;');
  assert.strictEqual(ctx.fn("O'Neil & Cia"), 'O&#39;Neil &amp; Cia');
  assert.strictEqual(ctx.fn(null), '');
  assert.strictEqual(ctx.fn(42), '42');
});

test('todos os arquivos JS têm sintaxe válida', () => {
  for (const f of [...listar('pages', '.js'), ...listar('Components', '.js')]) {
    assert.doesNotThrow(() => new vm.Script(ler(f), { filename: f }), f);
  }
});

test('páginas internas carregam utils.js antes dos demais scripts', () => {
  for (const p of ['agenda', 'audiencias', 'dashboard', 'documentos', 'processos']) {
    const html = ler(`pages/${p}/index.html`);
    const iUtils = html.indexOf('Components/utils.js');
    assert.ok(iUtils > -1, `${p} sem utils.js`);
    assert.ok(iUtils < html.indexOf('Components/auth-guard.js'), `${p}: ordem dos scripts`);
  }
});

test('arquivos PHP têm chaves/parênteses balanceados e usam só tabelas do schema', () => {
  const schema = ler('database/schema.sql');
  const tabelas = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS `(\w+)`/g)].map((m) => m[1]);
  assert.ok(tabelas.length >= 7);
  for (const f of listar('backend', '.php')) {
    const src = ler(f);
    // remove strings e comentários antes de contar
    const limpo = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""');
    for (const [a, b] of [['{', '}'], ['(', ')'], ['[', ']']]) {
      assert.strictEqual(limpo.split(a).length, limpo.split(b).length, `${f}: ${a}${b} desbalanceado`);
    }
    for (const m of src.matchAll(/(?:FROM|INTO|UPDATE|JOIN)\s+`?(\w+)`?/g)) {
      if (['processos','usuarios','movimentacoes','documentos','documentos_processo','audiencias','compromissos'].includes(m[1])) {
        assert.ok(tabelas.includes(m[1]), `${f}: tabela ${m[1]} fora do schema`);
      }
    }
  }
});

test('instalar_tudo.sql cria todas as tabelas do schema e o usuário de teste', () => {
  const schema = ler('database/schema.sql');
  const tudo = ler('database/instalar_tudo.sql');
  for (const m of schema.matchAll(/CREATE TABLE IF NOT EXISTS `(\w+)`/g)) {
    assert.ok(tudo.includes(`CREATE TABLE IF NOT EXISTS \`${m[1]}\``), m[1]);
  }
  assert.ok(tudo.includes('admin@advub.com.br'));
});

test('uploads protegidos e .gitignore não expõe segredos', () => {
  assert.ok(fs.existsSync(path.join(raiz, 'backend/uploads/.htaccess')));
  const gi = ler('.gitignore');
  assert.ok(gi.includes('config.local.php') && gi.includes('node_modules'));
});

test('nenhuma credencial real versionada', () => {
  assert.ok(!fs.existsSync(path.join(raiz, 'backend/config/config.local.php')));
});
