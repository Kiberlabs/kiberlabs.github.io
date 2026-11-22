/**
 * KiberLabs Interactive SOW & Technical Proposal PDF Generator (EN/ES).
 * Supports track presets, editable fixed-price milestones, A4 print layout, and Markdown export.
 */

const I18N = {
  en: {
    nav_sandbox: "Live Sandbox",
    nav_portfolio: "Engines",
    nav_benchmarks: "Benchmarks",
    nav_trust: "Trust Center",
    nav_sow: "SOW PDF",
    sow_pill: "B2B Consulting SOW · A4 Print-Ready PDF & Markdown",
    sow_title: 'Fixed-Price <span class="gradient-text">Statement of Work</span> Generator',
    sow_lead: "Configure a transparent fixed-price technical proposal with editable milestones, automated pytest acceptance criteria, and 100% client IP terms—export directly to a clean A4 PDF or copy as Markdown.",
    lbl_preset: "KiberLabs Track Preset",
    lbl_client: "Client / Company",
    lbl_contact: "Client Stakeholder",
    lbl_proj: "Project Title",
    lbl_ref: "SOW Reference",
    lbl_curr: "Currency",
    lbl_date: "Proposal Date",
    lbl_scope: "Technical Scope Summary",
    lbl_crit: "Acceptance & pytest Verification Criteria (1 per line)",
    lbl_oos: "Out-of-Scope Boundaries (1 per line)",
    lbl_ms: "Fixed-Price Milestones",
    btn_add_ms: "+ Add Milestone",
    btn_print: "Print / Save A4 PDF",
    btn_copy_md: "Copy Markdown SOW",
    copied_ok: "Markdown SOW Copied!",
    doc_type: "STATEMENT OF WORK & TECHNICAL PROPOSAL",
    doc_sub: "KiberLabs Engineering · Python 3.11+ & AI Automation Studio (Spain / EU)",
    meta_client: "Client",
    meta_contact: "Stakeholder",
    meta_ref: "Reference",
    meta_date: "Date",
    meta_total: "Total Fixed Price",
    meta_model: "Delivery Model",
    meta_model_val: "Fixed-Price Milestones · 100% Client IP",
    h_scope: "1. Executive Technical Scope",
    h_ms: "2. Fixed-Price Milestones & Schedule",
    th_ms: "Milestone",
    th_deliv: "Key Deliverables",
    th_eta: "ETA",
    th_amt: "Fixed Fee",
    total_lbl: "TOTAL FIXED-PRICE INVESTMENT",
    h_crit: "3. Acceptance & Automated pytest Verification Criteria",
    h_oos: "4. Explicit Out-of-Scope Boundaries",
    h_gov: "5. Security, Governance & Intellectual Property",
    gov_items: [
      "100% Client IP Ownership: Full source code, Dockerfiles, schemas, and tests transfer to the Client upon milestone payment.",
      "GDPR-Ready Isolation & Zero-AI-Training: Client data stays inside Client-owned infrastructure and is never used to train external AI models.",
      "Senior Tech Lead QA Gate: Every milestone passes automated pytest CI (Python 3.11/3.12) and Senior Tech Lead review before delivery.",
    ],
    sig_client: "Authorized Client Approval",
    sig_kl: "KiberLabs Engineering · Senior Tech Lead Sign-Off",
  },
  es: {
    nav_sandbox: "Demo Interactiva",
    nav_portfolio: "Motores",
    nav_benchmarks: "Benchmarks",
    nav_trust: "Centro de Confianza",
    nav_sow: "SOW PDF",
    sow_pill: "SOW Consultoría B2B · PDF A4 Imprimible y Markdown",
    sow_title: 'Generador de <span class="gradient-text">Propuesta y Alcance (SOW)</span>',
    sow_lead: "Configura una propuesta técnica a precio cerrado con hitos editables, criterios automatizados en pytest y cesión del 100% de propiedad intelectual—exporta directo a PDF A4 o copia en Markdown.",
    lbl_preset: "Plantilla de Track KiberLabs",
    lbl_client: "Cliente / Empresa",
    lbl_contact: "Responsable del Cliente",
    lbl_proj: "Título del Proyecto",
    lbl_ref: "Referencia SOW",
    lbl_curr: "Moneda",
    lbl_date: "Fecha de Propuesta",
    lbl_scope: "Resumen del Alcance Técnico",
    lbl_crit: "Criterios de Aceptación y Verificación pytest (1 por línea)",
    lbl_oos: "Límites Fuera de Alcance (1 por línea)",
    lbl_ms: "Hitos a Precio Cerrado",
    btn_add_ms: "+ Añadir Hito",
    btn_print: "Imprimir / Guardar PDF A4",
    btn_copy_md: "Copiar SOW en Markdown",
    copied_ok: "¡SOW Markdown copiado!",
    doc_type: "PROPUESTA TÉCNICA Y ALCANCE (SOW)",
    doc_sub: "KiberLabs Engineering · Estudio de Automatización Python 3.11+ e IA (España / UE)",
    meta_client: "Cliente",
    meta_contact: "Responsable",
    meta_ref: "Referencia",
    meta_date: "Fecha",
    meta_total: "Precio Cerrado Total",
    meta_model: "Modalidad",
    meta_model_val: "Hitos a Precio Cerrado · 100% IP del Cliente",
    h_scope: "1. Alcance Técnico Ejecutivo",
    h_ms: "2. Hitos a Precio Cerrado y Cronograma",
    th_ms: "Hito",
    th_deliv: "Entregables Clave",
    th_eta: "Plazo",
    th_amt: "Importe",
    total_lbl: "INVERSIÓN TOTAL A PRECIO CERRADO",
    h_crit: "3. Criterios de Aceptación y Tests pytest",
    h_oos: "4. Límites Explícitos Fuera de Alcance",
    h_gov: "5. Seguridad, Gobernanza y Propiedad Intelectual",
    gov_items: [
      "100% Propiedad Intelectual del Cliente: Todo el código fuente, Dockerfiles, esquemas y tests se transfieren al Cliente al abonar cada hito.",
      "Aislamiento RGPD y Cero Entrenamiento IA: Los datos permanecen en la infraestructura del Cliente y jamás se envían a modelos públicos de entrenamiento.",
      "Revisión Senior Tech Lead QA: Cada hito supera CI automatizado pytest (Python 3.11/3.12) y auditoría de Senior Tech Lead antes de la entrega.",
    ],
    sig_client: "Aprobación Autorizada del Cliente",
    sig_kl: "KiberLabs Engineering · Revisión Senior Tech Lead",
  },
};

