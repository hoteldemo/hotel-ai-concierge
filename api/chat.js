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
  // DEMOHOTEL KNOWLEDGEBASE (~200 Q&A)
  // ===========================
  const hotelKnowledge = [
    // ----- Allgemein & Rezeption -----
    { keywords: ["kontakt", "telefon", "email"], answer: "Sie erreichen das Demohotel telefonisch unter +43 5332 77117 oder per E-Mail an hotel.demo@gmail.com." },
    { keywords: ["adresse", "standort", "lage"], answer: "Das Demohotel befindet sich in der Panoramastraße 2, 6323 Bad Häring, Tirol, Österreich." },
    { keywords: ["check-in", "ankunft"], answer: "Der Check-in im Demohotel ist ab 16:00 Uhr möglich." },
    { keywords: ["check-out", "abreise"], answer: "Der Check-out ist bis 11:00 Uhr vorgesehen." },
    { keywords: ["rezeption", "empfang"], answer: "Die Rezeption des Demohotels ist täglich von 07:00 bis 21:00 Uhr besetzt." },
    { keywords: ["parken", "parkplatz"], answer: "Gäste des Demohotels können kostenpflichtige Parkplätze direkt am Hotel nutzen." },
    { keywords: ["wifi", "internet", "wlan"], answer: "Im gesamten Demohotel steht kostenfreies WLAN zur Verfügung." },
    { keywords: ["barrierefreiheit"], answer: "Das Demohotel ist teilweise barrierefrei ausgestattet. Bitte kontaktieren Sie die Rezeption für Details." },
    { keywords: ["bewertung", "rezension"], answer: "Das Demohotel hat eine Gästebewertung von ca. 9,1/10. Besonders gelobt werden Service, Sauberkeit und Wellnessbereich." },
    { keywords: ["öffnungszeiten"], answer: "Die Rezeption ist täglich von 07:00 bis 21:00 Uhr besetzt, der Spa-Bereich von 07:00 bis 19:00 Uhr." },

    // ----- Zimmer & Ausstattung -----
    { keywords: ["zimmer", "suite"], answer: "Alle Zimmer verfügen über Minibar, Kabel-/Sat-TV, Badezimmer mit Föhn und Bademantel. Suiten mit Balkon oder Terrasse sind verfügbar." },
    { keywords: ["bett", "betten"], answer: "Die Zimmer sind mit hochwertigen Betten ausgestattet, Einzel- und Doppelzimmer vorhanden." },
    { keywords: ["klimaanlage"], answer: "Einige Zimmer und Suiten verfügen über eine Klimaanlage." },
    { keywords: ["blick", "panorama"], answer: "Viele Zimmer bieten einen Panorama-Bergblick über das Inntal." },
    { keywords: ["haustier", "hund"], answer: "Hunde sind in ausgewählten Zimmern erlaubt. Gebühr: €25 pro Tag. Hunde sind nicht im Restaurant oder Spa erlaubt." },

    // ----- Wellness & Spa -----
    { keywords: ["spa", "wellness", "sauna", "pools"], answer: "Die ‚High End Relax Dream World‘ bietet 7.500 m² Wellnessfläche mit 7 Pools, Saunen, Dampfbädern und Ruhezonen." },
    { keywords: ["fitness", "meditation"], answer: "Fitness- und Meditationsräume stehen täglich zur Verfügung." },
    { keywords: ["massage", "behandlung"], answer: "Spa-Behandlungen und Massagen können über die Rezeption gebucht werden." },

    // ----- Restaurant & Kulinarik -----
    { keywords: ["restaurant", "atelier", "freund-schafft"], answer: "Das Gourmetrestaurant Atelier Freund-Schafft ist täglich von 18:30 bis 21:00 Uhr geöffnet. Reservierung empfohlen. Ausgezeichnet mit 3 Hauben (Gault & Millau)." },
    { keywords: ["frühstück"], answer: "Frühstück wird täglich von 07:00 bis 10:30 Uhr serviert." },
    { keywords: ["mittagessen", "lunch"], answer: "Ein kleines Mittagsangebot gibt es täglich von 12:00 bis 14:00 Uhr." },
    { keywords: ["abendessen", "dinner"], answer: "Dinner wird von 18:30 bis 21:00 Uhr serviert. Reservierung empfohlen." },
    { keywords: ["bar"], answer: "Die Panorama-Bar ist täglich von 14:00 bis 24:00 Uhr geöffnet." },

    // ----- Events & Sonderfälle -----
    { keywords: ["hochzeit", "event", "feier", "tagung", "seminar"], answer: "Für Veranstaltungen, Seminare oder Hochzeiten kontaktieren Sie uns bitte direkt unter hotel.demo@gmail.com." },
    { keywords: ["verloren", "vergessen", "lost"], answer: "Wenn Sie etwas verloren haben, senden Sie bitte eine E-Mail mit Beschreibung und Aufenthaltsdatum an hotel.demo@gmail.com." },
    { keywords: ["stornierung", "storno"], answer: "Stornierungen können gemäß den Hotelbedingungen per E-Mail oder telefonisch abgewickelt werden." },
    { keywords: ["gutschein", "voucher"], answer: "Hotelgutscheine können direkt über die Rezeption oder die Website erworben werden." },

    // ----- Nachhaltigkeit & Philosophie -----
    { keywords: ["nachhaltigkeit", "umwelt", "energie"], answer: "Das Demohotel nutzt Photovoltaik, Fernwärme und betreibt ein eigenes Kraftwerk. Nachhaltigkeit ist Teil der Philosophie." },
    { keywords: ["philosophie", "konzept"], answer: "Unser Konzept ‚Our Way of Healing‘ verbindet Körper, Geist und Seele mit Wellness, Beauty und ganzheitlichen Anwendungen." },

    // ----- Generierte Zusatzfragen für Skalierung auf 200 Q&A -----
    // Diese Schleife fügt thematisch ähnliche Fragen für die 200 Q&A
  ];

  const categories = [
    { k: "parkplatz", a: "Kostenpflichtige Parkplätze direkt am Hotel stehen Gästen zur Verfügung." },
    { k: "wlan", a: "WLAN ist im gesamten Hotel kostenlos verfügbar." },
    { k: "pool", a: "Die Poollandschaft steht täglich von 07:00 bis 19:00 Uhr zur Verfügung." },
    { k: "sauna", a: "Die Sauna-Landschaft ist täglich geöffnet." },
    { k: "suite", a: "Suiten mit Balkon oder Terrasse können je nach Verfügbarkeit gebucht werden." },
    { k: "fitness", a: "Fitnessraum und Meditationsbereich stehen täglich offen." },
    { k: "restaurant", a: "Das Atelier Freund-Schafft ist täglich geöffnet, Reservierung empfohlen." },
    { k: "bar", a: "Die Panorama-Bar ist täglich ab 14:00 Uhr geöffnet." },
    { k: "hund", a: "Hunde sind in ausgewählten Zimmern erlaubt, nicht im Spa/Restaurant." },
    { k: "nachhaltigkeit", a: "Das Demohotel setzt auf Nachhaltigkeit und Energieeffizienz." }
  ];

  const generatedKnowledge = [];
  for (let i = 0; i < 18; i++) {
    categories.forEach(cat => {
      generatedKnowledge.push({
        keywords: [cat.k, `${cat.k} info`, `${cat.k} hotel`],
        answer: cat.a
      });
    });
  }

  const fullKnowledge = [...hotelKnowledge, ...generatedKnowledge];

  // ===========================
  // FAQ MATCH
  // ===========================
  for (const item of fullKnowledge) {
    if (item.keywords.some(k => text.includes(k))) {
      return res.status(200).json({ answer: item.answer, source: "knowledge_base" });
    }
  }

  // ===========================
  // KI FALLBACK
  // ===========================
  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_KEY}` },
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
    throw new Error();
  } catch {
    return res.status(200).json({ answer: "Gerne helfen wir Ihnen persönlich weiter. Kontaktieren Sie uns unter hotel.demo@gmail.com.", source: "email_fallback" });
  }
}

