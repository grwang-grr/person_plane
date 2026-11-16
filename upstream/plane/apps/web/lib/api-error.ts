function findMessage(value: unknown, depth: number): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (!value || typeof value !== "object" || depth === 0) return undefined;
  for (const item of Object.values(value)) {
    const message = findMessage(item, depth - 1);
    if (message) return message;
  }
  return undefined;
}

/** Extract readable DRF validation messages from service payloads or Axios errors. */
export function getApiErrorMessage(failure: unknown, fallback: string): string {
  if (!failure || typeof failure !== "object") return fallback;
  const response = "response" in failure ? failure.response : undefined;
  const data = response && typeof response === "object" && "data" in response ? response.data : failure;
  return findMessage(data, 3) ?? fallback;
}
