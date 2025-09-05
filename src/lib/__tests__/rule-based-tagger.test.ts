import { RuleBasedTagger } from "@/lib/rule-based-tagger";

describe("RuleBasedTagger", () => {
  const t = new RuleBasedTagger();

  test("extracts basic hashtags and cleans content", () => {
    const { tags, cleanContent } = t.extract("Write code #todo and refactor #idea later");
    expect(tags).toEqual(["ToDo", "Idea"]);
    expect(cleanContent).toBe("Write code and refactor later");
  });

  test("normalizes memo/other", () => {
    const { tags } = t.extract("note #Memo #OTHER #unknown");
    expect(tags).toEqual(["Memo", "Other", "Unknown"]);
  });

  test("handles unicode hashtags", () => {
    const { tags } = t.extract("日本語タグ #メモ #タスク");
    expect(tags).toEqual(["メモ", "タスク"]);
  });
});

