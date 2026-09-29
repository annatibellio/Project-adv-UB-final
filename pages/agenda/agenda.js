const API_AGENDA = "../../backend/api/agenda.php";

function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("active");
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}

window.addEventListener("click", (event) => {
  if (event.target.classList.contains("modal-overlay")) {
    event.target.classList.remove("active");
  }
});


let calendar = null;

async function carregarEventos() {
  try {
    const resp = await fetch(API_AGENDA, { credentials: "same-origin" });
    const dados = await resp.json();
    if (!dados.sucesso) return [];
    return dados.eventos;
  } catch (erro) {
    console.error("Não foi possível carregar a agenda:", erro);
    return [];
  }
}

function renderProximosPrazos(eventos) {
  const container = document.getElementById("listaPrazos");
  if (!container) return;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const cores = ["border-red", "border-blue", "border-green"];
  const textCores = ["text-red", "text-orange", "text-green"];

  const prazos = eventos
    .filter((e) => e.tipo === "Prazo Processual")
    .map((e) => {
      const dataEvento = new Date(e.start);
      const dias = Math.ceil((dataEvento - hoje) / (1000 * 60 * 60 * 24));
      return { ...e, dias, dataEvento };
    })
    .filter((e) => e.dias >= 0)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 3);

  if (prazos.length === 0) {
    container.innerHTML = `<p style="color:#94a3b8; font-size:0.85rem;">Nenhum prazo próximo.</p>`;
    return;
  }

  container.innerHTML = prazos.map((p, i) => `
    <div class="prazo-card ${cores[i % cores.length]}">
      <h4>${p.title.replace(/^Prazo:\s*/i, "")}</h4>
      <p>${p.dataEvento.toLocaleDateString("pt-BR")}</p>
      <div class="prazo-footer">
        <span>Vence: ${p.dataEvento.toLocaleDateString("pt-BR")}</span>
        <span class="${textCores[i % textCores.length]}">${p.dias} dia${p.dias !== 1 ? "s" : ""}</span>
      </div>
    </div>
  `).join("");
}

async function inicializarCalendario() {
  const eventos = await carregarEventos();
  renderProximosPrazos(eventos);

  const calendarEl = document.getElementById("calendar");
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "pt-br",
    height: "auto",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,listWeek",
    },
    buttonText: { today: "Hoje", month: "Mês", week: "Semana", list: "Lista" },
    events: eventos,
  });
  calendar.render();
}

async function recarregarCalendario() {
  const eventos = await carregarEventos();
  renderProximosPrazos(eventos);
  if (calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(eventos);
  }
}


async function salvarCompromisso(event) {
  event.preventDefault();

  const titulo = document.getElementById("compTitulo").value.trim();
  const data   = document.getElementById("compData").value;
  const hora   = document.getElementById("compHora").value;
  const tipo   = document.getElementById("compTipo").value;

  if (!titulo || !data) {
    alert("Preencha ao menos o título e a data do compromisso.");
    return;
  }

  try {
    const resp = await fetch(API_AGENDA, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, data, hora, tipo }),
    });
    const dados = await resp.json();

    if (!dados.sucesso) {
      alert(dados.mensagem || "Erro ao salvar o compromisso.");
      return;
    }

    document.getElementById("formNovoCompromisso").reset();
    fecharModal("modalNovoCompromisso");
    await recarregarCalendario();
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível conectar ao servidor.");
  }
}

document.getElementById("formNovoCompromisso")?.addEventListener("submit", salvarCompromisso);

inicializarCalendario();
