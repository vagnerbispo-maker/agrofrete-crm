const STORAGE_KEY = "agrofrete-crm-v1";
const SUPABASE_URL = "https://xognohpweahpremggfhy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvZ25vaHB3ZWFocHJlbWdnZmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Nzc0MzksImV4cCI6MjA5NTU1MzQzOX0.7AmUQf5i_DKWWeyStkhIohTKutddjBLxrTi7YkgU_e8";
const USE_SUPABASE = true;
const statuses = ["Cotacao", "Aprovado", "Em transito", "Entregue", "Faturado"];
let priorityFilter = "todas";

const seedData = {
  clients: [
    {
      name: "Fazenda Boa Safra",
      contact: "Marina Alves · (66) 98110-0042",
      origin: "Sorriso, MT",
      product: "Soja",
      risk: "Baixo"
    },
    {
      name: "Agro Cerrado Trading",
      contact: "Rafael Nunes · comercial@cerradoagro.com",
      origin: "Rio Verde, GO",
      product: "Milho",
      risk: "Medio"
    },
    {
      name: "Cooperativa Vale Verde",
      contact: "Joao Martins · (45) 99322-1800",
      origin: "Cascavel, PR",
      product: "Farelo",
      risk: "Baixo"
    },
    {
      name: "Armazens Nova Rota",
      contact: "Patricia Lima · (64) 98814-6672",
      origin: "Jatai, GO",
      product: "Algodao",
      risk: "Alto"
    }
  ],
  orders: [
    {
      id: "FR-1024",
      client: "Fazenda Boa Safra",
      product: "Soja",
      origin: "Sorriso, MT",
      destination: "Santos, SP",
      tons: 32,
      pickup: "2026-06-02",
      status: "Cotacao",
      priority: "Alta",
      revenue: 14600,
      cost: 11850,
      driver: "Carlos Mendes",
      vehicle: "Bitrem ABC-4H22",
      progress: 18
    },
    {
      id: "FR-1025",
      client: "Agro Cerrado Trading",
      product: "Milho",
      origin: "Rio Verde, GO",
      destination: "Paranagua, PR",
      tons: 30,
      pickup: "2026-06-04",
      status: "Aprovado",
      priority: "Normal",
      revenue: 12750,
      cost: 10100,
      driver: "Eliane Costa",
      vehicle: "Rodotrem FRT-9C11",
      progress: 30
    },
    {
      id: "FR-1026",
      client: "Cooperativa Vale Verde",
      product: "Farelo",
      origin: "Cascavel, PR",
      destination: "Campinas, SP",
      tons: 26,
      pickup: "2026-05-31",
      status: "Em transito",
      priority: "Alta",
      revenue: 8800,
      cost: 6900,
      driver: "Andre Rocha",
      vehicle: "Carreta DKL-7J90",
      progress: 68
    },
    {
      id: "FR-1027",
      client: "Armazens Nova Rota",
      product: "Algodao",
      origin: "Jatai, GO",
      destination: "Itajai, SC",
      tons: 24,
      pickup: "2026-05-28",
      status: "Entregue",
      priority: "Normal",
      revenue: 11900,
      cost: 9450,
      driver: "Bruno Reis",
      vehicle: "Bitrem QWE-2A18",
      progress: 100
    },
    {
      id: "FR-1028",
      client: "Fazenda Boa Safra",
      product: "Soja",
      origin: "Lucas do Rio Verde, MT",
      destination: "Rondonopolis, MT",
      tons: 36,
      pickup: "2026-05-25",
      status: "Faturado",
      priority: "Normal",
      revenue: 6400,
      cost: 5150,
      driver: "Sonia Duarte",
      vehicle: "Truck HJX-8B33",
      progress: 100
    }
  ]
};

const elements = {
  viewTitle: document.querySelector("#viewTitle"),
  metrics: document.querySelector("#metrics"),
  chartsGrid: document.querySelector("#chartsGrid"),
  kanban: document.querySelector("#kanban"),
  timeline: document.querySelector("#timeline"),
  clientsTable: document.querySelector("#clientsTable"),
  ordersGrid: document.querySelector("#ordersGrid"),
  quotesTable: document.querySelector("#quotesTable"),
  driverBoard: document.querySelector("#driverBoard"),
  financeGrid: document.querySelector("#financeGrid"),
  globalSearch: document.querySelector("#globalSearch"),
  statusFilter: document.querySelector("#statusFilter"),
  orderDialog: document.querySelector("#orderDialog"),
  clientDialog: document.querySelector("#clientDialog"),
  orderForm: document.querySelector("#orderForm"),
  clientForm: document.querySelector("#clientForm"),
  quoteForm: document.querySelector("#quoteForm"),
  quoteOutput: document.querySelector("#quoteOutput")
};

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(seedData);

  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(seedData);
  }
}

