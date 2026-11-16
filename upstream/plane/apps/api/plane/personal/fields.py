"""Array storage and aggregation for the personal SQLite database.

The upstream relational models remain intact. Arrays use JSON instead of native
PostgreSQL arrays; UUID elements are restored using their declared base field.
"""

from django.contrib.postgres.aggregates import ArrayAgg as PostgresArrayAgg
from django.core.exceptions import ValidationError
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.utils.functional import cached_property


class ArrayField(models.JSONField):
    def __init__(self, base_field, size=None, **kwargs):
        self.base_field = base_field
        self.size = size
        kwargs.setdefault("encoder", DjangoJSONEncoder)
        super().__init__(**kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs["base_field"] = self.base_field.clone()
        if self.size is not None:
            kwargs["size"] = self.size
        return name, path, args, kwargs

    def from_db_value(self, value, expression, connection):
        value = super().from_db_value(value, expression, connection)
        if isinstance(value, list):
            return [self.base_field.to_python(item) if item is not None else None for item in value]
        return value

    def validate(self, value, model_instance):
        super().validate(value, model_instance)
        if not isinstance(value, list):
            raise ValidationError("必须使用列表。")
        if self.size is not None and len(value) > self.size:
            raise ValidationError(f"列表最多包含 {self.size} 项。")
        for item in value:
            self.base_field.clean(item, model_instance)


class ArrayAgg(PostgresArrayAgg):
    @cached_property
    def output_field(self):
        return ArrayField(self.source_expressions[0].output_field)

    def as_sqlite(self, compiler, connection, **extra_context):
        clone = self.copy()
        clone.function = "JSON_GROUP_ARRAY"
        return clone.as_sql(compiler, connection)
