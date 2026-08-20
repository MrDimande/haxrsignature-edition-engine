import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { replaceCompletedChallenges } from "../../engines/true-theme/profiles/jessica-samuel-wedding/memories/plus-memorias-challenges";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

describe("Plus Memories local progress reconciliation", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: globalThis,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });
  });

  afterEach(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }

    if (originalLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
  });

  it("removes stale local challenges when the server returns an empty snapshot", () => {
    storage.setItem("haxr_memories_jessicasamuelwedding", JSON.stringify(["01", "02"]));

    const reconciled = replaceCompletedChallenges("jessicasamuelwedding", []);

    assert.deepEqual(reconciled, []);
    assert.equal(storage.getItem("haxr_memories_jessicasamuelwedding"), "[]");
  });

  it("deduplicates and rejects challenge IDs outside the official list", () => {
    const reconciled = replaceCompletedChallenges("jessicasamuelwedding", [
      "02",
      "02",
      "13",
      null,
    ]);

    assert.deepEqual(reconciled, ["02"]);
    assert.equal(storage.getItem("haxr_memories_jessicasamuelwedding"), '["02"]');
  });

  it("does not alter progress stored for another invitation", () => {
    storage.setItem("haxr_memories_other-event", '["05"]');

    replaceCompletedChallenges("jessicasamuelwedding", []);

    assert.equal(storage.getItem("haxr_memories_other-event"), '["05"]');
  });
});
