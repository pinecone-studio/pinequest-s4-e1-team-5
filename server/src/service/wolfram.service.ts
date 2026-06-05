export type WolframPod = {
  title: string;
  plaintext: string;
};

export type WolframFormulaResult = {
  ok: boolean;
  query: string;
  pods: WolframPod[];
  error?: string;
};

export async function fetchWolframPods(
  query: string,
): Promise<WolframFormulaResult> {
  const appId = Bun.env.WOLFRAM_APP_ID;

  if (!appId) {
    return { ok: false, query, pods: [], error: "WOLFRAM_APP_ID is missing" };
  }

  const url = new URL("https://api.wolframalpha.com/v2/query");
  url.searchParams.set("appid", appId);
  url.searchParams.set("input", query);
  url.searchParams.set("output", "JSON");
  url.searchParams.set("format", "plaintext");

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, query, pods: [], error: text };
    }

    const json = (await response.json()) as any;
    const queryResult = json?.queryresult;

    if (!queryResult?.success) {
      return {
        ok: false,
        query,
        pods: [],
        error: "Wolfram returned no results",
      };
    }

    const rawPods: any[] = queryResult.pods ?? [];

    const pods: WolframPod[] = rawPods
      .map((pod: any) => {
        const subpods: any[] = pod.subpods ?? [];
        const texts = subpods
          .map((sp: any) => sp.plaintext ?? "")
          .filter(Boolean)
          .join("\n");
        return { title: pod.title ?? "", plaintext: texts };
      })
      .filter((p) => p.plaintext.length > 0);

    return { ok: true, query, pods };
  } catch (error) {
    console.error("[wolfram] fetch error:", error);
    return { ok: false, query, pods: [], error: "Wolfram request failed" };
  }
}

export async function verifyWithWolfram(query: string) {
  const appId = Bun.env.WOLFRAM_APP_ID;

  if (!appId) {
    return { ok: false, query, result: "WOLFRAM_APP_ID is missing" };
  }

  const url = new URL("https://api.wolframalpha.com/v1/result");
  url.searchParams.set("appid", appId);
  url.searchParams.set("i", query);

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, query, result: text };
    }

    const result = await response.text();
    return { ok: true, query, result };
  } catch (error) {
    console.error("[wolfram] verify error:", error);
    return { ok: false, query, result: "Wolfram request failed" };
  }
}
