export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  // Hier kommt später KI + Hotelwissen rein
  return res.json({
    answer: "Der AI Concierge ist bereit ✅",
    isEvent: false
  });
}
