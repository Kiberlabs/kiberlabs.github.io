import assert from "node:assert/strict";
import {
  SAMPLE_CORPUS,
  USD_TO_EUR,
  convertUsdToCurrency,
  estimateFixedPriceScope,
  evaluateInvoice3Way,
  evaluateMarginSieve,
  parseSowQueryParams,
  runGroundedRagQuery,
  stepLeadBotSession,
  validateIbanMod97,
} from "../engines.js";
import {
  I18N as SOW_I18N,
  PRESETS as SOW_PRESETS,
  applyPresetAndLangState,
  buildMarkdownSowFromState,
  clampAmount,
  escapeHtml,
  formatMoney,
  getAddonLabels,
  getGovItems,
  mdCodeSpan,
  mdEscape,
} from "../sow.js";

// 1. Margin sieve approves healthy EU SKU and blocks low-margin / non-EU
const okSku = evaluateMarginSieve({
  supplierPrice: 85,
  resalePrice: 159,
  shippingCost: 6,
  marketplaceFeePct: 12,
  returnReservePct: 4,
  deliveryDays: 2,
  rating: 4.8,
  inStock: true,
  euDispatch: true,
});
assert.equal(okSku.approved, true);
assert.ok(okSku.score > 70);

const badSku = evaluateMarginSieve({
  supplierPrice: 120,
  resalePrice: 140,
  shippingCost: 10,
  marketplaceFeePct: 12,
  returnReservePct: 4,
  deliveryDays: 2,
  rating: 4.8,
  inStock: true,
  euDispatch: true,
});
assert.equal(badSku.approved, false);

// 2. RAG verifies grounded EN/ES queries and abstains on off-topic
const ragEn = runGroundedRagQuery("What is the deadline for data breach notification?");
assert.equal(ragEn.status, "GROUNDED");
assert.equal(ragEn.citations[0].doc_id, "REG-GDPR-2026");

const ragEs = runGroundedRagQuery("conservacion de facturas electronicas");
assert.equal(ragEs.status, "GROUNDED");
assert.equal(ragEs.citations[0].doc_id, "NORM-ES-FACTURA");

const ragOff = runGroundedRagQuery("sourdough pizza baking temperature");
assert.equal(ragOff.status, "INSUFFICIENT_EVIDENCE");
assert.equal(ragOff.citations.length, 0);

// 3. Lead Bot qualifies 1-turn EN lead and blocks spam silently
const turn1 = stepLeadBotSession(
  { lang: "es", state: "new", service_need: null, estimated_budget_eur: null },
  "Hi we need a Python scraper with $900 budget"
);
assert.equal(turn1.session.state, "handoff_ready");
assert.equal(turn1.session.estimated_budget_eur, 900);

const spamTurn = stepLeadBotSession(
  { lang: "es", state: "new", service_need: null, estimated_budget_eur: null },
  "Free crypto airdrop bonus now!"
);
assert.equal(spamTurn.session.state, "spam_blocked");
assert.equal(spamTurn.reply, null);

// 4. Invoice 3-way reconciliation & IBAN MOD-97 checksum
assert.equal(validateIbanMod97("ES91 2100 0418 4502 0005 1332"), true);
assert.equal(validateIbanMod97("ES00 2100 0418 4502 0005 1332"), false);

const invPass = evaluateInvoice3Way({
  poTotal: 1250,
  grnTotal: 1250,
  invoiceTotal: 1250,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invPass.verdict, "PASS");
assert.equal(invPass.risk_score, 0);
assert.equal(invPass.iban_valid, true);

const invReview = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 1050,
  invoiceTotal: 1050,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invReview.verdict, "REVIEW");
assert.ok(invReview.risk_score >= 20 && invReview.risk_score < 60);

