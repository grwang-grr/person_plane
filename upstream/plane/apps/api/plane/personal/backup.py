"""Consistent SQLite + local file backup while personal requests are paused."""

import hashlib
import json
import shutil
import sqlite3
import tempfile
from contextlib import closing
from datetime import UTC, datetime
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from django.conf import settings

from plane.personal.locking import data_lock


def create_backup() -> Path:
    timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ")
    backup_root = settings.DATA_ROOT / "backups"
    backup_root.mkdir(parents=True, exist_ok=True)
    output = backup_root / f"personal-{timestamp}.zip"
    with data_lock(), tempfile.TemporaryDirectory(dir=backup_root, prefix=".staging-") as directory:
        staging = Path(directory)
        database = staging / "database" / "plane-personal.sqlite3"
        database.parent.mkdir()
        source_path = Path(settings.DATABASES["default"]["NAME"]).resolve()
        with closing(sqlite3.connect(source_path.as_uri() + "?mode=ro", uri=True)) as source:
            with closing(sqlite3.connect(database)) as destination:
                source.backup(destination)
                if destination.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                    raise RuntimeError("数据库备份完整性检查失败。")
        files_root = Path(settings.MEDIA_ROOT).resolve()
        if files_root.exists():
            for file in files_root.rglob("*"):
                if not file.resolve().is_relative_to(files_root) or file.is_symlink():
                    raise ValueError("附件目录含有外部链接，已停止备份。")
                if file.is_file():
                    target = staging / "attachments" / file.relative_to(files_root)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(file, target)
        secret_file = settings.DATA_ROOT / ".personal-secret"
        if secret_file.exists():
            shutil.copyfile(secret_file, staging / ".personal-secret")
        manifest = {
            "format": "wplane-personal-1",
            "created_at": timestamp,
            "database_method": "sqlite3.Connection.backup",
            "files": {},
        }
        for file in staging.rglob("*"):
            if file.is_file():
                digest = hashlib.sha256()
                with file.open("rb") as stream:
                    while chunk := stream.read(64 * 1024):
                        digest.update(chunk)
                manifest["files"][file.relative_to(staging).as_posix()] = digest.hexdigest()
        (staging / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        temporary_zip = staging / "backup.zip"
        with ZipFile(temporary_zip, "w", compression=ZIP_DEFLATED) as archive:
            for file in staging.rglob("*"):
                if file.is_file() and file != temporary_zip:
                    archive.write(file, file.relative_to(staging).as_posix())
        temporary_zip.replace(output)
    return output
