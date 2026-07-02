import "dotenv/config";
import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const command = process.argv[2];
async function main() {
  const result = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: command }],
  });
  console.log(`Ans from OpenAI API: `, result.choices[0].message.content);
}

main();
