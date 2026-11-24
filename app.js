/**
 * KiberLabs Web App Controller: bilingual EN/ES i18n, tab navigation,
 * 3 live deterministic simulators, and fixed-price brief exporter.
 */

import {
  convertUsdToCurrency,
  estimateFixedPriceScope,
  evaluateInvoice3Way,
  evaluateMarginSieve,
  normalizeCurrency,
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
    lbl_curr: "Currency",
    lbl_docker: "Multi-Stage Docker Container",
    lbl_ci: "GitHub Actions CI Matrix",
    btn_copy_brief: "Copy Scope Brief for Upwork / LinkedIn",
    btn_open_sow: "Open Pre-Filled SOW PDF →",
    copied_ok: "Brief Copied to Clipboard!",
    skip_link: "Skip to main content",
    bot_placeholder: "Type a WhatsApp / Telegram message...",
    bot_input_aria: "Lead bot message input",
    opt_track_sieve: "Web Scraping & Price Intelligence Sieve",
    opt_track_bot: "24/7 Omnichannel Lead Qualification Bot",
    opt_track_video: "Automated 9:16 FFmpeg & ASS Video Pipeline",
    opt_track_rag: "Zero-Hallucination B2B RAG & Citation Engine",
    opt_track_api: "Production FastAPI + Auth + Docker Gateway",
    opt_track_invoice: "B2B 3-Way Invoice Reconciliation & Hash Ledger",
    opt_tier_mvp: "Fast MVP CLI / Core Module (2–5 days)",
    opt_tier_prod: "Production Ready + DB + Webhooks",
    opt_tier_ent: "Multi-Source / Custom Integrations",
    bot_silent_spam: "<silent: spam blocked>",
    bot_silent_optout: "<silent: GDPR opt-out>",
    copy_brief_prompt: "Copy scope brief:",
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
    lbl_curr: "Moneda",
    lbl_docker: "Contenedor Docker Multi-Stage",
    lbl_ci: "CI GitHub Actions 3.11/3.12",
    btn_copy_brief: "Copiar Brief para Upwork / LinkedIn",
    btn_open_sow: "Abrir SOW en PDF Pre-Rellenado →",
    copied_ok: "¡Brief copiado al portapapeles!",
    skip_link: "Saltar al contenido principal",
    bot_placeholder: "Escribe un mensaje de WhatsApp / Telegram...",
    bot_input_aria: "Entrada de mensaje para el bot de leads",
    opt_track_sieve: "Scraping Web e Inteligencia de Precios",
    opt_track_bot: "Bot Omnicanal 24/7 de Cualificación de Leads",
    opt_track_video: "Pipeline Automatizado 9:16 FFmpeg y Subtítulos .ASS",
    opt_track_rag: "Motor RAG B2B Sin Alucinaciones con Citas",
    opt_track_api: "Gateway FastAPI en Producción + Auth + Docker",
    opt_track_invoice: "Conciliación de Facturas 3-Vías y Ledger Hash",
    opt_tier_mvp: "MVP Rápido CLI / Módulo Core (2–5 días)",
    opt_tier_prod: "Listo para Producción + DB + Webhooks",
    opt_tier_ent: "Multifuente / Integraciones a Medida",
    bot_silent_spam: "<silencio: spam bloqueado>",
    bot_silent_optout: "<silencio: baja RGPD / opt-out>",
    copy_brief_prompt: "Copia el brief de alcance:",
  },
};

function safeGetLang() {
  try {
    return localStorage.getItem("kl_lang") === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}

function safeSetLang(lang) {
  try {
    localStorage.setItem("kl_lang", lang);
  } catch {
    /* ignore storage restrictions */
  }
}

let currentLang = safeGetLang();
let isBooted = false;
let botSession = { lang: currentLang, state: "new", service_need: null, estimated_budget_eur: null };
let lastBotIntent = "init";

function applyLang(lang) {
  currentLang = lang;
  safeSetLang(lang);
  document.documentElement.lang = lang;
  const dict = I18N[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (!dict[key]) return;
    if (key === "hero_title") el.innerHTML = dict[key];
    else el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key]) el.placeholder = dict[key];
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.dataset.i18nAriaLabel;
    if (dict[key]) el.setAttribute("aria-label", dict[key]);
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  if (botSession && botSession.state === "new") {
    botSession.lang = lang;
  }
  updateSowLink();
  if (isBooted) {
    updateSieve();
    updateRag();
    renderBotState(lastBotIntent);
    updateInvoice();
    updateEstimator();
  }
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => applyLang(btn.dataset.lang));
});

