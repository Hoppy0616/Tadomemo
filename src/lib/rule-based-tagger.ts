export type RuleTag = "ToDo" | "Idea" | "Memo" | "Other";

export interface TaggerResult {
  tags: string[]; // normalized human tags
  cleanContent: string;
}

/**
 * B2: Rule-based tagger that extracts hashtags and returns clean content.
 * - Recognizes #todo, #idea, #memo, #other (case-insensitive)
 * - Keeps additional hashtags as plain tags (without '#')
 */
export class RuleBasedTagger {
  private static HASHTAG = /(^|\s)#([\p{L}\p{N}_-]{1,50})/giu;

  static normalize(tag: string): string {
    const t = tag.trim().toLowerCase();
    if (t === "todo") return "ToDo";
    if (t === "idea") return "Idea";
    if (t === "memo") return "Memo";
    if (t === "other") return "Other";
    // Fallback: capitalize first letter
    return t.replace(/^./, (c) => c.toUpperCase());
  }

  extract(input: string): TaggerResult {
    const tags: string[] = [];
    let clean = input;
    // Collect hashtags
    const found: string[] = [];
    for (const m of input.matchAll(RuleBasedTagger.HASHTAG)) {
      const raw = m[2];
      if (raw) found.push(raw);
    }
    // Normalize and uniq
    const normalized = Array.from(new Set(found.map(RuleBasedTagger.normalize)));
    tags.push(...normalized);
    // Remove hashtags from content (replace with single space)
    clean = clean.replace(RuleBasedTagger.HASHTAG, (full, p1) => (p1 ? p1 : " ")).replace(/\s{2,}/g, " ").trim();
    return { tags, cleanContent: clean };
  }
}