const invBadIban = evaluateInvoice3Way({
  poTotal: 1250,
  grnTotal: 1250,
  invoiceTotal: 1250,
  iban: "ES0021000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invBadIban.verdict, "BLOCKED");
assert.equal(invBadIban.iban_valid, false);

const invDup = evaluateInvoice3Way({
  poTotal: 1250,
  grnTotal: 1250,
  invoiceTotal: 1250,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: true,
});
assert.equal(invDup.verdict, "BLOCKED");

// 5. Scope estimator sums milestones cleanly (including invoice track)
const est = estimateFixedPriceScope({
  track: "api",
  complexity: "production",
  includeDocker: true,
  includeCi: true,
});
assert.equal(est.milestones[0].usd + est.milestones[1].usd, est.totalUsd);
const estInv = estimateFixedPriceScope({
  track: "invoice",
  complexity: "mvp",
  includeDocker: false,
  includeCi: true,
});
assert.equal(estInv.milestones[0].usd + estInv.milestones[1].usd, estInv.totalUsd);
assert.match(estInv.trackLabel, /Invoice/i);

// 6. Margin sieve rejects Infinity, NaN, and out-of-range domain inputs
for (const badInput of [
  { supplierPrice: 10, resalePrice: Infinity, shippingCost: 5, marketplaceFeePct: 12, returnReservePct: 4, deliveryDays: 2, rating: 4.8, inStock: true, euDispatch: true },
  { supplierPrice: NaN, resalePrice: 100, shippingCost: 5, marketplaceFeePct: 12, returnReservePct: 4, deliveryDays: 2, rating: 4.8, inStock: true, euDispatch: true },
  { supplierPrice: 10, resalePrice: 100, shippingCost: -20, marketplaceFeePct: 12, returnReservePct: 4, deliveryDays: 2, rating: 4.8, inStock: true, euDispatch: true },
  { supplierPrice: 10, resalePrice: 100, shippingCost: 5, marketplaceFeePct: -5, returnReservePct: 4, deliveryDays: 2, rating: 4.8, inStock: true, euDispatch: true },
  { supplierPrice: 10, resalePrice: 100, shippingCost: 5, marketplaceFeePct: 100, returnReservePct: 4, deliveryDays: 2, rating: 4.8, inStock: true, euDispatch: true },
  { supplierPrice: 10, resalePrice: 100, shippingCost: 5, marketplaceFeePct: 12, returnReservePct: 4, deliveryDays: -1, rating: 4.8, inStock: true, euDispatch: true },
  { supplierPrice: 10, resalePrice: 100, shippingCost: 5, marketplaceFeePct: 12, returnReservePct: 4, deliveryDays: 400, rating: 4.8, inStock: true, euDispatch: true },
  { supplierPrice: 10, resalePrice: 100, shippingCost: 5, marketplaceFeePct: 12, returnReservePct: 4, deliveryDays: 2, rating: 6, inStock: true, euDispatch: true },
]) {
  const res = evaluateMarginSieve(badInput);
  assert.equal(res.approved, false);
  assert.equal(res.stage, "schema_guard");
  assert.equal(Number.isFinite(res.score), true);
  assert.equal(res.score, 0);
}

// 7. Lead Bot decimal budgets, word boundaries, service precedence & GDPR opt-out
const decEn = stepLeadBotSession(
  { lang: "en", state: "new", service_need: null, estimated_budget_eur: null },
  "We need a FastAPI bot budget 1250.50 EUR"
);
assert.equal(decEn.session.estimated_budget_eur, 1250.5);
assert.equal(decEn.session.service_need, "b2b_automation");
assert.equal(decEn.session.state, "handoff_ready");

const decEs = stepLeadBotSession(
  { lang: "es", state: "new", service_need: null, estimated_budget_eur: null },
  "Necesito un bot presupuesto 1.200,50 EUR"
);
assert.equal(decEs.session.estimated_budget_eur, 1200.5);
assert.equal(decEs.session.service_need, "messaging_bot");

const decUs = stepLeadBotSession(
  { lang: "en", state: "new", service_need: null, estimated_budget_eur: null },
  "Scraper project budget $1,250.50"
);
assert.equal(decUs.session.estimated_budget_eur, 1250.5);

const eurShort = stepLeadBotSession(
  { lang: "en", state: "new", service_need: null, estimated_budget_eur: null },
  "Need a chatbot €500"
);
assert.equal(eurShort.session.estimated_budget_eur, 500);

const overMax = stepLeadBotSession(
  { lang: "en", state: "new", service_need: null, estimated_budget_eur: null },
  "Automation budget $1000000"
);
assert.equal(overMax.session.estimated_budget_eur, null);

const noSubstringHit = stepLeadBotSession(
  { lang: "en", state: "new", service_need: null, estimated_budget_eur: null },
  "We build rapid capital storage fragment robot arms"
);
assert.equal(noSubstringHit.session.service_need, null);
assert.equal(noSubstringHit.session.state, "awaiting_service");

const optOut = stepLeadBotSession(decEn.session, "Quiero darme de baja por RGPD");
assert.equal(optOut.session.state, "silenced");
assert.equal(optOut.intent, "complaint_optout");
assert.equal(optOut.reply, null);

const afterOptOut = stepLeadBotSession(optOut.session, "Hola?");
assert.equal(afterOptOut.session.state, "silenced");
assert.equal(afterOptOut.reply, null);

const optOutEn = stepLeadBotSession(
  { lang: "en", state: "new", service_need: null, estimated_budget_eur: null },
  "Please unsubscribe and stop messaging GDPR"
);
assert.equal(optOutEn.session.state, "silenced");
assert.equal(optOutEn.reply, null);

// 8. Invoice 3-way Infinity rejection, unapproved vendor BLOCKED, GRN variance & BLOCK_SCORE=70
const invInf = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 1000,
  invoiceTotal: Infinity,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invInf.verdict, "BLOCKED");
assert.equal(invInf.risk_score, 100);
assert.equal(Number.isFinite(invInf.po_variance_pct), true);

const invUnapproved = evaluateInvoice3Way({
  poTotal: 1250,
  grnTotal: 1250,
  invoiceTotal: 1250,
  iban: "ES9121000418450200051332",
  approvedVendor: false,
  duplicateInvoice: false,
});
assert.equal(invUnapproved.verdict, "BLOCKED");
assert.ok(invUnapproved.triggers.includes("unapproved_vendor"));

const invUnderGrn = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 1000,
  invoiceTotal: 500,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invUnderGrn.verdict, "REVIEW");
assert.ok(invUnderGrn.triggers.some((t) => t.startsWith("billed_below_grn")));

const invGrnMismatch = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 2000,
  invoiceTotal: 1000,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invGrnMismatch.verdict, "REVIEW");
assert.ok(invGrnMismatch.risk_score >= 20);

const invOverBoth = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 1000,
  invoiceTotal: 1500,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invOverBoth.verdict, "BLOCKED");
assert.ok(invOverBoth.risk_score >= 70);

// 9. Estimator -> SOW query bridge parity across all 6 tracks & combinations + ES i18n
const parsedBridge = parseSowQueryParams("?track=video&lang=es&tier=enterprise&docker=0&ci=1");
assert.deepEqual(parsedBridge, {
  track: "video",
  lang: "es",
  tier: "enterprise",
  includeDocker: false,
  includeCi: true,
  currency: "USD",
});
const defaultBridge = parseSowQueryParams("?track=unknown&tier=invalid");
assert.deepEqual(defaultBridge, {
  track: "api",
  lang: null,
  tier: "production",
  includeDocker: true,
  includeCi: true,
  currency: "USD",
});
const eurBridge = parseSowQueryParams("?track=rag&lang=en&tier=mvp&docker=0&ci=0&currency=EUR");
assert.deepEqual(eurBridge, {
  track: "rag",
  lang: "en",
  tier: "mvp",
  includeDocker: false,
  includeCi: false,
  currency: "EUR",
});
for (const track of ["api", "sieve", "bot", "rag", "invoice", "video"]) {
  for (const complexity of ["mvp", "production", "enterprise"]) {
    for (const includeDocker of [false, true]) {
      for (const includeCi of [false, true]) {
        const s = estimateFixedPriceScope({ track, complexity, includeDocker, includeCi });
        assert.ok(s.totalUsd > 0 && s.days >= 3);
        assert.equal(s.milestones[0].usd + s.milestones[1].usd, s.totalUsd);
      }
    }
  }
}
const estEs = estimateFixedPriceScope({ track: "invoice", complexity: "mvp", includeDocker: false, includeCi: true, lang: "es" });
assert.match(estEs.trackLabel, /Conciliaci/i);
assert.match(estEs.milestones[0].name, /^Hito 1/);

// 10. Iteration 2 Remediation Regressions (BUDGET_RE lookbehind, opt-out, singular subtitle, fee+reserve>=100, +0.5% float symmetry, null scope arg)
for (const badBudgetMsg of [
  "Need automation budget 1234567 EUR",
  "Need automation budget 99000500 EUR",
  "Need a scraper 1200000 EUR",
  "Need a scraper 1050000€",
  "Need a scraper budget 100.5000 EUR",
]) {
  const bRes = stepLeadBotSession({ lang: "en", state: "new", service_need: null, estimated_budget_eur: null }, badBudgetMsg);
  assert.equal(bRes.session.estimated_budget_eur, null, `Expected null budget for: ${badBudgetMsg}`);
  assert.notEqual(bRes.session.state, "handoff_ready", `Must not qualify over-cap/malformed budget: ${badBudgetMsg}`);
}

for (const optMsg of ["Don't contact me", "I want to opt-out"]) {
  const oRes = stepLeadBotSession({ lang: "en", state: "new", service_need: null, estimated_budget_eur: null }, optMsg);
  assert.equal(oRes.session.state, "silenced", `Expected silenced for: ${optMsg}`);
  assert.equal(oRes.intent, "complaint_optout");
  assert.equal(oRes.reply, null);
}

