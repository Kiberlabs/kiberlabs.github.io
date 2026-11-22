/**
 * KiberLabs Web App Controller: bilingual EN/ES i18n, tab navigation,
 * 3 live deterministic simulators, and fixed-price brief exporter.
 */

import {
  estimateFixedPriceScope,
  evaluateInvoice3Way,
  evaluateMarginSieve,
  runGroundedRagQuery,
  stepLeadBotSession,
} from "./engines.js";

const I18N = {
  en: {
    nav_sandbox: "Live Sandbox",
    nav_portfolio: "Engines",
    nav_benchmarks: "Benchmarks",
    nav_trust: "Trust Center",
    nav_sow: "SOW PDF",
    nav_estimator: "Scope Estimator",
    hero_pill: "Fixed-Price Python & AI Engineering · CI Verified",
    hero_title: 'Production <span class="gradient-text">Python &amp; AI Automation</span> Systems Built in Days, Not Months.',
    hero_lead: "We engineer deterministic scraping & margin sieves, 24/7 omnichannel bots, grounded legal/compliance RAG pipelines, and containerized FastAPI gateways—backed by SQLite WAL, Pydantic v2, and automated pytest CI.",
    cta_sandbox: "Try Live Interactive Sandbox",
    cta_benchmarks: "View Live Benchmarks & Red-Team",
    cta_sow: "Generate SOW PDF",
    cta_trust: "Trust & ADRs",
    cta_estimator: "Estimate Fixed-Price Scope",
    m_ci: "GitHub Actions Passing (Py 3.11 & 3.12)",
    m_tests: "Automated pytest & Security Guards",
    m_tokens: "Deterministic Local Filtering Core",
    m_turnaround: "Fixed-Price Milestone Turnaround",
    sb_title: "Live Interactive Engineering Sandbox",
    sb_desc: "Test real deterministic KiberLabs rules directly in your browser—zero signup, zero API keys, instant JSON output.",
    tab_sieve: "1. Margin Sieve Engine",
    tab_rag: "2. Grounded RAG Verifier",
    tab_bot: "3. 24/7 Lead Bot Simulator",
    tab_invoice: "4. Invoice 3-Way & IBAN Auditor",
    lbl_po: "Purchase Order Total (EUR)",
    lbl_grn: "Goods Receipt (GRN) Total (EUR)",
    lbl_inv_total: "Billed Invoice Total (EUR)",
    lbl_iban: "Beneficiary IBAN (MOD-97)",
    lbl_vendor: "Approved Vendor Master",
    lbl_dup: "Duplicate Invoice Detected",
    lbl_supplier: "Supplier Cost (EUR)",
    lbl_resale: "Target Resale (EUR)",
    lbl_ship: "Shipping Cost (EUR)",
    lbl_fee: "Marketplace Fee (%)",
    lbl_days: "Delivery SLA (Days)",
    lbl_rating: "Supplier Rating (0–5)",
    lbl_stock: "In Stock",
    lbl_eu: "EU Warehouse Dispatch",
    lbl_rag_q: "Ask a regulatory / policy question (EN or ES)",
    btn_rag: "Verify Citations",
    btn_send: "Send",
    btn_reset: "Reset",
    pf_title: "6 Open-Source Production Reference Engines",
    pf_desc: "Every repository runs live GitHub Actions CI across Python 3.11 & 3.12 with deterministic pytest coverage.",
    r1_desc: "Zero-token 3-stage supplier catalog filter, net-margin calculator, SSRF URL guard, and SQLite WAL price-drop alerts.",
    r2_desc: "Bilingual ES/EN zero-token NLU, adaptive lead qualification state machine, spam blocking, and atomic webhook idempotency.",
    r3_desc: "9:16 mobile safe-zone validator, frame-accurate .ASS subtitle generator, EBU R128 loudnorm FFmpeg builder, and QA ledger.",
    r4_desc: "Article-aware legal/policy chunking with SHA-256 hashes, SQLite FTS5 BM25 bilingual search, and zero-hallucination abstention.",
    r5_desc: "Production REST gateway unifying Sieve, Lead Webhooks, and RAG behind HMAC X-API-Key auth, sliding-window rate limits, and Docker.",
    r6_desc: "Multi-format invoice parser (JSON, UBL/Facturae XML, OCR), 3-way PO/GRN match with 0-100 risk score, IBAN MOD-97, and a SHA-256 hash-chained tamper-evident ledger.",
    est_title: "Fixed-Price Milestone Scope Estimator",
    est_desc: "Configure your target deliverable to preview transparent fixed-price milestones and copy a ready-to-send brief.",
    lbl_track: "Automation Track",
    lbl_tier: "Delivery Tier",
    lbl_docker: "Multi-Stage Docker Container (+$150)",
    lbl_ci: "GitHub Actions CI Matrix (+$100)",
    btn_copy_brief: "Copy Scope Brief for Upwork / LinkedIn",
    btn_open_sow: "Open Pre-Filled SOW PDF →",
    copied_ok: "Brief Copied to Clipboard!",
  },
  es: {
    nav_sandbox: "Demo Interactiva",
    nav_portfolio: "Motores",
    nav_benchmarks: "Benchmarks",
    nav_trust: "Centro de Confianza",
    nav_sow: "SOW PDF",
    nav_estimator: "Calculadora de Alcance",
    hero_pill: "Ingeniería Python e IA a Precio Cerrado · CI Verificado",
    hero_title: 'Sistemas de <span class="gradient-text">Automatización Python e IA</span> en Producción en Días, No Meses.',
    hero_lead: "Construimos motores deterministas de scraping y márgenes, bots omnicanal 24/7, pipelines RAG jurídicos sin alucinaciones y gateways FastAPI en Docker—con SQLite WAL, Pydantic v2 y CI automatizado.",
    cta_sandbox: "Probar Demo Interactiva",
    cta_benchmarks: "Ver Benchmarks y Red-Team",
    cta_sow: "Generar SOW en PDF",
    cta_trust: "Confianza y ADRs",
    cta_estimator: "Calcular Presupuesto Cerrado",
    m_ci: "GitHub Actions en Verde (Py 3.11 y 3.12)",
    m_tests: "Tests pytest y Guardias de Seguridad",
    m_tokens: "Núcleo Determinista de Filtrado Local",
    m_turnaround: "Entrega por Hitos a Precio Cerrado",
    sb_title: "Sandbox Técnico Interactivo en Vivo",
    sb_desc: "Prueba la lógica determinista real de KiberLabs en tu navegador—sin registro, sin API keys y con salida JSON al instante.",
    tab_sieve: "1. Motor de Márgenes",
    tab_rag: "2. Verificador RAG",
    tab_bot: "3. Simulador Bot 24/7",
    tab_invoice: "4. Auditoría Facturas 3-Vías e IBAN",
    lbl_po: "Total Pedido Compra / PO (EUR)",
    lbl_grn: "Total Albarán / GRN (EUR)",
    lbl_inv_total: "Total Factura Emitida (EUR)",
    lbl_iban: "IBAN Beneficiario (MOD-97)",
    lbl_vendor: "Proveedor Aprobado",
    lbl_dup: "Factura Duplicada Detectada",
    lbl_supplier: "Coste Proveedor (EUR)",
    lbl_resale: "Precio Venta Objetivo (EUR)",
    lbl_ship: "Envío (EUR)",
    lbl_fee: "Comisión Marketplace (%)",
    lbl_days: "Entrega SLA (Días)",
    lbl_rating: "Valoración Proveedor (0–5)",
    lbl_stock: "En Stock",
    lbl_eu: "Envío desde UE",
    lbl_rag_q: "Haz una consulta normativa o de política (EN o ES)",
    btn_rag: "Verificar Citas",
    btn_send: "Enviar",
    btn_reset: "Reiniciar",
    pf_title: "6 Motores Open-Source de Referencia en Producción",
    pf_desc: "Cada repositorio ejecuta GitHub Actions CI real en Python 3.11 y 3.12 con cobertura automatizada en pytest.",
    r1_desc: "Filtro de catálogo en 3 etapas sin tokens, cálculo de margen neto, guarda anti-SSRF y alertas de bajada de precio en SQLite WAL.",
    r2_desc: "NLU bilingüe ES/EN sin tokens, máquina de estados de cualificación de leads, filtro anti-spam e idempotencia atómica de webhooks.",
    r3_desc: "Validador de safe-zones móviles 9:16, generador de subtítulos .ASS, normalización FFmpeg EBU R128 y registro de QA.",
    r4_desc: "Segmentación legal por Artículos con hashes SHA-256, búsqueda BM25 en SQLite FTS5 y abstención anti-alucinaciones.",
    r5_desc: "Gateway REST en producción unificando Sieve, Webhooks y RAG con auth HMAC X-API-Key, rate limiting y Docker multi-stage.",
    r6_desc: "Parser de facturas multiformato (JSON, XML UBL/Facturae, OCR), conciliación 3 vías PO/GRN con score de riesgo 0-100, IBAN MOD-97 y ledger inmutable con cadena de hashes SHA-256.",
    est_title: "Calculadora de Hitos a Precio Cerrado",
    est_desc: "Configura tu entregable para estimar hitos transparentes y copiar un resumen técnico listo para enviar.",
    lbl_track: "Línea de Automatización",
    lbl_tier: "Nivel de Entrega",
    lbl_docker: "Contenedor Docker Multi-Stage (+$150)",
    lbl_ci: "CI GitHub Actions 3.11/3.12 (+$100)",
    btn_copy_brief: "Copiar Brief para Upwork / LinkedIn",
    btn_open_sow: "Abrir SOW en PDF Pre-Rellenado →",
    copied_ok: "¡Brief copiado al portapapeles!",
  },
};

