export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { emailText } = req.body;

  if (!emailText) {
    return res.status(400).json({ error: "No email content" });
  }

  // =====================
  // KNOWLEDGE BASE (SHORT)
  // =====================
  const kb = [
    {
      keywords: ["check-in", "ankunft"],
      answer: "Der Check-in ist ab 16:00 Uhr möglich."
    },
    {
      keywords: ["check-out", "abreise"],
      answer: "Der Check-out ist bis 11:00 Uhr vorgesehen."
    },
    {
      keywords: ["hund", "haustier"],
      answer:
        "Hunde sind in ausgewählten Zimmern erlaubt. Aufpreis €25 pro Tag. Kein Zugang zum Spa oder Restaurant."
    },
    {
      keywords: ["spa", "wellness"],
      answer:
        "Unser Wellnessbereich ist täglich von 07:00 bis 19:00 Uhr geöffnet."
    }
  ];

  const text = emailText.toLowerCase();

  // =====================
  // EVENT ERKENNUNG
  // =====================
  const eventWords = [
    "hochzeit",
    "event",
    "weihnachtsfeier",
    "silvester",
    "galadinner",
    "seminar"
  ];

  if (eventWords.some(w => text.includes(w))) {
    return res.status(200).json({
      subject: "Ihre Anfrage – Demohotel",
      draft:
        "Vielen Dank für Ihre Anfrage.\n\nGerne erstellen wir für Sie ein individuelles Angebot. Ihre Anfrage wird persönlich von unserem Rezeptionsteam geprüft.\n\nHerzliche Grüße\nDemohotel Rezeption",
      aiUsed: false
    });
  }

  // =====================
  // KB MATCH
  // =====================
  for (const item of kb) {
    if (item.keywords.some(k => text.includes(k))) {
      return res.status(200).json({
        subject: "Ihre Anfrage – Demohotel",
        draft:
          "Vielen Dank für Ihre Nachricht.\n\n" +
          item.answer +
          "\n\nHerzliche Grüße\nDemohotel Rezeption",
        aiUsed: false
      });
    }
  }

  // =====================
  // KI FALLBACK (NIE SENDEN)
  // =====================
  try {
    const openaiRes = await fetch(
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
                "Du schreibst eine professionelle, höfliche Hotel-E-Mail. Kein Versenden."
            },
            {
              role: "user",
              content: emailText
            }
          ],
          temperature: 0.2
        })
      }
    );

    const data = await openaiRes.json();

    return res.status(200).json({
      subject: "Ihre Anfrage – Demohotel",
      draft: data.choices[0].message.content,
      aiUsed: true
    });

  } catch (e) {
    return res.status(200).json({
      subject: "Ihre Anfrage – Demohotel",
      draft:
        "Vielen Dank für Ihre Anfrage.\n\nUnser Rezeptionsteam meldet sich zeitnah bei Ihnen.\n\nHerzliche Grüße\nDemohotel Rezeption",
      aiUsed: false
    });
  }
}

