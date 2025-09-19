import { applyManualTags, createNote, normalizeTag, normalizeTags } from "@/lib/notes";

describe("notes tag utilities", () => {
  test("normalizeTag maps aliases", () => {
    expect(normalizeTag("todo")).toBe("ToDo");
    expect(normalizeTag("#memo")).toBe("Memo");
    expect(normalizeTag("Focus")).toBe("Focus");
    expect(normalizeTag(" ")).toBe("");
  });

  test("normalizeTags removes blanks and duplicates", () => {
    expect(normalizeTags(["todo", "memo", "todo", "", "Idea"])).toEqual(["ToDo", "Memo", "Idea"]);
  });

  test("createNote applies normalization", () => {
    const note = createNote({ content: "Test", tags: ["todo", "Focus"] });
    expect(note.tags).toEqual(["ToDo", "Focus"]);
  });

  test("applyManualTags marks note as edited", () => {
    const base = createNote({ content: "Test", tags: ["memo"] });
    const updated = applyManualTags(base, ["todo", "NewTag"]);
    expect(updated.tags).toEqual(["ToDo", "NewTag"]);
    expect(updated.userEditedTags).toBe(true);
    expect(updated.processingStatus).toBe("done");
  });
});