let data = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function supabaseRequest(table, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${options.query || ""}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase ${table}: ${message}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function clientFromDb(row) {
  return {
    dbId: row.id,
    name: row.nome,
    contact: row.contato || "",
    origin: row.origem || "",
    product: row.produto || "",
    risk: row.risco || "Baixo"
  };
}

function orderFromDb(row) {
  return {
    dbId: row.id,
    id: row.codigo || `FR-${row.id}`,
    client: row.cliente,
    product: row.produto,
    origin: row.origem,
    destination: row.destino,
    tons: Number(row.toneladas || 0),
    pickup: row.coleta,
    status: row.status || "Cotacao",
    priority: row.prioridade || "Normal",
    revenue: Number(row.receita || 0),
    cost: Number(row.custo || 0),
    driver: row.motorista || "A definir",
    vehicle: row.veiculo || "A definir",
    progress: Number(row.progresso || progressForStatus(row.status || "Cotacao"))
  };
}

function clientToDb(client) {
  return {
    nome: client.name,
    contato: client.contact,
    origem: client.origin,
    produto: client.product,
    risco: client.risk
  };
}

function orderToDb(order) {
  return {
    codigo: order.id,
    cliente: order.client,
    produto: order.product,
    origem: order.origin,
    destino: order.destination,
    toneladas: order.tons,
    coleta: order.pickup,
    status: order.status,
    prioridade: order.priority,
    receita: order.revenue,
    custo: order.cost,
    motorista: order.driver,
    veiculo: order.vehicle,
    progresso: order.progress
  };
}

async function loadFromSupabase() {
  const [clients, orders] = await Promise.all([
    supabaseRequest("clientes", { query: "?select=*&order=id.desc" }),
    supabaseRequest("cargas", { query: "?select=*&order=id.desc" })
  ]);

  data = {
    clients: clients.map(clientFromDb),
    orders: orders.map(orderFromDb)
  };

  if (!data.clients.length && !data.orders.length) {
    await seedSupabase();
    return loadFromSupabase();
  }

  saveData();
}

async function seedSupabase() {
  await Promise.all([
    supabaseRequest("clientes", { method: "POST", body: seedData.clients.map(clientToDb) }),
    supabaseRequest("cargas", { method: "POST", body: seedData.orders.map(orderToDb) })
  ]);
}

async function saveOrderToSupabase(order) {
  const [created] = await supabaseRequest("cargas", { method: "POST", body: orderToDb(order) });
  return orderFromDb(created);
}

async function saveClientToSupabase(client) {
  const [created] = await supabaseRequest("clientes", { method: "POST", body: clientToDb(client) });
  return clientFromDb(created);
}

async function updateOrderStatusInSupabase(order) {
  if (!order.dbId) return;
  await supabaseRequest("cargas", {
    method: "PATCH",
    query: `?id=eq.${order.dbId}`,
    body: {
      status: order.status,
      progresso: order.progress
    }
  });
}

function currency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateLabel(date) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function normalize(value) {
  return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function filteredOrders() {
  const term = normalize(elements.globalSearch.value);
  return data.orders.filter((order) => {
    const haystack = normalize(Object.values(order).join(" "));
    const bySearch = !term || haystack.includes(term);
    const byPriority = priorityFilter === "todas" || order.priority === priorityFilter;
    const byStatus = elements.statusFilter.value === "todos" || order.status === elements.statusFilter.value;
    return bySearch && byPriority && byStatus;
  });
}

function renderMetrics() {
  const openOrders = data.orders.filter((order) => order.status !== "Faturado");
  const revenue = data.orders.reduce((sum, order) => sum + order.revenue, 0);
  const cost = data.orders.reduce((sum, order) => sum + order.cost, 0);
  const margin = revenue ? ((revenue - cost) / revenue) * 100 : 0;
  const inTransit = data.orders.filter((order) => order.status === "Em transito").length;

  const metrics = [
    ["Fretes ativos", openOrders.length],
    ["Receita prevista", currency(revenue)],
    ["Margem media", `${margin.toFixed(1)}%`],
    ["Em transito", inTransit]
  ];

  elements.metrics.innerHTML = metrics
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderCharts() {
  const statusColors = {
    Cotacao: "#31658f",
    Aprovado: "#2f6f4e",
    "Em transito": "#b66f12",
    Entregue: "#6f5f9c",
    Faturado: "#56615a"
  };
  const statusCounts = statuses.map((status) => ({
    label: status,
    value: data.orders.filter((order) => order.status === status).length,
    color: statusColors[status]
  }));
  const totalOrders = Math.max(data.orders.length, 1);
  const circumference = 2 * Math.PI * 54;
  let offset = 0;
  const segments = statusCounts
    .filter((item) => item.value > 0)
    .map((item) => {
      const length = (item.value / totalOrders) * circumference;
      const segment = `
        <circle class="donut-segment" cx="75" cy="75" r="54"
          stroke="${item.color}"
          stroke-dasharray="${length} ${circumference - length}"
          stroke-dashoffset="${-offset}">
        </circle>
      `;
      offset += length;
      return segment;
    })
    .join("");

  const revenue = data.orders.reduce((sum, order) => sum + order.revenue, 0);
  const cost = data.orders.reduce((sum, order) => sum + order.cost, 0);
  const gross = revenue - cost;
  const maxMoney = Math.max(revenue, cost, gross, 1);
  const moneyBars = [
    ["Receita", revenue, "#2f6f4e"],
    ["Custo", cost, "#b66f12"],
    ["Margem", gross, "#31658f"]
  ];

  const marginItems = [...data.orders]
    .sort((a, b) => b.revenue - b.cost - (a.revenue - a.cost))
    .slice(0, 5);
  const maxMargin = Math.max(...marginItems.map((order) => order.revenue - order.cost), 1);

  elements.chartsGrid.innerHTML = `
    <article class="chart-card">
      <div class="chart-head">
        <div>
          <span>Status</span>
          <strong>Distribuicao das cargas</strong>
        </div>
      </div>
      <div class="donut-wrap">
        <svg class="donut" viewBox="0 0 150 150" role="img" aria-label="Distribuicao das cargas por status">
          <circle class="donut-bg" cx="75" cy="75" r="54"></circle>
          ${segments}
          <text x="75" y="70" text-anchor="middle" font-size="24" font-weight="800" fill="#18201c">${data.orders.length}</text>
          <text x="75" y="91" text-anchor="middle" font-size="12" fill="#647067">cargas</text>
        </svg>
        <div class="legend">
          ${statusCounts.map((item) => `
            <div class="legend-item">
              <span class="legend-label"><span class="swatch" style="background:${item.color}"></span>${item.label}</span>
              <strong>${item.value}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    </article>

    <article class="chart-card">
      <div class="chart-head">
        <div>
          <span>Resultado</span>
          <strong>Receita, custo e margem</strong>
        </div>
      </div>
      <div class="bar-chart">
        ${moneyBars.map(([label, value, color]) => `
          <div class="bar-row">
            <span>${label}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(value / maxMoney) * 100}%; background:${color}"></div></div>
            <span class="bar-value">${currency(value)}</span>
          </div>
        `).join("")}
      </div>
    </article>

    <article class="chart-card">
      <div class="chart-head">
        <div>
          <span>Margem</span>
          <strong>Melhores fretes</strong>
        </div>
      </div>
      <div class="margin-list">
        ${marginItems.map((order) => {
          const margin = order.revenue - order.cost;
          return `
            <div class="margin-item">
              <div class="margin-line">
                <span>${order.id} · ${order.product}</span>
                <strong>${currency(margin)}</strong>
              </div>
              <div class="margin-track"><span style="width:${(margin / maxMargin) * 100}%"></span></div>
            </div>
          `;
        }).join("")}
      </div>
    </article>
  `;
}

function renderKanban() {
  const orders = filteredOrders();
  elements.kanban.innerHTML = statuses
    .map((status) => {
      const statusOrders = orders.filter((order) => order.status === status);
      return `
        <div class="kanban-col">
          <h3>${status}<span>${statusOrders.length}</span></h3>
          ${statusOrders.map(renderMiniCard).join("") || '<p class="client-meta">Sem cargas neste status.</p>'}
        </div>
      `;
    })
    .join("");
}

function renderMiniCard(order) {
  return `
    <article class="mini-card">
      <strong>${order.id} · ${order.product}</strong>
      <span>${order.client}</span>
      <span>${order.origin} → ${order.destination}</span>
      <span>${order.tons} ton · ${dateLabel(order.pickup)}</span>
    </article>
  `;
}

function renderTimeline() {
  const upcoming = [...data.orders]
    .sort((a, b) => a.pickup.localeCompare(b.pickup))
    .slice(0, 6);

  elements.timeline.innerHTML = upcoming
    .map((order) => `
      <article class="timeline-item">
        <div class="timeline-date">${dateLabel(order.pickup)}</div>
        <div>
          <strong>${order.origin} → ${order.destination}</strong>
          <span class="client-meta">${order.client} · ${order.product} · ${order.status}</span>
        </div>
      </article>
    `)
    .join("");
}

function renderClients() {
  const term = normalize(elements.globalSearch.value);
  const clients = data.clients.filter((client) => !term || normalize(Object.values(client).join(" ")).includes(term));

  elements.clientsTable.innerHTML = clients
    .map((client) => `
      <tr>
        <td><strong>${client.name}</strong></td>
        <td>${client.contact}</td>
        <td>${client.origin}</td>
        <td>${client.product}</td>
        <td><span class="badge ${normalize(client.risk)}">${client.risk}</span></td>
      </tr>
    `)
    .join("");
}

function renderOrders() {
  const orders = filteredOrders();
  elements.ordersGrid.innerHTML = orders
    .map((order) => `
      <article class="order-card">
        <div>
          <strong>${order.id} · ${order.product}</strong>
          <span class="order-meta">${order.client}</span>
        </div>
        <span class="order-meta">${order.origin} → ${order.destination}</span>
        <span class="order-meta">${order.tons} toneladas · coleta ${dateLabel(order.pickup)}</span>
        <div class="order-footer">
          <span class="badge ${normalize(order.priority)}">${order.priority}</span>
          <select class="status-select" data-id="${order.id}" aria-label="Status ${order.id}">
            ${statuses.map((status) => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </div>
      </article>
    `)
    .join("");

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async (event) => {
      const order = data.orders.find((item) => item.id === event.target.dataset.id);
      order.status = event.target.value;
      order.progress = progressForStatus(order.status);
      try {
        if (USE_SUPABASE) await updateOrderStatusInSupabase(order);
      } catch (error) {
        alert("Nao foi possivel atualizar o status no Supabase. Verifique as permissoes da tabela cargas.");
      }
      saveData();
      render();
    });
  });
}

function progressForStatus(status) {
  return {
    Cotacao: 10,
    Aprovado: 28,
    "Em transito": 65,
    Entregue: 100,
    Faturado: 100
  }[status];
}

function renderQuotes() {
  elements.quotesTable.innerHTML = data.orders
    .map((order) => {
      const margin = order.revenue - order.cost;
      return `
        <tr>
          <td><strong>${order.id}</strong><span class="client-meta">${order.origin} → ${order.destination}</span></td>
          <td>${order.client}</td>
          <td>${currency(order.revenue)}</td>
          <td>${currency(order.cost)}</td>
          <td><strong>${currency(margin)}</strong></td>
        </tr>
      `;
    })
    .join("");
}

function renderDrivers() {
  elements.driverBoard.innerHTML = data.orders
    .filter((order) => order.driver)
    .map((order) => `
      <article class="driver-card">
        <div>
          <strong>${order.driver}</strong>
          <span class="client-meta">${order.vehicle}</span>
        </div>
        <span class="client-meta">${order.id} · ${order.origin} → ${order.destination}</span>
        <div class="progress" aria-label="Progresso ${order.progress}%"><span style="width:${order.progress}%"></span></div>
        <span class="badge">${order.status}</span>
      </article>
    `)
    .join("");
}

function renderFinance() {
  const open = data.orders.filter((order) => order.status !== "Faturado").reduce((sum, order) => sum + order.revenue, 0);
  const billed = data.orders.filter((order) => order.status === "Faturado").reduce((sum, order) => sum + order.revenue, 0);
  const costs = data.orders.reduce((sum, order) => sum + order.cost, 0);
  const profit = data.orders.reduce((sum, order) => sum + order.revenue - order.cost, 0);

  const cards = [
    ["A faturar", currency(open), "Fretes aprovados, em cotacao ou em execucao"],
    ["Faturado", currency(billed), "Receita ja concluida"],
    ["Custos previstos", currency(costs), "Motorista, diesel, pedagio e extras"],
    ["Resultado bruto", currency(profit), "Receita menos custos diretos"]
  ];

  elements.financeGrid.innerHTML = cards
    .map(([label, value, helper]) => `
      <article class="finance-card">
        <span class="client-meta">${label}</span>
        <strong>${value}</strong>
        <p class="client-meta">${helper}</p>
      </article>
    `)
    .join("");
}

function render() {
  renderMetrics();
  renderCharts();
  renderKanban();
  renderTimeline();
  renderClients();
  renderOrders();
  renderQuotes();
  renderDrivers();
  renderFinance();
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.view}`).classList.add("active");
    elements.viewTitle.textContent = {
      dashboard: "Painel operacional",
      clientes: "Clientes",
      cargas: "Ordens de carga",
      cotacoes: "Cotacoes",
      viagens: "Viagens",
      financeiro: "Financeiro"
    }[button.dataset.view];
  });
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((segment) => segment.classList.remove("active"));
    button.classList.add("active");
    priorityFilter = button.dataset.priority;
    renderOrders();
    renderKanban();
  });
});