/* Tabs (ARIA + Keyboard Navigation) */
const tabButtons = [...document.querySelectorAll(".tab-btn")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];

function activateTab(btn, moveFocus = false) {
  const targetId = btn.dataset.tab;
  tabButtons.forEach((b) => {
    const active = b === btn;
    b.classList.toggle("active", active);
    b.setAttribute("aria-selected", String(active));
    b.tabIndex = active ? 0 : -1;
  });
  tabPanels.forEach((p) => {
    const active = p.id === targetId;
    p.classList.toggle("active", active);
    p.hidden = !active;
  });
  if (moveFocus) btn.focus();
}

tabButtons.forEach((btn, idx) => {
  btn.addEventListener("click", () => activateTab(btn, false));
  btn.addEventListener("keydown", (e) => {
    let nextIdx = null;
    if (e.key === "ArrowRight") nextIdx = (idx + 1) % tabButtons.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + tabButtons.length) % tabButtons.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = tabButtons.length - 1;
    if (nextIdx !== null) {
      e.preventDefault();
      activateTab(tabButtons[nextIdx], true);
    }
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
  const okWord = currentLang === "es" ? "APROBADO" : "APPROVED";
  const rejWord = currentLang === "es" ? "RECHAZADO" : "REJECTED";
  badge.textContent = verdict.approved ? `${okWord} · SCORE ${verdict.score}/100` : `${rejWord} · ${verdict.stage.toUpperCase()}`;
  badge.className = `status-badge ${verdict.approved ? "status-ok" : "status-bad"}`;
  document.getElementById("sieve-json").textContent = JSON.stringify(verdict, null, 2);
}
document.getElementById("sieve-form").addEventListener("input", updateSieve);

/* 2. Grounded RAG */
function updateRag() {
  const q = document.getElementById("rag-input").value;
  const res = runGroundedRagQuery(q);
  const badge = document.getElementById("rag-badge");
  if (res.status === "GROUNDED") {
    badge.textContent = currentLang === "es"
      ? `VERIFICADO · ${res.citations.length} CITA(S) VALIDADA(S)`
      : `GROUNDED · ${res.citations.length} VERIFIED CITATION(S)`;
  } else {
    badge.textContent = currentLang === "es"
      ? "EVIDENCIA_INSUFICIENTE · CERO ALUCINACIONES"
      : "INSUFFICIENT_EVIDENCE · ZERO HALLUCINATION";
  }
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
function renderBotState(lastIntent = "init") {
  lastBotIntent = lastIntent;
  const badge = document.getElementById("bot-badge");
  const statePrefix = currentLang === "es" ? "ESTADO" : "STATE";
  badge.textContent = `${statePrefix}: ${botSession.state.toUpperCase()}`;
  badge.className = `status-badge ${
    botSession.state === "handoff_ready"
      ? "status-ok"
      : botSession.state === "spam_blocked" || botSession.state === "silenced"
        ? "status-bad"
        : "status-warn"
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
  const silentLabel = botSession.state === "silenced"
    ? I18N[currentLang].bot_silent_optout
    : I18N[currentLang].bot_silent_spam;
  appendBubble("bot", reply || silentLabel);
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
  const verdictLabels = currentLang === "es"
    ? { PASS: "APROBADA", REVIEW: "REVISIÓN", BLOCKED: "BLOQUEADA" }
    : { PASS: "PASS", REVIEW: "REVIEW", BLOCKED: "BLOCKED" };
  const riskWord = currentLang === "es" ? "RIESGO" : "RISK";
  badge.textContent = `${verdictLabels[res.verdict] || res.verdict} · ${riskWord} ${res.risk_score}/100`;
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
function formatEstMoney(amount, currency = "USD") {
  const curr = normalizeCurrency(currency);
  const formatted = Number(amount).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return curr === "EUR" ? `${formatted}€` : `$${formatted}`;
}

function updateEstAddonLabels(lang = currentLang, currency = "USD") {
  const dict = I18N[lang] || I18N.en;
  const curr = normalizeCurrency(currency);
  const dockerAmt = convertUsdToCurrency(150, curr);
  const ciAmt = convertUsdToCurrency(100, curr);
  const dockerSpan = document.querySelector('#estimator [data-i18n="lbl_docker"]');
  const ciSpan = document.querySelector('#estimator [data-i18n="lbl_ci"]');
  if (dockerSpan) dockerSpan.textContent = `${dict.lbl_docker} (+${formatEstMoney(dockerAmt, curr)})`;
  if (ciSpan) ciSpan.textContent = `${dict.lbl_ci} (+${formatEstMoney(ciAmt, curr)})`;
}

function updateSowLink() {
  const link = document.getElementById("est-sow-link");
  const trackEl = document.getElementById("est-track");
  const tierEl = document.getElementById("est-tier");
  const dockerEl = document.getElementById("est-docker");
  const ciEl = document.getElementById("est-ci");
  const currEl = document.getElementById("est-currency");
  if (!link || !trackEl || !tierEl || !dockerEl || !ciEl) return;
  const params = new URLSearchParams({
    track: trackEl.value,
    lang: currentLang,
    tier: tierEl.value,
    docker: dockerEl.checked ? "1" : "0",
    ci: ciEl.checked ? "1" : "0",
    currency: normalizeCurrency(currEl?.value),
  });
  link.href = `sow.html?${params.toString()}`;
}

function updateEstimator() {
  const currency = normalizeCurrency(document.getElementById("est-currency")?.value);
  lastEstimate = estimateFixedPriceScope({
    track: document.getElementById("est-track").value,
    complexity: document.getElementById("est-tier").value,
    includeDocker: document.getElementById("est-docker").checked,
    includeCi: document.getElementById("est-ci").checked,
    lang: currentLang,
    currency,
  });
  updateEstAddonLabels(currentLang, lastEstimate.currency);
  document.getElementById("est-price").textContent = formatEstMoney(lastEstimate.total, lastEstimate.currency);
  document.getElementById("est-turnaround").textContent = currentLang === "es"
    ? `EST. ${lastEstimate.days} DÍAS · PRECIO CERRADO`
    : `EST. ${lastEstimate.days} DAYS · FIXED-PRICE`;
  const ul = document.getElementById("est-milestones");
  ul.innerHTML = "";
  for (const m of lastEstimate.milestones) {
    const li = document.createElement("li");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = m.name;
    const amtStrong = document.createElement("strong");
    amtStrong.textContent = formatEstMoney(m.amount, lastEstimate.currency);
    li.append(nameSpan, amtStrong);
    ul.appendChild(li);
  }
  updateSowLink();
}
["est-track", "est-tier", "est-docker", "est-ci", "est-currency"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", updateEstimator);
});
document.getElementById("est-copy").addEventListener("click", async () => {
  if (!lastEstimate) return;
  const isEs = currentLang === "es";
  const fmtTotal = formatEstMoney(lastEstimate.total, lastEstimate.currency);
  const brief = [
    isEs ? "Estimación de Alcance a Precio Cerrado — KiberLabs" : "KiberLabs Fixed-Price Scope Estimate",
    `${isEs ? "Línea" : "Track"}: ${lastEstimate.trackLabel}`,
    `${isEs ? "Total Estimado" : "Estimated Total"}: ${fmtTotal} (${lastEstimate.days} ${isEs ? "días" : "days"})`,
    ...lastEstimate.milestones.map((m) => `- ${m.name}: ${formatEstMoney(m.amount, lastEstimate.currency)}`),
    `${isEs ? "Portafolio" : "Portfolio"}: https://kiberlabs.github.io`,
  ].join("\n");
  try {
    await navigator.clipboard.writeText(brief);
    const btn = document.getElementById("est-copy");
    btn.textContent = I18N[currentLang].copied_ok;
    setTimeout(() => applyLang(currentLang), 1800);
  } catch {
    window.prompt(I18N[currentLang].copy_brief_prompt, brief);
  }
});

/* Boot */
applyLang(currentLang);
updateSieve();
updateRag();
renderBotState("init");
updateInvoice();
updateEstimator();
isBooted = true;
