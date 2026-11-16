"""Keep test uploads and maintenance files away from personal runtime data."""

import pytest


@pytest.fixture(autouse=True)
def isolated_personal_files(settings, tmp_path):
    root = tmp_path / "personal-data"
    for folder in ("database", "attachments", "logs", "backups"):
        (root / folder).mkdir(parents=True)
    settings.DATA_ROOT = root
    settings.MEDIA_ROOT = root / "attachments"