const PRESETS = {
  api: {
    en: {
      title: "Production FastAPI Automation Gateway & Docker Deployment",
      scope: "Design and deliver a hardened Python 3.11+ FastAPI gateway unifying deterministic automation endpoints behind constant-time HMAC X-API-Key authentication, sliding-window rate limiting, SQLite WAL audit persistence, and a multi-stage non-root Docker build.",
      criteria: [
        "pytest suite passes 100% in GitHub Actions CI across Python 3.11 and 3.12.",
        "Constant-time HMAC auth blocks invalid/missing API keys with HTTP 401; rate limiter returns HTTP 429.",
        "SQLite WAL concurrency test verifies 0 database-is-locked errors under concurrent load.",
        "Multi-stage non-root Dockerfile builds cleanly and exposes /health endpoint.",
      ],
      oos: [
        "Third-party cloud hosting fees, domain DNS registration, or paid SaaS API quotas.",
        "Custom front-end web portal beyond the documented REST OpenAPI specification.",
      ],
      milestones: [
        { name: "M1 · Core Gateway & Security Guards", deliv: "FastAPI routes, Pydantic v2 models, HMAC auth, rate limiter & SQLite WAL", eta: "Day 3", amount: 650 },
        { name: "M2 · Docker, CI & QA Handoff", deliv: "Non-root multi-stage Dockerfile, pytest CI matrix, Senior QA sign-off & README", eta: "Day 6", amount: 600 },
      ],
    },
    es: {
      title: "Gateway FastAPI en Producción con Auth HMAC y Despliegue Docker",
      scope: "Diseñar y entregar un gateway FastAPI en Python 3.11+ que unifique endpoints deterministas bajo autenticación HMAC X-API-Key en tiempo constante, rate limiting deslizante, auditoría en SQLite WAL e imagen Docker multi-stage non-root.",
      criteria: [
        "Suite pytest aprobada al 100% en GitHub Actions CI (Python 3.11 y 3.12).",
        "Autenticación HMAC bloquea claves inválidas con HTTP 401 y rate limiter responde HTTP 429.",
        "Prueba de concurrencia SQLite WAL verifica 0 errores 'database is locked'.",
        "Dockerfile multi-stage non-root compila limpio y expone /health.",
      ],
      oos: [
        "Costes de servidor cloud de terceros, registro de dominio DNS o cuotas de APIs externas.",
        "Desarrollo de portal frontend adicional fuera de la especificación REST OpenAPI.",
      ],
      milestones: [
        { name: "H1 · Núcleo Gateway y Guardias", deliv: "Rutas FastAPI, Pydantic v2, auth HMAC, rate limiter y SQLite WAL", eta: "Día 3", amount: 650 },
        { name: "H2 · Docker, CI y Entrega QA", deliv: "Dockerfile non-root, matriz CI pytest, revisión Senior QA y README", eta: "Día 6", amount: 600 },
      ],
    },
  },
  sieve: {
    en: {
      title: "Deterministic E-Commerce Price Intelligence & Margin Sieve",
      scope: "Build a zero-token 3-stage supplier price monitor and net-margin filter in Python 3.11+ with SSRF URL guards, marketplace fee/shipping/return calculations, SQLite WAL price-drop history, and JSON/CSV export.",
      criteria: [
        "Deterministic margin filter processes >= 10,000 SKUs/sec with 0 LLM token spend.",
        "SSRF URL validator blocks RFC1918, loopback, IPv6 internal, and cloud metadata IPs.",
        "SQLite WAL ledger persists price history and triggers accurate price-drop alerts.",
        "pytest suite passes 100% in CI with fixture catalogs and edge-case boundary tests.",
      ],
      oos: [
        "Bypassing CAPTCHAs, login paywalls, or anti-bot protections violating target site ToS.",
        "Paid proxy pool subscriptions or external ERP connector licenses.",
      ],
      milestones: [
        { name: "M1 · Sieve Engine & SSRF Guard", deliv: "3-stage margin calculator, Pydantic boundary validation & SSRF guard", eta: "Day 2", amount: 400 },
        { name: "M2 · WAL Persistence, Exports & CI", deliv: "SQLite WAL alert history, CSV/JSON CLI export, pytest & GitHub Actions CI", eta: "Day 4", amount: 350 },
      ],
    },
    es: {
      title: "Motor Determinista de Monitorización de Precios y Margen Neto",
      scope: "Construir un monitor de precios y filtro de margen neto en 3 etapas (Python 3.11+, 0 tokens LLM) con guardia anti-SSRF, cálculo de comisiones/envíos/devoluciones, histórico en SQLite WAL y exportación JSON/CSV.",
      criteria: [
        "El filtro determinista procesa >= 10.000 SKUs/s con $0 de gasto en tokens LLM.",
        "Validador SSRF bloquea rangos RFC1918, loopback, IPv6 interno y metadatos cloud.",
        "SQLite WAL registra histórico y dispara alertas verificadas de bajada de precio.",
        "Suite pytest aprobada al 100% en CI con catálogos de prueba y casos límite.",
      ],
      oos: [
        "Resolución o evasión de CAPTCHAs, muros de login o protecciones contrarias a ToS.",
        "Suscripciones de proxies pagos o licencias de conectores ERP de terceros.",
      ],
      milestones: [
        { name: "H1 · Motor de Margen y Guardia SSRF", deliv: "Filtro 3 etapas, validación Pydantic y guardia anti-SSRF", eta: "Día 2", amount: 400 },
        { name: "H2 · Persistencia WAL, Export y CI", deliv: "Histórico SQLite WAL, exportación CSV/JSON, pytest y GitHub Actions CI", eta: "Día 4", amount: 350 },
      ],
    },
  },
  bot: {
    en: {
      title: "24/7 Omnichannel Lead Qualification Bot & Webhook Deduplicator",
      scope: "Engineer a resilient bilingual (EN/ES) lead qualification state machine for WhatsApp/Telegram/Web webhooks with zero-token intent/budget extraction, silent spam filtering, atomic SQLite WAL message deduplication, and structured human handoff.",
      criteria: [
        "Atomic webhook replay guard drops duplicate event_ids with 0 duplicate replies.",
        "Bilingual EN/ES NLU classifies service need, budget tier, and spam deterministically.",
        "Structured handoff JSON payload ready for CRM/WhatsApp routing.",
        "pytest suite verifies multi-turn flows, replay storms, and CI pass on Python 3.11/3.12.",
      ],
      oos: [
        "Meta/WhatsApp Business API verification fees or Twilio messaging credits.",
        "24/7 human sales agent staffing or ongoing ad campaign management.",
      ],
      milestones: [
        { name: "M1 · NLU State Machine & Dedup", deliv: "ES/EN zero-token NLU, spam filter, state transitions & SQLite WAL dedup", eta: "Day 3", amount: 450 },
        { name: "M2 · Webhook Endpoint, QA & Docs", deliv: "HMAC-verified webhook handler, handoff queue, pytest suite & handoff guide", eta: "Day 5", amount: 450 },
      ],
    },
    es: {
      title: "Bot Omnicanal 24/7 de Cualificación de Leads y Deduplicación",
      scope: "Desarrollar una máquina de estados bilingüe (ES/EN) para cualificación de leads en WhatsApp/Telegram/Web con NLU local sin tokens, filtro anti-spam silencioso, deduplicación atómica en SQLite WAL y handoff estructurado.",
      criteria: [
        "Guardia atómica de webhooks bloquea duplicados con 0 respuestas repetidas.",
        "NLU bilingüe ES/EN extrae servicio, presupuesto y spam de forma determinista.",
        "Payload JSON de handoff estructurado listo para CRM o equipo comercial.",
        "Suite pytest valida flujos multiturno, replay storms y CI en Python 3.11/3.12.",
      ],
      oos: [
        "Tarifas de verificación de Meta/WhatsApp Business API o créditos de Twilio.",
        "Atención comercial humana 24/7 o gestión continua de campañas publicitarias.",
      ],
      milestones: [
        { name: "H1 · NLU, Estados y Deduplicación", deliv: "NLU local ES/EN, anti-spam, máquina de estados y SQLite WAL", eta: "Día 3", amount: 450 },
        { name: "H2 · Webhook, QA y Documentación", deliv: "Endpoint HMAC verificado, cola handoff, pytest y manual operativo", eta: "Día 5", amount: 450 },
      ],
    },
  },
  rag: {
    en: {
      title: "Zero-Hallucination Grounded B2B Legal & Compliance RAG Engine",
      scope: "Deliver an article-aware document chunker with SHA-256 provenance hashes, SQLite FTS5 BM25 bilingual retrieval with injection sanitization, and strict citation verification that enforces INSUFFICIENT_EVIDENCE abstention when grounding fails.",
      criteria: [
        "Every answer includes verbatim doc_id, article reference, and SHA-256 snippet hash.",
        "Out-of-domain queries return INSUFFICIENT_EVIDENCE with 0 fabricated citations.",
        "FTS5 query sanitizer blocks 100% of SQL/operator injection payloads.",
        "Automated pytest suite and reproducible benchmark pass in GitHub Actions CI.",
      ],
      oos: [
        "Legal advice or regulatory compliance certification by licensed attorneys.",
        "Managed external vector database hosting costs.",
      ],
      milestones: [
        { name: "M1 · Chunker & FTS5 BM25 Index", deliv: "Article-aware parser, SHA-256 hashes, SQLite FTS5 index & injection guard", eta: "Day 3", amount: 550 },
        { name: "M2 · Verifier, API & CI Delivery", deliv: "Zero-hallucination abstention verifier, CLI/API wrapper, pytest & CI", eta: "Day 6", amount: 550 },
      ],
    },
    es: {
      title: "Motor RAG B2B Sin Alucinaciones con Citas Verificables (FTS5)",
      scope: "Entregar un segmentador documental por artículos con hashes SHA-256, motor de búsqueda bilingüe SQLite FTS5 BM25 sanitizado contra inyecciones y verificador estricto de citas con abstención obligatoria INSUFFICIENT_EVIDENCE.",
      criteria: [
        "Toda respuesta incluye doc_id exacto, artículo y hash SHA-256 verificable.",
        "Consultas fuera de dominio devuelven INSUFFICIENT_EVIDENCE con 0 citas inventadas.",
        "Sanitizador FTS5 bloquea el 100% de payloads de inyección SQL/operadores.",
        "Suite pytest y benchmark reproducible aprobados en GitHub Actions CI.",
      ],
      oos: [
        "Asesoramiento jurídico o certificación legal por abogados colegiados.",
        "Costes de bases de datos vectoriales gestionadas de terceros.",
      ],
      milestones: [
        { name: "H1 · Segmentador e Índice FTS5", deliv: "Parser por artículos, hashes SHA-256, índice FTS5 y sanitizador", eta: "Día 3", amount: 550 },
        { name: "H2 · Verificador, API y CI", deliv: "Verificador anti-alucinación, CLI/API, pytest y entrega CI", eta: "Día 6", amount: 550 },
      ],
    },
  },
  invoice: {
    en: {
      title: "B2B 3-Way Invoice Reconciliation & Hash-Chained Audit Ledger",
      scope: "Build a multi-format invoice parser (JSON, UBL/Facturae XML, OCR text), 3-way PO/GRN/Invoice matcher with 0-100 risk scoring (arithmetic, duplicates, >3% price variance, IBAN MOD-97), tamper-evident SHA-256 SQLite WAL ledger, and FastAPI review dashboard.",
      criteria: [
        "Accurately parses European (1.250,50 EUR) and US ($2,400.00) currency formats + IBAN MOD-97.",
        "3-way match deterministically outputs PASS / REVIEW / BLOCKED with auditable rule triggers.",
        "SHA-256 hash-chain verify_chain_integrity() detects any mid-ledger tampering.",
        "CSV export prevents Excel formula injection; full pytest suite passes in CI.",
      ],
      oos: [
        "Real-time EU VIES VAT registry API polling or live bank payment initiation.",
        "Custom ERP plugin development for proprietary on-prem accounting suites.",
      ],
      milestones: [
        { name: "M1 · Multi-Format Parser & 3-Way Match", deliv: "JSON/XML/OCR parsers, IBAN MOD-97, 0-100 risk scorer & rule engine", eta: "Day 3", amount: 700 },
        { name: "M2 · Hash-Chain Ledger, Dashboard & CI", deliv: "SHA-256 WAL ledger, FastAPI HMAC dashboard, CSV export, pytest & Docker", eta: "Day 7", amount: 700 },
      ],
    },
    es: {
      title: "Motor de Conciliación de Facturas 3-Vías y Ledger Hash SHA-256",
      scope: "Construir un parser multiformato (JSON, XML UBL/Facturae, OCR), conciliador 3-vías PO/Albarán/Factura con score de riesgo 0-100 (aritmética, duplicados, variación >3%, IBAN MOD-97), ledger SQLite WAL encadenado SHA-256 y panel FastAPI.",
      criteria: [
        "Parsea importes europeos (1.250,50 EUR) y US ($2,400.00) + validación IBAN MOD-97.",
        "Conciliación 3-vías emite PASS / REVIEW / BLOCKED con trazabilidad determinista.",
        "verify_chain_integrity() detecta cualquier alteración en el ledger SHA-256.",
        "Exportación CSV protegida contra formula injection y CI pytest al 100%.",
      ],
      oos: [
        "Consultas en vivo a API VIES o ejecución directa de transferencias bancarias.",
        "Plugins propietarios para ERPs on-premise cerrados.",
      ],
      milestones: [
        { name: "H1 · Parsers y Conciliación 3-Vías", deliv: "Parsers JSON/XML/OCR, IBAN MOD-97 y motor de riesgo 0-100", eta: "Día 3", amount: 700 },
        { name: "H2 · Ledger SHA-256, Panel y CI", deliv: "Ledger WAL inmutable, dashboard FastAPI HMAC, CSV, pytest y Docker", eta: "Día 7", amount: 700 },
      ],
    },
  },
  video: {
    en: {
      title: "Automated 9:16 Shortform FFmpeg & ASS Subtitle Pipeline",
      scope: "Deliver a deterministic Python 3.11+ video post-production pipeline enforcing 9:16 mobile safe zones, frame-accurate .ASS subtitle generation, 2-pass EBU R128 (-14 LUFS) FFmpeg loudness normalization, SQLite WAL job queue, and ffprobe QA validation.",
      criteria: [
        "Safe-zone validator guarantees subtitle placement clear of mobile UI overlays.",
        "Generated FFmpeg filtergraph passes 2-pass loudnorm (-14 LUFS) and 1080x1920 ffprobe QA.",
        "SQLite WAL queue handles batch retries idempotently without lock contention.",
        "Full pytest suite passes in GitHub Actions CI across Python 3.11 & 3.12.",
      ],
      oos: [
        "Paid third-party AI video/voice API credits or stock footage licensing.",
        "Social media account management or automated posting scripts.",
      ],
      milestones: [
        { name: "M1 · Safe-Zone & ASS Subtitle Engine", deliv: "9:16 geometry validator, .ASS renderer & FFmpeg filtergraph builder", eta: "Day 2", amount: 350 },
        { name: "M2 · WAL Queue, ffprobe QA & CI", deliv: "Batch job queue, ffprobe QA ledger, CLI & automated pytest CI", eta: "Day 4", amount: 350 },
      ],
    },
    es: {
      title: "Pipeline Automatizado 9:16 FFmpeg y Subtítulos .ASS con QA",
      scope: "Entregar un pipeline determinista en Python 3.11+ para vídeo vertical 9:16 con validación de safe-zones móviles, subtítulos .ASS precisos al frame, normalización FFmpeg EBU R128 (-14 LUFS), cola SQLite WAL y QA con ffprobe.",
      criteria: [
        "Validador de safe-zones garantiza subtítulos libres de superposiciones móviles.",
        "Filtergraph FFmpeg cumple loudnorm 2 pasadas (-14 LUFS) y QA ffprobe 1080x1920.",
        "Cola SQLite WAL gestiona reintentos por lote sin bloqueos.",
        "Suite pytest aprobada al 100% en GitHub Actions CI (Python 3.11 y 3.12).",
      ],
      oos: [
        "Créditos de APIs externas de generación de vídeo/voz o licencias de stock.",
        "Gestión de redes sociales o scripts de publicación automatizada.",
      ],
      milestones: [
        { name: "H1 · Motor Safe-Zone y Subtítulos .ASS", deliv: "Validador 9:16, generador .ASS y constructor FFmpeg", eta: "Día 2", amount: 350 },
        { name: "H2 · Cola WAL, QA ffprobe y CI", deliv: "Cola batch, registro QA ffprobe, CLI y CI pytest", eta: "Día 4", amount: 350 },
      ],
    },
  },
};

