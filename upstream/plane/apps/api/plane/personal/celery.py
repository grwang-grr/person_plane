"""Execute local business tasks synchronously without Redis or RabbitMQ."""

from celery import Celery

app = Celery("plane-personal")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
