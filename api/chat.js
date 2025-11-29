export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "No message" });
  }

  const text = message.toLowerCase();

  // ===========================
  // HOTEL FAQ / KNOWLEDGE BASE
  // ===========================
  const hotelKnowledge = [
    {
      keywords: ["kontakt", "telefon", "email", "nummer"],
      answer:
        "Sie erreichen uns telefonisch unter +43 5332 77117 oder per E-Mail an hotel.demo@gmail.com."
    },
    {
      keywords: ["adresse", "standort", "anreise", "wo"],
      answer:
        "Unsere Adresse lautet: Panoramastraße 2, 6323 Bad Häring, Tirol, Österreich."
    },
    {
      keywords: ["sterne", "kategorie"],
      answer:
        "Das Hotel Panorama Royal ist ein 4-Sterne-Superior Wellness- & Spa-Hotel."
    },
    {
      keywords: ["check-in", "checkin", "ankunft", "check-out", "checkout", "abreise"],
      answer:
        "Der Check-in ist ab 16:00 Uhr möglich, der Check-out bis 11:00 Uhr."
    },
    {
      keywords: ["rezeption", "empfang"],
      answer:
        "Unsere Rezeption ist täglich von 07:00 bis 21:00 Uhr besetzt."
    },
    {
      keywords: ["frühstück"],
      answer:
        "Das Frühstück servieren wir täglich von 07:00 bis 10:30 Uhr."
    },
    {
      keywords: ["mittag", "lunch"],
      answer:
        "Ein kleines Mittagsangebot ist täglich von 12:00 bis 14:00 Uhr verfügbar."
    },
    {
      keywords: ["abendessen", "dinner", "atelier", "restaurant"],
      answer:
        "Das Gourmetrestaurant Atelier Freund-Schafft ist täglich von 18:30 bis 21:00 Uhr geöffnet. Reservierung empfohlen. Es ist mit 3 Hauben (Gault & Millau) ausgezeichnet."
    },
    {
      keywords: ["spa", "wellness", "sauna", "pool"],
      answer:
        "Unsere „High End Relax Dream World“ umfasst 7.500 m² Wellnessfläche mit 7 Pools, Saunen und Ruhezonen."
    },
    {
      keywords: ["spa zeiten", "spa geöffnet"],
      answer:
        "Der Wellnessbereich ist täglich von 07:00 bis 19:00 Uhr geöffnet. Die Spa-Rezeption ist von 09:30 bis 18:00 Uhr besetzt."
    },
    {
      keywords: ["bar"],
      answer:
        "Unsere Panorama-Bar ist täglich von 14:00 bis 24:00 Uhr geöffnet."
    },
    {
      keywords: ["hund", "hunde", "haustier"],
      answer:
        "Hunde sind in ausgewählten Zimmern erlaubt. Die Gebühr beträgt €25 pro Tag. Hunde sind im Restaurant sowie im Spa- & Wellnessbereich nicht erlaubt."
    },
    {
      keywords: ["zimmer", "suite"],
      answer:
        "Alle Zimmer verfügen über Minibar, Kabel-/Sat-TV, Badezimmer mit Föhn und Bademantel. Suiten mit Balkon oder Terrasse sind verfügbar."
    },
    {
      keywords: ["verloren", "vergessen", "lost"],
      answer:
        "Wenn Sie etwas vergessen oder verloren haben, senden Sie bitte eine E-Mail mit Beschreibung und Aufenthaltsdatum an hotel.demo@gmail.com."
    }
  ];

  // ===========================
  // EVENT / HOCHZEITEN
  // ===========================
  const eventKeywords = ["hochzeit", "event", "feier", "seminar", "tagung"];
  if (eventKeywords.some(k => text.includes(k))) {
    return res.status(200).json({
      answer:
        "Für Veranstaltungen, Seminare oder Hochzeiten kontaktieren Sie uns bitte direkt unter hotel.demo@gmail.com."
    });
  }

  // ===========================
  // FAQ MATCH (OHNE KI)
  // ===========================
  for (const item of hotelKnowledge) {
    if (item.keywords.some(k => text.includes(k))) {
      return res.status(200).json({
        answer: item.answer,
        source: "knowledge_base"
      });
    }
  }

  // ===========================
  // KI FALLBACK
  // ===========================
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
          temperature: 0.3
        })
      }
    );

    const data = await openaiRes.json();
    if (data.choices?.length) {
      return res.status(200).json({
        answer: data.choices[0].message.content,
        source: "ai"
      });
    }

    throw new Error("AI failed");

  } catch (error) {
    return res.status(200).json({
      answer:
        "Gerne helfen wir Ihnen persönlich weiter. Bitte kontaktieren Sie uns direkt unter hotel.demo@gmail.com.",
      source: "email_fallback"
    });
  }
}

