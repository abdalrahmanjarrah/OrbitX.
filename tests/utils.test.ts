import { describe, it, expect } from "vitest";
import { cn } from "../src/lib/utils";

describe("cn (className merger)", () => {
  it("joins simple classes", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("supports conditional object syntax", () => {
    const on = true;
    expect(cn("base", { active: on, hidden: !on })).toBe("base active");
  });

  it("lets later classes override earlier conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});
