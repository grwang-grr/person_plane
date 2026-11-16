from django.core.management.base import BaseCommand

from plane.personal.backup import create_backup


class Command(BaseCommand):
    help = "将个人版数据库、附件、头像、文档图片及校验清单备份到一个 ZIP。"

    def handle(self, *args, **options):
        self.stdout.write(str(create_backup()))
