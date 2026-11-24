/**
 * KiberLabs Interactive Browser Engines (Pure ES2023, zero external dependencies).
 * Faithfully mirrors the deterministic Python logic of Repos #1, #2, #4, and #5
 * so prospective B2B clients can test real rules live inside kiberlabs.github.io.
 */

export const SAMPLE_CORPUS = [
  {
    chunk_id: "REG-GDPR-2026::c001",
    doc_id: "REG-GDPR-2026",
    title: "B2B Data Protection & Breach Notification Regulation",
    section_ref: "Article 1: Scope and Definitions",
    text: "This regulation governs automated processing of personal customer records by B2B software processors operating within the European Economic Area.",
    chunk_hash: "db9e4e94ddc6f851",
  },
  {
    chunk_id: "REG-GDPR-2026::c002",
    doc_id: "REG-GDPR-2026",
    title: "B2B Data Protection & Breach Notification Regulation",
    section_ref: "Article 4: Incident Notification Deadline",
    text: "Upon discovering a confirmed personal data breach, the data processor must notify the controller without undue delay and no later than 72 hours after detection, including affected record counts and mitigation steps.",
    chunk_hash: "3d35debad5472617",
  },
  {
    chunk_id: "REG-GDPR-2026::c003",
    doc_id: "REG-GDPR-2026",
    title: "B2B Data Protection & Breach Notification Regulation",
    section_ref: "Article 7: Audit Log Retention",
    text: "Access logs and cryptographic audit hashes must be retained in append-only storage for a minimum of 24 months and purged automatically after 60 months unless subject to active litigation.",
    chunk_hash: "b3b109059d516041",
  },
  {
    chunk_id: "POL-ESCROW-SLA::c002",
    doc_id: "POL-ESCROW-SLA",
    title: "Commercial Fixed-Price Milestone & Escrow Settlement Policy",
    section_ref: "Section 2: Acceptance & QA Verification",
    text: "Every milestone delivery must include automated unit tests and reproducible CLI commands. Clients have 5 business days to verify deliverables against the agreed acceptance criteria before automatic escrow release.",
    chunk_hash: "91c4e8a712b3f04d",
  },
  {
    chunk_id: "NORM-ES-FACTURA::c001",
    doc_id: "NORM-ES-FACTURA",
    title: "Normativa Interna de Retención de Facturas y Contratación B2B",
    section_ref: "Artículo 3: Conservación de Facturas Electrónicas",
    text: "Todas las facturas electrónicas emitidas a clientes corporativos deben conservarse en formato estructurado PDF y XML durante un plazo mínimo de 6 años para inspecciones fiscales.",
    chunk_hash: "f2a908c561e34b72",
  },
];

const STOPWORDS = new Set([
  // EN
  "the", "and", "for", "with", "that", "this", "from", "are", "was", "what", "when", "how",
  "does", "under", "about", "into", "your", "have", "must", "can", "will",
  "to", "in", "of", "on", "at", "by", "an", "is", "as", "be", "or", "if", "it", "no", "so", "we", "do",
  // ES
  "los", "las", "del", "una", "uno", "para", "con", "que", "como", "cual", "cuando", "sobre", "por",
  "son", "esta", "este", "puede", "debe", "entre",
  "de", "en", "el", "la", "es", "un", "al", "lo", "se", "su", "si", "ni", "ya",
]);

/** Fold Unicode diacritics and smart punctuation into lowercase ASCII for bilingual EN/ES matching. */
export function foldAscii(str) {
  return String(str || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u02BC]/g, "'")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .toLowerCase();
}

const MAX_SAFE_AMOUNT = 1e12;

function toNumberOrNaN(val, defaultVal = undefined) {
  if (val === undefined || val === null || val === "") {
    return defaultVal !== undefined ? defaultVal : NaN;
  }
  if (typeof val === "boolean") return NaN;
  return Number(val);
}

function toBool(val) {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const norm = val.trim().toLowerCase();
    if (norm === "false" || norm === "0" || norm === "no" || norm === "off" || norm === "") return false;
    if (norm === "true" || norm === "1" || norm === "yes" || norm === "on") return true;
  }
  return Boolean(val);
}

