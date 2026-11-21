import assert from "node:assert/strict";
import {
  estimateFixedPriceScope,
  evaluateMarginSieve,
  runGroundedRagQuery,
  stepLeadBotSession,
} from "../engines.js";

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

// 4. Scope estimator sums milestones cleanly
const est = estimateFixedPriceScope({
  track: "api",
  complexity: "production",
  includeDocker: true,
  includeCi: true,
});
assert.equal(est.milestones[0].usd + est.milestones[1].usd, est.totalUsd);
console.log("JS_ENGINES_OK", { okScore: okSku.score, ragHits: ragEn.citations.length, estUsd: est.totalUsd });
