// Copyright (c) 2023-present Plane Software, Inc. and contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export function isUpstreamBrandLink(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol === "mailto:") return /@(?:[^@]+\.)?plane\.so$/i.test(url.pathname);
  if (!["http:", "https:"].includes(url.protocol)) return false;
  const host = url.hostname.toLowerCase();
  if (["plane.so", "plane.sh", "plane.town"].some((domain) => host === domain || host.endsWith(`.${domain}`))) {
    return true;
  }
  const segments = url.pathname.toLowerCase().split("/").filter(Boolean);
  return (
    (host === "github.com" && segments[0] === "makeplane") ||
    (["x.com", "twitter.com"].includes(host) && segments[0] === "planepowers") ||
    (["linkedin.com", "www.linkedin.com"].includes(host) && segments[0] === "company" && segments[1] === "planepowers")
  );
}

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", "build", ".react-router"].includes(entry.name)) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

export function findUpstreamBrandLinks(root) {
  const findings = [];
  for (const directory of [
    "apps/web",
    "apps/admin",
    "apps/space",
    "packages/constants/src",
    "apps/api/templates",
    "apps/api/plane/seeds/data",
  ]) {
    for (const file of filesIn(path.join(root, directory))) {
      if (!/\.(tsx?|html|json)$/.test(file) || /\.(test|spec)\./.test(file)) continue;
      const source = readFileSync(file, "utf8");
      // Email images are assets, not navigation; inspect only their href attributes.
      const matches = file.endsWith(".html")
        ? source.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)
        : source.matchAll(/(?:https?:\/\/|mailto:)[^\s"'<>`]+/g);
      for (const match of matches) {
        const url = file.endsWith(".html") ? match[1] : match[0];
        if (isUpstreamBrandLink(url)) findings.push({ file: path.relative(root, file), url });
      }
    }
  }
  return findings;
}
