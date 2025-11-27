export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  res.json({
    answer: `Danke für deine Anfrage! 😊  
Diese Funktion ist aktiv. Deine Nachricht war: "${message}"`,
    isEvent: false
  });
}
