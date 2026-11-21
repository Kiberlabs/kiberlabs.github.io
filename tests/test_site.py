"""Static integrity, asset verification, and R3 privacy guard tests for kiberlabs.github.io."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_required_site_files_and_assets_exist() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    assert (ROOT / "styles.css").exists()
    assert (ROOT / "engines.js").exists()
    assert (ROOT / "app.js").exists()

    # Every local relative src/href to assets/* must exist on disk
    refs = set(re.findall(r'(?:src|href)="(assets/[^"]+)"', html))
    assert len(refs) == 7  # logo + 6 covers
    for rel in refs:
        assert (ROOT / rel).exists(), f"Missing local asset referenced in index.html: {rel}"


def test_all_six_public_repos_and_ci_badges_linked() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    expected_repos = (
        "ecommerce-price-monitor-sieve",
        "omnichannel-lead-bot",
        "ai-shortform-video-pipeline",
        "b2b-rag-citation-engine",
        "kiberlabs-automation-api",
        "b2b-invoice-reconciliation-engine",
    )
    for repo in expected_repos:
        assert f"https://github.com/Kiberlabs/{repo}" in html
        assert f"https://github.com/Kiberlabs/{repo}/actions/workflows/ci.yml/badge.svg" in html


def test_zero_r3_or_pii_leakage_across_site() -> None:
    forbidden = ("xenia", "rosana", "wallapop", "milanuncios", "camoufox", "andre@")
    for fname in ("index.html", "styles.css", "engines.js", "app.js"):
        content = (ROOT / fname).read_text(encoding="utf-8").lower()
        for bad in forbidden:
            assert bad not in content, f"Forbidden token {bad!r} found in {fname}"