let currentLang = localStorage.getItem("kl_lang") === "es" ? "es" : "en";
let milestones = [];

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function currencySymbol() {
  return document.getElementById("sow-currency").value === "EUR" ? "€" : "$";
}

function fmtMoney(val) {
  const n = Number(val) || 0;
  const sym = currencySymbol();
  const formatted = n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return sym === "€" ? `${formatted}€` : `$${formatted}`;
}

function loadPreset(trackId) {
  const preset = PRESETS[trackId]?.[currentLang] || PRESETS.api[currentLang];
  document.getElementById("sow-proj").value = preset.title;
  document.getElementById("sow-scope").value = preset.scope;
  document.getElementById("sow-criteria").value = preset.criteria.join("\n");
  document.getElementById("sow-oos").value = preset.oos.join("\n");
  milestones = preset.milestones.map((m) => ({ ...m }));
  renderMilestoneInputs();
  renderPreview();
}

function renderMilestoneInputs() {
  const wrap = document.getElementById("sow-ms-list");
  wrap.innerHTML = "";
  milestones.forEach((m, idx) => {
    const row = document.createElement("div");
    row.className = "ms-row";
    row.innerHTML = `
      <input type="text" data-k="name" value="${escapeHtml(m.name)}" placeholder="Milestone" aria-label="Milestone name" />
      <input type="text" data-k="deliv" value="${escapeHtml(m.deliv)}" placeholder="Deliverables" aria-label="Deliverables" />
      <input type="number" data-k="amount" value="${Number(m.amount) || 0}" min="0" step="50" aria-label="Amount" />
      <input type="text" data-k="eta" value="${escapeHtml(m.eta)}" placeholder="ETA" aria-label="ETA" />
      <button type="button" class="btn btn-secondary btn-sm" data-del="${idx}" title="Remove">×</button>
    `;
    row.querySelectorAll("input").forEach((inp) => {
      inp.addEventListener("input", () => {
        const key = inp.dataset.k;
        milestones[idx][key] = key === "amount" ? Number(inp.value) || 0 : inp.value;
        renderPreview();
      });
    });
    row.querySelector("[data-del]").addEventListener("click", () => {
      if (milestones.length <= 1) return;
      milestones.splice(idx, 1);
      renderMilestoneInputs();
      renderPreview();
    });
    wrap.appendChild(row);
  });
}

