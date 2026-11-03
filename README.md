# agentic-b2b-seller

A downloadable **seller agent** for B2B trade. You run it on your own machine or
server, drop your product knowledge into `kb/`, and it answers buyer inquiries
24/7 — in text or via another agent calling its HTTP endpoint.

This is one half of a two-agent model. The other half is
[`agentic-b2b-buyer`](https://github.com/chinaselection-01/agentic-b2b-buyer),
which discovers seller agents and sends them inquiries.

## How the two agents talk

```
 buyer-agent ──GET /agent-card──▶ seller-agent   (discovery: what do you sell?)
 buyer-agent ──POST /inquire────▶ seller-agent   (inquiry: answer from KB)
 seller-agent ──JSON reply──────▶ buyer-agent    (answer + needsHuman flag)
```

No central server is required. The buyer agent only needs the seller's
`/agent-card` URL. (For cross-machine use behind NAT, put the seller agent
behind a tunnel or host it; that's the only "post office" you need.)

## Quick start

```bash
git clone https://github.com/chinaselection-01/agentic-b2b-seller
cd agentic-b2b-seller
node server.js
```

Open `http://localhost:8787/agent-card` to see the agent's discovery card.

## Make it yours

1. Edit `config.json` — name, owner, contact, port, offerings, languages.
2. Replace the files in `kb/` with your own product specs, pricing, FAQ
   (plain markdown). Anything you put here is what the agent can answer from.
3. (Optional) Set an LLM key for real natural-language replies:

   ```bash
   export OPENAI_API_KEY=sk-...        # or any OpenAI-compatible endpoint
   node server.js
   ```

   Without a key the agent still runs using an offline keyword-match stub, so
   you can test the whole loop with zero setup.

## Endpoints

| Method | Path          | Purpose                                          |
|--------|---------------|--------------------------------------------------|
| GET    | `/agent-card` | Discovery card: who you are, what you sell       |
| POST   | `/inquire`    | Body `{from, query, locale}` → `{answer, needsHuman, sources}` |
| GET    | `/`           | Health check                                     |

## What the agent will NOT do

It does not quote final prices, sign contracts, or take payment. When a buyer
asks about price negotiation, contracts, or payment terms, the reply is flagged
`needsHuman: true` and the contact is handed over. The agent handles discovery
and first-line Q&A; you close the deal.

## License

MIT
