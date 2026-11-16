import uuid

from django.db import models


class LegacyRecord(models.Model):
    """Lossless source records for migration audit and personal-only extensions."""

    source_table = models.CharField(max_length=64)
    source_id = models.CharField(max_length=100)
    payload = models.JSONField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=["source_table", "source_id"], name="personal_legacy_unique")]


class PersonalSetting(models.Model):
    key = models.CharField(max_length=100, primary_key=True)
    value = models.JSONField(default=dict)


class ProblemCounter(models.Model):
    workspace = models.OneToOneField("db.Workspace", on_delete=models.PROTECT, primary_key=True)
    next_number = models.PositiveIntegerField(default=1)


class ProblemLabel(models.Model):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.PROTECT)
    name = models.CharField(max_length=32)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["workspace", "name"], name="personal_problem_label_unique")]


class Problem(models.Model):
    class Priority(models.TextChoices):
        URGENT = "urgent", "紧急"
        HIGH = "high", "高"
        MEDIUM = "medium", "中"
        LOW = "low", "低"

    class Severity(models.TextChoices):
        CRITICAL = "critical", "致命"
        MAJOR = "major", "严重"
        NORMAL = "normal", "一般"
        MINOR = "minor", "轻微"
        UNKNOWN = "unknown", "待评估"

    class Status(models.TextChoices):
        OPEN = "open", "待处理"
        PROGRESS = "progress", "处理中"
        VERIFY = "verify", "待验证"
        CLOSED = "closed", "已关闭"
        PAUSED = "paused", "暂缓"

    class Kind(models.TextChoices):
        DEFECT = "defect", "功能缺陷"
        DATA = "data", "数据异常"
        BLOCKER = "blocker", "流程阻塞"
        IMPROVEMENT = "improvement", "体验改进"
        OTHER = "other", "其他"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey("db.Workspace", on_delete=models.PROTECT)
    number = models.PositiveIntegerField(editable=False)
    title = models.CharField(max_length=200)
    description_html = models.TextField(blank=True, default="")
    project = models.ForeignKey("db.Project", null=True, blank=True, on_delete=models.PROTECT)
    task = models.ForeignKey("db.Issue", null=True, blank=True, on_delete=models.PROTECT)
    severity = models.CharField(max_length=16, choices=Severity.choices, default=Severity.UNKNOWN)
    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.OTHER)
    labels = models.ManyToManyField(ProblemLabel, blank=True)
    due_date = models.DateField(null=True, blank=True)
    resolution = models.TextField(blank=True, default="")
    revision = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["workspace", "number"], name="personal_problem_number_unique")]
        indexes = [models.Index(fields=["workspace", "deleted_at", "status"], name="personal_problem_lookup")]


class ProblemEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name="entries")
    text = models.TextField(blank=True, default="")
    changes = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class ProblemAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name="attachments")
    name = models.CharField(max_length=255)
    key = models.CharField(max_length=255, unique=True)
    size = models.PositiveBigIntegerField()
    content_type = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
