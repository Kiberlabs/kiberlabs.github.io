"""Static integrity, JSON benchmark schema, asset verification, and R3 privacy guard tests for kiberlabs.github.io."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PAGES = ("index.html", "benchmarks.html", "trust.html", "sow.html")
JS_MODULES = ("engines.js", "app.js", "benchmarks.js", "trust.js", "sow.js")


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
    assert len(index_refs) == 7  # logo + 6 covers


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
    """Flow: verify clean @media print A4 rules and light-paper SOW styling exist in styles.css."""
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    assert "@media print" in css
    assert "size: A4" in css
    assert ".sow-sheet" in css


def test_conversion_upgrades_tab4_invoice_opengraph_and_sow_bridge() -> None:
    """Flow: verify Tab 4 Invoice Auditor, invoice estimator track, 7/7 CI badge, OpenGraph tags, and SOW URL query wiring."""
    index_html = (ROOT / "index.html").read_text(encoding="utf-8")
    assert 'data-tab="tab-invoice"' in index_html
    assert 'id="tab-invoice"' in index_html
    assert '<option value="invoice">' in index_html
    assert "7 / 7 CI" in index_html
    assert 'property="og:image"' in index_html
    assert 'name="twitter:card"' in index_html
    assert 'id="est-sow-link"' in index_html

    sow_js = (ROOT / "sow.js").read_text(encoding="utf-8")
    assert "URLSearchParams" in sow_js
    assert 'urlParams.get("track")' in sow_js
    assert 'urlParams.get("lang")' in sow_js


def test_zero_r3_or_pii_leakage_across_site() -> None:
    """Flow: scan all site HTML, CSS, JS, and JSON files for forbidden private handles or R3 tokens."""
    forbidden = ("xenia", "rosana", "wallapop", "milanuncios", "camoufox", "andre@")
    files = (*HTML_PAGES, "styles.css", *JS_MODULES, "data/benchmark_report.json")
    for fname in files:
        content = (ROOT / fname).read_text(encoding="utf-8").lower()
        for bad in forbidden:
            assert bad not in content, f"Forbidden token {bad!r} found in {fname}"
