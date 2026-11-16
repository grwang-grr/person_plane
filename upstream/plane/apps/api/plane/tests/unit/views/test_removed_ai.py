# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import inspect
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.urls import Resolver404, resolve

from plane.app.views.external.base import UnsplashEndpoint
from plane.license.api.views.configuration import InstanceConfigurationEndpoint
from plane.utils.instance_config_variables import instance_config_variables


@pytest.mark.unit
@pytest.mark.parametrize(
    "url",
    [
        "/api/workspaces/example/ai-assistant/",
        "/api/workspaces/example/projects/00000000-0000-0000-0000-000000000001/ai-assistant/",
    ],
)
def test_removed_assistant_endpoints_are_not_routable(url):
    with pytest.raises(Resolver404):
        resolve(url)


@pytest.mark.unit
def test_image_service_route_is_preserved():
    assert resolve("/api/unsplash/").func.view_class is UnsplashEndpoint


@pytest.mark.unit
def test_removed_provider_settings_are_not_registered():
    keys = {configuration["key"] for configuration in instance_config_variables}
    assert keys.isdisjoint({"LLM_API_KEY", "LLM_PROVIDER", "LLM_MODEL", "GPT_ENGINE"})
    assert "EMAIL_HOST" in keys


@pytest.mark.unit
@pytest.mark.parametrize("key", ["LLM_API_KEY", "LLM_PROVIDER", "LLM_MODEL", "GPT_ENGINE"])
def test_legacy_provider_configuration_is_rejected_before_database_access(key):
    request = SimpleNamespace(data={key: "value", "EMAIL_HOST": "smtp.example.com"})
    handler = inspect.unwrap(InstanceConfigurationEndpoint.patch)
    with patch("plane.license.api.views.configuration.InstanceConfiguration.objects.filter") as query:
        response = handler(InstanceConfigurationEndpoint(), request)
    assert response.status_code == 400
    query.assert_not_called()
