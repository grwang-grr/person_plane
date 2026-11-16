import hashlib
import json
import sqlite3
from zipfile import ZipFile

from plane.personal.backup import create_backup


def test_backup_includes_committed_wal_database_and_local_files(settings, tmp_path):
    settings.DATA_ROOT = tmp_path
    settings.MEDIA_ROOT = tmp_path / "attachments"
    settings.MEDIA_ROOT.mkdir()
    (settings.MEDIA_ROOT / "文档图片.png").write_bytes(b"picture")
    source = tmp_path / "source.sqlite3"
    settings.DATABASES = {"default": {"NAME": str(source)}}
    with sqlite3.connect(source) as database:
        database.execute("PRAGMA journal_mode=WAL")
        database.execute("CREATE TABLE projects(name TEXT)")
        database.execute("INSERT INTO projects VALUES('已提交数据')")
        database.commit()
        backup = create_backup()
        database.execute("INSERT INTO projects VALUES('备份之后的数据')")
        database.commit()
    with ZipFile(backup) as archive:
        manifest = json.loads(archive.read("manifest.json"))
        assert archive.read("attachments/文档图片.png") == b"picture"
        for name, digest in manifest["files"].items():
            assert hashlib.sha256(archive.read(name)).hexdigest() == digest
        restored = tmp_path / "restored.sqlite3"
        restored.write_bytes(archive.read("database/plane-personal.sqlite3"))
    with sqlite3.connect(restored) as database:
        assert database.execute("SELECT name FROM projects").fetchall() == [("已提交数据",)]
        assert database.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
