from django.urls import include, path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET

from plane.license.api.views import InstanceEndpoint
from plane.app.urls import urlpatterns as original_business_urls
from plane.app.urls.api import urlpatterns as token_urls
from plane.app.urls.external import urlpatterns as integration_urls
from plane.app.urls.webhook import urlpatterns as webhook_urls

from plane.personal import views
from plane.personal import problem_views

excluded = {id(pattern) for pattern in [*token_urls, *integration_urls, *webhook_urls]}
business_urls = [pattern for pattern in original_business_urls if id(pattern) not in excluded]

urlpatterns = [
    path("api/personal/problems/options/", problem_views.ProblemOptions.as_view()),
    path("api/personal/problems/", problem_views.ProblemList.as_view()),
    path("api/personal/problems/<uuid:problem_id>/", problem_views.ProblemDetail.as_view()),
    path("api/personal/problems/<uuid:problem_id>/restore/", problem_views.ProblemRestore.as_view()),
    path("api/personal/problems/<uuid:problem_id>/entries/", problem_views.ProblemEntries.as_view()),
    path("api/personal/problems/<uuid:problem_id>/attachments/", problem_views.ProblemAttachments.as_view()),
    path(
        "api/personal/problems/<uuid:problem_id>/attachments/<uuid:attachment_id>/",
        problem_views.ProblemAttachmentDetail.as_view(),
    ),
    path("api/personal/backups/", views.backups, name="personal-backups"),
    path("api/personal/backups/<str:name>/", views.backup_download, name="personal-backup-download"),
    path("api/instances/", ensure_csrf_cookie(require_GET(InstanceEndpoint.as_view())), name="personal-instance"),
    path("api/personal/bootstrap/", views.bootstrap, name="personal-bootstrap"),
    path("local-assets/upload/", views.upload, name="personal-asset-upload"),
    path("local-assets/download/", views.download, name="personal-asset-download"),
    path("api/", include(business_urls)),
    path("", views.frontend),
    path("<path:route>", views.frontend),
]