function collectState() {
  const lines = (id) =>
    document
      .getElementById(id)
      .value.split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  const total = milestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
  return {
    client: document.getElementById("sow-client").value.trim() || "Client Organization",
    contact: document.getElementById("sow-contact").value.trim() || "Stakeholder",
    project: document.getElementById("sow-proj").value.trim() || "Automation Engagement",
    ref: document.getElementById("sow-ref").value.trim() || "KL-SOW-2026-01",
    date: document.getElementById("sow-date").value || "2026-11-22",
    scope: document.getElementById("sow-scope").value.trim(),
    criteria: lines("sow-criteria"),
    oos: lines("sow-oos"),
    milestones,
    total,
  };
}

function renderPreview() {
  const d = I18N[currentLang];
  const st = collectState();
  const msRows = st.milestones
    .map(
      (m) => `
      <tr>
        <td><strong>${escapeHtml(m.name)}</strong></td>
        <td>${escapeHtml(m.deliv)}</td>
        <td style="white-space:nowrap;">${escapeHtml(m.eta)}</td>
        <td class="mono" style="text-align:right;white-space:nowrap;">${fmtMoney(m.amount)}</td>
      </tr>`
    )
    .join("");

  const critHtml = st.criteria.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
  const oosHtml = st.oos.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
  const govHtml = d.gov_items.map((g) => `<li>${escapeHtml(g)}</li>`).join("");

  document.getElementById("sow-preview").innerHTML = `
    <div class="sow-sheet-head">
      <div class="sow-brand">
        <img src="assets/kiberlabs_logo_oficial.jpg" alt="KiberLabs Logo" />
        <div>
          <div style="font-size:0.74rem;font-weight:700;letter-spacing:0.06em;color:#0369a1;">${escapeHtml(d.doc_type)}</div>
          <h2>${escapeHtml(st.project)}</h2>
          <div style="font-size:0.78rem;color:#475569;">${escapeHtml(d.doc_sub)}</div>
        </div>
      </div>
      <div style="text-align:right;font-size:0.8rem;color:#334155;">
        <div class="mono"><strong>${escapeHtml(st.ref)}</strong></div>
        <div>${escapeHtml(st.date)}</div>
      </div>
    </div>

    <div class="sow-meta-grid">
      <div><strong>${escapeHtml(d.meta_client)}:</strong> ${escapeHtml(st.client)}</div>
      <div><strong>${escapeHtml(d.meta_contact)}:</strong> ${escapeHtml(st.contact)}</div>
      <div><strong>${escapeHtml(d.meta_model)}:</strong> ${escapeHtml(d.meta_model_val)}</div>
      <div><strong>${escapeHtml(d.meta_total)}:</strong> <span class="mono" style="color:#065f46;font-weight:800;">${fmtMoney(st.total)}</span></div>
    </div>

    <h3>${escapeHtml(d.h_scope)}</h3>
    <p style="margin:6px 0;">${escapeHtml(st.scope)}</p>

    <h3>${escapeHtml(d.h_ms)}</h3>
    <table class="sow-table">
      <thead>
        <tr>
          <th>${escapeHtml(d.th_ms)}</th>
          <th>${escapeHtml(d.th_deliv)}</th>
          <th>${escapeHtml(d.th_eta)}</th>
          <th style="text-align:right;">${escapeHtml(d.th_amt)}</th>
        </tr>
      </thead>
      <tbody>${msRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3">${escapeHtml(d.total_lbl)}</td>
          <td class="mono" style="text-align:right;">${fmtMoney(st.total)}</td>
        </tr>
      </tfoot>
    </table>

    <h3>${escapeHtml(d.h_crit)}</h3>
    <ul class="sow-list">${critHtml}</ul>

    <h3>${escapeHtml(d.h_oos)}</h3>
    <ul class="sow-list">${oosHtml}</ul>

    <h3>${escapeHtml(d.h_gov)}</h3>
    <ul class="sow-list">${govHtml}</ul>

    <div class="sow-sigs">
      <div class="sig-box">
        <div>${escapeHtml(st.client)} · ${escapeHtml(st.contact)}</div>
        <div class="sig-line">${escapeHtml(d.sig_client)}</div>
      </div>
      <div class="sig-box">
        <div>KiberLabs Engineering · github.com/Kiberlabs</div>
        <div class="sig-line">${escapeHtml(d.sig_kl)}</div>
      </div>
    </div>
  `;
}

