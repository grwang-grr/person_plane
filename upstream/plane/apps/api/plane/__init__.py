# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import os

if os.environ.get("DJANGO_SETTINGS_MODULE") == "plane.settings.personal":
    from .personal.celery import app as celery_app
else:
    from .celery import app as celery_app

__all__ = ("celery_app",)
