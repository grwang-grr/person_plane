"""Preserve the live personal database and stage an isolated Plane source tree."""

from __future__ import annotations

import hashlib
import json
import shutil
import sqlite3
from contextlib import closing
from datetime import UTC, datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "planee"
DESTINATION = ROOT / "upstream" / "plane"
EXCLUDED = {
    ".git", "node_modules", ".venv", "__pycache__", ".pytest_cache", ".ruff_cache",
    ".turbo", ".react-router", "dist", "build", "logs", "uploads", ".next",
}


def prepare() -> None:
    source_database = ROOT / "data" / "database" / "wplane.sqlite3"
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ")
    backup = ROOT / "data" / "backups" / f"before-plane-{timestamp}"
    backup.mkdir(parents=True)
    counts: dict[str, int] = {}
    if source_database.is_file():
        with closing(sqlite3.connect(source_database.as_uri() + "?mode=ro", uri=True)) as source:
            with closing(sqlite3.connect(backup / "wplane.sqlite3")) as destination:
                source.backup(destination)
                if destination.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                    raise RuntimeError("Backup integrity check failed")
                tables = destination.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
                ).fetchall()
                for (table,) in tables:
                    escaped = table.replace('"', '""')
                    counts[table] = destination.execute(f'SELECT count(*) FROM "{escaped}"').fetchone()[0]
    assets = ROOT / "data" / "attachments"
    if assets.is_dir():
        shutil.copytree(assets, backup / "attachments")
    manifest = {
        "created_at": timestamp,
        "database_method": "sqlite3.Connection.backup (includes committed WAL data)",
        "source_database": str(source_database),
        "table_counts": counts,
        "files": {
            str(path.relative_to(backup)): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in backup.rglob("*") if path.is_file()
        },
    }
    (backup / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    if DESTINATION.exists():
        raise FileExistsError(f"Candidate already exists; refusing to overwrite: {DESTINATION}")

    def ignore(directory: str, names: list[str]) -> set[str]:
        return {
            name for name in names
            if name in EXCLUDED or name == ".env" or name.endswith((".zip", ".pyc", ".tsbuildinfo"))
            or (name.startswith(".env.") and name != ".env.example")
        }

    shutil.copytree(SOURCE, DESTINATION, ignore=ignore)
    provenance = {
        "source": "https://github.com/makeplane/plane",
        "baseline_commit": "618d0eb74658329a6f6e92434ac54231422c5b96",
        "copied_from": str(SOURCE),
        "note": "Includes earlier local Chinese/branding/Windows adjustments; personal changes are applied here only.",
        "prepared_at": timestamp,
        "pre_migration_backup": str(backup),
    }
    (DESTINATION.parent / "provenance.json").write_text(json.dumps(provenance, indent=2), encoding="utf-8")
    print(json.dumps({"backup": str(backup), "table_counts": counts, "candidate": str(DESTINATION)}))


if __name__ == "__main__":
    prepare()
