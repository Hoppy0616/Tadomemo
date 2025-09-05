// B4: Gemini API integration (client-friendly wrapper)

export interface GeminiTaggingResult {
  tags: string[];
  confidence?: number;
}

export class GeminiTaggingService {
  private apiKey: string | undefined;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    this.apiKey = opts?.apiKey ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    this.model = opts?.model ?? "gemini-1.5-flash";
  }

  async tag(content: string, timeoutMs = 3000): Promise<GeminiTaggingResult> {
    if (!this.apiKey) throw new Error("Gemini API key not configured");
    const prompt = this.buildPrompt(content);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
      const data: any = await res.json();
      return this.parseResponse(data);
    } catch (e: any) {
      if (e?.name === "AbortError") throw new Error("Gemini request timed out");
      throw e;
    } finally {
      clearTimeout(to);
    }
  }

  private buildPrompt(content: string): string {
    return `You are a tagger. Classify the note into tags and one main category.
Return JSON strictly in this shape: {"tags": ["..."], "confidence": 0.0}
Rules:
- Prefer tags among: ToDo, Idea, Memo, Other.
- You may add extra tags if highly relevant.
Input: ${content}`;
  }

  private parseResponse(json: any): GeminiTaggingResult {
    try {
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const m = text.match(/\{[\s\S]*\}/);
      const data = m ? JSON.parse(m[0]) : JSON.parse(text);
      const tags: string[] = Array.isArray(data.tags) ? data.tags.map(String) : [];
      const confidence = typeof data.confidence === "number" ? data.confidence : undefined;
      return { tags, confidence };
    } catch {
      // Fallback: best-effort basic heuristic
      const lc = String(json).toLowerCase();
      const tags: string[] = [];
      if (lc.includes("todo")) tags.push("ToDo");
      if (lc.includes("idea")) tags.push("Idea");
      if (tags.length === 0) tags.push("Memo");
      return { tags, confidence: undefined };
    }
  }
}

