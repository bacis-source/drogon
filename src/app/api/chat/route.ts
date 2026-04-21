export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const responseText = `(Mock Echo) Understood. You said: "${lastMessage?.content || ""}". I am Drogon, the Master Architect.`;
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Vercel AI SDK standard data stream protocol (text parts start with '0:')
      const words = responseText.split(" ");
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? " " : "");
        controller.enqueue(encoder.encode(`0:${JSON.stringify(word)}\n`));
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