const subEn = stepLeadBotSession({ lang: "en", state: "new", service_need: null, estimated_budget_eur: null }, "Need subtitle");
assert.equal(subEn.session.service_need, "video_pipeline");
const subEs = stepLeadBotSession({ lang: "es", state: "new", service_need: null, estimated_budget_eur: null }, "Necesito subtitulo");
assert.equal(subEs.session.service_need, "video_pipeline");

for (const [fee, resPct] of [[60, 60], [50, 50]]) {
  const sieveCombined = evaluateMarginSieve({
    supplierPrice: 10,
    resalePrice: 100,
    shippingCost: 5,
    marketplaceFeePct: fee,
    returnReservePct: resPct,
    deliveryDays: 2,
    rating: 4.8,
    inStock: true,
    euDispatch: true,
  });
  assert.equal(sieveCombined.approved, false);
  assert.equal(sieveCombined.stage, "schema_guard");
  assert.ok(sieveCombined.reasons.includes("combined_fee_and_reserve>=100%"));
}

const invExactPlusHalf = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 1000,
  invoiceTotal: 1005,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invExactPlusHalf.verdict, "PASS");

const invExactMinusHalf = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 1000,
  invoiceTotal: 995,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invExactMinusHalf.verdict, "PASS");

for (const overInv of [1005.01, 1006]) {
  const invOverHalf = evaluateInvoice3Way({
    poTotal: 1000,
    grnTotal: 1000,
    invoiceTotal: overInv,
    iban: "ES9121000418450200051332",
    approvedVendor: true,
    duplicateInvoice: false,
  });
  assert.equal(invOverHalf.verdict, "REVIEW", `Expected REVIEW for invoiceTotal=${overInv}`);
}

const scopeUndefined = estimateFixedPriceScope();
const scopeNull = estimateFixedPriceScope(null);
assert.equal(scopeUndefined.totalUsd, 700);
assert.equal(scopeUndefined.days, 5);
assert.equal(scopeNull.totalUsd, 700);
assert.equal(scopeNull.days, 5);

// 11. Iteration 3 Micro-Remediation Regressions (smart punctuation GDPR opt-out, unrounded 3%/10% variance, 1e308 overflow guard, non-object session guard)
for (const smartOptMsg of [
  "Don\u2019t contact me",
  "Don\u2018t contact me",
  "I want to opt\u2011out",
  "Please opt\u2013out now",
]) {
  const smartOptRes = stepLeadBotSession(null, smartOptMsg);
  assert.equal(smartOptRes.session.state, "silenced", `Expected silenced for: ${smartOptMsg}`);
  assert.equal(smartOptRes.intent, "complaint_optout");
  assert.equal(smartOptRes.reply, null);
}

const invOver3Unrounded = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 1030.04,
  invoiceTotal: 1030.04,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invOver3Unrounded.verdict, "REVIEW");
assert.ok(invOver3Unrounded.triggers.some((t) => t.startsWith("po_price_variance>3%")));
assert.ok(invOver3Unrounded.triggers.some((t) => t.startsWith("grn_po_variance")));

const invOver10Unrounded = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 1000,
  invoiceTotal: 1100.04,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invOver10Unrounded.verdict, "BLOCKED");
assert.ok(invOver10Unrounded.triggers.some((t) => t.startsWith("po_variance_critical")));

const invExact3 = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 1030,
  invoiceTotal: 1030,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invExact3.verdict, "PASS");

const invExact10 = evaluateInvoice3Way({
  poTotal: 1000,
  grnTotal: 1000,
  invoiceTotal: 1100,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invExact10.verdict, "REVIEW");
assert.equal(invExact10.risk_score, 55);

const sieveOverflow = evaluateMarginSieve({
  supplierPrice: 1.5e308,
  resalePrice: 1.5e308,
  shippingCost: 0,
  marketplaceFeePct: 50,
  returnReservePct: 0,
  deliveryDays: 2,
  rating: 4.8,
  inStock: true,
  euDispatch: true,
});
assert.equal(sieveOverflow.approved, false);
assert.equal(sieveOverflow.stage, "schema_guard");
assert.ok(sieveOverflow.reasons.includes("amount_overflow"));
assert.equal(Number.isFinite(sieveOverflow.netProfit), true);
assert.equal(Number.isFinite(sieveOverflow.netMarginPct), true);
assert.equal(Number.isFinite(sieveOverflow.score), true);

const sieveTinyDivOverflow = evaluateMarginSieve({
  supplierPrice: 1e12,
  resalePrice: 1e-308,
  shippingCost: 0,
  marketplaceFeePct: 10,
  returnReservePct: 0,
  deliveryDays: 2,
  rating: 4.8,
  inStock: true,
  euDispatch: true,
});
assert.equal(sieveTinyDivOverflow.approved, false);
assert.equal(sieveTinyDivOverflow.stage, "schema_guard");
assert.ok(sieveTinyDivOverflow.reasons.includes("amount_overflow"));
assert.equal(Number.isFinite(sieveTinyDivOverflow.netProfit), true);
assert.equal(Number.isFinite(sieveTinyDivOverflow.netMarginPct), true);

const invOverflow = evaluateInvoice3Way({
  poTotal: 1,
  grnTotal: 1,
  invoiceTotal: 1e308,
  iban: "ES9121000418450200051332",
  approvedVendor: true,
  duplicateInvoice: false,
});
assert.equal(invOverflow.verdict, "BLOCKED");
assert.equal(invOverflow.risk_score, 100);
assert.ok(invOverflow.triggers.includes("amount_exceeds_safe_limit"));
assert.equal(Number.isFinite(invOverflow.po_variance_pct), true);
assert.equal(Number.isFinite(invOverflow.grn_variance_pct), true);

for (const badSession of ["abc", ["x", "y"], 42]) {
  const cleanSessRes = stepLeadBotSession(badSession, "Need FastAPI $1000");
  assert.equal(Object.hasOwn(cleanSessRes.session, "0"), false);
  assert.deepEqual(Object.keys(cleanSessRes.session).sort(), [
    "estimated_budget_eur",
    "lang",
    "service_need",
    "state",
  ]);
  assert.equal(cleanSessRes.session.state, "handoff_ready");
  assert.equal(cleanSessRes.session.service_need, "b2b_automation");
  assert.equal(cleanSessRes.session.estimated_budget_eur, 1000);
}

// --- Adversarial Fuzzing & W2-E Parity Suites (12-16) ---
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
const randFloat = (rng, min, max) => min + rng() * (max - min);
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const randString = (rng, alphabet, len) => {
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(rng() * alphabet.length)];
  return out;
};
const dynSeed = (Date.now() ^ Math.floor(Math.random() * 0x100000000)) >>> 0;

// 12. Margin Sieve Adversarial Fuzz (400+ cases)
const extremeValid = evaluateMarginSieve({ supplierPrice: 1e-308, resalePrice: 1e12, shippingCost: 0, marketplaceFeePct: 0, returnReservePct: 0, deliveryDays: 1, rating: 5, inStock: true, euDispatch: true });
assert.equal(extremeValid.approved, true);
assert.equal(Number.isFinite(extremeValid.netProfit), true);
assert.equal(Number.isFinite(extremeValid.netMarginPct), true);

