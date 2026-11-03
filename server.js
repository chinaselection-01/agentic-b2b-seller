import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadKB } from "./lib/kb.js";
import { answer } from "./lib/llm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, "config.json"), "utf8")
);
const PORT = process.env.PORT || config.port || 8787;

function card(baseUrl) {
  return {
    agentId: config.agentId,
    name: config.name,
    owner: config.owner,
    contact: config.contact,
    languages: config.languages,
    offerings: config.offerings,
    description: config.description,
    endpoint: baseUrl,
    inquireUrl: `${baseUrl}/inquire`,
    protocol: "agentic-b2b/0.1",
  };
}

const server = http.createServer(async (req, res) => {
  const base = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
  const url = new URL(req.url, base);

  if (url.pathname === "/agent-card" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(card(base), null, 2));
  }

  if (url.pathname === "/inquire" && req.method === "POST") {
    let body = "";
    for await (const c of req) body += c;
    let payload;
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      res.writeHead(400, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: "invalid json" }));
    }
    const kb = loadKB();
    const reply = await answer(
      config,
      kb,
      payload.query || "",
      payload.locale || "en"
    );
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(
      JSON.stringify({
        from: config.agentId,
        to: payload.from || "unknown",
        answer: reply.text,
        needsHuman: reply.needsHuman,
        sources: reply.sources,
      })
    );
  }

  if (url.pathname === "/" && req.method === "GET") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end(
      `Seller agent "${config.name}" running. GET /agent-card for discovery, POST /inquire to ask.`
    );
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`[seller-agent] ${config.name} listening on http://localhost:${PORT}`);
  console.log(`[seller-agent] card: http://localhost:${PORT}/agent-card`);
});
