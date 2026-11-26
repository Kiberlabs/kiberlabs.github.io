/**
 * KiberLabs Interactive SOW & Technical Proposal PDF Generator (EN/ES).
 * Supports track presets, editable fixed-price milestones, A4 print layout, and Markdown export.
 */

import {
  convertUsdToCurrency,
  estimateFixedPriceScope,
  normalizeCurrency,
  parseSowQueryParams,
  USD_TO_EUR,
} from "./engines.js";

export const I18N = {
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
    skip_link: "Skip to main content",
    lbl_tier: "Delivery Tier",
    tier_mvp: "Fast MVP CLI / Core Module (2–5 days)",
    tier_prod: "Production Ready + DB + Webhooks",
    tier_ent: "Multi-Source / Custom Integrations",
    lbl_docker: "Multi-Stage Docker Container",
    lbl_ci: "GitHub Actions CI Matrix",
    meta_tier: "Delivery Tier",
    meta_docker: "Docker",
    meta_ci: "pytest/CI",
    opt_included: "Included",
    opt_excluded: "Excluded",
    opt_track_api: "FastAPI + HMAC Auth + Docker Gateway",
    opt_track_sieve: "E-Commerce Price Intelligence & Margin Sieve",
    opt_track_bot: "24/7 Omnichannel Lead Qualification Bot",
    opt_track_rag: "Zero-Hallucination B2B Legal/Policy RAG Engine",
    opt_track_invoice: "B2B 3-Way Invoice Reconciliation & Hash Ledger",
    opt_track_maintenance: "Telegram Maintenance & Manual FTS5 RAG Bot",
    opt_track_video: "Automated 9:16 FFmpeg & ASS Video Pipeline",
    ph_ms_name: "Milestone",
    aria_ms_name: "Milestone name",
    ph_ms_deliv: "Deliverables",
    aria_ms_deliv: "Deliverables",
    aria_ms_amt: "Amount",
    ph_ms_eta: "ETA",
    aria_ms_eta: "ETA",
    btn_del_ms: "Remove",
    default_client: "Client Organization",
    default_contact: "Stakeholder",
    default_project: "Automation Engagement",
    md_footer: "*Prepared by KiberLabs Engineering · https://kiberlabs.github.io/trust.html*",
    copy_md_prompt: "Copy Markdown SOW:",
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
    skip_link: "Saltar al contenido principal",
    lbl_tier: "Nivel de Entrega",
    tier_mvp: "MVP Rápido CLI / Módulo Core (2–5 días)",
    tier_prod: "Listo para Producción + DB + Webhooks",
    tier_ent: "Multifuente / Integraciones a Medida",
    lbl_docker: "Contenedor Docker Multi-Stage",
    lbl_ci: "CI GitHub Actions 3.11/3.12",
    meta_tier: "Nivel de Entrega",
    meta_docker: "Docker",
    meta_ci: "pytest/CI",
    opt_included: "Incluido",
    opt_excluded: "Excluido",
    opt_track_api: "Gateway FastAPI + Auth HMAC + Docker",
    opt_track_sieve: "Inteligencia de Precios y Filtro de Margen E-Commerce",
    opt_track_bot: "Bot Omnicanal 24/7 de Cualificación de Leads",
    opt_track_rag: "Motor RAG B2B Legal/Normativo Sin Alucinaciones",
    opt_track_invoice: "Conciliación de Facturas 3-Vías y Ledger Hash",
    opt_track_maintenance: "Bot Telegram de Mantenimiento y RAG FTS5",
    opt_track_video: "Pipeline Automatizado 9:16 FFmpeg y Subtítulos .ASS",
    ph_ms_name: "Hito",
    aria_ms_name: "Nombre del hito",
    ph_ms_deliv: "Entregables",
    aria_ms_deliv: "Entregables",
    aria_ms_amt: "Importe",
    ph_ms_eta: "Plazo",
    aria_ms_eta: "Plazo",
    btn_del_ms: "Eliminar",
    default_client: "Organización Cliente",
    default_contact: "Responsable",
    default_project: "Proyecto de Automatización",
    md_footer: "*Preparado por KiberLabs Engineering · https://kiberlabs.github.io/trust.html*",
    copy_md_prompt: "Copia el SOW en Markdown:",
  },
};

