const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
        content: "Du bist ein professioneller 24/7 Hotel-Concierge für ein Luxushotel."
      },
      {
        role: "user",
        content: message
      }
    ],
    temperature: 0.2
  })
});

const data = await response.json();
const answer = data.choices[0].message.content;

