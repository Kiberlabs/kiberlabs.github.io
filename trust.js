/**
 * KiberLabs Trust Center Controller: bilingual EN/ES i18n synced via localStorage.
 */

const I18N = {
  en: {
    nav_sandbox: "Live Sandbox",
    nav_portfolio: "Engines",
    nav_benchmarks: "Benchmarks",
    nav_trust: "Trust Center",
    nav_sow: "SOW PDF",
    tr_pill: "EU-Ready B2B Governance · Transparent Architecture",
    tr_title: 'Trust, Security &amp; <span class="gradient-text">Engineering Delivery</span> Center',
    tr_lead: "How KiberLabs protects client data, eliminates hallucination & lock-in risk, and enforces Senior Tech Lead QA verification on every fixed-price milestone.",
    tr_btn_bench: "Verify 100+ Red-Team Benchmarks",
    tr_btn_sow: "Generate Fixed-Price SOW PDF",
    sec_guar_title: "4 Non-Negotiable B2B Delivery Guarantees",
    sec_guar_desc: "Built directly into every Statement of Work and verified in CI before final handoff.",
    g1_title: "1. Strict Data Isolation & EU-First Storage",
    g1_desc: "All pipelines run on client-owned infrastructure (local SQLite WAL, private PostgreSQL, or EU VPC containers). Zero third-party telemetry, zero hidden SaaS retention, and explicit environment-variable secret hygiene (.env excluded from Git).",
    g2_title: "2. Zero-AI-Training & Zero-Token Core Default",
    g2_desc: "Client payloads, invoices, and legal documents are never submitted to public AI training pools. Up to 95% of filtering, routing, and citation checks execute deterministically in local Python with $0 external LLM API calls.",
    g3_title: "3. Senior Tech Lead Review & Automated CI",
    g3_desc: "Every deliverable passes a two-step gate before milestone sign-off: automated pytest + boundary security checks across Python 3.11 & 3.12 in GitHub Actions, plus code architecture and flow-docstring review by our Senior Tech Lead & QA.",
    g4_title: "4. Full Intellectual Property Ownership",
    g4_desc: "Upon milestone payment, the client owns 100% of custom source code, Dockerfiles, database schemas, and tests. Zero proprietary runtime wrappers, zero recurring license tax, and complete operator README handoff.",
    sec_adr_title: "Public Architecture Decision Records (ADRs)",
    sec_adr_desc: "The four core engineering decisions behind KiberLabs' reliability, low operational cost, and fast fixed-price turnaround.",
    adr_ctx: "Context:",
    adr_dec: "Decision:",
    adr_ver: "Verification:",
    adr1_ctx: "Concurrent webhook workers and scrapers frequently crash default SQLite rollback journals with database is locked errors.",
    adr1_dec: "Enforce PRAGMA journal_mode=WAL, synchronous=NORMAL, and busy_timeout=5000+ across all single-node engines, with clean repository interfaces for PostgreSQL migration when multi-region scale is required.",
    adr1_ver: "50-thread simultaneous read/write stress test passes with 0 lock errors in kiberlabs-benchmarks.",
    adr2_ctx: "Routing raw catalog scrapes, spam webhooks, or noisy OCR records straight into LLMs wastes 85–95% of token spend and introduces non-deterministic failures.",
    adr2_dec: "Place strict Python / Pydantic v2 deterministic sieves (margin math, IBAN MOD-97, regex NLU, SLA gates) ahead of any optional AI step.",
    adr2_ver: "Processes tens of thousands of SKUs/sec and NLU turns/sec locally at $0.00 API token cost.",
    adr3_ctx: "Internet-facing scrapers, file processors, and FastAPI webhooks are prime targets for SSRF metadata theft, path traversal, and webhook replay floods.",
    adr3_dec: "Ship multi-stage non-root Docker images backed by constant-time HMAC X-API-Key auth, sliding-window rate limits, private/metadata IP rejection, and atomic replay deduplication.",
    adr3_ver: "100% block rate across 112 real Red-Team payloads in automated CI.",
    adr4_ctx: "Vector-only RAG pipelines frequently hallucinate legal clauses, skip exact article IDs, and require expensive managed vector databases.",
    adr4_dec: "Use article-aware chunking with SHA-256 content hashes, SQLite FTS5 BM25 retrieval with strict query sanitization, and mandatory INSUFFICIENT_EVIDENCE abstention when grounding fails.",
    adr4_ver: "Sub-millisecond p50 retrieval with verifiable verbatim citations and zero FTS5 operator injection bypasses.",
    sec_proto_title: "Standard 3-Step Fixed-Price Delivery Protocol",
    p_s1: "Written fixed-price milestones, explicit acceptance criteria, and out-of-scope boundaries signed before coding starts.",
    p_s2: "Typed Python 3.11+ engine, SQLite WAL / Postgres schema, boundary security guards, and reproducible unit + integration pytest suite.",
    p_s3: "Senior Tech Lead review, green GitHub Actions CI badge, Docker image, and full 100% IP source handoff.",
  },
  es: {
    nav_sandbox: "Demo Interactiva",
    nav_portfolio: "Motores",
    nav_benchmarks: "Benchmarks",
    nav_trust: "Centro de Confianza",
    nav_sow: "SOW PDF",
    tr_pill: "Gobernanza B2B Lista para UE · Arquitectura Transparente",
    tr_title: 'Centro de Confianza, Seguridad y <span class="gradient-text">Entrega Técnica</span>',
    tr_lead: "Cómo KiberLabs protege los datos del cliente, elimina alucinaciones y lock-in, y exige revisión de Senior Tech Lead QA en cada hito a precio cerrado.",
    tr_btn_bench: "Verificar +100 Benchmarks Red-Team",
    tr_btn_sow: "Generar SOW a Precio Cerrado en PDF",
    sec_guar_title: "4 Garantías B2B No Negociables",
    sec_guar_desc: "Incluidas contractualmente en cada SOW y verificadas en CI antes de la entrega final.",
    g1_title: "1. Aislamiento Estricto de Datos y Enfoque RGPD/UE",
    g1_desc: "Todos los pipelines corren en infraestructura del cliente (SQLite WAL local, PostgreSQL privado o contenedores en VPC europea). Cero telemetría externa, cero retención SaaS oculta y gestión segura de secretos vía variables de entorno.",
    g2_title: "2. Compromiso Cero Entrenamiento IA y Núcleo Sin Tokens",
    g2_desc: "Los datos, facturas y documentos legales del cliente nunca se envían a pools públicos de entrenamiento. Hasta el 95% del filtrado, enrutado y validación de citas se ejecuta localmente en Python con $0 en tokens LLM.",
    g3_title: "3. Revisión Senior Tech Lead y CI Automatizado",
    g3_desc: "Cada entregable supera un doble filtro antes del cierre de hito: suite pytest + guardias de seguridad en GitHub Actions (Python 3.11 y 3.12), más revisión de arquitectura y docstrings de flujo por nuestro Senior Tech Lead & QA.",
    g4_title: "4. Propiedad Intelectual 100% del Cliente",
    g4_desc: "Al aprobar el hito, el cliente recibe el 100% del código fuente, Dockerfiles, esquemas SQL y tests. Sin wrappers propietarios, sin licencias recurrentes y con manual operativo completo.",
    sec_adr_title: "Decisiones Arquitectónicas Públicas (ADRs)",
    sec_adr_desc: "Las cuatro decisiones técnicas detrás de la fiabilidad, bajo coste operativo y entrega rápida a precio cerrado de KiberLabs.",
    adr_ctx: "Contexto:",
    adr_dec: "Decisión:",
    adr_ver: "Verificación:",
    adr1_ctx: "Workers concurrentes y scrapers suelen provocar errores 'database is locked' en el modo journal por defecto de SQLite.",
    adr1_dec: "Imponer PRAGMA journal_mode=WAL, synchronous=NORMAL y busy_timeout=5000+ en todos los motores mononodo, manteniendo capa limpia para migrar a PostgreSQL si se requiere escala multirregión.",
    adr1_ver: "Prueba de estrés de 50 hilos simultáneos superada con 0 errores de bloqueo en kiberlabs-benchmarks.",
    adr2_ctx: "Enviar catálogos crudos, spam de webhooks o OCR ruidoso directo a un LLM desperdicia el 85–95% del gasto en tokens e introduce fallos no deterministas.",
    adr2_dec: "Colocar filtros deterministas en Python / Pydantic v2 (márgenes, IBAN MOD-97, NLU regex, SLAs) antes de cualquier llamada opcional a IA.",
    adr2_ver: "Procesa decenas de miles de SKUs/s y mensajes NLU/s localmente con $0.00 de coste en tokens.",
    adr3_ctx: "Scrapers, procesadores de archivos y webhooks FastAPI son blancos habituales de robo de metadatos SSRF, path traversal y tormentas de replay.",
    adr3_dec: "Entregar contenedores Docker multi-stage non-root con autenticación HMAC X-API-Key en tiempo constante, rate limiting deslizante, bloqueo de IPs privadas/metadatos y deduplicación atómica.",
    adr3_ver: "100% de bloqueo sobre 112 payloads adversariales reales en CI automatizado.",
    adr4_ctx: "Los pipelines RAG puramente vectoriales suelen alucinar cláusulas legales, perder IDs exactos de artículos y exigir bases vectoriales gestionadas costosas.",
    adr4_dec: "Aplicar segmentación por artículo con hashes SHA-256, búsqueda SQLite FTS5 BM25 con sanitización estricta y abstención obligatoria INSUFFICIENT_EVIDENCE cuando falta soporte documental.",
    adr4_ver: "Recuperación sub-milisegundo en p50 con citas verificables y cero bypasses de inyección FTS5.",
    sec_proto_title: "Protocolo Estándar de Entrega en 3 Pasos",
    p_s1: "Hitos a precio cerrado por escrito, criterios de aceptación explícitos y límites fuera de alcance acordados antes de programar.",
    p_s2: "Motor Python 3.11+ tipado, esquema SQLite WAL / Postgres, guardias de seguridad y suite reproducible pytest.",
    p_s3: "Revisión de Senior Tech Lead, badge CI verde en GitHub Actions, imagen Docker y transferencia del 100% de propiedad intelectual.",
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
    if (key === "tr_title") el.innerHTML = dict[key];
    else el.textContent = dict[key];
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => applyLang(btn.dataset.lang));
});

applyLang(currentLang);