export const PRESETS = {
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
  maintenance_rag: {
    en: {
      title: "Telegram Industrial Maintenance Log & Manual FTS5 RAG Bot",
      scope: "Build a deterministic Python 3.11+ Telegram maintenance intake and SQLite WAL + FTS5 manual finder with atomic 64-bit update_id deduplication, bilingual EN/ES equipment/fault extraction, strict [manual_id#section] inline citations, and mandatory INSUFFICIENT_EVIDENCE abstention.",
      criteria: [
        "Atomic BEGIN IMMEDIATE + ON CONFLICT(update_id) dedup prevents duplicate webhook replays.",
        "Bilingual EN/ES extractor isolates fault_code before equipment_id and ignores ISO/IEC norm tags.",
        "Every grounded answer attaches [manual_id#section] citations or returns INSUFFICIENT_EVIDENCE.",
        "Full pytest suite passes in GitHub Actions CI across Python 3.11 and 3.12.",
      ],
      oos: [
        "Paid third-party CMMS/SAP connector licenses or cloud Telegram bot hosting fees.",
        "Custom OCR digitization of unscanned legacy paper schematics beyond structured manual imports.",
      ],
      milestones: [
        { name: "M1 · WAL Dedup & EN/ES Extractor", deliv: "SQLite WAL store, 64-bit update_id idempotency & fault/asset parser", eta: "Day 2", amount: 500 },
        { name: "M2 · FTS5 Manual RAG, CLI & CI", deliv: "Sanitized FTS5 retriever, inline citations, pytest & GitHub Actions CI", eta: "Day 4", amount: 500 },
      ],
    },
    es: {
      title: "Bot Telegram de Mantenimiento Industrial y RAG FTS5 de Manuales",
      scope: "Construir un servicio determinista en Python 3.11+ para ingesta de partes de mantenimiento por Telegram y búsqueda en manuales con SQLite WAL + FTS5, deduplicación atómica por update_id de 64 bits, extracción bilingüe ES/EN, citas [manual_id#section] y abstención INSUFFICIENT_EVIDENCE.",
      criteria: [
        "Deduplicación atómica BEGIN IMMEDIATE + ON CONFLICT(update_id) bloquea replays de webhooks.",
        "Extractor bilingüe ES/EN separa fault_code antes de equipment_id e ignora tags ISO/IEC.",
        "Toda respuesta validada adjunta citas [manual_id#section] o devuelve INSUFFICIENT_EVIDENCE.",
        "Suite pytest aprobada al 100% en GitHub Actions CI (Python 3.11 y 3.12).",
      ],
      oos: [
        "Licencias de conectores CMMS/SAP propietarios o alojamiento cloud del bot Telegram.",
        "Digitalización OCR de planos en papel no estructurados fuera de la ingesta estándar de manuales.",
      ],
      milestones: [
        { name: "H1 · WAL Dedup y Extractor ES/EN", deliv: "Almacén SQLite WAL, idempotencia update_id 64-bit y parser de fallos", eta: "Día 2", amount: 500 },
        { name: "H2 · RAG FTS5, CLI y CI", deliv: "Buscador FTS5 sanitizado, citas inline, pytest y GitHub Actions CI", eta: "Día 4", amount: 500 },
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

export function clampAmount(val) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatMoney(val, currency = "USD") {
  const n = clampAmount(val);
  const curr = normalizeCurrency(currency);
  const formatted = n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return curr === "EUR" ? `${formatted}€` : `$${formatted}`;
}

export function getAddonLabels(lang = "en", currency = "USD") {
  const d = I18N[lang === "es" ? "es" : "en"];
  const curr = normalizeCurrency(currency);
  const dockerAmt = convertUsdToCurrency(150, curr);
  const ciAmt = convertUsdToCurrency(100, curr);
  return {
    docker: `${d.lbl_docker} (+${formatMoney(dockerAmt, curr)})`,
    ci: `${d.lbl_ci} (+${formatMoney(ciAmt, curr)})`,
  };
}

export function getGovItems(lang = "en", st = {}) {
  const isEs = lang === "es";
  const includeDocker = st?.includeDocker !== false;
  const includeCi = st?.includeCi !== false;
  if (isEs) {
    return [
      includeDocker
        ? "100% Propiedad Intelectual del Cliente: Todo el código fuente, Dockerfiles, esquemas y tests se transfieren al Cliente al abonar cada hito."
        : "100% Propiedad Intelectual del Cliente: Todo el código fuente, esquemas y tests se transfieren al Cliente al abonar cada hito (sin contenedor Docker en este alcance).",
      "Aislamiento RGPD y Cero Entrenamiento IA: Los datos permanecen en la infraestructura del Cliente y jamás se envían a modelos públicos de entrenamiento.",
      includeCi
        ? "Revisión Senior Tech Lead QA: Cada hito supera CI automatizado pytest (Python 3.11/3.12) y auditoría de Senior Tech Lead antes de la entrega."
        : "Revisión Senior Tech Lead QA: Cada hito supera la suite local pytest (Python 3.11+) y auditoría de Senior Tech Lead antes de la entrega (CI GitHub Actions excluido).",
    ];
  }
  return [
    includeDocker
      ? "100% Client IP Ownership: Full source code, Dockerfiles, schemas, and tests transfer to the Client upon milestone payment."
      : "100% Client IP Ownership: Full source code, schemas, and tests transfer to the Client upon milestone payment (Docker container excluded from scope).",
    "GDPR-Ready Isolation & Zero-AI-Training: Client data stays inside Client-owned infrastructure and is never used to train external AI models.",
    includeCi
      ? "Senior Tech Lead QA Gate: Every milestone passes automated pytest CI (Python 3.11/3.12) and Senior Tech Lead review before delivery."
      : "Senior Tech Lead QA Gate: Every milestone passes local pytest verification (Python 3.11+) and Senior Tech Lead review before delivery (GitHub Actions CI excluded).",
  ];
}

export function mdEscape(v) {
  return String(v ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("`", "\\`")
    .replace(/^(\s*)(#{1,6})(?=\s|$)/gm, "$1\\$2")
    .replace(/^(\s*)(>+)/gm, "$1\\$2")
    .replace(/^(\s*)(={1,}|-{1,}|\*{3,}|_{3,})(\s*)$/gm, "$1\\$2$3");
}

export function mdCodeSpan(v) {
  const clean = String(v ?? "").replace(/[\r\n]+/g, " ");
  const maxRun = Math.max(0, ...(clean.match(/`+/g) || []).map((m) => m.length));
  const fence = "`".repeat(maxRun + 1);
  const pad = clean.startsWith("`") || clean.endsWith("`") ? " " : "";
  return `${fence}${pad}${clean}${pad}${fence}`;
}

function adaptPresetText(trackId, lang, opts = {}) {
  const safeTrack = Object.hasOwn(PRESETS, trackId) ? trackId : "api";
  const safeLang = lang === "es" ? "es" : "en";
  const includeDocker = opts.includeDocker !== false;
  const includeCi = opts.includeCi !== false;
  const raw = PRESETS[safeTrack][safeLang];

  let title = raw.title;
  let scope = raw.scope;
  let criteria = [...raw.criteria];
  let milestones = raw.milestones.map((m) => ({ ...m }));

  if (!includeDocker) {
    title = title
      .replace(" & Docker Deployment", "")
      .replace(" y Despliegue Docker", "");
    scope = scope
      .replace(", and a multi-stage non-root Docker build.", ".")
      .replace(" e imagen Docker multi-stage non-root.", ".");
    criteria = criteria.filter((c) => !/docker/i.test(c));
    milestones = milestones.map((m) => ({
      ...m,
      name: m.name
        .replace("Docker, ", "")
        .replace(/\s*(?:&|,|\by\b)\s*Docker\b/gi, ""),
      deliv: m.deliv
        .replace(/Non-root multi-stage Dockerfile,\s*/gi, "")
        .replace(/Dockerfile non-root,\s*/gi, "")
        .replace(/\s*(?:&|,|\by\b)\s*Dockerfiles?\b/gi, "")
        .replace(/\s*(?:&|,|\by\b)\s*Docker\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim(),
    }));
  }

  if (!includeCi) {
    criteria = criteria.map((c) =>
      c
        .replace(/in GitHub Actions CI across Python 3\.11 and 3\.12/gi, "locally via pytest (Python 3.11+)")
        .replace(/in GitHub Actions CI across Python 3\.11 & 3\.12/gi, "locally via pytest (Python 3.11+)")
        .replace(/en GitHub Actions CI \(Python 3\.11 y 3\.12\)/gi, "localmente con pytest (Python 3.11+)")
        .replace(/in GitHub Actions CI/gi, "locally via pytest")
        .replace(/en GitHub Actions CI/gi, "localmente con pytest")
        .replace(/and CI pass on Python 3\.11\/3\.12/gi, "locally on Python 3.11+")
        .replace(/y CI en Python 3\.11\/3\.12/gi, "localmente en Python 3.11+")
        .replace(/passes 100% in CI/gi, "passes 100% locally")
        .replace(/aprobada al 100% en CI/gi, "aprobada al 100% localmente")
        .replace(/full pytest suite passes in CI/gi, "full pytest suite passes locally")
        .replace(/CI pytest al 100%/gi, "suite pytest local al 100%")
    );
    milestones = milestones.map((m) => {
      let nextName = m.name
        .replace(/CI\s*&\s*QA/gi, "QA & Final")
        .replace(/CI\s+y\s+Entrega\s+QA/gi, "QA y Entrega")
        .replace(/CI\s+y\s+Entrega/gi, "QA y Entrega")
        .replace(/&\s*CI\s+Delivery\b/gi, "& QA Delivery")
        .replace(/\bCI\s+Delivery\b/gi, "QA Delivery");
      if (/\bQA\b/i.test(nextName)) {
        nextName = nextName
          .replace(/\s*&\s*CI\b/gi, " & Final")
          .replace(/\s+\by\s+CI\b/gi, " y Entrega");
      } else {
        nextName = nextName
          .replace(/\s*&\s*CI\b/gi, " & QA")
          .replace(/\s+\by\s+CI\b/gi, " y QA");
      }
      const nextDeliv = m.deliv
        .replace(/pytest\s*&\s*GitHub Actions CI/gi, "local pytest & QA")
        .replace(/pytest\s+y\s+GitHub Actions CI/gi, "pytest local y QA")
        .replace(/pytest\s*&\s*CI\b/gi, "local pytest & QA")
        .replace(/pytest CI matrix/gi, "local pytest suite")
        .replace(/matriz CI pytest/gi, "suite pytest local")
        .replace(/&\s*GitHub Actions CI/gi, "& local QA")
        .replace(/\by\s+GitHub Actions CI/gi, "y QA local")
        .replace(/&\s*CI\b/gi, "& local QA")
        .replace(/\by\s+entrega\s+CI\b/gi, "y entrega QA local")
        .replace(/&\s*automated pytest CI/gi, "& local pytest verification")
        .replace(/\by\s+CI\s+pytest\b/gi, "y verificación pytest local");
      return {
        ...m,
        name: nextName.replace(/\s{2,}/g, " ").trim(),
        deliv: nextDeliv.replace(/\s{2,}/g, " ").trim(),
      };
    });
  }

  const tier = opts.tier || "production";
  const currency = normalizeCurrency(opts.currency);
  const est = estimateFixedPriceScope({
    track: safeTrack,
    complexity: tier,
    includeDocker,
    includeCi,
    lang: safeLang,
    currency,
  });
  const m1EtaDays = Math.max(1, Math.ceil(est.days * 0.5));
  const dayWord = safeLang === "es" ? "Día" : "Day";
  milestones = milestones.map((m, idx) => ({
    ...m,
    eta: `${dayWord} ${idx === 0 ? m1EtaDays : est.days}`,
    amount: clampAmount(est.milestones[idx] ? est.milestones[idx].amount : m.amount),
  }));

  return {
    title,
    scope,
    criteria,
    oos: [...raw.oos],
    milestones,
    est,
  };
}

export function applyPresetAndLangState(state = {}, opts = {}) {
  const {
    track = "api",
    lang = "en",
    tier = "production",
    includeDocker = true,
    includeCi = true,
    currency = "USD",
    dirtyFields = new Set(),
    hasManualMilestoneEdits = false,
    preserveCustom = true,
  } = opts;
  const nextPreset = adaptPresetText(track, lang, { tier, includeDocker, includeCi, currency });
  const dirty = dirtyFields instanceof Set ? dirtyFields : new Set(dirtyFields || []);

  const project = preserveCustom && dirty.has("proj") ? state.project : nextPreset.title;
  const scope = preserveCustom && dirty.has("scope") ? state.scope : nextPreset.scope;
  const criteria = preserveCustom && dirty.has("criteria") ? state.criteria : nextPreset.criteria;
  const oos = preserveCustom && dirty.has("oos") ? state.oos : nextPreset.oos;

  let milestones;
  const existingMs = Array.isArray(state.milestones) ? state.milestones : [];
  if (!preserveCustom || !hasManualMilestoneEdits || existingMs.length === 0) {
    milestones = nextPreset.milestones.map((m, idx) => ({ ...m, _presetIdx: idx, _dirty: {} }));
  } else {
    milestones = existingMs.map((m) => {
      const pIdx = m._presetIdx;
      const p = Number.isInteger(pIdx) && pIdx >= 0 && pIdx < nextPreset.milestones.length
        ? nextPreset.milestones[pIdx]
        : null;
      const mDirty = m._dirty || {};
      if (!p) return { ...m, _dirty: { ...mDirty } };
      return {
        name: mDirty.name ? m.name : p.name,
        deliv: mDirty.deliv ? m.deliv : p.deliv,
        eta: mDirty.eta ? m.eta : p.eta,
        amount: mDirty.amount ? clampAmount(m.amount) : p.amount,
        _presetIdx: pIdx,
        _dirty: { ...mDirty },
      };
    });
  }

  return { project, scope, criteria, oos, milestones };
}

function getTierLabel(lang, tier) {
  const d = I18N[lang === "es" ? "es" : "en"];
  if (tier === "mvp") return d.tier_mvp;
  if (tier === "enterprise") return d.tier_ent;
  return d.tier_prod;
}

export function buildMarkdownSowFromState(state = {}, opts = {}) {
  const lang = opts.lang === "es" || state.lang === "es" ? "es" : "en";
  const curr = normalizeCurrency(opts.currency ?? state.currency);
  const tier = opts.tier ?? state.tier ?? "production";
  const includeDocker = (opts.includeDocker ?? state.includeDocker) !== false;
  const includeCi = (opts.includeCi ?? state.includeCi) !== false;
  const d = I18N[lang];
  const safeMilestones = (Array.isArray(state.milestones) ? state.milestones : []).map((m) => ({
    ...m,
    amount: clampAmount(m.amount),
  }));
  const total = safeMilestones.reduce((acc, m) => acc + m.amount, 0);
  const criteriaList = Array.isArray(state.criteria)
    ? state.criteria
    : String(state.criteria ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const oosList = Array.isArray(state.oos)
    ? state.oos
    : String(state.oos ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  const mdLine = (v) => mdEscape(String(v ?? "").replace(/[\r\n]+/g, " "));
  const mdScopeBlock = (v) => mdEscape(String(v ?? "").replace(/\r\n?/g, "\n"));
  const mdCell = (v) => mdLine(v);
  const govItems = getGovItems(lang, { includeDocker, includeCi });
  const dockerStatus = includeDocker ? d.opt_included : d.opt_excluded;
  const ciStatus = includeCi ? d.opt_included : d.opt_excluded;

  const lines = [
    `# ${d.doc_type}`,
    `## ${mdLine(state.project || d.default_project)}`,
    "",
    `- **${d.meta_client}:** ${mdLine(state.client || d.default_client)} (${mdLine(state.contact || d.default_contact)})`,
    `- **${d.meta_ref}:** ${mdCodeSpan(state.ref || "KL-SOW-2026-01")} | **${d.meta_date}:** ${mdLine(state.date || "2026-11-22")}`,
    `- **${d.meta_total}:** **${formatMoney(total, curr)}** (${curr} · ${d.meta_model_val})`,
    `- **${d.meta_tier}:** ${mdLine(getTierLabel(lang, tier))} | **${d.meta_docker}:** ${dockerStatus} | **${d.meta_ci}:** ${ciStatus}`,
    "",
    `### ${d.h_scope}`,
    mdScopeBlock(state.scope || ""),
    "",
    `### ${d.h_ms}`,
    `| ${d.th_ms} | ${d.th_deliv} | ${d.th_eta} | ${d.th_amt} |`,
    `| :--- | :--- | :--- | ---: |`,
    ...safeMilestones.map((m) => `| ${mdCell(m.name)} | ${mdCell(m.deliv)} | ${mdCell(m.eta)} | ${formatMoney(m.amount, curr)} |`),
    `| **${d.total_lbl}** | | | **${formatMoney(total, curr)}** |`,
    "",
    `### ${d.h_crit}`,
    ...criteriaList.map((c) => `- [ ] ${mdLine(c)}`),
    "",
    `### ${d.h_oos}`,
    ...oosList.map((c) => `- ${mdLine(c)}`),
    "",
    `### ${d.h_gov}`,
    ...govItems.map((g) => `- ${g}`),
    "",
    `---`,
    d.md_footer,
  ];
  return lines.join("\n");
}

export function initSowApp() {
  let currentLang = safeGetLang();
  let activeCurrency = "USD";
  let milestones = [];
  let dirtyFields = new Set();
  let hasManualTextEdits = false;
  let hasManualMilestoneEdits = false;
  let isBooted = false;

  const trackEl = document.getElementById("sow-track");
  const tierEl = document.getElementById("sow-tier");
  const dockerEl = document.getElementById("sow-docker");
  const ciEl = document.getElementById("sow-ci");
  const currEl = document.getElementById("sow-currency");
  const projEl = document.getElementById("sow-proj");
  const scopeEl = document.getElementById("sow-scope");
  const critEl = document.getElementById("sow-criteria");
  const oosEl = document.getElementById("sow-oos");

  function getScopeOpts(langOverride = currentLang) {
    return {
      track: trackEl?.value || "api",
      lang: langOverride,
      tier: tierEl?.value || "production",
      includeDocker: dockerEl?.checked ?? true,
      includeCi: ciEl?.checked ?? true,
      currency: normalizeCurrency(currEl?.value || activeCurrency),
    };
  }

  function updateAddonLabels(lang = currentLang, currency = activeCurrency) {
    const labels = getAddonLabels(lang, currency);
    const dSpan = document.querySelector('[data-i18n="lbl_docker"]');
    const cSpan = document.querySelector('[data-i18n="lbl_ci"]');
    if (dSpan) dSpan.textContent = labels.docker;
    if (cSpan) cSpan.textContent = labels.ci;
  }

  function readDomTextState() {
    return {
      project: projEl?.value ?? "",
      scope: scopeEl?.value ?? "",
      criteria: (critEl?.value ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
      oos: (oosEl?.value ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
      milestones,
    };
  }

  function writeDomTextState(nextState) {
    if (projEl) projEl.value = nextState.project;
    if (scopeEl) scopeEl.value = nextState.scope;
    if (critEl) critEl.value = Array.isArray(nextState.criteria) ? nextState.criteria.join("\n") : String(nextState.criteria ?? "");
    if (oosEl) oosEl.value = Array.isArray(nextState.oos) ? nextState.oos.join("\n") : String(nextState.oos ?? "");
    milestones = nextState.milestones;
  }

  function applyStateTransition(preserveCustom = true) {
    const opts = getScopeOpts(currentLang);
    const next = applyPresetAndLangState(readDomTextState(), {
      ...opts,
      dirtyFields,
      hasManualMilestoneEdits,
      preserveCustom,
    });
    writeDomTextState(next);
    renderMilestoneInputs();
    renderPreview();
  }

  function loadPreset(trackId) {
    if (trackEl && trackId) trackEl.value = trackId;
    dirtyFields = new Set();
    hasManualTextEdits = false;
    hasManualMilestoneEdits = false;
    applyStateTransition(false);
  }

  function renderMilestoneInputs() {
    const d = I18N[currentLang];
    const wrap = document.getElementById("sow-ms-list");
    wrap.innerHTML = "";
    milestones.forEach((m, idx) => {
      const row = document.createElement("div");
      row.className = "ms-row";
      row.innerHTML = `
        <input type="text" data-k="name" value="${escapeHtml(m.name)}" placeholder="${escapeHtml(d.ph_ms_name)}" aria-label="${escapeHtml(d.aria_ms_name)}" />
        <input type="text" data-k="deliv" value="${escapeHtml(m.deliv)}" placeholder="${escapeHtml(d.ph_ms_deliv)}" aria-label="${escapeHtml(d.aria_ms_deliv)}" />
        <input type="number" data-k="amount" value="${clampAmount(m.amount)}" min="0" step="5" aria-label="${escapeHtml(d.aria_ms_amt)}" />
        <input type="text" data-k="eta" value="${escapeHtml(m.eta)}" placeholder="${escapeHtml(d.ph_ms_eta)}" aria-label="${escapeHtml(d.aria_ms_eta)}" />
        <button type="button" class="btn btn-secondary btn-sm" data-del="${idx}" title="${escapeHtml(d.btn_del_ms)}" aria-label="${escapeHtml(d.btn_del_ms)}">×</button>
      `;
      row.querySelectorAll("input").forEach((inp) => {
        const markDirty = () => {
          const key = inp.dataset.k;
          hasManualMilestoneEdits = true;
          if (!milestones[idx]._dirty) milestones[idx]._dirty = {};
          milestones[idx]._dirty[key] = true;
          milestones[idx][key] = key === "amount" ? clampAmount(inp.value) : inp.value;
          renderPreview();
        };
        inp.addEventListener("input", markDirty);
        inp.addEventListener("change", markDirty);
      });
      row.querySelector("[data-del]").addEventListener("click", () => {
        if (milestones.length <= 1) return;
        hasManualMilestoneEdits = true;
        milestones.splice(idx, 1);
        renderMilestoneInputs();
        renderPreview();
      });
      wrap.appendChild(row);
    });
  }

  function collectState() {
    const d = I18N[currentLang];
    const lines = (id) =>
      document
        .getElementById(id)
        .value.split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    const safeMilestones = milestones.map((m) => ({
      ...m,
      amount: clampAmount(m.amount),
    }));
    const total = safeMilestones.reduce((acc, m) => acc + m.amount, 0);
    const opts = getScopeOpts(currentLang);
    return {
      client: document.getElementById("sow-client").value.trim() || d.default_client,
      contact: document.getElementById("sow-contact").value.trim() || d.default_contact,
      project: document.getElementById("sow-proj").value.trim() || d.default_project,
      ref: document.getElementById("sow-ref").value.trim() || "KL-SOW-2026-01",
      date: document.getElementById("sow-date").value || "2026-11-22",
      scope: document.getElementById("sow-scope").value.trim(),
      criteria: lines("sow-criteria"),
      oos: lines("sow-oos"),
      milestones: safeMilestones,
      total,
      tier: opts.tier,
      includeDocker: opts.includeDocker,
      includeCi: opts.includeCi,
      currency: opts.currency,
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
          <td class="mono" style="text-align:right;white-space:nowrap;">${formatMoney(m.amount, st.currency)}</td>
        </tr>`
      )
      .join("");

    const critHtml = st.criteria.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
    const oosHtml = st.oos.map((c) => `<li>${escapeHtml(c)}</li>`).join("");
    const govHtml = getGovItems(currentLang, st).map((g) => `<li>${escapeHtml(g)}</li>`).join("");
    const dockerStatus = st.includeDocker ? d.opt_included : d.opt_excluded;
    const ciStatus = st.includeCi ? d.opt_included : d.opt_excluded;

    document.getElementById("sow-preview").innerHTML = `
      <div class="sow-sheet-head">
        <div class="sow-brand">
          <img src="assets/kiberlabs_logo_oficial.jpg" alt="KiberLabs Logo" width="46" height="46" />
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
        <div><strong>${escapeHtml(d.meta_total)}:</strong> <span class="mono" style="color:#065f46;font-weight:800;">${formatMoney(st.total, st.currency)}</span></div>
        <div><strong>${escapeHtml(d.meta_tier)}:</strong> ${escapeHtml(getTierLabel(currentLang, st.tier))}</div>
        <div><strong>${escapeHtml(d.meta_docker)}:</strong> ${escapeHtml(dockerStatus)} · <strong>${escapeHtml(d.meta_ci)}:</strong> ${escapeHtml(ciStatus)}</div>
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
            <td class="mono" style="text-align:right;">${formatMoney(st.total, st.currency)}</td>
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
    const st = collectState();
    return buildMarkdownSowFromState(st, {
      lang: currentLang,
      currency: st.currency,
      tier: st.tier,
      includeDocker: st.includeDocker,
      includeCi: st.includeCi,
    });
  }

  function applyLang(lang) {
    currentLang = lang === "es" ? "es" : "en";
    safeSetLang(currentLang);
    document.documentElement.lang = currentLang;
    const dict = I18N[currentLang];
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (!dict[key]) return;
      if (key === "sow_title") el.innerHTML = dict[key];
      else el.textContent = dict[key];
    });
    updateAddonLabels(currentLang, activeCurrency);
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      const active = btn.dataset.lang === currentLang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    if (!isBooted) {
      loadPreset(trackEl.value);
    } else {
      applyStateTransition(true);
    }
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });

  trackEl?.addEventListener("change", () => {
    loadPreset(trackEl.value);
  });

  ["sow-tier", "sow-docker", "sow-ci"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
      applyStateTransition(true);
    });
  });

  currEl?.addEventListener("change", () => {
    const nextCurrency = normalizeCurrency(currEl.value);
    if (nextCurrency !== activeCurrency) {
      if (hasManualMilestoneEdits) {
        milestones = milestones.map((m) => ({
          ...m,
          amount: nextCurrency === "EUR"
            ? Math.round(clampAmount(m.amount) * USD_TO_EUR)
            : Math.round(clampAmount(m.amount) / USD_TO_EUR),
        }));
      }
      activeCurrency = nextCurrency;
      updateAddonLabels(currentLang, activeCurrency);
      applyStateTransition(true);
    } else {
      renderPreview();
    }
  });

  [
    ["sow-proj", "proj"],
    ["sow-scope", "scope"],
    ["sow-criteria", "criteria"],
    ["sow-oos", "oos"],
  ].forEach(([id, fieldKey]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const markFieldDirty = () => {
      dirtyFields.add(fieldKey);
      hasManualTextEdits = true;
    };
    el.addEventListener("input", markFieldDirty);
    el.addEventListener("change", markFieldDirty);
  });

  ["sow-client", "sow-contact", "sow-proj", "sow-ref", "sow-date", "sow-scope", "sow-criteria", "sow-oos"].forEach(
    (id) => {
      document.getElementById(id).addEventListener("input", renderPreview);
      document.getElementById(id).addEventListener("change", renderPreview);
    }
  );

  document.getElementById("btn-add-ms").addEventListener("click", () => {
    hasManualMilestoneEdits = true;
    const n = milestones.length + 1;
    milestones.push({
      name: currentLang === "es" ? `H${n} · Hito Adicional` : `M${n} · Additional Milestone`,
      deliv: currentLang === "es" ? "Entregable verificado + pytest" : "Verified deliverable + pytest",
      eta: currentLang === "es" ? `Día ${n * 3}` : `Day ${n * 3}`,
      amount: activeCurrency === "EUR" ? convertUsdToCurrency(250, "EUR") : 250,
      _dirty: { name: true, deliv: true, eta: true, amount: true },
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
      window.prompt(I18N[currentLang].copy_md_prompt, md);
    }
  });

  const bridge = parseSowQueryParams(window.location.search);
  if (bridge.lang) {
    currentLang = bridge.lang;
  }
  activeCurrency = bridge.currency;
  if (trackEl) trackEl.value = bridge.track;
  if (tierEl) tierEl.value = bridge.tier;
  if (dockerEl) dockerEl.checked = bridge.includeDocker;
  if (ciEl) ciEl.checked = bridge.includeCi;
  if (currEl) currEl.value = activeCurrency;

  applyLang(currentLang);
  isBooted = true;
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  initSowApp();
}
