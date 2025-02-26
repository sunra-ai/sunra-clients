import { getUserAgent, isBrowser } from "./runtime";
import { describe, expect, test } from 'vitest'

describe("the runtime test suite", () => {
  test("should return false when calling isBrowser() on a test", () => {
    expect(isBrowser()).toBe(false);
  });

  test("should return true when calling isBrowser() and window is present", () => {
    global.window = {
      document: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    expect(isBrowser()).toBe(true);
  });

  test("should create the correct user agent identifier", () => {
    expect(getUserAgent()).toMatch(/@sunra\/client/);
  });
});
