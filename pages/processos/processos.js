// ==========================================================
// PROCESSOS — agora conectado ao backend PHP (API + banco).
// Toda a lógica de tela (filtros, paginação, modais) continua
// igual; a diferença é que os dados vêm/vão para o servidor.
// ==========================================================

const API_PROCESSOS       = "../../backend/api/processos.php";
const API_MOVIMENTACOES   = "../../backend/api/movimentacoes.php";
const API_DOCS_PROCESSO   = "../../backend/api/documentos_processo.php";

let processos = [];
let processosFiltrados = [];
let paginaAtual = 1;
const ITENS_POR_PAGINA = 5;
let processoAbertoId = null;


const tabela          = document.getElementById('tabelaProcessos');
const resultsCount    = document.getElementById('resultsCount');
const paginacao       = document.getElementById('paginacao');
const modalNovo       = document.getElementById('modalNovoProcesso');
const modalDetalhes   = document.getElementById('modalDetalhes');
const modalEditar     = document.getElementById('modalEditar');
const modalMovimentacao      = document.getElementById('modalMovimentacao');
const modalTodasMovimentacoes = document.getElementById('modalTodasMovimentacoes');


// ---------- MAPEAMENTO: dados do banco -> mesmo formato usado na tela ----------

function mapProcesso(row) {
  return {
    id: row.id,
    numero: row.numero,
    cliente: row.cliente,
    cpf: row.cpf_cnpj,
    area: row.area,
    vara: row.vara,
    advogado: row.advogado,
    dataAbertura: row.data_abertura,
    situacao: row.situacao,
    ultimaAtualizacao: row.ultima_atualizacao,
    movimentacoes: row.movimentacoes ? row.movimentacoes.map(mapMovimentacao) : [],
    documentos: row.documentos ? row.documentos.map(mapDocumentoProcesso) : [],
  };
}

function mapMovimentacao(row) {
  const [data, hora] = String(row.data_hora).split(' ');
  const [y, m, d] = data.split('-');
  return {
    id: row.id,
    data: `${d}/${m}/${y} ${hora ? hora.slice(0, 5) : ''}`.trim(),
    descricao: row.descricao,
    responsavel: row.responsavel,
    cargo: row.cargo,
  };
}

function mapDocumentoProcesso(row) {
  const [y, m, d] = String(row.data).split('-');
  return {
    id: row.id,
    nome: row.nome,
    data: `${d}/${m}/${y}`,
    arquivoPath: row.arquivo_path || null,
  };
}


// ---------- CARREGAMENTO DE DADOS ----------

async function carregarProcessos() {
  try {
    const resp = await fetch(API_PROCESSOS, { credentials: 'same-origin' });
    const dados = await resp.json();

    if (!dados.sucesso) {
      showToast(dados.mensagem || 'Erro ao carregar processos.', '');
      return;
    }

    processos = dados.processos.map(mapProcesso);
    processosFiltrados = [...processos];
    paginaAtual = 1;
    renderTabela();
  } catch (erro) {
    console.error(erro);
    showToast('Não foi possível conectar ao servidor.', '');
  }
}

async function recarregarDetalhe(id) {
  const resp = await fetch(`${API_PROCESSOS}?id=${id}`, { credentials: 'same-origin' });
  const dados = await resp.json();
  if (!dados.sucesso) {
    showToast(dados.mensagem || 'Processo não encontrado.', '');
    return null;
  }

  const p = mapProcesso(dados.processo);
  const idx = processos.findIndex(x => x.id === id);
  if (idx !== -1) processos[idx] = p; else processos.push(p);
  processosFiltrados = processosFiltrados.map(x => (x.id === id ? p : x));

  return p;
}


function statusClass(s) {
  return 'status-badge status-' + s.replace(' ', '.');
}

function badgeHTML(situacao) {
  return `<span class="${statusClass(situacao)}">${situacao}</span>`;
}

function formatarData(dataISO) {
  if (!dataISO) return '—';
  const [y, m, d] = dataISO.split('-');
  return `${d}/${m}/${y}`;
}

function showToast(msg, tipo = 'success') {
  let toast = document.getElementById('toastGlobal');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastGlobal';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${tipo}`;
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => toast.classList.remove('show'), 3000);
}