elements.globalSearch.addEventListener("input", render);
elements.statusFilter.addEventListener("change", renderKanban);

document.querySelector("#newOrderBtn").addEventListener("click", () => {
  const pickup = new Date();
  pickup.setDate(pickup.getDate() + 2);
  elements.orderForm.pickup.value = pickup.toISOString().slice(0, 10);
  elements.orderDialog.showModal();
});

document.querySelector("#newClientBtn").addEventListener("click", () => {
  elements.clientDialog.showModal();
});

document.querySelector("#seedBtn").addEventListener("click", () => {
  data = structuredClone(seedData);
  saveData();
  render();
});

elements.orderForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  const form = new FormData(elements.orderForm);
  const order = Object.fromEntries(form.entries());
  const numericTons = Number(order.tons);
  const id = `FR-${1024 + data.orders.length}`;
  const revenue = Math.round(numericTons * 390 + 1800);
  const cost = Math.round(revenue * 0.78);

  const newOrder = {
    ...order,
    id,
    tons: numericTons,
    revenue,
    cost,
    driver: "A definir",
    vehicle: "A definir",
    progress: progressForStatus(order.status)
  };

  try {
    data.orders.unshift(USE_SUPABASE ? await saveOrderToSupabase(newOrder) : newOrder);
  } catch (error) {
    data.orders.unshift(newOrder);
    alert("A carga foi salva apenas neste navegador. O Supabase recusou a gravacao.");
  }

  saveData();
  elements.orderForm.reset();
  render();
});

