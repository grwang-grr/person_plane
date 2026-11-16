import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from plane.personal.importer import import_legacy
from plane.personal.locking import data_lock


class Command(BaseCommand):
    help = "从旧版 SQLite 一次性迁入个人版；保留 ID、编号、标签和原始记录。"

    def add_arguments(self, parser):
        parser.add_argument("source", type=Path)

    def handle(self, *args, **options):
        try:
            with data_lock():
                report = import_legacy(options["source"])
        except (ValueError, KeyError, OSError) as error:
            raise CommandError(str(error)) from error
        self.stdout.write(json.dumps(report, ensure_ascii=False, indent=2))
