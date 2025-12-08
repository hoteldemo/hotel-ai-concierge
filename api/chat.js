// /api/chatbot.js
import { demoHotelKnowledge } from './demohotelKB.js';

function getAnswerFromKB(message) {
  const text = message.toLowerCase();
  for (const item of demoHotelKnowledge) {
    if (item.keywords.some(k => text.includes(k))) {
      return item.answer;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "No message" });
  }

  // ===========================
  // KB-Abfrage
  // ===========================
  const kbAnswer = getAnswerFromKB(message);
  if (kbAnswer) {
    return res.status(200).json({ answer: kbAnswer, source: "knowledge_base" });
  }

  // ===========================
  // GPT-4 Fallback
  // ===========================
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
          { role: "system", content: "Du bist ein professioneller KI-Hotelconcierge für das Demohotel." },
          { role: "user", content: message }
        ],
        temperature: 0.3
      })
    });

    const data = await openaiRes.json();
    if (data.choices?.length) {
      return res.status(200).json({ answer: data.choices[0].message.content, source: "ai" });
    }

    throw new Error("Keine Antwort von GPT");
  } catch {
    return res.status(200).json({ 
      answer: "Gerne helfen wir Ihnen persönlich weiter. Kontaktieren Sie uns unter hotel.demo@gmail.com.", 
      source: "email_fallback" 
    });
  }
}