for (const weird of [
  { supplierPrice: -0, resalePrice: 100, shippingCost: 0, marketplaceFeePct: 10, returnReservePct: 0, deliveryDays: 1, rating: 5, inStock: true, euDispatch: true },
  { supplierPrice: 10, resalePrice: -0, shippingCost: 0, marketplaceFeePct: 10, returnReservePct: 0, deliveryDays: 1, rating: 5, inStock: true, euDispatch: true },
  { supplierPrice: 1e12 + 1, resalePrice: 1e12 + 100, shippingCost: 0, marketplaceFeePct: 10, returnReservePct: 0, deliveryDays: 1, rating: 5, inStock: true, euDispatch: true },
  { supplierPrice: 10, resalePrice: 100, shippingCost: 1e12 + 1, marketplaceFeePct: 10, returnReservePct: 0, deliveryDays: 1, rating: 5, inStock: true, euDispatch: true },
  { supplierPrice: Number.MAX_VALUE, resalePrice: Number.MAX_VALUE, shippingCost: 0, marketplaceFeePct: 10, returnReservePct: 0, deliveryDays: 1, rating: 5, inStock: true, euDispatch: true },
  { supplierPrice: -Infinity, resalePrice: 100, shippingCost: 0, marketplaceFeePct: 10, returnReservePct: 0, deliveryDays: 1, rating: 5, inStock: true, euDispatch: true },
  { supplierPrice: true, resalePrice: 100, shippingCost: 0, marketplaceFeePct: 10, returnReservePct: 0, deliveryDays: 1, rating: 5, inStock: true, euDispatch: true },
  { supplierPrice: "bad", resalePrice: {}, shippingCost: [], marketplaceFeePct: 10, returnReservePct: 0, deliveryDays: 1, rating: 5, inStock: true, euDispatch: true },
  null,
  undefined,
  "invalid",
]) {
  const r = evaluateMarginSieve(weird);
  assert.equal(r.approved, false);
  assert.equal(r.stage, "schema_guard");
  assert.equal(Number.isFinite(r.netProfit), true);
  assert.equal(Number.isFinite(r.netMarginPct), true);
  assert.equal(Number.isFinite(r.score), true);
}

for (const [label, seed] of [["fixed", 0x4B494245], [`dyn=${dynSeed}`, dynSeed]]) {
  const rng = mulberry32(seed);
  const trials = label === "fixed" ? 300 : 100;
  for (let i = 0; i < trials; i++) {
    const inp = {
      supplierPrice: Number(randFloat(rng, 1, 500).toFixed(2)),
      resalePrice: Number(randFloat(rng, 1, 800).toFixed(2)),
      shippingCost: Number(randFloat(rng, -5, 40).toFixed(2)),
      marketplaceFeePct: Number(randFloat(rng, 0, 55).toFixed(2)),
      returnReservePct: Number(randFloat(rng, 0, 50).toFixed(2)),
      deliveryDays: randInt(rng, -2, 20),
      rating: Number(randFloat(rng, 0, 5.5).toFixed(2)),
      inStock: rng() > 0.2,
      euDispatch: rng() > 0.2,
    };
    const r = evaluateMarginSieve(inp);
    assert.equal(Number.isFinite(r.netProfit), true, `non-finite netProfit (${label})`);
    assert.equal(Number.isFinite(r.netMarginPct), true, `non-finite netMarginPct (${label})`);
    assert.equal(Number.isFinite(r.score), true, `non-finite score (${label})`);
    assert.ok(r.score >= 0 && r.score <= 100, `score out of range (${label}): ${r.score}`);
    if (r.approved) {
      assert.equal(r.stage, "stage_3_approved", `approved stage mismatch (${label})`);
      assert.ok(r.netProfit >= 8.0, `approved netProfit<8 (${label})`);
      assert.ok(r.netMarginPct >= 18.0, `approved netMarginPct<18 (${label})`);
      assert.equal(inp.inStock, true);
      assert.equal(inp.euDispatch, true);
      assert.ok(inp.deliveryDays <= 5);
      assert.ok(inp.rating >= 4.2);
    }
  }
  if (label === "fixed") {
    for (let i = 0; i < 100; i++) {
      const sup = Number(randFloat(rng, 10, 200).toFixed(2));
      const res = Number(randFloat(rng, 50, 500).toFixed(2));
      const ship = Number(randFloat(rng, 0, 25).toFixed(2));
      const fee = Number(randFloat(rng, 0, 30).toFixed(2));
      const rsv = Number(randFloat(rng, 0, 15).toFixed(2));
      const base = evaluateMarginSieve({ supplierPrice: sup, resalePrice: res, shippingCost: ship, marketplaceFeePct: fee, returnReservePct: rsv, deliveryDays: 2, rating: 4.8, inStock: true, euDispatch: true });
      const better = evaluateMarginSieve({ supplierPrice: Number((sup * 0.9).toFixed(2)), resalePrice: Number((res * 1.1).toFixed(2)), shippingCost: Number((ship * 0.5).toFixed(2)), marketplaceFeePct: fee, returnReservePct: rsv, deliveryDays: 2, rating: 4.8, inStock: true, euDispatch: true });
      assert.ok(better.netProfit >= base.netProfit, `monotonicity broken at pair ${i}`);
    }
  }
}

