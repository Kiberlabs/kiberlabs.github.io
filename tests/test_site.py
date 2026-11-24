"""Static integrity, JSON benchmark schema, asset verification, and R3 privacy guard tests for kiberlabs.github.io."""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PAGES = ("index.html", "benchmarks.html", "trust.html", "sow.html")
JS_MODULES = ("engines.js", "app.js", "benchmarks.js", "trust.js", "sow.js")


class _SiteParser(HTMLParser):
    """Lightweight stdlib HTML element collector for order-independent attribute assertions."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.elements: list[dict[str, object]] = []
        self._capture_jsonld = False
        self.jsonld_blocks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {k: ("" if v is None else v) for k, v in attrs}
        self.elements.append({"tag": tag, "attrs": attr_map})
        if tag == "script" and attr_map.get("type") == "application/ld+json":
            self._capture_jsonld = True

    def handle_data(self, data: str) -> None:
        if self._capture_jsonld:
            self.jsonld_blocks.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._capture_jsonld:
            self._capture_jsonld = False


def _parse_html(page: str) -> _SiteParser:
    parser = _SiteParser()
    parser.feed((ROOT / page).read_text(encoding="utf-8"))
    return parser


def test_required_site_files_and_assets_exist() -> None:
    """Flow: verify all 4 HTML pages, stylesheets, ES modules, and every local asset link exist on disk."""
    assert (ROOT / "styles.css").exists()
    for js_file in JS_MODULES:
        assert (ROOT / js_file).exists(), f"Missing JS module: {js_file}"

    for page in HTML_PAGES:
        path = ROOT / page
        assert path.exists(), f"Missing HTML page: {page}"
        html = path.read_text(encoding="utf-8")
        # Top-nav cross-links must be present on all 4 pages
        for nav_target in ("benchmarks.html", "trust.html", "sow.html"):
            assert f'href="{nav_target}"' in html, f"{page} missing nav link to {nav_target}"

        refs = set(re.findall(r'(?:src|href)="(assets/[^"]+)"', html))
        assert len(refs) >= 1, f"{page} should reference at least the official KiberLabs logo"
        for rel in refs:
            assert (ROOT / rel).exists(), f"Missing local asset referenced in {page}: {rel}"

    index_refs = set(re.findall(r'(?:src|href)="(assets/[^"]+)"', (ROOT / "index.html").read_text(encoding="utf-8")))
    assert len(index_refs) == 8  # logo + 6 covers + animated hero logo


def test_animated_hero_logo_asset_is_self_contained_and_accessible() -> None:
    """Flow: verify assets/kiberlabs_hero_logo.html is referenced in index.html, offline-only, and honors reduced-motion."""
    index_html = (ROOT / "index.html").read_text(encoding="utf-8")
    assert 'src="assets/kiberlabs_hero_logo.html"' in index_html

    logo_path = ROOT / "assets" / "kiberlabs_hero_logo.html"
    assert logo_path.exists()
    content = logo_path.read_text(encoding="utf-8")
    assert "prefers-reduced-motion" in content
    assert "http://" not in content and "https://" not in content


def test_all_public_repos_and_ci_badges_linked() -> None:
    """Flow: verify all 6 core engines on index.html and kiberlabs-benchmarks on benchmarks.html carry live CI badges."""
    index_html = (ROOT / "index.html").read_text(encoding="utf-8")
    expected_repos = (
        "ecommerce-price-monitor-sieve",
        "omnichannel-lead-bot",
        "ai-shortform-video-pipeline",
        "b2b-rag-citation-engine",
        "kiberlabs-automation-api",
        "b2b-invoice-reconciliation-engine",
    )
    for repo in expected_repos:
        assert f"https://github.com/Kiberlabs/{repo}" in index_html
        assert f"https://github.com/Kiberlabs/{repo}/actions/workflows/ci.yml/badge.svg" in index_html

    bench_html = (ROOT / "benchmarks.html").read_text(encoding="utf-8")
    assert "https://github.com/Kiberlabs/kiberlabs-benchmarks" in bench_html
    assert "https://github.com/Kiberlabs/kiberlabs-benchmarks/actions/workflows/ci.yml/badge.svg" in bench_html


def test_measured_benchmark_json_schema_and_invariants() -> None:
    """Flow: parse data/benchmark_report.json and verify real measured performance, WAL 0-lock, and 100+ Red-Team invariants."""
    json_path = ROOT / "data" / "benchmark_report.json"
    assert json_path.exists(), "Missing real measured data/benchmark_report.json"
    data = json.loads(json_path.read_text(encoding="utf-8"))

    assert data["schema_version"] == "1.0"
    assert "python_version" in data["environment"]
    assert "timestamp_utc" in data["environment"]

    benchmarks = data["benchmarks"]
    assert len(benchmarks) == 5
    by_id = {b["id"]: b for b in benchmarks}
    for bid in ("margin_sieve", "lead_bot_nlu", "rag_fts5_bm25", "gateway_auth_ratelimit", "sqlite_wal_concurrency"):
        assert bid in by_id
        b = by_id[bid]
        assert b["ops_per_sec"] > 0
        assert 0 <= b["p50_ms"] <= b["p95_ms"] <= b["p99_ms"]

    wal = by_id["sqlite_wal_concurrency"]["details"]
    assert wal["concurrent_threads"] >= 50
    assert wal["journal_mode"] == "WAL"
    assert wal["lock_errors"] == 0

    rt = data["redteam"]
    assert rt["total_payloads"] >= 100
    assert rt["bypassed_count"] == 0
    assert rt["block_rate_pct"] == 100.0
    assert len(rt["categories"]) == 5


def test_sow_print_media_rules_present() -> None:
    """Flow: verify clean @media print A4 rules, dark print contrast, and mobile .form-grid collapse in styles.css."""
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    assert "@media print" in css
    assert "size: A4" in css
    assert ".sow-sheet" in css
    mobile_block = css.split("@media (max-width: 960px)", 1)[1].split("@media", 1)[0]
    assert ".form-grid" in mobile_block
    print_block = css.split("@media print", 1)[1]
    for sel in (".metric-card strong", ".latency-pills strong", ".trust-card h3", "pre.code-out"):
        assert sel in print_block
    assert "#0f172a" in print_block


def test_conversion_upgrades_tab4_invoice_opengraph_and_sow_bridge() -> None:
    """Flow: verify Tab 4 Invoice Auditor, invoice estimator track, 7/7 CI badge, OpenGraph tags, and SOW URL query wiring."""
    index_html = (ROOT / "index.html").read_text(encoding="utf-8")
    assert 'data-tab="tab-invoice"' in index_html
    assert 'id="tab-invoice"' in index_html
    assert '<option value="invoice"' in index_html
    assert "7 / 7 CI" in index_html
    assert 'property="og:image"' in index_html
    assert 'name="twitter:card"' in index_html
    assert 'id="est-sow-link"' in index_html

    app_js = (ROOT / "app.js").read_text(encoding="utf-8")
    for param in ("track", "lang", "tier", "docker", "ci"):
        assert param in app_js

    engines_js = (ROOT / "engines.js").read_text(encoding="utf-8")
    assert "parseSowQueryParams" in engines_js
    assert "URLSearchParams" in engines_js

    sow_js = (ROOT / "sow.js").read_text(encoding="utf-8")
    assert "estimateFixedPriceScope" in sow_js
    assert "parseSowQueryParams" in sow_js


def test_accessibility_landmarks_tabs_and_live_regions() -> None:
    """Flow: verify skip links, main landmark, nav aria-current, lang aria-pressed, ARIA tabs, live regions, badge alts, and focus/motion CSS."""
    for page in HTML_PAGES:
        parsed = _parse_html(page)
        skip_links = [
            e for e in parsed.elements
            if e["tag"] == "a" and "skip-link" in e["attrs"].get("class", "").split() and e["attrs"].get("href") == "#main"
        ]
        assert len(skip_links) == 1, f"{page} missing skip-link to #main"

        mains = [e for e in parsed.elements if e["tag"] == "main" and e["attrs"].get("id") == "main"]
        assert len(mains) == 1, f"{page} missing <main id='main'>"

        navs = [e for e in parsed.elements if e["tag"] == "nav" and e["attrs"].get("aria-label")]
        assert len(navs) == 1, f"{page} missing aria-label on <nav>"

        lang_btns = [e for e in parsed.elements if e["tag"] == "button" and "lang-btn" in e["attrs"].get("class", "").split()]
        assert len(lang_btns) == 2
        pressed_states = {b["attrs"].get("data-lang"): b["attrs"].get("aria-pressed") for b in lang_btns}
        assert pressed_states == {"en": "true", "es": "false"}, f"{page} invalid initial aria-pressed: {pressed_states}"

        if page != "index.html":
            current_links = [e for e in parsed.elements if e["tag"] == "a" and e["attrs"].get("aria-current") == "page"]
            assert len(current_links) == 1, f"{page} missing aria-current='page' on active nav item"

    idx = _parse_html("index.html")
    tablists = [e for e in idx.elements if e["attrs"].get("role") == "tablist" and e["attrs"].get("aria-label")]
    assert len(tablists) == 1

    tabs = [e for e in idx.elements if e["attrs"].get("role") == "tab"]
    panels = [e for e in idx.elements if e["attrs"].get("role") == "tabpanel"]
    assert len(tabs) == 4 and len(panels) == 4
    assert sum(1 for t in tabs if t["attrs"].get("aria-selected") == "true") == 1
    assert sum(1 for t in tabs if t["attrs"].get("aria-selected") == "false") == 3
    panel_ids = {p["attrs"].get("id") for p in panels}
    tab_ids = {t["attrs"].get("id") for t in tabs}
    assert all(t["attrs"].get("aria-controls") in panel_ids for t in tabs)
    assert all(p["attrs"].get("aria-labelledby") in tab_ids for p in panels)

    by_id = {e["attrs"].get("id"): e for e in idx.elements if e["attrs"].get("id")}
    assert by_id["bot-input"]["attrs"].get("aria-label")
    assert by_id["bot-log"]["attrs"].get("role") == "log"
    assert by_id["bot-log"]["attrs"].get("aria-live") == "polite"
    for live_id in ("sieve-badge", "sieve-json", "rag-badge", "rag-json", "bot-badge", "bot-json", "inv-badge", "inv-json", "est-price"):
        assert by_id[live_id]["attrs"].get("aria-live") == "polite", f"#{live_id} missing aria-live='polite'"

    ci_badges = [e for e in idx.elements if e["tag"] == "img" and "badge.svg" in e["attrs"].get("src", "")]
    assert len(ci_badges) == 6
    badge_alts = [b["attrs"].get("alt", "") for b in ci_badges]
    assert all(alt and alt != "CI" for alt in badge_alts)
    assert len(set(badge_alts)) == 6

    app_js = (ROOT / "app.js").read_text(encoding="utf-8")
    assert "ArrowRight" in app_js and "ArrowLeft" in app_js and "aria-selected" in app_js

    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    assert ":focus-visible" in css
    assert "@media (prefers-reduced-motion: reduce)" in css
    assert ".skip-link" in css


def test_seo_metadata_sitemap_robots_and_jsonld() -> None:
    """Flow: verify canonical URLs, OpenGraph/Twitter meta tags, robots.txt, sitemap.xml, and Organization JSON-LD."""
    expected_urls = {
        "index.html": "https://kiberlabs.github.io/",
        "benchmarks.html": "https://kiberlabs.github.io/benchmarks.html",
        "trust.html": "https://kiberlabs.github.io/trust.html",
        "sow.html": "https://kiberlabs.github.io/sow.html",
    }
    for page, url in expected_urls.items():
        parsed = _parse_html(page)
        canon = [e for e in parsed.elements if e["tag"] == "link" and e["attrs"].get("rel") == "canonical"]
        assert len(canon) == 1 and canon[0]["attrs"].get("href") == url, f"{page} invalid canonical link"
        props = {e["attrs"].get("property"): e["attrs"].get("content") for e in parsed.elements if e["tag"] == "meta" and "property" in e["attrs"]}
        names = {e["attrs"].get("name"): e["attrs"].get("content") for e in parsed.elements if e["tag"] == "meta" and "name" in e["attrs"]}
        for key in ("og:type", "og:url", "og:title", "og:description", "og:image"):
            assert props.get(key), f"{page} missing {key}"
        assert props["og:url"] == url
        for key in ("twitter:card", "twitter:title", "twitter:description", "twitter:image"):
            assert names.get(key), f"{page} missing {key}"
        if page == "index.html":
            assert "6 CI-verified" in props["og:description"]
            assert "7 CI-verified" not in props["og:description"]
            assert len(parsed.jsonld_blocks) == 1
            ld = json.loads("".join(parsed.jsonld_blocks))
            assert ld["@type"] == "Organization"
            assert ld["url"] == "https://kiberlabs.github.io/"
            assert isinstance(ld.get("sameAs"), list) and len(ld["sameAs"]) >= 7

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    assert "User-agent: *" in robots
    assert "Allow: /" in robots
    assert "Sitemap: https://kiberlabs.github.io/sitemap.xml" in robots

    sitemap_root = ET.fromstring((ROOT / "sitemap.xml").read_text(encoding="utf-8"))
    locs = {el.text for el in sitemap_root.iter() if el.tag.endswith("loc")}
    assert set(expected_urls.values()).issubset(locs)


def test_performance_images_raf_pause_and_cache() -> None:
    """Flow: verify explicit width/height on all img tags, compressed JPEG sizes, rAF pause hooks, and HTTP cacheable fetch."""
    for page in HTML_PAGES:
        parsed = _parse_html(page)
        imgs = [e for e in parsed.elements if e["tag"] == "img"]
        assert len(imgs) >= 1
        for img in imgs:
            w = img["attrs"].get("width", "")
            h = img["attrs"].get("height", "")
            assert w.isdigit() and int(w) > 0, f"{page} img missing positive width: {img}"
            assert h.isdigit() and int(h) > 0, f"{page} img missing positive height: {img}"

    for jpg in (ROOT / "assets").glob("*.jpg"):
        assert jpg.stat().st_size < 100_000, f"Unoptimized JPEG asset (>100KB): {jpg.name} ({jpg.stat().st_size}B)"

    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    assert "height: auto;" in css

    hero_logo = (ROOT / "assets" / "kiberlabs_hero_logo.html").read_text(encoding="utf-8")
    for hook in ("visibilitychange", "IntersectionObserver", "cancelAnimationFrame", "prefers-reduced-motion"):
        assert hook in hero_logo

    benchmarks_js = (ROOT / "benchmarks.js").read_text(encoding="utf-8")
    assert 'cache: "no-store"' not in benchmarks_js


def test_trust_i18n_storage_resilience_and_escaping() -> None:
    """Flow: verify Trust protocol consistency, localStorage try/catch guards, XSS/Markdown escaping, and SOW tier controls."""
    trust_html = (ROOT / "trust.html").read_text(encoding="utf-8")
    assert "3-Step" in trust_html
    assert "4-Step" not in trust_html

    trust_js = (ROOT / "trust.js").read_text(encoding="utf-8")
    assert "35,000+" in trust_js and "65,000+" in trust_js
    assert "35.000+" in trust_js and "65.000+" in trust_js

    sow_html = (ROOT / "sow.html").read_text(encoding="utf-8")
    for ctrl_id in ("sow-tier", "sow-docker", "sow-ci"):
        assert f'id="{ctrl_id}"' in sow_html

    for js_file in ("app.js", "benchmarks.js", "trust.js", "sow.js"):
        src = (ROOT / js_file).read_text(encoding="utf-8")
        assert "localStorage" in src
        assert "try {" in src and "catch" in src
        assert 'setAttribute("aria-pressed"' in src

    for esc_js in ("benchmarks.js", "sow.js"):
        src = (ROOT / esc_js).read_text(encoding="utf-8")
        assert "&#39;" in src

    sow_js = (ROOT / "sow.js").read_text(encoding="utf-8")
    assert 'replaceAll("|", "\\\\|")' in sow_js


def test_remediation_budget_lookbehind_sow_guards_and_turnaround_alignment() -> None:
    """Flow: verify BUDGET_RE lookbehind, SOW edit-preservation + non-negative clamp + scope Markdown guard, and EST. 8 DAYS alignment."""
    engines_js = (ROOT / "engines.js").read_text(encoding="utf-8")
    assert "(?<![\\\\d.,])" in engines_js
    assert "don't contact" in engines_js and "opt-out" in engines_js
    assert "combined_fee_and_reserve>=100%" in engines_js

    sow_js = (ROOT / "sow.js").read_text(encoding="utf-8")
    assert "hasManualTextEdits" in sow_js
    assert "hasManualMilestoneEdits" in sow_js
    assert "isBooted" in sow_js
    assert "clampAmount" in sow_js
    assert "mdScopeBlock" in sow_js
    assert "#{1,6}" in sow_js

    idx = _parse_html("index.html")
    by_id = {e["attrs"].get("id"): e for e in idx.elements if e["attrs"].get("id")}
    assert by_id["est-turnaround"]["attrs"].get("aria-live") == "polite"
    index_html = (ROOT / "index.html").read_text(encoding="utf-8")
    assert '>EST. 8 DAYS<' in index_html

    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    assert ".field input:focus-visible" in css
    assert ".field input:focus:not(:focus-visible)" in css


def test_zero_r3_or_pii_leakage_across_site() -> None:
    """Flow: scan all site HTML, CSS, JS, JSON, robots, and sitemap files for forbidden private handles or R3 tokens."""
    forbidden = ("xenia", "rosana", "wallapop", "milanuncios", "camoufox", "andre@", "@gmail.com")
    files = (*HTML_PAGES, "styles.css", *JS_MODULES, "data/benchmark_report.json", "assets/kiberlabs_hero_logo.html", "robots.txt", "sitemap.xml")
    for fname in files:
        content = (ROOT / fname).read_text(encoding="utf-8").lower()
        for bad in forbidden:
            assert bad not in content, f"Forbidden token {bad!r} found in {fname}"


def _extract_i18n_lang_keys(js_src: str) -> tuple[set[str], set[str]]:
    """Extract top-level property keys from I18N.en and I18N.es object literals in a JS module."""
    m = re.search(r"(?:export\s+)?const\s+I18N\s*=\s*\{", js_src)
    assert m, "I18N object not found"
    def _extract_block(block_name: str) -> set[str]:
        bm = re.search(rf"\b{block_name}\s*:\s*\{{", js_src[m.start():])
        assert bm, f"I18N.{block_name} block not found"
        idx = m.start() + bm.end() - 1
        depth = 0
        start = idx
        in_str: str | None = None
        escape = False
        while idx < len(js_src):
            ch = js_src[idx]
            if in_str:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == in_str:
                    in_str = None
            else:
                if ch in ('"', "'", "`"):
                    in_str = ch
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        body = js_src[start + 1 : idx]
                        return set(re.findall(r"^\s*([A-Za-z0-9_]+)\s*:", body, flags=re.MULTILINE))
            idx += 1
        raise AssertionError(f"Unclosed I18N.{block_name} block")
    return _extract_block("en"), _extract_block("es")


def test_html_js_i18n_and_dom_id_parity() -> None:
    """Flow: verify HTML data-i18n* keys exist in both EN/ES JS I18N dictionaries, EN==ES keys, zero duplicate IDs, and all JS getElementById exist."""
    pairs = (
        ("index.html", "app.js"),
        ("sow.html", "sow.js"),
        ("trust.html", "trust.js"),
        ("benchmarks.html", "benchmarks.js"),
    )
    for html_file, js_file in pairs:
        html_src = (ROOT / html_file).read_text(encoding="utf-8")
        js_src = (ROOT / js_file).read_text(encoding="utf-8")
        en_keys, es_keys = _extract_i18n_lang_keys(js_src)
        assert en_keys == es_keys, f"{js_file} EN/ES I18N key drift: {en_keys ^ es_keys}"

        parsed = _parse_html(html_file)
        html_i18n_keys: set[str] = set()
        ids_list: list[str] = []
        for el in parsed.elements:
            attrs = el["attrs"]
            for attr_name in ("data-i18n", "data-i18n-placeholder", "data-i18n-aria-label"):
                if attr_name in attrs and attrs[attr_name]:
                    html_i18n_keys.add(attrs[attr_name])
            if attrs.get("id"):
                ids_list.append(str(attrs["id"]))

        missing_en = html_i18n_keys - en_keys
        missing_es = html_i18n_keys - es_keys
        assert not missing_en, f"{html_file} keys missing in {js_file} I18N.en: {missing_en}"
        assert not missing_es, f"{html_file} keys missing in {js_file} I18N.es: {missing_es}"

        assert len(ids_list) == len(set(ids_list)), f"Duplicate HTML id(s) in {html_file}"
        html_ids = set(ids_list)
        js_ids = set(re.findall(r'getElementById\("([^"]+)"\)', js_src))
        missing_dom = js_ids - html_ids
        assert not missing_dom, f"{js_file} references missing DOM id(s) in {html_file}: {missing_dom}"


def test_benchmark_json_deep_invariants_and_trust_parity() -> None:
    """Flow: verify min<=p50<=p95<=p99<=max, category totals, and Trust Center metrics match benchmark_report.json."""
    data = json.loads((ROOT / "data" / "benchmark_report.json").read_text(encoding="utf-8"))
    by_id = {b["id"]: b for b in data["benchmarks"]}
    for b in data["benchmarks"]:
        assert b["operations"] > 0
        assert b["wall_ms"] > 0
        assert 0 <= b["min_ms"] <= b["p50_ms"] <= b["p95_ms"] <= b["p99_ms"] <= b["max_ms"]

    rt = data["redteam"]
    assert sum(c["total"] for c in rt["categories"]) == rt["total_payloads"]
    for c in rt["categories"]:
        assert c["blocked"] + c["bypassed"] == c["total"]

    trust_html = (ROOT / "trust.html").read_text(encoding="utf-8")
    trust_js = (ROOT / "trust.js").read_text(encoding="utf-8")
    assert by_id["margin_sieve"]["ops_per_sec"] >= 35000
    assert by_id["lead_bot_nlu"]["ops_per_sec"] >= 65000
    assert str(rt["total_payloads"]) in trust_html and str(rt["total_payloads"]) in trust_js
    wal_threads = str(by_id["sqlite_wal_concurrency"]["details"]["concurrent_threads"])
    assert wal_threads in trust_html and wal_threads in trust_js
    assert "35,000+" in trust_html and "65,000+" in trust_html


def test_sow_currency_parity_and_node_esm_export_contract() -> None:
    """Flow: verify USD/EUR parity controls, dynamic addon labels, ESM exports, and Estimator->SOW default bridge."""
    idx_html = (ROOT / "index.html").read_text(encoding="utf-8")
    sow_html = (ROOT / "sow.html").read_text(encoding="utf-8")
    engines_js = (ROOT / "engines.js").read_text(encoding="utf-8")
    app_js = (ROOT / "app.js").read_text(encoding="utf-8")
    sow_js = (ROOT / "sow.js").read_text(encoding="utf-8")

    assert 'id="est-currency"' in idx_html
    assert 'id="sow-currency"' in sow_html
    for curr in ("USD", "EUR"):
        assert f'value="{curr}"' in idx_html
        assert f'value="{curr}"' in sow_html

    assert "export const USD_TO_EUR" in engines_js
    assert "convertUsdToCurrency" in engines_js
    assert "+$150" not in app_js and "+$100" not in app_js
    assert "+$150" not in sow_js and "+$100" not in sow_js

    for sym in (
        "export const I18N",
        "export const PRESETS",
        "export function clampAmount",
        "export function escapeHtml",
        "export function mdEscape",
        "export function mdCodeSpan",
        "export function formatMoney",
        "export function getAddonLabels",
        "export function getGovItems",
        "export function buildMarkdownSowFromState",
        "export function applyPresetAndLangState",
        "export function initSowApp",
    ):
        assert sym in sow_js, f"Missing Node ESM export in sow.js: {sym}"
    assert 'typeof document !== "undefined" && typeof window !== "undefined"' in sow_js

    m_link = re.search(r'id="est-sow-link"\s+href="([^"]+)"', idx_html)
    assert m_link
    href = m_link.group(1).replace("&amp;", "&")
    for expected_q in ("track=api", "lang=en", "tier=production", "docker=1", "ci=1", "currency=USD"):
        assert expected_q in href


def test_security_link_hygiene_and_engine_guard_contracts() -> None:
    """Flow: verify target=_blank noopener, zero inline event handlers/untyped scripts, engine guards, and extended R3/PII sweep."""
    for page in HTML_PAGES:
        parsed = _parse_html(page)
        for el in parsed.elements:
            attrs = el["attrs"]
            for k in attrs:
                assert not k.lower().startswith("on"), f"Inline event handler {k} in {page}"
            if el["tag"] == "a" and attrs.get("target") == "_blank":
                rel_tokens = set(str(attrs.get("rel", "")).split())
                assert "noopener" in rel_tokens, f"Missing rel=noopener on target=_blank link in {page}: {attrs}"
            if el["tag"] == "script":
                stype = attrs.get("type", "")
                assert stype in ("module", "application/ld+json"), f"Unexpected script type {stype!r} in {page}"

    engines_js = (ROOT / "engines.js").read_text(encoding="utf-8")
    assert "_IBAN_LEN" in engines_js
    for cc_pair in ("ES: 24", "DE: 22", "FR: 27", "GB: 22", "IT: 27", "NL: 18"):
        assert cc_pair in engines_js
    assert "GDPR_OPTOUT_RE" in engines_js
    for sw in ('"to"', '"in"', '"de"', '"en"', '"el"', '"la"'):
        assert sw in engines_js

    forbidden = ("xenia", "rosana", "wallapop", "milanuncios", "camoufox", "andre@", "@gmail.com", "g:\\\\", "c:\\\\users\\\\")
    files = (*HTML_PAGES, "styles.css", *JS_MODULES, "data/benchmark_report.json", "assets/kiberlabs_hero_logo.html", "robots.txt", "sitemap.xml")
    for fname in files:
        content = (ROOT / fname).read_text(encoding="utf-8").lower()
        for bad in forbidden:
            assert bad not in content, f"Forbidden token {bad!r} found in {fname}"


def test_a11y_forms_headings_and_seo_completeness() -> None:
    """Flow: verify <html lang='en'>, single <h1>, unique <title> & meta description, and complete form labeling."""
    titles: set[str] = set()
    descriptions: set[str] = set()
    for page in HTML_PAGES:
        html_src = (ROOT / page).read_text(encoding="utf-8")
        parsed = _parse_html(page)
        html_tags = [e for e in parsed.elements if e["tag"] == "html"]
        assert len(html_tags) == 1 and html_tags[0]["attrs"].get("lang") == "en"

        h1s = [e for e in parsed.elements if e["tag"] == "h1"]
        assert len(h1s) == 1, f"{page} must have exactly 1 <h1>, found {len(h1s)}"

        t_match = re.search(r"<title>([^<]+)</title>", html_src)
        assert t_match and t_match.group(1).strip()
        titles.add(t_match.group(1).strip())

        descs = [e["attrs"].get("content", "").strip() for e in parsed.elements if e["tag"] == "meta" and e["attrs"].get("name") == "description"]
        assert len(descs) == 1 and descs[0]
        descriptions.add(descs[0])

    assert len(titles) == len(HTML_PAGES), "Page titles must be unique"
    assert len(descriptions) == len(HTML_PAGES), "Meta descriptions must be unique"

    for form_page in ("index.html", "sow.html"):
        html_src = (ROOT / form_page).read_text(encoding="utf-8")
        parsed = _parse_html(form_page)
        label_fors = {e["attrs"].get("for") for e in parsed.elements if e["tag"] == "label" and e["attrs"].get("for")}
        wrapped_inputs = set(re.findall(r"<label[^>]*>\s*<(?:input|select|textarea)\b[^>]*\bid=\"([^\"]+)\"", html_src))
        for el in parsed.elements:
            if el["tag"] in ("input", "select", "textarea"):
                eid = str(el["attrs"].get("id", ""))
                has_aria = bool(el["attrs"].get("aria-label") or el["attrs"].get("aria-labelledby"))
                assert has_aria or (eid in label_fors) or (eid in wrapped_inputs), f"{form_page} control missing label: {el}"