function renderTabela() {
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const fim    = inicio + ITENS_POR_PAGINA;
  const pagina = processosFiltrados.slice(inicio, fim);
  const total  = processosFiltrados.length;

  if (total === 0) {
    resultsCount.textContent = 'Nenhum resultado encontrado';
  } else {
    const exibindo = Math.min(fim, total);
    resultsCount.textContent = `Mostrando ${inicio + 1} a ${exibindo} de ${total} resultado${total !== 1 ? 's' : ''}`;
  }

  if (pagina.length === 0) {
    tabela.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state"><p>Nenhum processo encontrado para os filtros informados.</p></div>
        </td>
      </tr>`;
  } else {
    tabela.innerHTML = pagina.map(p => `
      <tr data-id="${p.id}">
        <td>
          <div class="processo-numero">${p.numero}</div>
          <div class="processo-tipo">${p.area}</div>
        </td>
        <td>${p.cliente}</td>
        <td>${p.area}</td>
        <td>${badgeHTML(p.situacao)}</td>
        <td>${p.ultimaAtualizacao}</td>
      </tr>
    `).join('');

    tabela.querySelectorAll('tr[data-id]').forEach(tr => {
      tr.addEventListener('click', () => abrirDetalhes(Number(tr.dataset.id)));
    });
  }

  renderPaginacao(total);
}


function renderPaginacao(total) {
  const totalPaginas = Math.ceil(total / ITENS_POR_PAGINA) || 1;
  paginacao.innerHTML = '';

  const prev = document.createElement('button');
  prev.className = 'page-btn';
  prev.textContent = '‹';
  prev.disabled = paginaAtual === 1;
  prev.addEventListener('click', () => { paginaAtual--; renderTabela(); });
  paginacao.appendChild(prev);

  for (let i = 1; i <= totalPaginas; i++) {
    if (totalPaginas > 7 && i > 3 && i < totalPaginas - 1 && Math.abs(i - paginaAtual) > 1) {
      if (i === 4 || i === totalPaginas - 2) {
        const dots = document.createElement('button');
        dots.className = 'page-btn';
        dots.textContent = '…';
        dots.disabled = true;
        paginacao.appendChild(dots);
      }
      continue;
    }
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i === paginaAtual ? ' active' : '');
    btn.textContent = i;
    btn.addEventListener('click', () => { paginaAtual = i; renderTabela(); });
    paginacao.appendChild(btn);
  }

  const next = document.createElement('button');
  next.className = 'page-btn';
  next.textContent = '›';
  next.disabled = paginaAtual === totalPaginas;
  next.addEventListener('click', () => { paginaAtual++; renderTabela(); });
  paginacao.appendChild(next);
}


function pesquisar() {
  const numero   = document.getElementById('filtroNumero').value.trim().toLowerCase();
  const cliente  = document.getElementById('filtroCliente').value.trim().toLowerCase();
  const cpf      = document.getElementById('filtroCpf').value.trim().toLowerCase();
  const area     = document.getElementById('filtroArea').value;
  const situacao = document.getElementById('filtroSituacao').value;

  processosFiltrados = processos.filter(p => {
    if (numero   && !p.numero.toLowerCase().includes(numero))     return false;
    if (cliente  && !p.cliente.toLowerCase().includes(cliente))   return false;
    if (cpf      && !p.cpf.toLowerCase().includes(cpf))          return false;
    if (area     && p.area !== area)                              return false;
    if (situacao && p.situacao !== situacao)                      return false;
    return true;
  });

  paginaAtual = 1;
  renderTabela();
}

function limparFiltros() {
  document.getElementById('filtroNumero').value   = '';
  document.getElementById('filtroCliente').value  = '';
  document.getElementById('filtroCpf').value      = '';
  document.getElementById('filtroArea').value     = '';
  document.getElementById('filtroSituacao').value = '';
  processosFiltrados = [...processos];
  paginaAtual = 1;
  renderTabela();
}


function abrirModalNovo() {
  ['novoNumero','novoCliente','novoCpf','novaVara','novoAdvogado','novaData']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('novaArea').value     = '';
  document.getElementById('novaSituacao').value = '';
  modalNovo.classList.add('open');
}

function fecharModalNovo() {
  modalNovo.classList.remove('open');
}

async function salvarProcesso() {
  const numero   = document.getElementById('novoNumero').value.trim();
  const cliente  = document.getElementById('novoCliente').value.trim();
  const cpf      = document.getElementById('novoCpf').value.trim();
  const area     = document.getElementById('novaArea').value;
  const vara     = document.getElementById('novaVara').value.trim();
  const advogado = document.getElementById('novoAdvogado').value.trim();
  const data     = document.getElementById('novaData').value;
  const situacao = document.getElementById('novaSituacao').value;

  if (!numero || !cliente || !cpf || !area || !vara || !advogado || !data || !situacao) {
    showToast('Preencha todos os campos obrigatórios.', '');
    return;
  }

  try {
    const resp = await fetch(API_PROCESSOS, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, cliente, cpf, area, vara, advogado, dataAbertura: data, situacao }),
    });
    const resultado = await resp.json();

    if (!resultado.sucesso) {
      showToast(resultado.mensagem || 'Erro ao cadastrar processo.', '');
      return;
    }

    await carregarProcessos();
    fecharModalNovo();
    showToast('Processo cadastrado com sucesso!', 'success');
  } catch (erro) {
    console.error(erro);
    showToast('Não foi possível conectar ao servidor.', '');
  }
}


async function abrirDetalhes(id) {
  const p = await recarregarDetalhe(id);
  if (!p) return;

  processoAbertoId = id;
  document.getElementById('detalhesTitulo').textContent = `Processo ${p.numero}`;


  const hoje = new Date();
  const abertura = new Date(p.dataAbertura);
  const diasAberto = Math.floor((hoje - abertura) / (1000 * 60 * 60 * 24));

  const campos = [
    { label: 'Número do Processo', valor: `<span class="numero-copiavel" data-numero="${p.numero}" title="Clique para copiar">${p.numero} <span class="copy-hint">📋</span></span>` },
    { label: 'Cliente',            valor: p.cliente },
    { label: 'CPF/CNPJ',                valor: p.cpf },
    { label: 'Área',               valor: p.area },
    { label: 'Vara / Órgão',       valor: p.vara },
    { label: 'Advogado Responsável', valor: p.advogado },
    { label: 'Data de Abertura',   valor: formatarData(p.dataAbertura) },
    { label: 'Situação',           valor: `<span class="${statusClass(p.situacao)}">${p.situacao}</span>` },
    { label: 'Dias em Aberto',     valor: `<span class="dias-aberto">${diasAberto} dia${diasAberto !== 1 ? 's' : ''}</span>` },
    { label: 'Última Atualização', valor: p.ultimaAtualizacao },
  ];

  document.getElementById('detalhesGrid').innerHTML = campos.map(c => `
    <div class="detalhe-item">
      <label>${c.label}</label>
      <span>${c.valor}</span>
    </div>
  `).join('');


  document.querySelectorAll('.numero-copiavel').forEach(el => {
    el.addEventListener('click', () => {
      navigator.clipboard.writeText(el.dataset.numero).then(() => {
        showToast('Número copiado para a área de transferência!', 'success');
      });
    });
  });

  renderMovimentacoes(p);
  renderDocumentos(p);

  modalDetalhes.classList.add('open');
}

function renderMovimentacoes(p, limite = 3) {
  const movBody = document.getElementById('movimentacoesBody');
  const lista = p.movimentacoes.slice(0, limite);
  if (p.movimentacoes.length === 0) {
    movBody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><p>Nenhuma movimentação registrada.</p></div></td></tr>`;
  } else {
    movBody.innerHTML = lista.map((m) => `
      <tr>
        <td style="white-space:nowrap">${m.data}</td>
        <td>${m.descricao}</td>
        <td>${m.responsavel}</td>
        <td><span class="cargo-badge">${m.cargo || '—'}</span></td>
        <td>
          <button class="btn-excluir-mov" data-id="${m.id}" title="Excluir movimentação">🗑</button>
        </td>
      </tr>
    `).join('');

    movBody.querySelectorAll('.btn-excluir-mov').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmarExclusaoMovimentacao(p.id, Number(btn.dataset.id));
      });
    });
  }
}

