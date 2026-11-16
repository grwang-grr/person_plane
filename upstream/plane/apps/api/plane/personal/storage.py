"""Local implementation of the original asset service's storage contract."""

from __future__ import annotations

import hashlib
import mimetypes
import os
import tempfile
from datetime import UTC, datetime
from pathlib import Path, PurePosixPath
from urllib.parse import urlencode

from django.conf import settings
from django.core import signing
from django.urls import reverse

SALT = "wplane.personal.assets"


def asset_path(key: str) -> Path:
    if not key or "\\" in key or ":" in key or "\x00" in key:
        raise ValueError("无效的附件路径。")
    parts = PurePosixPath(key)
    if parts.is_absolute() or any(part in (".", "..") for part in parts.parts):
        raise ValueError("无效的附件路径。")
    root = Path(settings.MEDIA_ROOT).resolve()
    path = (root / key).resolve()
    if not path.is_relative_to(root) or path == root:
        raise ValueError("附件路径超出存储目录。")
    return path


def atomic_write(file_obj, key: str, max_size: int | None = None) -> None:
    path = asset_path(key)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, prefix=".upload-", delete=False) as output:
            temporary = Path(output.name)
            total = 0
            while chunk := file_obj.read(64 * 1024):
                total += len(chunk)
                if max_size is not None and total > max_size:
                    raise ValueError("文件大小超过上传限制。")
                output.write(chunk)
            if total == 0:
                raise ValueError("文件不能为空。")
            output.flush()
            os.fsync(output.fileno())
        if path.exists():
            raise FileExistsError("附件已存在，拒绝覆盖。")
        # Hard-link creation is atomic and does not replace an existing file.
        os.link(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


class LocalStorage:
    def __init__(self, request=None):
        self.request = request

    def generate_presigned_post(self, object_name, file_type, file_size, expiration=None):
        asset_path(object_name)
        token = signing.dumps(
            {"key": object_name, "type": file_type, "size": min(file_size, settings.FILE_SIZE_LIMIT)},
            salt=SALT,
        )
        return {"url": reverse("personal-asset-upload"), "fields": {"key": object_name, "token": token}}

    def generate_presigned_url(
        self, object_name, expiration=None, http_method="GET", disposition="inline", filename=None, content_type=None
    ):
        asset_path(object_name)
        token = signing.dumps(
            {
                "key": object_name,
                "disposition": disposition,
                "filename": filename,
                "type": content_type,
            },
            salt=SALT,
        )
        return reverse("personal-asset-download") + "?" + urlencode({"token": token})

    def get_object_metadata(self, object_name):
        path = asset_path(object_name)
        if not path.is_file():
            return None
        digest = hashlib.sha256()
        with path.open("rb") as file:
            while chunk := file.read(64 * 1024):
                digest.update(chunk)
        return {
            "ContentType": mimetypes.guess_type(path.name)[0] or "application/octet-stream",
            "ContentLength": path.stat().st_size,
            "LastModified": datetime.fromtimestamp(path.stat().st_mtime, UTC).isoformat(),
            "ETag": digest.hexdigest(),
            "Metadata": {},
        }

    def copy_object(self, object_name, new_object_name):
        with asset_path(object_name).open("rb") as source:
            atomic_write(source, new_object_name)
        return self.get_object_metadata(new_object_name)

    def upload_file(self, file_obj, object_name: str, content_type=None, extra_args=None) -> bool:
        atomic_write(file_obj, object_name)
        return True

    def delete_files(self, object_names) -> bool:
        for key in object_names:
            asset_path(key).unlink(missing_ok=True)
        return True