let currentLang = localStorage.getItem("kl_lang") === "es" ? "es" : "en";

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem("kl_lang", lang);
  document.documentElement.lang = lang;
  const dict = I18N[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (!dict[key]) return;
    if (key === "hero_title") el.innerHTML = dict[key];
    else el.textContent = dict[key];
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  updateSowLink();
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => applyLang(btn.dataset.lang));
});

/* Tabs */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* 1. Margin Sieve */
function updateSieve() {
  const verdict = evaluateMarginSieve({
    supplierPrice: document.getElementById("s-supplier").value,
    resalePrice: document.getElementById("s-resale").value,
    shippingCost: document.getElementById("s-ship").value,
    marketplaceFeePct: document.getElementById("s-fee").value,
    returnReservePct: 4,
    deliveryDays: document.getElementById("s-days").value,
    rating: document.getElementById("s-rating").value,
    inStock: document.getElementById("s-stock").checked,
    euDispatch: document.getElementById("s-eu").checked,
  });
  const badge = document.getElementById("sieve-badge");
  badge.textContent = verdict.approved ? `APPROVED · SCORE ${verdict.score}/100` : `REJECTED · ${verdict.stage.toUpperCase()}`;
  badge.className = `status-badge ${verdict.approved ? "status-ok" : "status-bad"}`;
  document.getElementById("sieve-json").textContent = JSON.stringify(verdict, null, 2);
}
document.getElementById("sieve-form").addEventListener("input", updateSieve);

