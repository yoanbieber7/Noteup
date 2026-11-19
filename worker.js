
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors,
      });
    }

    if (url.pathname === "/") {
      return json({
        name: "NoteUp AI",
        status: "online",
        configured: Boolean(env.AI),
      });
    }

    if (url.pathname !== "/api/chat") {
      return json({ error: "Page introuvable." }, 404);
    }

    if (request.method !== "POST") {
      return json({ error: "Méthode non autorisée." }, 405);
    }

    if (!env.AI) {
      return json({ error: "Liaison AI manquante." }, 500);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return json({ error: "Message invalide." }, 400);
    }

    const message = typeof body.message === "string"
      ? body.message.trim()
      : "";

    if (!message) {
      return json({ error: "Écris une question." }, 400);
    }

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          {
            role: "system",
            content: `Tu es NoteUp, un coach scolaire français.
Tu aides les élèves à progresser dans leurs études.
Explique les leçons simplement, crée des exercices,
corrige les erreurs et prépare les contrôles.
Adapte ton vocabulaire au niveau de l'élève.
Réponds toujours en français, avec patience et bienveillance.
Explique les méthodes étape par étape.`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 900
      });

      return json({
        success: true,
        answer: result.response,
        model: MODEL
      });

    } catch (error) {
      return json({
        error: "Erreur pendant la génération IA.",
        details: String(error)
      }, 502);
    }
  }
};