/** Deterministic 3-stage B2B net-margin sieve mirroring Repo #1 (sieve_monitor). */
export function evaluateMarginSieve(input) {
  const src = input && typeof input === "object" ? input : {};
  const supplier = toNumberOrNaN(src.supplierPrice);
  const resale = toNumberOrNaN(src.resalePrice);
  const shipping = toNumberOrNaN(src.shippingCost, 0);
  const feePctRaw = toNumberOrNaN(src.marketplaceFeePct, 0);
  const reservePctRaw = toNumberOrNaN(src.returnReservePct, 0);
  const deliveryDays = toNumberOrNaN(src.deliveryDays, 0);
  const rating = toNumberOrNaN(src.rating, 0);
  const inStock = toBool(src.inStock);
  const euDispatch = toBool(src.euDispatch);

  if (![supplier, resale, shipping, feePctRaw, reservePctRaw, deliveryDays, rating].every(Number.isFinite)) {
    return { approved: false, stage: "schema_guard", reasons: ["non_finite_numeric_input"], netProfit: 0, netMarginPct: 0, score: 0 };
  }

  const schemaReasons = [];
  if (resale <= 0 || supplier <= 0) schemaReasons.push("prices_must_be_positive");
  if (shipping < 0) schemaReasons.push("shipping_cost<0");
  if (supplier > MAX_SAFE_AMOUNT || resale > MAX_SAFE_AMOUNT || shipping > MAX_SAFE_AMOUNT) {
    schemaReasons.push("amount_overflow");
  }
  if (feePctRaw < 0 || feePctRaw >= 100 || reservePctRaw < 0 || reservePctRaw >= 100) {
    schemaReasons.push("fee_pct_out_of_range");
  }
  if (feePctRaw + reservePctRaw >= 100) {
    schemaReasons.push("combined_fee_and_reserve>=100%");
  }
  if (deliveryDays < 0 || deliveryDays > 365) schemaReasons.push("delivery_days_out_of_range");
  if (rating < 0 || rating > 5) schemaReasons.push("rating_out_of_range");

  if (schemaReasons.length > 0) {
    return { approved: false, stage: "schema_guard", reasons: schemaReasons, netProfit: 0, netMarginPct: 0, score: 0 };
  }

  const feePct = feePctRaw / 100;
  const reservePct = reservePctRaw / 100;

  const fees = resale * (feePct + reservePct);
  const netProfit = Number((resale - (supplier + shipping + fees)).toFixed(2));
  const netMargin = Number((netProfit / resale).toFixed(4));
  const netMarginPct = Number((netMargin * 100).toFixed(1));
  if (!Number.isFinite(netProfit) || !Number.isFinite(netMargin) || !Number.isFinite(netMarginPct)) {
    return { approved: false, stage: "schema_guard", reasons: ["amount_overflow"], netProfit: 0, netMarginPct: 0, score: 0 };
  }

  const hardReasons = [];
  if (!inStock) hardReasons.push("out_of_stock");
  if (!euDispatch) hardReasons.push("non_eu_dispatch");
  if (deliveryDays > 5) hardReasons.push("delivery_days>5");
  if (rating < 4.2) hardReasons.push("rating<4.2");

  if (hardReasons.length > 0) {
    return { approved: false, stage: "stage_1_hard_gate", reasons: hardReasons, netProfit, netMarginPct, score: 0 };
  }

  const econReasons = [];
  if (netProfit < 8.0) econReasons.push("net_profit<8.00 EUR");
  if (netMargin < 0.18) econReasons.push("net_margin<18%");

  if (econReasons.length > 0) {
    return {
      approved: false,
      stage: "stage_2_margin_sieve",
      reasons: econReasons,
      netProfit,
      netMarginPct,
      score: Number(Math.max(0, netMargin * 100).toFixed(1)),
    };
  }

  const marginScore = Math.min(55, netMargin * 140);
  const ratingScore = (rating / 5) * 25;
  const speedScore = Math.max(0, (5 - deliveryDays + 1) * 4);
  const score = Number(Math.min(100, marginScore + ratingScore + speedScore).toFixed(1));

  return {
    approved: true,
    stage: "stage_3_approved",
    reasons: ["passed_all_gates"],
    netProfit,
    netMarginPct,
    score,
  };
}

