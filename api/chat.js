export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message" });
  }

  // ===== EVENT / HOCHZEIT ERKENNUNG =====
  const eventKeywords = [
    "hochzeit",
    "wedding",
    "event",
    "feier",
    "bankett",
    "tagung",
    "konferenz"
  ];

  const isEvent = eventKeywords.some(k =>
    message.toLowerCase().includes(k)
  );

  if (isEvent) {
    return res.status(200).json({
      answer: `Vielen Dank für Ihre Anfrage 😊  
Für Hochzeiten, Events oder individuelle Feiern bitten wir Sie, direkt per E-Mail Kontakt mit uns aufzunehmen:

📧 hotel.demos1@gmail.com

Unser Team meldet sich persönlich bei Ihnen.`,
      isEvent: true
    });
  }

  // ===== KI VERSUCH =====
  try {
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Du bist ein professioneller KI-Hotelconcierge."
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.2
        })
      }
    );

    const data = await openaiRes.json();

    // ✅ WENN KI ERFOLGREICH
    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({
        answer: data.choices[0].message.content,
        isEvent: false
      });
    }

    // ❌ KI NICHT VERFÜGBAR → FALLBACK
    throw new Error("AI unavailable");

  } catch (error) {
    // ===== FALLBACK WISSEN (OHNE KI) =====
    let fallbackAnswer = "Gerne helfen wir Ihnen weiter 😊";

    if (message.toLowerCase().includes("check")) {
      fallbackAnswer =
        "Der Check-in ist ab 15:00 Uhr möglich, der Check-out bis 11:00 Uhr.";
    } else if (message.toLowerCase().includes("spa")) {
      fallbackAnswer =
        "Unser Wellness- & Spa-Bereich ist täglich von 07:00 bis 19:00 Uhr geöffnet.";
    } else if (message.toLowerCase().includes("restaurant")) {
      fallbackAnswer =
        "Unser Restaurant ist täglich zum Frühstück und Abendessen geöffnet.";
    } else {
      fallbackAnswer =
        `Vielen Dank für Ihre Anfrage 😊  
Gerne helfen wir Ihnen persönlich weiter.

📧 hotel.demos1@gmail.com`;
    }

    return res.status(200).json({
      answer: fallbackAnswer,
      isEvent: false,
      fallback: true
    });
  }
}