function renderDocumentos(p) {
  const docLista = document.getElementById('documentosLista');
  if (p.documentos.length === 0) {
    docLista.innerHTML = `<div class="empty-state"><p>Nenhum documento anexado.</p></div>`;
  } else {
    docLista.innerHTML = p.documentos.map((d, idx) => `
      <div class="doc-item">
        <span class="doc-icon">📄</span>
        <span class="doc-nome">${d.nome}</span>
        <span class="doc-data">${d.data}</span>
        <button class="btn-download" data-idx="${idx}" title="Baixar ${d.nome}">
          Download
        </button>
      </div>
    `).join('');


    docLista.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const doc = p.documentos[Number(btn.dataset.idx)];
        if (!doc) return;

        if (doc.arquivoPath) {
          // documento real, anexado via upload -> baixa do servidor
          window.open(`${API_DOCS_PROCESSO}?download=${doc.id}`, '_blank');
        } else {
          // documento de exemplo (seed) sem arquivo real -> simulação
          simularDownload(doc.nome);
        }
      });
    });
  }
}

function fecharDetalhes() {
  modalDetalhes.classList.remove('open');
  processoAbertoId = null;
}


function simularDownload(nomeArquivo) {

  const conteudo = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF`;

  const blob = new Blob([conteudo], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Download iniciado: ${nomeArquivo}`, 'success');
}