/* 2. Grounded RAG */
function updateRag() {
  const q = document.getElementById("rag-input").value;
  const res = runGroundedRagQuery(q);
  const badge = document.getElementById("rag-badge");
  badge.textContent = res.status === "GROUNDED"
    ? `GROUNDED · ${res.citations.length} VERIFIED CITATION(S)`
    : "INSUFFICIENT_EVIDENCE · ZERO HALLUCINATION";
  badge.className = `status-badge ${res.status === "GROUNDED" ? "status-ok" : "status-warn"}`;
  document.getElementById("rag-json").textContent = JSON.stringify(res, null, 2);
}
document.getElementById("rag-run").addEventListener("click", updateRag);
document.getElementById("rag-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    updateRag();
  }
});
document.querySelectorAll(".rag-preset").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("rag-input").value = btn.dataset.q;
    updateRag();
  });
});

/* 3. Lead Bot */
let botSession = { lang: "es", state: "new", service_need: null, estimated_budget_eur: null };

function renderBotState(lastIntent = "init") {
  const badge = document.getElementById("bot-badge");
  badge.textContent = `STATE: ${botSession.state.toUpperCase()}`;
  badge.className = `status-badge ${
    botSession.state === "handoff_ready" ? "status-ok" : botSession.state === "spam_blocked" ? "status-bad" : "status-warn"
  }`;
  document.getElementById("bot-json").textContent = JSON.stringify({ last_intent: lastIntent, session: botSession }, null, 2);
}

function appendBubble(role, text) {
  const log = document.getElementById("bot-log");
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function sendBotMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  appendBubble("user", trimmed);
  const { session, intent, reply } = stepLeadBotSession(botSession, trimmed);
  botSession = session;
  appendBubble("bot", reply || "<silent: spam blocked>");
  renderBotState(intent);
}