/** Zero-hallucination RAG citation verifier mirroring Repo #4 (b2b-rag-citation-engine). */
export function runGroundedRagQuery(query, minOverlap = 0.25) {
  const rawTokens = foldAscii(query).match(/[a-z0-9]+/g) || [];
  const tokens = [...new Set(rawTokens.filter((t) => t.length >= 2 && !STOPWORDS.has(t)))];

  if (tokens.length === 0) {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      verified: true,
      tokens: [],
      citations: [],
    };
  }

  const scored = [];
  for (const ch of SAMPLE_CORPUS) {
    const docTokens = new Set(foldAscii(`${ch.title} ${ch.section_ref} ${ch.text}`).match(/[a-z0-9]+/g) || []);
    let hits = 0;
    for (const tok of tokens) {
      if (docTokens.has(tok)) hits += 1;
    }
    const overlap = Number((hits / tokens.length).toFixed(4));
    if (hits > 0 && overlap >= minOverlap) {
      scored.push({ ...ch, overlap });
    }
  }

  scored.sort((a, b) => b.overlap - a.overlap);
  if (scored.length === 0) {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      verified: true,
      tokens,
      citations: [],
    };
  }

  return {
    status: "GROUNDED",
    verified: true,
    tokens,
    citations: scored.slice(0, 3),
  };
}

const SPAM_PATTERNS = ["crypto airdrop", "casino bonus", "forex signal", "buy followers", "gana dinero rapido"];
const HUMAN_PATTERNS = ["agente humano", "hablar con una persona", "human agent", "real person", "talk to a human"];
const COMPLAINT_OPTOUT_PATTERNS = [
  "stop messaging", "stop contacting", "do not contact", "dont contact", "don't contact",
  "unsubscribe", "opt out", "opt-out", "remove my", "delete my data", "erase my data",
  "remove my data", "no me escribas", "no me contactes", "deja de escribir",
  "darme de baja", "darse de baja", "dar de baja", "quita mi anuncio",
  "borra mis datos", "borrar mis datos", "elimina mis datos", "eliminar mis datos",
  "derecho al olvido", "denunciar",
];
const GDPR_OPTOUT_ACTION = "(?:(?:delete|erase|remove|borra\\w*|elimina\\w*|suprim\\w*)\\s+(?:all\\s+|todos\\s+)?(?:my|our|mis|nuestros)\\b|baja|opt[- ]?out|erasure|complaint|reclamacion|denuncia\\w*|report\\s+(?:you|this|it|to)\\b|aepd|ico)";
const GDPR_OPTOUT_RE = new RegExp(
  `\\b(?:(?:gdpr|rgpd)\\b.{0,30}\\b${GDPR_OPTOUT_ACTION}|${GDPR_OPTOUT_ACTION}.{0,30}\\b(?:gdpr|rgpd)\\b|(?:gdpr|rgpd)\\s+(?:removal|deletion)\\b)`
);
// b2b_automation precedes messaging_bot so composite stacks like "FastAPI bot" route to b2b_automation.
const SERVICE_KEYWORDS = {
  web_scraping: [
    "scraping", "scraper", "monitor de precios", "monitorear precios", "seguimiento de precios",
    "extraer precios", "catalogo", "price monitor", "extraer datos",
  ],
  b2b_automation: [
    "automatizacion", "automatizar", "automation", "api", "fastapi", "docker", "rag", "dashboard",
    "panel de control", "panel admin", "panel administrativo", "panel web", "panel b2b", "admin panel",
  ],
  messaging_bot: ["bot", "whatsapp", "telegram", "chatbot"],
  video_pipeline: ["video", "ffmpeg", "subtitle", "subtitles", "subtitulo", "subtitulos", "reels", "shorts"],
};
const ES_HINTS = ["hola", "buenas", "necesito", "quiero", "presupuesto", "precio", "empresa", "para"];
const EN_HINTS = ["hello", "hi", "need", "looking", "budget", "price", "company", "build", "quote"];
const AMT = "(\\d{1,3}(?:[.,]\\d{3})+|\\d{1,6})([.,]\\d{1,2})?(?!\\d|[.,]\\d)";
const BUDGET_RE = new RegExp(
  `(?:[€$]\\s*${AMT}([km])?(?![a-z])|(?<![\\d.,])${AMT}([km])?\\s*(?:€|eur|euros?|usd|\\$)(?![a-z]))`,
  "ig"
);