// 13. RAG 2-Letter EN/ES Stopwords & Grounding Fuzz (300+ cases)
const TWO_LETTER_STOPS = [
  "to", "in", "of", "on", "at", "by", "an", "is", "as", "be", "or", "if", "it", "no", "so", "we", "do",
  "de", "en", "el", "la", "es", "un", "al", "lo", "se", "su", "si", "ni", "ya",
];
for (const sw of TWO_LETTER_STOPS) {
  const r = runGroundedRagQuery(sw);
  assert.equal(r.status, "INSUFFICIENT_EVIDENCE", `Stopword '${sw}' should abstain`);
  assert.equal(r.citations.length, 0);
  assert.equal(r.verified, true);
}
for (const nonsense of ["cake in to is", "pan en el de", "pizza on at by", "cafe de la en un"]) {
  const r = runGroundedRagQuery(nonsense);
  assert.equal(r.status, "INSUFFICIENT_EVIDENCE", `Nonsense query '${nonsense}' must abstain`);
  assert.equal(r.citations.length, 0);
  assert.equal(r.verified, true);
}
for (const validShort of ["qa verification", "72 hours", "24 months", "60 months"]) {
  const r = runGroundedRagQuery(validShort);
  assert.equal(r.status, "GROUNDED", `Valid short query '${validShort}' must remain GROUNDED`);
  assert.ok(r.citations.length >= 1);
}
{
  const rng = mulberry32(0x52414731);
  const nonsenseNouns = ["cake", "pan", "sushi", "guitar", "bicycle", "nebula", "cactus", "glacier", "taco", "penguin"];
  for (let i = 0; i < 150; i++) {
    const q = `${pick(rng, nonsenseNouns)} ${pick(rng, TWO_LETTER_STOPS)} ${pick(rng, TWO_LETTER_STOPS)} ${pick(rng, TWO_LETTER_STOPS)}`;
    const r = runGroundedRagQuery(q);
    assert.equal(r.status, "INSUFFICIENT_EVIDENCE", `Stopword combo must abstain: ${q}`);
    assert.equal(r.citations.length, 0);
  }
  const sqliNoise = ["' OR 1=1 --", "title:secret OR body:*", "MATCH * NEAR/3", "SELECT * FROM docs;", "<script>alert(1)</script>", "\u0000\u200B\n\t"];
  for (let i = 0; i < 100; i++) {
    const q = `${pick(rng, sqliNoise)} ${randString(rng, "xyzqwkj", randInt(rng, 3, 8))}`;
    const r = runGroundedRagQuery(q);
    assert.equal(r.status, "INSUFFICIENT_EVIDENCE", `SQLi/noise must abstain: ${q}`);
  }
  const validCorpusIds = new Set(SAMPLE_CORPUS.map((c) => c.doc_id));
  const corpusQueries = [
    "breach notification 72 hours",
    "audit log retention 24 months",
    "escrow acceptance QA verification",
    "conservacion facturas electronicas XML",
    "ArtÍculo 4 personal data breach",
  ];
  for (let i = 0; i < 50; i++) {
    const baseQ = pick(rng, corpusQueries);
    const q = i % 2 === 0 ? baseQ.toUpperCase() : `¡${baseQ}?!`;
    const r = runGroundedRagQuery(q);
    assert.equal(r.status, "GROUNDED", `Corpus query must ground: ${q}`);
    assert.ok(r.citations.length >= 1 && r.citations.length <= 3);
    for (let j = 0; j < r.citations.length; j++) {
      assert.ok(validCorpusIds.has(r.citations[j].doc_id));
      if (j > 0) assert.ok(r.citations[j - 1].overlap >= r.citations[j].overlap);
    }
  }
}

// 14. Lead Bot NLU, GDPR Inquiry vs Opt-Out, "panel solar" & Budget Fuzz (400+ cases)
for (const inquiry of [
  { msg: "Are you GDPR compliant?", expectSvc: null, expectBudget: null },
  { msg: "¿Cumplís con el RGPD?", expectSvc: null, expectBudget: null },
  { msg: "We need a GDPR RAG API budget $1500", expectSvc: "b2b_automation", expectBudget: 1500 },
  { msg: "Necesitamos bot RGPD presupuesto 900 EUR", expectSvc: "messaging_bot", expectBudget: 900 },
]) {
  const res = stepLeadBotSession(null, inquiry.msg);
  assert.notEqual(res.session.state, "silenced", `Inquiry must NOT be silenced: ${inquiry.msg}`);
  assert.notEqual(res.intent, "complaint_optout");
  assert.notEqual(res.reply, null);
  assert.equal(res.session.service_need, inquiry.expectSvc);
  assert.equal(res.session.estimated_budget_eur, inquiry.expectBudget);
}

for (const genuineOptOut of [
  "Quiero darme de baja por RGPD",
  "Quiero darse de baja",
  "Solicito dar de baja mi contacto",
  "Delete my data under GDPR",
  "Erase my data please",
  "Remove my data now",
  "Borrar mis datos",
  "Elimina mis datos",
  "Eliminar mis datos por RGPD",
  "Ejerzo mi derecho al olvido",
  "No me contactes más",
  "Stop contacting me",
]) {
  const res = stepLeadBotSession({ lang: "es", state: "awaiting_budget", service_need: "b2b_automation", estimated_budget_eur: null }, genuineOptOut);
  assert.equal(res.session.state, "silenced", `Expected silenced for: ${genuineOptOut}`);
  assert.equal(res.intent, "complaint_optout");
  assert.equal(res.reply, null);
}

for (const nonB2bMsg of [
  "Necesito un panel solar para mi casa",
  "Busco instalacion de paneles solares",
  "Need a solar panel quote",
  "¿Cómo protegéis nuestros datos?",
  "¿Qué precios tenéis?",
]) {
  const res = stepLeadBotSession(null, nonB2bMsg);
  assert.equal(res.session.service_need, null, `Must not false-match service_need: ${nonB2bMsg}`);
}
for (const panelB2b of [
  "Necesito un panel de control para pedidos",
  "Queremos un panel administrativo web",
  "Need an admin panel with FastAPI",
]) {
  const res = stepLeadBotSession(null, panelB2b);
  assert.equal(res.session.service_need, "b2b_automation", `Expected b2b_automation for: ${panelB2b}`);
}

for (const [msg, expectedBudget] of [
  ["Presupuesto $10 para empezar o $1,500 total", 1500],
  ["Need $10 - $1,500", 1500],
  ["Desde 25€ hasta 1.200€", 1200],
  ["Budget $5k", 5000],
  ["Budget $50k", 50000],
  ["Presupuesto €1.5k", 1500],
  ["Budget 12k EUR", 12000],
  ["Budget 0.15M EUR", 150000],
  ["Need $500k", null],
  ["Need 500k EUR", null],
  ["Need $2M", null],
  ["Need 4k video editing", null],
  ["Budget $1000000", null],
]) {
  const res = stepLeadBotSession(null, msg);
  assert.equal(res.session.estimated_budget_eur, expectedBudget, `Budget mismatch for '${msg}'`);
}

{
  const rng = mulberry32(0x424F5432);
  for (let i = 0; i < 150; i++) {
    const val = randInt(rng, 50, 240000);
    const fmt = i % 3 === 0 ? `$${val}` : i % 3 === 1 ? `${val} EUR` : `€${val}`;
    const res = stepLeadBotSession(null, `Need automation ${fmt}`);
    assert.equal(res.session.estimated_budget_eur, val, `Fuzz budget mismatch for ${fmt}`);
  }
  const weirdSessions = [null, undefined, 0, 123, "bad", ["a"], { lang: "fr", state: "new" }, false];
  const junkChars = "abcdefghijklmnopqrstuvwxyz0123456789€$.,!?¿ñ<>'\"`\\/\n\t\u2019\u2013";
  for (let i = 0; i < 200; i++) {
    const sess = pick(rng, weirdSessions);
    const txt = randString(rng, junkChars, randInt(rng, 0, 60));
    const res = stepLeadBotSession(sess, txt);
    assert.deepEqual(Object.keys(res.session).sort(), ["estimated_budget_eur", "lang", "service_need", "state"]);
    assert.ok(["new", "awaiting_service", "awaiting_budget", "handoff_ready", "spam_blocked", "silenced"].includes(res.session.state));
  }
}

