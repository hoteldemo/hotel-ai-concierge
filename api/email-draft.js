import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { from, to, subject, body } = req.body;
  if (!from || !to || !subject || !body) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // ---------------------------
  // Hotel erkennen
  // ---------------------------
  let hotelId;
  if (to.includes("hotel.demo")) hotelId = "demohotel";
  else hotelId = "default";

  // ---------------------------
  // KB laden extern
  // ---------------------------
  let kb = [];
  try {
    const kbPath = path.resolve("./kb", `${hotelId}.json`);
    const kbData = fs.readFileSync(kbPath, "utf-8");
    kb = JSON.parse(kbData);
  } catch {
    kb = [];
  }

  // ---------------------------
  // KB-Matching
  // ---------------------------
  const text = body.toLowerCase();
  let kbAnswer = null;
  for (const item of kb) {
    if (item.keywords.some(k => text.includes(k))) {
      kbAnswer = item.answer;
      break;
    }
  }

  // ---------------------------
  // GPT-Fallback
  // ---------------------------
  let aiAnswer = kbAnswer;
  if (!aiAnswer) {
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `Du bist ein professioneller Hotel-KI-Assistent für ${hotelId}.` },
            { role: "user", content: body }
          ],
          temperature: 0.3
        })
      });
      const data = await openaiRes.json();
      if (data.choices?.length) aiAnswer = data.choices[0].message.content;
    } catch {
      aiAnswer = "Gerne helfen wir Ihnen persönlich weiter. Bitte kontaktieren Sie die Rezeption.";
    }
  }

  // ---------------------------
  // Draft-Mail erstellen
  // ---------------------------
  const draft = {
    to: to,
    subject: `[SOFIA | ENTWURF] Antwort zu: ${subject}`,
    body: `Hallo Rezeption,\n\nHier ist der Antwortvorschlag für die Anfrage von ${from}:\n\n${aiAnswer}\n\n---\nOriginalmail:\n${body}`
  };

  return res.status(200).json({ draft });
}

