import { get, writable } from "svelte/store";
import { keyed, indexed } from ".";

describe("keyed object test", () => {
  it("subscribes to the correct value", () => {
    const parent = writable({ first: "john", last: "smith" });
    const child = keyed(parent, "first");
    expect(get(child)).toBe("john");
  });

  it("updates when the parent updates", () => {
    const parent = writable({ first: "john", last: "smith" });
    const child = keyed(parent, "first");
    parent.set({
      first: "jane",
      last: "doe",
    });
    expect(get(child)).toBe("jane");
  });

  it("updates parent when child is updated", () => {
    const parent = writable({ first: "john", last: "smith" });
    const child = keyed(parent, "first");
    child.update(($child) => $child.toUpperCase());
    expect(get(parent)).toStrictEqual({ first: "JOHN", last: "smith" });
  });

  it("updates parent when child is set", () => {
    const parent = writable({ first: "john", last: "smith" });
    const child = keyed(parent, "first");
    child.set("jane");
    expect(get(parent)).toStrictEqual({ first: "jane", last: "smith" });
  });
});

describe("indexed array test", () => {
  it("subscribes to the correct value", () => {
    const parent = writable(["one", "two", "three", "four"]);
    const child = indexed(parent, 2);
    expect(get(child)).toBe("three");
  });

  it("updates when the parent updates", () => {
    const parent = writable(["one", "two", "three", "four"]);
    const child = indexed(parent, 2);
    parent.set(["five", "six", "seven", "eight"]);
    expect(get(child)).toBe("seven");
  });

  it("updates parent when child is updated", () => {
    const parent = writable(["one", "two", "three", "four"]);
    const child = indexed(parent, 2);
    child.update(($child) => $child?.toUpperCase());
    expect(get(parent)).toStrictEqual(["one", "two", "THREE", "four"]);
  });

  it("updates parent when child is set", () => {
    const parent = writable(["one", "two", "three", "four"]);
    const child = indexed(parent, 2);
    child.set("five");
    expect(get(parent)).toStrictEqual(["one", "two", "five", "four"]);
  });

  it("returns undefined if index becomes out of bounds", () => {
    const parent = writable(["one", "two", "three", "four"]);
    const child = indexed(parent, 2);
    parent.set(["five", "six"]);
    expect(get(child)).toBeUndefined();
  });
});
