# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import Profile


@pytest.mark.unit
class TestProfileLanguage:
    def test_new_profile_defaults_to_simplified_chinese(self):
        assert Profile().language == "zh-CN"

    @pytest.mark.parametrize("language", ["en", "zh-TW", "fr"])
    def test_explicit_language_preference_is_preserved(self, language):
        assert Profile(language=language).language == language
