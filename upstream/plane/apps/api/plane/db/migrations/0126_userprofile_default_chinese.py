# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0125_reset_project_deploy_board_identity"),
    ]

    operations = [
        migrations.AlterField(
            model_name="profile",
            name="language",
            field=models.CharField(default="zh-CN", max_length=255),
        ),
    ]
