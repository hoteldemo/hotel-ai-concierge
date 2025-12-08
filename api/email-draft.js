import { demoHotelKnowledge } from "./demohotelKB.js";

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

  const { message, senderEmail } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  // ===========================
  // 1️⃣ KB CHECK
  // ===========================
  const kbAnswer = getAnswerFromKB(message);

  if (kbAnswer) {
    const emailDraft = `
Guten Tag,

vielen Dank für Ihre Anfrage an das Demohotel.

${kbAnswer}

Für weitere Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.

Mit freundlichen Grüßen  
Demohotel  
Panoramastraße 2  
6323 Bad Häring  
hotel.demo@gmail.com
`;

    return res.status(200).json({
      draft: emailDraft.trim(),
      source: "knowledge_base"
    });
  }

  // ===========================
  // 2️⃣ GPT EMAIL DRAFT
  // ===========================
  try {
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Du bist ein professioneller, höflicher E-Mail-Assistent für ein 4-Sterne-Hotel. Schreibe formelle, freundliche E-Mail-Antworten auf Deutsch."
            },
            {
              role: "user",
              content: `Kundenanfrage:\n${message}\n\nBitte schreibe eine passende E-Mail-Antwort.`
            }
          ],
          temperature: 0.3
        })
      }
    );

    const data = await openaiResponse.json();

    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({
        draft: data.choices[0].message.content,
        source: "ai"
      });
    }

    throw new Error("No AI response");
  } catch (error) {
    return res.status(200).json({
      draft:
        "Vielen Dank für Ihre Anfrage. Leider konnten wir diese nicht automatisch beantworten. Bitte kontaktieren Sie uns direkt unter hotel.demo@gmail.com.",
      source: "fallback"
    });
  }
}

