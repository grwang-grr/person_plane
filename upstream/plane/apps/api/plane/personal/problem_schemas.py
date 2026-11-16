from rest_framework import serializers

from plane.personal.models import Problem


class ProblemInput(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description_html = serializers.CharField(allow_blank=True, required=False)
    project_id = serializers.UUIDField(allow_null=True, required=False)
    task_id = serializers.UUIDField(allow_null=True, required=False)
    severity = serializers.ChoiceField(choices=Problem.Severity.choices, required=False)
    priority = serializers.ChoiceField(choices=Problem.Priority.choices, required=False)
    status = serializers.ChoiceField(choices=Problem.Status.choices, required=False)
    kind = serializers.ChoiceField(choices=Problem.Kind.choices, required=False)
    due_date = serializers.DateField(allow_null=True, required=False)
    resolution = serializers.CharField(allow_blank=True, max_length=20000, required=False)
    labels = serializers.ListField(child=serializers.CharField(max_length=32), max_length=30, required=False)
    revision = serializers.IntegerField(min_value=1, required=False)

    def validate_description_html(self, value: str) -> str:
        from plane.utils.content_validator import validate_html_content

        if len(value) > 200000:
            raise serializers.ValidationError("问题说明过长，请分段记录。")
        valid, _, cleaned = validate_html_content(value)
        if not valid:
            raise serializers.ValidationError("问题说明包含无效内容。")
        return cleaned if cleaned is not None else value


class EntryInput(serializers.Serializer):
    text = serializers.CharField(max_length=20000)
