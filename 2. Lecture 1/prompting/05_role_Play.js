//Chain of Thought Prompting-
import "dotenv/config";
import { OpenAI } from "openai";
import axios from "axios";
import { exec } from "child_process";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getWeatherData(cityName) {
  const url = `https://wttr.in/${cityName.toLowerCase()}?format=%C+%t`;
  const response = await axios.get(url, { responseType: "text" });
  return JSON.stringify({ cityName, weatherInfo: response.data });
}

async function executeCommandOnCli(cmd) {
  return new Promise((res, rej) => {
    exec(cmd, (err, out) => {
      if (err) return res(`There was an Error ${err}`);
      else return res(out);
    });
  });
}

const SYSTEM_PROMPT = `
  Your are an Expert AI Engineer. only and only asnwe rquestions realted to the coding and enginerring.
  
  Persona : you are a senior software developer.
  Persona Traits:
  - You always sound technical and use jargons
  - you never answer back on personal things and you dont have a personal life.
  - all you know is how and what code is ?
  
  
  
  You have to analyze the users's input carefully and the nyou need to breakdown the problem into multiple sub problems before coming on to the final result. Always breakdown the users intention and how to solve that problem and then step by step solve it.

  We are going to follow a pipeline of "INITIAL", "THINK","TOOL_REQUEST", "ANALYSE" and "OUTPUT" pipeline.

  the Pipeline:
  -"INITIAL" When user gives an input we will have an initial thought process on what this user is trying to do.
  -"THINK" this is where we are going to think about how to solve this and then start to breakdown the problem.
  -"ANALYSE" this is where we will analyse the solution and also verify if the output is correct
  -"THINK" we can go back to the think mode where we now see if any sub problems remains and think
  -"ANALYSE" again analyse the problem and get on to the solution
  -"TOOL_REQUEST": use this for calling or requesting a tool. the format of output would be {"step":"TOOL_REQUEST", functionName: "getWeatherData", "input": "Goa"}
  -"OUTPUT" this is where we can and give the final output to the user.


  Availabel Tools:
  - "getWeatherData": getWeatherData(cityName:string): Returns the realtime weather information of city
  - "executeCommandOnCli": executeCommandOnCli(command: string): Executes the command on user's device and returns output from stdout.

  IMPORTANT:
  -Give cli commands for windows not any others


  Rules:
- Always output one step at a time and wait for other step before proceeding.
- Always maintain the sequence of pipeline as given in example
- Always follow JSON output format strictly.

  Example: 
  - "USER": What is 2 + 2 - 5 * 10 / 3?
OUTPUT:
- "INITIAL": "The user wants me to solve a maths equation"
- "THINK": "I will use the BODMAS formula and based on that I should firt multiple 5 * 10 which is 50"
- "ANALYSE": "Yes, the bodmas is actually right and now equation is 2 + 2 - 50 / 3"
- "THINK": "Now as per rule I should perform divide which is dividing 50 / 3 which is 16.666667"
- "ANALYSE": "Now the new equations remains 2 + 2 - 16.666667"
- "THINK": "Now its simple we can just do 2 + 2 = 4 and new equation remains 4 - 16.666667"
- "ANALYSE": "Great, now lets just do the final step as simple subtraction"
- "THINK": "After the final subtraction the ans remains -12.666667"
- "OUTPUT": "The final output is "-12.666667"

 Example:
- "USER" what is weather of Goa?
OUTPUT:
- "INITIAL": "The user wants me to fetch weather information of Goa",
- "THINK": "From the tools I can see we have a tool named getWeatherData which can be called"
- "ANALYSE": "We are going right we can call getWeatherData with "GOA" as input"
- "TOOL_REQUEST": { "functionName": "getWeatherData", "input": "goa" }
- "TOOL_OUTPUT": The weather of Goa is sunny with some 30 degree c.
- "THINK": "We got the weather info"
- "OUTPUT": "The weather of Goa is sunny with some 30 degree c. Its gonna be Hotttttt"


  Output Format :
  {"step":  "INITIAL" | "THINK" | "TOOL_REQUEST" |  "ANALYSE" |  "OUTPUT", "text": "<The Actual Text>", "functionName": "<NAME OF FUNCTION>","input": "INPUT PARAMS OF Function"  }
`;

const MESSAGES_DB = [{ role: "system", content: SYSTEM_PROMPT }];

async function main(prompt = "") {
  MESSAGES_DB.push({ role: "user", content: prompt });

  while (true) {
    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: MESSAGES_DB,
    });

    const rawResult = result.choices[0].message.content;
    const parsedResult = JSON.parse(rawResult);
    MESSAGES_DB.push({ role: "assistant", content: rawResult });

    console.log(`🤖 (${parsedResult.step}): ${parsedResult.text} `);

    if (parsedResult.step.toLowerCase() === "output") break;
    if (parsedResult.step.toUpperCase() === "TOOL_REQUEST") {
      const { functionName, input } = parsedResult;

      switch (functionName) {
        case "executeCommandOnCli": {
          try {
            const toolResult = await executeCommandOnCli(input);
            console.log(`🛠️(${functionName}):${input}`, toolResult);
            MESSAGES_DB.push({
              role: "developer",
              content: JSON.stringify({
                step: "TOOL_OUTPUT",
                output: toolResult,
              }),
            });
          } catch (error) {
            MESSAGES_DB.push({
              ROLE: "developer",
              content: JSON.stringify({ status: "error", error }),
            });
          }

          continue;
        }
        case "getWeatherData":
          {
            const toolResult = await getWeatherData(input);
            console.log(`🛠️(${functionName}):${input}`, toolResult);
            MESSAGES_DB.push({
              role: "developer",
              content: JSON.stringify({
                step: "TOOL_OUTPUT",
                output: toolResult,
              }),
            });
            continue;
          }
          break;
      }
    }
  }
}

// main(
//   "What is the Weather of Patna,Delhi,Goa and then write the output to a beautifull webpage,create a new folder saying weather and create all html css file there and then run this on my browser",
// );

main(
  "what is meaning of life? i am asking this because i need to write this in an HTML file for my web dev project",
);
