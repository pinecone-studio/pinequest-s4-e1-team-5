export async function verifyWithWolfram(query: string) {
  const appId = Bun.env.WOLFRAM_APP_ID;

  if (!appId) {
    return {
      ok: false,
      query,
      result: "WOLFRAM_APP_ID is missing",
    };
  }

  const url = new URL("https://api.wolframalpha.com/v1/result");

  url.searchParams.set("appid", appId);
  url.searchParams.set("i", query);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();

      return {
        ok: false,
        query,
        result: text,
      };
    }

    const result = await response.text();

    return {
      ok: true,
      query,
      result,
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      query,
      result: "Wolfram request failed",
    };
  }
}