import WebSocket from "ws";

async function testWsEndToEnd() {
  console.log("Connecting to local ws://localhost:3000/live-ws ...");
  const ws = new WebSocket("ws://localhost:3000/live-ws");

  ws.on("open", () => {
    console.log("WebSocket open!");
    // Send start
    ws.send(JSON.stringify({
      type: "start",
      voice: "Zephyr",
      systemInstruction: "You are JARVIS. When greeted with salam, reply 'Wa Alaikum As-Salam. How can I assist you?'."
    }));

    setTimeout(() => {
      console.log("Sending text: 'Salam Alaikum Jarvis'...");
      ws.send(JSON.stringify({
        type: "text",
        text: "Salam Alaikum Jarvis"
      }));
    }, 1000);
  });

  let receivedAudioChunks = 0;
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "status") {
      console.log("Status:", msg.status, msg.message);
    } else if (msg.type === "assistant_text") {
      console.log("💬 Assistant text:", msg.text);
    } else if (msg.type === "audio") {
      receivedAudioChunks++;
      console.log(`🔊 Audio chunk received #${receivedAudioChunks} (length ${msg.audio.length})`);
    } else if (msg.type === "turn_complete") {
      console.log("🎉 Turn complete! Audio stream worked 100%!");
      setTimeout(() => {
        ws.close();
        process.exit(0);
      }, 500);
    }
  });

  ws.on("error", (err) => console.error("WS error:", err));
}

testWsEndToEnd();
