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
  "the", "and", "for", "with", "that", "this", "from", "are", "was", "what", "when", "how",
  "does", "under", "about", "into", "your", "have", "must", "can", "will", "los", "las",
  "del", "una", "uno", "para", "con", "que", "como", "cual", "cuando", "sobre", "por",
  "son", "esta", "este", "puede", "debe", "entre",
]);

/** Fold Unicode diacritics into lowercase ASCII for bilingual EN/ES matching. */
export function foldAscii(str) {
  return String(str || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Deterministic 3-stage B2B net-margin sieve mirroring Repo #1 (sieve_monitor). */
export function evaluateMarginSieve(input) {
  const supplier = Number(input.supplierPrice) || 0;
  const resale = Number(input.resalePrice) || 0;
  const shipping = Number(input.shippingCost) || 0;
  const feePct = (Number(input.marketplaceFeePct) || 0) / 100;
  const reservePct = (Number(input.returnReservePct) || 0) / 100;
  const deliveryDays = Number(input.deliveryDays) || 0;
  const rating = Number(input.rating) || 0;
  const inStock = Boolean(input.inStock);
  const euDispatch = Boolean(input.euDispatch);

  if (resale <= 0 || supplier <= 0) {
    return { approved: false, stage: "schema_guard", reasons: ["prices_must_be_positive"], netProfit: 0, netMarginPct: 0, score: 0 };
  }

  const fees = resale * (feePct + reservePct);
  const netProfit = Number((resale - (supplier + shipping + fees)).toFixed(2));
  const netMargin = Number((netProfit / resale).toFixed(4));

  const hardReasons = [];
  if (!inStock) hardReasons.push("out_of_stock");
  if (!euDispatch) hardReasons.push("non_eu_dispatch");
  if (deliveryDays > 5) hardReasons.push("delivery_days>5");
  if (rating < 4.2) hardReasons.push("rating<4.2");

  if (hardReasons.length > 0) {
    return { approved: false, stage: "stage_1_hard_gate", reasons: hardReasons, netProfit, netMarginPct: Number((netMargin * 100).toFixed(1)), score: 0 };
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
      netMarginPct: Number((netMargin * 100).toFixed(1)),
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
    netMarginPct: Number((netMargin * 100).toFixed(1)),
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
    if (overlap >= minOverlap) {
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
const SERVICE_KEYWORDS = {
  web_scraping: ["scraping", "scraper", "precios", "catalogo", "price monitor", "datos"],
  messaging_bot: ["bot", "whatsapp", "telegram", "chatbot"],
  b2b_automation: ["automatizacion", "automatizar", "automation", "api", "fastapi", "docker", "rag", "dashboard"],
  video_pipeline: ["video", "ffmpeg", "subtitles", "subtitulos", "reels", "shorts"],
};
const ES_HINTS = ["hola", "buenas", "necesito", "quiero", "presupuesto", "precio", "empresa", "para"];
const EN_HINTS = ["hello", "hi", "need", "looking", "budget", "price", "company", "build", "quote"];
const BUDGET_RE = /(?:[€$]\s*(\d{1,3}(?:[.,]\d{3})+|\d{2,6})|(\d{1,3}(?:[.,]\d{3})+|\d{2,6})\s*(?:€|eur|euros?|usd|\$))/i;

/** Deterministic bilingual lead bot state machine mirroring Repo #2 (omnichannel-lead-bot). */
export function stepLeadBotSession(session, messageText) {
  const next = { ...session };
  const norm = foldAscii(messageText);
  const words = new Set(norm.match(/[a-z]+/g) || []);

  const esScore = ES_HINTS.filter((w) => words.has(w)).length + (messageText.includes("¿") || messageText.includes("ñ") ? 2 : 0);
  const enScore = EN_HINTS.filter((w) => words.has(w)).length;
  if (enScore > esScore) next.lang = "en";
  else if (esScore > enScore) next.lang = "es";

  const isSpam = (norm.match(/https?:\/\//g) || []).length >= 3 || SPAM_PATTERNS.some((p) => norm.includes(p));
  const wantsHuman = HUMAN_PATTERNS.some((p) => norm.includes(p));

  let detectedService = null;
  for (const [svc, kws] of Object.entries(SERVICE_KEYWORDS)) {
    if (kws.some((kw) => norm.includes(kw))) {
      detectedService = svc;
      break;
    }
  }

  let budgetEur = null;
  const bMatch = messageText.match(BUDGET_RE);
  if (bMatch) {
    const num = Number((bMatch[1] || bMatch[2] || "").replace(/[.,]/g, ""));
    if (num >= 50 && num <= 250000) budgetEur = num;
  }

  if (detectedService) next.service_need = detectedService;
  if (budgetEur !== null) next.estimated_budget_eur = budgetEur;

  let reply = null;
  let intent = "unknown";

  if (next.state === "spam_blocked" || isSpam) {
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

/** Validate an IBAN string using the ISO 13616 MOD-97-10 checksum algorithm. */
export function validateIbanMod97(iban) {
  const clean = String(iban || "").replace(/[\s-]+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(clean)) return false;
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
  const poTotal = Number(input.poTotal) || 0;
  const grnTotal = Number(input.grnTotal) || 0;
  const invoiceTotal = Number(input.invoiceTotal) || 0;
  const iban = String(input.iban || "").trim();
  const approvedVendor = Boolean(input.approvedVendor);
  const duplicateInvoice = Boolean(input.duplicateInvoice);

  const ibanValid = validateIbanMod97(iban);
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

  const poVariancePct = Number((((invoiceTotal - poTotal) / poTotal) * 100).toFixed(2));
  const grnVariancePct = Number((((invoiceTotal - grnTotal) / grnTotal) * 100).toFixed(2));
  const triggers = [];
  let risk = 0;

  if (duplicateInvoice) {
    risk += 65;
    triggers.push("duplicate_invoice_detected");
  }
  if (!ibanValid) {
    risk += 60;
    triggers.push("invalid_iban_mod97");
  }
  if (!approvedVendor) {
    risk += 30;
    triggers.push("unapproved_vendor");
  }
  if (Math.abs(poVariancePct) > 10) {
    risk += 40;
    triggers.push(`po_variance_critical(${poVariancePct}%)`);
  } else if (Math.abs(poVariancePct) > 3) {
    risk += 25;
    triggers.push(`po_price_variance>3%(${poVariancePct}%)`);
  }
  if (invoiceTotal > grnTotal * 1.005) {
    risk += 30;
    triggers.push(`billed_exceeds_grn(${grnVariancePct}%)`);
  }

  const riskScore = Math.min(100, risk);
  const verdict = riskScore >= 60 ? "BLOCKED" : riskScore >= 20 ? "REVIEW" : "PASS";
  return {
    verdict,
    risk_score: riskScore,
    iban_valid: ibanValid,
    po_variance_pct: poVariancePct,
    grn_variance_pct: grnVariancePct,
    triggers: triggers.length > 0 ? triggers : ["3way_match_verified"],
  };
}

/** Fixed-price milestone estimator for B2B clients. */
export function estimateFixedPriceScope({ track, complexity, includeDocker, includeCi }) {
  const baseMap = {
    sieve: { label: "Web Scraping & Price Intelligence Sieve", usd: 450, days: 3 },
    bot: { label: "24/7 Omnichannel Lead Qualification Bot", usd: 550, days: 4 },
    video: { label: "Automated 9:16 FFmpeg & ASS Video Pipeline", usd: 600, days: 4 },
    rag: { label: "Zero-Hallucination B2B RAG & Citation Engine", usd: 500, days: 4 },
    api: { label: "Production FastAPI + Auth + Rate-Limit Gateway", usd: 700, days: 5 },
    invoice: { label: "B2B 3-Way Invoice Reconciliation & Hash Ledger", usd: 750, days: 5 },
  };
  const multMap = { mvp: 1.0, production: 1.45, enterprise: 2.0 };
  const base = baseMap[track] || baseMap.api;
  const mult = multMap[complexity] || 1.0;

  let totalUsd = Math.round((base.usd * mult) / 50) * 50;
  let days = Math.ceil(base.days * (complexity === "enterprise" ? 1.5 : complexity === "production" ? 1.25 : 1.0));
  if (includeDocker) {
    totalUsd += 150;
    days += 1;
  }
  if (includeCi) {
    totalUsd += 100;
  }

  const m1 = Math.round((totalUsd * 0.4) / 10) * 10;
  const m2 = totalUsd - m1;
  return {
    trackLabel: base.label,
    totalUsd,
    days,
    milestones: [
      { name: "Milestone 1 — Core Engine + Schema & Unit Tests", usd: m1 },
      { name: "Milestone 2 — Integration, Docs & Final Verification", usd: m2 },
    ],
  };
}
