require('dotenv').config();
const { generateDigitalOceanChatStream } = require('./services/digitalOceanService');

async function test() {
  try {
    const stream = await generateDigitalOceanChatStream("Say 'Hello PNU!' if you can hear me.");
    const reader = stream.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullResponse = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const data = JSON.parse(line.slice(6));
            const textChunk = data.choices[0]?.delta?.content || "";
            if (textChunk) {
              fullResponse += textChunk;
              process.stdout.write(textChunk);
            }
          } catch (e) {
            // Ignore incomplete JSON chunks, common in SSE
          }
        }
      }
    }
    console.log("\n\nTest complete!");
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

test();