// ---------- ANEXAR NOVO DOCUMENTO AO PROCESSO ABERTO ----------

async function anexarDocumentoProcesso(arquivo) {
  if (!arquivo || !processoAbertoId) return;

  const formData = new FormData();
  formData.append('arquivo', arquivo);
  formData.append('processoId', processoAbertoId);

  try {
    const resp = await fetch(API_DOCS_PROCESSO, {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    });
    const resultado = await resp.json();

    if (!resultado.sucesso) {
      showToast(resultado.mensagem || 'Erro ao anexar documento.', '');
      return;
    }

    const p = await recarregarDetalhe(processoAbertoId);
    if (p) renderDocumentos(p);
    showToast('Documento anexado com sucesso!', 'success');
  } catch (erro) {
    console.error(erro);
    showToast('Não foi possível conectar ao servidor.', '');
  }
}


function abrirModalEdicao() {
  const p = processos.find(x => x.id === processoAbertoId);
  if (!p) return;

  document.getElementById('editarId').value       = p.id;
  document.getElementById('editarNumero').value   = p.numero;
  document.getElementById('editarCliente').value  = p.cliente;
  document.getElementById('editarCpf').value      = p.cpf;
  document.getElementById('editarArea').value     = p.area;
  document.getElementById('editarVara').value     = p.vara;
  document.getElementById('editarAdvogado').value = p.advogado;
  document.getElementById('editarData').value     = p.dataAbertura;
  document.getElementById('editarSituacao').value = p.situacao;

  modalEditar.classList.add('open');
}

function fecharModalEdicao() {
  modalEditar.classList.remove('open');
}

