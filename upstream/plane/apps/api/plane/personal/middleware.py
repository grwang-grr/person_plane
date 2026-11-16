from ipaddress import ip_address

from django.http import JsonResponse

from plane.db.models import User
from plane.personal.identity import LOCAL_USER_ID
from plane.personal.locking import data_lock


class LocalIdentityMiddleware:
    """Use one real database actor; retain DRF permissions and CSRF validation."""

    def __init__(self, get_response):
        self.get_response = get_response

    def process_view(self, request, view_func, view_args, view_kwargs):
        path = request.path
        if path.startswith("/api/"):
            if any(part in path for part in ("/invitations/", "/invite/", "/email/", "/join/")):
                return JsonResponse({"error": "个人版不提供账号或组织管理。"}, status=404)
            if request.method not in ("GET", "HEAD", "OPTIONS"):
                if "/members/" in path or path == "/api/users/me/" and request.method == "DELETE":
                    return JsonResponse({"error": "个人版不提供成员管理或账号注销。"}, status=403)
        return None

    def __call__(self, request):
        try:
            is_local = ip_address(request.META.get("REMOTE_ADDR", "")).is_loopback
        except ValueError:
            is_local = False
        if not is_local:
            return JsonResponse({"error": "个人版仅允许本机访问。"}, status=403)
        user = User.objects.filter(pk=LOCAL_USER_ID, is_active=True).first()
        if user is None:
            return JsonResponse({"error": "请先执行 bootstrap_personal 初始化。"}, status=503)
        request.user = user
        with data_lock():
            return self.get_response(request)
