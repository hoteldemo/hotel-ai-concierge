// /api/email-handler.js
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { from, to, subject, body } = req.body;
  if (!from || !to || !subject || !body)
    return res.status(400).json({ error: "Missing parameters" });

  // ---------------------------
  // Hotel erkennen anhand "to"-Adresse
  // ---------------------------
  let hotelId;
  if (to.includes("hotel.demo")) hotelId = "demohotel";
  else hotelId = "default";

  // ---------------------------
  // KB aus Supabase laden
  // ---------------------------
  let kb = [];
  try {
    const { data: kbData, error } = await supabase
      .from("hotel_kb")
      .select("*")
      .eq("hotel_id", hotelId);

    if (error) console.error("Supabase KB Error:", error);
    kb = kbData || [];
  } catch (err) {
    console.error("Supabase KB Load Error:", err);
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
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Draft landet im Hotel-Postfach
      subject: `[SOFIA | ENTWURF] Antwort zu: ${subject}`,
      text: `Hallo Rezeption,\n\nHier ist der Antwortvorschlag für die Anfrage von ${from}:\n\n${aiAnswer}\n\n---\nOriginalmail:\n${body}`
    };

    await transporter.sendMail(mailOptions);

    // ---------------------------
    // Log in Supabase speichern
    // ---------------------------
    try {
      await supabase.from("email_logs").insert([{
        hotel_id: hotelId,
        from_email: from,
        subject,
        body,
        ai_answer: aiAnswer,
        created_at: new Date()
      }]);
    } catch (logErr) {
      console.error("Supabase Log Error:", logErr);
    }

    return res.status(200).json({ status: "draft_created", hotel: hotelId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}


