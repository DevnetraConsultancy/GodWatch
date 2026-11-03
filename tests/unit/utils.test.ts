import { describe, expect, it } from "vitest";
import { cn, initials, pluralize } from "@/lib/utils";

describe("utils", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });

  it("pluralizes", () => {
    expect(pluralize(1, "day")).toBe("1 day");
    expect(pluralize(2, "day")).toBe("2 days");
  });

  it("builds initials", () => {
    expect(initials("Ada Lovelace King")).toBe("AL");
    expect(initials("  ")).toBe("?");
  });
});
