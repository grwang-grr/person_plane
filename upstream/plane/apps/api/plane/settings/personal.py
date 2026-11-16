"""Personal edition: SQLite, local files, no broker and no network services."""

from pathlib import Path

from .common import *  # noqa: F403

PERSONAL_MODE = True
ROOT_URLCONF = "plane.personal.urls"
DATA_ROOT = Path(os.environ.get("WPLANE_PERSONAL_DATA_ROOT", Path(__file__).resolve().parents[6] / "data")).resolve()  # noqa: F405
for folder in ("database", "attachments", "logs", "backups"):
    (DATA_ROOT / folder).mkdir(parents=True, exist_ok=True)

SECRET_KEY_FILE = DATA_ROOT / ".personal-secret"
if not SECRET_KEY_FILE.exists():
    try:
        with SECRET_KEY_FILE.open("x", encoding="utf-8") as secret_file:
            secret_file.write(get_random_secret_key())  # noqa: F405
    except FileExistsError:
        pass
SECRET_KEY = SECRET_KEY_FILE.read_text(encoding="utf-8")
DEBUG = False
ALLOWED_HOSTS = ["127.0.0.1", "localhost", "[::1]", "testserver"]
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = ["http://127.0.0.1:3000", "http://localhost:3000"]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.environ.get("WPLANE_PERSONAL_DATABASE", DATA_ROOT / "database" / "plane-personal.sqlite3"),  # noqa: F405
        "OPTIONS": {"timeout": 30, "transaction_mode": "IMMEDIATE"},
    }
}
# A fresh snapshot of the upstream model state, never fake PostgreSQL migrations.
MIGRATION_MODULES = {"db": "plane.personal.sqlite_migrations"}
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
CSRF_FAILURE_VIEW = "plane.personal.views.csrf_failure"
TIME_ZONE = "Asia/Shanghai"
LANGUAGE_CODE = "zh-hans"
WEB_URL = "http://127.0.0.1:8008"
APP_BASE_URL = WEB_URL
ADMIN_BASE_URL = ""
SPACE_BASE_URL = ""
LIVE_BASE_URL = ""
INSTANCE_CHANGELOG_URL = ""
WEB_DIST = Path(__file__).resolve().parents[3] / "web" / "build" / "client"
STATIC_ROOT = WEB_DIST
WHITENOISE_ROOT = WEB_DIST
WHITENOISE_INDEX_FILE = True
MEDIA_ROOT = DATA_ROOT / "attachments"
MEDIA_URL = "/local-assets/"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"
CELERY_BEAT_SCHEDULE = {}
CELERY_IMPORTS = ()
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "django_celery_beat"]  # noqa: F405
INSTALLED_APPS.append("plane.personal")
MIDDLEWARE.insert(  # noqa: F405
    MIDDLEWARE.index("crum.CurrentRequestUserMiddleware"),  # noqa: F405
    "plane.personal.middleware.LocalIdentityMiddleware",  # noqa: F405
)  # noqa: F405
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"standard": {"format": "{asctime} {levelname} {name} {message}", "style": "{"}},
    "handlers": {
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": str(DATA_ROOT / "logs" / "plane-personal.log"),
            "maxBytes": 5 * 1024 * 1024,
            "backupCount": 3,
            "encoding": "utf-8",
            "formatter": "standard",
        },
        "console": {"class": "logging.StreamHandler", "formatter": "standard"},
    },
    "root": {"handlers": ["file", "console"], "level": "INFO"},
}