function buildMarkdownSow() {
  const d = I18N[currentLang];
  const st = collectState();
  const lines = [
    `# ${d.doc_type}`,
    `## ${st.project}`,
    "",
    `- **${d.meta_client}:** ${st.client} (${st.contact})`,
    `- **${d.meta_ref}:** \`${st.ref}\` | **${d.meta_date}:** ${st.date}`,
    `- **${d.meta_total}:** **${fmtMoney(st.total)}** (${d.meta_model_val})`,
    "",
    `### ${d.h_scope}`,
    st.scope,
    "",
    `### ${d.h_ms}`,
    `| ${d.th_ms} | ${d.th_deliv} | ${d.th_eta} | ${d.th_amt} |`,
    `| :--- | :--- | :--- | ---: |`,
    ...st.milestones.map((m) => `| ${m.name} | ${m.deliv} | ${m.eta} | ${fmtMoney(m.amount)} |`),
    `| **${d.total_lbl}** | | | **${fmtMoney(st.total)}** |`,
    "",
    `### ${d.h_crit}`,
    ...st.criteria.map((c) => `- [ ] ${c}`),
    "",
    `### ${d.h_oos}`,
    ...st.oos.map((c) => `- ${c}`),
    "",
    `### ${d.h_gov}`,
    ...d.gov_items.map((g) => `- ${g}`),
    "",
    `---`,
    `*Prepared by KiberLabs Engineering · https://kiberlabs.github.io/trust.html*`,
  ];
  return lines.join("\n");
}

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem("kl_lang", lang);
  document.documentElement.lang = lang;
  const dict = I18N[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (!dict[key]) return;
    if (key === "sow_title") el.innerHTML = dict[key];
    else el.textContent = dict[key];
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  loadPreset(document.getElementById("sow-track").value);
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => applyLang(btn.dataset.lang));
});

