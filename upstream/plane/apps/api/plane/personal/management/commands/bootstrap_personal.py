from django.core.management.base import BaseCommand

from plane.personal.identity import bootstrap_identity


class Command(BaseCommand):
    help = "创建免登录个人版的本地身份和默认工作空间。"

    def handle(self, *args, **options):
        _, workspace = bootstrap_identity()
        self.stdout.write(self.style.SUCCESS(f"本地身份已就绪：/{workspace.slug}/"))
