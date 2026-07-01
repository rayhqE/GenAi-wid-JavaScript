import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: "",
});

client.chat.completions
  .create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: "Hello,How are you" }],
  })
  .then((response) => {
    console.log(response.choices[0].message.content);
  });
