const API_AUDIENCIAS = "../../backend/api/audiencias.php";

let audiencias = [];

// ---------- MODAL (mesmas funções que já existiam) ----------

function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("active");
  }
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("active");
  }
}

window.addEventListener("click", (event) => {
  if (event.target.classList.contains("modal-overlay")) {
    event.target.classList.remove("active");
  }
});


// ---------- FORMATAÇÃO ----------

function formatarDataHora(dataHoraSQL) {
  const [data, hora] = dataHoraSQL.split(" ");
  const [y, m, d] = data.split("-");
  return { data: `${d}/${m}/${y}`, hora: hora ? hora.slice(0, 5) : "" };
}

function classeBadge(status) {
  const mapa = {
    Agendada: "badge-agendada",
    Confirmada: "badge-confirmada",
    Realizada: "badge-realizada",
    Cancelada: "badge-cancelada",
  };
  return mapa[status] || "badge-agendada";
}

function proximoStatus(status) {
  const ordem = ["Agendada", "Confirmada", "Realizada"];
  const idx = ordem.indexOf(status);
  return idx === -1 || idx === ordem.length - 1 ? ordem[0] : ordem[idx + 1];
}


// ---------- CARREGAR / RENDERIZAR ----------

async function carregarAudiencias() {
  const params = new URLSearchParams();
  const dataInicial = document.getElementById("filtroDataInicial")?.value;
  const dataFinal    = document.getElementById("filtroDataFinal")?.value;
  const status       = document.getElementById("filtroStatus")?.value;
  const vara         = document.getElementById("filtroVara")?.value;

  if (dataInicial) params.set("data_inicio", dataInicial);
  if (dataFinal)    params.set("data_fim", dataFinal);
  if (status)       params.set("status", status);
  if (vara)         params.set("vara", vara);

  try {
    const resp = await fetch(`${API_AUDIENCIAS}?${params.toString()}`, { credentials: "same-origin" });
    const dados = await resp.json();

    if (!dados.sucesso) {
      console.error(dados.mensagem);
      return;
    }

    audiencias = dados.audiencias;
    renderTabelaAudiencias();
  } catch (erro) {
    console.error("Não foi possível carregar as audiências:", erro);
  }
}

function renderTabelaAudiencias() {
  const tbody = document.getElementById("tabelaAudiencias");
  if (!tbody) return;

  if (audiencias.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;">Nenhuma audiência encontrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = audiencias.map((a) => {
    const { data, hora } = formatarDataHora(a.data_hora);
    return `
      <tr>
        <td><div class="icon-box"><i class="bx bx-calendar"></i></div></td>
        <td>
          <div class="main-text">${data}</div>
          <div class="sub-text">${hora}</div>
        </td>
        <td>
          <div class="main-text">${escapeHtml(a.processo_numero)}</div>
          <div class="sub-text">${escapeHtml(a.processo_desc)}</div>
        </td>
        <td><div class="main-text">${escapeHtml(a.parte_adversa)}</div></td>
        <td>
          <div class="main-text">${escapeHtml(a.vara)}</div>
          <div class="sub-text">${escapeHtml(a.grau)}</div>
        </td>
        <td><div class="main-text">${escapeHtml(a.tipo)}</div></td>
        <td><span class="status ${classeBadge(a.status)}">${escapeHtml(a.status)}</span></td>
        <td>
          <button class="btn-action" data-id="${a.id}" data-status="${escapeHtml(a.status)}" title="Avançar status">
            <i class="bx bx-show"></i>
          </button>
        </td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll(".btn-action").forEach((btn) => {
    btn.addEventListener("click", () => avancarStatus(Number(btn.dataset.id), btn.dataset.status));
  });
}


// ---------- AÇÕES ----------

async function avancarStatus(id, statusAtual) {
  const novoStatus = proximoStatus(statusAtual);

  try {
    const resp = await fetch(`${API_AUDIENCIAS}?id=${id}`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    const dados = await resp.json();
    if (dados.sucesso) {
      await carregarAudiencias();
    }
  } catch (erro) {
    console.error(erro);
  }
}

async function cadastrarAudiencia(event) {
  event.preventDefault();

  const numeroProcesso = document.getElementById("audNumeroProcesso").value.trim();
  const parteAdversa   = document.getElementById("audParteAdversa").value.trim();
  const vara           = document.getElementById("audVara").value.trim();
  const status         = document.getElementById("audStatus").value;
  const data           = document.getElementById("audData").value;
  const hora           = document.getElementById("audHora").value;
  const tipo           = document.getElementById("audTipo").value.trim();

  if (!numeroProcesso || !parteAdversa || !vara || !data || !hora || !tipo) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  try {
    const resp = await fetch(API_AUDIENCIAS, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeroProcesso, parteAdversa, vara, status, data, hora, tipo }),
    });
    const dados = await resp.json();

    if (!dados.sucesso) {
      alert(dados.mensagem || "Erro ao cadastrar audiência.");
      return;
    }

    document.getElementById("formNovaAudiencia").reset();
    fecharModal("modalNovoProcesso");
    await carregarAudiencias();
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível conectar ao servidor.");
  }
}

function limparFiltrosAudiencia() {
  document.getElementById("filtroDataInicial").value = "";
  document.getElementById("filtroDataFinal").value    = "";
  document.getElementById("filtroStatus").value       = "";
  document.getElementById("filtroVara").value         = "";
  carregarAudiencias();
}


// ---------- EVENTOS ----------

document.getElementById("formNovaAudiencia")?.addEventListener("submit", cadastrarAudiencia);
document.getElementById("btnLimparFiltrosAudiencia")?.addEventListener("click", limparFiltrosAudiencia);
["filtroDataInicial", "filtroDataFinal", "filtroStatus"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", carregarAudiencias);
});
document.getElementById("filtroVara")?.addEventListener("keyup", (e) => {
  if (e.key === "Enter") carregarAudiencias();
});

carregarAudiencias();
