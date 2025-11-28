export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Du bist ein freundlicher Hotel Concierge.' },
          { role: 'user', content: message }
        ],
        temperature: 0.2
      })
    });

    const data = await openaiRes.json();

    res.status(200).json({
      answer: data.choices[0].message.content,
      isEvent: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