function compileWordMatcher(phrases) {
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"));
  return new RegExp(`\\b(?:${escaped.join("|")})\\b`);
}

const SPAM_RE = compileWordMatcher(SPAM_PATTERNS);
const HUMAN_RE = compileWordMatcher(HUMAN_PATTERNS);
const OPTOUT_RE = compileWordMatcher(COMPLAINT_OPTOUT_PATTERNS);
const SERVICE_MATCHERS = Object.entries(SERVICE_KEYWORDS).map(([svc, kws]) => [svc, compileWordMatcher(kws)]);

/** Deterministic bilingual lead bot state machine mirroring Repo #2 (omnichannel-lead-bot). */
export function stepLeadBotSession(session, messageText) {
  const msg = String(messageText ?? "");
  const baseSession = session && typeof session === "object" && !Array.isArray(session) ? session : {};
  const next = { lang: "en", state: "new", service_need: null, estimated_budget_eur: null, ...baseSession };
  const norm = foldAscii(msg);
  const words = new Set(norm.match(/[a-z]+/g) || []);

  const esScore = ES_HINTS.filter((w) => words.has(w)).length + (msg.includes("¿") || msg.includes("ñ") || msg.includes("Ñ") ? 2 : 0);
  const enScore = EN_HINTS.filter((w) => words.has(w)).length;
  if (enScore > esScore) next.lang = "en";
  else if (esScore > enScore) next.lang = "es";

  const isSpam = (norm.match(/https?:\/\//g) || []).length >= 3 || SPAM_RE.test(norm);
  const isComplaintOptout = OPTOUT_RE.test(norm) || GDPR_OPTOUT_RE.test(norm);
  const wantsHuman = HUMAN_RE.test(norm);

  let detectedService = null;
  for (const [svc, re] of SERVICE_MATCHERS) {
    if (re.test(norm)) {
      detectedService = svc;
      break;
    }
  }

  let budgetEur = null;
  for (const bMatch of msg.matchAll(BUDGET_RE)) {
    const intPart = (bMatch[1] || bMatch[4] || "").replace(/[.,]/g, "");
    const decPart = (bMatch[2] || bMatch[5] || "").replace(",", ".");
    const suffix = (bMatch[3] || bMatch[6] || "").toLowerCase();
    const mult = suffix === "k" ? 1000 : suffix === "m" ? 1_000_000 : 1;
    const num = Number(`${intPart}${decPart}`) * mult;
    if (Number.isFinite(num) && num >= 50 && num <= 250000) {
      budgetEur = num;
      break;
    }
  }

  if (detectedService) next.service_need = detectedService;
  if (budgetEur !== null) next.estimated_budget_eur = budgetEur;

  let reply = null;
  let intent = "unknown";

  if (next.state === "spam_blocked") {
    intent = "spam";
    reply = null;
  } else if (next.state === "silenced" || isComplaintOptout) {
    next.state = "silenced";
    intent = "complaint_optout";
    reply = null;
  } else if (isSpam) {
    next.state = "spam_blocked";
    intent = "spam";
    reply = null;
  } else if (next.state === "handoff_ready") {
    intent = "already_queued";
    reply = next.lang === "es"
      ? "Tu solicitud ya está en manos de un ingeniero de KiberLabs; te responderemos enseguida."
      : "Your request is already queued with a KiberLabs engineer; we will reply shortly.";
  } else if (wantsHuman) {
    next.state = "handoff_ready";
    intent = "human_escalation";
    reply = next.lang === "es"
      ? "Entendido. Paso tu conversación directamente a un ingeniero de KiberLabs."
      : "Understood — routing your conversation straight to a KiberLabs specialist now.";
  } else if (next.service_need && next.estimated_budget_eur !== null) {
    next.state = "handoff_ready";
    intent = "qualified_lead";
    reply = next.lang === "es"
      ? `¡Recibido! Alcance de ${next.service_need} (~${next.estimated_budget_eur} EUR) en cola. Un ingeniero revisará tu caso en breve.`
      : `All set! Your ${next.service_need} scope (~€${next.estimated_budget_eur}) is queued for a senior engineer.`;
  } else if (!next.service_need) {
    next.state = "awaiting_service";
    intent = "greeting_or_unclear";
    reply = next.lang === "es"
      ? "¡Hola! Soy el asistente técnico de KiberLabs. ¿Qué necesitas automatizar? (Scraping, Bot WhatsApp/Telegram, RAG o API FastAPI)"
      : "Hi! KiberLabs automated intake here. What would you like to automate? (Scraping, WhatsApp/Telegram Bot, RAG, or FastAPI)";
  } else {
    next.state = "awaiting_budget";
    intent = "service_inquiry";
    reply = next.lang === "es"
      ? `Perfecto (${next.service_need}). ¿Qué presupuesto aproximado manejáis (ej. 500€–1.500€)?`
      : `Got it (${next.service_need}). What approximate budget range do you have in mind (e.g., €500–€1,500)?`;
  }

  return { session: next, intent, reply };
}

const _IBAN_LEN = {
  AD: 24, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
  BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20,
  EG: 29, ES: 24, FI: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23, GL: 18,
  GR: 27, GT: 28, HR: 21, HU: 28, IE: 22, IL: 23, IQ: 23, IS: 26, IT: 27,
  JO: 30, KW: 30, KZ: 20, LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21,
  MC: 27, MD: 24, ME: 22, MK: 19, MR: 27, MT: 31, MU: 30, NL: 18, NO: 15,
  PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SE: 24,
  SI: 19, SK: 24, SM: 27, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20,
};

/** Validate an IBAN string using ISO 13616 country lengths and the MOD-97-10 checksum algorithm. */
export function validateIbanMod97(iban) {
  const clean = String(iban || "").replace(/[\s-]+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(clean)) return false;
  const expectedLen = _IBAN_LEN[clean.slice(0, 2)];
  if (expectedLen !== undefined && clean.length !== expectedLen) return false;
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const expanded = code >= 65 && code <= 90 ? String(code - 55) : ch;
    for (const digit of expanded) {
      rem = (rem * 10 + Number(digit)) % 97;
    }
  }
  return rem === 1;
}

/** Deterministic 3-way PO/GRN/Invoice reconciliation mirroring Repo #6 (b2b-invoice-reconciliation-engine). */
export function evaluateInvoice3Way(input) {
  const src = input && typeof input === "object" ? input : {};
  const poTotal = toNumberOrNaN(src.poTotal);
  const grnTotal = toNumberOrNaN(src.grnTotal);
  const invoiceTotal = toNumberOrNaN(src.invoiceTotal);
  const iban = String(src.iban || "").trim();
  const approvedVendor = toBool(src.approvedVendor);
  const duplicateInvoice = toBool(src.duplicateInvoice);

  const ibanValid = validateIbanMod97(iban);
  if (![poTotal, grnTotal, invoiceTotal].every(Number.isFinite)) {
    return {
      verdict: "BLOCKED",
      risk_score: 100,
      iban_valid: ibanValid,
      po_variance_pct: 100,
      grn_variance_pct: 100,
      triggers: ["invalid_non_finite_amounts"],
    };
  }
  if (poTotal <= 0 || grnTotal <= 0 || invoiceTotal <= 0) {
    return {
      verdict: "BLOCKED",
      risk_score: 100,
      iban_valid: ibanValid,
      po_variance_pct: 100,
      grn_variance_pct: 100,
      triggers: ["invalid_non_positive_amounts"],
    };
  }
  if (poTotal > MAX_SAFE_AMOUNT || grnTotal > MAX_SAFE_AMOUNT || invoiceTotal > MAX_SAFE_AMOUNT) {
    return {
      verdict: "BLOCKED",
      risk_score: 100,
      iban_valid: ibanValid,
      po_variance_pct: 100,
      grn_variance_pct: 100,
      triggers: ["amount_exceeds_safe_limit"],
    };
  }

  const poVariancePct = Number((((invoiceTotal - poTotal) / poTotal) * 100).toFixed(2));
  const grnVariancePct = Number((((invoiceTotal - grnTotal) / grnTotal) * 100).toFixed(2));
  const grnPoVariancePct = Number((((grnTotal - poTotal) / poTotal) * 100).toFixed(2));
  if (![poVariancePct, grnVariancePct, grnPoVariancePct].every(Number.isFinite)) {
    return {
      verdict: "BLOCKED",
      risk_score: 100,
      iban_valid: ibanValid,
      po_variance_pct: 100,
      grn_variance_pct: 100,
      triggers: ["amount_exceeds_safe_limit"],
    };
  }
  const triggers = [];
  let risk = 0;
  let critical = false;

  if (duplicateInvoice) {
    risk += 60;
    critical = true;
    triggers.push("duplicate_invoice_detected");
  }
  if (!ibanValid) {
    risk += 50;
    critical = true;
    triggers.push("invalid_iban_mod97");
  }
  if (!approvedVendor) {
    risk += 45;
    critical = true;
    triggers.push("unapproved_vendor");
  }
  const poDiffRatio = Math.abs(invoiceTotal - poTotal) / poTotal;
  if (poDiffRatio > 0.10 + 1e-12) {
    risk += 40;
    triggers.push(`po_variance_critical(${poVariancePct}%)`);
  } else if (poDiffRatio > 0.03 + 1e-12) {
    risk += 25;
    triggers.push(`po_price_variance>3%(${poVariancePct}%)`);
  }
  const grnDiffRatio = (invoiceTotal - grnTotal) / grnTotal;
  if (grnDiffRatio > 0.005 + 1e-12) {
    risk += 30;
    triggers.push(`billed_exceeds_grn(${grnVariancePct}%)`);
  } else if (grnDiffRatio < -0.005 - 1e-12) {
    risk += 20;
    triggers.push(`billed_below_grn(${grnVariancePct}%)`);
  }
  const grnPoDiffRatio = Math.abs(grnTotal - poTotal) / poTotal;
  if (grnPoDiffRatio > 0.03 + 1e-12) {
    risk += 15;
    triggers.push(`grn_po_variance(${grnPoVariancePct}%)`);
  }

  const BLOCK_SCORE = 70;
  const riskScore = Math.min(100, risk);
  const verdict = critical || riskScore >= BLOCK_SCORE ? "BLOCKED" : triggers.length > 0 ? "REVIEW" : "PASS";
  return {
    verdict,
    risk_score: riskScore,
    iban_valid: ibanValid,
    po_variance_pct: poVariancePct,
    grn_variance_pct: grnVariancePct,
    triggers: triggers.length > 0 ? triggers : ["3way_match_verified"],
  };
}

export const USD_TO_EUR = 0.90;

export function normalizeCurrency(currency) {
  return String(currency || "").toUpperCase() === "EUR" ? "EUR" : "USD";
}

export function convertUsdToCurrency(usd, currency = "USD") {
  const n = Number(usd);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return normalizeCurrency(currency) === "EUR" ? Math.round(n * USD_TO_EUR) : Math.round(n);
}

/** Fixed-price milestone estimator for B2B clients. */
export function estimateFixedPriceScope(input = {}) {
  const src = input && typeof input === "object" ? input : {};
  const { track, complexity, includeDocker, includeCi, lang = "en", currency = "USD" } = src;
  const activeCurrency = normalizeCurrency(currency);
  const baseMap = {
    sieve: { label: "Web Scraping & Price Intelligence Sieve", labelEs: "Scraping Web e Inteligencia de Precios", usd: 450, days: 3 },
    bot: { label: "24/7 Omnichannel Lead Qualification Bot", labelEs: "Bot Omnicanal 24/7 de Cualificación de Leads", usd: 550, days: 4 },
    video: { label: "Automated 9:16 FFmpeg & ASS Video Pipeline", labelEs: "Pipeline Automatizado 9:16 FFmpeg y Subtítulos .ASS", usd: 600, days: 4 },
    rag: { label: "Zero-Hallucination B2B RAG & Citation Engine", labelEs: "Motor RAG B2B Sin Alucinaciones con Citas", usd: 500, days: 4 },
    api: { label: "Production FastAPI + Auth + Rate-Limit Gateway", labelEs: "Gateway FastAPI en Producción + Auth + Rate-Limit", usd: 700, days: 5 },
    invoice: { label: "B2B 3-Way Invoice Reconciliation & Hash Ledger", labelEs: "Conciliación de Facturas 3-Vías y Ledger Hash", usd: 750, days: 5 },
  };
  const multMap = { mvp: 1.0, production: 1.45, enterprise: 2.0 };
  const base = Object.hasOwn(baseMap, track) ? baseMap[track] : baseMap.api;
  const mult = Object.hasOwn(multMap, complexity) ? multMap[complexity] : 1.0;

  const baseUsd = Math.round((base.usd * mult) / 50) * 50;
  const dockerUsd = includeDocker ? 150 : 0;
  const ciUsd = includeCi ? 100 : 0;
  const totalUsd = baseUsd + dockerUsd + ciUsd;
  let days = Math.ceil(base.days * (complexity === "enterprise" ? 1.5 : complexity === "production" ? 1.25 : 1.0));
  if (includeDocker) {
    days += 1;
  }

  const m1 = Math.round((totalUsd * 0.4) / 10) * 10;
  const m2 = totalUsd - m1;

  const dockerAddon = convertUsdToCurrency(150, activeCurrency);
  const ciAddon = convertUsdToCurrency(100, activeCurrency);
  const baseAmount = convertUsdToCurrency(baseUsd, activeCurrency);
  const total = activeCurrency === "EUR"
    ? baseAmount + (includeDocker ? dockerAddon : 0) + (includeCi ? ciAddon : 0)
    : totalUsd;
  const m1Amount = activeCurrency === "EUR" ? Math.round((total * 0.4) / 5) * 5 : m1;
  const m2Amount = total - m1Amount;

  const isEs = lang === "es";
  return {
    trackLabel: isEs ? base.labelEs : base.label,
    currency: activeCurrency,
    totalUsd,
    total,
    dockerAddon,
    ciAddon,
    days,
    milestones: [
      { name: isEs ? "Hito 1 — Motor Core + Esquema y Tests Unitarios" : "Milestone 1 — Core Engine + Schema & Unit Tests", usd: m1, amount: m1Amount },
      { name: isEs ? "Hito 2 — Integración, Documentación y Verificación Final" : "Milestone 2 — Integration, Docs & Final Verification", usd: m2, amount: m2Amount },
    ],
  };
}

const VALID_TRACKS = new Set(["api", "sieve", "bot", "rag", "invoice", "video"]);
const VALID_TIERS = new Set(["mvp", "production", "enterprise"]);

/** Parse and validate Estimator -> SOW URL query parameters with safe defaults matching index.html. */
export function parseSowQueryParams(search = "") {
  const params = new URLSearchParams(search);
  const rawTrack = params.get("track");
  const rawLang = params.get("lang");
  const rawTier = params.get("tier");
  const parseBool = (key, fallback) => {
    if (!params.has(key)) return fallback;
    const v = String(params.get(key)).toLowerCase();
    return v === "1" || v === "true";
  };
  return {
    track: VALID_TRACKS.has(rawTrack) ? rawTrack : "api",
    lang: rawLang === "es" || rawLang === "en" ? rawLang : null,
    tier: VALID_TIERS.has(rawTier) ? rawTier : "production",
    includeDocker: parseBool("docker", true),
    includeCi: parseBool("ci", true),
    currency: normalizeCurrency(params.get("currency")),
  };
}