document.getElementById("bot-send").addEventListener("click", () => {
  const inp = document.getElementById("bot-input");
  sendBotMessage(inp.value);
  inp.value = "";
});
document.getElementById("bot-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const inp = document.getElementById("bot-input");
    sendBotMessage(inp.value);
    inp.value = "";
  }
});
document.getElementById("bot-reset").addEventListener("click", () => {
  botSession = { lang: currentLang, state: "new", service_need: null, estimated_budget_eur: null };
  document.getElementById("bot-log").innerHTML = "";
  renderBotState("reset");
});
document.querySelectorAll(".bot-preset").forEach((btn) => {
  btn.addEventListener("click", () => sendBotMessage(btn.dataset.msg));
});

/* 4. Invoice 3-Way & IBAN MOD-97 Auditor */
function updateInvoice() {
  const res = evaluateInvoice3Way({
    poTotal: document.getElementById("inv-po").value,
    grnTotal: document.getElementById("inv-grn").value,
    invoiceTotal: document.getElementById("inv-total").value,
    iban: document.getElementById("inv-iban").value,
    approvedVendor: document.getElementById("inv-vendor").checked,
    duplicateInvoice: document.getElementById("inv-dup").checked,
  });
  const badge = document.getElementById("inv-badge");
  badge.textContent = `${res.verdict} · RISK ${res.risk_score}/100`;
  badge.className = `status-badge ${
    res.verdict === "PASS" ? "status-ok" : res.verdict === "REVIEW" ? "status-warn" : "status-bad"
  }`;
  document.getElementById("inv-json").textContent = JSON.stringify(res, null, 2);
}
document.getElementById("invoice-form").addEventListener("input", updateInvoice);
document.querySelectorAll(".inv-preset").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("inv-po").value = btn.dataset.po;
    document.getElementById("inv-grn").value = btn.dataset.grn;
    document.getElementById("inv-total").value = btn.dataset.inv;
    document.getElementById("inv-iban").value = btn.dataset.iban;
    document.getElementById("inv-vendor").checked = btn.dataset.vendor === "1";
    document.getElementById("inv-dup").checked = btn.dataset.dup === "1";
    updateInvoice();
  });
});

/* 5. Estimator */
let lastEstimate = null;
function updateSowLink() {
  const link = document.getElementById("est-sow-link");
  const trackEl = document.getElementById("est-track");
  if (!link || !trackEl) return;
  link.href = `sow.html?track=${encodeURIComponent(trackEl.value)}&lang=${encodeURIComponent(currentLang)}`;
}

function updateEstimator() {
  lastEstimate = estimateFixedPriceScope({
    track: document.getElementById("est-track").value,
    complexity: document.getElementById("est-tier").value,
    includeDocker: document.getElementById("est-docker").checked,
    includeCi: document.getElementById("est-ci").checked,
  });
  document.getElementById("est-price").textContent = `$${lastEstimate.totalUsd.toLocaleString("en-US")}`;
  document.getElementById("est-turnaround").textContent = `EST. ${lastEstimate.days} DAYS · FIXED-PRICE`;
  const ul = document.getElementById("est-milestones");
  ul.innerHTML = "";
  for (const m of lastEstimate.milestones) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${m.name}</span><strong>$${m.usd}</strong>`;
    ul.appendChild(li);
  }
  updateSowLink();
}
["est-track", "est-tier", "est-docker", "est-ci"].forEach((id) => {
  document.getElementById(id).addEventListener("change", updateEstimator);
});
document.getElementById("est-copy").addEventListener("click", async () => {
  if (!lastEstimate) return;
  const brief = [
    `KiberLabs Fixed-Price Scope Estimate`,
    `Track: ${lastEstimate.trackLabel}`,
    `Estimated Total: $${lastEstimate.totalUsd} (${lastEstimate.days} days)`,
    ...lastEstimate.milestones.map((m) => `- ${m.name}: $${m.usd}`),
    `Portfolio: https://kiberlabs.github.io`,
  ].join("\n");
  try {
    await navigator.clipboard.writeText(brief);
    const btn = document.getElementById("est-copy");
    btn.textContent = I18N[currentLang].copied_ok;
    setTimeout(() => applyLang(currentLang), 1800);
  } catch {
    window.prompt("Copy scope brief:", brief);
  }
});

/* Boot */
applyLang(currentLang);
updateSieve();
updateRag();
renderBotState("init");
updateInvoice();
updateEstimator();
