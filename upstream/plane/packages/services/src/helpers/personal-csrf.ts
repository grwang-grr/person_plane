type CsrfFetch = (input: string, init?: RequestInit) => Promise<Response>;

export function createCsrfTokenLoader(fetcher: CsrfFetch): () => Promise<string> {
  let pending: Promise<string> | undefined;
  return () => {
    pending ??= fetcher("/api/personal/bootstrap/", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("无法初始化本地请求校验。");
        const payload: unknown = await response.json();
        if (
          !payload ||
          typeof payload !== "object" ||
          !("csrf_token" in payload) ||
          typeof payload.csrf_token !== "string"
        ) {
          throw new Error("本地请求校验响应无效。");
        }
        return payload.csrf_token;
      })
      .catch((error: unknown) => {
        pending = undefined;
        throw error;
      });
    return pending;
  };
}

export const getPersonalCsrfToken = createCsrfTokenLoader((input, init) => fetch(input, init));