async function salvarEdicao() {
  const id       = Number(document.getElementById('editarId').value);
  const numero   = document.getElementById('editarNumero').value.trim();
  const cliente  = document.getElementById('editarCliente').value.trim();
  const cpf      = document.getElementById('editarCpf').value.trim();
  const area     = document.getElementById('editarArea').value;
  const vara     = document.getElementById('editarVara').value.trim();
  const advogado = document.getElementById('editarAdvogado').value.trim();
  const data     = document.getElementById('editarData').value;
  const situacao = document.getElementById('editarSituacao').value;

  if (!numero || !cliente || !cpf || !area || !vara || !advogado || !data || !situacao) {
    showToast('Preencha todos os campos obrigatórios.', '');
    return;
  }

  try {
    const resp = await fetch(`${API_PROCESSOS}?id=${id}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, cliente, cpf, area, vara, advogado, dataAbertura: data, situacao }),
    });
    const resultado = await resp.json();

    if (!resultado.sucesso) {
      showToast(resultado.mensagem || 'Erro ao atualizar processo.', '');
      return;
    }

    await carregarProcessos();
    fecharModalEdicao();

    await abrirDetalhes(id);
    showToast('Processo atualizado com sucesso!', 'success');
  } catch (erro) {
    console.error(erro);
    showToast('Não foi possível conectar ao servidor.', '');
  }
}

function abrirModalMovimentacao() {
  document.getElementById('movDescricao').value  = '';
  document.getElementById('movResponsavel').value = '';
  document.getElementById('movCargo').value       = '';

  const agora = new Date();
  const dataHoje = agora.toISOString().split('T')[0];
  const horaAgora = agora.toTimeString().slice(0, 5);
  document.getElementById('movData').value  = dataHoje;
  document.getElementById('movHora').value  = horaAgora;

  modalMovimentacao.classList.add('open');
}

function fecharModalMovimentacao() {
  modalMovimentacao.classList.remove('open');
}

async function salvarMovimentacao() {
  const descricao   = document.getElementById('movDescricao').value.trim();
  const responsavel = document.getElementById('movResponsavel').value.trim();
  const cargo       = document.getElementById('movCargo').value.trim();
  const data        = document.getElementById('movData').value;
  const hora        = document.getElementById('movHora').value;

  if (!descricao || !responsavel || !cargo || !data || !hora) {
    showToast('Preencha todos os campos da movimentação.', '');
    return;
  }

  try {
    const resp = await fetch(API_MOVIMENTACOES, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processoId: processoAbertoId, descricao, responsavel, cargo, data, hora }),
    });
    const resultado = await resp.json();

    if (!resultado.sucesso) {
      showToast(resultado.mensagem || 'Erro ao registrar movimentação.', '');
      return;
    }

    const p = await recarregarDetalhe(processoAbertoId);

    fecharModalMovimentacao();
    if (p) renderMovimentacoes(p);
    renderTabela();
    showToast('Movimentação registrada com sucesso!', 'success');
  } catch (erro) {
    console.error(erro);
    showToast('Não foi possível conectar ao servidor.', '');
  }
}


function confirmarExclusaoMovimentacao(processoId, movimentacaoId) {

  let confirmBox = document.getElementById('toastConfirm');
  if (!confirmBox) {
    confirmBox = document.createElement('div');
    confirmBox.id = 'toastConfirm';
    confirmBox.className = 'toast-confirm';
    document.body.appendChild(confirmBox);
  }
  confirmBox.innerHTML = `
    <span>Excluir esta movimentação?</span>
    <div class="toast-confirm-btns">
      <button id="tcSim">Sim, excluir</button>
      <button id="tcNao">Cancelar</button>
    </div>`;
  confirmBox.classList.add('show');

  document.getElementById('tcSim').onclick = async () => {
    try {
      await fetch(`${API_MOVIMENTACOES}?id=${movimentacaoId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      const p = await recarregarDetalhe(processoId);
      if (p) renderMovimentacoes(p);
      renderTabela();
      showToast('Movimentação excluída.', 'success');
    } catch (erro) {
      console.error(erro);
      showToast('Não foi possível conectar ao servidor.', '');
    }
    confirmBox.classList.remove('show');
  };
  document.getElementById('tcNao').onclick = () => confirmBox.classList.remove('show');
}

function abrirTodasMovimentacoes() {
  const p = processos.find(x => x.id === processoAbertoId);
  if (!p) return;

  document.getElementById('todasMovTitulo').textContent = `Todas as Movimentações`;
  document.getElementById('todasMovSubtitulo').textContent = `Processo ${p.numero} · ${p.movimentacoes.length} registro${p.movimentacoes.length !== 1 ? 's' : ''}`;
  document.getElementById('buscaMovimentacoes').value = '';

  renderTimeline(p.movimentacoes);
  modalTodasMovimentacoes.classList.add('open');
}

function fecharTodasMovimentacoes() {
  modalTodasMovimentacoes.classList.remove('open');
}

function renderTimeline(movs) {
  const timeline = document.getElementById('timelineMovimentacoes');
  const vazio    = document.getElementById('todasMovVazio');

  if (movs.length === 0) {
    timeline.innerHTML = '';
    vazio.style.display = 'block';
    return;
  }
  vazio.style.display = 'none';

  timeline.innerHTML = movs.map((m) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-header">
          <span class="timeline-data">${m.data}</span>
          <span class="cargo-badge">${m.cargo || '—'}</span>
        </div>
        <p class="timeline-descricao">${m.descricao}</p>
        <span class="timeline-responsavel">🧑‍⚖️ ${m.responsavel}</span>
      </div>
    </div>
  `).join('');
}

function filtrarTimeline() {
  const p = processos.find(x => x.id === processoAbertoId);
  if (!p) return;
  const q = document.getElementById('buscaMovimentacoes').value.trim().toLowerCase();
  const filtradas = p.movimentacoes.filter(m =>
    m.descricao.toLowerCase().includes(q) ||
    m.responsavel.toLowerCase().includes(q) ||
    (m.cargo || '').toLowerCase().includes(q) ||
    m.data.toLowerCase().includes(q)
  );
  renderTimeline(filtradas);
}


function exportarMovimentacoes() {
  const p = processos.find(x => x.id === processoAbertoId);
  if (!p) return;

  const linhas = [
    `MOVIMENTAÇÕES DO PROCESSO`,
    `Processo: ${p.numero}`,
    `Cliente: ${p.cliente}`,
    `Área: ${p.area} | Vara: ${p.vara}`,
    `Advogado: ${p.advogado}`,
    `─────────────────────────────────────────`,
    '',
    ...p.movimentacoes.map((m, i) => [
      `[${i + 1}] ${m.data}`,
      `Descrição : ${m.descricao}`,
      `Responsável: ${m.responsavel} (${m.cargo || '—'})`,
      ''
    ].join('\n'))
  ];

  const blob = new Blob([linhas.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `movimentacoes_${p.numero.replace(/[^0-9]/g, '')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Movimentações exportadas!', 'success');
}


document.getElementById('btnVerTodasMovimentacoes').addEventListener('click', abrirTodasMovimentacoes);
document.getElementById('btnFecharTodasMov').addEventListener('click', fecharTodasMovimentacoes);
document.getElementById('btnFecharTodasMov2').addEventListener('click', fecharTodasMovimentacoes);
document.getElementById('btnExportarMovimentacoes').addEventListener('click', exportarMovimentacoes);
document.getElementById('buscaMovimentacoes').addEventListener('input', filtrarTimeline);

document.getElementById('btnNovoProcesso').addEventListener('click', abrirModalNovo);
document.getElementById('btnFecharModal').addEventListener('click', fecharModalNovo);
document.getElementById('btnCancelarModal').addEventListener('click', fecharModalNovo);
document.getElementById('btnSalvarProcesso').addEventListener('click', salvarProcesso);

document.getElementById('btnPesquisar').addEventListener('click', pesquisar);
document.getElementById('btnLimpar').addEventListener('click', limparFiltros);

document.getElementById('btnFecharDetalhes').addEventListener('click', fecharDetalhes);
document.getElementById('btnFecharDetalhes2').addEventListener('click', fecharDetalhes);

document.getElementById('btnAbrirEdicao').addEventListener('click', abrirModalEdicao);
document.getElementById('btnFecharEdicao').addEventListener('click', fecharModalEdicao);
document.getElementById('btnCancelarEdicao').addEventListener('click', fecharModalEdicao);
document.getElementById('btnSalvarEdicao').addEventListener('click', salvarEdicao);

document.getElementById('btnNovaMovimentacao').addEventListener('click', abrirModalMovimentacao);
document.getElementById('btnFecharMovimentacao').addEventListener('click', fecharModalMovimentacao);
document.getElementById('btnCancelarMovimentacao').addEventListener('click', fecharModalMovimentacao);
document.getElementById('btnSalvarMovimentacao').addEventListener('click', salvarMovimentacao);

const btnAnexarDocumento   = document.getElementById('btnAnexarDocumento');
const inputAnexarDocumento = document.getElementById('inputAnexarDocumento');
if (btnAnexarDocumento && inputAnexarDocumento) {
  btnAnexarDocumento.addEventListener('click', () => inputAnexarDocumento.click());
  inputAnexarDocumento.addEventListener('change', (e) => {
    const arquivo = e.target.files[0];
    anexarDocumentoProcesso(arquivo);
    e.target.value = '';
  });
}


[modalNovo, modalDetalhes, modalEditar, modalMovimentacao, modalTodasMovimentacoes].forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open');
  });
});


document.querySelectorAll('.search-field input, .search-field select').forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') pesquisar(); });
});


carregarProcessos();