// 15. IBAN Country-Length Matrix & Invoice 3-Way Fuzz (600+ cases)
function ibanMod97Remainder(ibanStr) {
  const rearranged = ibanStr.slice(4) + ibanStr.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const expanded = code >= 65 && code <= 90 ? String(code - 55) : ch;
    for (const d of expanded) rem = (rem * 10 + Number(d)) % 97;
  }
  return rem;
}
function makeValidIban(cc, totalLen, rng) {
  const bban = randString(rng, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", totalLen - 4);
  const rem = ibanMod97Remainder(`${cc}00${bban}`);
  const check = String(98 - rem).padStart(2, "0");
  return `${cc}${check}${bban}`;
}

const IBAN_MATRIX = [
  ["AL", 28], ["AT", 20], ["BE", 16], ["BG", 22], ["CH", 21], ["CY", 28], ["CZ", 24],
  ["DE", 22], ["DK", 18], ["EE", 20], ["ES", 24], ["FI", 18], ["FR", 27], ["GB", 22],
  ["GR", 27], ["HR", 21], ["HU", 28], ["IE", 22], ["IS", 26], ["IT", 27], ["LI", 21],
  ["LT", 20], ["LU", 20], ["LV", 21], ["NL", 18], ["NO", 15], ["PL", 28], ["PT", 25],
  ["RO", 24], ["SE", 24], ["SI", 19], ["SK", 24],
];
assert.equal(validateIbanMod97("ES55000000000001"), false, "Short 16-char ES IBAN must fail");
assert.equal(validateIbanMod97("DE89370400440532013000"), true);
assert.equal(validateIbanMod97("DE893704004405320130"), false, "Short 20-char DE IBAN must fail");
{
  const rng = mulberry32(0x4942414E);
  for (const [cc, len] of IBAN_MATRIX) {
    const valid = makeValidIban(cc, len, rng);
    assert.equal(validateIbanMod97(valid), true, `Valid ${cc}(${len}) failed: ${valid}`);
    const spaced = valid.replace(/(.{4})/g, "$1 ").trim().toLowerCase();
    assert.equal(validateIbanMod97(spaced), true, `Spaced/lower ${cc} failed`);
    for (const badLen of [len - 1, len + 1, Math.max(15, len - 4)]) {
      if (badLen !== len && badLen >= 15 && badLen <= 34) {
        const wrongLenIban = makeValidIban(cc, badLen, rng);
        assert.equal(validateIbanMod97(wrongLenIban), false, `Wrong length ${cc}(${badLen}) passed MOD-97`);
      }
    }
    const pos = randInt(rng, 4, len - 1);
    const origChar = valid[pos];
    const replChar = origChar === "0" ? "1" : "0";
    const corrupted = valid.slice(0, pos) + replChar + valid.slice(pos + 1);
    assert.equal(validateIbanMod97(corrupted), false, `Single-char corruption passed for ${cc}`);
  }
  for (let i = 0; i < 300; i++) {
    const po = Number(randFloat(rng, 10, 50000).toFixed(2));
    const grn = Number((po * randFloat(rng, 0.7, 1.3)).toFixed(2));
    const inv = Number((po * randFloat(rng, 0.7, 1.3)).toFixed(2));
    const approvedVendor = rng() > 0.15;
    const duplicateInvoice = rng() < 0.15;
    const validIban = rng() > 0.15;
    const iban = validIban ? "ES9121000418450200051332" : "ES55000000000001";
    const r = evaluateInvoice3Way({ poTotal: po, grnTotal: grn, invoiceTotal: inv, iban, approvedVendor, duplicateInvoice });
    assert.ok(r.risk_score >= 0 && r.risk_score <= 100);
    assert.equal(Number.isFinite(r.po_variance_pct), true);
    assert.equal(Number.isFinite(r.grn_variance_pct), true);
    if (!approvedVendor || duplicateInvoice || !validIban || r.risk_score >= 70) {
      assert.equal(r.verdict, "BLOCKED");
    }
  }
}

// 16. SOW Currency Parity, Unchecked Docker/CI, CommonMark Escaping & applyLang Preservation (300+ cases)
assert.equal(USD_TO_EUR, 0.90);
assert.equal(convertUsdToCurrency(150, "EUR"), 135);
assert.equal(convertUsdToCurrency(100, "EUR"), 90);
assert.equal(convertUsdToCurrency(150, "USD"), 150);

let comboCount = 0;
for (const track of ["api", "sieve", "bot", "rag", "invoice", "video"]) {
  for (const complexity of ["mvp", "production", "enterprise"]) {
    for (const includeDocker of [false, true]) {
      for (const includeCi of [false, true]) {
        for (const lang of ["en", "es"]) {
          for (const currency of ["USD", "EUR"]) {
            comboCount++;
            const s = estimateFixedPriceScope({ track, complexity, includeDocker, includeCi, lang, currency });
            assert.equal(s.currency, currency);
            assert.ok(s.total > 0);
            assert.equal(s.milestones[0].amount + s.milestones[1].amount, s.total);
            if (currency === "EUR") {
              assert.notEqual(s.total, s.totalUsd, "EUR must not be 1:1 with USD");
              assert.equal(s.dockerAddon, 135);
              assert.equal(s.ciAddon, 90);
            } else {
              assert.equal(s.total, s.totalUsd);
              assert.equal(s.dockerAddon, 150);
              assert.equal(s.ciAddon, 100);
            }
            const addons = getAddonLabels(lang, currency);
            if (currency === "EUR") {
              assert.ok(addons.docker.includes("+135€") && !addons.docker.includes("$150"));
              assert.ok(addons.ci.includes("+90€") && !addons.ci.includes("$100"));
            } else {
              assert.ok(addons.docker.includes("+$150"));
              assert.ok(addons.ci.includes("+$100"));
            }
          }
        }
      }
    }
  }
}
assert.equal(comboCount, 288);

// Markdown export unchecked Docker/CI & CommonMark escaping
for (const lang of ["en", "es"]) {
  const mdNoAddons = buildMarkdownSowFromState(
    {
      client: "Acme | S.L.",
      contact: "CTO",
      project: "Custom # Heading > Quote | Pipe `code`",
      ref: "REF-1` <script>alert(1)</script> ``nested``",
      date: "2026-11-23",
      scope: "Line 1\n===\nLine 2\n---\n***\n___\n# Fake H1\n> Fake Quote\n| col |",
      criteria: ["Criterion | 1"],
      oos: ["OOS #1"],
      milestones: [{ name: "M1", deliv: "Core `api` | v1", eta: "Day 3", amount: 675 }],
    },
    { lang, currency: "EUR", tier: "production", includeDocker: false, includeCi: false }
  );
  assert.ok(!/Docker:\s*true/i.test(mdNoAddons));
  assert.ok(!/pytest\/CI:\s*true/i.test(mdNoAddons));
  const exclWord = SOW_I18N[lang].opt_excluded;
  assert.ok(mdNoAddons.includes(`**${SOW_I18N[lang].meta_docker}:** ${exclWord}`));
  assert.ok(mdNoAddons.includes(`**${SOW_I18N[lang].meta_ci}:** ${exclWord}`));
  assert.ok(!mdNoAddons.includes("Dockerfiles"));
  assert.ok(mdNoAddons.includes("``` REF-1` <script>alert(1)</script> ``nested`` ```"));
  assert.equal(mdCodeSpan("REF-1` <script>alert(1)</script>"), "``REF-1` <script>alert(1)</script>``");
  assert.ok(!mdNoAddons.includes("\\REF-1"));
  assert.ok(mdNoAddons.includes("\\==="));
  assert.ok(mdNoAddons.includes("\\---"));
  assert.ok(mdNoAddons.includes("\\***"));
  assert.ok(mdNoAddons.includes("\\___"));
  assert.ok(mdNoAddons.includes("\\# Fake H1"));
  assert.ok(mdNoAddons.includes("\\> Fake Quote"));
  assert.ok(mdNoAddons.includes("\\| col \\|"));
  assert.ok(mdNoAddons.includes("675€"));
}

// escapeHtml XSS fuzzing (50 trials)
{
  const rng = mulberry32(0x58535331);
  const xssChars = "<>&\"'scriptalert(1)/=";
  for (let i = 0; i < 50; i++) {
    const raw = `<script>alert('${randString(rng, xssChars, 12)}')</script>"&`;
    const esc = escapeHtml(raw);
    assert.ok(!esc.includes("<") && !esc.includes(">") && !esc.includes('"') && !esc.includes("'"));
  }
}

// applyLang / preset custom-edit preservation
{
  const initEn = applyPresetAndLangState({}, { track: "api", lang: "en", tier: "production", includeDocker: true, includeCi: true, currency: "USD" });
  assert.equal(initEn.project, SOW_PRESETS.api.en.title);
  // User edits scope and milestone[0].amount only, then switches EN -> ES
  const edited = {
    ...initEn,
    scope: "CUSTOM_CLIENT_SCOPE_DO_NOT_OVERWRITE",
    milestones: initEn.milestones.map((m, idx) =>
      idx === 0 ? { ...m, amount: 999, _dirty: { amount: true } } : m
    ),
  };
  const switchedEs = applyPresetAndLangState(edited, {
    track: "api",
    lang: "es",
    tier: "production",
    includeDocker: true,
    includeCi: true,
    currency: "USD",
    dirtyFields: new Set(["scope"]),
    hasManualMilestoneEdits: true,
    preserveCustom: true,
  });
  assert.equal(switchedEs.scope, "CUSTOM_CLIENT_SCOPE_DO_NOT_OVERWRITE", "Custom scope must survive applyLang");
  assert.equal(switchedEs.project, SOW_PRESETS.api.es.title, "Untouched project title must translate to ES");
  assert.deepEqual(switchedEs.criteria, SOW_PRESETS.api.es.criteria, "Untouched criteria must translate to ES");
  assert.equal(switchedEs.milestones[0].amount, 999, "Custom milestone amount must survive applyLang");
  assert.equal(switchedEs.milestones[0].name, SOW_PRESETS.api.es.milestones[0].name, "Untouched milestone name must translate");
  assert.equal(switchedEs.milestones[1].name, SOW_PRESETS.api.es.milestones[1].name);
  assert.equal(clampAmount(-5), 0);
  assert.equal(formatMoney(1125, "EUR"), "1,125€");
  assert.equal(getGovItems("en", { includeDocker: false, includeCi: false }).every((g) => !g.includes("Dockerfiles")), true);
  assert.equal(mdCodeSpan("`abc`"), "`` `abc` ``");
  assert.equal(mdEscape("a === b"), "a === b");

  const noAddonsPreset = applyPresetAndLangState({}, { track: "api", lang: "en", tier: "production", includeDocker: false, includeCi: false, currency: "EUR" });
  assert.ok(!/docker/i.test(noAddonsPreset.title));
  assert.ok(!/docker/i.test(noAddonsPreset.scope));
  assert.ok(noAddonsPreset.criteria.every((c) => !/docker|github actions/i.test(c)));
  assert.ok(noAddonsPreset.milestones.every((m) => !/docker|ci matrix/i.test(m.deliv)));

  // Exhaustive 6 tracks x 2 langs x 4 flag combinations (Docker/CI leak & duplication sweep)
  for (const track of ["api", "sieve", "bot", "rag", "invoice", "video"]) {
    for (const lang of ["en", "es"]) {
      for (const includeDocker of [false, true]) {
        for (const includeCi of [false, true]) {
          const st = applyPresetAndLangState({}, { track, lang, tier: "production", includeDocker, includeCi, currency: "USD" });
          const gov = getGovItems(lang, { includeDocker, includeCi });
          const md = buildMarkdownSowFromState(st, { lang, currency: "USD", tier: "production", includeDocker, includeCi });
          const mdBodyBeforeGov = md.split(`### ${SOW_I18N[lang].h_gov}`)[0]
            .replace(/^-\s*\*\*(?:Delivery Tier|Nivel de Entrega):\*\*.*$/m, "");

          if (!includeDocker) {
            assert.ok(!/\bdocker(?:file)?s?\b/i.test(st.title), `Docker leak in title (${track}/${lang})`);
            assert.ok(!/\bdocker(?:file)?s?\b/i.test(st.scope), `Docker leak in scope (${track}/${lang})`);
            assert.ok(st.criteria.every((c) => !/\bdocker(?:file)?s?\b/i.test(c)), `Docker leak in criteria (${track}/${lang})`);
            assert.ok(st.milestones.every((m) => !/\bdocker(?:file)?s?\b/i.test(m.name)), `Docker leak in ms.name (${track}/${lang})`);
            assert.ok(st.milestones.every((m) => !/\bdocker(?:file)?s?\b/i.test(m.deliv)), `Docker leak in ms.deliv (${track}/${lang})`);
            assert.ok(gov.every((g) => !/Dockerfiles/i.test(g)), `Dockerfiles leak in govItems (${track}/${lang})`);
            assert.ok(!/\bdocker(?:file)?s?\b/i.test(mdBodyBeforeGov), `Docker leak in Markdown body (${track}/${lang})`);
          }
          if (!includeCi) {
            assert.ok(!/\bci\b|github actions/i.test(st.title), `CI leak in title (${track}/${lang})`);
            assert.ok(!/\bci\b|github actions/i.test(st.scope), `CI leak in scope (${track}/${lang})`);
            assert.ok(st.criteria.every((c) => !/\bci\b|github actions/i.test(c)), `CI leak in criteria (${track}/${lang})`);
            assert.ok(st.milestones.every((m) => !/\bci\b|github actions/i.test(m.name)), `CI leak in ms.name (${track}/${lang})`);
            assert.ok(st.milestones.every((m) => !/\bci\b|github actions/i.test(m.deliv)), `CI leak in ms.deliv (${track}/${lang})`);
            assert.ok(st.milestones.every((m) => (m.deliv.match(/\bpytest\b/gi) || []).length <= 1), `Duplicate pytest in ms.deliv (${track}/${lang})`);
            assert.ok(st.milestones.every((m) => (m.name.match(/\bQA\b/gi) || []).length <= 1), `Duplicate QA in ms.name (${track}/${lang})`);
            assert.ok(!/\bci\b|github actions/i.test(mdBodyBeforeGov), `CI leak in Markdown body (${track}/${lang})`);
          }
        }
      }
    }
  }

  // _presetIdx preservation after deleting Milestone 1 (idx 0) and toggling EN <-> ES
  const baseApiEn = applyPresetAndLangState({}, { track: "api", lang: "en", tier: "production", includeDocker: true, includeCi: true, currency: "USD" });
  const afterDelM1 = {
    ...baseApiEn,
    milestones: [
      baseApiEn.milestones[1],
      { name: "M3 · Custom", deliv: "Extra audit", eta: "Day 9", amount: 250, _dirty: { name: true, deliv: true, eta: true, amount: true } },
    ],
  };
  const delTranslatedEs = applyPresetAndLangState(afterDelM1, {
    track: "api",
    lang: "es",
    tier: "production",
    includeDocker: true,
    includeCi: true,
    currency: "USD",
    hasManualMilestoneEdits: true,
    preserveCustom: true,
  });
  assert.equal(delTranslatedEs.milestones.length, 2);
  assert.equal(delTranslatedEs.milestones[0].name, SOW_PRESETS.api.es.milestones[1].name, "Remaining M2 must translate to H2, not H1");
  assert.equal(delTranslatedEs.milestones[0].deliv, SOW_PRESETS.api.es.milestones[1].deliv);
  assert.equal(delTranslatedEs.milestones[0]._presetIdx, 1);
  assert.equal(delTranslatedEs.milestones[1].name, "M3 · Custom");

  // Single-char '=' / '-' Setext underlines in mdEscape
  assert.equal(mdEscape("Scope line\n="), "Scope line\n\\=");
  assert.equal(mdEscape("Scope line\n-"), "Scope line\n\\-");
  assert.equal(mdEscape("Scope line\n  =  "), "Scope line\n  \\=  ");
  assert.equal(mdEscape("Scope line\n  -  "), "Scope line\n  \\-  ");
  assert.equal(mdEscape("- bullet item\na = b\nc - d"), "- bullet item\na = b\nc - d");
  const mdSetext = buildMarkdownSowFromState({ scope: "Heading A\n=\nHeading B\n-" }, { lang: "en" });
  assert.ok(mdSetext.includes("Heading A\n\\=\nHeading B\n\\-"));
}

// 17. Gate 1 Remediation Regressions: B2B GDPR/RGPD vs Opt-outs & RAG minOverlap <= 0
for (const b2bGdprMsg of [
  "Do you provide a GDPR compliance report?",
  "We need a GDPR report automation bot with $1200",
  "Need GDPR compliance report workflow $1500",
  "Do you help stop GDPR data breaches with API? $2000",
  "Can your RAG remove GDPR PII before indexing? $1800",
  "Necesito eliminar datos PII para cumplir con RGPD y 1500 EUR",
]) {
  const res = stepLeadBotSession(null, b2bGdprMsg);
  assert.notEqual(res.session.state, "silenced", `Legitimate B2B GDPR query must NOT be silenced: ${b2bGdprMsg}`);
  assert.notEqual(res.intent, "complaint_optout");
  assert.notEqual(res.reply, null);
}

for (const subjectOptOut of [
  "Delete my data under GDPR",
  "Erase my data under GDPR",
  "Remove my data under GDPR",
  "Please delete all my GDPR records",
  "Borrar mis datos RGPD",
  "Solicito suprimir mis datos RGPD",
  "Report you to AEPD under GDPR",
  "File a GDPR complaint",
  "Quiero darme de baja por RGPD",
  "unsubscribe GDPR",
  "stop messaging GDPR",
]) {
  const res = stepLeadBotSession(null, subjectOptOut);
  assert.equal(res.session.state, "silenced", `Subject GDPR opt-out/complaint MUST be silenced: ${subjectOptOut}`);
  assert.equal(res.intent, "complaint_optout");
  assert.equal(res.reply, null);
}

for (const zeroMin of [0, -1]) {
  const ragZero = runGroundedRagQuery("cake", zeroMin);
  assert.equal(ragZero.status, "INSUFFICIENT_EVIDENCE", `Zero-hit RAG query with minOverlap=${zeroMin} must abstain`);
  assert.equal(ragZero.citations.length, 0);
}
const ragZeroGrounded = runGroundedRagQuery("breach", 0);
assert.equal(ragZeroGrounded.status, "GROUNDED");
assert.ok(ragZeroGrounded.citations.length >= 1 && ragZeroGrounded.citations.every((c) => c.overlap > 0));

// 18. String boolean coercion regressions (prevent Boolean("false") === true)
const sieveStrFalseStock = evaluateMarginSieve({
  supplierPrice: 85,
  resalePrice: 159,
  shippingCost: 6,
  marketplaceFeePct: 12,
  returnReservePct: 4,
  deliveryDays: 2,
  rating: 4.8,
  inStock: "false",
  euDispatch: "true",
});
assert.equal(sieveStrFalseStock.approved, false);
assert.ok(sieveStrFalseStock.reasons.includes("out_of_stock"));

const sieveStrFalseEu = evaluateMarginSieve({
  supplierPrice: 85,
  resalePrice: 159,
  shippingCost: 6,
  marketplaceFeePct: 12,
  returnReservePct: 4,
  deliveryDays: 2,
  rating: 4.8,
  inStock: "true",
  euDispatch: "FALSE",
});
assert.equal(sieveStrFalseEu.approved, false);
assert.ok(sieveStrFalseEu.reasons.includes("non_eu_dispatch"));

const invStrUnapproved = evaluateInvoice3Way({
  poTotal: 1250,
  grnTotal: 1250,
  invoiceTotal: 1250,
  iban: "ES9121000418450200051332",
  approvedVendor: "false",
  duplicateInvoice: "false",
});
assert.equal(invStrUnapproved.verdict, "BLOCKED");
assert.ok(invStrUnapproved.triggers.includes("unapproved_vendor"));
assert.equal(invStrUnapproved.triggers.includes("duplicate_invoice"), false);

const invStrFalseDup = evaluateInvoice3Way({
  poTotal: 1250,
  grnTotal: 1250,
  invoiceTotal: 1250,
  iban: "ES9121000418450200051332",
  approvedVendor: "true",
  duplicateInvoice: "false",
});
assert.equal(invStrFalseDup.verdict, "PASS");
assert.equal(invStrFalseDup.risk_score, 0);

console.log("JS_ENGINES_OK", { okScore: okSku.score, ragHits: ragEn.citations.length, invPass: invPass.verdict, estUsd: est.totalUsd });
