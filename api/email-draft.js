
// /api/email-handler.js
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { from, to, subject, body } = req.body;
  if (!from || !to || !subject || !body)
    return res.status(400).json({ error: "Missing parameters" });

  // ---------------------------
  // Hotel erkennen anhand der "to"-Adresse
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
  // Draft-Mail erstellen (Provider-unabhängig)
  // ---------------------------
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,      // z.B. smtp.office365.com
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,                    // STARTTLS
    auth: {
      user: process.env.SMTP_USER,    // Hotel-Mail
      pass: process.env.SMTP_PASS     // Passwort / App-Passwort
    }
  });

  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Draft landet im Hotel-Postfach
      subject: `[SOFIA | ENTWURF] Antwort zu: ${subject}`,
      text: `Hallo Rezeption,\n\nHier ist der Antwortvorschlag für die Anfrage von ${from}:\n\n${aiAnswer}\n\n---\nOriginalmail:\n${body}`
    };

    // Draft erzeugen: bei SMTP gibt es nicht direkt Draft-Funktion,
    // einige Provider wie Office365/Graph API können Drafts erstellen.
    // Für universelle Lösung: wir senden an das Hotel-Postfach als Entwurf-Postfach (sofern Provider unterstützt)
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ status: "draft_created", hotel: hotelId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
