export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  // simple Logik (Teststufe)
  let answer = "Danke für deine Anfrage! 😊";

  if (message.toLowerCase().includes("check")) {
    answer = "Der Check-in ist ab 15:00 Uhr möglich. Früher je nach Verfügbarkeit.";
  }

  if (message.toLowerCase().includes("spa")) {
    answer = "Unser Spa ist täglich von 07:00 bis 21:00 Uhr geöffnet.";
  }

  res.status(200).json({
    answer,
    isEvent: false
  });
}