elements.clientForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  const client = Object.fromEntries(new FormData(elements.clientForm).entries());

  try {
    data.clients.unshift(USE_SUPABASE ? await saveClientToSupabase(client) : client);
  } catch (error) {
    data.clients.unshift(client);
    alert("O cliente foi salvo apenas neste navegador. O Supabase recusou a gravacao.");
  }

  saveData();
  elements.clientForm.reset();
  render();
});

elements.quoteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(elements.quoteForm).entries());
  const revenue = Number(values.km) * Number(values.rate) + Number(values.extra);
  const cost = revenue * 0.76;
  const margin = revenue - cost;
  elements.quoteOutput.value = `${currency(revenue)} · margem estimada ${currency(margin)}`;
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const rows = [
    ["id", "cliente", "produto", "origem", "destino", "toneladas", "status", "receita", "custo"],
    ...data.orders.map((order) => [
      order.id,
      order.client,
      order.product,
      order.origin,
      order.destination,
      order.tons,
      order.status,
      order.revenue,
      order.cost
    ])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "agrofrete-cargas.csv";
  link.click();
  URL.revokeObjectURL(url);
});

async function init() {
  if (USE_SUPABASE) {
    try {
      await loadFromSupabase();
    } catch (error) {
      alert("Nao foi possivel conectar ao Supabase. O CRM abriu com os dados locais deste navegador.");
    }
  }

  render();
}

init();
