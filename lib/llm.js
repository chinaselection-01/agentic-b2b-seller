import { retrieve } from "./kb.js";

// Call an OpenAI-compatible chat API. Falls back to a deterministic offline
// stub when no API key is configured, so the agent still runs with zero setup.
export async function answer(card, kbText, query, locale = "en") {
  const apiKey = process.env[card.llm.apiKeyEnv || "OPENAI_API_KEY"];
  if (!apiKey) return offlineReply(card, kbText, query);

  const system = [
    `You are the sales agent for ${card.name} (${card.owner}).`,
    `Answer ONLY from the knowledge base below. If the answer is not in it, say you will confirm with a human and give the contact: ${card.contact}.`,
    `Reply in the buyer's language (detected: ${locale}).`,
    `Do not invent prices, HS codes, or lead times that are not in the knowledge base.`,
    `If the buyer asks about price negotiation, contracts, or payment terms, mark it as needing a human.`,
    "",
    "KNOWLEDGE BASE:",
    kbText,
  ].join("\n");

  const res = await fetch(`${card.llm.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: card.llm.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: query },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    return offlineReply(card, kbText, query);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  const needsHuman = /price|negotiat|contract|payment|deposit|discount/i.test(
    query
  );
  return {
    text,
    needsHuman,
    sources: needsHuman ? [] : ["knowledge-base"],
  };
}

function offlineReply(card, kbText, query) {
  const ctx = retrieve(kbText, query);
  const needsHuman = /price|negotiat|contract|payment|deposit|discount|moq/i.test(
    query
  );
  let text;
  if (ctx) {
    text = `【auto-reply from ${card.name} KB】\n${ctx}\n\n(This is an offline stub — set ${card.llm.apiKeyEnv} for a real LLM answer.)`;
  } else {
    text = `Thanks for your inquiry. I don't have that detail in my knowledge base yet. Please contact ${card.contact} and a human will follow up.`;
  }
  return {
    text,
    needsHuman: needsHuman || !ctx,
    sources: ctx ? ["knowledge-base (offline)"] : [],
  };
}
