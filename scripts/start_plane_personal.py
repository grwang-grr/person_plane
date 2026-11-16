"""Start the original Plane personal candidate without WSL or Docker."""

from __future__ import annotations

import os
import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    api = root / "upstream" / "plane" / "apps" / "api"
    web = api.parent / "web" / "build" / "client" / "index.html"
    if not web.exists():
        raise RuntimeError("请先在 upstream/plane 执行 pnpm turbo run build --filter=web。")
    os.environ["DJANGO_SETTINGS_MODULE"] = "plane.settings.personal"
    os.environ["WPLANE_PERSONAL_DATA_ROOT"] = str(root / "data")
    sys.path.insert(0, str(api))
    os.chdir(api)
    import django

    django.setup()
    from django.core.management import call_command
    from plane.personal.importer import import_legacy
    from plane.personal.locking import data_lock

    with data_lock():
        call_command("migrate", interactive=False, verbosity=0)
        call_command("bootstrap_personal")
        legacy = root / "data" / "database" / "wplane.sqlite3"
        if legacy.exists():
            try:
                import_legacy(legacy)
            except ValueError as error:
                # 旧库仍在被旧版使用，访问记录或迁移版本会变化。
                # 已导入的数据保持不变，只需提示，不阻断启动。
                print(f"跳过旧库导入：{error}", flush=True)
    print("个人版验证入口：http://127.0.0.1:8008/personal/", flush=True)
    print("日志：data/logs/plane-personal.log；按 Ctrl+C 停止。", flush=True)
    import uvicorn

    uvicorn.run("plane.asgi:application", host="127.0.0.1", port=8008, access_log=False)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback

        traceback.print_exc()
        sys.exit(1)
