// Vercel serverless function: receives orders from the website and forwards them to Discord.
// The Discord webhook URL lives in the DISCORD_WEBHOOK_URL environment variable (never in the page source).
const RL = require("../rank.js");

const TYPES = ["Discord bot", "Website (one page)", "Twitch bot", "Rocket League rank boost", "Something else"];
const clip = (v, n) => String(v == null ? "" : v).slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "method" }); }
  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return res.status(500).json({ error: "webhook not configured" });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  if (b.website) return res.status(200).json({ ok: true }); // honeypot

  const name = clip(b.name, 60).trim(), id = clip(b.discord, 20).trim(), msg = clip(b.msg, 1000).trim();
  const type = TYPES.includes(b.type) ? b.type : "Something else";
  if (!name || !/^[0-9]{17,20}$/.test(id)) return res.status(400).json({ error: "invalid" });

  const fields = [
    { name: "Name", value: name },
    { name: "Discord ID", value: "`" + id + "` (<@" + id + ">)" },
    { name: "Service", value: type }
  ];

  if (type === "Rocket League rank boost") {
    const r = b.rank || {};
    const q = RL.quote(r.from, r.to, !!r.rewards);
    if (!q || !r.consent) return res.status(400).json({ error: "invalid rank" });
    fields.push(
      { name: "Rank", value: q.from + " → " + q.to },
      { name: "Price", value: "€" + q.total + " (boost €" + q.base + (q.rewards ? " + rank rewards €" + q.rewards : ", no rank rewards") + ")" },
      { name: "Platform / playlist", value: clip(r.platform, 40) + " / " + clip(r.playlist, 40) },
      { name: "Account access", value: "Customer agreed we play on their account and that it is returned afterwards." }
    );
  } else {
    fields.push({ name: "Steam card tier", value: clip(b.tier, 50) || "Not sure" });
  }
  if (msg) fields.push({ name: "Request", value: msg });

  try {
    const r = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Website orders",
        allowed_mentions: { parse: [] },
        embeds: [{ title: "New order: " + type, color: 0xe24b3f, timestamp: new Date().toISOString(), fields }]
      })
    });
    if (!r.ok) return res.status(502).json({ error: "discord " + r.status });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "network" });
  }
};
