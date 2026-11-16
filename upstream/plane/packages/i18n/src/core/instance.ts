/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import ICU from "i18next-icu";
import { FALLBACK_LANGUAGE } from "../constants/language";
import { NAMESPACES, DEFAULT_NAMESPACE } from "../constants/namespaces";
import { chineseResources } from "./chinese-resources";

import type { i18n as I18nInstance } from "i18next";

export const i18nInstance: I18nInstance = createInstance();

i18nInstance.use(ICU).use(initReactI18next);

export const initPromise = i18nInstance
  .init({
    lng: FALLBACK_LANGUAGE,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: [FALLBACK_LANGUAGE],
    resources: { "zh-CN": chineseResources },
    ns: NAMESPACES,
    defaultNS: DEFAULT_NAMESPACE,
    // fallbackNS ensures all namespaces are searched for any key, so components
    // don't need to pass NAMESPACES to useTranslation (which triggers re-render cascades).
    fallbackNS: NAMESPACES.filter((ns) => ns !== DEFAULT_NAMESPACE),
    partialBundledLanguages: true,
    keySeparator: ".",
    nsSeparator: false,
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
    // Pinned explicitly even though it's the default — i18next-icu intercepts the
    // format pipeline and returns raw objects regardless of this flag, so the runtime
    // guard in useTranslation is what actually prevents React crashes. Documenting
    // intent here so this isn't accidentally flipped.
    returnObjects: false,
    react: { useSuspense: false },
  })
  // Eagerly pre-load all namespaces for the initial language so they're cached
  // before any component renders. This prevents the re-render cascade that occurs
  // when react-i18next triggers concurrent async loads for unloaded namespaces.
  .then(() => i18nInstance.loadNamespaces(NAMESPACES));
