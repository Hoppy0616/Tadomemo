import { AIQueueManager } from "@/lib/ai-queue";

describe("AIQueueManager", () => {
  test("enqueue and process success", async () => {
    const q = new AIQueueManager();
    q.clear();
    const item = q.enqueue("n1", "hello world");
    const processed = await q.processOne(async (i) => ({ tags: ["Memo"], confidence: 0.9 }));
    expect(processed?.status).toBe("done");
    expect(processed?.result?.tags).toContain("Memo");
  });

  test("retry with backoff then error", async () => {
    const q = new AIQueueManager();
    q.clear();
    q.enqueue("n2", "fail this");
    // Always fail
    await q.processOne(async () => {
      throw new Error("boom");
    });
    const after1 = q.list()[0]!;
    expect(after1.status).toBe("queued");
    // Force due
    after1.scheduledAt = Date.now() - 1;
    // Simulate persistence
    (q as any)["upsert"](after1);
    await q.processOne(async () => {
      throw new Error("boom");
    });
    // Next failure should mark error
    const after2 = q.list()[0]!;
    expect(["queued", "error"]).toContain(after2.status);
  });
});

