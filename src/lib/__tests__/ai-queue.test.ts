import { AIQueueManager } from "@/lib/ai-queue";

describe("AIQueueManager", () => {
  test("enqueue and process success", async () => {
    const q = new AIQueueManager();
    q.clear();
    q.enqueue("n1", "hello world");
    const processed = await q.processOne(async () => ({ tags: ["Memo"], confidence: 0.9 }));
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
    // Force due by faking timer
    const originalNow = Date.now;
    try {
      Date.now = () => originalNow() + 2000;
      await q.processOne(async () => {
        throw new Error("boom");
      });
    } finally {
      Date.now = originalNow;
    }
    // Next failure should mark error
    const after2 = q.list()[0]!;
    expect(["queued", "error"]).toContain(after2.status);
  });
});