document.getElementById("sow-track").addEventListener("change", (e) => {
  loadPreset(e.target.value);
});

["sow-client", "sow-contact", "sow-proj", "sow-ref", "sow-currency", "sow-date", "sow-scope", "sow-criteria", "sow-oos"].forEach(
  (id) => {
    document.getElementById(id).addEventListener("input", renderPreview);
    document.getElementById(id).addEventListener("change", renderPreview);
  }
);

document.getElementById("btn-add-ms").addEventListener("click", () => {
  const n = milestones.length + 1;
  milestones.push({
    name: currentLang === "es" ? `H${n} · Hito Adicional` : `M${n} · Additional Milestone`,
    deliv: currentLang === "es" ? "Entregable verificado + pytest" : "Verified deliverable + pytest",
    eta: currentLang === "es" ? `Día ${n * 3}` : `Day ${n * 3}`,
    amount: 250,
  });
  renderMilestoneInputs();
  renderPreview();
});

document.getElementById("btn-print-pdf").addEventListener("click", () => {
  window.print();
});

document.getElementById("btn-copy-md").addEventListener("click", async () => {
  const md = buildMarkdownSow();
  const btn = document.getElementById("btn-copy-md");
  try {
    await navigator.clipboard.writeText(md);
    btn.textContent = I18N[currentLang].copied_ok;
    setTimeout(() => {
      btn.textContent = I18N[currentLang].btn_copy_md;
    }, 1800);
  } catch {
    window.prompt("Copy Markdown SOW:", md);
  }
});

applyLang(currentLang);
