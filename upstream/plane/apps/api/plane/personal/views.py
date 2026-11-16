from django.conf import settings
from django.core import signing
from django.http import FileResponse, HttpResponse, JsonResponse
from django.http import Http404
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.http import require_http_methods
from django.middleware.csrf import get_token
from plane.personal.backup import create_backup

from plane.personal.storage import SALT, asset_path, atomic_write


@require_GET
@ensure_csrf_cookie
def bootstrap(request):
    return JsonResponse(
        {
            "personal_mode": True,
            "workspace_slug": "personal",
            "user_id": str(request.user.id),
            "csrf_token": get_token(request),
        }
    )


def csrf_failure(request, reason=""):
    return JsonResponse({"error": "请求校验失败，请刷新页面后重试。"}, status=403)


@require_http_methods(["GET", "POST"])
def backups(request):
    if request.method == "POST":
        file = create_backup()
        return JsonResponse({"name": file.name, "size": file.stat().st_size}, status=201)
    return JsonResponse(
        {
            "results": [
                {"name": file.name, "size": file.stat().st_size}
                for file in sorted((settings.DATA_ROOT / "backups").glob("personal-*.zip"), reverse=True)
                if file.is_file() and not file.is_symlink()
            ]
        }
    )


@require_GET
def backup_download(request, name):
    if not name.startswith("personal-") or not name.endswith(".zip") or "/" in name or "\\" in name:
        raise Http404
    root = (settings.DATA_ROOT / "backups").resolve()
    file = (root / name).resolve()
    if not file.is_relative_to(root) or not file.is_file():
        raise Http404
    return FileResponse(file.open("rb"), as_attachment=True, filename=name, content_type="application/zip")


@csrf_exempt  # Original multipart upload has no CSRF header; its signed, short-lived policy is required.
@require_POST
def upload(request):
    try:
        policy = signing.loads(request.POST.get("token", ""), salt=SALT, max_age=900)
        if "size" not in policy or request.POST.get("key") != policy["key"]:
            return JsonResponse({"error": "无效的上传凭证。"}, status=403)
        file = request.FILES.get("file")
        if not file or file.content_type != policy["type"]:
            return JsonResponse({"error": "文件或类型与上传凭证不符。"}, status=400)
        atomic_write(file, policy["key"], max_size=policy["size"])
    except signing.BadSignature:
        return JsonResponse({"error": "上传凭证无效或已过期。"}, status=403)
    except (ValueError, FileExistsError) as error:
        return JsonResponse({"error": str(error)}, status=400)
    return HttpResponse(status=204)


@require_GET
def download(request):
    try:
        policy = signing.loads(request.GET.get("token", ""), salt=SALT, max_age=900)
        if "size" in policy:
            return JsonResponse({"error": "上传凭证不能用于下载。"}, status=403)
        path = asset_path(policy["key"])
        content_type = policy.get("type")
        inline = policy.get("disposition") == "inline" and content_type in settings.INLINE_SAFE_MIME_TYPES
        response = FileResponse(
            path.open("rb"),
            as_attachment=not inline,
            filename=policy.get("filename") or path.name,
            content_type=content_type if inline else "application/octet-stream",
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response
    except (signing.BadSignature, KeyError, ValueError):
        return JsonResponse({"error": "下载凭证无效或已过期。"}, status=403)
    except FileNotFoundError:
        return JsonResponse({"error": "附件不存在。"}, status=404)


@require_GET
def frontend(request, route=""):
    if route.startswith(("api/", "auth/", "local-assets/")) or "." in route:
        raise Http404
    index = settings.WEB_DIST / "index.html"
    if not index.is_file():
        return JsonResponse({"error": "原版前端尚未构建，请先执行 pnpm turbo run build --filter=web。"}, status=503)
    response = FileResponse(index.open("rb"), content_type="text/html; charset=utf-8")
    response["Cache-Control"] = "no-cache"
    return response
