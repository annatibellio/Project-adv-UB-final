(function () {
  setupKpiCarousel();
  carregarDadosReais();
})();

// Busca os números reais do banco de dados (KPIs, gráfico e feed).
// Se o back-end não responder, mantém os valores estáticos que já
// estavam escritos no HTML (fallback, útil sem o servidor rodando).
async function carregarDadosReais() {
  try {
    const resposta = await fetch("../../backend/api/dashboard.php", {
      credentials: "same-origin",
    });
    const dados = await resposta.json();
    if (!dados.sucesso) throw new Error(dados.mensagem);

    const kpis = dados.kpis;
    const cards = document.querySelectorAll(".kpi-card__value");
    if (cards[0]) cards[0].textContent = kpis.processosAtivos;
    if (cards[1]) cards[1].textContent = kpis.prazosProximos;
    if (cards[2]) cards[2].textContent = kpis.audienciasHoje;
    if (cards[3]) cards[3].textContent = kpis.tarefasPendentes;

    const mapaCores = {
      "Em andamento": "#16a34a",
      "Aguardando": "#ca8a04",
      "Concluso": "#1d4ed8",
      "Suspenso": "#f59e0b",
      "Arquivado": "#94a3b8",
    };

    const chartData = (dados.distribuicaoProcessos || []).map((item) => ({
      label: item.situacao,
      value: Number(item.total),
      color: mapaCores[item.situacao] || "#64748b",
    }));

    const feedList = document.querySelector(".feed-list");
    if (feedList && dados.feed && dados.feed.length) {
      feedList.innerHTML = dados.feed
        .map(
          (item) => `
        <li class="feed-item">
          <div class="feed-item__meta">
            <span class="feed-item__tag feed-item__tag--processo">Processo</span>
            <time class="feed-item__time">${escapeHtml(item.numero)}</time>
          </div>
          <p class="feed-item__text">${escapeHtml(item.descricao)}</p>
        </li>`
        )
        .join("");
    }

    setupChart(chartData.length ? chartData : undefined);
  } catch (erro) {
    console.warn("Não foi possível carregar os dados do dashboard:", erro);
    setupChart();
  }
}

function setupKpiCarousel() {
  const track = document.getElementById("kpiCarouselTrack");
  const bulletsContainer = document.getElementById("kpiCarouselBullets");
  const prevBtn = document.querySelector(".kpi-carousel__arrow--prev");
  const nextBtn = document.querySelector(".kpi-carousel__arrow--next");

  if (!track || !bulletsContainer) return;

  const cards = track.querySelectorAll(".kpi-card");
  if (!cards.length) return;

  let current = 0;
  const mobileQuery = window.matchMedia("(max-width: 767px)");

  function updateArrows() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === cards.length - 1;
  }

  function updateBullets() {
    bulletsContainer.querySelectorAll(".kpi-carousel__bullet").forEach((bullet, index) => {
      bullet.classList.toggle("is-active", index === current);
      bullet.setAttribute("aria-current", index === current ? "true" : "false");
    });
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, cards.length - 1));

    if (mobileQuery.matches) {
      track.style.transform = `translateX(-${current * 100}%)`;
    } else {
      track.style.transform = "";
    }

    updateBullets();
    updateArrows();
  }

  bulletsContainer.innerHTML = "";
  cards.forEach((_, index) => {
    const bullet = document.createElement("button");
    bullet.type = "button";
    bullet.className = "kpi-carousel__bullet";
    bullet.setAttribute("aria-label", `Indicador ${index + 1} de ${cards.length}`);
    bullet.setAttribute("aria-current", index === 0 ? "true" : "false");
    bullet.addEventListener("click", () => goTo(index));
    bulletsContainer.appendChild(bullet);
  });

  prevBtn?.addEventListener("click", () => goTo(current - 1));
  nextBtn?.addEventListener("click", () => goTo(current + 1));

  mobileQuery.addEventListener("change", () => goTo(current));
  goTo(0);
}

function setupChart() {
  const chartData = [
    { label: "Em andamento", value: 14, color: "#16a34a" },
    { label: "Aguardando", value: 6, color: "#ca8a04" },
    { label: "Concluídos", value: 4, color: "#1d4ed8" },
  ];

  const canvas = document.getElementById("processChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const legendEl = document.getElementById("chartLegend");
  const totalEl = document.getElementById("chartTotal");
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (totalEl) {
    totalEl.textContent = String(total);
  }

  function drawChart() {
    const wrap = canvas.parentElement;
    const size = Math.min(wrap.offsetWidth, wrap.offsetHeight);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const center = size / 2;
    const outerRadius = size / 2 - 10;
    const innerRadius = outerRadius * 0.64;
    let startAngle = -Math.PI / 2;

    chartData.forEach((segment) => {
      const slice = (segment.value / total) * Math.PI * 2;
      const endAngle = startAngle + slice;

      ctx.beginPath();
      ctx.arc(center, center, outerRadius, startAngle, endAngle);
      ctx.arc(center, center, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(
        center,
        center,
        innerRadius,
        center,
        center,
        outerRadius,
      );
      gradient.addColorStop(0, segment.color);
      gradient.addColorStop(1, shadeColor(segment.color, -25));
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle = endAngle;
    });

    ctx.beginPath();
    ctx.arc(center, center, innerRadius - 1, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  function shadeColor(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  if (legendEl) {
    legendEl.innerHTML = chartData
      .map(
        (item) =>
          `<li>
            <span class="chart-legend__label">
              <span class="chart-legend__dot" style="background:${item.color}"></span>
              ${escapeHtml(item.label)}
            </span>
            <span class="chart-legend__value">${item.value}</span>
          </li>`,
      )
      .join("");
  }

  drawChart();
  window.addEventListener("resize", drawChart);
}
