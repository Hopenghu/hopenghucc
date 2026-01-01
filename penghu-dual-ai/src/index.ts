
import { OpenAI } from "openai";
import { GPT_SYSTEM_PROMPT, GEMINI_SYSTEM_PROMPT } from "./prompts";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/ask") {
      const body = await req.json();
      const { question, mode } = body;

      let modelUsed = "";
      let answer = "";

      if (mode === "traveler") {
        const gemRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + env.GEMINI_API_KEY, {
          method:"POST",
          headers:{ "Content-Type":"application/json"},
          body: JSON.stringify({
            system_instruction: { parts:[{text: GEMINI_SYSTEM_PROMPT}]},
            contents:[{ parts:[{text: question}]}]
          })
        });
        const data = await gemRes.json();
        answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
        modelUsed = "gemini";
      } else {
        const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

        const gptRes = await client.chat.completions.create({
          model: "gpt-4.1",
          messages:[
            {role:"system", content: GPT_SYSTEM_PROMPT},
            {role:"user", content: question}
          ]
        });

        answer = gptRes.choices[0].message.content;
        modelUsed = "gpt";
      }

      await env.DB.prepare(
        "INSERT INTO messages (question, answer, model_used) VALUES (?, ?, ?)"
      ).bind(question, answer, modelUsed).run();

      return new Response(JSON.stringify({ answer, modelUsed }), {headers:{"Content-Type":"application/json"}});
    }

    return new Response("Penghu Dual AI Workers");
  }
}
